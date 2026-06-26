import React, { useState, useMemo } from 'react';
import { AttendanceRecord, Holiday } from '../types';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { getDateInfo } from '../lib/payroll-logic';
import { getDepartment } from '../lib/utils';

export function AttendanceList({ records, holidays, departments }: { records: AttendanceRecord[], holidays: Holiday[], departments?: Record<string, string> }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (empName: string) => {
    const newSet = new Set(expanded);
    if (newSet.has(empName)) newSet.delete(empName);
    else newSet.add(empName);
    setExpanded(newSet);
  };

  const groupedRecords = useMemo(() => {
    const map = new Map<string, { employeeName: string, records: AttendanceRecord[], totalHours: number }>();
    const term = searchTerm.toLowerCase();
    records.forEach(r => {
      const dept = getDepartment(r.employeeName, departments);
      if (selectedCategory !== 'All' && dept !== selectedCategory) return;

      const matchName = r.employeeName.toLowerCase().includes(term);
      const matchDept = dept.toLowerCase().includes(term);
      
      if (searchTerm && !matchName && !matchDept) return;
      const existing = map.get(r.employeeName) || { employeeName: r.employeeName, records: [], totalHours: 0 };
      existing.records.push(r);
      existing.totalHours += r.totalHours;
      map.set(r.employeeName, existing);
    });
    // Sort records within group by date
    Array.from(map.values()).forEach(group => group.records.sort((a,b) => a.date.localeCompare(b.date)));
    return Array.from(map.values()).sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  }, [records, searchTerm, selectedCategory, departments]);

  return (
    <div className="bg-apex-surface rounded-xl border border-apex-border shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-apex-border flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-apex-muted" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-apex-bg border border-apex-border rounded-lg text-apex-text focus:outline-none focus:ring-1 focus:ring-apex-accent focus:border-apex-accent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-apex-bg border border-apex-border rounded-lg text-apex-text focus:outline-none focus:ring-1 focus:ring-apex-accent focus:border-apex-accent [color-scheme:dark] min-w-[180px]"
          >
            <option value="All">All Categories</option>
            <option value="Produksi">Produksi</option>
            <option value="Distribusi">Distribusi</option>
            <option value="Staff">Staff</option>
            <option value="Sales">Sales</option>
            <option value="Uncategorized">Uncategorized</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#1C1C21] sticky top-0 border-b border-apex-border z-10">
            <tr>
              <th className="px-6 py-3 text-[10px] uppercase font-bold text-apex-muted tracking-widest">Employee</th>
              <th className="px-6 py-3 text-[10px] uppercase font-bold text-apex-muted tracking-widest text-right">Records Count</th>
              <th className="px-6 py-3 text-[10px] uppercase font-bold text-apex-muted tracking-widest text-right">Total Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-apex-border">
            {groupedRecords.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-apex-muted">
                  No time logs found.
                </td>
              </tr>
            ) : (
              groupedRecords.map((group) => (
                <React.Fragment key={group.employeeName}>
                  <tr 
                    className="hover:bg-apex-surface-hover transition-colors cursor-pointer group"
                    onClick={() => toggleExpand(group.employeeName)}
                  >
                    <td className="px-6 py-4 text-apex-text font-medium flex items-center gap-3">
                      <div className="text-apex-muted group-hover:text-apex-accent transition-colors">
                        {expanded.has(group.employeeName) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                      <div className="flex flex-col">
                        <span>{group.employeeName}</span>
                        <span className="text-[9px] uppercase tracking-widest bg-apex-surface border border-apex-border text-apex-muted px-1.5 py-0.5 rounded w-fit mt-1">
                          {getDepartment(group.employeeName, departments)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-apex-muted font-mono">{group.records.length} days</td>
                    <td className="px-6 py-4 text-right font-mono text-sm text-apex-accent font-bold">
                      {group.totalHours.toFixed(2)}h
                    </td>
                  </tr>
                  {expanded.has(group.employeeName) && (
                    <tr className="bg-apex-surface-hover/30 border-b border-apex-border">
                      <td colSpan={3} className="p-0">
                        <div className="px-14 py-4 w-full">
                          <table className="w-full text-left text-xs whitespace-nowrap bg-apex-bg border border-apex-border rounded overflow-hidden">
                            <thead className="bg-apex-surface">
                              <tr>
                                <th className="px-4 py-2 border-b border-apex-border text-apex-muted font-mono uppercase tracking-widest w-1/2 text-[10px]">Date</th>
                                <th className="px-4 py-2 border-b border-apex-border text-apex-muted font-mono uppercase tracking-widest text-[10px]">Check In</th>
                                <th className="px-4 py-2 border-b border-apex-border text-apex-muted font-mono uppercase tracking-widest text-[10px]">Check Out</th>
                                <th className="px-4 py-2 border-b border-apex-border text-apex-muted font-mono uppercase tracking-widest text-right text-[10px]">Daily Hours</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-apex-border">
                              {group.records.map(record => {
                                let isSun = false;
                                let dayName = '';
                                try {
                                  const info = getDateInfo(record.date);
                                  isSun = info.isSunday;
                                  dayName = info.dayName;
                                } catch(e) {}
                                const hol = holidays.find(h => h.date === record.date);
                                
                                let isLate = false;
                                try {
                                  const [inH, inM] = record.checkIn.split(':').map(Number);
                                  if (!isNaN(inH) && !isNaN(inM) && !isSun && !hol) {
                                    const inDecimal = inH + (inM / 60);
                                    if (inDecimal > 8.5) {
                                      isLate = true;
                                    }
                                  }
                                } catch(e) {}

                                let isOvertime = false;
                                try {
                                  const [outH, outM] = record.checkOut.split(':').map(Number);
                                  if (!isNaN(outH) && !isNaN(outM)) {
                                    if (outH > 17 || (outH === 17 && outM >= 30)) {
                                      isOvertime = true;
                                    }
                                  }
                                } catch(e) {}

                                return (
                                <tr key={record.id} className="hover:bg-apex-surface transition-colors">
                                  <td className="px-4 py-2 text-apex-muted flex items-center gap-2">
                                    <span className="font-mono">{dayName ? `${dayName}, ` : ''}{record.date}</span>
                                    {isSun && !hol && <span className="text-[9px] uppercase px-1.5 py-0.5 bg-apex-surface text-[#A88849] rounded border border-apex-border font-bold">Weekend</span>}
                                    {hol && <span className="text-[9px] uppercase px-1.5 py-0.5 bg-amber-950/30 text-amber-500 border border-amber-500/20 rounded font-bold truncate max-w-[150px]" title={hol.name}>{hol.name}</span>}
                                  </td>
                                  <td className="px-4 py-2">
                                    <div className="flex items-center gap-2">
                                      <span className="bg-emerald-900/10 text-emerald-500 border border-emerald-500/10 px-2 py-0.5 rounded font-mono text-[10px] tracking-wider">{record.checkIn}</span>
                                      {isLate && <span className="text-[9px] uppercase px-1.5 py-0.5 bg-rose-900/30 text-rose-500 border border-rose-500/20 rounded font-bold">Terlambat</span>}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2">
                                    <div className="flex items-center gap-2">
                                      <span className="bg-rose-900/10 text-rose-500 border border-rose-500/10 px-2 py-0.5 rounded font-mono text-[10px] tracking-wider">{record.checkOut}</span>
                                      {isOvertime && <span className="text-[9px] uppercase px-1.5 py-0.5 bg-indigo-900/30 text-indigo-400 border border-indigo-500/20 rounded font-bold">Lembur</span>}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 text-right text-apex-muted font-mono">{record.totalHours.toFixed(2)}h</td>
                                </tr>
                              )})}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
