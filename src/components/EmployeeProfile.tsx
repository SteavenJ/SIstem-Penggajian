import React, { useMemo, useState } from 'react';
import { Save, User, Filter } from 'lucide-react';
import { getDepartment, getDefaultLemburRate } from '../lib/utils';

interface EmployeeProfileProps {
  rates: Record<string, number>;
  onUpdateRate: (employeeName: string, rate: number) => void;
  terlambatRate: number;
  onUpdateTerlambatRate: (rate: number) => void;
  departments: Record<string, string>;
  onUpdateDepartment: (employeeName: string, department: string) => void;
  lemburRates?: Record<string, number>;
  onUpdateLemburRate?: (employeeName: string, rate: number) => void;
}

export function EmployeeProfile({ rates, onUpdateRate, terlambatRate, onUpdateTerlambatRate, departments, onUpdateDepartment, lemburRates = {}, onUpdateLemburRate }: EmployeeProfileProps) {
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [editRateValue, setEditRateValue] = useState<string>('');
  
  const [editingLemburEmployee, setEditingLemburEmployee] = useState<string | null>(null);
  const [editLemburRateValue, setEditLemburRateValue] = useState<string>('');

  const [editingTerlambat, setEditingTerlambat] = useState(false);
  const [editTerlambatValue, setEditTerlambatValue] = useState<string>('');
  
  const [selectedCategory, setSelectedCategory] = useState('All');

  const employeeNames = Object.keys(rates).sort((a, b) => a.localeCompare(b));
  
  const categories = useMemo(() => {
    const cats = new Set(['Produksi', 'Distribusi', 'Staff', 'Sales', 'Uncategorized']);
    employeeNames.forEach(name => cats.add(getDepartment(name, departments)));
    return ['All', ...Array.from(cats)].sort();
  }, [employeeNames, departments]);
  
  const filteredEmployees = employeeNames.filter(name => 
    selectedCategory === 'All' || getDepartment(name, departments) === selectedCategory
  );

  const handleEditRate = (name: string, currentRate: number) => {
    setEditingEmployee(name);
    setEditRateValue(currentRate.toString());
  };

  const handleSaveRate = (name: string) => {
    const val = parseFloat(editRateValue);
    if (!isNaN(val)) {
      onUpdateRate(name, val);
    }
    setEditingEmployee(null);
  };

  const handleEditLemburRate = (name: string, currentRate: number) => {
    setEditingLemburEmployee(name);
    setEditLemburRateValue(currentRate.toString());
  };

  const handleSaveLemburRate = (name: string) => {
    const val = parseFloat(editLemburRateValue);
    if (!isNaN(val) && onUpdateLemburRate) {
      onUpdateLemburRate(name, val);
    }
    setEditingLemburEmployee(null);
  };

  const handleEditTerlambat = () => {
    setEditingTerlambat(true);
    setEditTerlambatValue(terlambatRate.toString());
  };

  const handleSaveTerlambat = () => {
    const val = parseFloat(editTerlambatValue);
    if (!isNaN(val)) {
      onUpdateTerlambatRate(val);
    }
    setEditingTerlambat(false);
  };

  return (
    <div className="bg-apex-surface rounded-xl border border-apex-border shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-apex-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-serif italic text-apex-text flex items-center gap-2">
          <User size={20} className="text-apex-accent" />
          Employee Profile Settings
        </h3>
        
        <div className="relative w-full sm:w-auto flex items-center gap-2">
          <Filter className="text-apex-muted" size={16} />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-apex-bg border border-apex-border rounded-lg text-sm text-apex-text focus:outline-none focus:border-apex-accent transition-colors"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="p-6 overflow-y-auto flex-1">
        <div className="bg-apex-bg rounded-lg border border-apex-border p-5 flex items-center justify-between mb-8">
          <div>
            <h4 className="text-rose-500 font-semibold mb-1">Terlambat Rate</h4>
            <p className="text-xs text-apex-muted">Deduction rate per day for late check-ins after 08:30</p>
          </div>
          <div>
            {editingTerlambat ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-apex-muted">Rp</span>
                <input
                  type="number"
                  value={editTerlambatValue}
                  onChange={(e) => setEditTerlambatValue(e.target.value)}
                  className="w-24 px-2 py-1 bg-apex-surface border border-apex-border rounded text-apex-text text-sm font-mono focus:outline-none focus:border-rose-500"
                  autoFocus
                  onBlur={handleSaveTerlambat}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTerlambat()}
                />
              </div>
            ) : (
              <div 
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 group transition-opacity"
                onClick={handleEditTerlambat}
              >
                <span className="font-mono text-lg text-rose-500 font-bold">
                  Rp {terlambatRate.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] uppercase text-apex-muted group-hover:text-apex-text tracking-widest hidden sm:inline-block">/ day</span>
              </div>
            )}
          </div>
        </div>

        <h4 className="text-sm font-bold uppercase tracking-widest text-apex-muted mb-4 border-b border-apex-border/50 pb-2">Employee Base Rates</h4>
        
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-10 text-apex-muted text-sm border border-dashed border-apex-border rounded-lg">
            No employees found. Import timesheet data to view employees.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map(name => (
              <div key={name} className="border border-apex-border rounded-lg p-4 bg-apex-bg hover:border-apex-accent/40 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-medium text-apex-text">{name}</h5>
                    <select
                      value={getDepartment(name, departments)}
                      onChange={(e) => onUpdateDepartment(name, e.target.value)}
                      className="text-[9px] uppercase tracking-widest bg-apex-surface border border-apex-border text-apex-muted px-1.5 py-0.5 rounded w-fit mt-1 inline-block focus:outline-none focus:border-apex-accent"
                    >
                      {categories.filter(c => c !== 'All').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-apex-border/30">
                  <span className="text-xs text-apex-muted">Base Rate</span>
                  {editingEmployee === name ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editRateValue}
                        onChange={(e) => setEditRateValue(e.target.value)}
                        className="w-20 px-2 py-1 bg-apex-surface border border-apex-border rounded text-apex-text text-sm font-mono focus:outline-none focus:border-apex-accent"
                        autoFocus
                        onBlur={() => handleSaveRate(name)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveRate(name)}
                      />
                    </div>
                  ) : (
                    <div 
                      className="font-mono text-sm text-apex-text cursor-pointer hover:text-apex-accent"
                      onClick={() => handleEditRate(name, rates[name])}
                    >
                      Rp {rates[name].toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-1 pt-1 border-apex-border/30">
                  <span className="text-xs text-apex-muted">Lembur Rate</span>
                  {editingLemburEmployee === name ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editLemburRateValue}
                        onChange={(e) => setEditLemburRateValue(e.target.value)}
                        className="w-20 px-2 py-1 bg-apex-surface border border-apex-border rounded text-apex-text text-sm font-mono focus:outline-none focus:border-apex-accent"
                        autoFocus
                        onBlur={() => handleSaveLemburRate(name)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveLemburRate(name)}
                      />
                    </div>
                  ) : (
                    <div 
                      className="font-mono text-sm text-apex-text cursor-pointer hover:text-apex-accent"
                      onClick={() => handleEditLemburRate(name, lemburRates[name] ?? getDefaultLemburRate(name))}
                    >
                      Rp {(lemburRates[name] ?? getDefaultLemburRate(name)).toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
