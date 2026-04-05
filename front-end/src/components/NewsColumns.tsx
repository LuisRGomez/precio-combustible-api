import React from 'react';
import { BellIcon, FlagIcon, GlobeIcon } from 'lucide-react';
import { NewsWidget } from './NewsWidget';
import { MiniLeadForm, isAlreadySubscribed } from './MiniLeadForm';

export function NewsColumns() {
  return (
    <section className="mt-10 pt-8 border-t border-slate-800/60">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* ── Argentina ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FlagIcon className="w-3.5 h-3.5 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-300">Argentina</h3>
          </div>
          <NewsWidget pais="ar" limit={4} showViewAll />
        </div>

        {/* ── CTA central ── */}
        <div className="flex flex-col items-center justify-center text-center px-4 py-8
                        bg-slate-900/40 border border-slate-800/60 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20
                          flex items-center justify-center mb-3">
            <BellIcon className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200 mb-1">
            ¿Querés saber cuándo bajan los precios?
          </h3>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            Alertas de precio en tu zona, gratis. Sin spam.
          </p>
          {!isAlreadySubscribed() && (
            <div className="w-full max-w-xs">
              <MiniLeadForm placeholder="Email o WhatsApp" compact />
            </div>
          )}
          {isAlreadySubscribed() && (
            <p className="text-xs text-emerald-500">✓ Ya estás suscripto</p>
          )}
        </div>

        {/* ── Internacional ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <GlobeIcon className="w-3.5 h-3.5 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-300">Internacional</h3>
          </div>
          <NewsWidget pais="mundo" limit={4} showViewAll />
        </div>

      </div>
    </section>
  );
}
