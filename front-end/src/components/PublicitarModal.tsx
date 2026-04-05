import React, { useState } from 'react';
import {
  XIcon,
  MegaphoneIcon,
  SendIcon,
  CheckIcon,
  MailIcon,
  PhoneIcon,
  BuildingIcon,
  UserIcon,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

interface Props {
  open: boolean;
  onClose: () => void;
}

type TipoPublicidad = 'banner' | 'sponsor' | 'nota_patrocinada' | 'otro';

interface FormState {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  tipo: TipoPublicidad;
  mensaje: string;
}

const TIPO_OPTIONS: { value: TipoPublicidad; label: string }[] = [
  { value: 'banner',           label: 'Banner publicitario'  },
  { value: 'sponsor',          label: 'Sponsoreo de sección' },
  { value: 'nota_patrocinada', label: 'Nota patrocinada'     },
  { value: 'otro',             label: 'Otro'                 },
];

const EMPTY_FORM: FormState = {
  nombre:   '',
  empresa:  '',
  email:    '',
  telefono: '',
  tipo:     'banner',
  mensaje:  '',
};

export function PublicitarModal({ open, onClose }: Props) {
  const [form,    setForm]    = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      setError('');
    };

  const isValidEmail = form.email.trim().includes('@') && form.email.trim().includes('.');
  const isValid =
    form.nombre.trim().length > 0 &&
    isValidEmail &&
    form.mensaje.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) { setError('Ingresá tu nombre.'); return; }
    if (!isValidEmail)        { setError('Ingresá un email válido.'); return; }
    if (!form.mensaje.trim()) { setError('Escribí un mensaje.'); return; }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/contacto/publicidad`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:   form.nombre.trim(),
          empresa:  form.empresa.trim() || undefined,
          email:    form.email.trim().toLowerCase(),
          telefono: form.telefono.trim() || undefined,
          tipo:     form.tipo,
          mensaje:  form.mensaje.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { detail?: string }).detail || 'Error al enviar el mensaje.');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // reset after animation
    setTimeout(() => {
      setForm(EMPTY_FORM);
      setError('');
      setSuccess(false);
    }, 200);
  };

  /* ─── Input class helper ──────────────────────────────────────────────── */
  const inputCls =
    'w-full bg-slate-950 border border-slate-700 focus:border-amber-500/60 ' +
    'rounded-xl py-3 text-sm text-slate-200 placeholder-slate-600 ' +
    'focus:outline-none transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">

        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <XIcon className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <MegaphoneIcon className="w-4 h-4 text-amber-500" />
          </div>
          <span className="font-bold text-slate-100 text-sm">Tankear</span>
        </div>

        {/* ── Success screen ── */}
        {success ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckIcon className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-slate-100 font-bold text-lg mb-1">¡Gracias!</p>
            <p className="text-slate-400 text-sm leading-relaxed">
              Recibimos tu consulta. Te contactamos pronto.
            </p>
            <button
              onClick={handleClose}
              className="mt-6 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-colors"
            >
              Cerrar
            </button>
          </div>

        ) : (
          /* ── Form ── */
          <>
            <h2 className="text-lg font-bold text-slate-100 mb-1">Publicitá en Tankear</h2>
            <p className="text-slate-500 text-xs mb-5 leading-relaxed">
              Completá el formulario y te explicamos las opciones disponibles.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">

              {/* Nombre */}
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={form.nombre}
                  onChange={set('nombre')}
                  placeholder="Tu nombre *"
                  autoFocus
                  autoComplete="name"
                  className={`${inputCls} pl-10 pr-4`}
                />
              </div>

              {/* Empresa (optional) */}
              <div className="relative">
                <BuildingIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={form.empresa}
                  onChange={set('empresa')}
                  placeholder="Empresa / marca (opcional)"
                  autoComplete="organization"
                  className={`${inputCls} pl-10 pr-4`}
                />
              </div>

              {/* Email */}
              <div className="relative">
                <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="tu@email.com *"
                  autoComplete="email"
                  className={`${inputCls} pl-10 pr-4`}
                />
              </div>

              {/* Teléfono (optional) */}
              <div className="relative">
                <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={set('telefono')}
                  placeholder="Teléfono (opcional)"
                  autoComplete="tel"
                  className={`${inputCls} pl-10 pr-4`}
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 pl-1">
                  Tipo de publicidad *
                </label>
                <select
                  value={form.tipo}
                  onChange={set('tipo')}
                  className={`${inputCls} px-4 appearance-none cursor-pointer`}
                >
                  {TIPO_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-slate-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mensaje */}
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 pl-1">
                  Mensaje *
                </label>
                <textarea
                  value={form.mensaje}
                  onChange={set('mensaje')}
                  placeholder="Contanos qué tenés en mente, tu objetivo y cualquier detalle relevante."
                  rows={4}
                  maxLength={1000}
                  className={`${inputCls} px-4 resize-none`}
                />
                <p className="text-right text-slate-600 text-xs mt-1 pr-1">
                  {form.mensaje.length}/1000
                </p>
              </div>

              {/* Error */}
              {error && (
                <p className="text-red-400 text-xs px-1 leading-relaxed">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!isValid || loading}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm mt-1"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <SendIcon className="w-4 h-4" />
                )}
                {loading ? 'Enviando...' : 'Enviar consulta'}
              </button>
            </form>

            <p className="text-slate-700 text-xs text-center mt-4 leading-relaxed">
              También podés escribirnos a{' '}
              <a
                href="mailto:publicidad@tankear.com.ar"
                className="text-amber-500/80 hover:text-amber-400 transition-colors"
              >
                publicidad@tankear.com.ar
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
