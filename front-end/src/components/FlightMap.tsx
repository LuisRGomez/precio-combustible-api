import React, { useEffect, useRef, useState } from 'react';
import { Flight } from '../hooks/useFlightData';
import { AEROPUERTOS_AR } from '../data/airports';
import { getAirline } from '../data/airlines';

interface Props {
  flights:        Flight[];
  selectedFlight: Flight | null;
  onSelectFlight: (f: Flight) => void;
}

// ─── SVG de avión rotado ──────────────────────────────────────────────────────
function planeIcon(heading: number, color: string, small = false): string {
  const size = small ? 20 : 26;
  const half = size / 2;
  return `
    <div style="
      width:${size}px; height:${size}px;
      transform: rotate(${heading}deg);
      filter: drop-shadow(0 1px 3px rgba(0,0,0,0.6));
    ">
      <svg viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg"
           width="${size}" height="${size}">
        <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2h0A1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z"/>
      </svg>
    </div>
    <div style="
      position:absolute; top:-14px; left:50%; transform:translateX(-50%) rotate(${-heading}deg);
      background:rgba(15,23,42,0.85); color:#e2e8f0; font-size:8px; font-weight:700;
      padding:1px 4px; border-radius:3px; white-space:nowrap; font-family:monospace;
      border:1px solid rgba(255,255,255,0.1); pointer-events:none;
    "></div>
  `.trim();
}

function airportIcon(): string {
  return `
    <div style="
      width:28px; height:28px; border-radius:50%;
      background:rgba(245,158,11,0.15); border:2px solid rgba(245,158,11,0.4);
      display:flex; align-items:center; justify-content:center;
      font-size:14px; line-height:1;
    ">✈</div>
  `;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function FlightMap({ flights, selectedFlight, onSelectFlight }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<unknown>(null);
  const leafletRef   = useRef<unknown>(null);
  const markersRef   = useRef<Map<string, unknown>>(new Map());
  const airportMarksRef = useRef<unknown[]>([]);
  const [mapError, setMapError] = useState(false);

  // ── Inicializar mapa ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');

        if (cancelled || !containerRef.current) return;
        leafletRef.current = L;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = (L as any).map(containerRef.current, {
          center:          [-34.6, -64.2],
          zoom:            5,
          zoomControl:     true,
          attributionControl: false,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (L as any).tileLayer(
          'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          { maxZoom: 18 },
        ).addTo(map);

        mapRef.current = map;

        // Aeropuertos — marcadores fijos (dato duro)
        AEROPUERTOS_AR.forEach(ap => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const icon = (L as any).divIcon({
            html:        airportIcon(),
            iconSize:    [28, 28],
            iconAnchor:  [14, 14],
            className:   '',
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const m = (L as any).marker([ap.lat, ap.lon], { icon })
            .addTo(map)
            .bindPopup(`
              <div style="font-family:sans-serif; min-width:150px;">
                <div style="font-size:11px; color:#94a3b8; margin-bottom:2px;">${ap.iata} / ${ap.icao}</div>
                <div style="font-size:13px; font-weight:700; color:#f1f5f9;">${ap.nombre}</div>
                <div style="font-size:11px; color:#64748b;">${ap.ciudad}</div>
              </div>
            `, { maxWidth: 200 });
          airportMarksRef.current.push(m);
        });
      } catch {
        setMapError(true);
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapRef.current as any).remove();
        mapRef.current = null;
      }
    };
  }, []);

  // ── Actualizar markers de vuelos ────────────────────────────────────────────
  useEffect(() => {
    const L   = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    const seen = new Set<string>();

    flights.forEach(f => {
      if (!f.lat || !f.lon) return;
      seen.add(f.icao24);

      const airline = getAirline(f.callsign);
      const color   = f.squawk === '7700' ? '#ef4444'
                    : f.squawk === '7600' ? '#f59e0b'
                    : f.squawk === '7500' ? '#a855f7'
                    : f.onGround          ? '#64748b'
                    : (airline?.color    ?? '#94a3b8');

      const cs   = f.callsign || f.icao24.toUpperCase();
      const alt  = f.altitude > 0 ? `${(f.altitude / 1000).toFixed(1)} km` : 'suelo';
      const vel  = f.velocityKmh > 0 ? `${f.velocityKmh} km/h` : '';
      const vert = f.verticalRate > 0.5 ? '▲' : f.verticalRate < -0.5 ? '▼' : '—';

      const popupHtml = `
        <div style="font-family:sans-serif; min-width:180px;">
          <div style="font-size:14px; font-weight:800; color:#f1f5f9; margin-bottom:4px;">${cs}</div>
          ${airline ? `<div style="font-size:11px; color:#94a3b8; margin-bottom:6px;">${airline.nombre}</div>` : ''}
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px;">
            <div><div style="font-size:9px; color:#64748b;">País</div><div style="font-size:11px; color:#e2e8f0;">${f.country}</div></div>
            <div><div style="font-size:9px; color:#64748b;">Altitud</div><div style="font-size:11px; color:#e2e8f0;">${alt}</div></div>
            ${vel ? `<div><div style="font-size:9px; color:#64748b;">Velocidad</div><div style="font-size:11px; color:#e2e8f0;">${vel}</div></div>` : ''}
            <div><div style="font-size:9px; color:#64748b;">Vertical</div><div style="font-size:11px; color:#e2e8f0;">${vert}</div></div>
            <div><div style="font-size:9px; color:#64748b;">Heading</div><div style="font-size:11px; color:#e2e8f0;">${f.heading}°</div></div>
            ${f.squawk ? `<div><div style="font-size:9px; color:#ef4444;">Squawk</div><div style="font-size:11px; color:#ef4444; font-weight:700;">${f.squawk}</div></div>` : ''}
          </div>
          <div style="margin-top:8px; font-size:9px; color:#475569;">ICAO: ${f.icao24} · Fuente: ${f.source}</div>
        </div>
      `;

      if (markersRef.current.has(f.icao24)) {
        // Actualizar posición existente
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = markersRef.current.get(f.icao24) as any;
        m.setLatLng([f.lat, f.lon]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const icon = (L as any).divIcon({
          html:       `<div style="transform:rotate(${f.heading}deg);filter:drop-shadow(0 1px 3px rgba(0,0,0,.6))"><svg viewBox="0 0 24 24" fill="${color}" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2h0A1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z"/></svg></div>`,
          iconSize:   [22, 22],
          iconAnchor: [11, 11],
          className:  '',
        });
        m.setIcon(icon);
        m.setPopupContent(popupHtml);
      } else {
        // Crear marker nuevo
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const icon = (L as any).divIcon({
          html:       `<div style="transform:rotate(${f.heading}deg);filter:drop-shadow(0 1px 3px rgba(0,0,0,.6))"><svg viewBox="0 0 24 24" fill="${color}" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2h0A1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z"/></svg></div>`,
          iconSize:   [22, 22],
          iconAnchor: [11, 11],
          className:  '',
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = (L as any).marker([f.lat, f.lon], { icon })
          .addTo(map)
          .bindPopup(popupHtml, { maxWidth: 250 })
          .on('click', () => onSelectFlight(f));
        markersRef.current.set(f.icao24, m);
      }
    });

    // Eliminar markers de vuelos que ya no están
    markersRef.current.forEach((m, icao24) => {
      if (!seen.has(icao24)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (map as any).removeLayer(m);
        markersRef.current.delete(icao24);
      }
    });
  }, [flights, onSelectFlight]);

  // ── Centrar en vuelo seleccionado ───────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedFlight) return;
    if (selectedFlight.lat && selectedFlight.lon) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (map as any).flyTo([selectedFlight.lat, selectedFlight.lon], 9, { duration: 1.2 });
      const m = markersRef.current.get(selectedFlight.icao24);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (m) (m as any).openPopup();
    }
  }, [selectedFlight]);

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 text-sm">
        Error al cargar el mapa
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full"
      style={{ background: '#0f172a' }}
    />
  );
}
