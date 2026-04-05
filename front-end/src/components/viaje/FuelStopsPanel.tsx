import React from 'react';
import { FuelIcon, MapPinIcon, AlertTriangleIcon, CheckCircleIcon, ClockIcon, MinusIcon, PlusIcon } from 'lucide-react';
import { formatCurrency } from '../../utils/api';
import type { FuelStop } from '../../hooks/useRoadTripFuel';
import type { WaypointWeather } from '../../hooks/useRouteWeather';
import CommunityActions from '../community/CommunityActions';

const DEFAULT_FUEL_PARADA = 30; // minutos por defecto en una parada de nafta
const MIN_FUEL_PARADA    = 15; // mínimo 15 minutos por parada

interface FuelStopsPanelProps {
  stops:           FuelStop[];
  total_litros:    number;
  total_costo:     number;
  distance_km:     number;
  loading:         boolean;
  selectedIdxs:    Set<number>;
  onToggle:        (idx: number) => void;
  weatherByKm?:    Map<number, WaypointWeather>;
  paradaOverrides?:Map<string, number>;
  onParadaChange?: (key: string, min: number) => void;
}

function WeatherChip({ w }: { w: WaypointWeather }) {
  if (w.temp === null && w.wind_speed === null) return null;
  const wind = w.wind_speed ?? 0;
  const color = wind > 60 ? 'text-red-400' : wind > 40 ? 'text-amber-400' : 'text-emerald-400';
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-medium ${color} bg-slate-800 px-1.5 py-0.5 rounded-full border border-slate-700`}>
      {w.temp !== null && <span>🌡️ {Math.round(w.temp)}°</span>}
      {w.wind_speed !== null && <span>💨 {Math.round(wind)} km/h</span>}
      {w.alert && <span>⚠️</span>}
    </span>
  );
}

function FreshnessBadge({ freshness, fecha }: { freshness: FuelStop['freshness']; fecha?: string }) {
  if (!freshness) return null;
  const fmt = fecha
    ? new Date(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' })
    : null;
  if (freshness === 'fresh') return (
    <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-px rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
      Reciente{fmt ? ` · ${fmt}` : ''}
    </span>
  );
  if (freshness === 'moderate') return (
    <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-px rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
      <ClockIcon className="w-2.5 h-2.5" />
      Estimado{fmt ? ` · ${fmt}` : ''}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-px rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
      <AlertTriangleIcon className="w-2.5 h-2.5" />
      Desactualizado{fmt ? ` · ${fmt}` : ''}
    </span>
  );
}

export function FuelStopsPanel({
  stops, total_litros, total_costo, distance_km, loading,
  selectedIdxs, onToggle, weatherByKm, paradaOverrides, onParadaChange,
}: FuelStopsPanelProps) {
  if (loading) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <FuelIcon className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-300">Paradas de combustible</h3>
          <span className="text-xs text-slate-600 ml-1">Buscando estaciones óptimas…</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-800/60 rounded-lg animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!stops.length) return null;

  const stopsWithStation = stops.filter(s => s.station);
  const stopsWithout     = stops.filter(s => !s.station);
  const staleCount       = stops.filter(s => s.freshness === 'stale').length;
  const selectedCount    = [...selectedIdxs].filter(i => stops[i]?.station).length;

  // Cost of only selected stops
  const selectedCost = stops.reduce((sum, s, i) =>
    selectedIdxs.has(i) && s.station ? sum + s.costo_ars : sum, 0);
  const selectedLitros = stops.reduce((sum, s, i) =>
    selectedIdxs.has(i) && s.station ? sum + s.litros : sum, 0);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FuelIcon className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-300">Paradas de combustible</h3>
        </div>
        <div className="flex items-center gap-2">
          {stopsWithStation.length > 0 && (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <CheckCircleIcon className="w-3 h-3" />{stopsWithStation.length} encontradas
            </span>
          )}
          <span className="text-xs text-slate-500">{stops.length} parada{stops.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Hint */}
      <div className="mb-3 px-3 py-2 bg-slate-800/60 rounded-lg border border-slate-700/50 flex items-center gap-2">
        <span className="text-amber-500 text-xs">⚡</span>
        <span className="text-[10px] text-slate-500">IQR + recencia · Marcá las paradas que querés incluir en tu ruta</span>
        <span className="ml-auto text-[10px] font-semibold text-amber-400">{selectedCount} seleccionadas</span>
      </div>

      {/* Stops */}
      <div className="space-y-2.5 mb-4">
        {stops.map((stop, i) => {
          const isSelected  = selectedIdxs.has(i);
          const canSelect   = !!stop.station;
          const paradaKey   = `fuel-${i}`;
          const paradaMin   = paradaOverrides?.get(paradaKey) ?? DEFAULT_FUEL_PARADA;
          return (
            <div
              key={i}
              onClick={() => canSelect && onToggle(i)}
              className={`border rounded-xl p-3 transition-all ${
                canSelect ? 'cursor-pointer' : 'cursor-default opacity-60'
              } ${
                isSelected && canSelect
                  ? 'bg-amber-500/8 border-amber-500/40 ring-1 ring-amber-500/20'
                  : stop.freshness === 'stale'
                    ? 'bg-slate-950 border-red-500/20 hover:border-slate-700'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                  isSelected && canSelect
                    ? 'bg-amber-500 border-amber-500'
                    : 'border-slate-600 bg-slate-900'
                }`}>
                  {isSelected && canSelect && (
                    <svg className="w-3 h-3 text-slate-950" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold text-amber-500/80 bg-amber-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      km {stop.waypoint.km_from_start}
                    </span>
                    {stop.station ? (
                      <span className="text-[10px] text-emerald-400 font-semibold truncate">{stop.station.empresa}</span>
                    ) : (
                      <span className="text-[10px] text-slate-600 flex items-center gap-1">
                        <AlertTriangleIcon className="w-3 h-3" /> Sin datos en esta zona
                      </span>
                    )}
                    {stop.freshness && (
                      <FreshnessBadge freshness={stop.freshness} fecha={stop.station?.fecha_vigencia} />
                    )}
                    {weatherByKm?.has(stop.waypoint.km_from_start) && (
                      <WeatherChip w={weatherByKm.get(stop.waypoint.km_from_start)!} />
                    )}
                  </div>

                  {stop.station ? (
                    <>
                      <p className="text-xs text-slate-300 truncate">
                        <MapPinIcon className="w-3 h-3 inline mr-0.5 text-slate-500" />
                        {stop.station.direccion}, {stop.station.localidad}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{stop.station.provincia}</p>
                      {stop.freshness === 'stale' && (
                        <p className="text-[10px] text-red-400/70 mt-1">⚠️ Precio posiblemente desactualizado — verificar en estación</p>
                      )}
                      <div className="mt-1" onClick={e => e.stopPropagation()}>
                        <CommunityActions
                          station={{
                            empresa: stop.station.empresa,
                            bandera: stop.station.bandera,
                            direccion: stop.station.direccion,
                            localidad: stop.station.localidad,
                            provincia: stop.station.provincia,
                          }}
                          productoActual={stop.station.producto}
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-600">No encontramos estación válida en 70km de este tramo.</p>
                  )}
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0">
                  {stop.station && (
                    <p className={`text-xs font-bold ${stop.freshness === 'stale' ? 'text-red-400' : 'text-amber-500'}`}>
                      {formatCurrency(stop.station.precio)}/L
                    </p>
                  )}
                  <p className="text-xs text-slate-400">{stop.litros.toFixed(1)} L</p>
                  {stop.costo_ars > 0 && (
                    <p className={`text-xs font-semibold ${stop.freshness === 'stale' ? 'text-red-300/70 line-through' : 'text-slate-200'}`}>
                      {formatCurrency(stop.costo_ars)}
                    </p>
                  )}
                </div>
              </div>

              {/* Per-stop time control — visible when selected */}
              {isSelected && canSelect && onParadaChange && (
                <div
                  className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-500/10"
                  onClick={e => e.stopPropagation()}
                >
                  <ClockIcon className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  <span className="text-[10px] text-slate-500">Tiempo de parada:</span>
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      type="button"
                      onClick={() => onParadaChange(paradaKey, Math.max(MIN_FUEL_PARADA, paradaMin - 5))}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors"
                    >
                      <MinusIcon className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-semibold text-amber-400 min-w-[44px] text-center">
                      {paradaMin} min
                    </span>
                    <button
                      type="button"
                      onClick={() => onParadaChange(paradaKey, paradaMin + 5)}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors"
                    >
                      <PlusIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total — always visible */}
      <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg p-3">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-slate-400">
            {selectedCount > 0 ? `Total (${selectedCount} paradas):` : 'Total combustible:'}
          </span>
          <span className="text-sm font-bold text-slate-200">
            {(selectedCount > 0 ? selectedLitros : total_litros).toFixed(1)} L
          </span>
        </div>
        {(selectedCount > 0 ? selectedCost : total_costo) > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-amber-500 font-medium">
              Costo estimado{staleCount > 0 ? ' · verificar stale' : ''}:
            </span>
            <span className="text-base font-bold text-amber-500">
              {formatCurrency(selectedCount > 0 ? selectedCost : total_costo)}
            </span>
          </div>
        )}
        {selectedCount === 0 && stops.length > 0 && (
          <p className="text-[10px] text-slate-600 mt-1">
            Seleccioná paradas para incluirlas en el cálculo y en Google Maps.
          </p>
        )}
        {distance_km > 0 && total_litros > 0 && (
          <p className="text-[10px] text-slate-600 mt-1.5 border-t border-slate-800 pt-1.5">
            {(distance_km / total_litros).toFixed(1)} km/L promedio en {distance_km} km
          </p>
        )}
        {stopsWithout.length > 0 && (
          <p className="text-[10px] text-amber-700 mt-1">
            ⚠️ {stopsWithout.length} tramo{stopsWithout.length !== 1 ? 's' : ''} sin estación en radio de búsqueda.
          </p>
        )}
        {staleCount > 0 && (
          <p className="text-[10px] text-red-400/70 mt-1">
            🔴 {staleCount} parada{staleCount !== 1 ? 's' : ''} con precios desactualizados — verificar en estación.
          </p>
        )}
      </div>
    </div>
  );
}
