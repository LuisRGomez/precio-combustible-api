import { useState, useEffect } from 'react';
import { RouteWaypoint } from './useOSRM';

// ── Types ────────────────────────────────────────────────────────────────────

export interface WaypointWeather {
  lat:          number;
  lon:          number;
  km:           number;
  temp:         number | null;
  wind_speed:   number | null;  // km/h
  weather_code: number | null;
  alert:        string | null;
}

export interface RouteWeatherResult {
  weather:  WaypointWeather[];
  alerts:   WaypointWeather[];  // filtered: only those with alert != null
  loading:  boolean;
  error:    string | null;
}

// ── WMO Code → description ───────────────────────────────────────────────────
function wmoDescription(code: number): string | null {
  const STORM  = [95, 96, 99];
  const SNOW   = [71, 73, 75, 77, 85, 86];
  const HAIL   = [96, 99];
  const RAIN_H = [65, 67, 82];

  if (HAIL.includes(code))         return 'Granizo';
  if (STORM.includes(code))        return 'Tormenta';
  if (SNOW.includes(code))         return 'Nevada';
  if (RAIN_H.includes(code))       return 'Lluvia intensa';
  if ([63, 64, 66].includes(code)) return 'Lluvia moderada';
  return null;
}

function buildAlert(wind_speed: number | null, weather_code: number | null): string | null {
  const parts: string[] = [];
  if (weather_code !== null) {
    const desc = wmoDescription(weather_code);
    if (desc) parts.push(desc);
  }
  if (wind_speed !== null && wind_speed > 60) {
    parts.push(`Viento fuerte (${wind_speed} km/h)`);
  } else if (wind_speed !== null && wind_speed > 40) {
    parts.push(`Viento moderado (${wind_speed} km/h)`);
  }
  return parts.length ? parts.join(' · ') : null;
}

// ── Fetch ────────────────────────────────────────────────────────────────────

function fetchWithTimeout(url: string, ms = 6000): Promise<Response> {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

async function fetchWeatherForPoint(lat: number, lon: number): Promise<{ temp: number | null; wind: number | null; code: number | null }> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,weather_code&wind_speed_unit=kmh&forecast_days=1`;
    const r   = await fetchWithTimeout(url);
    const j   = await r.json();
    return {
      temp: j.current?.temperature_2m ?? null,
      wind: j.current?.wind_speed_10m ?? null,
      code: j.current?.weather_code   ?? null,
    };
  } catch {
    return { temp: null, wind: null, code: null };
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param waypoints  Points to query. Pass fuel-stop waypoints for per-stop weather,
 *                   or route waypoints for route-level coverage.
 * @param maxPoints  Cap parallel requests to Open-Meteo (free tier, no key). Default 8.
 */
export function useRouteWeather(waypoints: RouteWaypoint[], maxPoints = 8): RouteWeatherResult {
  const [result, setResult] = useState<RouteWeatherResult>({
    weather: [], alerts: [], loading: false, error: null,
  });

  useEffect(() => {
    if (!waypoints.length) {
      setResult({ weather: [], alerts: [], loading: false, error: null });
      return;
    }

    // Trim to maxPoints evenly-spaced if needed (Open-Meteo free tier)
    const sample: RouteWaypoint[] = (() => {
      if (waypoints.length <= maxPoints) return waypoints;
      return Array.from({ length: maxPoints }, (_, i) =>
        waypoints[Math.round(i * (waypoints.length - 1) / (maxPoints - 1))]
      );
    })();

    let cancelled = false;
    setResult(prev => ({ ...prev, loading: true, error: null }));

    async function run() {
      try {
        const results = await Promise.all(
          sample.map(async wp => {
            const w = await fetchWeatherForPoint(wp.lat, wp.lon);
            return {
              lat:          wp.lat,
              lon:          wp.lon,
              km:           wp.km_from_start,
              temp:         w.temp,
              wind_speed:   w.wind,
              weather_code: w.code,
              alert:        buildAlert(w.wind, w.code),
            } as WaypointWeather;
          })
        );

        if (cancelled) return;

        const alerts = results.filter(w => w.alert !== null);
        setResult({ weather: results, alerts, loading: false, error: null });
      } catch (e: any) {
        if (!cancelled) setResult(prev => ({ ...prev, loading: false, error: e.message }));
      }
    }

    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waypoints, maxPoints]);

  return result;
}
