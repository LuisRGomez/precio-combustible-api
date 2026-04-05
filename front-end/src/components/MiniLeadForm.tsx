import React, { useState } from 'react';
import { BellIcon, CheckIcon, XIcon } from 'lucide-react';

const API_BASE   = import.meta.env.VITE_API_BASE || '';
const STORAGE_KEY = 'tankear_lead_v1';

interface Props {
  zona?:          string;
  placeholder?:   string;
  onSuccess?:     () => void;
  onDismiss?:     () => void;
  compact?:       boolean;
  pagina_origen?: string;
}

export function isAlreadySubscribed() {
  return localStorage.getItem(STORAGE_KEY) === 'done';
}

export function MiniLeadForm({ zona, placeholder, onSuccess, onDismiss, compact, pagina_origen }: Props) {
  const [value,   setValue]   = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState('');

  const isEmail  = value.includes('@');
  const isMobile = /^\d{6,}$/.test(value.replace(/\s/g, ''));

  const submit = async () => {
    if (!value.trim()) { setError('Ingresá email o WhatsApp'); return; }
    if (!isEmail && !isMobile) { setError('Email o número de WhatsApp válido'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mail:          isEmail  ? value.trim() : null,
          celular:       !isEmail ? value.trim() : null,
          zona:          zona || null,
          pagina_origen: pagina_origen || 'combustible',
        }),
      });
      if (!res.ok) throw new Error('error');
      localStorage.setItem(STORAGE_KEY, 'done');
      setDone(true);
      onSuccess?.();
    } catch {
      setError('Algo salió mal, reintentá');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className={`flex items-center gap-2 text-emerald-400 ${compact ? 'text-xs' : 'text-sm'}`}>
        <CheckIcon className="w-4 h-4 flex-shrink-0" />
        <span>¡Listo! Te avisamos cuando cambien los precios.</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={placeholder || 'Email o WhatsApp'}
          className={`flex-1 bg-slate-800 border border-slate-700 focus:border-amber-500/50 rounded-lg px-3 text-slate-200 placeholder:text-slate-500 focus:outline-none transition-colors ${compact ? 'py-1.5 text-xs' : 'py-2 text-sm'}`}
        />
        <button
          onClick={submit}
          disabled={loading}
          className={`flex-shrink-0 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}>
          {loading
            ? <span className="w-3 h-3 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
            : <BellIcon className="w-3.5 h-3.5" />
          }
          {!compact && <span>Avisame</span>}
        </button>
        {onDismiss && (
          <button onClick={onDismiss} className="text-slate-600 hover:text-slate-400 transition-colors">
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      {error && <p className="text-red-400 text-xs pl-1">{error}</p>}
      {!compact && <p className="text-slate-600 text-xs pl-1">Sin spam. Cancelás cuando quieras.</p>}
    </div>
  );
}
