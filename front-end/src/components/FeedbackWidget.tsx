import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquareIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  XIcon,
  SendIcon,
  CheckIcon,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

type Voto = 'positivo' | 'negativo';
type TipoFeedback = 'sugerencia' | 'bug' | 'otro';

const TIPO_OPTIONS: { value: TipoFeedback; label: string }[] = [
  { value: 'sugerencia', label: 'Sugerencia'       },
  { value: 'bug',        label: 'Algo no funciona' },
  { value: 'otro',       label: 'Otro'             },
];

export function FeedbackWidget() {
  const [open,    setOpen]    = useState(false);
  const [voto,    setVoto]    = useState<Voto | null>(null);
  const [tipo,    setTipo]    = useState<TipoFeedback>('sugerencia');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  /* Close card when clicking outside */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const resetForm = () => {
    setVoto(null);
    setTipo('sugerencia');
    setMensaje('');
    setError('');
    setSuccess(false);
    setLoading(false);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(resetForm, 250);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voto) { setError('Seleccioná si fue una experiencia positiva o negativa.'); return; }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          voto,
          mensaje: mensaje.trim() || undefined,
          pagina:  window.location.pathname,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { detail?: string }).detail || 'Error al enviar.');
      }

      setSuccess(true);
      setTimeout(handleClose, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  /* ─── shared class helpers ──────────────────────────────────────────── */
  const selectCls =
    'w-full bg-slate-950 border border-slate-700 focus:border-amber-500/60 ' +
    'rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none ' +
    'transition-colors appearance-none cursor-pointer';

  const voteBtn = (v: Voto) => {
    const active =
      v === 'positivo'
        ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400'
        : 'bg-red-500/20 border-red-500/60 text-red-400';
    const inactive = 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300';
    return `flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${voto === v ? active : inactive}`;
  };

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Dar feedback"
        className="fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 shadow-lg flex items-center justify-center transition-colors"
      >
        <MessageSquareIcon className="w-5 h-5 text-white" />
      </button>

      {/* ── Feedback card ── */}
      {open && (
        <div
          ref={cardRef}
          className="fixed bottom-[4.5rem] right-4 z-40 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {/* ── Success state ── */}
          {success ? (
            <div className="text-center py-3">
              <div className="w-11 h-11 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                <CheckIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-slate-100 font-semibold text-sm">¡Gracias por tu feedback!</p>
              <p className="text-slate-500 text-xs mt-1">Tu opinión nos ayuda a mejorar.</p>
            </div>

          ) : (
            /* ── Form state ── */
            <>
              {/* Card header */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-100 font-semibold text-sm">¿Cómo podemos mejorar?</p>
                <button
                  onClick={handleClose}
                  className="text-slate-600 hover:text-slate-400 transition-colors"
                  aria-label="Cerrar"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">

                {/* Thumbs row */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setVoto('positivo'); setError(''); }}
                    className={voteBtn('positivo')}
                  >
                    <ThumbsUpIcon className="w-4 h-4" />
                    <span>Buena</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setVoto('negativo'); setError(''); }}
                    className={voteBtn('negativo')}
                  >
                    <ThumbsDownIcon className="w-4 h-4" />
                    <span>Mala</span>
                  </button>
                </div>

                {/* Tipo */}
                <select
                  value={tipo}
                  onChange={e => setTipo(e.target.value as TipoFeedback)}
                  className={selectCls}
                >
                  {TIPO_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-slate-900">
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Mensaje */}
                <div>
                  <textarea
                    value={mensaje}
                    onChange={e => { setMensaje(e.target.value); setError(''); }}
                    placeholder="Contanos más (opcional)"
                    rows={3}
                    maxLength={500}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500/60 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-colors resize-none"
                  />
                  <p className="text-right text-slate-700 text-xs -mt-0.5 pr-1">
                    {mensaje.length}/500
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <p className="text-red-400 text-xs leading-relaxed">{error}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !voto}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-xs"
                >
                  {loading ? (
                    <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <SendIcon className="w-3.5 h-3.5" />
                  )}
                  {loading ? 'Enviando...' : 'Enviar feedback'}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
