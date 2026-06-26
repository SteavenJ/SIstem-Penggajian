import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Hardcoded PIN for simplicity
    if (pin === '123456') {
      onLogin();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-apex-bg flex flex-col items-center justify-center p-4">
      <div className="max-w-sm w-full bg-apex-surface border border-apex-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-apex-accent to-indigo-500"></div>
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-apex-surface-hover rounded-full flex items-center justify-center mb-4 border border-apex-border">
            <Lock className="text-apex-accent" size={28} />
          </div>
          <h1 className="text-2xl font-serif italic text-apex-text text-center">Company Portal</h1>
          <p className="text-apex-muted text-sm mt-2 text-center">Please enter the security PIN to access the payroll system.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="PIN"
              className={`w-full bg-apex-bg border ${error ? 'border-rose-500/50 focus:border-rose-500' : 'border-apex-border focus:border-apex-accent'} rounded-lg px-4 py-3 text-center text-xl tracking-[0.5em] font-mono text-apex-text outline-none transition-colors`}
              autoFocus
            />
            {error && <p className="text-rose-500 text-xs text-center mt-2">Incorrect PIN. Please try again.</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-apex-accent hover:bg-apex-accent/90 text-[#0A0A0B] font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Access System
          </button>
        </form>
      </div>
    </div>
  );
}
