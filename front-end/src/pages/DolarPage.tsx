import React, { useState } from 'react';
import { useSEO } from '../hooks/useSEO';
import { Header } from '../components/Header';
import { QuickNav } from '../components/QuickNav';
import { AdSidebar } from '../components/AdSidebar';
import { Footer } from '../components/Footer';
import { OnboardingModal } from '../components/OnboardingModal';
import { LoginModal } from '../components/LoginModal';
import { useUser } from '../hooks/useUser';
import { useDolar, getSuperUSD } from '../hooks/useDolar';
import { useOil } from '../hooks/useOil';
import { Link } from 'react-router-dom';
import { DollarSignIcon, TrendingUpIcon, TrendingDownIcon, BarChart2Icon, ZapIcon, InfoIcon, ShieldIcon, ArrowRightIcon } from 'lucide-react';

function Skeleton({ w = 'w-20' }: { w?: string }) {
  return <div className={`${w} h-4 bg-slate-800 rounded animate-pulse inline-block`} />;
}

function StatCard({
  label,
  compra,
  venta,
  color = 'slate',
  badge,
}: {
  label: string;
  compra: number | null;
  venta: number | null;
  color?: 'amber' | 'emerald' | 'blue' | 'slate';
  badge?: string;
}) {
  const colors = {
    amber:   { border: 'border-amber-500/30', bg: 'bg-amber-500/5',  text: 'text-amber-400',  label: 'text-amber-500/70'  },
    emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', text: 'text-emerald-400', label: 'text-emerald-500/70' },
    blue:    { border: 'border-blue-500/30',   bg: 'bg-blue-500/5',   text: 'text-blue-400',   label: 'text-blue-500/70'   },
    slate:   { border: 'border-slate-700/60',  bg: 'bg-slate-900/60', text: 'text-slate-200',  label: 'text-slate-500'     },
  };
  const c = colors[color];
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-4 flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <p className={`text-xs font-semibold uppercase tracking-wider ${c.label}`}>{label}</p>
        {badge && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">{badge}</span>}
      </div>
      <div className="flex items-end gap-4">
        <div>
          <p className="text-[10px] text-slate-600 mb-0.5">Compra</p>
          <p className={`text-xl font-bold ${c.text}`}>
            {compra !== null ? `$${compra.toLocaleString('es-AR')}` : <Skeleton w="w-16" />}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-600 mb-0.5">Venta</p>
          <p className={`text-xl font-bold ${c.text}`}>
            {venta !== null ? `$${venta.toLocaleString('es-AR')}` : <Skeleton w="w-16" />}
          </p>
        </div>
      </div>
    </div>
  );
}

function BrechaCard({ blue, oficial }: { blue: number | null; oficial: number | null }) {
  if (!blue || !oficial) return (
    <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Brecha cambiaria</p>
      <Skeleton w="w-24" />
    </div>
  );
  const brecha = ((blue - oficial) / oficial * 100);
  const isHigh = brecha > 100;
  return (
    <div className={`rounded-xl p-4 border ${isHigh ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-900/60 border-slate-700/60'}`}>
      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Brecha cambiaria</p>
      <div className="flex items-end gap-2">
        <p className={`text-3xl font-bold ${isHigh ? 'text-red-400' : 'text-amber-400'}`}>
          {brecha.toFixed(1)}%
        </p>
        {isHigh ? <TrendingUpIcon className="w-5 h-5 text-red-400 mb-1" /> : <TrendingDownIcon className="w-5 h-5 text-emerald-400 mb-1" />}
      </div>
      <p className="text-xs text-slate-500 mt-1">
        El blue vale {brecha.toFixed(0)}% más que el oficial
      </p>
    </div>
  );
}

function OilCard({ wti, brent, loading }: { wti: number | null; brent: number | null; loading: boolean }) {
  return (
    <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <ZapIcon className="w-4 h-4 text-amber-500" />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Petróleo</p>
      </div>
      <div className="flex gap-6">
        <div>
          <p className="text-[10px] text-slate-600 mb-0.5">WTI (barril)</p>
          <p className="text-xl font-bold text-slate-200">
            {loading ? <Skeleton /> : wti ? `USD ${wti.toFixed(1)}` : '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-600 mb-0.5">Brent (barril)</p>
          <p className="text-xl font-bold text-slate-200">
            {loading ? <Skeleton /> : brent ? `USD ${brent.toFixed(1)}` : '—'}
          </p>
        </div>
      </div>
      {wti && (
        <p className="text-xs text-slate-500 mt-2">
          ≈ USD {(wti / 159).toFixed(2)} por litro crudo · {/* 1 barril = 159 L */}
          <span className="text-slate-600">referencia internacional</span>
        </p>
      )}
    </div>
  );
}

function MockAdBlock({ label = 'Publicidad' }: { label?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700/50 bg-slate-900/30 flex flex-col items-center justify-center gap-2 py-10 text-center">
      <span className="text-[9px] font-semibold text-slate-600 uppercase tracking-widest">{label}</span>
      <p className="text-slate-700 text-xs">Espacio publicitario disponible</p>
      <a href="mailto:hola@tankear.com.ar" className="text-amber-500/60 hover:text-amber-400 text-xs transition-colors">
        hola@tankear.com.ar
      </a>
    </div>
  );
}

export function DolarPage() {
  useSEO({
    title:       'Dólar nafta — precio en Argentina hoy',
    description: 'Precio del dólar blue y oficial en Argentina y su impacto en el precio de la nafta. Cotización actualizada al minuto en Tankear.',
    canonical:   'https://tankear.com.ar/dolar',
  });
  const { user, logout } = useUser();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [loginOpen,      setLoginOpen]      = useState(false);

  const { blue: blueVenta, oficial: oficialVenta, loading: loadingD } = useDolar();
  const { wti, brent, loading: loadingO }                             = useOil();

  // Bluelytics gives sell price only in the simple hook; buy ≈ sell - 3%
  const blueBuy    = blueVenta    ? Math.round(blueVenta    * 0.97) : null;
  const oficialBuy = oficialVenta ? Math.round(oficialVenta * 0.97) : null;

  const superUSD = blueVenta ? getSuperUSD(blueVenta) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30">
      <Header
        user={user}
        onCreateAccount={() => setOnboardingOpen(true)}
        onLogin={() => setLoginOpen(true)}
        onLogout={logout}
      />
      <OnboardingModal open={onboardingOpen} onClose={() => setOnboardingOpen(false)} />
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onCreateAccount={() => { setLoginOpen(false); setOnboardingOpen(true); }}
      />
      <QuickNav />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">

          {/* ── Contenido principal ── */}
          <div className="flex-1 min-w-0 space-y-8">

            {/* Heading */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <DollarSignIcon className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100">Dólar & Energía</h1>
                <p className="text-xs text-slate-500 mt-0.5">Cotizaciones en tiempo real · Actualizado cada 15 min</p>
              </div>
            </div>

            {/* ── Bloque 1: Cotizaciones ── */}
            <section>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Cotizaciones</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard
                  label="Dólar Blue"
                  compra={blueBuy}
                  venta={blueVenta}
                  color="amber"
                  badge="Informal"
                />
                <StatCard
                  label="Dólar Oficial"
                  compra={oficialBuy}
                  venta={oficialVenta}
                  color="emerald"
                  badge="BNA"
                />
              </div>
            </section>

            {/* ── Bloque 2: Brecha + Nafta en USD ── */}
            <section>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Indicadores</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <BrechaCard blue={blueVenta} oficial={oficialVenta} />

                {/* Súper en USD */}
                <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Súper 92 en USD</p>
                  <p className="text-3xl font-bold text-amber-400">
                    {loadingD ? <Skeleton w="w-20" /> : superUSD ? `USD ${superUSD}` : '—'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">por litro · al tipo blue</p>
                </div>

                {/* CTA seguros */}
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Seguros</p>
                  </div>
                  <div>
                    <p className="text-slate-200 font-semibold text-sm leading-snug">
                      El dólar sube y tu seguro ajusta con él.
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      Cotizá hoy y fijá el precio antes del próximo aumento.
                    </p>
                  </div>
                  <Link
                    to="/cotizador"
                    className="flex items-center justify-center gap-1.5 w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                  >
                    Cotizar mi seguro
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </section>

            {/* ── Bloque 3: Petróleo ── */}
            <section>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Petróleo internacional</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <OilCard wti={wti} brent={brent} loading={loadingO} />
                <MockAdBlock />
                <MockAdBlock />
              </div>
            </section>

            {/* ── Bloque 4: Info disclaimer ── */}
            <div className="flex items-start gap-2 bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
              <InfoIcon className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-relaxed">
                Cotizaciones provistas por <strong className="text-slate-500">Bluelytics</strong> (blue/oficial) y <strong className="text-slate-500">Yahoo Finance</strong> (petróleo).
                El precio de nafta en USD se calcula usando el promedio nacional de Súper 92 sobre el tipo blue.
                Esta información es orientativa — actualizamos cada 15 minutos.
              </p>
            </div>

            {/* ── Bloque 5: Ads grandes ── */}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MockAdBlock label="Banner 728×90" />
                <MockAdBlock label="Banner 728×90" />
              </div>
            </section>

            <MockAdBlock label="Banner 970×250 — Leaderboard" />

          </div>

          {/* ── Sidebar publicidad ── */}
          <AdSidebar />

        </div>
        <Footer />
      </main>
    </div>
  );
}
