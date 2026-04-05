import React, { useEffect, useState } from 'react';
import {
  NewspaperIcon, ExternalLinkIcon, RefreshCwIcon,
  ClockIcon, BellIcon, GlobeIcon, FlagIcon,
} from 'lucide-react';
import { MiniLeadForm, isAlreadySubscribed } from './MiniLeadForm';

const API_BASE = import.meta.env.VITE_API_BASE || '';

type Pais = 'ar' | 'mundo';

interface NewsArticle {
  titulo:       string;
  fuente:       string;
  url:          string;
  fecha:        string;
  imagen?:      string;
  descripcion?: string;
  pais?:        string;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 60000;
    if (diff < 60)   return `hace ${Math.round(diff)} min`;
    if (diff < 1440) return `hace ${Math.round(diff / 60)} h`;
    return `hace ${Math.round(diff / 1440)} d`;
  } catch { return ''; }
}

function SkeletonCard({ withImage }: { withImage?: boolean }) {
  return (
    <div className="animate-pulse flex flex-col bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      {withImage && <div className="h-44 bg-slate-800" />}
      <div className="p-4 flex flex-col gap-2">
        <div className="h-3 bg-slate-800 rounded w-1/3" />
        <div className="h-4 bg-slate-800 rounded w-full" />
        <div className="h-4 bg-slate-800 rounded w-4/5" />
      </div>
    </div>
  );
}

/** Generate initials or an icon from the source name */
function SourcePlaceholder({ fuente }: { fuente: string }) {
  const initials = fuente
    .split(/[\s-–]/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');
  // Pick a deterministic color per source
  const colors = ['#b45309','#0369a1','#047857','#7c3aed','#be185d','#0f766e'];
  const idx    = fuente.charCodeAt(0) % colors.length;
  const bg     = colors[idx];
  return (
    <div className="h-44 flex-shrink-0 flex flex-col items-center justify-center gap-2"
         style={{ background: `${bg}18`, borderBottom: `1px solid ${bg}30` }}>
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
        style={{ background: bg }}
      >
        {initials || <NewspaperIcon className="w-5 h-5" />}
      </div>
      <span className="text-xs font-semibold px-3 py-0.5 rounded-full text-white/80"
            style={{ background: `${bg}60` }}>
        {fuente}
      </span>
    </div>
  );
}

function ArticleCard({ art }: { art: NewsArticle }) {
  const [imgFailed, setImgFailed] = React.useState(false);
  const showPlaceholder = !art.imagen || imgFailed;

  return (
    <a
      href={art.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden transition-all"
    >
      {showPlaceholder ? (
        <SourcePlaceholder fuente={art.fuente || 'Noticia'} />
      ) : (
        <div className="h-44 overflow-hidden bg-slate-800 flex-shrink-0 relative">
          <img
            src={art.imagen}
            alt={art.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgFailed(true)}
          />
        </div>
      )}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <div className="flex items-center justify-between gap-2">
          {art.fuente && <span className="text-xs text-amber-500/80 font-medium truncate">{art.fuente}</span>}
          {art.fecha && <span className="text-xs text-slate-600 flex-shrink-0">{timeAgo(art.fecha)}</span>}
        </div>
        <p className="text-slate-200 text-sm font-medium leading-snug line-clamp-2 group-hover:text-white transition-colors">
          {art.titulo}
        </p>
        {art.descripcion && (
          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{art.descripcion}</p>
        )}
        <div className="flex items-center gap-1 mt-auto pt-2">
          <ExternalLinkIcon className="w-3 h-3 text-slate-600 group-hover:text-amber-500/60 transition-colors" />
          <span className="text-xs text-slate-600 group-hover:text-slate-400 transition-colors">Leer nota</span>
        </div>
      </div>
    </a>
  );
}

export function NewsSection() {
  const [activeTab,   setActiveTab]   = useState<Pais>('ar');
  const [cache,       setCache]       = useState<Record<Pais, NewsArticle[]>>({ ar: [], mundo: [] });
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [lastUpdate,  setLastUpdate]  = useState<Date | null>(null);

  const articles  = cache[activeTab];
  const hasImages = articles.some(a => !!a.imagen);

  const fetchNews = async (pais: Pais, force = false) => {
    // Use cache if already loaded and not forced
    if (!force && cache[pais].length > 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/noticias?pais=${pais}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      const arts: NewsArticle[] = data.noticias || [];
      setCache(prev => ({ ...prev, [pais]: arts }));
      setLastUpdate(new Date());
    } catch {
      setError('No se pudieron cargar las noticias.');
    } finally {
      setLoading(false);
    }
  };

  // Load AR tab on mount
  useEffect(() => { fetchNews('ar'); }, []);

  // Load tab on switch
  const handleTab = (pais: Pais) => {
    setActiveTab(pais);
    fetchNews(pais);
  };

  return (
    <section className="mt-10 pt-8 border-t border-slate-800/60">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <NewspaperIcon className="w-4 h-4 text-amber-500" />
          <h2 className="text-slate-200 font-semibold text-sm">Noticias de combustible</h2>

          {/* Tabs */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 ml-1">
            <button
              onClick={() => handleTab('ar')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'ar'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <FlagIcon className="w-3 h-3" />
              Argentina
            </button>
            <button
              onClick={() => handleTab('mundo')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'mundo'
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <GlobeIcon className="w-3 h-3" />
              Internacional
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-slate-600 text-xs flex items-center gap-1">
              <ClockIcon className="w-3 h-3" />
              {timeAgo(lastUpdate.toISOString())}
            </span>
          )}
          <button
            onClick={() => fetchNews(activeTab, true)}
            disabled={loading}
            className="text-slate-500 hover:text-amber-500 transition-colors disabled:opacity-40"
            title="Actualizar"
          >
            <RefreshCwIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-slate-500 text-xs text-center py-6">{error}</p>}

      {/* Skeleton */}
      {loading && articles.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} withImage />)}
        </div>
      )}

      {/* Cards */}
      {!loading && articles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((art, i) => <ArticleCard key={i} art={art} />)}
        </div>
      )}

      {!loading && articles.length === 0 && !error && (
        <p className="text-slate-500 text-xs text-center py-6">No hay noticias disponibles.</p>
      )}

      {/* CTA lead capture */}
      {!loading && articles.length > 0 && !isAlreadySubscribed() && (
        <div className="mt-6 bg-slate-900 border border-amber-500/15 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <BellIcon className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-slate-200 text-sm font-medium">¿Querés enterarte primero?</p>
              <p className="text-slate-500 text-xs">Alertas de precio en tu zona, gratis.</p>
            </div>
          </div>
          <div className="flex-1 w-full sm:w-auto">
            <MiniLeadForm placeholder="Email o WhatsApp" compact />
          </div>
        </div>
      )}
    </section>
  );
}
