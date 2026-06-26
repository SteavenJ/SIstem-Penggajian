import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { ViewState, AttendanceRecord, Holiday } from './types';
import { Dashboard } from './components/Dashboard';
import { ImportData } from './components/ImportData';
import { Payroll } from './components/Payroll';
import { AttendanceList } from './components/AttendanceList';
import { CalendarSettings } from './components/CalendarSettings';
import { Sun, Moon } from 'lucide-react';
import { getDefaultRate } from './lib/employee-config';

import { EmployeeProfile } from './components/EmployeeProfile';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [rates, setRates] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('apex_rates');
    return saved ? JSON.parse(saved) : {};
  });
  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    try {
      const saved = localStorage.getItem('apex_holidays');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [globalStartDate, setGlobalStartDate] = useState('');
  const [globalEndDate, setGlobalEndDate] = useState('');
  const [terlambatRate, setTerlambatRate] = useState<number>(() => {
    const saved = localStorage.getItem('apex_terlambatRate');
    return saved ? parseFloat(saved) : 7500;
  });
  const [departments, setDepartments] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('apex_departments');
    return saved ? JSON.parse(saved) : {};
  });
  const [lemburRates, setLemburRates] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('apex_lemburRates');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('apex_rates', JSON.stringify(rates));
  }, [rates]);

  useEffect(() => {
    localStorage.setItem('apex_terlambatRate', terlambatRate.toString());
  }, [terlambatRate]);

  useEffect(() => {
    localStorage.setItem('apex_departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('apex_lemburRates', JSON.stringify(lemburRates));
  }, [lemburRates]);

  useEffect(() => {
    localStorage.setItem('apex_holidays', JSON.stringify(holidays));
  }, [holidays]);

  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(r => {
      let rDateStr = r.date.trim();
      if (rDateStr.includes('/')) {
        const parts = rDateStr.split('/');
        if (parts.length === 3) {
          rDateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      if (globalStartDate && rDateStr < globalStartDate) return false;
      if (globalEndDate && rDateStr > globalEndDate) return false;
      return true;
    });
  }, [attendanceRecords, globalStartDate, globalEndDate]);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleImport = (newRecords: AttendanceRecord[]) => {
    setAttendanceRecords((prev) => [...prev, ...newRecords]);
    
    setRates((prev) => {
      const newRates = { ...prev };
      newRecords.forEach(r => {
        if (!newRates[r.employeeName]) {
          newRates[r.employeeName] = getDefaultRate(r.employeeName);
        }
      });
      return newRates;
    });

    setCurrentView('dashboard');
  };

  const handleUpdateRate = (employeeName: string, rate: number) => {
    setRates(prev => ({ ...prev, [employeeName]: rate }));
  };

  const handleUpdateLemburRate = (employeeName: string, rate: number) => {
    setLemburRates(prev => ({ ...prev, [employeeName]: rate }));
  };

  return (
    <div className="flex h-screen w-full bg-apex-bg overflow-hidden font-sans text-apex-text transition-colors duration-200">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 border-b border-apex-border flex flex-wrap items-center justify-between px-10 flex-shrink-0 transition-colors duration-200 bg-apex-bg gap-4">
          <div>
            <h2 className="text-xl font-serif italic capitalize">
              {currentView === 'dashboard' ? 'Overview' : currentView.replace('-', ' ')}
            </h2>
            <p className="text-xs text-apex-muted">Date Period Filtering</p>
          </div>
          
          <div className="flex items-center space-x-4 lg:space-x-6">
            <div className="flex items-center gap-2">
              <input 
                type="date"
                value={globalStartDate}
                onChange={(e) => setGlobalStartDate(e.target.value)}
                className="px-2 py-1 bg-apex-surface border border-apex-border rounded text-apex-text text-sm focus:outline-none focus:border-apex-accent [color-scheme:dark]"
              />
              <span className="text-apex-muted text-sm">-</span>
              <input 
                type="date"
                value={globalEndDate}
                onChange={(e) => setGlobalEndDate(e.target.value)}
                className="px-2 py-1 bg-apex-surface border border-apex-border rounded text-apex-text text-sm focus:outline-none focus:border-apex-accent [color-scheme:dark]"
              />
            </div>
            <button 
              onClick={toggleTheme}
              className="p-2 border border-apex-border rounded-full text-apex-muted hover:text-apex-accent hover:border-apex-accent transition-colors hidden sm:block"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {['dashboard', 'import'].includes(currentView) && (
              <button 
                onClick={() => setCurrentView('import')}
                className="bg-apex-accent text-apex-bg px-4 py-2 rounded font-semibold text-xs uppercase tracking-tighter hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                Import 
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 transition-colors duration-200">
          {currentView === 'dashboard' && <Dashboard records={filteredRecords} rates={rates} departments={departments} />}
          {currentView === 'attendance' && <AttendanceList records={filteredRecords} holidays={holidays} departments={departments} />}
          {currentView === 'import' && <ImportData onImport={handleImport} />}
          {currentView === 'payroll' && <Payroll records={filteredRecords} rates={rates} onUpdateRate={handleUpdateRate} holidays={holidays} terlambatRate={terlambatRate} departments={departments} lemburRates={lemburRates} />}
          {currentView === 'calendar' && <CalendarSettings holidays={holidays} onUpdateHolidays={setHolidays} />}
          {currentView === 'profile' && <EmployeeProfile rates={rates} onUpdateRate={handleUpdateRate} terlambatRate={terlambatRate} onUpdateTerlambatRate={setTerlambatRate} departments={departments} onUpdateDepartment={(name, dept) => setDepartments(p => ({ ...p, [name]: dept }))} lemburRates={lemburRates} onUpdateLemburRate={handleUpdateLemburRate} />}
        </div>
      </main>
    </div>
  );
}
