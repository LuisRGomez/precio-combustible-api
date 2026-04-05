import React, { useEffect, useState, useRef } from 'react';
import { FilterState, PRODUCT_MAP } from '../types';
import { UbicacionResuelta } from '../types';
import { fetchTimeline, fetchEstadisticas, TimelineResponse, EstadisticasResponse } from '../utils/api-estadisticas';
import { formatCurrency } from '../utils/api';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  BarChart2Icon,
  ActivityIcon,
  LoaderIcon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface StatsSectionProps {
  filters: FilterState;
  ubicacion: UbicacionResuelta | null;
}

const PERIOD_OPTIONS = [
  { label: '1 mes', days: 30 },
  { label: '3 meses', days: 90 },
  { label: '6 meses', days: 180 },
  { label: '1 año', days: 365 },
];

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

// Products that have timeline data
const TIMELINE_PRODUCTS = PRODUCT_MAP.filter((p) => p.key !== 'gnc');

export function StatsSection({ filters, ubicacion }: StatsSectionProps) {
  const [selectedProductIdx, setSelectedProductIdx] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState(1); // default: 3 months
  const [timeline, setTimeline] = useState<TimelineResponse | null>(null);
  const [estadisticas, setEstadisticas] = useState<EstadisticasResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef('');

  const selectedProduct = TIMELINE_PRODUCTS[selectedProductIdx];

  useEffect(() => {
    const prov = filters.provincia || ubicacion?.provincia || '';
    const loc = filters.localidad || ubicacion?.localidad_dataset || '';
    const periodDays = PERIOD_OPTIONS[selectedPeriod].days;
    const key = `${prov}|${loc}|${selectedProduct.match}|${periodDays}`;

    if (key === lastFetchRef.current) return;
    lastFetchRef.current = key;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [tl, est] = await Promise.all([
          fetchTimeline({
            provincia: prov || undefined,
            localidad: loc || undefined,
            producto: selectedProduct.match,
            fecha_desde: daysAgoISO(periodDays),
          }),
          // Sin filtro de producto — traemos todos y filtramos client-side
          fetchEstadisticas({
            provincia: prov || undefined,
            localidad: loc || undefined,
          }),
        ]);
        setTimeline(tl);
        setEstadisticas(est);
      } catch (e: any) {
        setError(e.message || 'Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters.provincia, filters.localidad, selectedProduct, selectedPeriod, ubicacion?.provincia, ubicacion?.localidad_dataset]);

  const productoStats = estadisticas?.productos?.find((p) =>
    p.producto.includes(selectedProduct.match)
  );

  const variacion = timeline?.variacion_pct ?? null;
  const VariacionIcon =
    variacion == null ? MinusIcon : variacion > 0 ? TrendingUpIcon : TrendingDownIcon;
  const variacionColor =
    variacion == null
      ? 'text-slate-400'
      : variacion > 0
      ? 'text-red-400'
      : 'text-emerald-400';

  // Format timeline data for recharts
  const chartData = (timeline?.timeline || []).map((pt) => ({
    fecha: pt.fecha,
    min: pt.precio_min,
    promedio: pt.precio_promedio,
    label: new Date(pt.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
    }),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl text-xs">
          <p className="text-slate-400 mb-1">{label}</p>
          {payload.map((p: any) => (
            <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
              {p.name}: {formatCurrency(p.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-8 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-800">
        <ActivityIcon className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-semibold text-slate-100">Estadísticas de Precios</h2>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Product selector */}
        <div className="flex flex-wrap gap-1.5">
          {TIMELINE_PRODUCTS.map((p, idx) => (
            <button
              key={p.key}
              onClick={() => setSelectedProductIdx(idx)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                idx === selectedProductIdx
                  ? `${p.bgClass} ${p.textClass} border`
                  : 'text-slate-400 bg-slate-800/50 border border-slate-700/50 hover:text-slate-200'
              }`}
              style={idx === selectedProductIdx ? { borderColor: `${p.color}40` } : undefined}
            >
              {p.shortLabel}
              <span className="ml-1 opacity-60">{p.unit}</span>
            </button>
          ))}
        </div>

        {/* Period selector */}
        <div className="flex gap-1.5 ml-auto">
          {PERIOD_OPTIONS.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedPeriod(idx)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                idx === selectedPeriod
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                  : 'text-slate-400 bg-slate-800/50 border border-slate-700/50 hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-[260px] flex items-center justify-center gap-3 text-slate-500">
          <LoaderIcon className="w-5 h-5 animate-spin text-amber-500" />
          <span className="text-sm">Cargando estadísticas...</span>
        </div>
      ) : error ? (
        <div className="h-[260px] flex items-center justify-center text-slate-500 text-sm">
          No hay datos disponibles para este período
        </div>
      ) : (
        <>
          {/* Summary cards */}
          {productoStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-0.5">Mínimo</p>
                <p className="text-base font-bold text-emerald-400">
                  {formatCurrency(productoStats.precio_min)}
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-0.5">Promedio</p>
                <p className="text-base font-bold text-amber-400">
                  {formatCurrency(productoStats.precio_promedio)}
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-0.5">Máximo</p>
                <p className="text-base font-bold text-red-400">
                  {formatCurrency(productoStats.precio_max)}
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-0.5">Variación período</p>
                <p className={`text-base font-bold flex items-center gap-1 ${variacionColor}`}>
                  <VariacionIcon className="w-4 h-4" />
                  {variacion != null ? `${variacion > 0 ? '+' : ''}${variacion.toFixed(1)}%` : '—'}
                </p>
              </div>
            </div>
          )}

          {/* Timeline chart */}
          {chartData.length > 0 ? (
            <div className="h-[220px] w-full mb-5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="label"
                    stroke="#475569"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#475569"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    width={38}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="promedio"
                    name="Promedio"
                    stroke={selectedProduct.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: selectedProduct.color }}
                  />
                  <Line
                    type="monotone"
                    dataKey="min"
                    name="Mínimo"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    dot={false}
                    activeDot={{ r: 3, fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[160px] flex flex-col items-center justify-center gap-2 mb-5">
              <ActivityIcon className="w-8 h-8 text-slate-700" />
              <p className="text-slate-500 text-sm">Historial en construcción</p>
              <p className="text-slate-600 text-xs text-center max-w-xs">
                El gráfico de evolución se activa cuando el sistema acumule suficientes registros históricos
              </p>
            </div>
          )}

          {/* Bandera breakdown */}
          {productoStats && productoStats.por_bandera.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart2Icon className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-medium text-slate-300">Precio promedio por bandera</h3>
              </div>
              <div className="space-y-2">
                {[...productoStats.por_bandera]
                  .sort((a, b) => a.precio_promedio - b.precio_promedio)
                  .slice(0, 8)
                  .map((b) => {
                    const pct =
                      productoStats.precio_max > productoStats.precio_min
                        ? ((b.precio_promedio - productoStats.precio_min) /
                            (productoStats.precio_max - productoStats.precio_min)) *
                          100
                        : 50;
                    return (
                      <div key={b.bandera} className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 w-28 truncate flex-shrink-0">
                          {b.bandera}
                        </span>
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(pct, 5)}%`,
                              backgroundColor: selectedProduct.color,
                              opacity: 0.7 + pct * 0.003,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-200 w-20 text-right flex-shrink-0">
                          {formatCurrency(b.precio_promedio)}
                        </span>
                        <span className="text-xs text-slate-500 w-12 text-right flex-shrink-0">
                          {b.cantidad_estaciones} est.
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
