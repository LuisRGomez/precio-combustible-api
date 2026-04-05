import React, { Component, useEffect, useState } from 'react';
import { Station } from '../types';
import { StationList } from './StationList';
import { FuelMap, FocusPoint } from './FuelMap';
import { MapPinIcon, PanelLeftOpenIcon, PanelLeftCloseIcon, InfoIcon } from 'lucide-react';

interface MapPanelProps {
  data:            Station[];
  selectedStation: Station | null;
  onStationClick:  (s: Station) => void;
  focusPoint:      FocusPoint | null;
  staleCount:      number;
}

class MapErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { console.warn('[MapErrorBoundary]', error.message); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center gap-4">
          <MapPinIcon className="w-12 h-12 text-slate-600" />
          <p className="text-slate-400 text-sm">Error al cargar el mapa</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-xs text-amber-500 hover:text-amber-400 underline"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function MapPanel({ data, selectedStation, onStationClick, focusPoint, staleCount }: MapPanelProps) {
  // Desktop: panel open by default; mobile: closed by default
  const [panelOpen, setPanelOpen] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth >= 1024;
    return true;
  });

  // Sync with media query changes
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setPanelOpen(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div className="relative h-[65vh] min-h-80 rounded-xl overflow-hidden border border-slate-800/60">

      {/* ── FuelMap fills entire background ── */}
      <MapErrorBoundary>
        <FuelMap
          data={data}
          selectedStation={selectedStation}
          focusPoint={focusPoint}
          className="absolute inset-0 z-0 overflow-hidden"
        />
      </MapErrorBoundary>

      {/* ── Station list panel (overlay) ── */}
      <div
        className={[
          'absolute left-0 top-0 h-full z-[1001] flex flex-col',
          'bg-slate-950/95 backdrop-blur-md border-r border-slate-800/60',
          'transition-transform duration-300 ease-in-out',
          // Mobile: full-width; desktop: 320px
          'w-full sm:w-80',
          panelOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-800/60 flex-shrink-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Estaciones ({data.length})
          </span>
          <button
            onClick={() => setPanelOpen(false)}
            className="text-slate-500 hover:text-slate-200 transition-colors p-1"
            aria-label="Cerrar panel"
          >
            <PanelLeftCloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Stale count badge */}
        {staleCount > 0 && (
          <div className="mx-3 mt-2 flex items-center gap-2 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-xs text-slate-500 flex-shrink-0">
            <InfoIcon className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
            <span>
              <span className="text-slate-400 font-medium">
                {staleCount} estación{staleCount > 1 ? 'es' : ''}
              </span>{' '}
              con precio sin confirmar (+30 días).
            </span>
          </div>
        )}

        {/* Scrollable station list */}
        <div className="flex-1 overflow-y-auto">
          <StationList
            data={data}
            selectedStation={selectedStation}
            onStationClick={onStationClick}
          />
        </div>
      </div>

      {/* ── Toggle button (shown when panel closed) ── */}
      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          className="absolute top-3 left-3 z-[1002] flex items-center gap-1.5 px-3 py-1.5 rounded-lg
            bg-slate-900/90 backdrop-blur-sm border border-slate-700 text-slate-300
            hover:text-amber-400 hover:border-amber-500/40 transition-all text-xs font-medium shadow-lg"
          aria-label="Ver estaciones"
        >
          <PanelLeftOpenIcon className="w-3.5 h-3.5" />
          <span>Estaciones</span>
        </button>
      )}

      {/* ── Desktop: toggle button to the right of the open panel ── */}
      {panelOpen && (
        <button
          onClick={() => setPanelOpen(false)}
          className="hidden sm:flex absolute top-3 z-[1002] items-center gap-1.5 px-3 py-1.5 rounded-lg
            bg-slate-900/90 backdrop-blur-sm border border-slate-700 text-slate-300
            hover:text-amber-400 hover:border-amber-500/40 transition-all text-xs font-medium shadow-lg"
          style={{ left: 'calc(20rem + 12px)' }}
          aria-label="Cerrar panel"
        >
          <PanelLeftCloseIcon className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
