// Extraído de GarageSection.tsx — CRUD de vehículos sin cambios funcionales
import React, { useEffect, useMemo, useState } from 'react';
import {
  CarIcon, PlusIcon, PencilIcon, Trash2Icon,
  StarIcon, CheckIcon, AlertCircleIcon, ChevronDownIcon,
} from 'lucide-react';
import autosData from '../../../data/autos.json';
import { useGarage, GarageVehicle, GarageVehicleIn } from '../../../hooks/useGarage';

type AutoEntry = {
  marca: string; modelo: string; version: string;
  consumo_ruta_kml: number; consumo_mixto_kml?: number; consumo_ciudad_kml?: number;
  litros_tanque: number; combustible: string;
};
const autos = autosData as AutoEntry[];

const COMBUSTIBLES = [
  { value: 'nafta_super',   label: 'Nafta Súper' },
  { value: 'nafta_premium', label: 'Nafta Premium' },
  { value: 'gasoil',        label: 'Gasoil' },
  { value: 'gnc',           label: 'GNC' },
];

const CURRENT_YEAR = new Date().getFullYear();

function formatConsumo(v?: number | null): string {
  return v != null ? `${v} km/L` : '—';
}

interface VehicleFormProps {
  initial?: Partial<GarageVehicleIn>;
  onSave:   (v: GarageVehicleIn) => Promise<void>;
  onCancel: () => void;
  saving:   boolean;
  error?:   string | null;
}

function VehicleForm({ initial, onSave, onCancel, saving, error }: VehicleFormProps) {
  const [selectedMarca,   setSelectedMarca]   = useState(initial?.marca   ?? '');
  const [selectedModelo,  setSelectedModelo]  = useState(initial?.modelo  ?? '');
  const [selectedVersion, setSelectedVersion] = useState(initial?.version ?? '');
  const [anio,            setAnio]            = useState(initial?.anio?.toString() ?? '');
  const [combustible,     setCombustible]     = useState(initial?.combustible ?? '');
  const [litrosTanque,    setLitrosTanque]    = useState(initial?.litros_tanque?.toString() ?? '');
  const [consumoRuta,     setConsumoRuta]     = useState(initial?.consumo_ruta?.toString() ?? '');
  const [consumoMixto,    setConsumoMixto]    = useState(initial?.consumo_mixto?.toString() ?? '');
  const [consumoCiudad,   setConsumoCiudad]   = useState(initial?.consumo_ciudad?.toString() ?? '');
  const [esPrincipal,     setEsPrincipal]     = useState(initial?.es_principal ?? false);
  const [manualMarca,     setManualMarca]     = useState('');
  const [manualModelo,    setManualModelo]    = useState('');
  const [useManual,       setUseManual]       = useState(false);

  const marcas   = useMemo(() => [...new Set(autos.map(a => a.marca))].sort(), []);
  const modelos  = useMemo(() => selectedMarca ? [...new Set(autos.filter(a => a.marca === selectedMarca).map(a => a.modelo))].sort() : [], [selectedMarca]);
  const versiones = useMemo(() => (selectedMarca && selectedModelo) ? autos.filter(a => a.marca === selectedMarca && a.modelo === selectedModelo) : [], [selectedMarca, selectedModelo]);

  const autoEntry = useMemo(() => {
    if (!selectedMarca || !selectedModelo) return null;
    if (selectedVersion) return autos.find(a => a.marca === selectedMarca && a.modelo === selectedModelo && a.version === selectedVersion) ?? null;
    return autos.find(a => a.marca === selectedMarca && a.modelo === selectedModelo) ?? null;
  }, [selectedMarca, selectedModelo, selectedVersion]);

  useEffect(() => {
    if (!autoEntry) return;
    if (!litrosTanque) setLitrosTanque(autoEntry.litros_tanque.toString());
    if (!consumoRuta)  setConsumoRuta(autoEntry.consumo_ruta_kml.toString());
    if (!consumoMixto && autoEntry.consumo_mixto_kml)   setConsumoMixto(autoEntry.consumo_mixto_kml.toString());
    if (!consumoCiudad && autoEntry.consumo_ciudad_kml) setConsumoCiudad(autoEntry.consumo_ciudad_kml.toString());
    if (!combustible) setCombustible(autoEntry.combustible);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoEntry]);

  const marcaFinal  = useManual ? manualMarca  : selectedMarca;
  const modeloFinal = useManual ? manualModelo : selectedModelo;
  const canSave = marcaFinal.trim() && modeloFinal.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    await onSave({
      marca:          marcaFinal.trim(),
      modelo:         modeloFinal.trim(),
      version:        useManual ? undefined : (selectedVersion || undefined),
      anio:           anio ? parseInt(anio) : undefined,
      combustible:    combustible || undefined,
      litros_tanque:  litrosTanque ? parseFloat(litrosTanque) : undefined,
      consumo_ciudad: consumoCiudad ? parseFloat(consumoCiudad) : undefined,
      consumo_mixto:  consumoMixto  ? parseFloat(consumoMixto)  : undefined,
      consumo_ruta:   consumoRuta   ? parseFloat(consumoRuta)   : undefined,
      es_principal:   esPrincipal,
    });
  }

  const selectCls = "w-full bg-slate-900 border border-slate-700 focus:border-amber-500/60 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors appearance-none";
  const inputCls  = "w-full bg-slate-900 border border-slate-700 focus:border-amber-500/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setUseManual(p => !p)} className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2">
          {useManual ? '← Buscar en el listado' : 'Mi auto no está en el listado →'}
        </button>
      </div>
      {useManual ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Marca *</label>
            <input value={manualMarca} onChange={e => setManualMarca(e.target.value)} placeholder="ej. Renault" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Modelo *</label>
            <input value={manualModelo} onChange={e => setManualModelo(e.target.value)} placeholder="ej. Sandero" className={inputCls} />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <label className="block text-xs text-slate-400 mb-1">Marca *</label>
            <div className="relative">
              <select value={selectedMarca} onChange={e => { setSelectedMarca(e.target.value); setSelectedModelo(''); setSelectedVersion(''); }} className={selectCls}>
                <option value="">— Seleccioná la marca —</option>
                {marcas.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>
          </div>
          {selectedMarca && (
            <div className="relative">
              <label className="block text-xs text-slate-400 mb-1">Modelo *</label>
              <div className="relative">
                <select value={selectedModelo} onChange={e => { setSelectedModelo(e.target.value); setSelectedVersion(''); }} className={selectCls}>
                  <option value="">— Seleccioná el modelo —</option>
                  {modelos.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>
          )}
          {versiones.length > 1 && (
            <div className="relative">
              <label className="block text-xs text-slate-400 mb-1">Versión</label>
              <div className="relative">
                <select value={selectedVersion} onChange={e => setSelectedVersion(e.target.value)} className={selectCls}>
                  <option value="">— Todas las versiones —</option>
                  {versiones.map(v => <option key={v.version} value={v.version}>{v.version}</option>)}
                </select>
                <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Año</label>
          <input type="number" value={anio} onChange={e => setAnio(e.target.value)} min={1980} max={CURRENT_YEAR + 1} placeholder="ej. 2020" className={inputCls} />
        </div>
        <div className="relative">
          <label className="block text-xs text-slate-400 mb-1">Combustible</label>
          <div className="relative">
            <select value={combustible} onChange={e => setCombustible(e.target.value)} className={selectCls}>
              <option value="">— Tipo —</option>
              {COMBUSTIBLES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Tanque (litros)</label>
          <input type="number" value={litrosTanque} onChange={e => setLitrosTanque(e.target.value)} min={10} max={200} step={0.5} placeholder="ej. 50" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Consumo ruta (km/L)</label>
          <input type="number" value={consumoRuta} onChange={e => setConsumoRuta(e.target.value)} min={3} max={35} step={0.1} placeholder="ej. 12.5" className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Consumo mixto (km/L)</label>
          <input type="number" value={consumoMixto} onChange={e => setConsumoMixto(e.target.value)} min={3} max={35} step={0.1} placeholder="ej. 10" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Consumo ciudad (km/L)</label>
          <input type="number" value={consumoCiudad} onChange={e => setConsumoCiudad(e.target.value)} min={3} max={35} step={0.1} placeholder="ej. 8" className={inputCls} />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <div onClick={() => setEsPrincipal(p => !p)} className={`relative w-9 h-5 rounded-full transition-colors ${esPrincipal ? 'bg-amber-500' : 'bg-slate-700'}`}>
          <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${esPrincipal ? 'translate-x-4' : ''}`} />
        </div>
        <span className="text-sm text-slate-300">Vehículo principal</span>
      </label>
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />{error}
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancelar</button>
        <button type="submit" disabled={!canSave || saving} className="flex-1 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 hover:border-amber-500/50 transition-colors disabled:opacity-40">
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

function VehicleCard({ vehicle, onEdit, onDelete, onPrincipal }: { vehicle: GarageVehicle; onEdit: () => void; onDelete: () => void; onPrincipal: () => void; }) {
  const combustibleLabel = COMBUSTIBLES.find(c => c.value === vehicle.combustible)?.label ?? vehicle.combustible ?? '—';
  return (
    <div className={`relative rounded-xl p-4 border transition-colors ${vehicle.es_principal ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
      {vehicle.es_principal && (
        <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
          <StarIcon className="w-2.5 h-2.5 fill-amber-400" />Principal
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
          <CarIcon className="w-4 h-4 text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-100 truncate">
            {vehicle.marca} {vehicle.modelo}{vehicle.version && <span className="text-slate-400 font-normal"> · {vehicle.version}</span>}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {vehicle.anio && <span>{vehicle.anio} · </span>}{combustibleLabel}{vehicle.litros_tanque && <span> · {vehicle.litros_tanque}L</span>}
          </p>
          {(vehicle.consumo_ruta || vehicle.consumo_mixto || vehicle.consumo_ciudad) && (
            <div className="flex gap-3 mt-2 text-[11px] text-slate-500">
              {vehicle.consumo_ruta   && <span>Ruta: <span className="text-slate-300 font-medium">{formatConsumo(vehicle.consumo_ruta)}</span></span>}
              {vehicle.consumo_mixto  && <span>Mixto: <span className="text-slate-300 font-medium">{formatConsumo(vehicle.consumo_mixto)}</span></span>}
              {vehicle.consumo_ciudad && <span>Ciudad: <span className="text-slate-300 font-medium">{formatConsumo(vehicle.consumo_ciudad)}</span></span>}
            </div>
          )}
          {vehicle.km_actual != null && (
            <p className="text-[11px] text-slate-500 mt-1">🔢 {vehicle.km_actual.toLocaleString('es-AR')} km</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-3">
        {!vehicle.es_principal && (
          <button onClick={onPrincipal} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 transition-colors">
            <StarIcon className="w-3 h-3" />Principal
          </button>
        )}
        <button onClick={onEdit} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">
          <PencilIcon className="w-3 h-3" />Editar
        </button>
        <button onClick={onDelete} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-colors">
          <Trash2Icon className="w-3 h-3" />Eliminar
        </button>
      </div>
    </div>
  );
}

function DeleteConfirm({ vehicle, onConfirm, onCancel, deleting }: { vehicle: GarageVehicle; onConfirm: () => void; onCancel: () => void; deleting: boolean; }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
        <AlertCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-slate-200">¿Eliminar este vehículo?</p>
          <p className="text-xs text-slate-400 mt-1">{vehicle.marca} {vehicle.modelo}{vehicle.version ? ` · ${vehicle.version}` : ''}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancelar</button>
        <button onClick={onConfirm} disabled={deleting} className="flex-1 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-40">
          {deleting ? 'Eliminando…' : 'Sí, eliminar'}
        </button>
      </div>
    </div>
  );
}

interface AutosTabProps {
  showSuccess: (msg: string) => void;
}

export function AutosTab({ showSuccess }: AutosTabProps) {
  const garage = useGarage();
  const [mode,          setMode]          = useState<'list' | 'add' | 'edit' | 'delete'>('list');
  const [targetVehicle, setTargetVehicle] = useState<GarageVehicle | null>(null);
  const [formError,     setFormError]     = useState<string | null>(null);
  const [actionError,   setActionError]   = useState<string | null>(null);

  useEffect(() => { garage.loadVehicles(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd(v: GarageVehicleIn) {
    setFormError(null);
    const res = await garage.addVehicle(v);
    if (!res.ok) { setFormError(res.error ?? 'Error'); return; }
    setMode('list');
    showSuccess('Vehículo agregado 🚗');
  }

  async function handleEdit(v: GarageVehicleIn) {
    if (!targetVehicle) return;
    setFormError(null);
    const res = await garage.editVehicle(targetVehicle.id, v);
    if (!res.ok) { setFormError(res.error ?? 'Error'); return; }
    setMode('list');
    showSuccess('Cambios guardados ✓');
  }

  async function handleDelete() {
    if (!targetVehicle) return;
    setActionError(null);
    const res = await garage.deleteVehicle(targetVehicle.id);
    if (!res.ok) { setActionError(res.error ?? 'Error al eliminar'); return; }
    setMode('list');
    showSuccess('Vehículo eliminado');
  }

  async function handlePrincipal(id: number) {
    await garage.setPrincipal(id);
    showSuccess('Vehículo principal actualizado ✓');
  }

  const canAddMore = garage.vehicles.length < 5;

  return (
    <div>
      {garage.loading && mode === 'list' && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      )}
      {garage.error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
          <AlertCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />{garage.error}
        </div>
      )}

      {mode === 'list' && !garage.loading && (
        <div className="space-y-3">
          {garage.vehicles.length === 0 && (
            <div className="text-center py-8">
              <CarIcon className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">Tu garage está vacío</p>
              <p className="text-xs text-slate-600 mt-1">Agregá tu auto para calcular gastos exactos</p>
            </div>
          )}
          {garage.vehicles.map(v => (
            <VehicleCard
              key={v.id} vehicle={v}
              onEdit={() => { setTargetVehicle(v); setFormError(null); setMode('edit'); }}
              onDelete={() => { setTargetVehicle(v); setActionError(null); setMode('delete'); }}
              onPrincipal={() => handlePrincipal(v.id)}
            />
          ))}
          {canAddMore && (
            <button onClick={() => { setFormError(null); setMode('add'); }} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-slate-700 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 text-sm transition-colors">
              <PlusIcon className="w-4 h-4" />Agregar vehículo
            </button>
          )}
          {!canAddMore && <p className="text-center text-xs text-slate-600">Máximo 5 vehículos por cuenta</p>}
          <div className="mt-4 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <p className="text-xs text-slate-400 text-center">¿Tu auto tiene datos de consumo distintos? <span className="text-amber-400">Actualizalos y ayudás a toda la comunidad.</span></p>
          </div>
        </div>
      )}

      {mode === 'add' && <VehicleForm onSave={handleAdd} onCancel={() => setMode('list')} saving={garage.loading} error={formError} />}
      {mode === 'edit' && targetVehicle && (
        <VehicleForm
          initial={{ marca: targetVehicle.marca, modelo: targetVehicle.modelo, version: targetVehicle.version ?? undefined, anio: targetVehicle.anio ?? undefined, combustible: targetVehicle.combustible ?? undefined, litros_tanque: targetVehicle.litros_tanque ?? undefined, consumo_ciudad: targetVehicle.consumo_ciudad ?? undefined, consumo_mixto: targetVehicle.consumo_mixto ?? undefined, consumo_ruta: targetVehicle.consumo_ruta ?? undefined, es_principal: targetVehicle.es_principal }}
          onSave={handleEdit} onCancel={() => setMode('list')} saving={garage.loading} error={formError}
        />
      )}
      {mode === 'delete' && targetVehicle && <DeleteConfirm vehicle={targetVehicle} onConfirm={handleDelete} onCancel={() => setMode('list')} deleting={garage.loading} />}
      {actionError && (
        <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />{actionError}
        </div>
      )}
    </div>
  );
}
