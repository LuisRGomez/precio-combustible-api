import React, { useMemo } from 'react';
import { BedDoubleIcon, MapPinIcon, StarIcon } from 'lucide-react';
import type { SITHotel } from '../../hooks/useSITHoteles';

interface HotelsPanelProps {
  hotels:  SITHotel[];
  loading: boolean;
}

function Stars({ cat }: { cat: string }) {
  // categoria puede ser "1 estrella", "2 estrellas", "3 estrellas", etc.
  const n = parseInt(cat.match(/\d/)?.[0] ?? '0', 10);
  if (n <= 0) return <span className="text-[10px] text-slate-600">{cat || 'Sin categoría'}</span>;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: Math.min(n, 5) }).map((_, i) => (
        <StarIcon key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
      ))}
    </span>
  );
}

export function HotelsPanel({ hotels, loading }: HotelsPanelProps) {
  if (loading) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BedDoubleIcon className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-slate-300">Alojamientos en ruta</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-800/60 rounded-lg animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!hotels.length) return null;

  // Group by localidad, sort groups by first hotel's distancia
  const byLocalidad = useMemo(() => {
    const map = new Map<string, SITHotel[]>();
    for (const h of hotels) {
      const key = `${h.localidad}, ${h.provincia}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(h);
    }
    return [...map.entries()]
      .sort((a, b) => (a[1][0]?.distancia_ruta_km ?? 0) - (b[1][0]?.distancia_ruta_km ?? 0))
      .slice(0, 8);  // max 8 localidades
  }, [hotels]);

  const totalByLocalidad = byLocalidad.reduce((s, [, hs]) => s + hs.length, 0);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BedDoubleIcon className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-slate-300">Alojamientos en ruta</h3>
        </div>
        <span className="text-xs text-slate-500">{totalByLocalidad} establecimiento{totalByLocalidad !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-3">
        {byLocalidad.map(([localidad, hs]) => (
          <div key={localidad} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <MapPinIcon className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-300">{localidad}</span>
              </div>
              <span className="text-[10px] text-slate-500">
                {hs[0]?.distancia_ruta_km} km de la ruta
              </span>
            </div>
            <div className="space-y-1.5">
              {hs.slice(0, 4).map((h, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 truncate flex-1">{h.nombre}</span>
                  <Stars cat={h.categoria} />
                </div>
              ))}
              {hs.length > 4 && (
                <p className="text-[10px] text-slate-600">+{hs.length - 4} más...</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-700 mt-3">
        Fuente: Ministerio de Turismo de Argentina (SIT) · Establecimientos a menos de 5 km de la ruta.
      </p>
    </div>
  );
}
