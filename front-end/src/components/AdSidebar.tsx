import React from 'react';
import { Link } from 'react-router-dom';
import { NewsWidget } from './NewsWidget';
import { CarIcon, ChevronRightIcon, MailIcon, NewspaperIcon } from 'lucide-react';
import { useDolar, getSuperUSD } from '../hooks/useDolar';
import { useClima } from '../hooks/useClima';

// ─── Mock ad: publicidad con efecto visual sutil ─────────────────────────────
function MockAd() {
  return (
    <>
      <style>{`
        @keyframes tk-breathe {
          0%, 100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(245,158,11,0); }
          50%       { transform: scale(1.06); box-shadow: 0 0 18px 4px rgba(245,158,11,0.18); }
        }
        @keyframes tk-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes tk-card-glow {
          0%, 100% { box-shadow: 0 0 22px rgba(245,158,11,0.04); }
          50%       { box-shadow: 0 0 44px rgba(245,158,11,0.10); }
        }
        .tk-icon-breathe {
          animation: tk-breathe 4s ease-in-out infinite;
        }
        .tk-btn-shimmer {
          background: linear-gradient(90deg,
            #f59e0b 0%, #fbbf24 35%, #fffbeb 50%, #fbbf24 65%, #f59e0b 100%
          );
          background-size: 250% auto;
          animation: tk-shimmer 3.5s linear infinite;
          color: #0f172a;
        }
        .tk-card-glow {
          animation: tk-card-glow 5s ease-in-out infinite;
        }
      `}</style>

      <div
        className="tk-card-glow rounded-xl overflow-hidden border border-amber-500/20 relative"
        style={{ background: 'linear-gradient(160deg, #0f172a 0%, #111827 60%, #0f172a 100%)' }}
      >
        {/* Radial warm glow de fondo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245,158,11,0.06) 0%, transparent 70%)',
          }}
        />

        {/* Label casi invisible */}
        <div className="relative flex justify-end px-3 pt-2">
          <span className="text-[8px] text-slate-700 uppercase tracking-widest">patrocinado</span>
        </div>

        {/* Contenido */}
        <div className="relative px-4 pb-5 pt-1 text-center">

          {/* Ícono que respira */}
          <div
            className="tk-icon-breathe w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.06) 100%)',
              border: '1px solid rgba(245,158,11,0.25)',
            }}
          >
            <CarIcon className="w-6 h-6 text-amber-400" />
          </div>

          <p className="text-[10px] font-semibold text-amber-500/80 uppercase tracking-wider mb-1.5">
            ¿Tenés auto?
          </p>
          <h4 className="text-sm font-bold text-slate-100 leading-snug mb-1.5">
            Cotizá tu seguro<br />al mejor precio
          </h4>
          <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
            Comparamos más de 20 aseguradoras en segundos.
          </p>

          {/* Logos */}
          <div className="flex items-center justify-center gap-1.5 mb-4 flex-wrap">
            {['Zurich', 'Allianz', 'La Caja', 'Mapfre'].map(name => (
              <span
                key={name}
                className="px-2 py-0.5 text-[9px] font-semibold rounded-md text-slate-500"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {name}
              </span>
            ))}
          </div>

          {/* Botón con shimmer */}
          <button className="tk-btn-shimmer w-full font-bold text-xs py-2.5 rounded-lg">
            Cotizar ahora →
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Publicita CTA ───────────────────────────────────────────────────────────
function PublicitaCTA() {
  return (
    <div className="rounded-xl border border-dashed border-slate-700/60 px-4 py-4 text-center
                    bg-slate-900/30 hover:bg-slate-900/60 transition-colors">
      <p className="text-xs font-semibold text-slate-400 mb-0.5">¿Querés publicitar acá?</p>
      <p className="text-[10px] text-slate-600 mb-3 leading-relaxed">
        Llegá a miles de conductores por día.
      </p>
      <a
        href="mailto:hola@tankear.com.ar"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-500
                   hover:text-amber-400 transition-colors"
      >
        <MailIcon className="w-3 h-3" />
        Contactanos
        <ChevronRightIcon className="w-3 h-3" />
      </a>
    </div>
  );
}

// ─── Widget dólar + clima ────────────────────────────────────────────────────
function DolarClimaWidget() {
  const { blue, oficial, loading: loadingD } = useDolar();
  const { temp, ciudad, loading: loadingC }  = useClima();

  const isLoading = loadingD && loadingC;

  if (isLoading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-2">
        <div className="h-3 w-24 bg-slate-800 rounded animate-pulse" />
        <div className="h-3 w-32 bg-slate-800 rounded animate-pulse" />
      </div>
    );
  }

  if (!blue && temp === null) return null;

  const climaEmoji =
    temp !== null ? '🌤️' : '';

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
      {blue && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-400">
            💵 Blue <span className="text-slate-200 font-semibold">${blue.toLocaleString('es-AR')}</span>
            {oficial && <span className="text-slate-600 ml-1">· Of. ${oficial.toLocaleString('es-AR')}</span>}
          </span>
        </div>
      )}
      {blue && (
        <p className="text-amber-400 font-medium">Súper ≈ USD {getSuperUSD(blue)}/L</p>
      )}
      {temp !== null && (
        <p className="text-slate-400">
          {climaEmoji} <span className="text-slate-200 font-semibold">{temp}°C</span>
          {ciudad && <span className="text-slate-500 ml-1">en {ciudad}</span>}
        </p>
      )}
    </div>
  );
}

// ─── Sidebar completo ────────────────────────────────────────────────────────
export function AdSidebar() {
  return (
    <aside className="flex flex-col gap-5">

      {/* Mock ad */}
      <MockAd />

      {/* Noticias AR */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <NewspaperIcon className="w-3.5 h-3.5 text-amber-500" />
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Últimas noticias
            </h3>
          </div>
          <Link to="/noticias" className="text-[10px] text-amber-500/70 hover:text-amber-400 transition-colors">
            Ver todas →
          </Link>
        </div>
        <NewsWidget pais="ar" limit={5} />
      </div>

      {/* Publicita CTA */}
      <PublicitaCTA />

    </aside>
  );
}
