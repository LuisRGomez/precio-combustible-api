import React, { useState } from 'react';
import { BellIcon, XIcon, CheckCircleIcon, MailIcon, PhoneIcon } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '';
const STORAGE_KEY = 'tankear_lead_v1';

export function LeadCaptureForm({ zona }: { zona?: string }) {
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem(STORAGE_KEY) === 'done'
  );
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [mail, setMail]           = useState('');
  const [celular, setCelular]     = useState('');
  const [error, setError]         = useState('');

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'done');
    setDismissed(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMail    = mail.trim();
    const cleanCelular = celular.trim();
    if (!cleanMail && !cleanCelular) {
      setError('Ingresá al menos un email o número de WhatsApp');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mail:         cleanMail   || null,
          celular:      cleanCelular || null,
          zona:         zona        || null,
          pagina_origen: 'combustible',
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Error al guardar');
      }
      setSubmitted(true);
      localStorage.setItem(STORAGE_KEY, 'done');
    } catch (err: any) {
      setError(err.message || 'Algo salió mal, intentá de nuevo');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 flex items-start gap-3">
        <CheckCircleIcon className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-emerald-400 font-semibold text-sm">
            ¡Listo! Te avisamos cuando cambien los precios.
          </p>
          <p className="text-slate-400 text-xs mt-1">
            {mail    && 'Revisá tu casilla de email. '}
            {celular && 'También te llegará por WhatsApp.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-slate-900 border border-amber-500/20 rounded-xl p-5">
      {/* Cerrar */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-slate-600 hover:text-slate-400 transition-colors"
        aria-label="Cerrar">
        <XIcon className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2 mb-1.5">
        <BellIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <h3 className="text-slate-200 font-semibold text-sm">Alertas de precio</h3>
      </div>
      <p className="text-slate-400 text-xs mb-4 leading-relaxed">
        Te avisamos cuando cambien los precios
        {zona ? <span className="text-slate-300"> en {zona}</span> : ' en tu zona'}.{' '}
        <span className="text-slate-500">Sin spam.</span>
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-2.5">
        {/* Email */}
        <div className="relative">
          <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          <input
            type="email"
            value={mail}
            onChange={(e) => setMail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500/50 rounded-lg pl-8 pr-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none transition-colors"
          />
        </div>

        {/* WhatsApp */}
        <div className="relative">
          <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          <input
            type="tel"
            value={celular}
            onChange={(e) => setCelular(e.target.value)}
            placeholder="WhatsApp  (ej: 1134567890)"
            autoComplete="tel"
            className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500/50 rounded-lg pl-8 pr-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none transition-colors"
          />
        </div>

        {error && (
          <p className="text-red-400 text-xs pl-1">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            '🔔  Avisame cuando cambien'
          )}
        </button>
      </form>

      <p className="text-slate-600 text-xs text-center mt-3">
        Podés cancelar en cualquier momento.
      </p>
    </div>
  );
}
