import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  XIcon, ChevronRightIcon, ChevronLeftIcon, CheckIcon,
  MapPinIcon, BellIcon, CarIcon, EyeIcon, EyeOffIcon, MailIcon,
} from 'lucide-react';
import autosData from '../data/autos.json';
import { useUser, RegisterData } from '../hooks/useUser';

const API_BASE = import.meta.env.VITE_API_BASE || '';
const TURNSTILE_SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY || '1x00000000000000000000AA';

const PROVINCIAS = [
  'BUENOS AIRES','CIUDAD AUTÓNOMA DE BUENOS AIRES','CATAMARCA','CHACO','CHUBUT',
  'CÓRDOBA','CORRIENTES','ENTRE RÍOS','FORMOSA','JUJUY','LA PAMPA','LA RIOJA',
  'MENDOZA','MISIONES','NEUQUÉN','RÍO NEGRO','SALTA','SAN JUAN','SAN LUIS',
  'SANTA CRUZ','SANTA FE','SANTIAGO DEL ESTERO','TIERRA DEL FUEGO','TUCUMÁN',
];

const COMBUSTIBLES: { id: string; label: string; color: string }[] = [
  { id: 'nafta_super',   label: 'Nafta Super',   color: 'bg-blue-500/20 border-blue-500/40 text-blue-300'   },
  { id: 'nafta_premium', label: 'Nafta Premium', color: 'bg-purple-500/20 border-purple-500/40 text-purple-300' },
  { id: 'gasoil',        label: 'Gasoil',        color: 'bg-amber-500/20 border-amber-500/40 text-amber-300'  },
  { id: 'gnc',           label: 'GNC',           color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' },
];

type AutoEntry = {
  marca: string;
  modelo: string;
  version: string;
  anio_desde: number;
  anio_hasta: number;
  combustible: string;
};

const autos = autosData as AutoEntry[];

interface Props {
  open: boolean;
  onClose: () => void;
  initialZona?: { provincia?: string; localidad?: string };
  initialContact?: { mail?: string; celular?: string };
}

type Step = 'zona' | 'contacto' | 'auto';

export function OnboardingModal({ open, onClose, initialZona, initialContact }: Props) {
  const { register, loading } = useUser();

  const [step, setStep]                   = useState<Step>('zona');
  const [leaving, setLeaving]             = useState(false);
  const [error, setError]                 = useState('');

  // Step 1 — Zona
  const [provincia, setProvincia]         = useState(initialZona?.provincia || '');
  const [localidad, setLocalidad]         = useState(initialZona?.localidad || '');
  const [localidades, setLocalidades]     = useState<string[]>([]);
  const [loadingLoc, setLoadingLoc]       = useState(false);

  // Step 2 — Contacto (now: email + password + captcha)
  const [mail, setMail]                   = useState(initialContact?.mail || '');
  const [password, setPassword]           = useState('');
  const [showPass, setShowPass]           = useState(false);
  const [captchaToken, setCaptchaToken]   = useState('');
  const turnstileRef                      = useRef<HTMLDivElement>(null);
  const widgetIdRef                       = useRef<string | null>(null);

  // Step 3 — Auto
  const [marcaFilter, setMarcaFilter]     = useState('');
  const [selectedMarca, setSelectedMarca] = useState('');
  const [selectedModelo, setSelectedModelo] = useState('');
  const [selectedAnio, setSelectedAnio]   = useState('');
  const [combustible, setCombustible]     = useState('');

  // Pending verification state (post-registration)
  const [pendingMail, setPendingMail]     = useState('');

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('zona');
      setError('');
      setLeaving(false);
      setProvincia(initialZona?.provincia || '');
      setLocalidad(initialZona?.localidad || '');
      setMail(initialContact?.mail || '');
      setPassword('');
      setCaptchaToken('');
      setSelectedMarca('');
      setSelectedModelo('');
      setSelectedAnio('');
      setCombustible('');
      setPendingMail('');
      widgetIdRef.current = null;
    }
  }, [open]);

  // Fetch localidades when provincia changes
  useEffect(() => {
    if (!provincia) { setLocalidades([]); return; }
    setLoadingLoc(true);
    fetch(`${API_BASE}/localidades?provincia=${encodeURIComponent(provincia)}`)
      .then(r => r.json())
      .then((data: string[]) => setLocalidades(data || []))
      .catch(() => setLocalidades([]))
      .finally(() => setLoadingLoc(false));
  }, [provincia]);

  // Mount Turnstile widget when step = contacto
  useEffect(() => {
    if (step !== 'contacto' || !open) return;

    const tryRender = () => {
      const w = (window as any).turnstile;
      if (!w || !turnstileRef.current || widgetIdRef.current) return;
      widgetIdRef.current = w.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITEKEY,
        callback: (token: string) => setCaptchaToken(token),
        'expired-callback': () => setCaptchaToken(''),
        theme: 'dark',
        size: 'normal',
      });
    };

    if ((window as any).turnstile) {
      tryRender();
    } else {
      const interval = setInterval(() => {
        if ((window as any).turnstile) {
          clearInterval(interval);
          tryRender();
        }
      }, 250);
      return () => clearInterval(interval);
    }
  }, [step, open]);

  // Car derived data
  const marcas = useMemo(() => [...new Set(autos.map(a => a.marca))].sort(), []);

  const modelosFiltrados = useMemo(() =>
    selectedMarca
      ? [...new Set(autos.filter(a => a.marca === selectedMarca).map(a => a.modelo))].sort()
      : [],
    [selectedMarca]);

  const aniosFiltrados = useMemo(() => {
    if (!selectedMarca || !selectedModelo) return [];
    const entry = autos.find(a => a.marca === selectedMarca && a.modelo === selectedModelo);
    if (!entry) return [];
    const years: number[] = [];
    for (let y = entry.anio_hasta; y >= entry.anio_desde; y--) years.push(y);
    return years;
  }, [selectedMarca, selectedModelo]);

  // Auto-fill combustible when model is selected
  useEffect(() => {
    if (selectedMarca && selectedModelo) {
      const entry = autos.find(a => a.marca === selectedMarca && a.modelo === selectedModelo);
      if (entry) setCombustible(entry.combustible);
    }
  }, [selectedMarca, selectedModelo]);

  const close = () => {
    setLeaving(true);
    setTimeout(onClose, 280);
  };

  const nextStep = () => {
    setError('');
    if (step === 'zona') {
      if (!provincia) { setError('Seleccioná tu provincia'); return; }
      setStep('contacto');
    } else if (step === 'contacto') {
      const trimMail = mail.trim().toLowerCase();
      if (!trimMail || !trimMail.includes('@') || !trimMail.includes('.')) {
        setError('Ingresá un email válido'); return;
      }
      if (password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres'); return;
      }
      if (!captchaToken) {
        setError('Completá la verificación de seguridad'); return;
      }
      setStep('auto');
    }
  };

  const prevStep = () => {
    setError('');
    if (step === 'contacto') {
      setStep('zona');
      // Reset captcha widget on going back
      widgetIdRef.current = null;
    }
    if (step === 'auto') setStep('contacto');
  };

  const submit = async (skipAuto = false) => {
    const trimMail = mail.trim().toLowerCase();

    const data: RegisterData = {
      mail:          trimMail,
      password:      password,
      captcha_token: captchaToken,
      provincia:     provincia || undefined,
      localidad:     localidad || undefined,
      preferencias:  ['precios', 'noticias', 'cotizador'],
    };

    if (!skipAuto && selectedMarca && selectedModelo) {
      data.auto_marca  = selectedMarca;
      data.auto_modelo = selectedModelo;
      data.auto_anio   = selectedAnio ? parseInt(selectedAnio) : undefined;
      data.combustible_preferido = combustible || undefined;
    }

    const result = await register(data);
    if (result.ok) {
      if (result.pendingVerification) {
        // Show pending verification state
        setPendingMail(result.mail);
      } else {
        close();
      }
    } else {
      setError(result.error || 'Algo salió mal, reintentá');
      // Reset captcha on error
      const w = (window as any).turnstile;
      if (w && widgetIdRef.current) {
        try { w.reset(widgetIdRef.current); } catch {}
        setCaptchaToken('');
      }
    }
  };

  if (!open) return null;

  const steps: Step[] = ['zona', 'contacto', 'auto'];
  const stepIndex = steps.indexOf(step);

  // ── Pending verification screen ──
  if (pendingMail) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-opacity duration-280 ${leaving ? 'opacity-0' : 'opacity-100'}`}
        style={{ backgroundColor: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(4px)' }}
        onClick={close}
      >
        <div
          className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-center"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <MailIcon className="w-7 h-7 text-amber-400" />
          </div>
          <h3 className="text-slate-100 font-bold text-base mb-2">¡Ya casi!</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Te mandamos un link de verificación a{' '}
            <span className="text-amber-400 font-medium">{pendingMail}</span>.
            Hacé click en el link para activar tu cuenta.
          </p>
          <p className="text-slate-600 text-xs mt-3">Revisá también la carpeta de spam.</p>
          <button
            onClick={close}
            className="mt-5 w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-opacity duration-280 ${leaving ? 'opacity-0' : 'opacity-100'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(4px)' }}
      onClick={close}
    >
      <div
        className={`w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl transition-all duration-280 ${leaving ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i <= stepIndex ? 'bg-amber-500' : 'bg-slate-700'
                } ${i === stepIndex ? 'w-6' : 'w-3'}`}
              />
            ))}
          </div>
          <button onClick={close} className="text-slate-600 hover:text-slate-300 transition-colors">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-5">
          {/* ── Step 1: Zona ── */}
          {step === 'zona' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <MapPinIcon className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base leading-tight">¿Dónde cargás?</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Para alertas de tu zona</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Provincia</label>
                  <select
                    value={provincia}
                    onChange={e => { setProvincia(e.target.value); setLocalidad(''); }}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500/60 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none transition-colors"
                  >
                    <option value="">Seleccioná provincia...</option>
                    {PROVINCIAS.map(p => (
                      <option key={p} value={p}>{p === 'CIUDAD AUTÓNOMA DE BUENOS AIRES' ? 'CABA' : p}</option>
                    ))}
                  </select>
                </div>

                {provincia && (
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Localidad (opcional)</label>
                    {loadingLoc ? (
                      <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
                        <span className="w-3 h-3 border-2 border-slate-600 border-t-amber-500 rounded-full animate-spin" />
                        Cargando localidades...
                      </div>
                    ) : (
                      <select
                        value={localidad}
                        onChange={e => setLocalidad(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500/60 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none transition-colors"
                      >
                        <option value="">Toda la provincia</option>
                        {localidades.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Step 2: Contacto + Password + CAPTCHA ── */}
          {step === 'contacto' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <BellIcon className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base leading-tight">Crear cuenta</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Para guardar alertas y preferencias</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Email */}
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Email</label>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                    <input
                      type="email"
                      value={mail}
                      onChange={e => { setMail(e.target.value); setError(''); }}
                      placeholder="tu@email.com"
                      autoFocus
                      autoComplete="email"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500/60 rounded-xl px-4 pr-10 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPass ? <EyeOffIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {password.length > 0 && password.length < 8 && (
                    <p className="text-slate-600 text-xs mt-1">
                      {8 - password.length} caracteres más
                    </p>
                  )}
                </div>

                {/* Turnstile CAPTCHA */}
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Verificación de seguridad</label>
                  <div ref={turnstileRef} className="min-h-[65px]" />
                  {!captchaToken && (
                    <p className="text-slate-600 text-xs mt-1">Completá la verificación de arriba</p>
                  )}
                  {captchaToken && (
                    <p className="text-emerald-500 text-xs mt-1 flex items-center gap-1">
                      <CheckIcon className="w-3 h-3" /> Verificado
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Step 3: Auto ── */}
          {step === 'auto' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <CarIcon className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base leading-tight">¿Qué auto manejás?</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Opcional — para el cotizador personalizado</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Marca filter + select */}
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Marca</label>
                  <input
                    type="text"
                    value={marcaFilter}
                    onChange={e => setMarcaFilter(e.target.value)}
                    placeholder="Buscar marca..."
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500/60 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none transition-colors mb-1.5"
                  />
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {marcas
                      .filter(m => !marcaFilter || m.toLowerCase().includes(marcaFilter.toLowerCase()))
                      .map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => { setSelectedMarca(m); setSelectedModelo(''); setSelectedAnio(''); setMarcaFilter(''); }}
                          className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                            selectedMarca === m
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Modelo */}
                {selectedMarca && (
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Modelo</label>
                    <select
                      value={selectedModelo}
                      onChange={e => { setSelectedModelo(e.target.value); setSelectedAnio(''); }}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500/60 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none transition-colors"
                    >
                      <option value="">Seleccioná modelo...</option>
                      {modelosFiltrados.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                )}

                {/* Año */}
                {selectedModelo && aniosFiltrados.length > 0 && (
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Año</label>
                    <select
                      value={selectedAnio}
                      onChange={e => setSelectedAnio(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500/60 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none transition-colors"
                    >
                      <option value="">Seleccioná año...</option>
                      {aniosFiltrados.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                )}

                {/* Combustible */}
                {selectedModelo && (
                  <div>
                    <label className="text-xs text-slate-500 mb-1.5 block">Combustible</label>
                    <div className="flex flex-wrap gap-2">
                      {COMBUSTIBLES.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCombustible(c.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                            combustible === c.id ? c.color : 'bg-slate-800 border-slate-700 text-slate-500'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Error */}
          {error && <p className="text-red-400 text-xs mt-3 px-1 leading-relaxed">{error}</p>}

          {/* Actions */}
          <div className="mt-5 space-y-2">
            {step !== 'auto' ? (
              <button
                onClick={nextStep}
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
              >
                Continuar
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => submit(false)}
                  disabled={loading || !selectedMarca}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <CheckIcon className="w-4 h-4" />
                  )}
                  {selectedMarca ? 'Guardar y activar alertas' : 'Seleccioná un auto...'}
                </button>
                <button
                  onClick={() => submit(true)}
                  disabled={loading}
                  className="w-full text-slate-500 hover:text-slate-300 text-xs py-1.5 transition-colors"
                >
                  Saltar este paso
                </button>
              </>
            )}

            {step !== 'zona' && (
              <button
                onClick={prevStep}
                className="w-full flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-400 text-xs py-1 transition-colors"
              >
                <ChevronLeftIcon className="w-3.5 h-3.5" />
                Volver
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
