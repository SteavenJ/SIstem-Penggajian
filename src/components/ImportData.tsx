import React, { useState, useMemo } from 'react';
import { read, utils, WorkBook } from 'xlsx';
import { UploadCloud, CheckCircle2, AlertTriangle, ArrowRight, FileSpreadsheet } from 'lucide-react';
import { AttendanceRecord } from '../types';
import { getExcludedNames } from '../lib/employee-config';
import { resolveDate as resolveDateUtil } from '../lib/date-resolver';

interface ImportDataProps {
  onImport: (records: AttendanceRecord[]) => void;
}

export function ImportData({ onImport }: ImportDataProps) {
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<AttendanceRecord[]>([]);

  const groupedPreview = useMemo(() => {
    const map = new Map<string, { employeeName: string, daysSession: number, totalHours: number }>();
    preview.forEach(p => {
      const existing = map.get(p.employeeName) || { employeeName: p.employeeName, daysSession: 0, totalHours: 0 };
      existing.daysSession++;
      existing.totalHours += p.totalHours;
      map.set(p.employeeName, existing);
    });
    return Array.from(map.values());
  }, [preview]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError(null);

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const wb = read(arrayBuffer, { type: 'array' });
      setWorkbook(wb);
      setSheetNames(wb.SheetNames);
      
      // Auto-select "Lap. Log Absen" or first sheet
      const targetSheet = wb.SheetNames.find(s => s.includes('Log Absen') || s.includes('Detail Absensi')) || wb.SheetNames[0];
      setSelectedSheet(targetSheet);
      parseSheet(wb, targetSheet);
    } catch (err: any) {
      setError('Failed to load workbook. Ensure it is a valid Excel file.');
      setFile(null);
    }
  };

  const handleSheetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sheet = e.target.value;
    setSelectedSheet(sheet);
    if (workbook) {
      parseSheet(workbook, sheet);
    }
  };

  const parseSheet = (wb: WorkBook, sheetName: string) => {
    try {
      const worksheet = wb.Sheets[sheetName];
      const wsData = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      let records: AttendanceRecord[] = [];

      // 1. Try to parse "Lap. Detail Absensi" cross-tab format
      let daysRowIndex = -1;
      let daysRow: any[] = [];
      
      for (let r = 0; r < Math.min(20, wsData.length); r++) {
        const row = wsData[r];
        if (!row) continue;
        
        let numCount = 0;
        for (let c = 0; c < row.length; c++) {
          const val = row[c];
          if (typeof val === 'number' && val >= 1 && val <= 31) numCount++;
          else if (typeof val === 'string' && !isNaN(parseInt(val, 10)) && parseInt(val, 10) >= 1 && parseInt(val, 10) <= 31) numCount++;
        }
        
        if (numCount >= 15) { // Likely the days row (1..31)
          daysRowIndex = r;
          daysRow = row;
          break;
        }
      }

      if (daysRowIndex >= 0) {
        // Find Date Range for resolving month
        let startDate: Date | null = null;
        let endDate: Date | null = null;
        for (let r = 0; r <= daysRowIndex; r++) {
          const rowStr = (wsData[r] || []).join(' ');
          const match = rowStr.match(/(20\d{2}-\d{2}-\d{2})\s*~\s*(20\d{2}-\d{2}-\d{2})/);
          if (match) {
            startDate = new Date(match[1]);
            endDate = new Date(match[2]);
            break;
          }
        }

        const resolveDate = (dayVal: any) => {
          const day = parseInt(dayVal, 10);
          if (isNaN(day)) return null;
          return resolveDateUtil(day, startDate, endDate);
        };

        let currentEmployeeName = "";
        
        for(let r = daysRowIndex + 1; r < wsData.length; r++) {
          const row = wsData[r];
          if (!row || !row.length) continue;
          
          const firstCell = String(row[0] || "").trim().toUpperCase();
          if (firstCell === "ID:") {
            currentEmployeeName = "Unknown Employee";
            for(let c = 0; c < row.length; c++) {
              if (String(row[c]).trim().toUpperCase() === "NAMA:") {
                let nameC = c + 1;
                while(nameC < row.length && !row[nameC]) nameC++;
                if (nameC < row.length) {
                  currentEmployeeName = String(row[nameC]).trim();
                }
                break;
              }
            }
          } else if (currentEmployeeName) {
            let processedTimes = false;
            for(let c = 0; c < row.length; c++) {
              const cellValue = String(row[c] || "").trim();
              if (/\d{2}:\d{2}/.test(cellValue)) {
                processedTimes = true;
                const dayVal = daysRow[c];
                if (dayVal) {
                  const exactDate = resolveDate(dayVal);
                  if (exactDate) {
                    const times = cellValue.match(/\d{2}:\d{2}/g);
                    if (times && times.length > 0) {
                      const checkIn = times[0];
                      const checkOut = times.length > 1 ? times[times.length - 1] : times[0];
                      let hours = 0;
                      if (times.length > 1) {
                        const [inH, inM] = checkIn.split(':').map(Number);
                        const [outH, outM] = checkOut.split(':').map(Number);
                        hours = (outH + outM/60) - (inH + inM/60);
                        if (hours < 0) hours += 24;
                      }
                      records.push({
                        id: `att-${r}-${c}`,
                        employeeName: currentEmployeeName,
                        date: exactDate,
                        checkIn,
                        checkOut,
                        totalHours: Math.max(0, hours)
                      });
                    }
                  }
                }
              }
            }
            if (processedTimes) {
               currentEmployeeName = ""; // reset for next employee block
            }
          }
        }
      }

      // 2. Fallback to generic columnar format if cross-tab parsing yielded no records
      if (records.length === 0) {
        const jsonData = utils.sheet_to_json(worksheet, { defval: '' }) as any[];
        records = jsonData.map((row, index) => {
          const keys = Object.keys(row);
          const findKey = (search: string[]) => keys.find(k => search.some(s => k.toLowerCase().includes(s)));

          const nameKey = findKey(['name', 'staff', 'employee', 'nama']);
          const dateKey = findKey(['date', 'day', 'tanggal']);
          const inKey = findKey(['in', 'start', 'masuk']);
          const outKey = findKey(['out', 'end', 'keluar']);

          const empName = nameKey ? String(row[nameKey]) : `Employee ${index + 1}`;
          const dateStr = dateKey ? String(row[dateKey]) : 'YYYY-MM-DD';
          const inStr = inKey ? String(row[inKey]) : '09:00';
          const outStr = outKey ? String(row[outKey]) : '17:00';

          let hours = 8;
          try {
            const [inH, inM] = inStr.split(':').map(Number);
            const [outH, outM] = outStr.split(':').map(Number);
            if (!isNaN(inH) && !isNaN(outH)) {
              hours = (outH + (outM||0)/60) - (inH + (inM||0)/60);
              if (hours < 0) hours += 24;
            }
          } catch(e) {}

          return {
            id: `att-${Date.now()}-${index}`,
            employeeName: empName,
            date: dateStr.split('T')[0],
            checkIn: inStr,
            checkOut: outStr,
            totalHours: Math.max(0, hours)
          };
        }).filter(r => r.employeeName);
      }

      const excludedNames = getExcludedNames();
      records = records.filter(r => {
        const lowerName = r.employeeName.toLowerCase().trim();
        return !excludedNames.some(ex => lowerName.includes(ex));
      });

      if (records.length === 0) {
        setError('No compatible attendance records found in this sheet after filtering.');
      } else {
        setError(null);
      }
      setPreview(records);

    } catch (err: any) {
      setError('Failed to parse sheet data.');
      setPreview([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {!file && (
        <div className="bg-apex-surface p-8 rounded-xl border border-dashed border-apex-accent/30 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-apex-surface-hover text-apex-accent rounded-full flex items-center justify-center mb-4">
            <UploadCloud size={32} />
          </div>
          <h3 className="font-serif italic text-lg text-apex-accent mb-2">Upload Timesheets</h3>
          <p className="text-apex-muted mb-6 max-w-md">
            Import employee time logs. We support standard list formats and complex cross-tab formats like "Lap. Detail Absensi" from ZKTeco/fingerprint machines.
          </p>
          
          <label className="relative cursor-pointer bg-apex-accent hover:bg-[#A88849] text-apex-bg px-6 py-2.5 rounded font-semibold text-xs uppercase tracking-tighter transition-colors">
            <span>Select Excel File</span>
            <input 
              type="file" 
              className="sr-only" 
              accept=".xls,.xlsx"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      )}

      {error && (
        <div className="bg-rose-950/30 border border-rose-500/20 text-rose-400 p-4 rounded-lg flex items-start gap-3">
          <AlertTriangle className="flex-shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="font-medium text-rose-300">Import Alert</h4>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {file && (
        <div className="bg-apex-surface rounded-xl border border-apex-border overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-apex-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-apex-surface-hover rounded-lg">
                <FileSpreadsheet className="text-emerald-500" size={24} />
              </div>
              <div>
                <h3 className="font-serif italic text-lg text-apex-text">
                  {file.name}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] uppercase tracking-widest text-apex-muted">Active Sheet:</span>
                  <select 
                    value={selectedSheet}
                    onChange={handleSheetChange}
                    className="bg-apex-bg border border-apex-border text-apex-text text-xs rounded px-2 py-1 outline-none focus:border-apex-accent"
                  >
                    {sheetNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {preview.length > 0 && (
              <button 
                onClick={() => onImport(preview)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded font-semibold text-xs uppercase tracking-tighter transition-colors flex items-center gap-2 self-start sm:self-auto"
              >
                Import {preview.length} Records <ArrowRight size={18} />
              </button>
            )}
          </div>
          
          {preview.length > 0 && (
            <div className="max-h-[500px] overflow-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#1C1C21] sticky top-0 border-b border-apex-border">
                  <tr>
                    <th className="px-6 py-3 text-[10px] uppercase font-bold text-apex-muted tracking-widest">Employee</th>
                    <th className="px-6 py-3 text-[10px] uppercase font-bold text-apex-muted tracking-widest text-right">Days Logged</th>
                    <th className="px-6 py-3 text-[10px] uppercase font-bold text-apex-muted tracking-widest text-right">Avg Hours/Day</th>
                    <th className="px-6 py-3 text-[10px] uppercase font-bold text-apex-muted tracking-widest text-right">Total Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-apex-border">
                  {groupedPreview.map((g, idx) => (
                    <tr key={idx} className="hover:bg-apex-surface-hover transition-colors">
                      <td className="px-6 py-3 text-apex-text font-medium">{g.employeeName}</td>
                      <td className="px-6 py-3 text-right text-apex-muted font-mono">{g.daysSession}</td>
                      <td className="px-6 py-3 text-right text-apex-muted font-mono">{(g.totalHours / g.daysSession).toFixed(2)}h</td>
                      <td className="px-6 py-3 text-right font-mono text-sm text-apex-accent">
                        {g.totalHours.toFixed(2)}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

