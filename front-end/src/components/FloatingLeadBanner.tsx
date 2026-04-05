import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BellIcon, XIcon, SparklesIcon, ShieldIcon } from 'lucide-react';
import { MiniLeadForm, isAlreadySubscribed } from './MiniLeadForm';

const DISMISSED_KEY = 'tankear_float_dismissed';

interface PageConfig {
  icon:     'bell' | 'shield';
  heading:  string;
  sub:      string;
  pagina:   string;
  accentClass: string;
  iconClass:   string;
}

function getPageConfig(pathname: string, zona?: string): PageConfig {
  if (pathname.startsWith('/cotizador')) {
    return {
      icon:        'shield',
      heading:     '¿Querés que te avisemos si bajan?',
      sub:         'Dejá tu contacto y te notificamos cuando cambien las tarifas de seguros.',
      pagina:      'cotizador_seguros_float',
      accentClass: 'border-blue-500/30',
      iconClass:   'bg-blue-500/15 text-blue-400',
    };
  }
  if (pathname.startsWith('/viaje') || pathname.startsWith('/road')) {
    return {
      icon:        'shield',
      heading:     '¿Viajás seguido? Viajá cubierto.',
      sub:         'Cotizá tu seguro y recibí alertas de nafta en ruta.',
      pagina:      'road_trip_float',
      accentClass: 'border-emerald-500/30',
      iconClass:   'bg-emerald-500/15 text-emerald-400',
    };
  }
  if (pathname.startsWith('/dolar')) {
    return {
      icon:        'bell',
      heading:     'El dólar sube. Tu seguro, también.',
      sub:         'Cotizá ahora y fijá el precio antes del próximo ajuste.',
      pagina:      'dolar_float',
      accentClass: 'border-amber-500/30',
      iconClass:   'bg-amber-500/15 text-amber-500',
    };
  }
  if (pathname.startsWith('/noticias')) {
    return {
      icon:        'bell',
      heading:     'Alertas de noticias y precios',
      sub:         'Te avisamos cuando haya novedades de combustibles y seguros.',
      pagina:      'noticias_float',
      accentClass: 'border-amber-500/30',
      iconClass:   'bg-amber-500/15 text-amber-500',
    };
  }
  // Default — dashboard / resto
  return {
    icon:        'bell',
    heading:     'Alertas de precio gratis',
    sub:         `Te avisamos cuando cambian los precios${zona ? ` en ${zona}` : ''}.`,
    pagina:      'combustible_float',
    accentClass: 'border-amber-500/30',
    iconClass:   'bg-amber-500/15 text-amber-500',
  };
}

interface Props {
  zona?: string;
}

export function FloatingLeadBanner({ zona }: Props) {
  const [visible,    setVisible]    = useState(false);
  const [leaving,    setLeaving]    = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const location = useLocation();

  const config = getPageConfig(location.pathname, zona);

  useEffect(() => {
    // No mostrar si ya se suscribió o ya lo cerró antes
    if (isAlreadySubscribed() || localStorage.getItem(DISMISSED_KEY)) return;

    // Aparece después de 35 segundos
    const t = setTimeout(() => setVisible(true), 35000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setLeaving(true);
    localStorage.setItem(DISMISSED_KEY, '1');
    setTimeout(() => setVisible(false), 350);
  };

  const onSuccess = () => {
    setSubscribed(true);
    setTimeout(dismiss, 2500);
  };

  if (!visible) return null;

  const IconComp = config.icon === 'shield' ? ShieldIcon : BellIcon;

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] max-w-md transition-all duration-350
        ${leaving ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
      style={{ transition: 'opacity 0.35s ease, transform 0.35s ease' }}>

      <div className={`bg-slate-900 border ${config.accentClass} rounded-2xl shadow-2xl shadow-black/50 p-4`}>
        {subscribed ? (
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-slate-200 font-semibold text-sm">¡Listo!</p>
              <p className="text-slate-400 text-xs">Te avisamos cuando haya novedades.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${config.iconClass}`}>
                  <IconComp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-slate-200 font-semibold text-sm leading-tight">
                    {config.heading}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {config.sub}
                  </p>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0 mt-0.5">
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <MiniLeadForm
              zona={zona}
              pagina_origen={config.pagina}
              placeholder="Email o número de WhatsApp"
              onSuccess={onSuccess}
              onDismiss={dismiss}
            />
          </>
        )}
      </div>
    </div>
  );
}
