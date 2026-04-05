import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE        = import.meta.env.VITE_API_BASE || '';
const OPENSKY_URL     = `${API_BASE}/vuelos`;
const POLL_INTERVAL_MS = 10_000;
const CACHE_KEY        = 'tankear_vuelos_cache';
const CACHE_MAX_MS     = 30 * 60 * 1000;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Flight {
  icao24:       string;
  callsign:     string;
  country:      string;
  lat:          number;
  lon:          number;
  altitude:     number;
  velocityKmh:  number;
  heading:      number;
  verticalRate: number;
  onGround:     boolean;
  squawk:       string | null;
  category:     number;
  source:       'live' | 'stale';
}

export type DataSource = 'live' | 'stale' | 'offline';

export interface FlightDataState {
  flights:      Flight[];
  loading:      boolean;
  error:        string | null;
  lastUpdate:   Date | null;
  source:       DataSource;
  total:        number;
  emergencias:  Flight[];
  rateLimited:  boolean;          // 429 — mostrar paywall
  queriesLeft:  number | null;    // cuántas quedan (header del backend)
  refresh:      () => void;
}

function parseState(s: unknown[]): Flight | null {
  try {
    const lat = s[6] as number | null;
    const lon = s[5] as number | null;
    if (lat == null || lon == null) return null;
    const velocity    = s[9] as number | null;
    const altitude    = (s[7] as number | null) ?? 0;
    const vertRate    = (s[11] as number | null) ?? 0;
    const heading     = (s[10] as number | null) ?? 0;
    const callsignRaw = (s[1] as string | null) ?? '';
    return {
      icao24:       (s[0] as string).trim(),
      callsign:     callsignRaw.trim(),
      country:      (s[2] as string) ?? '',
      lat, lon,
      altitude:     Math.round(altitude),
      velocityKmh:  velocity != null ? Math.round(velocity * 3.6) : 0,
      heading:      Math.round(heading),
      verticalRate: vertRate,
      onGround:     (s[8] as boolean) ?? false,
      squawk:       (s[14] as string | null) ?? null,
      category:     (s[17] as number | null) ?? 0,
      source:       'live',
    };
  } catch { return null; }
}

const EMERGENCY_SQUAWKS = ['7700', '7600', '7500'];
function isEmergency(f: Flight) { return f.squawk != null && EMERGENCY_SQUAWKS.includes(f.squawk); }

function saveCache(flights: Flight[]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), flights })); } catch { /**/ }
}
function loadCache(): { flights: Flight[]; ts: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p.ts && Array.isArray(p.flights) ? p : null;
  } catch { return null; }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useFlightData(token?: string | null): FlightDataState {
  const [flights,      setFlights]      = useState<Flight[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [lastUpdate,   setLastUpdate]   = useState<Date | null>(null);
  const [source,       setSource]       = useState<DataSource>('offline');
  const [rateLimited,  setRateLimited]  = useState(false);
  const [queriesLeft,  setQueriesLeft]  = useState<number | null>(null);

  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchFlights = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);

    // Abort controller compatible con todos los browsers
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 8000);

    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(OPENSKY_URL, { signal: controller.signal, headers });
      clearTimeout(timeout);

      // Rate limited → mostrar paywall
      if (res.status === 429) {
        if (!mountedRef.current) return;
        setRateLimited(true);
        setSource('offline');
        // Parar polling para no acumular más rechazos
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Leer headers de cuota que devuelve el backend
      const left = res.headers.get('X-Queries-Left');
      if (left != null && mountedRef.current) setQueriesLeft(parseInt(left));

      const json = await res.json();
      if (!mountedRef.current) return;

      const rawStates: unknown[][] = json.states ?? [];
      const parsed = rawStates.map(parseState).filter((f): f is Flight => f !== null);

      setFlights(parsed);
      setLastUpdate(new Date());
      setSource('live');
      setError(null);
      setRateLimited(false);
      saveCache(parsed);

    } catch (err) {
      clearTimeout(timeout);
      if (!mountedRef.current) return;

      const cached = loadCache();
      if (cached && Date.now() - cached.ts < CACHE_MAX_MS) {
        setFlights(cached.flights.map(f => ({ ...f, source: 'stale' as const })));
        setLastUpdate(new Date(cached.ts));
        setSource('stale');
        setError(null);
      } else {
        setFlights([]);
        setSource('offline');
        setError('No se pudo conectar con OpenSky Network');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [token]);

  // Cargar cache inmediatamente
  useEffect(() => {
    const cached = loadCache();
    if (cached && Date.now() - cached.ts < CACHE_MAX_MS) {
      setFlights(cached.flights.map(f => ({ ...f, source: 'stale' as const })));
      setLastUpdate(new Date(cached.ts));
      setSource('stale');
    }
  }, []);

  // Polling — solo cuando tab visible y no rate limited
  useEffect(() => {
    mountedRef.current = true;

    function startPolling() {
      fetchFlights();
      timerRef.current = setInterval(fetchFlights, POLL_INTERVAL_MS);
    }
    function stopPolling() {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    function handleVisibility() {
      if (document.hidden) stopPolling();
      else if (!rateLimited) startPolling();
    }

    if (!rateLimited) startPolling();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      mountedRef.current = false;
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchFlights, rateLimited]);

  return {
    flights, loading, error, lastUpdate, source,
    total: flights.length,
    emergencias: flights.filter(isEmergency),
    rateLimited,
    queriesLeft,
    refresh: fetchFlights,
  };
}
