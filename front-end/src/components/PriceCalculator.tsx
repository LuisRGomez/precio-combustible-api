import React, { useMemo, useState } from 'react';
import { Station } from '../types';
import { formatCurrency } from '../utils/api';
import {
  CalculatorIcon, DropletsIcon, RouteIcon, CarIcon,
  BellIcon, TrendingDownIcon, CheckIcon, AlertTriangleIcon, PlusCircleIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { staleDaysAgo } from '../utils/stale';
import autosData from '../data/autos.json';
import { MiniLeadForm, isAlreadySubscribed } from './MiniLeadForm';
import { NuevaEstacionModal, ActualizarPrecioModal } from './community/CommunityActions';

type AutoEntry = {
  marca: string; modelo: string; version: string;
  anio_desde: number; anio_hasta: number;
  consumo_ciudad_kml: number; consumo_mixto_kml: number; consumo_ruta_kml: number;
  litros_tanque: number; combustible: string; categoria: string;
};

const autos = autosData as AutoEntry[];

const COMBUSTIBLE_LABEL: Record<string, string> = {
  nafta_super:   'Nafta Super',
  nafta_premium: 'Nafta Premium',
  gasoil:        'Gasoil',
};

interface PriceCalculatorProps { data: Station[]; hasFresh?: boolean }

export function PriceCalculator({ data, hasFresh = true }: PriceCalculatorProps) {
  const [activeTab, setActiveTab] = useState<'fill' | 'trip' | 'auto'>('fill');
  const [showPrecioModal,  setShowPrecioModal]  = useState(false);
  const [showNuevaModal,   setShowNuevaModal]   = useState(false);

  // Fill tab
  const [liters, setLiters] = useState('40');

  // Trip tab
  const [distance,    setDistance]    = useState('100');
  const [consumption, setConsumption] = useState('12');

  // Mi Auto tab — all hooks MUST be before any early return
  const [selectedMarca,  setSelectedMarca]  = useState('');
  const [selectedModelo, setSelectedModelo] = useState('');
  const [kmMes,          setKmMes]          = useState('1000');
  const [showLeadForm,   setShowLeadForm]   = useState(false);

  const marcas = useMemo(() => [...new Set(autos.map(a => a.marca))].sort(), []);
  const modelos = useMemo(
    () => selectedMarca
      ? [...new Set(autos.filter(a => a.marca === selectedMarca).map(a => a.modelo))].sort()
      : [],
    [selectedMarca],
  );
  const autoEntry = useMemo(
    () => selectedMarca && selectedModelo
      ? autos.find(a => a.marca === selectedMarca && a.modelo === selectedModelo) || null
      : null,
    [selectedMarca, selectedModelo],
  );

  // Early returns AFTER all hooks
  if (!data || data.length === 0) return null;

  // Exclude GNC — it's priced per m³ (not per liter), completely different unit.
  // Also exclude any price below 1000 ARS which indicates stale/corrupt data.
  const liquidData  = data.filter(d => {
    const p = d.producto?.toLowerCase() ?? '';
    return !p.includes('gnc') && d.precio >= 1000;
  });
  const validPrices = liquidData.map(d => d.precio).filter(p => p > 0);
  if (validPrices.length === 0) return null;

  const minPrice = Math.min(...validPrices);
  const maxPrice = Math.max(...validPrices);
  const avgPrice = validPrices.reduce((a, b) => a + b, 0) / validPrices.length;

  // Fill
  const l       = parseFloat(liters) || 0;
  const costMin = l * minPrice;
  const costMax = l * maxPrice;
  const savings = costMax - costMin;

  // Trip
  const dist        = parseFloat(distance) || 0;
  const cons        = parseFloat(consumption) || 1;
  const tripLiters  = dist / cons;
  const tripCostAvg = tripLiters * avgPrice;

  const km         = parseFloat(kmMes) || 0;
  const litrosMes  = autoEntry ? km / autoEntry.consumo_mixto_kml : 0;
  const costoMin   = litrosMes * minPrice;
  const costoAvg   = litrosMes * avgPrice;
  const costoMax   = litrosMes * maxPrice;
  const ahorroMes  = costoMax - costoMin;

  const tabs = [
    { id: 'fill'  as const, label: 'Cargar Tanque', icon: DropletsIcon },
    { id: 'trip'  as const, label: 'Viaje',         icon: RouteIcon    },
    { id: 'auto'  as const, label: 'Mi Auto',        icon: CarIcon      },
  ];

  // Average age of prices in days (computed from raw data, before early returns)
  const avgAge = useMemo(() => {
    if (hasFresh) return null;
    const liquid = data.filter(d => !d.producto?.toLowerCase().includes('gnc') && d.precio >= 1000);
    const ages = liquid.map(d => staleDaysAgo(d.fecha_vigencia ?? '')).filter(a => a < 999);
    if (ages.length === 0) return null;
    return Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
  }, [hasFresh, data]);

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-xl mt-6">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-800">
        <CalculatorIcon className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-semibold text-slate-100">Calculadora</h2>
      </div>

      {/* Stale data warning */}
      {!hasFresh && avgAge !== null && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5 mb-4">
          <div className="flex items-start gap-2 text-xs mb-2">
            <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 font-medium">Precios estimados (hace ~{avgAge} días)</p>
              <p className="text-slate-500 mt-0.5">No tenemos precio actualizado para esta zona.</p>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setShowPrecioModal(true)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[11px] font-semibold hover:bg-emerald-500/25 transition">
              💰 Reportar precio actual
            </button>
            <button
              onClick={() => setShowNuevaModal(true)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[11px] font-semibold hover:bg-amber-500/25 transition">
              <PlusCircleIcon className="w-3 h-3" />
              Nueva estación
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showPrecioModal && (
        <ActualizarPrecioModal
          station={{ empresa: '', direccion: '', localidad: '', provincia: '' }}
          open={true}
          onClose={() => setShowPrecioModal(false)}
        />
      )}
      <NuevaEstacionModal open={showNuevaModal} onClose={() => setShowNuevaModal(false)} />

      {/* Tabs */}
      <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800 mb-5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === id ? 'bg-amber-500/20 text-amber-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Cargar Tanque ── */}
      {activeTab === 'fill' && (
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Litros a cargar</label>
            <div className="relative">
              <input
                type="number" value={liters} onChange={e => setLiters(e.target.value)} min="1"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-3 pr-10 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">L</span>
            </div>
          </div>
          <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">En la más barata:</span>
              <span className="font-bold text-emerald-400">{formatCurrency(costMin)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">En la más cara:</span>
              <span className="font-bold text-red-400">{formatCurrency(costMax)}</span>
            </div>
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-sm font-medium text-amber-500">Ahorro posible:</span>
              <span className="font-bold text-amber-500">{formatCurrency(savings)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Viaje ── */}
      {activeTab === 'trip' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Distancia</label>
              <div className="relative">
                <input
                  type="number" value={distance} onChange={e => setDistance(e.target.value)} min="1"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-3 pr-8 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">km</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Consumo</label>
              <div className="relative">
                <input
                  type="number" value={consumption} onChange={e => setConsumption(e.target.value)} min="1"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-3 pr-10 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">km/l</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 space-y-3 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Combustible necesario:</span>
              <span className="font-bold text-slate-200">{tripLiters.toFixed(1)} L</span>
            </div>
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-sm font-medium text-amber-500">Costo estimado (promedio):</span>
              <span className="font-bold text-amber-500">{formatCurrency(tripCostAvg)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Mi Auto ── */}
      {activeTab === 'auto' && (
        <div className="space-y-4">
          {/* Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Marca</label>
              <select
                value={selectedMarca}
                onChange={e => { setSelectedMarca(e.target.value); setSelectedModelo(''); }}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500/60 rounded-lg px-2.5 py-2 text-sm text-slate-200 focus:outline-none transition-colors"
              >
                <option value="">Marca...</option>
                {marcas.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Modelo</label>
              <select
                value={selectedModelo}
                onChange={e => setSelectedModelo(e.target.value)}
                disabled={!selectedMarca}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500/60 rounded-lg px-2.5 py-2 text-sm text-slate-200 focus:outline-none transition-colors disabled:opacity-40"
              >
                <option value="">Modelo...</option>
                {modelos.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Auto info pill */}
          {autoEntry && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/8 border border-amber-500/20 rounded-lg">
              <CarIcon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="text-xs text-amber-300 font-medium">
                {autoEntry.combustible ? COMBUSTIBLE_LABEL[autoEntry.combustible] || autoEntry.combustible : ''} —
                consumo mixto: <strong>{autoEntry.consumo_mixto_kml} km/L</strong> — tanque: {autoEntry.litros_tanque} L
              </span>
            </div>
          )}

          {/* km/mes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Km por mes</label>
            <div className="relative">
              <input
                type="number" value={kmMes} onChange={e => setKmMes(e.target.value)} min="1"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-3 pr-12 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">km/mes</span>
            </div>
          </div>

          {/* Results */}
          {autoEntry && km > 0 ? (
            <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Litros al mes:</span>
                <span className="font-bold text-slate-200">{litrosMes.toFixed(1)} L</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Costo en la más barata:</span>
                <span className="font-bold text-emerald-400">{formatCurrency(costoMin)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Costo promedio de zona:</span>
                <span className="font-bold text-slate-300">{formatCurrency(costoAvg)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">En la más cara:</span>
                <span className="font-bold text-red-400">{formatCurrency(costoMax)}</span>
              </div>
              {ahorroMes > 0 && (
                <div className="pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-2 bg-emerald-500/8 border border-emerald-500/20 rounded-lg p-3">
                    <TrendingDownIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Ahorrás yendo a la más barata:</p>
                      <p className="font-bold text-emerald-400 text-base">{formatCurrency(ahorroMes)} por mes</p>
                      <p className="text-xs text-slate-500">{formatCurrency(ahorroMes * 12)} al año</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : !autoEntry ? (
            <p className="text-slate-600 text-xs text-center py-4">
              Seleccioná marca y modelo para ver el costo mensual.
            </p>
          ) : null}

          {/* CTA */}
          {autoEntry && km > 0 && (
            <div className="pt-2">
              {showLeadForm || isAlreadySubscribed() ? (
                isAlreadySubscribed() ? (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs">
                    <CheckIcon className="w-4 h-4" />
                    <span>Ya estás suscripto a las alertas.</span>
                  </div>
                ) : (
                  <MiniLeadForm
                    placeholder="Email o WhatsApp para alertas"
                    compact
                    onSuccess={() => setShowLeadForm(false)}
                  />
                )
              ) : (
                <button
                  onClick={() => setShowLeadForm(true)}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 hover:border-amber-500/40 text-amber-400 rounded-xl py-2.5 text-sm font-medium transition-colors"
                >
                  <BellIcon className="w-4 h-4" />
                  Avisame cuando baje el precio
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
