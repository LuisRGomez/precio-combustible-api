import React, { useEffect, useRef, useState } from 'react';
import {
  FuelIcon, CalendarIcon, UserIcon, LogOutIcon, MapPinIcon,
  CarIcon, ChevronDownIcon, Settings2Icon,
} from 'lucide-react';
import { fetchDatasetInfo, DatasetInfo } from '../utils/api';
import { useUser } from '../hooks/useUser';
import { useClima } from '../hooks/useClima';
import { useClientIP } from '../hooks/useClientIP';
import { useAlertas } from '../hooks/useAlertas';
import { GarageSection } from './garage/GarageSection';
import { PerfilModal } from './PerfilModal';

interface Props {
  user?:            ReturnType<typeof useUser>['user'];
  onCreateAccount?: () => void;
  onLogin?:         () => void;
  onLogout?:        () => void;
  /** @deprecated — ahora el garage se maneja internamente */
  onOpenGarage?:    () => void;
}

function getUserInitials(user: NonNullable<ReturnType<typeof useUser>['user']>): string {
  if (user.mail)    return user.mail.slice(0, 2).toUpperCase();
  if (user.celular) return user.celular.slice(-2);
  return 'TK';
}

function weatherEmoji(desc: string | null): string {
  if (!desc) return '🌡️';
  const d = desc.toLowerCase();
  if (d.includes('tormenta') || d.includes('storm'))    return '⛈️';
  if (d.includes('lluvia') || d.includes('llovizna'))   return '🌧️';
  if (d.includes('nieve') || d.includes('granizo'))     return '🌨️';
  if (d.includes('niebla') || d.includes('neblina'))    return '🌫️';
  if (d.includes('cubierto'))                            return '☁️';
  if (d.includes('parcialmente nublado'))                return '⛅';
  if (d.includes('nublado'))                             return '🌥️';
  if (d.includes('despejado') || d.includes('soleado')) return '☀️';
  return '🌤️';
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function ClimaChip({ clima }: { clima: ReturnType<typeof useClima> }) {
  const emoji = weatherEmoji(clima.descripcion);
  const now   = useClock();
  const fecha = now.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  const hora  = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="hidden lg:flex items-center gap-3">
      <div className="flex items-center gap-2 text-xs bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-1.5 cursor-default select-none">
        <span className="text-base leading-none">{emoji}</span>
        <span className="text-slate-200 font-semibold">{clima.temp}°C</span>
        {clima.descripcion && <span className="text-slate-400">{clima.descripcion}</span>}
        {clima.viento_vel !== null && (
          <span className="text-slate-500 flex items-center gap-1">
            <span>💨</span><span>{clima.viento_vel}km/h{clima.viento_dir ? ` ${clima.viento_dir}` : ''}</span>
          </span>
        )}
        {clima.humedad !== null && (
          <span className="text-slate-500 flex items-center gap-1">
            <span>💧</span><span>{clima.humedad}%</span>
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 text-[11px] text-slate-600">
        <span className="capitalize">{fecha}</span>
        <span>·</span>
        <span className="font-mono">{hora}</span>
      </div>
    </div>
  );
}

function IPChip({ ip }: { ip: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(ip).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="hidden lg:block relative group">
      <button onClick={copy}
        className="flex items-center justify-center w-7 h-7 text-slate-500 hover:text-slate-300 bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 rounded-lg transition-colors"
        aria-label="Ver IP">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      </button>
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 hidden group-hover:block pointer-events-none">
        <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
          <p className="text-[10px] text-slate-500 mb-0.5">{copied ? '¡Copiado!' : 'Click para copiar'}</p>
          <p className="text-xs font-mono text-slate-200 font-semibold">{ip}</p>
        </div>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 rotate-45" />
      </div>
    </div>
  );
}

export function Header({ user, onCreateAccount, onLogin, onLogout }: Props) {
  const [info,         setInfo]         = useState<DatasetInfo | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [garageOpen,   setGarageOpen]   = useState(false);
  const [perfilOpen,   setPerfilOpen]   = useState(false);
  const clima                            = useClima();
  const clientIP                         = useClientIP();
  const dropdownRef                     = useRef<HTMLDivElement>(null);
  const { totalAlertas }                 = useAlertas();

  useEffect(() => { fetchDatasetInfo().then(setInfo); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const lastModified = info?.last_modified
    ? new Date(info.last_modified).toLocaleDateString('es-AR', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null;

  return (
    <>
      <header className="w-full bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
        <div className="h-1 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo + clima */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <FuelIcon className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 leading-tight">Tankear</h1>
              <p className="text-xs text-slate-400 font-medium">Precios en tiempo real</p>
            </div>
            {clima.temp !== null && <ClimaChip clima={clima} />}
            {clientIP && <IPChip ip={clientIP} />}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">

            {lastModified && (
              <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Datos: {lastModified}</span>
              </div>
            )}

            {/* ── Mi Garage — siempre visible ── */}
            {user ? (
              <button
                onClick={() => setGarageOpen(true)}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  totalAlertas > 0
                    ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/20 border border-amber-500/60 text-amber-300 hover:from-amber-500/35 hover:to-orange-500/30 shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:shadow-[0_0_18px_rgba(245,158,11,0.4)]'
                    : 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50'
                }`}
              >
                <div className={`relative flex-shrink-0 ${totalAlertas > 0 ? 'animate-pulse' : ''}`}>
                  <CarIcon className="w-3.5 h-3.5" />
                </div>
                <span className="hidden sm:block">Mi Garage</span>
                {totalAlertas > 0 && (
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] bg-red-500 text-white rounded-full text-[10px] font-bold px-1 shadow-sm animate-bounce">
                    {totalAlertas > 9 ? '9+' : totalAlertas}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={onCreateAccount}
                className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/40 text-amber-400 hover:from-amber-500/25 hover:to-orange-500/20 hover:border-amber-500/60 hover:text-amber-300 transition-all duration-200 group"
              >
                <CarIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:block">Mi Garage</span>
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg">
                  Registrate gratis 🚗
                </span>
              </button>
            )}

            {/* ── User dropdown / auth buttons ── */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(p => !p)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-amber-500/40 transition-colors text-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                    {getUserInitials(user)}
                  </div>
                  <span className="hidden sm:block text-slate-300 max-w-[100px] truncate text-xs">
                    {user.mail || user.celular}
                  </span>
                  <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1 z-50">
                    {/* User info */}
                    <div className="px-4 py-2.5 border-b border-slate-800">
                      <p className="text-xs text-slate-500">Conectado como</p>
                      <p className="text-sm text-slate-200 font-medium truncate">{user.mail || user.celular}</p>
                    </div>

                    {/* Location */}
                    {(user.provincia || user.localidad) && (
                      <div className="px-4 py-2 border-b border-slate-800">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <MapPinIcon className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                          <span className="truncate">{user.localidad || user.provincia}</span>
                        </div>
                      </div>
                    )}

                    {/* Car */}
                    {user.auto_marca && (
                      <div className="px-4 py-2 border-b border-slate-800">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <CarIcon className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                          <span className="truncate">{user.auto_marca} {user.auto_modelo} {user.auto_anio}</span>
                        </div>
                      </div>
                    )}

                    {/* Celular si existe */}
                    {user.celular && user.mail && (
                      <div className="px-4 py-2 border-b border-slate-800">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="text-slate-600">📱</span>
                          <span className="truncate">{user.celular}</span>
                        </div>
                      </div>
                    )}

                    {/* Editar perfil */}
                    <button
                      onClick={() => { setDropdownOpen(false); setPerfilOpen(true); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-slate-400 hover:text-amber-400 hover:bg-amber-500/5 transition-colors"
                    >
                      <Settings2Icon className="w-3.5 h-3.5" />
                      Editar perfil
                    </button>

                    {/* Logout */}
                    <button
                      onClick={() => { setDropdownOpen(false); onLogout?.(); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-colors border-t border-slate-800"
                    >
                      <LogOutIcon className="w-3.5 h-3.5" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={onLogin}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-slate-100 text-xs font-medium transition-colors">
                  <span className="hidden sm:block">Iniciar sesión</span>
                  <span className="sm:hidden">Ingresar</span>
                </button>
                <button onClick={onCreateAccount}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 text-amber-400 text-xs font-semibold transition-colors">
                  <UserIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:block">Crear cuenta</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Garage — disponible en todas las páginas */}
      {garageOpen && <GarageSection onClose={() => setGarageOpen(false)} />}

      {/* Perfil modal */}
      <PerfilModal open={perfilOpen} onClose={() => setPerfilOpen(false)} />
    </>
  );
}
