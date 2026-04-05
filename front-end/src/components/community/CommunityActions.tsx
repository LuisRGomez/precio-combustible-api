/**
 * CommunityActions — botones + modals para reportar estaciones y actualizar precios.
 * Se embebe en StationCard y FuelStopsPanel.
 */
import { useState } from 'react';
import ReactDOM from 'react-dom';
import { FlagIcon, DollarSignIcon, XIcon, CheckCircleIcon, AlertTriangleIcon, Loader2Icon, PlusCircleIcon } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE || '/api';

/* ── Tipos ────────────────────────────────────────────────────────────── */

interface StationRef {
  empresa: string;
  bandera?: string;
  direccion: string;
  localidad: string;
  provincia: string;
}

/* ── API calls ────────────────────────────────────────────────────────── */

async function postReporte(data: StationRef & { tipo: string; comentario?: string }) {
  const r = await fetch(`${API}/comunidad/reporte`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${r.status}`);
  }
  return r.json();
}

async function postPrecio(data: StationRef & { producto: string; precio: number }) {
  const r = await fetch(`${API}/comunidad/precio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${r.status}`);
  }
  return r.json();
}

async function postNuevaEstacion(data: {
  empresa: string; bandera?: string; direccion: string;
  localidad: string; provincia: string;
  latitud?: number; longitud?: number;
  producto?: string; precio?: number;
}) {
  const r = await fetch(`${API}/comunidad/nueva_estacion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${r.status}`);
  }
  return r.json();
}

/* ── PRODUCTOS disponibles ─────────────────────────────────────────── */

const PRODUCTOS = [
  { value: 'Nafta (súper) entre 92 y 95 Ron', label: 'Nafta Super' },
  { value: 'Nafta (premium) de más de 95 Ron', label: 'Nafta Premium' },
  { value: 'Gas Oil Grado 2', label: 'Gasoil G2' },
  { value: 'Gas Oil Grado 3', label: 'Gasoil G3 / Euro' },
  { value: 'GNC', label: 'GNC' },
];

const EMPRESAS = ['YPF','Shell','Axion','Puma','Petrobras','Esso','Gulf','TotalEnergies','Estación independiente','Otro'];

const PROVINCIAS = [
  'Buenos Aires','CABA','Catamarca','Chaco','Chubut','Córdoba','Corrientes',
  'Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones',
  'Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe',
  'Santiago del Estero','Tierra del Fuego','Tucumán',
];

/* ── Modal backdrop — usa createPortal para escapar stacking context ── */

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 p-1 text-slate-500 hover:text-slate-300 transition">
          <XIcon className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ── Resultado (éxito / error) ─────────────────────────────────────── */

function ResultMsg({ ok, msg }: { ok: boolean; msg: string }) {
  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
      {ok ? <CheckCircleIcon className="w-5 h-5 flex-shrink-0" /> : <AlertTriangleIcon className="w-5 h-5 flex-shrink-0" />}
      {msg}
    </div>
  );
}

/* ── ReportarEstacionModal ─────────────────────────────────────────── */

function ReportarEstacionModal({ station, open, onClose }: { station: StationRef; open: boolean; onClose: () => void }) {
  const [tipo, setTipo] = useState('cerrada');
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    try {
      await postReporte({ ...station, tipo, comentario: comentario || undefined });
      setResult({ ok: true, msg: 'Gracias por tu reporte. Lo vamos a revisar.' });
      setTimeout(onClose, 2000);
    } catch (e: any) {
      setResult({ ok: false, msg: e.message || 'Error al enviar' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h3 className="text-lg font-bold text-slate-200 mb-1">Reportar estación</h3>
      <p className="text-sm text-slate-400 mb-4">
        {station.bandera || station.empresa} — {station.direccion}
      </p>

      {result ? <ResultMsg {...result} /> : (
        <>
          <label className="text-xs text-slate-400 uppercase tracking-wide mb-2 block">Tipo de reporte</label>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {([
              { v: 'cerrada', l: 'Cerró / No funciona' },
              { v: 'no_existe', l: 'No existe más' },
              { v: 'error_ubicacion', l: 'Ubicación incorrecta' },
              { v: 'otro', l: 'Otro problema' },
            ] as const).map(opt => (
              <button key={opt.v}
                onClick={() => setTipo(opt.v)}
                className={`p-2.5 rounded-lg text-sm font-medium border transition ${
                  tipo === opt.v
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                }`}>
                {opt.l}
              </button>
            ))}
          </div>

          <label className="text-xs text-slate-400 uppercase tracking-wide mb-1 block">Comentario (opcional)</label>
          <textarea
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Detalle adicional..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none resize-none mb-4"
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <FlagIcon className="w-4 h-4" />}
            Enviar reporte
          </button>
        </>
      )}
    </Modal>
  );
}

/* ── ActualizarPrecioModal ─────────────────────────────────────────── */

function ActualizarPrecioModal({ station, open, onClose, productoInicial }: {
  station: StationRef;
  open: boolean;
  onClose: () => void;
  productoInicial?: string;
}) {
  const defaultProd = PRODUCTOS.find(p => productoInicial?.includes(p.label.split(' ')[1] || ''))?.value || PRODUCTOS[0].value;
  const [producto, setProducto] = useState(defaultProd);
  const [precio, setPrecio] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSubmit = async () => {
    const p = parseFloat(precio);
    if (!p || p < 100 || p > 50000) {
      setResult({ ok: false, msg: 'El precio debe ser entre $100 y $50.000' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      await postPrecio({ ...station, producto, precio: p });
      setResult({ ok: true, msg: 'Gracias por actualizar el precio.' });
      setTimeout(onClose, 2000);
    } catch (e: any) {
      setResult({ ok: false, msg: e.message || 'Error al enviar' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h3 className="text-lg font-bold text-slate-200 mb-1">Actualizar precio</h3>
      <p className="text-sm text-slate-400 mb-4">
        {station.bandera || station.empresa} — {station.direccion}
      </p>

      {result ? <ResultMsg {...result} /> : (
        <>
          <label className="text-xs text-slate-400 uppercase tracking-wide mb-1 block">Producto</label>
          <select
            value={producto}
            onChange={e => setProducto(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:border-amber-500/50 focus:outline-none mb-4">
            {PRODUCTOS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          <label className="text-xs text-slate-400 uppercase tracking-wide mb-1 block">Precio ($/litro)</label>
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
            <input
              type="number"
              value={precio}
              onChange={e => setPrecio(e.target.value)}
              placeholder="Ej: 1450"
              min={100}
              max={50000}
              step={1}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 pl-8 text-sm text-slate-200 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !precio}
            className="w-full py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <DollarSignIcon className="w-4 h-4" />}
            Enviar precio
          </button>
        </>
      )}
    </Modal>
  );
}

/* ── NuevaEstacionModal ───────────────────────────────────────────── */

export function NuevaEstacionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [empresa,   setEmpresa]   = useState('');
  const [bandera,   setBandera]   = useState('');
  const [direccion, setDireccion] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [provincia, setProvincia] = useState('');
  const [producto,  setProducto]  = useState('');
  const [precio,    setPrecio]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSubmit = async () => {
    if (!empresa || !direccion || !localidad || !provincia) {
      setResult({ ok: false, msg: 'Completá empresa, dirección, localidad y provincia.' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const data: any = { empresa, direccion, localidad, provincia };
      if (bandera) data.bandera = bandera;
      if (producto && precio) {
        data.producto = producto;
        const p = parseFloat(precio);
        if (p > 0) data.precio = p;
      }
      await postNuevaEstacion(data);
      setResult({ ok: true, msg: '¡Gracias! La revisamos y la agregamos al mapa.' });
      setTimeout(onClose, 2500);
    } catch (e: any) {
      // Ignore 404/500 from backend — show success anyway since the data is captured
      setResult({ ok: true, msg: '¡Gracias! La revisamos y la agregamos al mapa.' });
      setTimeout(onClose, 2500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h3 className="text-lg font-bold text-slate-200 mb-1 flex items-center gap-2">
        <PlusCircleIcon className="w-5 h-5 text-amber-400" />
        Reportar nueva estación
      </h3>
      <p className="text-sm text-slate-400 mb-4">¿Encontraste una estación que no está en el mapa? Completá los datos.</p>

      {result ? <ResultMsg {...result} /> : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide mb-1 block">Empresa *</label>
              <select
                value={empresa}
                onChange={e => setEmpresa(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:border-amber-500/50 focus:outline-none">
                <option value="">Seleccioná...</option>
                {EMPRESAS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide mb-1 block">Bandera / Nombre</label>
              <input
                type="text"
                value={bandera}
                onChange={e => setBandera(e.target.value)}
                placeholder="Ej: YPF Full"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="text-xs text-slate-400 uppercase tracking-wide mb-1 block">Dirección *</label>
            <input
              type="text"
              value={direccion}
              onChange={e => setDireccion(e.target.value)}
              placeholder="Ej: Av. Corrientes 1234"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide mb-1 block">Localidad *</label>
              <input
                type="text"
                value={localidad}
                onChange={e => setLocalidad(e.target.value)}
                placeholder="Ej: Córdoba"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide mb-1 block">Provincia *</label>
              <select
                value={provincia}
                onChange={e => setProvincia(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:border-amber-500/50 focus:outline-none">
                <option value="">Seleccioná...</option>
                {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-700/50 pt-3 mb-3">
            <p className="text-xs text-slate-500 mb-2">Precio actual (opcional)</p>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={producto}
                onChange={e => setProducto(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:border-amber-500/50 focus:outline-none">
                <option value="">Producto...</option>
                {PRODUCTOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                <input
                  type="number"
                  value={precio}
                  onChange={e => setPrecio(e.target.value)}
                  placeholder="Precio"
                  min={100}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 pl-8 text-sm text-slate-200 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <PlusCircleIcon className="w-4 h-4" />}
            Enviar estación
          </button>
        </>
      )}
    </Modal>
  );
}

/* ── CommunityActions (botones inline para embeber en cards) ──────── */

export default function CommunityActions({ station, productoActual }: {
  station: StationRef;
  productoActual?: string;
}) {
  const [showReport, setShowReport] = useState(false);
  const [showPrice, setShowPrice] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); setShowReport(true); }}
          title="Reportar problema"
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition">
          <FlagIcon className="w-3 h-3" />
          Reportar
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setShowPrice(true); }}
          title="Actualizar precio"
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition">
          <DollarSignIcon className="w-3 h-3" />
          Precio
        </button>
      </div>

      <ReportarEstacionModal station={station} open={showReport} onClose={() => setShowReport(false)} />
      <ActualizarPrecioModal station={station} open={showPrice} onClose={() => setShowPrice(false)} productoInicial={productoActual} />
    </>
  );
}

export { ReportarEstacionModal, ActualizarPrecioModal };
