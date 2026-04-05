import React, { useEffect, useState } from 'react';
import { BellIcon, CheckIcon, XIcon, TrendingUpIcon, NewspaperIcon, CalculatorIcon } from 'lucide-react';
import { isAlreadySubscribed } from './MiniLeadForm';

const API_BASE       = import.meta.env.VITE_API_BASE || '';
const STORAGE_KEY    = 'tankear_lead_v1';
const DISMISSED_KEY  = 'tankear_modal_dismissed';
const DELAY_MS       = 8000;

interface Props {
  zona?: string;   // localidad detectada, ej: "JOSE C. PAZ"
}

const PREFS = [
  { id: 'precios',   label: 'Cambio de precios en mi zona',   icon: TrendingUpIcon },
  { id: 'noticias',  label: 'Noticias de combustible',         icon: NewspaperIcon  },
  { id: 'cotizador', label: 'Cotizador de gasto mensual',      icon: CalculatorIcon },
];

export function AlertModal({ zona }: Props) {
  const [visible,  setVisible]  = useState(false);
  const [leaving,  setLeaving]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [value,    setValue]    = useState('');
  const [prefs,    setPrefs]    = useState<string[]>(['precios', 'noticias', 'cotizador']);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (isAlreadySubscribed() || localStorage.getItem(DISMISSED_KEY)) return;

    const t = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const close = (permanent = false) => {
    setLeaving(true);
    if (permanent) localStorage.setItem(DISMISSED_KEY, '1');
    setTimeout(() => setVisible(false), 300);
  };

  const togglePref = (id: string) => {
    setPrefs((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const submit = async () => {
    const val = value.trim();
    if (!val) { setError('Ingresá email o WhatsApp'); return; }
    const isEmail  = val.includes('@');
    const isMobile = /^\d{6,}$/.test(val.replace(/\s/g, ''));
    if (!isEmail && !isMobile) { setError('Email o número de WhatsApp válido'); return; }

    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mail:          isEmail  ? val : null,
          celular:       !isEmail ? val : null,
          zona:          zona || null,
          pagina_origen: 'modal_alerta',
          preferencias:  prefs,
        }),
      });
      if (!res.ok) throw new Error('error');
      localStorage.setItem(STORAGE_KEY, 'done');
      setDone(true);
      setTimeout(() => close(false), 2500);
    } catch {
      setError('Algo salió mal, reintentá');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    /* Backdrop */
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-opacity duration-300 ${leaving ? 'opacity-0' : 'opacity-100'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={() => close(true)}
    >
      {/* Card */}
      <div
        className={`w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl transition-all duration-300 ${leaving ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dismiss */}
        <button
          onClick={() => close(true)}
          className="absolute top-4 right-4 text-slate-600 hover:text-slate-300 transition-colors"
        >
          <XIcon className="w-4 h-4" />
        </button>

        {done ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <CheckIcon className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-slate-200 font-semibold">¡Listo, te avisamos!</p>
            <p className="text-slate-500 text-sm mt-1">Sin spam. Cancelás cuando quieras.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <BellIcon className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base leading-tight">
                  Alertas{zona ? ` para ${zona}` : ' de precios'}
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">¿Qué querés que te avisemos?</p>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2.5 mb-5">
              {PREFS.map(({ id, label, icon: Icon }) => {
                const checked = prefs.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => togglePref(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left ${
                      checked
                        ? 'bg-amber-500/10 border-amber-500/30 text-slate-200'
                        : 'bg-slate-800/50 border-slate-700/50 text-slate-500'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                      checked ? 'bg-amber-500 border-amber-500' : 'border-slate-600'
                    }`}>
                      {checked && <CheckIcon className="w-2.5 h-2.5 text-slate-950" />}
                    </div>
                    <Icon className={`w-4 h-4 flex-shrink-0 ${checked ? 'text-amber-400' : 'text-slate-600'}`} />
                    <span className="text-sm">{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Input */}
            <div className="space-y-2">
              <input
                type="text"
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="Email o número de WhatsApp"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500/60 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none transition-colors"
              />
              {error && <p className="text-red-400 text-xs px-1">{error}</p>}

              <button
                onClick={submit}
                disabled={loading || prefs.length === 0}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <BellIcon className="w-4 h-4" />
                )}
                Activar alertas gratis
              </button>

              <button
                onClick={() => close(true)}
                className="w-full text-slate-600 hover:text-slate-400 text-xs py-1.5 transition-colors"
              >
                Ahora no
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
