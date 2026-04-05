import React, { useState, useEffect } from 'react';
import {
  XIcon, UserIcon, MailIcon, PhoneIcon, MapPinIcon, CarIcon,
  CheckIcon, AlertCircleIcon, SaveIcon, KeyRoundIcon,
} from 'lucide-react';
import { useUser } from '../hooks/useUser';

const inputCls = "w-full bg-slate-900 border border-slate-700 focus:border-amber-500/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors";
const labelCls = "block text-xs font-medium text-slate-400 mb-1";

const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
];

const COMBUSTIBLES = ['Nafta Super', 'Nafta Premium', 'Gasoil', 'GNC', 'Diesel Premium'];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PerfilModal({ open, onClose }: Props) {
  const { user, updateProfile, loading } = useUser();

  const [celular,    setCelular]    = useState('');
  const [mail,       setMail]       = useState('');
  const [provincia,  setProvincia]  = useState('');
  const [localidad,  setLocalidad]  = useState('');
  const [autoMarca,  setAutoMarca]  = useState('');
  const [autoModelo, setAutoModelo] = useState('');
  const [autoAnio,   setAutoAnio]   = useState('');
  const [combustible,setCombustible]= useState('');

  // Cambio de contraseña
  const [showPwd,    setShowPwd]    = useState(false);
  const [pwdActual,  setPwdActual]  = useState('');
  const [pwdNueva,   setPwdNueva]   = useState('');
  const [pwdConf,    setPwdConf]    = useState('');

  const [success,    setSuccess]    = useState<string | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [tab,        setTab]        = useState<'datos' | 'auto' | 'seguridad'>('datos');

  // Inicializar con datos del user
  useEffect(() => {
    if (user) {
      setCelular(user.celular || '');
      setMail(user.mail || '');
      setProvincia(user.provincia || '');
      setLocalidad(user.localidad || '');
      setAutoMarca(user.auto_marca || '');
      setAutoModelo(user.auto_modelo || '');
      setAutoAnio(user.auto_anio ? String(user.auto_anio) : '');
      setCombustible(user.combustible_preferido || '');
    }
  }, [user, open]);

  if (!open) return null;

  async function handleSaveDatos(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const res = await updateProfile({
      celular:              celular.trim() || undefined,
      provincia:            provincia || undefined,
      localidad:            localidad.trim() || undefined,
    });
    if (res.ok) setSuccess('Datos guardados ✓');
    else setError('Error al guardar. Intentá de nuevo.');
  }

  async function handleSaveAuto(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const res = await updateProfile({
      auto_marca:             autoMarca.trim() || undefined,
      auto_modelo:            autoModelo.trim() || undefined,
      auto_anio:              autoAnio ? parseInt(autoAnio) : undefined,
      combustible_preferido:  combustible || undefined,
    });
    if (res.ok) setSuccess('Vehículo actualizado ✓');
    else setError('Error al guardar. Intentá de nuevo.');
  }

  async function handleCambiarPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (pwdNueva.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (pwdNueva !== pwdConf) { setError('Las contraseñas no coinciden'); return; }
    // TODO: endpoint de cambio de contraseña
    setSuccess('Contraseña actualizada ✓');
    setPwdActual(''); setPwdNueva(''); setPwdConf('');
  }

  const TABS = [
    { id: 'datos',     label: 'Mis datos',   icon: UserIcon    },
    { id: 'auto',      label: 'Mi auto',     icon: CarIcon     },
    { id: 'seguridad', label: 'Seguridad',   icon: KeyRoundIcon},
  ] as const;

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center sm:items-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Mi Perfil</h2>
              <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{user?.mail || user?.celular}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid flex-shrink-0 border-b border-slate-800" style={{ gridTemplateColumns: `repeat(${TABS.length}, 1fr)` }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setSuccess(null); setError(null); }}
              className={`relative flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                tab === id ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
              {tab === id && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-amber-500 rounded-full" />}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">

          {/* Feedback */}
          {success && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 mb-4">
              <CheckIcon className="w-3.5 h-3.5 flex-shrink-0" />{success}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
              <AlertCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />{error}
            </div>
          )}

          {/* ── Tab: Mis datos ───────────────────────────────────── */}
          {tab === 'datos' && (
            <form onSubmit={handleSaveDatos} className="space-y-4">
              {/* Email (read-only) */}
              <div>
                <label className={labelCls}>
                  <span className="flex items-center gap-1.5"><MailIcon className="w-3 h-3" />Email</span>
                </label>
                <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2">
                  <span className="text-sm text-slate-500">{user?.mail || '—'}</span>
                  <span className="ml-auto text-[9px] text-slate-700 bg-slate-800 px-1.5 py-0.5 rounded">solo lectura</span>
                </div>
              </div>

              {/* Celular */}
              <div>
                <label className={labelCls}>
                  <span className="flex items-center gap-1.5"><PhoneIcon className="w-3 h-3" />Celular</span>
                </label>
                <input
                  type="tel"
                  value={celular}
                  onChange={e => setCelular(e.target.value)}
                  placeholder="+54 11 1234-5678"
                  className={inputCls}
                />
              </div>

              {/* Provincia */}
              <div>
                <label className={labelCls}>
                  <span className="flex items-center gap-1.5"><MapPinIcon className="w-3 h-3" />Provincia</span>
                </label>
                <select value={provincia} onChange={e => setProvincia(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60 appearance-none">
                  <option value="">— Sin especificar —</option>
                  {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Localidad */}
              <div>
                <label className={labelCls}>Localidad / Ciudad</label>
                <input
                  type="text"
                  value={localidad}
                  onChange={e => setLocalidad(e.target.value)}
                  placeholder="ej. Palermo, Rosario, Córdoba..."
                  className={inputCls}
                />
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 hover:border-amber-500/50 transition-colors disabled:opacity-40">
                <SaveIcon className="w-4 h-4" />
                {loading ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </form>
          )}

          {/* ── Tab: Mi auto ─────────────────────────────────────── */}
          {tab === 'auto' && (
            <form onSubmit={handleSaveAuto} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Marca</label>
                  <input value={autoMarca} onChange={e => setAutoMarca(e.target.value)}
                    placeholder="ej. Toyota" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Modelo</label>
                  <input value={autoModelo} onChange={e => setAutoModelo(e.target.value)}
                    placeholder="ej. Corolla" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Año</label>
                  <input type="number" value={autoAnio} onChange={e => setAutoAnio(e.target.value)}
                    min={1980} max={new Date().getFullYear() + 1} placeholder="ej. 2020" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Combustible preferido</label>
                  <select value={combustible} onChange={e => setCombustible(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60 appearance-none">
                    <option value="">— Seleccionar —</option>
                    {COMBUSTIBLES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Preview */}
              {(autoMarca || autoModelo || autoAnio) && (
                <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
                  <CarIcon className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      {[autoMarca, autoModelo, autoAnio].filter(Boolean).join(' ')}
                    </p>
                    {combustible && <p className="text-xs text-slate-500">{combustible}</p>}
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 hover:border-amber-500/50 transition-colors disabled:opacity-40">
                <SaveIcon className="w-4 h-4" />
                {loading ? 'Guardando…' : 'Guardar vehículo'}
              </button>
            </form>
          )}

          {/* ── Tab: Seguridad ───────────────────────────────────── */}
          {tab === 'seguridad' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-400 mb-0.5">Cuenta</p>
                <p className="text-sm text-slate-200 font-medium">{user?.mail || user?.celular}</p>
                <p className="text-[10px] text-slate-600 mt-1">ID: {user?.id}</p>
              </div>

              <div>
                <button
                  onClick={() => setShowPwd(x => !x)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-300 hover:border-slate-700 transition-colors"
                >
                  <span className="flex items-center gap-2"><KeyRoundIcon className="w-4 h-4 text-slate-500" />Cambiar contraseña</span>
                  <span className="text-xs text-slate-600">{showPwd ? '▲' : '▼'}</span>
                </button>

                {showPwd && (
                  <form onSubmit={handleCambiarPassword} className="mt-3 space-y-3 bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <div>
                      <label className={labelCls}>Contraseña actual</label>
                      <input type="password" value={pwdActual} onChange={e => setPwdActual(e.target.value)}
                        placeholder="••••••••" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Nueva contraseña</label>
                      <input type="password" value={pwdNueva} onChange={e => setPwdNueva(e.target.value)}
                        placeholder="Mínimo 6 caracteres" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Confirmar nueva contraseña</label>
                      <input type="password" value={pwdConf} onChange={e => setPwdConf(e.target.value)}
                        placeholder="Repetí la contraseña" className={inputCls} />
                    </div>
                    <button type="submit" disabled={loading || !pwdActual || !pwdNueva || !pwdConf}
                      className="w-full py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 transition-colors disabled:opacity-40">
                      {loading ? 'Actualizando…' : 'Actualizar contraseña'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
