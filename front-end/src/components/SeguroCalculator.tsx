import React, { useState } from 'react';
import { ShieldIcon, ExternalLinkIcon, BellIcon, CheckIcon, ChevronRightIcon } from 'lucide-react';
import { MiniLeadForm, isAlreadySubscribed } from './MiniLeadForm';

const CURRENT_YEAR = new Date().getFullYear();
const ANOS = Array.from({ length: CURRENT_YEAR - 1989 }, (_, i) => CURRENT_YEAR - i);

const PROVINCIAS = [
  'BUENOS AIRES','CIUDAD AUTÓNOMA DE BUENOS AIRES','CATAMARCA','CHACO','CHUBUT',
  'CÓRDOBA','CORRIENTES','ENTRE RÍOS','FORMOSA','JUJUY','LA PAMPA','LA RIOJA',
  'MENDOZA','MISIONES','NEUQUÉN','RÍO NEGRO','SALTA','SAN JUAN','SAN LUIS',
  'SANTA CRUZ','SANTA FE','SANTIAGO DEL ESTERO','TIERRA DEL FUEGO','TUCUMÁN',
];

const COBERTURAS = [
  { id: 'resp_civil',  label: 'Responsabilidad Civil', desc: 'Cobertura básica obligatoria' },
  { id: 'terceros',    label: 'Terceros Completo',     desc: 'Robo + granizo + incendio'   },
  { id: 'todo_riesgo', label: 'Todo Riesgo',           desc: 'Máxima protección + daños'   },
];

interface Props {
  provincia?: string;
}

export function SeguroCalculator({ provincia: provinciaProp }: Props) {
  const [anio,      setAnio]      = useState('');
  const [provincia, setProvincia] = useState(provinciaProp || '');
  const [uso,       setUso]       = useState<'particular' | 'comercial'>('particular');
  const [gnc,       setGnc]       = useState(false);
  const [cobertura, setCobertura] = useState('terceros');
  const [submitted, setSubmitted] = useState(false);
  const [showLead,  setShowLead]  = useState(false);

  const canSubmit = !!anio && !!provincia;

  const buildAffiliateUrl = () => {
    // Parámetros UTM para trackeo de conversiones
    const params = new URLSearchParams({
      utm_source:   'tankear',
      utm_medium:   'cotizador',
      utm_campaign: 'seguro_auto',
      anio:         anio,
      provincia:    provincia,
      uso:          uso,
      gnc:          gnc ? '1' : '0',
      cobertura:    cobertura,
    });
    // Reemplazá esta URL con tu link de afiliado real (123Seguro, Buscaseguros, etc.)
    return `https://www.123seguro.com/cotizador/auto?${params.toString()}`;
  };

  const handleCotizar = () => {
    if (!canSubmit) return;
    setSubmitted(true);
    // Abrir en nueva tab
    window.open(buildAffiliateUrl(), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-xl mt-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1 pb-4 border-b border-slate-800">
        <ShieldIcon className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-slate-100">Cotizador de Seguros</h2>
        <span className="ml-auto text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
          Nuevo
        </span>
      </div>

      <p className="text-slate-500 text-xs mb-4 mt-3">
        Completá los datos de tu auto y te mostramos las mejores opciones.
      </p>

      <div className="space-y-4">
        {/* Año + Provincia */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Año del auto</label>
            <select
              value={anio}
              onChange={e => setAnio(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500/60 rounded-lg px-2.5 py-2.5 text-sm text-slate-200 focus:outline-none transition-colors"
            >
              <option value="">Año...</option>
              {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Provincia</label>
            <select
              value={provincia}
              onChange={e => setProvincia(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500/60 rounded-lg px-2.5 py-2.5 text-sm text-slate-200 focus:outline-none transition-colors"
            >
              <option value="">Provincia...</option>
              {PROVINCIAS.map(p => (
                <option key={p} value={p}>{p === 'CIUDAD AUTÓNOMA DE BUENOS AIRES' ? 'CABA' : p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Uso */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Uso</label>
          <div className="flex gap-2">
            {(['particular', 'comercial'] as const).map(u => (
              <button
                key={u}
                type="button"
                onClick={() => setUso(u)}
                className={`flex-1 py-2 rounded-lg text-sm border transition-colors capitalize ${
                  uso === u
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-300 font-medium'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {u.charAt(0).toUpperCase() + u.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Cobertura */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Cobertura deseada</label>
          <div className="space-y-2">
            {COBERTURAS.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCobertura(c.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                  cobertura === c.id
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  cobertura === c.id ? 'border-blue-400 bg-blue-400' : 'border-slate-600'
                }`}>
                  {cobertura === c.id && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                </div>
                <div>
                  <p className={`text-sm font-medium ${cobertura === c.id ? 'text-blue-300' : 'text-slate-300'}`}>
                    {c.label}
                  </p>
                  <p className="text-xs text-slate-500">{c.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* GNC */}
        <button
          type="button"
          onClick={() => setGnc(p => !p)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border w-full text-left transition-colors ${
            gnc
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
          }`}
        >
          <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
            gnc ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
          }`}>
            {gnc && <CheckIcon className="w-2.5 h-2.5 text-slate-950" />}
          </div>
          <div>
            <p className={`text-sm font-medium ${gnc ? 'text-emerald-300' : 'text-slate-400'}`}>
              El auto tiene GNC
            </p>
            <p className="text-xs text-slate-500">Afecta la prima del seguro</p>
          </div>
        </button>

        {/* CTA */}
        <button
          onClick={handleCotizar}
          disabled={!canSubmit}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm mt-2"
        >
          Ver cotizaciones
          <ExternalLinkIcon className="w-4 h-4" />
        </button>

        {!canSubmit && (
          <p className="text-slate-600 text-xs text-center -mt-2">
            Completá año y provincia para cotizar
          </p>
        )}

        {/* Lead capture post-click */}
        {submitted && (
          <div className="border-t border-slate-800 pt-4">
            {showLead || isAlreadySubscribed() ? (
              isAlreadySubscribed() ? (
                <div className="flex items-center gap-2 text-emerald-400 text-xs">
                  <CheckIcon className="w-4 h-4 flex-shrink-0" />
                  <span>Ya estás suscripto. Te avisamos cuando bajen las tarifas.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-slate-400 text-xs">¿Querés que te avisemos si bajan las tarifas?</p>
                  <MiniLeadForm
                    placeholder="Email o WhatsApp"
                    compact
                    onSuccess={() => setShowLead(false)}
                    pagina_origen="cotizador_seguros"
                  />
                </div>
              )
            ) : (
              <button
                onClick={() => setShowLead(true)}
                className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-amber-400 py-2 transition-colors"
              >
                <BellIcon className="w-3.5 h-3.5" />
                Avisame si bajan las tarifas
                <ChevronRightIcon className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
