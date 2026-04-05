import React, { useMemo, useState } from 'react';
import {
  PlaneTakeoffIcon, PlaneIcon, PlaneLandingIcon,
  GlobeIcon, BarChart2Icon, SearchIcon,
  ArrowUpIcon, ArrowDownIcon, MinusIcon,
} from 'lucide-react';
import { Flight } from '../hooks/useFlightData';
import { getAirline } from '../data/airlines';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function categoryLabel(cat: number): string {
  const map: Record<number, string> = {
    2: 'Liviano', 3: 'Pequeño', 4: 'Grande', 5: 'B-757', 6: 'Pesado',
    7: 'Alta Perf.', 8: 'Helicóptero', 9: 'Planeador', 10: 'Globo',
    11: 'Paracaidista', 12: 'Ultraliviano', 14: 'Dron', 15: 'Espacial',
  };
  return map[cat] ?? 'Aeronave';
}

function vertIcon(rate: number) {
  if (rate > 0.5)  return <ArrowUpIcon   className="w-3 h-3 text-emerald-400" />;
  if (rate < -0.5) return <PlaneLandingIcon className="w-3 h-3 text-blue-400" />;
  return               <MinusIcon className="w-3 h-3 text-slate-600" />;
}

// ─── FlightCard ───────────────────────────────────────────────────────────────
function FlightCard({ f, onClick }: { f: Flight; onClick: () => void }) {
  const airline = getAirline(f.callsign);
  const cs = f.callsign || f.icao24.toUpperCase();

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/60 transition-colors group"
    >
      {/* Airline color bar */}
      <div
        className="w-1 h-8 rounded-full flex-shrink-0"
        style={{ backgroundColor: airline?.color ?? '#475569' }}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-200 font-mono">{cs}</span>
          {airline && <span className="text-[9px] text-slate-600">{airline.nombre}</span>}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
          <span>{f.country}</span>
          <span>·</span>
          <span>{f.altitude.toLocaleString('es-AR')} m</span>
          {f.velocityKmh > 0 && <><span>·</span><span>{f.velocityKmh} km/h</span></>}
        </div>
      </div>

      {/* Vertical rate */}
      <div className="flex-shrink-0">{vertIcon(f.verticalRate)}</div>
    </button>
  );
}

// ─── FlightPanel ──────────────────────────────────────────────────────────────
interface Props {
  flights:         Flight[];
  selectedFlight:  Flight | null;
  onSelectFlight:  (f: Flight | null) => void;
}

type FilterType = 'todos' | 'vuelo' | 'tierra' | 'helicoptero' | 'drone';

export function FlightPanel({ flights, selectedFlight, onSelectFlight }: Props) {
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState<FilterType>('vuelo');
  const [activeTab,  setActiveTab]  = useState<'lista' | 'stats'>('lista');

  // ── Stats globales ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const inFlight  = flights.filter(f => !f.onGround);
    const ascending = inFlight.filter(f => f.verticalRate > 0.5);
    const descending= inFlight.filter(f => f.verticalRate < -0.5);

    // Países más frecuentes
    const countries: Record<string, number> = {};
    inFlight.forEach(f => { countries[f.country] = (countries[f.country] ?? 0) + 1; });
    const topCountries = Object.entries(countries)
      .sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Aerolíneas más activas
    const airlines: Record<string, number> = {};
    inFlight.forEach(f => {
      const a = getAirline(f.callsign);
      if (a) airlines[a.nombre] = (airlines[a.nombre] ?? 0) + 1;
    });
    const topAirlines = Object.entries(airlines)
      .sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { total: flights.length, inFlight: inFlight.length, ascending: ascending.length, descending: descending.length, topCountries, topAirlines };
  }, [flights]);

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return flights
      .filter(f => {
        if (filter === 'vuelo')      return !f.onGround;
        if (filter === 'tierra')     return f.onGround;
        if (filter === 'helicoptero')return f.category === 8;
        if (filter === 'drone')      return f.category === 14;
        return true;
      })
      .filter(f => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          f.callsign.toLowerCase().includes(q) ||
          f.icao24.toLowerCase().includes(q)   ||
          f.country.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.altitude - a.altitude); // más altos primero
  }, [flights, filter, search]);

  const FILTER_BUTTONS: { id: FilterType; label: string }[] = [
    { id: 'todos',       label: 'Todos'    },
    { id: 'vuelo',       label: 'En vuelo' },
    { id: 'helicoptero', label: 'Heli'     },
    { id: 'drone',       label: 'Dron'     },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 border-l border-slate-800">

      {/* Tabs */}
      <div className="grid grid-cols-2 border-b border-slate-800 flex-shrink-0">
        {([['lista', 'Vuelos', PlaneIcon], ['stats', 'Stats', BarChart2Icon]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors relative ${
              activeTab === id ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />{label}
            {activeTab === id && <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-amber-500 rounded-full" />}
          </button>
        ))}
      </div>

      {/* ── Tab: Lista ─────────────────────────────────────────────────────── */}
      {activeTab === 'lista' && (
        <>
          {/* Buscador */}
          <div className="px-3 pt-3 pb-2 flex-shrink-0">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Callsign, ICAO, país..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-slate-700 transition-colors" />
            </div>
          </div>

          {/* Filtros rápidos */}
          <div className="flex gap-1 px-3 pb-2 flex-shrink-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {FILTER_BUTTONS.map(btn => (
              <button key={btn.id} onClick={() => setFilter(btn.id)}
                className={`flex-shrink-0 text-[10px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filter === btn.id
                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                    : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {btn.label}
              </button>
            ))}
            <span className="flex-shrink-0 text-[10px] text-slate-700 ml-auto self-center pr-1">
              {filtered.length} vuelos
            </span>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="text-center py-8 text-slate-600 text-xs">Sin vuelos con ese filtro</div>
            )}
            {filtered.map(f => (
              <FlightCard key={f.icao24} f={f}
                onClick={() => onSelectFlight(selectedFlight?.icao24 === f.icao24 ? null : f)} />
            ))}
          </div>
        </>
      )}

      {/* ── Tab: Stats ─────────────────────────────────────────────────────── */}
      {activeTab === 'stats' && (
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">

          {/* Resumen */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'En vuelo', value: stats.inFlight, color: 'text-amber-400' },
              { label: 'En tierra', value: stats.total - stats.inFlight, color: 'text-slate-400' },
              { label: 'Ascendiendo', value: stats.ascending, color: 'text-emerald-400' },
              { label: 'Descendiendo', value: stats.descending, color: 'text-blue-400' },
            ].map(s => (
              <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-slate-600">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Top países */}
          {stats.topCountries.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GlobeIcon className="w-3 h-3 text-slate-600" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Países</span>
              </div>
              <div className="space-y-1.5">
                {stats.topCountries.map(([country, count]) => {
                  const pct = Math.round((count / Math.max(stats.inFlight, 1)) * 100);
                  return (
                    <div key={country} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-28 truncate">{country}</span>
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-600 w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top aerolíneas */}
          {stats.topAirlines.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <PlaneTakeoffIcon className="w-3 h-3 text-slate-600" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Aerolíneas activas</span>
              </div>
              <div className="space-y-1.5">
                {stats.topAirlines.map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 truncate">{name}</span>
                    <span className="text-slate-600 font-mono">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
