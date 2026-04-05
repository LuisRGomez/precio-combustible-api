import { useState, useEffect } from 'react';
import { haversine } from '../utils/haversine';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SITHotel {
  nombre:              string;
  localidad:           string;
  provincia:           string;
  categoria:           string;
  lat:                 number;
  lon:                 number;
  distancia_ruta_km:   number;
}

export interface SITHotelesResult {
  hotels:  SITHotel[];
  loading: boolean;
  error:   string | null;
}

// ── CKAN API (datos.gob.ar) — has CORS headers, returns JSON ─────────────────
// Resource: establecimientos-de-alojamiento-turistico
const CKAN_URL = 'https://datos.gob.ar/api/3/action/datastore_search?resource_id=eca4de3a-62ca-4e6e-b08c-ab09d20a2ae8&limit=10000';

// ── Cache ────────────────────────────────────────────────────────────────────
const CACHE_KEY = 'tankear_sit_json_v2';
const CACHE_TTL = 24 * 60 * 60 * 1000;

interface LocalCache { data: SITHotel[]; ts: number }
let _memCache: LocalCache | null = null;

// ── Parse CKAN record ────────────────────────────────────────────────────────

function parseNum(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? null : n;
}

function parseRecord(r: Record<string, any>): SITHotel | null {
  // Try common column name variants (CKAN field names vary)
  const lat = parseNum(r['latitud'] ?? r['lat'] ?? r['LATITUD'] ?? r['Latitud']);
  const lon = parseNum(r['longitud'] ?? r['lon'] ?? r['lng'] ?? r['LONGITUD'] ?? r['Longitud']);

  if (lat === null || lon === null) return null;
  if (lat < -55 || lat > -22 || lon < -74 || lon > -53) return null; // Argentina bounds

  return {
    nombre:    String(r['nombre_fantasia'] ?? r['nombre'] ?? r['NOMBRE'] ?? r['Nombre'] ?? 'Sin nombre').trim(),
    localidad: String(r['localidad'] ?? r['LOCALIDAD'] ?? '').trim(),
    provincia: String(r['provincia'] ?? r['PROVINCIA'] ?? '').trim(),
    categoria: String(r['clasificacion'] ?? r['categoria'] ?? r['CATEGORIA'] ?? r['estrellas'] ?? '').trim(),
    lat,
    lon,
    distancia_ruta_km: 0,
  };
}

// ── Filter hotels near route ──────────────────────────────────────────────────

function filterAlongRoute(
  hotels:      SITHotel[],
  routeCoords: number[][],
  maxKm:       number = 5,
): SITHotel[] {
  const step        = Math.max(1, Math.floor(routeCoords.length / 300));
  const sampleRoute = routeCoords.filter((_, i) => i % step === 0);

  return hotels
    .map(hotel => {
      let minDist = Infinity;
      for (const [lon, lat] of sampleRoute) {
        const d = haversine(hotel.lat, hotel.lon, lat, lon);
        if (d < minDist) minDist = d;
        if (minDist < 0.5) break;
      }
      return { ...hotel, distancia_ruta_km: Math.round(minDist * 10) / 10 };
    })
    .filter(h => h.distancia_ruta_km <= maxKm)
    .sort((a, b) => a.distancia_ruta_km - b.distancia_ruta_km);
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useSITHoteles(
  geometry: GeoJSON.LineString | null,
  maxKm:    number = 5,
): SITHotelesResult {
  const [result, setResult] = useState<SITHotelesResult>({
    hotels: [], loading: false, error: null,
  });

  useEffect(() => {
    if (!geometry || !geometry.coordinates.length) {
      setResult({ hotels: [], loading: false, error: null });
      return;
    }

    let cancelled = false;
    setResult(prev => ({ ...prev, loading: true, error: null }));

    async function run() {
      try {
        // 1. Memory cache
        if (_memCache && Date.now() - _memCache.ts < CACHE_TTL) {
          if (cancelled) return;
          const filtered = filterAlongRoute(_memCache.data, geometry!.coordinates as number[][], maxKm);
          setResult({ hotels: filtered, loading: false, error: null });
          return;
        }

        // 2. localStorage cache
        try {
          const stored = localStorage.getItem(CACHE_KEY);
          if (stored) {
            const parsed: LocalCache = JSON.parse(stored);
            if (Date.now() - parsed.ts < CACHE_TTL) {
              _memCache = parsed;
              if (cancelled) return;
              const filtered = filterAlongRoute(parsed.data, geometry!.coordinates as number[][], maxKm);
              setResult({ hotels: filtered, loading: false, error: null });
              return;
            }
          }
        } catch { /* ignore */ }

        // 3. Fetch from CKAN API
        const ctrl  = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 20000);

        let records: Record<string, any>[] = [];
        try {
          const r = await fetch(CKAN_URL, { signal: ctrl.signal });
          clearTimeout(timer);
          const j = await r.json();
          if (j.success && j.result?.records) {
            records = j.result.records;
          }
        } catch {
          clearTimeout(timer);
          if (cancelled) return;
          // Silent fail — hotels are non-critical
          setResult({ hotels: [], loading: false, error: null });
          return;
        }

        if (cancelled) return;

        const allHotels = records.map(parseRecord).filter(Boolean) as SITHotel[];

        _memCache = { data: allHotels, ts: Date.now() };
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(_memCache)); } catch { /* quota */ }

        const filtered = filterAlongRoute(allHotels, geometry!.coordinates as number[][], maxKm);
        setResult({ hotels: filtered, loading: false, error: null });

      } catch (e: any) {
        if (!cancelled) setResult({ hotels: [], loading: false, error: null }); // silent fail
      }
    }

    run();
    return () => { cancelled = true; };
  }, [geometry, maxKm]);

  return result;
}
