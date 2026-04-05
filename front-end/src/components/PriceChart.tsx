import React, { useMemo, useState } from 'react';
import { Station } from '../types';
import { getCompanyColor } from '../utils/api';
import { BarChart3Icon } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell } from
'recharts';
interface PriceChartProps {
  data: Station[];
}
const PRODUCT_TABS = [
{
  label: 'Nafta Súper',
  match: 'entre 92 y 95'
},
{
  label: 'Nafta Premium',
  match: 'más de 95'
},
{
  label: 'Gasoil G2',
  match: 'Gas Oil Grado 2'
},
{
  label: 'Gasoil G3',
  match: 'Gas Oil Grado 3'
},
{
  label: 'GNC',
  match: 'GNC'
}];

export function PriceChart({ data }: PriceChartProps) {
  const [selectedProduct, setSelectedProduct] = useState(0);
  // Detect which products exist in data
  const availableTabs = useMemo(() => {
    return PRODUCT_TABS.map((tab, idx) => ({
      ...tab,
      idx,
      count: data.filter((d) => d.producto.includes(tab.match) && d.precio > 0).
      length
    })).filter((t) => t.count > 0);
  }, [data]);
  // Auto-select first available tab
  const activeTab =
  availableTabs.find((t) => t.idx === selectedProduct) || availableTabs[0];
  const chartData = useMemo(() => {
    if (!data || data.length === 0 || !activeTab) return [];
    // Filter by selected product
    const filtered = data.filter(
      (d) => d.producto.includes(activeTab.match) && d.precio > 0
    );
    // Group by company
    const companyStats = filtered.reduce(
      (acc, curr) => {
        if (!acc[curr.empresa]) {
          acc[curr.empresa] = {
            sum: 0,
            count: 0,
            empresa: curr.empresa
          };
        }
        acc[curr.empresa].sum += curr.precio;
        acc[curr.empresa].count += 1;
        return acc;
      },
      {} as Record<
        string,
        {
          sum: number;
          count: number;
          empresa: string;
        }>

    );
    return Object.values(companyStats).
    map((stat) => ({
      empresa: stat.empresa,
      precioPromedio: Math.round(stat.sum / stat.count * 100) / 100,
      color: getCompanyColor(stat.empresa),
      estaciones: stat.count
    })).
    sort((a, b) => a.precioPromedio - b.precioPromedio).
    slice(0, 12); // Top 12 to keep chart readable
  }, [data, activeTab]);
  if (chartData.length === 0 || availableTabs.length === 0) return null;
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="font-bold text-slate-200 mb-1">{entry.empresa}</p>
          <p className="text-amber-500 font-medium">
            Promedio:{' '}
            {new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS'
            }).format(payload[0].value)}
          </p>
          <p className="text-slate-400 text-xs mt-1">
            {entry.estaciones} estación{entry.estaciones > 1 ? 'es' : ''}
          </p>
        </div>);

    }
    return null;
  };
  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3Icon className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-semibold text-slate-100">
          Comparativa por Empresa
        </h2>
      </div>

      {/* Product tabs */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {availableTabs.map((tab) =>
        <button
          key={tab.idx}
          onClick={() => setSelectedProduct(tab.idx)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab?.idx === tab.idx ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'text-slate-400 bg-slate-800/50 border border-slate-700/50 hover:text-slate-200'}`}>
          
            {tab.label}
            <span className="ml-1 opacity-60">({tab.count})</span>
          </button>
        )}
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 5,
              right: 30,
              left: 40,
              bottom: 5
            }}>
            
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              horizontal
              vertical={false} />
            
            <XAxis
              type="number"
              tickFormatter={(v) => `$${v.toLocaleString('es-AR')}`}
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false} />
            
            <YAxis
              dataKey="empresa"
              type="category"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={110} />
            
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                fill: '#1e293b'
              }} />
            
            <Bar dataKey="precioPromedio" radius={[0, 4, 4, 0]} barSize={22}>
              {chartData.map((entry, index) =>
              <Cell key={`cell-${index}`} fill={entry.color} />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>);

}