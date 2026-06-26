import React from 'react';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Calculator,
  Users,
  Calendar as CalIcon,
  UserCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Executive View', icon: LayoutDashboard },
    { id: 'import', label: 'Import Timesheets', icon: FileSpreadsheet },
    { id: 'attendance', label: 'Time Logs', icon: Users },
    { id: 'payroll', label: 'Payroll & Salary', icon: Calculator },
    { id: 'calendar', label: 'Calendar Rules', icon: CalIcon },
    { id: 'profile', label: 'Employee Profile', icon: UserCircle },
  ] as const;

  return (
    <div className="w-64 bg-apex-surface border-r border-apex-border h-screen flex-shrink-0 flex flex-col text-apex-text">
      <div className="p-8">
        <h1 className="text-2xl font-serif italic text-apex-accent tracking-tight">
          PT. Indo Kasur Nusantara
        </h1>
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-40 mt-1">Time & Attendance</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
              currentView === item.id 
                ? "bg-apex-surface-hover text-apex-accent" 
                : "text-apex-muted hover:bg-apex-surface-hover hover:text-white"
            )}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

    </div>
  );
}
