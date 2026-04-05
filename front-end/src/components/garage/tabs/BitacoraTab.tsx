import React, { useEffect, useState, useMemo } from 'react';
import {
  PlusIcon, MapPinIcon, Trash2Icon, PencilIcon, AlertCircleIcon,
  ClockIcon, DropletIcon, BanknoteIcon, SearchIcon, FilterIcon,
  ChevronDownIcon, ChevronUpIcon, CalendarIcon, BarChart2Icon,
  RouteIcon, CarIcon,
} from 'lucide-react';
import { useBitacora, BitacoraEntry, BitacoraInput } from '../../../hooks/useBitacora';
import { useGarage } from '../../../hooks/useGarage';
import { useClima } from '../../../hooks/useClima';

const inputCls = "w-full bg-slate-900 border border-slate-700 focus:border-amber-500/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors";

// ─── Formatters ──────────────────────────────────────────────────────────────
function formatFecha(s: string) {
  try { return new Date(s + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return s; }
}
function formatFechaMes(s: string) {
  try { return new Date(s + 'T00:00:00').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }); }
  catch { return s; }
}
function formatMin(min?: number | null) {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + 'min' : ''}`.trim() : `${m}min`;
}
function formatCurrency(n?: number | null) {
  if (n == null) return null;
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}
function getYearMonth(fecha: string) {
  return { year: fecha.slice(0, 4), month: fecha.slice(0, 7) };
}

// ─── EntryForm ────────────────────────────────────────────────────────────────
interface EntryFormProps {
  initial?: Partial<BitacoraInput>;
  vehiculoId?: number;
  vehiculos: { id: number; marca: string; modelo: string }[];
  onSave: (data: BitacoraInput) => Promise<boolean>;
  onCancel: () => void;
  saving: boolean;
  error?: string | null;
}

function EntryForm({ initial, vehiculoId, vehiculos, onSave, onCancel, saving, error }: EntryFormProps) {
  const { clima } = useClima();
  const [origen,  setOrigen]  = useState(initial?.origen ?? '');
  const [destino, setDestino] = useState(initial?.destino ?? '');
  const [fecha,   setFecha]   = useState(initial?.fecha_inicio ?? new Date().toISOString().split('T')[0]);
  const [km,      setKm]      = useState(initial?.km_recorridos?.toString() ?? '');
  const [litros,  setLitros]  = useState(initial?.litros_cargados?.toString() ?? '');
  const [precio,  setPrecio]  = useState(initial?.precio_litro?.toString() ?? '');
  const [horas,   setHoras]   = useState(initial?.tiempo_min != null ? Math.floor(initial.tiempo_min / 60).toString() : '');
  const [mins,    setMins]    = useState(initial?.tiempo_min != null ? (initial.tiempo_min % 60).toString() : '');
  const [notas,   setNotas]   = useState(initial?.notas ?? '');
  const [vehId,   setVehId]   = useState<number | undefined>(initial?.vehiculo_id ?? vehiculoId);

  const costoAuto = litros && precio ? (parseFloat(litros) * parseFloat(precio)).toFixed(0) : '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!origen.trim() || !destino.trim()) return;
    const tiempoMin = (horas ? parseInt(horas) * 60 : 0) + (mins ? parseInt(mins) : 0);
    const climaStr = clima ? JSON.stringify({ temp: clima.temp, desc: clima.description, icon: clima.icon }) : undefined;
    await onSave({
      origen: origen.trim(),
      destino: destino.trim(),
      fecha_inicio: fecha,
      vehiculo_id: vehId ?? null,
      km_recorridos: km ? parseFloat(km) : null,
      litros_cargados: litros ? parseFloat(litros) : null,
      precio_litro: precio ? parseFloat(precio) : null,
      costo_total: costoAuto ? parseFloat(costoAuto) : (initial?.costo_total ?? null),
      tiempo_min: tiempoMin > 0 ? tiempoMin : null,
      clima_origen: climaStr ?? initial?.clima_origen ?? null,
      notas: notas.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Desde *</label>
          <input value={origen} onChange={e => setOrigen(e.target.value)} placeholder="ej. Córdoba" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Hasta *</label>
          <input value={destino} onChange={e => setDestino(e.target.value)} placeholder="ej. Bariloche" className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Fecha</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputCls} />
        </div>
        {vehiculos.length > 1 && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Vehículo</label>
            <select value={vehId ?? ''} onChange={e => setVehId(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none appearance-none">
              <option value="">— Sin asignar —</option>
              {vehiculos.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Km recorridos</label>
          <input type="number" value={km} onChange={e => setKm(e.target.value)} min={0} step={1} placeholder="ej. 1600" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Litros cargados</label>
          <input type="number" value={litros} onChange={e => setLitros(e.target.value)} min={0} step={0.1} placeholder="ej. 120" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Precio/litro ($)</label>
          <input type="number" value={precio} onChange={e => setPrecio(e.target.value)} min={0} step={1} placeholder="ej. 2150" className={inputCls} />
        </div>
      </div>
      {costoAuto && (
        <p className="text-xs text-amber-400">💰 Costo estimado: {formatCurrency(parseFloat(costoAuto))}</p>
      )}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Tiempo del viaje</label>
        <div className="flex gap-2">
          <input type="number" value={horas} onChange={e => setHoras(e.target.value)} min={0} max={99} placeholder="Horas" className={inputCls} />
          <input type="number" value={mins} onChange={e => setMins(e.target.value)} min={0} max={59} placeholder="Minutos" className={inputCls} />
        </div>
      </div>
      {clima && (
        <p className="text-xs text-slate-500">🌤️ Clima actual detectado: {clima.temp}°C {clima.description} — se guardará con el viaje</p>
      )}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Notas</label>
        <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} placeholder="Rutas, paradas, observaciones..." className={inputCls + ' resize-none'} />
      </div>
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />{error}
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancelar</button>
        <button type="submit" disabled={!origen.trim() || !destino.trim() || saving}
          className="flex-1 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 hover:border-amber-500/50 transition-colors disabled:opacity-40">
          {saving ? 'Guardando…' : 'Guardar viaje'}
        </button>
      </div>
    </form>
  );
}

// ─── EntryCard ────────────────────────────────────────────────────────────────
function EntryCard({
  entry, vehiculos, onEdit, onDelete,
}: {
  entry: BitacoraEntry;
  vehiculos: { id: number; marca: string; modelo: string }[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const clima = useMemo(() => {
    if (!entry.clima_origen) return null;
    try { return JSON.parse(entry.clima_origen); } catch { return null; }
  }, [entry.clima_origen]);

  const vehiculo = vehiculos.find(v => v.id === entry.vehiculo_id);
  const consumo = entry.litros_cargados && entry.km_recorridos
    ? (entry.litros_cargados / entry.km_recorridos * 100).toFixed(1)
    : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
      {/* Card header — siempre visible */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <button onClick={() => setExpanded(x => !x)} className="flex items-center gap-2 min-w-0 flex-1 text-left">
            <MapPinIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-sm font-semibold text-slate-100 truncate">
              {entry.origen} → {entry.destino}
            </span>
            {expanded
              ? <ChevronUpIcon className="w-3 h-3 text-slate-600 flex-shrink-0" />
              : <ChevronDownIcon className="w-3 h-3 text-slate-600 flex-shrink-0" />}
          </button>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={onEdit}   className="p-1 text-slate-600 hover:text-slate-300 transition-colors rounded"><PencilIcon className="w-3 h-3" /></button>
            <button onClick={onDelete} className="p-1 text-slate-600 hover:text-red-400  transition-colors rounded"><Trash2Icon  className="w-3 h-3" /></button>
          </div>
        </div>

        {/* Siempre visible: fecha + stats clave */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          <CalendarIcon className="w-3 h-3" />
          <span>{formatFecha(entry.fecha_inicio)}</span>
          {clima && <span>· 🌡️ {clima.temp}°C</span>}
          {vehiculo && (
            <span className="ml-1 flex items-center gap-1 text-slate-600">
              <CarIcon className="w-2.5 h-2.5" />{vehiculo.marca} {vehiculo.modelo}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          {entry.km_recorridos != null && (
            <span className="flex items-center gap-1">
              <RouteIcon className="w-3 h-3 text-slate-600" />
              {entry.km_recorridos.toLocaleString('es-AR')} km
            </span>
          )}
          {entry.litros_cargados != null && (
            <span className="flex items-center gap-1">
              <DropletIcon className="w-3 h-3 text-blue-400/70" />
              {entry.litros_cargados} L
            </span>
          )}
          {entry.costo_total != null && (
            <span className="flex items-center gap-1 text-emerald-400">
              <BanknoteIcon className="w-3 h-3" />
              {formatCurrency(entry.costo_total)}
            </span>
          )}
          {entry.tiempo_min != null && (
            <span className="flex items-center gap-1">
              <ClockIcon className="w-3 h-3 text-slate-600" />
              {formatMin(entry.tiempo_min)}
            </span>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-800 px-4 py-3 space-y-2 bg-slate-950/60">
          {consumo && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Consumo promedio</span>
              <span className="text-slate-300 font-medium">{consumo} L/100km</span>
            </div>
          )}
          {entry.precio_litro && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Precio por litro</span>
              <span className="text-slate-300 font-medium">{formatCurrency(entry.precio_litro)}/L</span>
            </div>
          )}
          {entry.km_recorridos && entry.costo_total && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Costo por km</span>
              <span className="text-slate-300 font-medium">{formatCurrency(entry.costo_total / entry.km_recorridos)}/km</span>
            </div>
          )}
          {clima && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Clima en origen</span>
              <span className="text-slate-300">{clima.temp}°C — {clima.desc}</span>
            </div>
          )}
          {entry.notas && (
            <div className="pt-1 border-t border-slate-800/60">
              <p className="text-xs text-slate-500 italic">"{entry.notas}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── StatsBar ─────────────────────────────────────────────────────────────────
function StatsBar({ entries }: { entries: BitacoraEntry[] }) {
  const stats = useMemo(() => ({
    viajes: entries.length,
    km:     entries.reduce((s, e) => s + (e.km_recorridos ?? 0), 0),
    costo:  entries.reduce((s, e) => s + (e.costo_total   ?? 0), 0),
    litros: entries.reduce((s, e) => s + (e.litros_cargados ?? 0), 0),
  }), [entries]);

  if (stats.viajes === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2 mb-3">
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-center">
        <p className="text-lg font-bold text-amber-400">{stats.viajes}</p>
        <p className="text-[10px] text-slate-500">viaje{stats.viajes !== 1 ? 's' : ''}</p>
      </div>
      {stats.km > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-center">
          <p className="text-lg font-bold text-slate-200">{stats.km.toLocaleString('es-AR')}</p>
          <p className="text-[10px] text-slate-500">km recorridos</p>
        </div>
      )}
      {stats.costo > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-center">
          <p className="text-lg font-bold text-emerald-400">{formatCurrency(stats.costo)}</p>
          <p className="text-[10px] text-slate-500">en combustible</p>
        </div>
      )}
      {stats.litros > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-center">
          <p className="text-lg font-bold text-blue-400">{stats.litros.toLocaleString('es-AR', { maximumFractionDigits: 1 })} L</p>
          <p className="text-[10px] text-slate-500">cargados</p>
        </div>
      )}
    </div>
  );
}

// ─── BitacoraTab ──────────────────────────────────────────────────────────────
interface BitacoraTabProps {
  showSuccess: (msg: string) => void;
}

export function BitacoraTab({ showSuccess }: BitacoraTabProps) {
  const { entries, loading, error, loadEntries, addEntry, editEntry, deleteEntry } = useBitacora();
  const garage = useGarage();

  const [mode,       setMode]       = useState<'list' | 'add' | 'edit'>('list');
  const [editEntry_, setEditEntry_] = useState<BitacoraEntry | null>(null);
  const [formError,  setFormError]  = useState<string | null>(null);

  // Filtros
  const [search,     setSearch]     = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterMes,  setFilterMes]  = useState('');
  const [filterVeh,  setFilterVeh]  = useState('');
  const [showStats,  setShowStats]  = useState(true);

  useEffect(() => {
    loadEntries();
    garage.loadVehicles();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Prefill desde RoadTripPage
  useEffect(() => {
    if (mode === 'list') {
      const prefill = sessionStorage.getItem('tankear_prefill_bitacora');
      if (prefill) {
        try {
          const data = JSON.parse(prefill);
          setEditEntry_({ ...data, id: -1, usuario_id: '', created_at: '' });
          setMode('add');
          sessionStorage.removeItem('tankear_prefill_bitacora');
        } catch { /* ignore */ }
      }
    }
  }, [mode]);

  // Años disponibles
  const years = useMemo(() => {
    const set = new Set(entries.map(e => getYearMonth(e.fecha_inicio).year));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [entries]);

  // Meses disponibles según año seleccionado
  const meses = useMemo(() => {
    const base = filterYear ? entries.filter(e => e.fecha_inicio.startsWith(filterYear)) : entries;
    const set = new Set(base.map(e => getYearMonth(e.fecha_inicio).month));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [entries, filterYear]);

  // Entries filtradas — siempre de más nueva a más vieja
  const filtered = useMemo(() => {
    return entries
      .filter(e => {
        if (filterMes  && !e.fecha_inicio.startsWith(filterMes))  return false;
        else if (filterYear && !e.fecha_inicio.startsWith(filterYear)) return false;
        if (filterVeh  && String(e.vehiculo_id) !== filterVeh)    return false;
        if (search) {
          const q = search.toLowerCase();
          if (!e.origen.toLowerCase().includes(q) && !e.destino.toLowerCase().includes(q) && !(e.notas?.toLowerCase().includes(q))) return false;
        }
        return true;
      })
      .sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio));
  }, [entries, filterYear, filterMes, filterVeh, search]);

  const vehiculos = garage.vehicles.map(v => ({ id: v.id, marca: v.marca, modelo: v.modelo }));
  const principalId = garage.principalVehicle?.id;

  async function handleSave(data: BitacoraInput): Promise<boolean> {
    setFormError(null);
    if (editEntry_ && editEntry_.id > 0) {
      const res = await editEntry(editEntry_.id, data);
      if (!res) { setFormError('Error al actualizar'); return false; }
      showSuccess('Viaje actualizado ✓');
    } else {
      const res = await addEntry(data);
      if (!res) { setFormError('Error al guardar'); return false; }
      showSuccess('Viaje guardado en tu bitácora 📋');
    }
    setMode('list');
    setEditEntry_(null);
    return true;
  }

  async function handleDelete(id: number) {
    const ok = await deleteEntry(id);
    if (ok) showSuccess('Viaje eliminado');
  }

  // ── Modo formulario ──────────────────────────────────────────────────────
  if (mode === 'add' || mode === 'edit') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => { setMode('list'); setEditEntry_(null); }}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← Volver</button>
          <span className="text-xs text-slate-700">/</span>
          <h3 className="text-sm font-semibold text-slate-200">
            {mode === 'edit' ? 'Editar viaje' : 'Registrar viaje'}
          </h3>
        </div>
        <EntryForm
          initial={editEntry_ ? {
            origen: editEntry_.origen, destino: editEntry_.destino,
            fecha_inicio: editEntry_.fecha_inicio, vehiculo_id: editEntry_.vehiculo_id ?? undefined,
            km_recorridos: editEntry_.km_recorridos ?? undefined, litros_cargados: editEntry_.litros_cargados ?? undefined,
            precio_litro: editEntry_.precio_litro ?? undefined, costo_total: editEntry_.costo_total ?? undefined,
            tiempo_min: editEntry_.tiempo_min ?? undefined, notas: editEntry_.notas ?? undefined,
            clima_origen: editEntry_.clima_origen ?? undefined,
          } : undefined}
          vehiculoId={principalId}
          vehiculos={vehiculos}
          onSave={handleSave}
          onCancel={() => { setMode('list'); setEditEntry_(null); }}
          saving={loading}
          error={formError}
        />
      </div>
    );
  }

  // ── Modo lista ───────────────────────────────────────────────────────────
  const hasFilters = search || filterYear || filterMes || filterVeh;

  return (
    <div className="space-y-3">

      {/* Stats toggle + botón agregar */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setShowStats(x => !x)}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
            showStats
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          <BarChart2Icon className="w-3 h-3" />
          Estadísticas
        </button>
        <button
          onClick={() => { setEditEntry_(null); setFormError(null); setMode('add'); }}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 transition-colors font-medium"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Registrar viaje
        </button>
      </div>

      {/* Estadísticas del período filtrado */}
      {showStats && <StatsBar entries={filtered} />}

      {/* Buscador */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por ciudad o notas..."
          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
        />
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <div className="flex-1">
          <select
            value={filterYear}
            onChange={e => { setFilterYear(e.target.value); setFilterMes(''); }}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-400 focus:outline-none appearance-none"
          >
            <option value="">Todos los años</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {filterYear && meses.length > 1 && (
          <div className="flex-1">
            <select
              value={filterMes}
              onChange={e => setFilterMes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-400 focus:outline-none appearance-none capitalize"
            >
              <option value="">Todos los meses</option>
              {meses.map(m => (
                <option key={m} value={m}>
                  {new Date(m + '-01').toLocaleDateString('es-AR', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        )}
        {vehiculos.length > 1 && (
          <div className="flex-1">
            <select
              value={filterVeh}
              onChange={e => setFilterVeh(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-400 focus:outline-none appearance-none"
            >
              <option value="">Todos los autos</option>
              {vehiculos.map(v => <option key={v.id} value={String(v.id)}>{v.marca} {v.modelo}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Indicador de filtros activos */}
      {hasFilters && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-600">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
          <button onClick={() => { setSearch(''); setFilterYear(''); setFilterMes(''); setFilterVeh(''); }}
            className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors">
            Limpiar filtros ×
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircleIcon className="w-3.5 h-3.5" />{error}
        </div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && (
        <div className="text-center py-10">
          <MapPinIcon className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-medium">Sin viajes registrados</p>
          <p className="text-xs text-slate-600 mt-1">Registrá tus viajes para llevar un historial de km, gastos y consumo</p>
        </div>
      )}

      {!loading && entries.length > 0 && filtered.length === 0 && (
        <div className="text-center py-6">
          <FilterIcon className="w-8 h-8 text-slate-700 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Sin viajes con ese filtro</p>
        </div>
      )}

      {/* Lista agrupada por mes */}
      {filtered.length > 0 && (() => {
        // Agrupar por mes
        const grupos: { mes: string; items: BitacoraEntry[] }[] = [];
        filtered.forEach(e => {
          const mes = getYearMonth(e.fecha_inicio).month;
          const g = grupos.find(g => g.mes === mes);
          if (g) g.items.push(e);
          else grupos.push({ mes, items: [e] });
        });

        return grupos.map(({ mes, items }) => {
          const label = formatFechaMes(mes + '-01');
          const mesKm = items.reduce((s, e) => s + (e.km_recorridos ?? 0), 0);
          const mesCosto = items.reduce((s, e) => s + (e.costo_total ?? 0), 0);
          return (
            <div key={mes}>
              {/* Separador de mes */}
              {grupos.length > 1 && (
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="w-3 h-3 text-slate-600" />
                  <span className="text-xs font-medium text-slate-500 capitalize">{label}</span>
                  <div className="flex-1 border-t border-slate-800" />
                  <span className="text-[10px] text-slate-700">
                    {items.length} viaje{items.length !== 1 ? 's' : ''}
                    {mesKm > 0 && ` · ${mesKm.toLocaleString('es-AR')} km`}
                    {mesCosto > 0 && ` · ${formatCurrency(mesCosto)}`}
                  </span>
                </div>
              )}
              <div className="space-y-2 mb-3">
                {items.map(e => (
                  <EntryCard
                    key={e.id}
                    entry={e}
                    vehiculos={vehiculos}
                    onEdit={() => { setEditEntry_(e); setFormError(null); setMode('edit'); }}
                    onDelete={() => handleDelete(e.id)}
                  />
                ))}
              </div>
            </div>
          );
        });
      })()}
    </div>
  );
}
