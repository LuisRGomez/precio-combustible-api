import React, { useEffect, useRef, useState } from 'react';
import { MapPinIcon } from 'lucide-react';
import type { FuelStop } from '../../hooks/useRoadTripFuel';
import type { SITHotel } from '../../hooks/useSITHoteles';
import type { WaypointWeather } from '../../hooks/useRouteWeather';
import type { RoutePOI } from '../../hooks/useRoutePOIs';
import type { Coords } from '../../hooks/useOSRM';

// ── Props ────────────────────────────────────────────────────────────────────

interface RouteMapProps {
  geometry:          GeoJSON.LineString | null;
  origin:            Coords | null;
  destination:       Coords | null;
  fuelStops:         FuelStop[];
  hotels:            SITHotel[];
  weatherAlerts:     WaypointWeather[];
  pois?:             RoutePOI[];
  selectedFuelIdxs?: Set<number>;
  selectedPOIIds?:   Set<string>;
  className?:        string;
}

// ── Component ────────────────────────────────────────────────────────────────

export function RouteMap({ geometry, origin, destination, fuelStops, hotels, weatherAlerts, pois = [], selectedFuelIdxs, selectedPOIIds, className }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);
  const leafletRef   = useRef<any>(null);
  const layersRef    = useRef<any[]>([]);
  const [ready, setReady] = useState(false);

  // ── Init map ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let destroyed = false;

    async function init() {
      try {
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');
        const leaflet = (L as any).default || L;

        if (destroyed || !containerRef.current) return;

        // Fix default icons (Vite bundling issue)
        try {
          delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
          leaflet.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          });
        } catch {}

        const map = leaflet.map(containerRef.current, {
          center:      [-38, -65] as [number, number],
          zoom:        4,
          zoomControl: true,
        });

        leaflet.tileLayer(
          'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          { attribution: '©OSM ©Carto', maxZoom: 19 }
        ).addTo(map);

        mapRef.current    = map;
        leafletRef.current = leaflet;

        if (!destroyed) setReady(true);
      } catch (err) {
        console.error('RouteMap init error:', err);
      }
    }

    init();

    return () => {
      destroyed = true;
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch {}
        mapRef.current = null;
      }
      setReady(false);
    };
  }, []);

  // ── Update route layers whenever data changes ────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current || !leafletRef.current) return;

    const map     = mapRef.current;
    const leaflet = leafletRef.current;

    // Clear previous layers
    layersRef.current.forEach(l => { try { map.removeLayer(l); } catch {} });
    layersRef.current = [];

    if (!geometry || !geometry.coordinates.length) return;

    // Route polyline
    const latlngs = (geometry.coordinates as number[][]).map(([lon, lat]) => [lat, lon] as [number, number]);
    const poly    = leaflet.polyline(latlngs, { color: '#f59e0b', weight: 4, opacity: 0.9 });
    poly.addTo(map);
    layersRef.current.push(poly);

    // Fit map to route bounds
    try {
      map.invalidateSize();
      map.fitBounds(poly.getBounds(), { padding: [40, 40], maxZoom: 12 });
    } catch {}

    // Origin marker (green)
    if (origin) {
      const m = leaflet.circleMarker([origin.lat, origin.lon], {
        radius: 9, fillColor: '#10b981', color: '#fff', weight: 2.5, fillOpacity: 1,
      }).bindTooltip('Origen', { direction: 'top', permanent: false }).addTo(map);
      layersRef.current.push(m);
    }

    // Destination marker (red)
    if (destination) {
      const m = leaflet.circleMarker([destination.lat, destination.lon], {
        radius: 9, fillColor: '#ef4444', color: '#fff', weight: 2.5, fillOpacity: 1,
      }).bindTooltip('Destino', { direction: 'top', permanent: false }).addTo(map);
      layersRef.current.push(m);
    }

    // Fuel stops ⛽ — larger/brighter when selected
    for (let fi = 0; fi < fuelStops.length; fi++) {
      const stop = fuelStops[fi];
      if (!stop.station) continue;

      // Fallback: si la estación no tiene coords, usar las del waypoint de la ruta
      const lat = stop.station.latitud  || stop.waypoint.lat;
      const lon = stop.station.longitud || stop.waypoint.lon;
      if (!lat || !lon) continue;
      const isApprox = !stop.station.latitud || !stop.station.longitud;
      const isEst    = (stop as any).freshness === 'estimated';

      const isSel = selectedFuelIdxs ? selectedFuelIdxs.has(fi) : true;
      // Color: amarillo=seleccionado, naranja=estimado, gris=no seleccionado
      const bgColor  = isSel ? (isEst ? '#f97316' : '#f59e0b') : '#64748b';
      const border   = isApprox ? '2px dashed #94a3b8' : '2px solid #fff';
      const size     = isSel ? 26 : 20;
      const icon = leaflet.divIcon({
        className: '',
        html: `<div style="background:${bgColor};border:${border};border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:${isSel ? 14 : 11}px;box-shadow:0 2px 6px rgba(0,0,0,.5);opacity:${isSel ? '1' : '0.5'};">⛽</div>`,
        iconSize:   [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      const precioStr = `$${stop.station.precio.toLocaleString('es-AR')}/L${isEst ? ' <i>(referencia)</i>' : ''}`;
      const m = leaflet.marker([lat, lon], { icon })
        .bindPopup(
          `<b>${stop.station.empresa}</b><br>${stop.station.direccion}<br>` +
          `<span style="color:#f59e0b;font-weight:bold">${precioStr}</span><br>` +
          `Km ${stop.waypoint.km_from_start} desde origen` +
          (isApprox ? '<br><i style="color:#94a3b8;font-size:11px">⚠ Ubicación aproximada</i>' : '')
        ).addTo(map);
      layersRef.current.push(m);
    }

    // Hotels 🏨
    for (const hotel of hotels.slice(0, 40)) {
      const icon = leaflet.divIcon({
        className: '',
        html: `<div style="background:#8b5cf6;border:2px solid #fff;border-radius:4px;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,.5);">🏨</div>`,
        iconSize:   [22, 22],
        iconAnchor: [11, 11],
      });
      const m = leaflet.marker([hotel.lat, hotel.lon], { icon })
        .bindPopup(`<b>${hotel.nombre}</b><br>${hotel.localidad}, ${hotel.provincia}<br>${hotel.categoria}`).addTo(map);
      layersRef.current.push(m);
    }

    // Selected POIs 📍 — only show checked ones, with bounce-in style
    const POI_ICONS: Record<string, string> = {
      restaurant: '🍴', cafe: '☕', fast_food: '🍔',
      hotel: '🏨', hostel: '🏨', camping: '⛺',
      rest_area: '🅿️', supermarket: '🛒', pharmacy: '💊',
    };
    const POI_COLORS: Record<string, string> = {
      restaurant: '#f97316', cafe: '#d97706', fast_food: '#eab308',
      hotel: '#8b5cf6', hostel: '#8b5cf6', camping: '#22c55e',
      rest_area: '#38bdf8', supermarket: '#4ade80', pharmacy: '#f87171',
    };
    for (const poi of pois) {
      if (!selectedPOIIds?.has(poi.id)) continue;
      const emoji = POI_ICONS[poi.category] ?? '📍';
      const color = POI_COLORS[poi.category] ?? '#64748b';
      const icon  = leaflet.divIcon({
        className: '',
        html: `<div style="background:${color};border:2px solid #fff;border-radius:8px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 3px 8px rgba(0,0,0,.6);transform:scale(1);">
                 ${emoji}
               </div>`,
        iconSize:   [28, 28],
        iconAnchor: [14, 14],
      });
      const m = leaflet.marker([poi.lat, poi.lon], { icon })
        .bindPopup(`<b>${poi.name}</b><br><span style="color:${color}">${poi.category}</span><br>Km ${poi.km_from_start} desde origen`)
        .addTo(map);
      layersRef.current.push(m);
    }

    // Weather alerts ⚠️
    for (const w of weatherAlerts) {
      if (!w.alert) continue;
      const icon = leaflet.divIcon({
        className: '',
        html: `<div style="background:#ef4444;border:2px solid #fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,.5);">⚠️</div>`,
        iconSize:   [24, 24],
        iconAnchor: [12, 12],
      });
      const m = leaflet.marker([w.lat, w.lon], { icon })
        .bindPopup(`<b>Alerta climática</b><br>${w.alert}<br>Km ${w.km}`).addTo(map);
      layersRef.current.push(m);
    }

  }, [ready, geometry, origin, destination, fuelStops, hotels, weatherAlerts, pois, selectedFuelIdxs, selectedPOIIds]);

  return (
    <div
      className={`relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 ${className ?? ''}`}
    >
      {!geometry && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/80 z-10 pointer-events-none">
          <MapPinIcon className="w-10 h-10 text-slate-600" />
          <p className="text-slate-500 text-sm">Ingresá origen y destino para ver la ruta</p>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 420 }} />
    </div>
  );
}
