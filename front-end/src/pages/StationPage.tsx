import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FuelIcon, MapPinIcon, NavigationIcon, CalendarIcon,
  ChevronLeftIcon, ExternalLinkIcon, BellIcon,
} from 'lucide-react';
import { formatCurrency } from '../utils/api';
import { staleDaysAgo } from '../utils/stale';
import { MiniLeadForm, isAlreadySubscribed } from '../components/MiniLeadForm';

const API_BASE = import.meta.env.VITE_API_BASE || '';

interface StationDetail {
  empresa: string;
  bandera?: string;
  direccion: string;
  localidad: string;
  provincia: string;
  latitud?: number;
  longitud?: number;
  productos: { producto: string; precio: number; fecha_vigencia: string }[];
}

function MetaUpdater({ station }: { station: StationDetail }) {
  useEffect(() => {
    const nombre   = station.bandera || station.empresa;
    const dir      = station.direccion;
    const loc      = station.localidad;
    const precios  = station.productos.map(p => `${p.producto}: ${formatCurrency(p.precio)}`).join(' | ');
    const title    = `${nombre} ${dir}, ${loc} — Precios de combustible | Tankear`;
    const desc     = `Precios actuales en ${nombre} (${dir}, ${loc}): ${precios}. Comparé y ahorrá en Tankear.`;

    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
    // OG
    setMeta('og:title',       title);
    setMeta('og:description', desc);
    setMeta('og:url',         window.location.href);
    setMeta('og:type',        'website');
    // Twitter
    setMeta('twitter:card',        'summary');
    setMeta('twitter:title',       title);
    setMeta('twitter:description', desc);
    return () => {
      document.title = 'Tankear — Precios de combustible en Argentina';
    };
  }, [station]);
  return null;
}

function setMeta(property: string, content: string) {
  const attr = property.startsWith('og:') ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function StationPage() {
  const { slug } = useParams<{ slug: string }>();
  const [station, setStation] = useState<StationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [showLead, setShowLead] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${API_BASE}/estacion/${encodeURIComponent(slug)}`)
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then(setStation)
      .catch(() => setError('No encontramos esa estación.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-slate-700 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  if (error || !station) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-center px-4">
      <FuelIcon className="w-12 h-12 text-slate-700" />
      <p className="text-slate-400">{error || 'Estación no encontrada'}</p>
      <Link to="/" className="text-amber-500 hover:text-amber-400 text-sm flex items-center gap-1">
        <ChevronLeftIcon className="w-4 h-4" /> Volver al inicio
      </Link>
    </div>
  );

  const nombre = station.bandera || station.empresa;
  const mapsUrl = station.latitud && station.longitud
    ? `https://www.google.com/maps/dir/?api=1&destination=${station.latitud},${station.longitud}`
    : `https://www.google.com/maps/search/${encodeURIComponent(`${station.direccion}, ${station.localidad}, ${station.provincia}, Argentina`)}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <MetaUpdater station={station} />

      {/* Header */}
      <header className="w-full bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
        <div className="h-1 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="text-slate-500 hover:text-slate-300 transition-colors">
            <ChevronLeftIcon className="w-5 h-5" />
          </Link>
          <FuelIcon className="w-5 h-5 text-amber-500" />
          <span className="font-bold text-slate-100">Tankear</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Station header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-100 mb-1">{nombre}</h1>
              <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                <MapPinIcon className="w-4 h-4 text-slate-600 flex-shrink-0" />
                <span>{station.direccion}</span>
              </div>
              <p className="text-slate-500 text-sm ml-5.5 mt-0.5">
                {station.localidad}, {station.provincia}
              </p>
            </div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition-colors"
            >
              <NavigationIcon className="w-4 h-4 text-emerald-400" />
              Cómo llegar
            </a>
          </div>

          {/* Precios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {station.productos.map(p => {
              const dias   = staleDaysAgo(p.fecha_vigencia);
              const stale  = dias > 30;
              return (
                <div
                  key={p.producto}
                  className={`rounded-xl p-4 border ${stale ? 'border-slate-700/50 bg-slate-800/30' : 'border-slate-700 bg-slate-800/60'}`}
                >
                  <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wide truncate">
                    {p.producto}
                  </p>
                  <p className={`text-3xl font-bold ${stale ? 'text-slate-500 line-through' : 'text-emerald-400'}`}>
                    {formatCurrency(p.precio)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <CalendarIcon className="w-3 h-3 text-slate-600" />
                    <span className="text-xs text-slate-500">
                      {new Date(p.fecha_vigencia).toLocaleDateString('es-AR', { day:'numeric', month:'short', year:'numeric' })}
                    </span>
                    {stale && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 border border-slate-600 ml-1">
                        Sin confirmar
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead capture */}
        <div className="bg-slate-900 border border-amber-500/15 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <BellIcon className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-slate-200 text-sm">Alertas de precio</h2>
          </div>
          <p className="text-slate-500 text-xs mb-4">
            Te avisamos cuando cambie el precio en esta estación o en {station.localidad}.
          </p>
          {isAlreadySubscribed() ? (
            <p className="text-emerald-400 text-sm">✓ Ya estás suscripto a las alertas.</p>
          ) : (
            <MiniLeadForm
              zona={`${station.localidad}, ${station.provincia}`}
              placeholder="Email o WhatsApp"
              pagina_origen="estacion_page"
            />
          )}
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-slate-500 hover:text-amber-400 text-sm transition-colors flex items-center justify-center gap-1"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Ver todos los precios cerca tuyo
          </Link>
        </div>
      </main>
    </div>
  );
}
