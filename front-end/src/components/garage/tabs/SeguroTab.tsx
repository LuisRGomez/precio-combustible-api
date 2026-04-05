import React, { useEffect, useState, useMemo } from 'react';
import { ShieldIcon, AlertTriangleIcon, CheckCircleIcon, PencilIcon, AlertCircleIcon, ExternalLinkIcon } from 'lucide-react';
import { useGarage, GarageVehicle } from '../../../hooks/useGarage';

const inputCls = "w-full bg-slate-900 border border-slate-700 focus:border-amber-500/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors";

const ASEGURADORAS = ['La Caja', 'Zurich', 'Allianz', 'Mapfre', 'San Cristóbal', 'Provincia Seguros', 'SMG Seguros', 'Rivadavia', 'ATM', 'Sancor', 'Otro'];

const COBERTURAS = [
  { value: 'terceros',          label: 'Terceros' },
  { value: 'terceros_completo', label: 'Terceros completo' },
  { value: 'todo_riesgo',       label: 'Todo riesgo' },
];

// Benchmark ranges (ARS/mes) — hardcoded, mejorar con datos reales
function getBenchmark(v: GarageVehicle | null): { min: number; max: number } | null {
  if (!v) return null;
  const anio = v.anio ?? 2015;
  const edad = new Date().getFullYear() - anio;
  let base = { min: 55_000, max: 90_000 };
  if (edad > 10) base = { min: 45_000, max: 75_000 };
  if (edad <= 3)  base = { min: 90_000, max: 160_000 };
  if (v.combustible === 'gnc') { base.min += 5_000; base.max += 8_000; }
  return base;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

function diasHasta(fecha: string): number {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const f = new Date(fecha + 'T00:00:00');
  return Math.round((f.getTime() - hoy.getTime()) / 86_400_000);
}

function formatFecha(s: string) {
  try { return new Date(s + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return s; }
}

// ─── Seguro Form ──────────────────────────────────────────────────────────────

interface SeguroFormProps {
  initial: Partial<{
    vencimiento_seguro: string;
    costo_seguro: number;
    aseguradora: string;
    cobertura_seguro: string;
  }>;
  vehiculoId: number;
  vehiculos: { id: number; marca: string; modelo: string }[];
  onSave: (data: {
    vehiculo_id: number;
    vencimiento_seguro: string;
    costo_seguro: number | null;
    aseguradora: string | null;
    cobertura_seguro: string | null;
  }) => Promise<boolean>;
  onCancel: () => void;
  saving: boolean;
  error?: string | null;
}

function SeguroForm({ initial, vehiculoId, vehiculos, onSave, onCancel, saving, error }: SeguroFormProps) {
  const [aseguradora, setAseguradora] = useState(initial.aseguradora ?? '');
  const [cobertura,   setCobertura]   = useState(initial.cobertura_seguro ?? '');
  const [costo,       setCosto]       = useState(initial.costo_seguro?.toString() ?? '');
  const [vencimiento, setVencimiento] = useState(initial.vencimiento_seguro ?? '');
  const [vehId,       setVehId]       = useState(vehiculoId);
  const [asegInput,   setAsegInput]   = useState(initial.aseguradora ?? '');
  const [showSug,     setShowSug]     = useState(false);

  const sug = ASEGURADORAS.filter(a => a.toLowerCase().includes(asegInput.toLowerCase()) && asegInput.length > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vencimiento) return;
    await onSave({
      vehiculo_id: vehId,
      vencimiento_seguro: vencimiento,
      costo_seguro: costo ? parseFloat(costo) : null,
      aseguradora: aseguradora.trim() || null,
      cobertura_seguro: cobertura || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {vehiculos.length > 1 && (
        <div>
          <label className="block text-xs text-slate-400 mb-1">Vehículo</label>
          <select value={vehId} onChange={e => setVehId(parseInt(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none appearance-none">
            {vehiculos.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo}</option>)}
          </select>
        </div>
      )}

      {/* Aseguradora con autocompletado */}
      <div className="relative">
        <label className="block text-xs text-slate-400 mb-1">Aseguradora</label>
        <input
          value={asegInput}
          onChange={e => { setAsegInput(e.target.value); setAseguradora(e.target.value); setShowSug(true); }}
          onBlur={() => setTimeout(() => setShowSug(false), 150)}
          onFocus={() => setShowSug(true)}
          placeholder="ej. La Caja, Zurich, Allianz..."
          className={inputCls}
        />
        {showSug && sug.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
            {sug.map(a => (
              <button key={a} type="button"
                onMouseDown={() => { setAseguradora(a); setAsegInput(a); setShowSug(false); }}
                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
              >{a}</button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">Cobertura</label>
        <select value={cobertura} onChange={e => setCobertura(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none appearance-none">
          <option value="">— Seleccioná cobertura —</option>
          {COBERTURAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Costo mensual ($)</label>
          <input type="number" value={costo} onChange={e => setCosto(e.target.value)}
            min={0} step={100} placeholder="ej. 85000" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Vencimiento *</label>
          <input type="date" value={vencimiento} onChange={e => setVencimiento(e.target.value)}
            required className={inputCls} />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />{error}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancelar</button>
        <button type="submit" disabled={!vencimiento || saving} className="flex-1 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 hover:border-amber-500/50 transition-colors disabled:opacity-40">
          {saving ? 'Guardando…' : 'Guardar seguro'}
        </button>
      </div>
    </form>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

interface SeguroTabProps {
  showSuccess: (msg: string) => void;
}

export function SeguroTab({ showSuccess }: SeguroTabProps) {
  const garage = useGarage();
  const [mode,       setMode]      = useState<'view' | 'edit'>('view');
  const [selVehId,   setSelVehId]  = useState<number | null>(null);
  const [formError,  setFormError] = useState<string | null>(null);

  useEffect(() => { garage.loadVehicles(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selVehId && garage.vehicles.length > 0) {
      setSelVehId((garage.principalVehicle ?? garage.vehicles[0]).id);
    }
  }, [garage.vehicles]); // eslint-disable-line react-hooks/exhaustive-deps

  const selVehicle = useMemo(() => garage.vehicles.find(v => v.id === selVehId) ?? null, [garage.vehicles, selVehId]);
  const vehiculos  = garage.vehicles.map(v => ({ id: v.id, marca: v.marca, modelo: v.modelo }));
  const benchmark  = useMemo(() => getBenchmark(selVehicle), [selVehicle]);
  const diasRest   = selVehicle?.vencimiento_seguro ? diasHasta(selVehicle.vencimiento_seguro) : null;
  const coberLabel = COBERTURAS.find(c => c.value === selVehicle?.cobertura_seguro)?.label ?? selVehicle?.cobertura_seguro;

  async function handleSave(data: Parameters<SeguroFormProps['onSave']>[0]): Promise<boolean> {
    setFormError(null);
    const res = await garage.editVehicle(data.vehiculo_id, {
      marca:             selVehicle?.marca  ?? '',
      modelo:            selVehicle?.modelo ?? '',
      vencimiento_seguro: data.vencimiento_seguro,
      costo_seguro:       data.costo_seguro ?? undefined,
      aseguradora:        data.aseguradora ?? undefined,
      cobertura_seguro:   data.cobertura_seguro ?? undefined,
    });
    if (!res.ok) { setFormError(res.error ?? 'Error al guardar'); return false; }
    showSuccess('Seguro guardado ✓');
    setMode('view');
    return true;
  }

  const hasSeg = !!(selVehicle?.vencimiento_seguro);

  return (
    <div className="space-y-4">
      {/* Vehicle selector */}
      {garage.vehicles.length > 1 && (
        <div>
          <label className="block text-xs text-slate-400 mb-1">Vehículo</label>
          <select value={selVehId ?? ''} onChange={e => setSelVehId(parseInt(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none appearance-none">
            {garage.vehicles.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} {v.anio ?? ''}</option>)}
          </select>
        </div>
      )}

      {mode === 'edit' ? (
        <>
          <h3 className="text-sm font-semibold text-slate-200">Registrar seguro</h3>
          <SeguroForm
            initial={{
              aseguradora:       selVehicle?.aseguradora        ?? undefined,
              cobertura_seguro:  selVehicle?.cobertura_seguro   ?? undefined,
              costo_seguro:      selVehicle?.costo_seguro       ?? undefined,
              vencimiento_seguro: selVehicle?.vencimiento_seguro ?? undefined,
            }}
            vehiculoId={selVehId ?? 0}
            vehiculos={vehiculos}
            onSave={handleSave}
            onCancel={() => { setMode('view'); setFormError(null); }}
            saving={garage.loading}
            error={formError}
          />
        </>
      ) : hasSeg ? (
        <>
          {/* Alerta vencimiento */}
          {diasRest != null && diasRest <= 30 && (
            <div className={`flex items-start gap-3 rounded-xl px-4 py-3 border text-sm ${
              diasRest <= 15
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <AlertTriangleIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${diasRest <= 15 ? 'text-red-400' : 'text-amber-400'}`} />
              <div>
                <p className="font-semibold">
                  {diasRest <= 0 ? '🛡️ Tu seguro venció' : `🛡️ Tu seguro vence en ${diasRest} día${diasRest !== 1 ? 's' : ''}`}
                </p>
                <p className="text-xs opacity-80 mt-0.5">Recordá renovarlo para no quedar sin cobertura</p>
              </div>
            </div>
          )}

          {/* Card seguro */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldIcon className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {selVehicle?.aseguradora ?? 'Seguro registrado'}
                    {coberLabel && <span className="ml-2 text-xs font-normal text-slate-500">{coberLabel}</span>}
                  </p>
                </div>
              </div>
              <button onClick={() => setMode('edit')} className="p-1 text-slate-600 hover:text-slate-300 transition-colors">
                <PencilIcon className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1.5 text-sm">
              {selVehicle?.costo_seguro != null && (
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-600">💰</span>
                  <span>{formatCurrency(selVehicle.costo_seguro)}/mes</span>
                </div>
              )}
              {selVehicle?.vencimiento_seguro && (
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-600">📅</span>
                  <span>Vence: {formatFecha(selVehicle.vencimiento_seguro)}</span>
                  {diasRest != null && diasRest > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      diasRest > 30 ? 'bg-emerald-500/15 text-emerald-400' :
                      diasRest > 15 ? 'bg-amber-500/15 text-amber-400' :
                      'bg-red-500/15 text-red-400'
                    }`}>
                      {diasRest > 30 ? `en ${diasRest} días` : `¡en ${diasRest} días!`}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Benchmark */}
          {benchmark && selVehicle?.costo_seguro != null && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 mb-2">📊 ¿Estás pagando de más?</p>
              <p className="text-xs text-slate-500 mb-2">
                Rango estimado para {selVehicle.marca} {selVehicle.modelo} {selVehicle.anio ?? ''}:
                {' '}<span className="text-slate-300 font-medium">{formatCurrency(benchmark.min)} – {formatCurrency(benchmark.max)}/mes</span>
              </p>
              {selVehicle.costo_seguro < benchmark.min && (
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <span>⚠️</span><span>Tu póliza está por debajo del rango — verificá la cobertura</span>
                </div>
              )}
              {selVehicle.costo_seguro >= benchmark.min && selVehicle.costo_seguro <= benchmark.max && (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircleIcon className="w-3.5 h-3.5" /><span>Tu póliza está dentro del rango promedio ✅</span>
                </div>
              )}
              {selVehicle.costo_seguro > benchmark.max && (
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <span>💸</span><span>Tu póliza supera el rango estimado — puede valer la pena cotizar</span>
                </div>
              )}
            </div>
          )}

          {/* Cotizador CTA */}
          <a
            href="/cotizador"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-blue-500/30 bg-blue-500/5 text-blue-400 text-sm font-semibold hover:bg-blue-500/10 hover:border-blue-500/50 transition-colors"
          >
            <ExternalLinkIcon className="w-4 h-4" />
            Cotizar con otras aseguradoras
          </a>
        </>
      ) : (
        /* Empty state */
        <div className="text-center py-8 space-y-3">
          <ShieldIcon className="w-14 h-14 text-slate-700 mx-auto" />
          <div>
            <p className="text-sm font-semibold text-slate-300">No tenés seguro registrado</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Registrá tu póliza para recibir recordatorios de vencimiento y comparar si estás pagando de más
            </p>
          </div>
          <button
            onClick={() => setMode('edit')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 hover:border-amber-500/50 transition-colors"
          >
            <ShieldIcon className="w-4 h-4" />
            Registrar seguro
          </button>
          <div className="pt-2">
            <a href="/cotizador" className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1">
              Cotizar seguros <ExternalLinkIcon className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
