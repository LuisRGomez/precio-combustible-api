import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  WrenchIcon, PlusIcon, AlertTriangleIcon, CheckCircleIcon,
  Trash2Icon, PencilIcon, AlertCircleIcon, GaugeIcon,
} from 'lucide-react';
import { useMantenimiento, MantenimientoEntry, MantenimientoInput, TipoMantenimiento } from '../../../hooks/useMantenimiento';
import { useGarage } from '../../../hooks/useGarage';

const API_BASE = import.meta.env.VITE_API_BASE || '';
const TOKEN_KEY = 'tankear_token';

const inputCls = "w-full bg-slate-900 border border-slate-700 focus:border-amber-500/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors";
const FAV_KEY = 'tankear_talleres_fav';

interface TallerFav { nombre: string; localidad: string; telefono: string; }

function getTallerFavs(): TallerFav[] {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch { return []; }
}
function saveTallerFav(t: TallerFav) {
  if (!t.nombre.trim()) return;
  const favs = getTallerFavs().filter(f => f.nombre.toLowerCase() !== t.nombre.toLowerCase());
  localStorage.setItem(FAV_KEY, JSON.stringify([t, ...favs].slice(0, 5)));
}

const TIPOS: { value: TipoMantenimiento; label: string; icon: string }[] = [
  { value: 'aceite',    label: 'Cambio de aceite', icon: '🛢️' },
  { value: 'vtv',       label: 'VTV',              icon: '📋' },
  { value: 'frenos',    label: 'Frenos',           icon: '🛑' },
  { value: 'cubiertas', label: 'Cubiertas',        icon: '🔄' },
  { value: 'filtro',    label: 'Filtro de aire',   icon: '🌀' },
  { value: 'patente',   label: 'Patente',          icon: '💳' },
  { value: 'otro',      label: 'Otro',             icon: '⚙️' },
];

function tipoLabel(tipo: TipoMantenimiento) {
  return TIPOS.find(t => t.value === tipo) ?? { label: tipo, icon: '🔧' };
}

function formatFecha(s: string) {
  try { return new Date(s + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return s; }
}
function formatCurrency(n?: number | null) {
  if (n == null) return null;
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

// ─── Servicio Form ────────────────────────────────────────────────────────────

interface ServicioFormProps {
  initial?: Partial<MantenimientoInput>;
  vehiculoId: number;
  vehiculos: { id: number; marca: string; modelo: string }[];
  onSave:   (data: MantenimientoInput) => Promise<boolean>;
  onCancel: () => void;
  saving:   boolean;
  error?:   string | null;
}

function ServicioForm({ initial, vehiculoId, vehiculos, onSave, onCancel, saving, error }: ServicioFormProps) {
  const [tipo,          setTipo]         = useState<TipoMantenimiento>(initial?.tipo ?? 'aceite');
  const [fecha,         setFecha]        = useState(initial?.fecha ?? new Date().toISOString().split('T')[0]);
  const [kmVehiculo,    setKmVehiculo]   = useState(initial?.km_vehiculo?.toString() ?? '');
  const [kmProximo,     setKmProximo]    = useState(initial?.km_proximo?.toString() ?? '');
  const [fechaProxima,  setFechaProxima] = useState(initial?.fecha_proxima ?? '');
  const [costo,         setCosto]        = useState(initial?.costo?.toString() ?? '');
  const [tallerNombre,  setTallerNombre] = useState(initial?.taller_nombre ?? '');
  const [tallerLocal,   setTallerLocal]  = useState(initial?.taller_localidad ?? '');
  const [tallerTel,     setTallerTel]    = useState(initial?.taller_telefono ?? '');
  const [notas,         setNotas]        = useState(initial?.notas ?? '');
  const [vehId,         setVehId]        = useState(initial?.vehiculo_id ?? vehiculoId);
  const [showTallerFavs, setShowTallerFavs] = useState(false);
  const tallerFavs = getTallerFavs();

  function applyFav(f: TallerFav) {
    setTallerNombre(f.nombre);
    setTallerLocal(f.localidad);
    setTallerTel(f.telefono);
    setShowTallerFavs(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await onSave({
      vehiculo_id: vehId,
      tipo,
      fecha,
      km_vehiculo:      kmVehiculo   ? parseInt(kmVehiculo)   : null,
      km_proximo:       kmProximo    ? parseInt(kmProximo)    : null,
      fecha_proxima:    fechaProxima || null,
      costo:            costo        ? parseFloat(costo)      : null,
      taller_nombre:    tallerNombre.trim() || null,
      taller_localidad: tallerLocal.trim()  || null,
      taller_telefono:  tallerTel.trim()    || null,
      notas:            notas.trim()        || null,
    });
    if (ok && tallerNombre.trim()) {
      saveTallerFav({ nombre: tallerNombre.trim(), localidad: tallerLocal.trim(), telefono: tallerTel.trim() });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tipo */}
      <div>
        <label className="block text-xs text-slate-400 mb-2">Tipo de servicio</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {TIPOS.map(t => (
            <button key={t.value} type="button"
              onClick={() => setTipo(t.value)}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs transition-colors ${
                tipo === t.value
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                  : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              <span className="text-base">{t.icon}</span>
              <span className="leading-tight text-center">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Vehículo + fecha */}
      <div className="grid grid-cols-2 gap-3">
        {vehiculos.length > 1 && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Vehículo</label>
            <select value={vehId} onChange={e => setVehId(parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none appearance-none">
              {vehiculos.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Fecha del servicio</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Km */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Km al momento</label>
          <input type="number" value={kmVehiculo} onChange={e => setKmVehiculo(e.target.value)} min={0} step={100} placeholder="ej. 45000" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Próximo servicio (km)</label>
          <input type="number" value={kmProximo} onChange={e => setKmProximo(e.target.value)} min={0} step={100} placeholder="ej. 55000" className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Fecha próximo servicio</label>
          <input type="date" value={fechaProxima} onChange={e => setFechaProxima(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Costo ($)</label>
          <input type="number" value={costo} onChange={e => setCosto(e.target.value)} min={0} step={100} placeholder="ej. 35000" className={inputCls} />
        </div>
      </div>

      {/* Taller */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-slate-400">Taller (opcional)</label>
          {tallerFavs.length > 0 && (
            <button type="button" onClick={() => setShowTallerFavs(p => !p)}
              className="text-[11px] text-amber-400 hover:text-amber-300">
              ⭐ Favoritos ({tallerFavs.length})
            </button>
          )}
        </div>
        {showTallerFavs && (
          <div className="bg-slate-950 border border-slate-700 rounded-lg divide-y divide-slate-800">
            {tallerFavs.map((f, i) => (
              <button key={i} type="button" onClick={() => applyFav(f)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-900 transition-colors">
                <p className="text-slate-200 font-medium">{f.nombre}</p>
                <p className="text-slate-500">{f.localidad}{f.telefono ? ` · ${f.telefono}` : ''}</p>
              </button>
            ))}
          </div>
        )}
        <input value={tallerNombre} onChange={e => setTallerNombre(e.target.value)} placeholder="Nombre del taller" className={inputCls} />
        <div className="grid grid-cols-2 gap-2">
          <input value={tallerLocal} onChange={e => setTallerLocal(e.target.value)} placeholder="Localidad" className={inputCls} />
          <input value={tallerTel} onChange={e => setTallerTel(e.target.value)} placeholder="Teléfono" className={inputCls} />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">Notas</label>
        <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
          placeholder="Observaciones, repuestos usados..." className={inputCls + ' resize-none'} />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />{error}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancelar</button>
        <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 hover:border-amber-500/50 transition-colors disabled:opacity-40">
          {saving ? 'Guardando…' : 'Guardar servicio'}
        </button>
      </div>
    </form>
  );
}

// ─── Record Card ──────────────────────────────────────────────────────────────

function RecordCard({ r, onEdit, onDelete }: { r: MantenimientoEntry; onEdit: () => void; onDelete: () => void }) {
  const t = tipoLabel(r.tipo);
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base flex-shrink-0">{t.icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100">{t.label}</p>
            <p className="text-xs text-slate-500">{formatFecha(r.fecha)}{r.km_vehiculo ? ` · km ${r.km_vehiculo.toLocaleString('es-AR')}` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onEdit} className="p-1 text-slate-600 hover:text-slate-300 transition-colors"><PencilIcon className="w-3 h-3" /></button>
          <button onClick={onDelete} className="p-1 text-slate-600 hover:text-red-400 transition-colors"><Trash2Icon className="w-3 h-3" /></button>
        </div>
      </div>
      {(r.taller_nombre || r.km_proximo || r.costo) && (
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
          {r.taller_nombre && <span>🏪 {r.taller_nombre}{r.taller_localidad ? ` (${r.taller_localidad})` : ''}</span>}
          {r.km_proximo && <span>🔜 Próximo: {r.km_proximo.toLocaleString('es-AR')} km</span>}
          {r.costo != null && <span className="text-emerald-400/80">{formatCurrency(r.costo)}</span>}
        </div>
      )}
      {r.notas && <p className="mt-2 text-xs text-slate-600 italic">{r.notas}</p>}
    </div>
  );
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────

function AlertBanner({ urgencia, children }: { urgencia: 'urgente' | 'pronto'; children: React.ReactNode }) {
  const isUrgent = urgencia === 'urgente';
  return (
    <div className={`flex items-start gap-3 rounded-xl px-4 py-3 border text-sm ${
      isUrgent
        ? 'bg-red-500/10 border-red-500/30 text-red-300'
        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
    }`}>
      <AlertTriangleIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isUrgent ? 'text-red-400' : 'text-amber-400'}`} />
      <div>{children}</div>
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

interface MantenimientoTabProps {
  showSuccess: (msg: string) => void;
}

export function MantenimientoTab({ showSuccess }: MantenimientoTabProps) {
  const { registros, alertas, loading, error, loadRegistros, loadAlertas, addRegistro, editRegistro, deleteRegistro } = useMantenimiento();
  const garage = useGarage();

  const [mode,       setMode]       = useState<'list' | 'add' | 'edit'>('list');
  const [editReg,    setEditReg]    = useState<MantenimientoEntry | null>(null);
  const [formError,  setFormError]  = useState<string | null>(null);
  const [selVehId,   setSelVehId]   = useState<number | null>(null);
  const [kmEdit,     setKmEdit]     = useState('');
  const [kmSaving,   setKmSaving]   = useState(false);
  const [kmSuccess,  setKmSuccess]  = useState(false);

  useEffect(() => {
    garage.loadVehicles();
    loadAlertas();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Select first (principal) vehicle by default
  useEffect(() => {
    if (!selVehId && garage.vehicles.length > 0) {
      const principal = garage.principalVehicle ?? garage.vehicles[0];
      setSelVehId(principal.id);
      setKmEdit(principal.km_actual?.toString() ?? '');
    }
  }, [garage.vehicles]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load registros when vehicle changes
  useEffect(() => {
    if (selVehId) loadRegistros(selVehId);
  }, [selVehId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selVehicle = useMemo(() => garage.vehicles.find(v => v.id === selVehId) ?? null, [garage.vehicles, selVehId]);
  const vehiculos = garage.vehicles.map(v => ({ id: v.id, marca: v.marca, modelo: v.modelo }));

  // Alertas del vehículo seleccionado
  const myAlertas = useMemo(() => alertas.filter(a => a.vehiculo_id === selVehId), [alertas, selVehId]);

  async function handleSaveKm() {
    if (!selVehId || !kmEdit) return;
    setKmSaving(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE}/garage/${selVehId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ km_actual: parseInt(kmEdit) }),
      });
      if (res.ok) {
        await garage.loadVehicles();
        setKmSuccess(true);
        setTimeout(() => setKmSuccess(false), 2000);
        showSuccess('Odómetro actualizado ✓');
      }
    } finally {
      setKmSaving(false);
    }
  }

  async function handleSave(data: MantenimientoInput): Promise<boolean> {
    setFormError(null);
    if (editReg) {
      const res = await editRegistro(editReg.id, data);
      if (!res) { setFormError('Error al actualizar'); return false; }
      showSuccess('Servicio actualizado ✓');
    } else {
      const res = await addRegistro(data);
      if (!res) { setFormError('Error al guardar'); return false; }
      await loadAlertas();
      showSuccess('Servicio registrado 🔧');
    }
    setMode('list');
    setEditReg(null);
    return true;
  }

  async function handleDelete(id: number) {
    const ok = await deleteRegistro(id);
    if (ok) showSuccess('Registro eliminado');
  }

  if (mode === 'add' || mode === 'edit') {
    return (
      <div>
        <h3 className="text-sm font-semibold text-slate-200 mb-4">{mode === 'edit' ? 'Editar servicio' : 'Registrar servicio'}</h3>
        <ServicioForm
          initial={editReg ? {
            vehiculo_id: editReg.vehiculo_id, tipo: editReg.tipo, fecha: editReg.fecha,
            km_vehiculo: editReg.km_vehiculo ?? undefined, km_proximo: editReg.km_proximo ?? undefined,
            fecha_proxima: editReg.fecha_proxima ?? undefined, costo: editReg.costo ?? undefined,
            taller_nombre: editReg.taller_nombre ?? undefined, taller_localidad: editReg.taller_localidad ?? undefined,
            taller_telefono: editReg.taller_telefono ?? undefined, notas: editReg.notas ?? undefined,
          } : undefined}
          vehiculoId={selVehId ?? garage.principalVehicle?.id ?? 0}
          vehiculos={vehiculos}
          onSave={handleSave}
          onCancel={() => { setMode('list'); setEditReg(null); }}
          saving={loading}
          error={formError}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Vehicle selector */}
      {garage.vehicles.length > 1 && (
        <div>
          <label className="block text-xs text-slate-400 mb-1">Vehículo</label>
          <select value={selVehId ?? ''} onChange={e => { setSelVehId(parseInt(e.target.value)); setKmEdit(''); }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none appearance-none">
            {garage.vehicles.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} {v.anio ?? ''}</option>)}
          </select>
        </div>
      )}

      {/* Odómetro */}
      {selVehicle && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <GaugeIcon className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-semibold text-slate-200">Odómetro</p>
          </div>
          <div className="flex gap-2">
            <input
              type="number" value={kmEdit} onChange={e => setKmEdit(e.target.value)}
              placeholder={selVehicle.km_actual != null ? selVehicle.km_actual.toLocaleString('es-AR') : 'Km actuales'}
              min={0} step={100}
              className="flex-1 bg-slate-950 border border-slate-700 focus:border-amber-500/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
            />
            <button
              onClick={handleSaveKm}
              disabled={!kmEdit || kmSaving}
              className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 transition-colors disabled:opacity-40"
            >
              {kmSaving ? '…' : kmSuccess ? '✓' : 'Guardar'}
            </button>
          </div>
          {selVehicle.km_actual != null && (
            <p className="text-xs text-slate-500 mt-1">Último registrado: {selVehicle.km_actual.toLocaleString('es-AR')} km</p>
          )}
        </div>
      )}

      {/* Alertas */}
      {myAlertas.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Alertas</p>
          {myAlertas.map((a, i) => (
            <AlertBanner key={i} urgencia={a.urgencia}>
              {a.tipo === 'aceite' && (
                <div>
                  <p className="font-semibold">🛢️ Cambio de aceite {a.urgencia === 'urgente' ? '— URGENTE' : '— pronto'}</p>
                  {a.km_desde_ultimo != null && a.intervalo != null && (
                    <p className="text-xs opacity-80 mt-0.5">
                      {a.km_desde_ultimo.toLocaleString('es-AR')} km desde el último (cada {a.intervalo.toLocaleString('es-AR')} km)
                      {a.km_faltantes != null && a.km_faltantes > 0 && ` · faltan ${a.km_faltantes.toLocaleString('es-AR')} km`}
                    </p>
                  )}
                </div>
              )}
              {a.tipo === 'vtv' && (
                <div>
                  <p className="font-semibold">📋 VTV vence {a.urgencia === 'urgente' ? '— URGENTE' : 'pronto'}</p>
                  {a.dias_restantes != null && (
                    <p className="text-xs opacity-80 mt-0.5">
                      {a.dias_restantes > 0 ? `En ${a.dias_restantes} días` : 'Ya venció'}{a.vencimiento ? ` (${formatFecha(a.vencimiento)})` : ''}
                    </p>
                  )}
                </div>
              )}
              {a.tipo === 'seguro' && (
                <div>
                  <p className="font-semibold">🛡️ Seguro vence {a.urgencia === 'urgente' ? '— URGENTE' : 'pronto'}</p>
                  {a.dias_restantes != null && (
                    <p className="text-xs opacity-80 mt-0.5">
                      {a.dias_restantes > 0 ? `En ${a.dias_restantes} días` : 'Ya venció'}{a.aseguradora ? ` · ${a.aseguradora}` : ''}
                    </p>
                  )}
                </div>
              )}
            </AlertBanner>
          ))}
        </div>
      )}

      {/* Sin alertas */}
      {myAlertas.length === 0 && selVehicle && registros.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3">
          <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
          <span>Todo en orden — sin alertas de mantenimiento</span>
        </div>
      )}

      {/* Agregar servicio */}
      <button
        onClick={() => { setEditReg(null); setFormError(null); setMode('add'); }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-slate-700 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 text-sm transition-colors"
      >
        <PlusIcon className="w-4 h-4" />Registrar servicio
      </button>

      {/* Loading / error */}
      {loading && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircleIcon className="w-3.5 h-3.5" />{error}
        </div>
      )}

      {/* Empty state */}
      {!loading && registros.length === 0 && (
        <div className="text-center py-8">
          <WrenchIcon className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-medium">Sin historial de mantenimiento</p>
          <p className="text-xs text-slate-600 mt-1">Registrá cambios de aceite, VTV, frenos y más</p>
        </div>
      )}

      {/* Historial */}
      {registros.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Historial</p>
          {registros.map(r => (
            <RecordCard
              key={r.id} r={r}
              onEdit={() => { setEditReg(r); setFormError(null); setMode('edit'); }}
              onDelete={() => handleDelete(r.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
