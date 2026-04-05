import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FuelIcon } from 'lucide-react';
import { useDolar, getSuperUSD } from '../hooks/useDolar';
import { useClima } from '../hooks/useClima';
import { MiniLeadForm, isAlreadySubscribed } from './MiniLeadForm';
import { PublicitarModal } from './PublicitarModal';

function Skeleton() {
  return <div className="h-4 w-20 bg-slate-800 rounded animate-pulse inline-block" />;
}

function DolarWidget() {
  const { blue, oficial, loading } = useDolar();
  if (loading) return (
    <div className="flex flex-col gap-1.5">
      <Skeleton />
      <Skeleton />
    </div>
  );
  if (!blue) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Dólar hoy</p>
      <p className="text-slate-200 text-sm font-semibold">
        💵 Blue ${blue.toLocaleString('es-AR')}
        {oficial && <span className="text-slate-500 font-normal ml-2 text-xs">Oficial ${oficial.toLocaleString('es-AR')}</span>}
      </p>
      <p className="text-amber-400 text-xs">
        Súper ≈ USD {getSuperUSD(blue)}/L
      </p>
    </div>
  );
}

function ClimaWidget() {
  const { temp, descripcion, ciudad, loading } = useClima();
  if (loading) return <Skeleton />;
  if (temp === null) return null;
  const emoji =
    descripcion?.toLowerCase().includes('lluvi') ? '🌧️' :
    descripcion?.toLowerCase().includes('nub')   ? '☁️'  :
    descripcion?.toLowerCase().includes('tormen') ? '⛈️' :
    '🌤️';
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Clima</p>
      <p className="text-slate-200 text-sm font-semibold">
        {emoji} {temp}°C
        {ciudad && <span className="text-slate-500 font-normal ml-1 text-xs">en {ciudad}</span>}
      </p>
      {descripcion && <p className="text-slate-500 text-xs capitalize">{descripcion}</p>}
    </div>
  );
}

const NAV_LINKS = [
  { label: 'Inicio',      href: '/' },
  { label: 'Comparativa', href: '/comparativa' },
  { label: 'Noticias',    href: '/noticias' },
  { label: 'Cotizador',   href: '/cotizador' },
];

const TOOL_LINKS = [
  { label: 'Calculadora de viaje', href: '/cotizador' },
  { label: 'Cotizador de seguros', href: '/cotizador' },
  { label: 'Alertas de precio',    href: '/' },
];

export function Footer() {
  const [publicitarOpen, setPublicitarOpen] = useState(false);
  return (
    <>
    <PublicitarModal open={publicitarOpen} onClose={() => setPublicitarOpen(false)} />
    <footer className="mt-16 border-t border-slate-800">

      {/* ── Franja superior: logo + widgets ── */}
      <div className="bg-slate-900 py-8 px-4">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-start md:justify-between gap-8">

          {/* Logo + tagline */}
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-amber-500/10 rounded-lg">
                <FuelIcon className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-lg font-bold text-slate-100">Tankear</span>
            </div>
            <p className="text-slate-500 text-sm max-w-[220px] leading-relaxed">
              El combustible más barato cerca tuyo, en tiempo real.
            </p>
          </div>

          {/* Widgets */}
          <div className="flex flex-wrap gap-8">
            <DolarWidget />
            <ClimaWidget />
          </div>

        </div>
      </div>

      {/* ── Franja media: links ── */}
      <div className="bg-slate-900 border-t border-slate-800/60 py-8 px-4">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-3 gap-8">

          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Explorar</p>
            <ul className="space-y-2">
              {NAV_LINKS.map(l => (
                <li key={l.href}>
                  <Link to={l.href} className="text-slate-500 hover:text-amber-400 text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Herramientas</p>
            <ul className="space-y-2">
              {TOOL_LINKS.map(l => (
                <li key={l.label}>
                  <Link to={l.href} className="text-slate-500 hover:text-amber-400 text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Info</p>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.enargas.gob.ar"
                  target="_blank" rel="noopener noreferrer"
                  className="text-slate-500 hover:text-amber-400 text-sm transition-colors"
                >
                  Datos abiertos ENARGAS
                </a>
              </li>
              <li>
                <button
                  onClick={() => setPublicitarOpen(true)}
                  className="text-slate-500 hover:text-amber-400 text-sm transition-colors text-left"
                >
                  Publicitar acá
                </button>
              </li>
              <li>
                <button
                  onClick={() => setPublicitarOpen(true)}
                  className="text-slate-500 hover:text-amber-400 text-sm transition-colors text-left"
                >
                  Contacto
                </button>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* ── Franja inferior: newsletter + atribución ── */}
      <div className="bg-slate-950 border-t border-slate-800/60 py-6 px-4">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">

          {/* Newsletter */}
          {!isAlreadySubscribed() && (
            <div className="max-w-sm">
              <p className="text-slate-400 text-xs mb-2 font-medium">Recibí alertas de precio por WhatsApp o email</p>
              <MiniLeadForm compact placeholder="Email o WhatsApp" pagina_origen="footer" />
            </div>
          )}

          {/* Attribution */}
          <div className="text-right">
            <p className="text-slate-600 text-xs leading-relaxed">
              Datos: ENARGAS · Secretaría de Energía · Ministerio de Economía
            </p>
            <p className="text-slate-700 text-xs mt-1">
              © {new Date().getFullYear()} Tankear · Hecho con ♥ en Argentina
            </p>
          </div>

        </div>
      </div>

    </footer>
    </>
  );
}
