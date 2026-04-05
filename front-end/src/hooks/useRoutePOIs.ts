import { useState, useEffect } from 'react';
import { haversine } from '../utils/haversine';

// ── Types ────────────────────────────────────────────────────────────────────

export type POICategory =
  | 'restaurant' | 'cafe' | 'fast_food'
  | 'hotel' | 'hostel' | 'camping'
  | 'rest_area' | 'supermarket' | 'pharmacy';

export interface RoutePOI {
  id:            string;
  name:          string;
  category:      POICategory;
  lat:           number;
  lon:           number;
  distancia_km:  number;
  km_from_start: number;
  tags:          Record<string, string>;
}

export interface RoutePOIsResult {
  pois:    RoutePOI[];
  loading: boolean;
  error:   string | null;
}

// ── Overpass mirrors (tried in parallel, first success wins) ──────────────────

const OVERPASS_MIRRORS = [
  'https://overpass.kumi.systems/api/interpreter',      // más confiable desde browsers
  'https://overpass-api.de/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',   // mirror europeo adicional
];

// ── Category mappings ─────────────────────────────────────────────────────────

const AMENITY_MAP: Record<string, POICategory> = {
  restaurant: 'restaurant', food_court: 'restaurant',
  cafe: 'cafe', pub: 'cafe', bar: 'cafe', biergarten: 'cafe',
  fast_food: 'fast_food', ice_cream: 'fast_food',
  pharmacy: 'pharmacy', chemist: 'pharmacy',
  supermarket: 'supermarket', convenience: 'supermarket',
};
const TOURISM_MAP: Record<string, POICategory> = {
  hotel: 'hotel', motel: 'hotel', guest_house: 'hotel', chalet: 'hotel',
  hostel: 'hostel', backpacker: 'hostel',
  camp_site: 'camping', caravan_site: 'camping',
};
const HIGHWAY_MAP: Record<string, POICategory> = {
  rest_area: 'rest_area', services: 'rest_area',
};

function classify(tags: Record<string, string>): POICategory | null {
  if (tags.amenity  && AMENITY_MAP[tags.amenity])  return AMENITY_MAP[tags.amenity];
  if (tags.tourism  && TOURISM_MAP[tags.tourism])  return TOURISM_MAP[tags.tourism];
  if (tags.highway  && HIGHWAY_MAP[tags.highway])  return HIGHWAY_MAP[tags.highway];
  return null;
}

// ── Overpass query (single point, individual around filter) ───────────────────

function makeQuery(lat: number, lon: number, radiusM: number): string {
  return `[out:json][timeout:20];
(
  node["amenity"~"restaurant|cafe|fast_food|food_court|pub|bar|pharmacy|supermarket|convenience"](around:${radiusM},${lat},${lon});
  node["tourism"~"hotel|motel|hostel|guest_house|camp_site|caravan_site|chalet"](around:${radiusM},${lat},${lon});
  node["highway"~"rest_area|services"](around:${radiusM},${lat},${lon});
);
out body 80;`;
}

// Intenta un mirror con timeout propio
async function queryMirror(mirror: string, query: string): Promise<any[]> {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 22_000);
  try {
    const resp = await fetch(mirror, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    `data=${encodeURIComponent(query)}`,
      signal:  ctrl.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    const els  = json.elements ?? [];
    if (!Array.isArray(els)) throw new Error('bad response');
    return els;
  } catch {
    clearTimeout(timer);
    throw new Error('mirror failed');
  }
}

// Intenta todos los mirrors en paralelo, toma el primero que devuelve datos
async function queryOverpass(lat: number, lon: number, radiusM: number): Promise<any[]> {
  const query = makeQuery(lat, lon, radiusM);

  // Round 1: todos en paralelo
  try {
    const result = await Promise.any(
      OVERPASS_MIRRORS.map(m => queryMirror(m, query))
    );
    return result;
  } catch {
    // Round 2: reintento secuencial con radio más grande (puede haber más datos)
    const bigQuery = makeQuery(lat, lon, radiusM * 1.5);
    for (const mirror of OVERPASS_MIRRORS) {
      try {
        const els = await queryMirror(mirror, bigQuery);
        if (els.length > 0) return els;
      } catch { /* next */ }
    }
    return [];
  }
}

// ── Build POI from OSM node ───────────────────────────────────────────────────

function nodeToPoI(
  node:         any,
  routeCoords:  number[][],
  sampled:      number[][],
  maxKmStart:   number,
  totalCoords:  number,
): RoutePOI | null {
  const tags: Record<string, string> = node.tags ?? {};
  const category = classify(tags);
  if (!category) return null;

  const name = (
    tags.name ?? tags['name:es'] ?? tags.brand ?? tags.operator ?? ''
  ).trim();
  if (!name) return null;

  const lat = node.lat as number;
  const lon = node.lon as number;

  // Distancia mínima a la ruta
  let minDist = Infinity;
  let bestFrac = 0;
  sampled.forEach(([rLon, rLat], i) => {
    const d = haversine(lat, lon, rLat, rLon);
    if (d < minDist) { minDist = d; bestFrac = i / Math.max(sampled.length - 1, 1); }
  });

  const km_from_start = Math.round(bestFrac * maxKmStart);

  return {
    id:           `${node.id}`,
    name,
    category,
    lat, lon,
    distancia_km:  Math.round(minDist * 10) / 10,
    km_from_start,
    tags,
  };
}

// ── Pick N evenly-spaced intermediate waypoints ───────────────────────────────

function pickIntermediateWaypoints(
  waypoints: Array<{ lat: number; lon: number; km_from_start: number }>,
  n: number,
): Array<{ lat: number; lon: number; km_from_start: number }> {
  // Skip first (origin) and last (destination)
  const mid = waypoints.slice(1, -1);
  if (!mid.length) return [];
  if (mid.length <= n) return mid;
  // Pick evenly-spaced subset
  return Array.from({ length: n }, (_, i) => mid[Math.round(i * (mid.length - 1) / (n - 1))]);
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useRoutePOIs(
  geometry:  GeoJSON.LineString | null,
  waypoints: Array<{ lat: number; lon: number; km_from_start: number }>,
  radius_km: number = 12,
): RoutePOIsResult {
  const [result, setResult] = useState<RoutePOIsResult>({
    pois: [], loading: false, error: null,
  });

  useEffect(() => {
    if (!geometry?.coordinates.length || waypoints.length < 2) {
      setResult({ pois: [], loading: false, error: null });
      return;
    }

    let cancelled = false;
    setResult(prev => ({ ...prev, loading: true, error: null }));

    async function run() {
      try {
        // Pick up to 4 intermediate stops
        const stops = pickIntermediateWaypoints(waypoints, 4);
        if (!stops.length) {
          setResult({ pois: [], loading: false, error: null });
          return;
        }

        const coords    = geometry!.coordinates as number[][];
        const step      = Math.max(1, Math.floor(coords.length / 100));
        const sampled   = coords.filter((_, i) => i % step === 0);
        const maxKmStart = waypoints[waypoints.length - 1]?.km_from_start ?? 0;
        const radiusM   = radius_km * 1000;

        // Query each intermediate stop in parallel
        const allNodes = await Promise.all(
          stops.map(s => queryOverpass(s.lat, s.lon, radiusM))
        );

        if (cancelled) return;

        // Convert nodes to POIs
        const seen = new Set<string>();
        const pois: RoutePOI[] = allNodes
          .flat()
          .map(node => nodeToPoI(node, coords, sampled, maxKmStart, coords.length))
          .filter((p): p is RoutePOI => {
            if (!p || p.distancia_km > radius_km) return false;
            // Dedup by name+category
            const key = `${p.category}|${p.name.toLowerCase().slice(0, 20)}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .sort((a, b) => a.km_from_start - b.km_from_start);

        setResult({ pois, loading: false, error: null });
      } catch (e: any) {
        if (!cancelled) setResult({ pois: [], loading: false, error: null }); // silent fail
      }
    }

    run();
    return () => { cancelled = true; };
  }, [geometry, waypoints, radius_km]);

  return result;
}
