import { useState, useEffect } from 'react';
import { Station } from '../types';
import { fetchSmartData } from '../utils/api';
import { RouteWaypoint } from './useOSRM';
import localidades from '../data/ar_localidades.json';

// ── Constants ────────────────────────────────────────────────────────────────

/** Ningún combustible líquido vale menos de $1.000/L en Argentina 2026 */
const MIN_PRICE_FLOOR = 1_000;

/** Precio razonablemente alto (posible typo o datos de hiperinflación) — usamos para IQR */
const MAX_PRICE_CAP = 5_000;

/** Datos con más de 120 días se consideran stale */
const STALE_DAYS = 120;

// ── Province lookup (offline Georef dataset) ─────────────────────────────────

type LocEntry = { n: string; p?: string; lat: number; lon: number };
const _locs = localidades as LocEntry[];

/** Fast L1-norm nearest-province lookup using offline Georef dataset */
function nearestProvince(lat: number, lon: number): string | undefined {
  let best: LocEntry | null = null;
  let bestD = Infinity;
  for (const l of _locs) {
    const d = Math.abs(l.lat - lat) + Math.abs(l.lon - lon);
    if (d < bestD) { bestD = d; best = l; }
  }
  return best?.p?.toUpperCase() ?? undefined;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface FuelStop {
  waypoint:    RouteWaypoint;
  station:     Station | null;
  litros:      number;
  costo_ars:   number;
  freshness:   'fresh' | 'moderate' | 'stale' | null; // calidad del dato de precio
}

export interface RoadTripFuelResult {
  stops:        FuelStop[];
  total_litros: number;
  total_costo:  number;
  loading:      boolean;
  error:        string | null;
}

// ── Smart station picker ─────────────────────────────────────────────────────

function daysSince(dateStr: string | undefined): number {
  if (!dateStr) return 9999;
  try {
    return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
  } catch { return 9999; }
}

function getFreshness(station: Station): 'fresh' | 'moderate' | 'stale' {
  const age = daysSince(station.fecha_vigencia);
  if (age <= 30)  return 'fresh';
  if (age <= 90)  return 'moderate';
  return 'stale';
}

/**
 * Elige la mejor estación de una lista con las siguientes reglas:
 * 1. Descarta GNC y precios por debajo del piso (datos claramente viejos)
 * 2. Aplica filtro IQR para eliminar outliers estadísticos (precios anómalos)
 * 3. Prefiere datos recientes (< 30 días); entre igualmente frescos, elige el más barato
 */
function pickBestStation(candidates: Station[]): Station | null {
  // ── Paso 1: filtro básico de calidad ──────────────────────────────────────
  const valid = candidates.filter(s => {
    const prod = (s.producto ?? '').toLowerCase();
    return !prod.includes('gnc') && s.precio >= MIN_PRICE_FLOOR;
  });

  if (!valid.length) return null;

  // ── Paso 2: IQR para eliminar outliers ────────────────────────────────────
  const prices = [...valid].map(s => s.precio).sort((a, b) => a - b);
  const q1 = prices[Math.floor(prices.length * 0.25)] ?? prices[0];
  const q3 = prices[Math.floor(prices.length * 0.75)] ?? prices[prices.length - 1];
  const iqr = q3 - q1;

  // Límites 1.5×IQR (estadística clásica de Tukey) + piso/techo absolutos
  const loFence = Math.max(MIN_PRICE_FLOOR, q1 - 1.5 * iqr);
  const hiFence = Math.min(MAX_PRICE_CAP,  q3 + 1.5 * iqr);

  const inliers = valid.filter(s => s.precio >= loFence && s.precio <= hiFence);
  // Si el filtro IQR elimina demasiado, caemos al set completo válido
  const pool = inliers.length >= 2 ? inliers : valid;

  // ── Paso 3: score final — recencia > precio ───────────────────────────────
  // Construimos un score: primero recientes (< 30 días) rankeados por precio,
  // luego moderados, luego stale — dentro de cada grupo el más barato gana.
  const scored = pool.map(s => {
    const age = daysSince(s.fecha_vigencia);
    let group: number;
    if (age <= 30)  group = 0; // fresh
    else if (age <= 90) group = 1; // moderate
    else             group = 2; // stale
    return { s, group, age };
  });

  scored.sort((a, b) => {
    if (a.group !== b.group) return a.group - b.group; // grupo primero
    return a.s.precio - b.s.precio;                    // precio dentro del grupo
  });

  return scored[0]?.s ?? null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useRoadTripFuel(
  waypoints:     RouteWaypoint[],
  consumo_kml:   number,
  tanque_l:      number,
  producto:      string = 'nafta_super',
  litros_inicio?: number,
): RoadTripFuelResult {
  const [result, setResult] = useState<RoadTripFuelResult>({
    stops: [], total_litros: 0, total_costo: 0, loading: false, error: null,
  });

  useEffect(() => {
    if (waypoints.length < 2 || consumo_kml <= 0) return;

    // Paradas intermedias: skip origen (km 0) y destino (último waypoint)
    const stopPoints = waypoints.slice(1, -1);
    if (!stopPoints.length) return;

    let cancelled = false;
    setResult(prev => ({ ...prev, loading: true, error: null }));

    /**
     * Busca con radios progresivos y, si el producto específico no da resultados,
     * cae a cualquier combustible líquido cercano.
     * Timeout global de 12s para que nunca quede colgado.
     * Usa nearestProvince para asegurar que cada waypoint busque en su provincia real.
     */
    async function findStation(lat: number, lon: number): Promise<Station | null> {
      const deadline = Date.now() + 12_000;
      const provincia = nearestProvince(lat, lon);
      // Intento 1: producto exacto, radios progresivos
      for (const radio_km of [25, 45, 70]) {
        if (Date.now() > deadline) break;
        try {
          const res = await fetchSmartData({ lat, lon, radio_km, producto, provincia, limit: 30 });
          const best = pickBestStation(res.data);
          if (best) return best;
        } catch { /* continuar */ }
      }
      // Intento 2: cualquier combustible líquido (sin filtro de producto)
      for (const radio_km of [35, 60]) {
        if (Date.now() > deadline) break;
        try {
          const res = await fetchSmartData({ lat, lon, radio_km, provincia, limit: 30 });
          const best = pickBestStation(res.data);
          if (best) return best;
        } catch { /* continuar */ }
      }
      return null;
    }

    async function run() {
      try {
        // Todas las paradas en paralelo — tiempo total ≈ latencia de 1 sola llamada
        const results = await Promise.all(
          stopPoints.map(async (wp, i) => {
            if (cancelled) return null;
            const nextWp   = stopPoints[i + 1] ?? waypoints[waypoints.length - 1];
            const tramo_km = Math.max(0, nextWp.km_from_start - wp.km_from_start);
            // Para la primera parada, descontar litros que ya lleva el tanque
            const litros_previos = (i === 0 && litros_inicio && litros_inicio > 0)
              ? Math.min(litros_inicio, tanque_l)
              : 0;
            // Litros para cubrir el tramo + 15% buffer, descontando lo que ya hay,
            // mín 0L (no cargar si sobra), máx capacidad del tanque
            const litros   = Math.min(
              Math.max((tramo_km / consumo_kml) * 1.15 - litros_previos, 0),
              tanque_l,
            );
            const station  = await findStation(wp.lat, wp.lon);
            const freshness = station ? getFreshness(station) : null;
            const costo    = station ? litros * station.precio : 0;
            return { waypoint: wp, station, litros, costo_ars: costo, freshness } as FuelStop;
          })
        );

        if (cancelled) return;

        const stops = results.filter((s): s is FuelStop => s !== null);
        const total_litros = stops.reduce((s, st) => s + st.litros, 0);
        const total_costo  = stops.reduce((s, st) => s + st.costo_ars, 0);
        setResult({ stops, total_litros, total_costo, loading: false, error: null });
      } catch (e: any) {
        if (!cancelled) setResult(prev => ({ ...prev, loading: false, error: e.message }));
      }
    }

    run();
    return () => { cancelled = true; };
  }, [waypoints, consumo_kml, tanque_l, producto, litros_inicio]);

  return result;
}

// Re-export helper so panel can compute freshness client-side too
export { getFreshness, daysSince };
