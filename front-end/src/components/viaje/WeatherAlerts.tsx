import React from 'react';
import { CloudLightningIcon, WindIcon, SnowflakeIcon, DropletIcon, CheckCircleIcon } from 'lucide-react';
import type { WaypointWeather } from '../../hooks/useRouteWeather';

interface WeatherAlertsProps {
  weather: WaypointWeather[];
  loading: boolean;
}

function alertIcon(alert: string) {
  if (alert.includes('Tormenta') || alert.includes('Granizo')) return <CloudLightningIcon className="w-4 h-4 flex-shrink-0" />;
  if (alert.includes('Viento'))   return <WindIcon            className="w-4 h-4 flex-shrink-0" />;
  if (alert.includes('Nevada'))   return <SnowflakeIcon       className="w-4 h-4 flex-shrink-0" />;
  return                                  <DropletIcon        className="w-4 h-4 flex-shrink-0" />;
}

function alertColor(alert: string): string {
  if (alert.includes('Tormenta') || alert.includes('Granizo') || alert.includes('Viento fuerte'))
    return 'bg-red-500/10 border-red-500/30 text-red-400';
  return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
}

export function WeatherAlerts({ weather, loading }: WeatherAlertsProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-600 px-1">
        <span className="w-3 h-3 border border-slate-700 border-t-slate-500 rounded-full animate-spin" />
        Consultando clima en la ruta...
      </div>
    );
  }

  if (!weather.length) return null;

  const alerts = weather.filter(w => w.alert);

  if (!alerts.length) {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-3 py-2">
        <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
        Sin alertas climáticas en el trayecto
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((w, i) => (
        <div key={i} className={`flex items-start gap-2.5 border rounded-lg px-3 py-2.5 text-xs ${alertColor(w.alert!)}`}>
          {alertIcon(w.alert!)}
          <div>
            <p className="font-semibold">{w.alert}</p>
            <p className="opacity-70 mt-0.5">
              Km {w.km}{w.temp !== null ? ` · ${w.temp}°C` : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
