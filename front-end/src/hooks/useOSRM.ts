import { useState, useEffect } from 'react';
import { haversine } from '../utils/haversine';
import localidades from '../data/ar_localidades.json';

// ── Types ────────────────────────────────────────────────────────────────────

export interface Coords { lat: number; lon: number }

export interface RouteWaypoint extends Coords {
  km_from_start: number;
}

export interface OSRMResult {
  distance_km:  number;
  duration_min: number;
  geometry:     GeoJSON.LineString;
  waypoints:    RouteWaypoint[];
  origin:       Coords;
  destination:  Coords;
  isFallback:   boolean;   // true = straight-line estimate, not real road
  loading:      boolean;
  error:        string | null;
}

export interface TripQuery {
  from: string;
  to:   string;
}

// ── Module cache ─────────────────────────────────────────────────────────────
const _cache = new Map<string, { data: Omit<OSRMResult, 'loading' | 'error'>; ts: number }>();
const CACHE_MS = 30 * 60 * 1000;

// ── Hardcoded Argentine city lookup ──────────────────────────────────────────

const AR_CITIES: Record<string, Coords> = {
  'buenos aires':            { lat: -34.6037, lon: -58.3816 },
  'caba':                    { lat: -34.6037, lon: -58.3816 },
  'capital federal':         { lat: -34.6037, lon: -58.3816 },
  'ciudad de buenos aires':  { lat: -34.6037, lon: -58.3816 },
  'cordoba':                 { lat: -31.4201, lon: -64.1888 },
  'córdoba':                 { lat: -31.4201, lon: -64.1888 },
  'rosario':                 { lat: -32.9442, lon: -60.6505 },
  'mendoza':                 { lat: -32.8908, lon: -68.8272 },
  'la plata':                { lat: -34.9215, lon: -57.9545 },
  'mar del plata':           { lat: -38.0023, lon: -57.5575 },
  'bahia blanca':            { lat: -38.7196, lon: -62.2724 },
  'bahía blanca':            { lat: -38.7196, lon: -62.2724 },
  'tucuman':                 { lat: -26.8083, lon: -65.2176 },
  'tucumán':                 { lat: -26.8083, lon: -65.2176 },
  'san miguel de tucuman':   { lat: -26.8083, lon: -65.2176 },
  'san miguel de tucumán':   { lat: -26.8083, lon: -65.2176 },
  'salta':                   { lat: -24.7821, lon: -65.4232 },
  'santa fe':                { lat: -31.6333, lon: -60.7000 },
  'neuquen':                 { lat: -38.9516, lon: -68.0591 },
  'neuquén':                 { lat: -38.9516, lon: -68.0591 },
  'bariloche':               { lat: -41.1335, lon: -71.3103 },
  'san carlos de bariloche': { lat: -41.1335, lon: -71.3103 },
  'corrientes':              { lat: -27.4806, lon: -58.8341 },
  'posadas':                 { lat: -27.3671, lon: -55.8967 },
  'resistencia':             { lat: -27.4514, lon: -58.9867 },
  'jujuy':                   { lat: -24.1858, lon: -65.2995 },
  'san salvador de jujuy':   { lat: -24.1858, lon: -65.2995 },
  'parana':                  { lat: -31.7333, lon: -60.5333 },
  'paraná':                  { lat: -31.7333, lon: -60.5333 },
  'formosa':                 { lat: -26.1775, lon: -58.1781 },
  'santiago del estero':     { lat: -27.7951, lon: -64.2615 },
  'la rioja':                { lat: -29.4131, lon: -66.8556 },
  'san juan':                { lat: -31.5375, lon: -68.5364 },
  'san luis':                { lat: -33.2950, lon: -66.3356 },
  'viedma':                  { lat: -40.8135, lon: -62.9967 },
  'rawson':                  { lat: -43.3002, lon: -65.1023 },
  'comodoro rivadavia':      { lat: -45.8667, lon: -67.5000 },
  'puerto madryn':           { lat: -42.7682, lon: -65.0340 },
  'trelew':                  { lat: -43.2495, lon: -65.3039 },
  'ushuaia':                 { lat: -54.8019, lon: -68.3030 },
  'rio gallegos':            { lat: -51.6226, lon: -69.2181 },
  'río gallegos':            { lat: -51.6226, lon: -69.2181 },
  'santa rosa':              { lat: -36.6167, lon: -64.2833 },
  'rio cuarto':              { lat: -33.1232, lon: -64.3493 },
  'río cuarto':              { lat: -33.1232, lon: -64.3493 },
  'villa maria':             { lat: -32.4049, lon: -63.2436 },
  'villa maría':             { lat: -32.4049, lon: -63.2436 },
  'concordia':               { lat: -31.3928, lon: -58.0197 },
  'gualeguaychu':            { lat: -33.0100, lon: -58.5200 },
  'gualeguaychú':            { lat: -33.0100, lon: -58.5200 },
  'san rafael':              { lat: -34.6177, lon: -68.3302 },
  'tandil':                  { lat: -37.3217, lon: -59.1333 },
  'olavarria':               { lat: -36.8905, lon: -60.3225 },
  'olavarría':               { lat: -36.8905, lon: -60.3225 },
  'junin':                   { lat: -34.5922, lon: -60.9597 },
  'junín':                   { lat: -34.5922, lon: -60.9597 },
  'pergamino':               { lat: -33.8905, lon: -60.5716 },
  'rafaela':                 { lat: -31.2522, lon: -61.4868 },
  'venado tuerto':           { lat: -33.7459, lon: -61.9682 },
  'san nicolas':             { lat: -33.3333, lon: -60.2167 },
  'san nicolás':             { lat: -33.3333, lon: -60.2167 },
  'moreno':                  { lat: -34.6534, lon: -58.7899 },
  'la reja':                 { lat: -34.6377, lon: -58.8282 },
  'pilar':                   { lat: -34.4588, lon: -58.9142 },
  'lujan':                   { lat: -34.5700, lon: -59.1150 },
  'luján':                   { lat: -34.5700, lon: -59.1150 },
  'puerto iguazu':           { lat: -25.5994, lon: -54.5797 },
  'puerto iguazú':           { lat: -25.5994, lon: -54.5797 },
  'esquel':                  { lat: -42.9123, lon: -71.3162 },
  'zapala':                  { lat: -38.8992, lon: -70.0644 },
  'cipolletti':              { lat: -38.9333, lon: -67.9833 },
  'general roca':            { lat: -39.0333, lon: -67.5833 },
  'villa carlos paz':        { lat: -31.4214, lon: -64.4990 },
  'alta gracia':             { lat: -31.6553, lon: -64.4300 },
};

function normalize(s: string): string {
  return s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Pre-build a normalized index from the Georef dataset for O(1) lookups
const _localidadesIndex: Map<string, Coords> = new Map(
  (localidades as Array<{ n: string; p: string; lat: number; lon: number }>).map(l => [
    normalize(l.n), { lat: l.lat, lon: l.lon },
  ])
);

function lookupCity(city: string): Coords | null {
  const key = normalize(city);
  // 1. Exact match in hardcoded capitals (highest priority)
  if (AR_CITIES[key]) return AR_CITIES[key];
  for (const [name, coords] of Object.entries(AR_CITIES)) {
    if (key.startsWith(name) || name.startsWith(key)) return coords;
  }
  // 2. Exact match in Georef dataset (3582 localities, 0ms)
  if (_localidadesIndex.has(key)) return _localidadesIndex.get(key)!;
  // 3. Prefix match in Georef dataset
  for (const [name, coords] of _localidadesIndex) {
    if (key.startsWith(name) || name.startsWith(key)) return coords;
  }
  return null;
}

// ── Fetch with timeout ────────────────────────────────────────────────────────

function fetchT(url: string, ms = 8000, init?: RequestInit): Promise<Response> {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

// ── External geocoding (only used if city not in local lookup) ────────────────

async function geocodeExternal(city: string): Promise<Coords> {
  const q = encodeURIComponent(city.trim());
  try {
    const r = await fetchT(`https://photon.komoot.io/api/?q=${q}&limit=1&lang=es&bbox=-74,-55,-53,-22`, 6000);
    if (r.ok) {
      const j = await r.json();
      const f = j.features?.[0];
      if (f) { const [lon, lat] = f.geometry.coordinates; return { lat, lon }; }
    }
  } catch { /* fallthrough */ }

  const r = await fetchT(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&countrycodes=ar&limit=1`, 8000);
  if (!r.ok) throw new Error(`No se pudo geocodificar "${city}"`);
  const j = await r.json();
  if (!j[0]) throw new Error(`Ciudad no encontrada: "${city}". Probá escribir el nombre completo.`);
  return { lat: parseFloat(j[0].lat), lon: parseFloat(j[0].lon) };
}

async function geocode(city: string): Promise<Coords> {
  return lookupCity(city) ?? geocodeExternal(city);
}

// ── Polyline decoder for Valhalla (6 decimal precision) ─────────────────────

function decodePolyline6(encoded: string): number[][] {
  const coords: number[][] = [];
  let index = 0, lat = 0, lon = 0;
  while (index < encoded.length) {
    let shift = 0, result = 0, byte: number;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lon += (result & 1) ? ~(result >> 1) : (result >> 1);
    coords.push([lon / 1e6, lat / 1e6]); // GeoJSON: [lon, lat]
  }
  return coords;
}

// ── Valhalla routing (more reliable, real road geometry) ────────────────────

async function fetchRouteValhalla(origin: Coords, dest: Coords) {
  const json = JSON.stringify({
    locations: [
      { lat: origin.lat, lon: origin.lon },
      { lat: dest.lat, lon: dest.lon },
    ],
    costing: 'auto',
    directions_options: { units: 'km' },
  });

  const mirrors = [
    'https://valhalla1.openstreetmap.de/route',
    'https://valhalla.openstreetmap.de/route',
  ];

  for (const base of mirrors) {
    try {
      const r = await fetchT(`${base}?json=${encodeURIComponent(json)}`, 10000);
      if (!r.ok) continue;
      const j = await r.json();
      const trip = j.trip;
      if (!trip?.legs?.[0]?.shape) continue;

      const coordinates = decodePolyline6(trip.legs[0].shape);
      return {
        distance: (trip.summary?.length ?? 0) * 1000,      // km → meters
        duration: trip.summary?.time ?? 0,                   // seconds
        geometry: { type: 'LineString' as const, coordinates },
      };
    } catch { /* next mirror */ }
  }
  throw new Error('Valhalla no disponible');
}

// ── OSRM routing — tries 2 servers in parallel, takes first success ───────────

async function fetchRouteOSRM(origin: Coords, dest: Coords) {
  const path = `${origin.lon},${origin.lat};${dest.lon},${dest.lat}?overview=full&geometries=geojson`;
  const endpoints = [
    `https://router.project-osrm.org/route/v1/driving/${path}`,
    `https://routing.openstreetmap.de/routed-car/route/v1/driving/${path}`,
  ];

  const results = await Promise.allSettled(
    endpoints.map(url => fetchT(url, 8000).then(async r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      if (j.code !== 'Ok' || !j.routes?.[0]) throw new Error('No route');
      return j.routes[0];
    }))
  );

  for (const r of results) {
    if (r.status === 'fulfilled') return r.value;
  }
  throw new Error('OSRM no disponible');
}

// ── Combined routing: Valhalla first (more reliable), then OSRM ─────────────

async function fetchRoute(origin: Coords, dest: Coords) {
  // Try Valhalla first (much more reliable in 2025/2026)
  try { return await fetchRouteValhalla(origin, dest); } catch { /* fallthrough */ }
  // Then OSRM
  try {
    const osrm = await fetchRouteOSRM(origin, dest);
    return { distance: osrm.distance, duration: osrm.duration, geometry: osrm.geometry };
  } catch { /* fallthrough */ }
  throw new Error('Routing no disponible');
}

// ── Simplified straight-line fallback (always works) ─────────────────────────
// Generates a curved great-circle path. Road distance ≈ haversine × 1.35.

function buildFallbackRoute(origin: Coords, dest: Coords) {
  const straight = haversine(origin.lat, origin.lon, dest.lat, dest.lon);
  const road_km  = Math.round(straight * 1.35);
  const dur_min  = Math.round(road_km / 90 * 60);  // 90 km/h avg Argentina highway

  // 80-point interpolation along great circle (good enough for waypoint extraction)
  const coords: number[][] = [];
  for (let i = 0; i <= 80; i++) {
    const t   = i / 80;
    const lat = origin.lat + (dest.lat - origin.lat) * t;
    const lon = origin.lon + (dest.lon - origin.lon) * t;
    coords.push([lon, lat]);
  }

  return {
    distance:  road_km * 1000,
    duration:  dur_min * 60,
    geometry:  { type: 'LineString' as const, coordinates: coords },
  };
}

// ── Extract waypoints every intervalKm ───────────────────────────────────────

function extractWaypoints(geometry: GeoJSON.LineString, intervalKm = 150): RouteWaypoint[] {
  const coords = geometry.coordinates as number[][];
  if (coords.length < 2) return [];

  const pts: RouteWaypoint[] = [];
  let acc = 0, next = 0;

  for (let i = 0; i < coords.length; i++) {
    const [lon, lat] = coords[i];
    if (i > 0) {
      const [pl, pa] = coords[i - 1];
      acc += haversine(pa, pl, lat, lon);
    }
    if (acc >= next) {
      pts.push({ lat, lon, km_from_start: Math.round(acc) });
      next += intervalKm;
    }
  }

  const [ll, la] = coords[coords.length - 1];
  const lastKm = Math.round(acc);
  if (!pts.length || pts[pts.length - 1].km_from_start !== lastKm) {
    pts.push({ lat: la, lon: ll, km_from_start: lastKm });
  }
  return pts;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

const EMPTY: OSRMResult = {
  distance_km: 0, duration_min: 0,
  geometry: { type: 'LineString', coordinates: [] },
  waypoints: [], origin: { lat: 0, lon: 0 }, destination: { lat: 0, lon: 0 },
  isFallback: false, loading: false, error: null,
};

export function useOSRM(query: TripQuery | null): OSRMResult {
  const [result, setResult] = useState<OSRMResult>(EMPTY);

  useEffect(() => {
    if (!query?.from?.trim() || !query?.to?.trim()) { setResult(EMPTY); return; }

    const key = `${query.from.trim().toLowerCase()}|${query.to.trim().toLowerCase()}`;
    const cached = _cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_MS) {
      setResult({ ...cached.data, loading: false, error: null });
      return;
    }

    let cancelled = false;

    async function run() {
      setResult(prev => ({ ...prev, loading: true, error: null }));
      try {
        // Step 1: geocode both cities in parallel (fast — uses local lookup first)
        const [origin, destination] = await Promise.all([
          geocode(query!.from),
          geocode(query!.to),
        ]);
        if (cancelled) return;

        // Step 2: try real road routing (OSRM), fall back to straight-line
        let routeData: { distance: number; duration: number; geometry: GeoJSON.LineString };
        let isFallback = false;

        try {
          routeData = await fetchRoute(origin, destination);
        } catch {
          // All routers down — use straight-line estimate (still shows fuel stops, hotels, weather)
          routeData  = buildFallbackRoute(origin, destination);
          isFallback = true;
        }

        if (cancelled) return;

        const distance_km  = Math.round(routeData.distance / 1000);
        const duration_min = Math.round(routeData.duration / 60);
        const waypoints    = extractWaypoints(routeData.geometry);

        const data = { distance_km, duration_min, geometry: routeData.geometry, waypoints, origin, destination, isFallback };
        _cache.set(key, { data, ts: Date.now() });
        setResult({ ...data, loading: false, error: null });

      } catch (e: any) {
        if (cancelled) return;
        setResult(prev => ({ ...prev, loading: false, error: e?.message ?? 'Error al calcular la ruta' }));
      }
    }

    run();
    return () => { cancelled = true; };
  }, [query?.from, query?.to]);

  return result;
}
