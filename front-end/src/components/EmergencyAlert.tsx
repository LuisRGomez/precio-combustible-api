import React, { useState } from 'react';
import { AlertTriangleIcon, XIcon, RadioIcon } from 'lucide-react';
import { Flight } from '../hooks/useFlightData';

const SQUAWK_INFO: Record<string, { label: string; desc: string; color: string }> = {
  '7700': { label: 'EMERGENCIA GENERAL', desc: 'Problema técnico, médico o estructural', color: 'red'    },
  '7600': { label: 'PÉRDIDA DE RADIO',   desc: 'Sin comunicación con control de tráfico', color: 'amber' },
  '7500': { label: 'ACTO ILÍCITO',       desc: 'Intervención no autorizada (hijacking)',  color: 'purple' },
};

const COLOR_MAP = {
  red:    { bg: 'bg-red-500/15',    border: 'border-red-500/50',    text: 'text-red-400',    badge: 'bg-red-500'    },
  amber:  { bg: 'bg-amber-500/15',  border: 'border-amber-500/50',  text: 'text-amber-400',  badge: 'bg-amber-500'  },
  purple: { bg: 'bg-purple-500/15', border: 'border-purple-500/50', text: 'text-purple-400', badge: 'bg-purple-500' },
};

interface Props {
  emergencias: Flight[];
  onSelectFlight: (f: Flight) => void;
}

export function EmergencyAlert({ emergencias, onSelectFlight }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = emergencias.filter(f => !dismissed.has(f.icao24));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map(f => {
        const info = SQUAWK_INFO[f.squawk ?? ''] ?? SQUAWK_INFO['7700'];
        const C    = COLOR_MAP[info.color as keyof typeof COLOR_MAP];
        const cs   = f.callsign || f.icao24;

        return (
          <div key={f.icao24}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${C.bg} ${C.border} animate-pulse-slow`}>

            {/* Ícono */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${C.badge} bg-opacity-20 flex items-center justify-center mt-0.5`}>
              <AlertTriangleIcon className={`w-4 h-4 ${C.text}`} />
            </div>

            {/* Info */}
            <button
              onClick={() => onSelectFlight(f)}
              className="flex-1 text-left"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-xs font-bold ${C.text} uppercase tracking-wide`}>
                  ⚡ {info.label}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${C.badge} text-white`}>
                  {f.squawk}
                </span>
              </div>
              <p className="text-sm text-slate-200 font-semibold">
                Vuelo {cs} — {f.country}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {info.desc} · Alt: {f.altitude.toLocaleString('es-AR')}m
                {f.velocityKmh > 0 && ` · ${f.velocityKmh} km/h`}
              </p>
            </button>

            {/* Dismiss */}
            <button
              onClick={() => setDismissed(prev => new Set([...prev, f.icao24]))}
              className="flex-shrink-0 p-1 text-slate-600 hover:text-slate-300 transition-colors rounded"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
