import React, { useMemo, useState } from 'react';
import { AttendanceRecord, Holiday } from '../types';
import { Calculator, FileDown, FileText } from 'lucide-react';
import { calculateTerlambat, calculateHours, getDateInfo } from '../lib/payroll-logic';
import { getDepartment, getDefaultLemburRate } from '../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PayrollProps {
  records: AttendanceRecord[];
  rates: Record<string, number>;
  holidays: Holiday[];
  onUpdateRate: (employeeName: string, rate: number) => void;
  terlambatRate?: number;
  departments?: Record<string, string>;
  lemburRates?: Record<string, number>;
}

export function Payroll({ records, rates, holidays, onUpdateRate, terlambatRate = 7500, departments, lemburRates = {} }: PayrollProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [popupData, setPopupData] = useState<{ title: string, employee: string, events: { date: string, time: string, hours: number }[] } | null>(null);

  const payrollData = useMemo(() => {
    const summary: Record<string, { regularHours: number, terlambatHours: number, overtimeHours: number, lemburEvents: any[], terlambatEvents: any[] }> = {};
    const holidaySet = new Set(holidays.map(h => h.date));

    records.forEach(r => {
      const dept = getDepartment(r.employeeName, departments);
      if (selectedCategory !== 'All' && dept !== selectedCategory) return;

      if (!summary[r.employeeName]) {
        summary[r.employeeName] = { regularHours: 0, terlambatHours: 0, overtimeHours: 0, lemburEvents: [], terlambatEvents: [] };
      }
      
      const s = summary[r.employeeName];
      
      const { isSunday, dayName } = getDateInfo(r.date);
      const isHoliday = holidaySet.has(r.date);

      // Calculate Terlambat
      const terlambatResult = calculateTerlambat(r.checkIn, r.date, holidays);
      if (terlambatResult.isTerlambat) {
        s.terlambatHours += terlambatResult.terlambatDays;
        s.terlambatEvents.push({ date: r.date, time: r.checkIn, hours: terlambatResult.terlambatDays, dayName });
      }

      // Calculate Lembur
      const hoursResult = calculateHours(r.totalHours, r.date, holidays, false, r.checkIn, r.checkOut);
      s.regularHours += hoursResult.regularHours;
      s.overtimeHours += hoursResult.overtimeHours;

      if (hoursResult.overtimeHours > 0) {
        s.lemburEvents.push({ date: r.date, time: r.checkOut, hours: hoursResult.overtimeHours, dayName });
      }
    });

    return Object.entries(summary).map(([name, data]) => {
      const rate = rates[name] || 0;
      const lemburRate = lemburRates[name] ?? getDefaultLemburRate(name);
      
      const regularPay = data.regularHours * rate;
      const overtimePay = data.overtimeHours * lemburRate; 
      const terlambatDeduction = data.terlambatHours * terlambatRate; // Deduct for being late using global terlambatRate
      
      return {
        name,
        regularHours: data.regularHours,
        terlambatHours: data.terlambatHours,
        overtimeHours: data.overtimeHours,
        lemburEvents: data.lemburEvents,
        terlambatEvents: data.terlambatEvents,
        totalHours: data.regularHours + data.overtimeHours,
        rate,
        lemburRate,
        salary: Math.max(0, regularPay + overtimePay - terlambatDeduction)
      };
    }).sort((a,b) => a.name.localeCompare(b.name));
  }, [records, rates, holidays, selectedCategory, terlambatRate, lemburRates, departments]);

  const handleExportCSV = () => {
    if (payrollData.length === 0) return;

    const headers = ['Employee', 'Department', 'Base Hrs', 'Lembur Hrs', 'Terlambat Days', 'Hourly Rate', 'Lembur Rate', 'Final Salary'];
    const rows = payrollData.map(d => [
      d.name,
      getDepartment(d.name, departments),
      d.regularHours.toFixed(2),
      d.overtimeHours.toFixed(2),
      d.terlambatHours.toFixed(2),
      d.rate,
      d.lemburRate,
      d.salary
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `payroll_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (payrollData.length === 0) return;

    const doc = new jsPDF();
    doc.text('Payroll Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Category: ${selectedCategory} | Date: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableColumn = ['Employee', 'Department', 'Base Hrs', 'Lembur Hrs', 'Terlambat Days', 'Hourly Rate', 'Lembur Rate', 'Final Salary'];
    const tableRows = payrollData.map(d => [
      d.name,
      getDepartment(d.name, departments),
      d.regularHours.toFixed(2),
      d.overtimeHours.toFixed(2),
      d.terlambatHours.toFixed(2),
      `Rp ${d.rate.toLocaleString('id-ID')}`,
      `Rp ${d.lemburRate.toLocaleString('id-ID')}`,
      `Rp ${d.salary.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    ]);

    // calculate total
    const totalSalary = payrollData.reduce((acc, curr) => acc + curr.salary, 0);
    tableRows.push([
      '', '', '', '', '', '', 'Total', `Rp ${totalSalary.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 41, 46] }
    });

    doc.save(`payroll_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="bg-apex-surface rounded-xl border border-apex-border shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-apex-border flex flex-col xl:flex-row xl:items-center justify-between gap-4">
         <h3 className="font-serif italic text-lg text-apex-text flex items-center gap-2">
           <Calculator className="text-apex-accent" size={20} />
           Salary Calculation
         </h3>
         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
           <div className="flex gap-2">
             <button
               onClick={handleExportCSV}
               disabled={payrollData.length === 0}
               className="flex items-center gap-2 px-3 py-2 bg-apex-bg border border-apex-border text-apex-text text-sm rounded hover:border-apex-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <FileText size={16} />
               Export CSV
             </button>
             <button
               onClick={handleExportPDF}
               disabled={payrollData.length === 0}
               className="flex items-center gap-2 px-3 py-2 bg-apex-bg border border-apex-border text-apex-text text-sm rounded hover:border-apex-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <FileDown size={16} />
               Export PDF
             </button>
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
            <div className="flex gap-2 lg:gap-4 flex-wrap">
              <div className="text-[10px] uppercase font-bold text-apex-muted tracking-widest bg-apex-bg border border-apex-border px-2 py-1.5 rounded">
                Based on Total Duration (Max 8h Base)
              </div>
            </div>
         </div>
      </div>
      <div className="flex-1 overflow-auto relative">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#1C1C21] sticky top-0 border-b border-apex-border z-10">
            <tr>
              <th className="px-6 py-3 text-[10px] uppercase font-bold text-apex-muted tracking-widest">Employee</th>
              <th className="px-6 py-3 text-[10px] uppercase font-bold text-apex-muted tracking-widest text-right">Base Hrs</th>
              <th className="px-6 py-3 text-[10px] uppercase font-bold text-apex-muted tracking-widest text-right">Lembur Hrs</th>
              <th className="px-6 py-3 text-[10px] uppercase font-bold text-apex-muted tracking-widest text-right">Terlambat Days</th>
              <th className="px-6 py-3 text-[10px] uppercase font-bold text-apex-muted tracking-widest text-right">Rates (Base/Lembur)</th>
              <th className="px-6 py-3 text-[10px] uppercase font-bold text-apex-muted tracking-widest text-right">Final Salary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-apex-border">
            {payrollData.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-apex-muted">No attendance data to calculate payroll.</td>
              </tr>
            ) : (
              <>
                {payrollData.map((d) => (
                  <tr key={d.name} className="hover:bg-apex-surface-hover transition-colors">
                    <td className="px-6 py-4 flex flex-col w-[200px]">
                      <span className="text-apex-text font-medium">{d.name}</span>
                      <span className="text-[9px] uppercase tracking-widest bg-apex-surface border border-apex-border text-apex-muted px-1.5 py-0.5 rounded w-fit mt-1">
                        {getDepartment(d.name, departments)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm text-apex-muted">{d.regularHours.toFixed(2)}h</td>
                    <td 
                      className="px-6 py-4 text-right font-mono text-sm text-indigo-400 cursor-pointer hover:underline"
                      onClick={() => d.lemburEvents.length > 0 && setPopupData({ title: 'Lembur Details', employee: d.name, events: d.lemburEvents })}
                    >
                      {d.overtimeHours > 0 ? d.overtimeHours.toFixed(2) + 'h' : '-'}
                    </td>
                    <td 
                      className="px-6 py-4 text-right font-mono text-sm text-rose-500/80 cursor-pointer hover:underline"
                      onClick={() => d.terlambatEvents.length > 0 && setPopupData({ title: 'Terlambat Details', employee: d.name, events: d.terlambatEvents })}
                    >
                      {d.terlambatHours > 0 ? d.terlambatHours + 'd' : '-'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-sm text-apex-muted" title="Base Rate">Rp {d.rate.toLocaleString('id-ID')}</span>
                        <span className="font-mono text-[10px] text-indigo-400 mt-1" title="Lembur Rate">Rp {d.lemburRate.toLocaleString('id-ID')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm text-apex-accent font-bold">
                      Rp {d.salary.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
                <tr className="bg-apex-surface-hover sticky bottom-0 border-t border-apex-border">
                  <td colSpan={5} className="px-6 py-4 font-bold text-right text-apex-text uppercase tracking-widest text-[10px]">
                    Total Salary for {selectedCategory === 'All' ? 'All Employees' : selectedCategory}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-base text-emerald-500 font-bold">
                    Rp {payrollData.reduce((acc, curr) => acc + curr.salary, 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {popupData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-apex-surface border border-apex-border rounded-xl shadow-xl max-w-md w-full overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-apex-border flex items-center justify-between bg-apex-bg">
              <div>
                <h4 className="font-medium text-apex-text">{popupData.title}</h4>
                <p className="text-xs text-apex-muted">{popupData.employee}</p>
              </div>
              <button 
                onClick={() => setPopupData(null)}
                className="text-apex-muted hover:text-apex-text"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-apex-border/50 text-apex-muted text-[10px] uppercase tracking-widest">
                    <th className="pb-2">Date</th>
                    <th className="pb-2 text-right">Time</th>
                    <th className="pb-2 text-right">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-apex-border/20">
                  {popupData.events.map((ev: any, i) => {
                    const dayName = ev.dayName || '';
                    return (
                    <tr key={i}>
                      <td className="py-2 text-apex-text font-mono">{dayName ? `${dayName}, ` : ''}{ev.date}</td>
                      <td className="py-2 text-right font-mono text-apex-muted">{ev.time}</td>
                      <td className="py-2 text-right font-mono text-apex-text">
                        {popupData.title.includes('Terlambat') ? `${ev.hours}d` : `${ev.hours.toFixed(2)}h`}
                      </td>
                    </tr>
                    );
                  })}
                  <tr className="border-t border-apex-border/50">
                    <td colSpan={2} className="py-2 text-right text-[10px] uppercase tracking-widest text-apex-muted font-bold">Total</td>
                    <td className="py-2 text-right font-mono text-apex-text font-bold">
                      {popupData.title.includes('Terlambat') 
                        ? `${popupData.events.length} ${popupData.events.length === 1 ? 'day' : 'days'}`
                        : `${popupData.events.reduce((sum, ev) => sum + ev.hours, 0).toFixed(2)}h`
                      }
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
