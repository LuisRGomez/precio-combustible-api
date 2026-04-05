import React, { useState, useMemo } from 'react';
import {
  BedDoubleIcon, UtensilsIcon, MapPinIcon, StarIcon,
  TentIcon, ShoppingCartIcon, PillIcon, ParkingCircleIcon,
  CoffeeIcon, ChevronDownIcon, ChevronUpIcon,
} from 'lucide-react';
import type { SITHotel } from '../../hooks/useSITHoteles';
import type { RoutePOI, POICategory } from '../../hooks/useRoutePOIs';

// ── Helpers ───────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<POICategory, { label: string; icon: React.ReactNode; color: string }> = {
  restaurant:  { label: 'Restaurante',      icon: <UtensilsIcon className="w-3 h-3" />,       color: 'text-orange-400' },
  cafe:        { label: 'Café / Bar',       icon: <CoffeeIcon className="w-3 h-3" />,          color: 'text-amber-400' },
  fast_food:   { label: 'Comida rápida',    icon: <UtensilsIcon className="w-3 h-3" />,        color: 'text-yellow-400' },
  hotel:       { label: 'Hotel',            icon: <BedDoubleIcon className="w-3 h-3" />,       color: 'text-violet-400' },
  hostel:      { label: 'Hostel',           icon: <BedDoubleIcon className="w-3 h-3" />,       color: 'text-purple-400' },
  camping:     { label: 'Camping',          icon: <TentIcon className="w-3 h-3" />,            color: 'text-emerald-400' },
  rest_area:   { label: 'Área de descanso', icon: <ParkingCircleIcon className="w-3 h-3" />,   color: 'text-sky-300' },
  supermarket: { label: 'Supermercado',     icon: <ShoppingCartIcon className="w-3 h-3" />,    color: 'text-green-400' },
  pharmacy:    { label: 'Farmacia',         icon: <PillIcon className="w-3 h-3" />,            color: 'text-red-400' },
};

function Stars({ cat }: { cat: string }) {
  const n = parseInt(cat.match(/\d/)?.[0] ?? '0', 10);
  if (n <= 0) return <span className="text-[10px] text-slate-600">{cat || 'Sin categoría'}</span>;
  return (
    <span className="flex items-center gap-px">
      {Array.from({ length: Math.min(n, 5) }).map((_, i) => (
        <StarIcon key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
      ))}
    </span>
  );
}

function KmBadge({ km }: { km: number }) {
  return (
    <span className="text-[10px] font-semibold text-slate-500 bg-slate-800 px-1.5 py-px rounded-full flex-shrink-0">
      km {km}
    </span>
  );
}

// ── Hotels section (SIT Ministerio de Turismo) ────────────────────────────────

function HotelesSection({ hotels }: { hotels: SITHotel[] }) {
  const [expanded, setExpanded] = useState(false);

  const byLocalidad = useMemo(() => {
    const map = new Map<string, SITHotel[]>();
    for (const h of hotels) {
      const key = `${h.localidad}, ${h.provincia}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(h);
    }
    return [...map.entries()]
      .sort((a, b) => (a[1][0]?.distancia_ruta_km ?? 0) - (b[1][0]?.distancia_ruta_km ?? 0));
  }, [hotels]);

  const visible = expanded ? byLocalidad : byLocalidad.slice(0, 4);

  if (!hotels.length) return (
    <p className="text-xs text-slate-600 py-2 text-center">Sin establecimientos de Ministerio de Turismo en el trayecto.</p>
  );

  return (
    <div className="space-y-2">
      {visible.map(([localidad, hs]) => (
        <div key={localidad} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-slate-300">{localidad}</span>
            </div>
            <span className="text-[10px] text-slate-600">{hs[0]?.distancia_ruta_km} km de la ruta</span>
          </div>
          <div className="space-y-1.5">
            {hs.slice(0, 4).map((h, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 truncate flex-1">{h.nombre}</span>
                <Stars cat={h.categoria} />
              </div>
            ))}
            {hs.length > 4 && <p className="text-[10px] text-slate-600">+{hs.length - 4} más</p>}
          </div>
        </div>
      ))}

      {byLocalidad.length > 4 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-slate-300 py-1.5 transition-colors"
        >
          {expanded ? <><ChevronUpIcon className="w-3.5 h-3.5" /> Ver menos</> : <><ChevronDownIcon className="w-3.5 h-3.5" /> Ver {byLocalidad.length - 4} localidades más</>}
        </button>
      )}

      <p className="text-[10px] text-slate-700 pt-1">
        Fuente: Ministerio de Turismo de Argentina (SIT)
      </p>
    </div>
  );
}

// ── POIs section (Overpass / OSM) ─────────────────────────────────────────────

function POIItem({ poi, selected, onToggle }: {
  poi:      RoutePOI;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const meta = CATEGORY_META[poi.category] ?? { label: poi.category, icon: <MapPinIcon className="w-3 h-3" />, color: 'text-slate-400' };
  return (
    <div
      onClick={() => onToggle(poi.id)}
      className={`flex items-center gap-2 py-2 border-b border-slate-800/60 last:border-0 cursor-pointer rounded transition-colors px-1 -mx-1 ${
        selected ? 'bg-blue-500/10' : 'hover:bg-slate-800/40'
      }`}
    >
      {/* Checkbox */}
      <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
        selected ? 'bg-blue-500 border-blue-500' : 'border-slate-600'
      }`}>
        {selected && (
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span className={`flex-shrink-0 ${meta.color}`}>{meta.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-300 truncate">{poi.name}</p>
        <p className={`text-[10px] ${meta.color} opacity-80`}>{meta.label}</p>
      </div>
      <KmBadge km={poi.km_from_start} />
    </div>
  );
}

function POIsSection({ pois, categories, title, icon, poisLoading, selectedPOIIds, onTogglePOI }: {
  pois:            RoutePOI[];
  categories:      POICategory[];
  title:           string;
  icon:            React.ReactNode;
  poisLoading?:    boolean;
  selectedPOIIds?: Set<string>;
  onTogglePOI?:    (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const filtered = pois.filter(p => categories.includes(p.category));

  if (!filtered.length) return (
    <div className="py-1">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-slate-600">{icon}</span>
        <span className="text-xs font-medium text-slate-500">{title}</span>
        <span className="ml-auto text-[10px] text-slate-700">0 encontrados</span>
      </div>
      <p className="text-[10px] text-slate-700 pl-5">Sin datos en OpenStreetMap para esta zona.</p>
    </div>
  );

  const visible = expanded ? filtered : filtered.slice(0, 5);

  return (
    <div className="mb-1">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">{icon}</span>
          <span className="text-xs font-semibold text-slate-300">{title}</span>
        </div>
        <span className="text-[10px] text-slate-600">{filtered.length} encontrados</span>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-lg px-3">
        {visible.map(poi => (
          <POIItem
            key={poi.id} poi={poi}
            selected={selectedPOIIds?.has(poi.id) ?? false}
            onToggle={onTogglePOI ?? (() => {})}
          />
        ))}
      </div>
      {filtered.length > 5 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-slate-300 py-1.5 transition-colors"
        >
          {expanded
            ? <><ChevronUpIcon className="w-3.5 h-3.5" /> Ver menos</>
            : <><ChevronDownIcon className="w-3.5 h-3.5" /> Ver {filtered.length - 5} más</>
          }
        </button>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

type Tab = 'comer' | 'dormir' | 'otros';

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'comer',  label: 'Dónde comer',  icon: <UtensilsIcon className="w-3.5 h-3.5" /> },
  { id: 'dormir', label: 'Dónde dormir', icon: <BedDoubleIcon className="w-3.5 h-3.5" /> },
  { id: 'otros',  label: 'Servicios',    icon: <ShoppingCartIcon className="w-3.5 h-3.5" /> },
];

interface ServiciosPanelProps {
  hotels:         SITHotel[];
  pois:           RoutePOI[];
  hotelsLoading:  boolean;
  poisLoading:    boolean;
  waypoints?:     Array<{ lat: number; lon: number; km_from_start: number }>;
  selectedPOIIds?: Set<string>;
  onTogglePOI?:   (id: string) => void;
}

// ── Google Maps fallback links when OSM data is empty ────────────────────────

function GmapsSearchFallback({ waypoints }: { waypoints: Array<{ lat: number; lon: number; km_from_start: number }> }) {
  const stops = waypoints.slice(1, -1).slice(0, 4);
  if (!stops.length) return null;

  const searches = [
    { label: 'restaurantes', q: 'restaurantes' },
    { label: 'hoteles',      q: 'hoteles' },
    { label: 'supermercados', q: 'supermercados' },
  ];

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-slate-500 mb-2">Buscá en Google Maps cerca de cada parada:</p>
      {stops.map((wp, i) => (
        <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <p className="text-[10px] text-slate-500 mb-1.5">km {wp.km_from_start}</p>
          <div className="flex flex-wrap gap-1.5">
            {searches.map(s => (
              <a
                key={s.q}
                href={`https://www.google.com/maps/search/${encodeURIComponent(s.q)}/@${wp.lat},${wp.lon},13z`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
              >
                🔍 {s.label}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ServiciosPanel({ hotels, pois, hotelsLoading, poisLoading, waypoints = [], selectedPOIIds = new Set(), onTogglePOI }: ServiciosPanelProps) {
  const [tab, setTab] = useState<Tab>('comer');

  const isLoading = hotelsLoading || poisLoading;
  const showPanel = isLoading || hotels.length > 0 || pois.length > 0 || waypoints.length > 0;

  if (!showPanel) return null;

  if (isLoading && !hotels.length && !pois.length) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <UtensilsIcon className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-semibold text-slate-300">Servicios en ruta</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-800/60 rounded-lg animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UtensilsIcon className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-semibold text-slate-300">Servicios en ruta</h3>
        </div>
        <span className="text-[10px] text-slate-600">
          {pois.length + hotels.length} lugares · OpenStreetMap + MINTUR
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-950 rounded-lg p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              tab === t.id
                ? 'bg-slate-800 text-slate-100 shadow'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'comer' && (
        <div className="space-y-4">
          {poisLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-800/60 rounded animate-pulse" />)}
            </div>
          ) : (
            <>
              <POIsSection pois={pois} categories={['restaurant', 'fast_food']}
                title="Restaurantes" icon={<UtensilsIcon className="w-3.5 h-3.5" />}
                selectedPOIIds={selectedPOIIds} onTogglePOI={onTogglePOI} />
              <POIsSection pois={pois} categories={['cafe']}
                title="Cafés y bares" icon={<CoffeeIcon className="w-3.5 h-3.5" />}
                selectedPOIIds={selectedPOIIds} onTogglePOI={onTogglePOI} />
            </>
          )}
        </div>
      )}

      {tab === 'dormir' && (
        <div className="space-y-4">
          {/* SIT Ministerio de Turismo */}
          <div>
            <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wide font-semibold">Ministerio de Turismo</p>
            <HotelesSection hotels={hotels} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wide font-semibold">OpenStreetMap</p>
            <POIsSection
              pois={pois}
              categories={['hotel', 'hostel']}
              title="Hoteles y hostels"
              icon={<BedDoubleIcon className="w-3.5 h-3.5" />}
              selectedPOIIds={selectedPOIIds}
              onTogglePOI={onTogglePOI}
            />
            <POIsSection
              pois={pois}
              categories={['camping']}
              title="Campings"
              icon={<TentIcon className="w-3.5 h-3.5" />}
              selectedPOIIds={selectedPOIIds}
              onTogglePOI={onTogglePOI}
            />
          </div>
        </div>
      )}

      {tab === 'otros' && (
        <div className="space-y-4">
          <POIsSection
            pois={pois}
            categories={['rest_area']}
            title="Áreas de descanso / Paradores"
            icon={<ParkingCircleIcon className="w-3.5 h-3.5" />}
            selectedPOIIds={selectedPOIIds}
            onTogglePOI={onTogglePOI}
          />
          <POIsSection
            pois={pois}
            categories={['supermarket']}
            title="Supermercados"
            icon={<ShoppingCartIcon className="w-3.5 h-3.5" />}
            selectedPOIIds={selectedPOIIds}
            onTogglePOI={onTogglePOI}
          />
          <POIsSection
            pois={pois}
            categories={['pharmacy']}
            title="Farmacias"
            icon={<PillIcon className="w-3.5 h-3.5" />}
            selectedPOIIds={selectedPOIIds}
            onTogglePOI={onTogglePOI}
          />
        </div>
      )}
    </div>
  );
}
