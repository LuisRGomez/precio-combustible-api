import React, { useEffect, useState } from 'react';
import { BellIcon, XIcon, SparklesIcon } from 'lucide-react';
import { MiniLeadForm, isAlreadySubscribed } from './MiniLeadForm';

const DISMISSED_KEY = 'tankear_float_dismissed';

interface Props {
  zona?: string;
}

export function FloatingLeadBanner({ zona }: Props) {
  const [visible,   setVisible]   = useState(false);
  const [leaving,   setLeaving]   = useState(false);
  const [subscribed, setSubscribed] = useState(false);

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

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] max-w-md transition-all duration-350
        ${leaving ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
      style={{ transition: 'opacity 0.35s ease, transform 0.35s ease' }}>

      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl shadow-black/50 p-4">
        {subscribed ? (
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-slate-200 font-semibold text-sm">¡Suscripto!</p>
              <p className="text-slate-400 text-xs">Te avisamos cuando cambien los precios.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <BellIcon className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-slate-200 font-semibold text-sm leading-tight">
                    Alertas de precio gratis
                  </p>
                  <p className="text-slate-500 text-xs">
                    Te avisamos cuando cambian los precios{zona ? ` en ${zona}` : ''}.
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
