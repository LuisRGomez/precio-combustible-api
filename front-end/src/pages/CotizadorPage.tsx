import React, { useEffect, useState, useRef } from 'react';
import { useSEO } from '../hooks/useSEO';
import { Header } from '../components/Header';
import { QuickNav } from '../components/QuickNav';
import { OnboardingModal } from '../components/OnboardingModal';
import { LoginModal } from '../components/LoginModal';
import { SeguroCalculator } from '../components/SeguroCalculator';
import { useUser } from '../hooks/useUser';
import { Footer } from '../components/Footer';
import { ShieldCheckIcon, TrendingDownIcon, ZapIcon, CheckIcon, XIcon } from 'lucide-react';

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1400, startOnMount = true) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!startOnMount || started.current) return;
    started.current = true;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, startOnMount]);

  return value;
}

// ─── Stat counter card ────────────────────────────────────────────────────────
interface StatProps {
  rawTarget: number;
  suffix: string;
  label: string;
  prefix?: string;
}

function StatCard({ rawTarget, suffix, label, prefix = '' }: StatProps) {
  const count = useCountUp(rawTarget);
  const formatted = rawTarget >= 1000
    ? count.toLocaleString('es-AR')
    : count.toString();

  return (
    <div className="flex flex-col items-center gap-1 px-6 py-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm min-w-[140px]">
      <span className="text-2xl font-extrabold text-amber-500 tabular-nums tracking-tight">
        {prefix}{formatted}{suffix}
      </span>
      <span className="text-xs text-slate-400 text-center leading-snug">{label}</span>
    </div>
  );
}

// ─── Insurance sidebar ────────────────────────────────────────────────────────
const WHY_ITEMS = [
  {
    Icon: TrendingDownIcon,
    title: 'Ahorrás hasta un 31%',
    desc: 'Al comparar varias aseguradoras encontrás la misma cobertura a menor precio.',
  },
  {
    Icon: ShieldCheckIcon,
    title: 'Cobertura garantizada',
    desc: 'Solo trabajamos con aseguradoras habilitadas por la SSN.',
  },
  {
    Icon: ZapIcon,
    title: 'Cotizás en segundos',
    desc: 'Sin llamadas, sin esperas. Resultado inmediato y sin compromiso.',
  },
];

type Coverage = 'check' | 'x';
interface CoverageRow {
  plan: string;
  robo: Coverage;
  granizo: Coverage;
  danos: Coverage;
  basico: Coverage;
}

const COVERAGE_ROWS: CoverageRow[] = [
  { plan: 'Resp. Civil',        robo: 'x',     granizo: 'x',     danos: 'x',     basico: 'check' },
  { plan: 'Terceros Completo',  robo: 'check',  granizo: 'check', danos: 'x',     basico: 'check' },
  { plan: 'Todo Riesgo',        robo: 'check',  granizo: 'check', danos: 'check', basico: 'check' },
];

const COVERAGE_COLS: { key: keyof Omit<CoverageRow, 'plan'>; label: string }[] = [
  { key: 'robo',    label: 'Robo' },
  { key: 'granizo', label: 'Granizo' },
  { key: 'danos',   label: 'D. propios' },
  { key: 'basico',  label: 'Básico' },
];

const FACTS = [
  'Argentina tiene más de 200 aseguradoras activas supervisadas por la SSN.',
  'El 60% de los automovilistas renueva su seguro sin comparar alternativas.',
  'Cambiar de plan en el vencimiento no genera penalidades y puede ahorrar miles de pesos al año.',
];

function CoverageCell({ value }: { value: Coverage }) {
  return value === 'check' ? (
    <span className="flex justify-center">
      <CheckIcon className="w-4 h-4 text-emerald-400" strokeWidth={2.5} />
    </span>
  ) : (
    <span className="flex justify-center">
      <XIcon className="w-4 h-4 text-slate-600" strokeWidth={2.5} />
    </span>
  );
}

function InsuranceSidebar() {
  return (
    <aside className="w-80 flex-shrink-0 flex flex-col gap-4">

      {/* Urgency chip */}
      <div className="flex items-center justify-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/25 py-2 px-4">
        <span className="text-xs font-medium text-amber-400">
          🔄 Tarifas actualizadas hoy
        </span>
      </div>

      {/* Why compare card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-100 mb-3">¿Por qué comparar?</h3>
        <ul className="flex flex-col gap-3">
          {WHY_ITEMS.map(({ Icon, title, desc }) => (
            <li key={title} className="flex gap-3 items-start">
              <span className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-amber-500" />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-200 leading-tight">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Coverage comparison table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-100 mb-3">Coberturas por plan</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left text-slate-500 font-medium pb-2 pr-2">Plan</th>
                {COVERAGE_COLS.map(({ label }) => (
                  <th key={label} className="text-center text-slate-500 font-medium pb-2 px-1 whitespace-nowrap">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {COVERAGE_ROWS.map((row) => (
                <tr key={row.plan}>
                  <td className="py-2 pr-2 text-slate-300 font-medium whitespace-nowrap">{row.plan}</td>
                  {COVERAGE_COLS.map(({ key }) => (
                    <td key={key} className="py-2 px-1">
                      <CoverageCell value={row[key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Did you know card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-100 mb-3">¿Sabías que...?</h3>
        <ul className="flex flex-col gap-2.5">
          {FACTS.map((fact, i) => (
            <li key={i} className="flex gap-2 items-start">
              <span className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
              <p className="text-xs text-slate-400 leading-snug">{fact}</p>
            </li>
          ))}
        </ul>
      </div>

    </aside>
  );
}

// ─── Hero section ─────────────────────────────────────────────────────────────
const INSURERS = [
  'Zurich', 'Allianz', 'La Caja', 'Mapfre',
  'Federación Patronal', 'San Cristóbal', 'Sancor', 'Berkley',
];

function HeroSection() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/60 mb-8">
      {/* Ambient overlay */}
      <div className="absolute inset-0 bg-amber-500/5 pointer-events-none" />
      {/* Radial amber glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '70%',
          height: '300px',
          background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 px-6 sm:px-10 py-10 flex flex-col items-center text-center gap-6">
        {/* Headline */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
            ¿Estás pagando de más por tu seguro?
          </h1>
          <p className="mt-2 text-base text-slate-400 max-w-xl mx-auto">
            Comparamos las mejores aseguradoras de Argentina en segundos
          </p>
        </div>

        {/* Stat counters */}
        <div className="flex flex-wrap justify-center gap-3">
          <StatCard rawTarget={12400} suffix="+" label="Cotizaciones este mes" />
          <StatCard rawTarget={31}    suffix="%" label="Ahorro promedio al comparar" />
          <StatCard rawTarget={20}    suffix="+" label="Aseguradoras comparadas" />
        </div>

        {/* Insurer badge strip */}
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
          {INSURERS.map((name) => (
            <span
              key={name}
              className="text-xs font-medium text-slate-400 bg-slate-800/70 border border-slate-700/60 rounded-full px-3 py-1 whitespace-nowrap"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function CotizadorPage() {
  useSEO({
    title:       'Calculadora de gasto en nafta — ahorrá en tu auto',
    description: 'Calculá cuánto gastás en nafta por mes. Cotizá tu seguro de auto y compará aseguradoras en Argentina. Herramienta gratuita en Tankear.',
    canonical:   'https://tankear.com.ar/cotizador',
  });
  const { user, logout } = useUser();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [loginOpen,      setLoginOpen]      = useState(false);

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

        {/* Hero — full width */}
        <HeroSection />

        {/* Main content row */}
        <div className="flex gap-8 items-start">

          {/* SeguroCalculator — flexible width */}
          <div className="flex-1 min-w-0">
            <SeguroCalculator />
          </div>

          {/* Insurance sidebar — fixed width */}
          <InsuranceSidebar />

        </div>

        <Footer />
      </main>
    </div>
  );
}
