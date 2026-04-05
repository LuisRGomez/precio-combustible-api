import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FuelIcon, CheckCircleIcon, XCircleIcon, Loader2Icon } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export function VerificarPage() {
  const [searchParams] = useSearchParams();
  const token      = searchParams.get('token');
  const verificado = searchParams.get('verificado');

  const [status, setStatus] = useState<'loading' | 'ok' | 'error' | 'already'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Case 1: redirected after successful verification on backend (?verificado=1)
    if (verificado === '1') {
      setStatus('ok');
      return;
    }

    // Case 2: token in URL, call backend to verify
    if (token) {
      fetch(`${API_BASE}/verificar?token=${encodeURIComponent(token)}`)
        .then(async res => {
          if (res.redirected || res.ok) {
            setStatus('ok');
          } else {
            const data = await res.json().catch(() => ({}));
            setMessage(data.detail || 'El link expiró. Registrate de nuevo.');
            setStatus('error');
          }
        })
        .catch(() => {
          setMessage('No se pudo conectar al servidor. Reintentá en unos minutos.');
          setStatus('error');
        });
      return;
    }

    // No token and no verificado param
    setStatus('error');
    setMessage('Link inválido o expirado.');
  }, [token, verificado]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <FuelIcon className="w-5 h-5 text-amber-500" />
        </div>
        <span className="font-bold text-slate-100 text-lg tracking-tight">Tankear</span>
      </Link>

      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
        {status === 'loading' && (
          <>
            <Loader2Icon className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-300 font-semibold">Verificando tu email...</p>
          </>
        )}

        {status === 'ok' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-slate-100 font-bold text-xl mb-2">¡Email verificado!</h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Tu cuenta está activa. Ya podés iniciar sesión y acceder a todos los precios de combustible.
            </p>
            <Link
              to="/"
              className="block w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-sm transition-colors"
            >
              Ir al inicio e ingresar
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <XCircleIcon className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-slate-100 font-bold text-xl mb-2">Link inválido</h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              {message || 'Este link de verificación ya fue usado o expiró. Registrate de nuevo para obtener uno nuevo.'}
            </p>
            <Link
              to="/"
              className="block w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium py-3 rounded-xl text-sm transition-colors"
            >
              Volver al inicio
            </Link>
          </>
        )}
      </div>

      <p className="text-slate-700 text-xs mt-6">
        ¿Problemas? Escribinos a{' '}
        <a href="mailto:hola@tankear.com.ar" className="text-slate-500 hover:text-slate-400 transition-colors">
          hola@tankear.com.ar
        </a>
      </p>
    </div>
  );
}
