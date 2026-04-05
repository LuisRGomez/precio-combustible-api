import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export type Pais = 'ar' | 'mundo';

export interface NewsArticle {
  titulo:       string;
  fuente:       string;
  url:          string;
  fecha:        string;
  imagen?:      string;
  descripcion?: string;
  pais?:        string;
}

// Module-level cache so multiple instances don't re-fetch
const _cache: Record<Pais, NewsArticle[]> = { ar: [], mundo: [] };
const _lastFetch: Record<Pais, number> = { ar: 0, mundo: 0 };
const CACHE_TTL = 5 * 60 * 1000; // 5 min

export function useNewsData(pais: Pais, limit?: number) {
  const [articles,   setArticles]   = useState<NewsArticle[]>(_cache[pais]);
  const [loading,    setLoading]    = useState(_cache[pais].length === 0);
  const [error,      setError]      = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(
    _lastFetch[pais] ? new Date(_lastFetch[pais]) : null
  );

  const fetchNews = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && _cache[pais].length > 0 && now - _lastFetch[pais] < CACHE_TTL) {
      setArticles(limit ? _cache[pais].slice(0, limit) : _cache[pais]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/noticias?pais=${pais}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      const arts: NewsArticle[] = data.noticias || [];
      _cache[pais] = arts;
      _lastFetch[pais] = Date.now();
      setArticles(limit ? arts.slice(0, limit) : arts);
      setLastUpdate(new Date());
    } catch {
      setError('No se pudieron cargar las noticias.');
    } finally {
      setLoading(false);
    }
  }, [pais, limit]);

  useEffect(() => { fetchNews(); }, [pais]);

  const refetch = useCallback(() => fetchNews(true), [fetchNews]);

  return { articles, loading, error, lastUpdate, refetch };
}

export function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 60000;
    if (diff < 60)   return `hace ${Math.round(diff)} min`;
    if (diff < 1440) return `hace ${Math.round(diff / 60)} h`;
    return `hace ${Math.round(diff / 1440)} d`;
  } catch { return ''; }
}
