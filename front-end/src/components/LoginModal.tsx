import React, { useState } from 'react';
import { XIcon, FuelIcon, LogInIcon, CheckIcon, EyeIcon, EyeOffIcon, MailIcon } from 'lucide-react';
import { useUser } from '../hooks/useUser';

interface Props {
  open:    boolean;
  onClose: () => void;
  onCreateAccount?: () => void;
}

export function LoginModal({ open, onClose, onCreateAccount }: Props) {
  const { login, loading } = useUser();
  const [mail,       setMail]       = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState(false);

  if (!open) return null;

  const isValidMail = mail.trim().includes('@') && mail.trim().includes('.');
  const isValid = isValidMail && password.length >= 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidMail) { setError('Ingresá un email válido'); return; }
    if (!password)    { setError('Ingresá tu contraseña'); return; }
    setError('');

    const result = await login({
      mail:     mail.trim().toLowerCase(),
      password: password,
    });

    if (result.ok) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setMail('');
        setPassword('');
        onClose();
      }, 1400);
    } else {
      // Show specific messages for common backend errors
      const msg = result.error || '';
      if (msg.toLowerCase().includes('verificá') || msg.toLowerCase().includes('verificar')) {
        setError('Verificá tu email antes de ingresar. Revisá tu bandeja de entrada.');
      } else if (msg.toLowerCase().includes('bloqueada') || msg.toLowerCase().includes('bloqueado')) {
        setError(msg);
      } else {
        setError('Email o contraseña incorrectos');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <XIcon className="w-4 h-4" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <FuelIcon className="w-4 h-4 text-amber-500" />
          </div>
          <span className="font-bold text-slate-100 text-sm">Tankear</span>
        </div>

        {success ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
              <CheckIcon className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-slate-200 font-semibold">¡Bienvenido de vuelta!</p>
            <p className="text-slate-500 text-xs mt-1">Sesión iniciada correctamente.</p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-slate-100 mb-1">Iniciar sesión</h2>
            <p className="text-slate-500 text-xs mb-5">
              Ingresá con el email y contraseña de tu cuenta.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Email */}
              <div className="relative">
                <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  value={mail}
                  onChange={e => { setMail(e.target.value); setError(''); }}
                  placeholder="tu@email.com"
                  autoFocus
                  autoComplete="email"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500/60 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500/60 rounded-xl px-4 pr-10 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <p className="text-red-400 text-xs px-1 leading-relaxed">{error}</p>
              )}

              <button
                type="submit"
                disabled={!isValid || loading}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm mt-1"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <LogInIcon className="w-4 h-4" />
                )}
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-800 text-center">
              <p className="text-slate-600 text-xs">
                ¿No tenés cuenta?{' '}
                <button
                  onClick={() => { onClose(); onCreateAccount?.(); }}
                  className="text-amber-500 hover:text-amber-400 transition-colors"
                >
                  Crear cuenta gratis
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
