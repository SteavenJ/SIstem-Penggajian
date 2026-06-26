import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { AttendanceRecord } from '../types';

interface DashboardProps {
  records: AttendanceRecord[];
  rates: Record<string, number>;
  departments?: Record<string, string>;
}

export function Dashboard({ records, rates, departments }: DashboardProps) {
  const summary = useMemo(() => {
    let totalHours = 0;
    const employees = new Set<string>();
    let totalPayroll = 0;
    
    // Calculate payroll using simple hourly rate
    const empHours: Record<string, number> = {};
    
    records.forEach(r => {
      totalHours += r.totalHours;
      employees.add(r.employeeName);
      empHours[r.employeeName] = (empHours[r.employeeName] || 0) + r.totalHours;
    });

    Object.entries(empHours).forEach(([name, hours]) => {
      totalPayroll += hours * (rates[name] || 0);
    });

    return {
      totalHours,
      totalEmployees: employees.size,
      totalPayroll
    };
  }, [records, rates]);

  const chartData = useMemo(() => {
    // group by date
    const dateMap: Record<string, number> = {};
    records.forEach(r => {
      // simpler date grouping
      const d = r.date || 'Unknown';
      dateMap[d] = (dateMap[d] || 0) + r.totalHours;
    });

    return Object.entries(dateMap).map(([date, hours]) => ({ date, hours })).sort((a,b) => a.date.localeCompare(b.date));
  }, [records]);

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-apex-muted space-y-4">
        <div className="text-4xl text-apex-border">📊</div>
        <p>No time logs available. Please import timesheets first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Row Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-apex-surface p-6 border border-apex-border rounded-xl">
          <p className="text-[10px] uppercase tracking-widest text-apex-muted mb-4">Total Hours Logged</p>
          <p className="text-3xl font-light font-mono text-apex-text">{summary.totalHours.toFixed(1)}h</p>
        </div>
        
        <div className="bg-apex-surface p-6 border border-apex-border rounded-xl">
          <p className="text-[10px] uppercase tracking-widest text-apex-muted mb-4">Total Appx. Payroll</p>
          <p className="text-3xl font-light font-mono text-apex-accent">
             Rp {summary.totalPayroll.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
        
        <div className="bg-apex-surface p-6 border border-apex-border rounded-xl">
          <p className="text-[10px] uppercase tracking-widest text-apex-muted mb-4">Active Employees</p>
          <p className="text-3xl font-light font-mono text-apex-text">{summary.totalEmployees}</p>
          <p className="mt-4 text-xs text-emerald-500 flex items-center italic">
            ✓ Attendance tracked
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 h-[400px]">
        {/* Hours Trend */}
        <div className="bg-apex-surface p-6 rounded-xl border border-apex-border shadow-sm flex flex-col">
          <h3 className="font-serif text-lg italic text-apex-text mb-6">Aggregate Hours per Day</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2A2E" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A1A1AA' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A1A1AA' }}  />
                <Tooltip cursor={{ fill: '#1C1C21' }} contentStyle={{ borderRadius: '8px', border: '1px solid #2A2A2E', backgroundColor: '#141417', color: '#E5E5E7' }} />
                <Bar dataKey="hours" name="Total Hours" fill="#C5A059" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
