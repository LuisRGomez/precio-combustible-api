import React, { useState } from 'react';
import { useSEO } from '../hooks/useSEO';
import { Header } from '../components/Header';
import { QuickNav } from '../components/QuickNav';
import { Footer } from '../components/Footer';
import { OnboardingModal } from '../components/OnboardingModal';
import { LoginModal } from '../components/LoginModal';
import { AdSidebar } from '../components/AdSidebar';
import { FlightMap } from '../components/FlightMap';
import { FlightPanel } from '../components/FlightPanel';
import { EmergencyAlert } from '../components/EmergencyAlert';
import { useFlightData, Flight } from '../hooks/useFlightData';
import { useUser } from '../hooks/useUser';
import {
  PlaneIcon, RefreshCwIcon, WifiOffIcon, ClockIcon,
  RouteIcon,
} from 'lucide-react';

// ─── Live badge ───────────────────────────────────────────────────────────────
function LiveBadge({ source }: { source: 'live' | 'stale' | 'offline' }) {
  if (source === 'live') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold">
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        <span className="text-emerald-400">EN VIVO</span>
      </span>
    );
  }
  if (source === 'stale') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
        <ClockIcon className="w-3 h-3" />
        Datos en caché
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
      <WifiOffIcon className="w-3 h-3" />
      Sin conexión
    </span>
  );
}

// ─── Relative time ────────────────────────────────────────────────────────────
function relativeTime(d: Date | null): string {
  if (!d) return '';
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 5)  return 'hace un momento';
  if (sec < 60) return `hace ${sec}s`;
  return `hace ${Math.floor(sec / 60)} min`;
}

// ─── VuelosPage ───────────────────────────────────────────────────────────────
export function VuelosPage() {
  useSEO({
    title:       'Seguimiento de vuelos en tiempo real — Argentina | Tankear',
    description: 'Mapa en tiempo real de todos los vuelos sobre Argentina. Alertas de emergencia, filtros por aerolínea y tipo de aeronave. Gratis, sin registro.',
    canonical:   'https://tankear.com.ar/vuelos',
  });

  const { user, logout }  = useUser();
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [loginOpen,   setLoginOpen]   = useState(false);
  const [selected,    setSelected]    = useState<Flight | null>(null);

  const { flights, loading, error, lastUpdate, source, total, emergencias, refresh } = useFlightData();

  const inFlight = flights.filter(f => !f.onGround).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col">
      <Header
        user={user}
        onCreateAccount={() => setOnboardOpen(true)}
        onLogin={() => setLoginOpen(true)}
        onLogout={logout}
      />
      <OnboardingModal open={onboardOpen} onClose={() => setOnboardOpen(false)} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)}
        onCreateAccount={() => { setLoginOpen(false); setOnboardOpen(true); }} />
      <QuickNav />

      <main className="flex-1 flex flex-col max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-4">

        {/* ── Barra de estado ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <PlaneIcon className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-100">Vuelos en Argentina</h1>
                <p className="text-[10px] text-slate-500">Datos de OpenSky Network</p>
              </div>
            </div>
            <LiveBadge source={source} />
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            {lastUpdate && <span>Act. {relativeTime(lastUpdate)}</span>}
            {!loading && (
              <span className="text-slate-400">
                <span className="font-bold text-amber-400">{inFlight}</span> en vuelo
                {total > inFlight && ` · ${total - inFlight} en tierra`}
              </span>
            )}
            <button onClick={refresh}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-300 transition-colors">
              <RefreshCwIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              {loading ? 'Actualizando…' : 'Actualizar'}
            </button>
          </div>
        </div>

        {/* ── Alertas de emergencia ── */}
        {emergencias.length > 0 && (
          <EmergencyAlert emergencias={emergencias} onSelectFlight={setSelected} />
        )}

        {/* ── Error offline ── */}
        {source === 'offline' && !loading && (
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
            <WifiOffIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div>
              <p className="text-sm text-slate-300 font-medium">Sin datos de vuelos</p>
              <p className="text-xs text-slate-500">{error ?? 'No se pudo conectar con OpenSky Network. Los aeropuertos se muestran de todas formas.'}</p>
            </div>
            <button onClick={refresh}
              className="ml-auto text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors">
              Reintentar
            </button>
          </div>
        )}

        {/* ── Detalle del vuelo seleccionado ── */}
        {selected && (
          <div className="bg-slate-900 border border-amber-500/30 rounded-xl px-4 py-3 flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-amber-400 font-mono">{selected.callsign || selected.icao24}</span>
                <span className="text-xs text-slate-500">{selected.country}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                <span>Alt: <b className="text-slate-200">{selected.altitude.toLocaleString('es-AR')} m</b></span>
                {selected.velocityKmh > 0 && <span>Vel: <b className="text-slate-200">{selected.velocityKmh} km/h</b></span>}
                <span>Heading: <b className="text-slate-200">{selected.heading}°</b></span>
                <span>Vertical: <b className={selected.verticalRate > 0 ? 'text-emerald-400' : selected.verticalRate < 0 ? 'text-blue-400' : 'text-slate-500'}>
                  {selected.verticalRate > 0.5 ? '▲ Subiendo' : selected.verticalRate < -0.5 ? '▼ Bajando' : '— Crucero'}
                </b></span>
                {selected.squawk && <span>Squawk: <b className="text-red-400">{selected.squawk}</b></span>}
              </div>
            </div>
            {/* CTA Tankear exclusivo */}
            <a href={`/viaje#ruta`}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors">
              <RouteIcon className="w-3.5 h-3.5" />
              ¿Conviene manejar?
            </a>
          </div>
        )}

        {/* ── Cuerpo: mapa + panel ── */}
        <div className="flex-1 flex gap-4 min-h-0" style={{ height: 'calc(100vh - 340px)', minHeight: '460px' }}>

          {/* Mapa */}
          <div className="flex-1 min-w-0 rounded-2xl overflow-hidden border border-slate-800 relative">
            {loading && flights.length === 0 && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 gap-3">
                <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                <p className="text-xs text-slate-500">Cargando vuelos…</p>
              </div>
            )}
            <FlightMap
              flights={flights}
              selectedFlight={selected}
              onSelectFlight={f => setSelected(prev => prev?.icao24 === f.icao24 ? null : f)}
            />
          </div>

          {/* Panel lateral */}
          <div className="hidden lg:flex flex-col w-72 xl:w-80 rounded-2xl overflow-hidden border border-slate-800">
            <FlightPanel
              flights={flights}
              selectedFlight={selected}
              onSelectFlight={f => setSelected(prev => prev?.icao24 === f?.icao24 ? null : f)}
            />
          </div>

          {/* AdSidebar solo en XL */}
          <div className="hidden xl:block">
            <AdSidebar />
          </div>
        </div>

        {/* Panel móvil */}
        <div className="lg:hidden rounded-2xl overflow-hidden border border-slate-800" style={{ height: '320px' }}>
          <FlightPanel
            flights={flights}
            selectedFlight={selected}
            onSelectFlight={f => setSelected(prev => prev?.icao24 === f?.icao24 ? null : f)}
          />
        </div>

      </main>

      <Footer />
    </div>
  );
}
