import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon, NewspaperIcon } from 'lucide-react';
import { useNewsData, timeAgo, Pais } from '../hooks/useNewsData';

interface NewsWidgetProps {
  pais:        Pais;
  limit?:      number;
  showViewAll?: boolean;
}

export function NewsWidget({ pais, limit = 3, showViewAll = false }: NewsWidgetProps) {
  const { articles, loading, error } = useNewsData(pais, limit);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="animate-pulse space-y-1.5 py-3 border-b border-slate-800/60 last:border-0">
            <div className="h-2.5 bg-slate-800 rounded w-1/3" />
            <div className="h-3.5 bg-slate-800 rounded w-full" />
            <div className="h-3.5 bg-slate-800 rounded w-4/5" />
          </div>
        ))}
      </div>
    );
  }

  if (error || articles.length === 0) {
    return (
      <p className="text-slate-600 text-xs py-4 text-center">
        {error || 'Sin noticias disponibles.'}
      </p>
    );
  }

  return (
    <div>
      <div className="divide-y divide-slate-800/60">
        {articles.map((art, i) => (
          <a
            key={i}
            href={art.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-1 py-3 px-2 -mx-2 rounded-lg hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-amber-500/80 truncate">{art.fuente}</span>
              {art.fecha && (
                <>
                  <span className="text-[10px] text-slate-700">·</span>
                  <span className="text-[10px] text-slate-600 flex-shrink-0">{timeAgo(art.fecha)}</span>
                </>
              )}
            </div>
            <p className="text-xs font-medium text-slate-300 group-hover:text-slate-100 leading-snug line-clamp-2 transition-colors">
              {art.titulo}
            </p>
          </a>
        ))}
      </div>

      {showViewAll && (
        <Link
          to="/noticias"
          className="mt-3 flex items-center gap-1 text-xs text-amber-500/70 hover:text-amber-400 transition-colors"
        >
          <NewspaperIcon className="w-3 h-3" />
          Ver todas las noticias
          <ChevronRightIcon className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}
