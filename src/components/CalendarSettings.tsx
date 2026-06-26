import React, { useState } from 'react';
import { Calendar as CalIcon, CloudDownload, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Holiday } from '../types';

export function CalendarSettings({ holidays, onUpdateHolidays }: { holidays: Holiday[], onUpdateHolidays: (h: Holiday[]) => void }) {
  const [country, setCountry] = useState('ID'); // Default Indonesia based on previous context
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newDate, setNewDate] = useState('');
  const [newName, setNewName] = useState('');

  const fetchHolidays = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`);
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      
      const newHolidays = data.map((d: any) => ({ date: d.date, name: d.name || d.localName }));
      
      // Merge with existing, avoiding duplicates by date
      const existingObj = Object.fromEntries(holidays.map(h => [h.date, h]));
      newHolidays.forEach((h: any) => {
        if (!existingObj[h.date]) existingObj[h.date] = h;
      });
      
      onUpdateHolidays(Object.values(existingObj).sort((a,b) => a.date.localeCompare(b.date)));
      setSuccess(`Successfully imported ${newHolidays.length} holidays for ${country} in ${year}.`);
    } catch (e) {
      setError("Failed to fetch holidays. Please check the country code and year.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newName) return;
    const existing = holidays.find(h => h.date === newDate);
    if (existing) {
      setError(`A holiday already exists on ${newDate}.`);
      return;
    }
    const updated = [...holidays, { date: newDate, name: newName }].sort((a,b) => a.date.localeCompare(b.date));
    onUpdateHolidays(updated);
    setNewDate('');
    setNewName('');
    setSuccess('Custom holiday added successfully.');
    setError(null);
  };

  const handleRemove = (date: string) => {
    onUpdateHolidays(holidays.filter(h => h.date !== date));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Fetch API Panel */}
      <div className="bg-apex-surface p-6 rounded-xl border border-apex-border shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-apex-surface-hover rounded-lg">
            <CloudDownload className="text-apex-accent" size={20} />
          </div>
          <div>
            <h3 className="font-serif italic text-lg text-apex-text">Sync Public Holidays</h3>
            <p className="text-xs text-apex-muted uppercase tracking-widest mt-1">Via Nager.Date API</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-[10px] uppercase font-bold tracking-widest text-apex-muted mb-2">Country Code (ISO 3166-1)</label>
            <input 
              type="text" 
              value={country}
              onChange={(e) => setCountry(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 bg-apex-bg border border-apex-border rounded text-apex-text font-mono focus:outline-none focus:border-apex-accent uppercase"
              placeholder="US, ID, GB..."
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] uppercase font-bold tracking-widest text-apex-muted mb-2">Year</label>
            <input 
              type="text" 
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-4 py-2 bg-apex-bg border border-apex-border rounded text-apex-text font-mono focus:outline-none focus:border-apex-accent"
              placeholder="YYYY"
            />
          </div>
          <button 
            onClick={fetchHolidays}
            disabled={loading}
            className="w-full sm:w-auto bg-apex-accent hover:bg-[#D4B373] text-apex-bg px-6 py-2 rounded font-semibold text-xs uppercase tracking-tighter transition-colors disabled:opacity-50 h-[42px]"
          >
            {loading ? 'Fetching...' : 'Fetch Holidays'}
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-rose-950/30 border border-rose-500/20 text-rose-400 p-3 rounded flex items-center gap-2 text-sm">
            <AlertTriangle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="mt-4 bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 p-3 rounded flex items-center gap-2 text-sm">
            <CheckCircle2 size={16} /> {success}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Manual Add Form */}
        <div className="bg-apex-surface p-6 rounded-xl border border-apex-border shadow-sm col-span-1 h-fit">
          <div className="flex items-center gap-2 mb-6 text-apex-text font-serif italic text-lg border-b border-apex-border border-dashed pb-4">
            <Plus className="text-apex-accent" size={20} />
            Custom Holiday
          </div>
          <form onSubmit={handleAddCustom} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-apex-muted mb-2">Date</label>
              <input 
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 bg-apex-bg border border-apex-border rounded text-apex-text font-mono text-sm outline-none focus:border-apex-accent [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-apex-muted mb-2">Holiday Name</label>
              <input 
                type="text" 
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Company Anniversary"
                className="w-full px-3 py-2 bg-apex-bg border border-apex-border rounded text-apex-text text-sm outline-none focus:border-apex-accent"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-apex-surface-hover border border-apex-border hover:text-apex-accent text-apex-text px-4 py-2 rounded font-semibold text-xs uppercase tracking-tighter transition-colors mt-2"
            >
              Add Entry
            </button>
          </form>
        </div>

        {/* Holidays List */}
        <div className="bg-apex-surface rounded-xl border border-apex-border shadow-sm col-span-1 md:col-span-2 flex flex-col h-[500px]">
          <div className="p-6 border-b border-apex-border flex items-center justify-between">
            <h3 className="font-serif italic text-lg text-apex-text flex items-center gap-2">
              <CalIcon className="text-apex-accent" size={20} />
              Active Holidays
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-widest text-apex-muted bg-apex-bg px-2 py-1 rounded border border-apex-border">
              {holidays.length} Entries
            </span>
          </div>
          
          <div className="flex-1 overflow-auto p-2">
            {holidays.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-apex-muted text-sm italic opacity-50">
                <CalIcon size={32} className="mb-2" />
                No holidays recorded yet.
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#1C1C21] sticky top-0 border-b border-apex-border z-10">
                  <tr>
                    <th className="px-4 py-3 text-[10px] uppercase font-bold text-apex-muted tracking-widest">Date</th>
                    <th className="px-4 py-3 text-[10px] uppercase font-bold text-apex-muted tracking-widest">Event</th>
                    <th className="px-4 py-3 text-[10px] uppercase font-bold text-apex-muted tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-apex-border">
                  {holidays.map(h => (
                    <tr key={h.date} className="hover:bg-apex-surface-hover transition-colors">
                      <td className="px-4 py-3 text-apex-muted font-mono text-xs">{h.date}</td>
                      <td className="px-4 py-3 text-apex-text">{h.name}</td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => handleRemove(h.date)}
                          className="text-rose-500/50 hover:text-rose-400 transition-colors"
                          title="Remove Holiday"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
