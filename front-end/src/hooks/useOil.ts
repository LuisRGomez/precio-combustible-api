import { useEffect, useState } from 'react';

interface OilData {
  wti:     number | null;
  brent:   number | null;
  loading: boolean;
}

let _cache: { data: Omit<OilData, 'loading'>; ts: number } | null = null;
const CACHE_MS = 30 * 60 * 1000; // 30 minutos

export function useOil(): OilData {
  const [data, setData] = useState<OilData>({ wti: null, brent: null, loading: true });

  useEffect(() => {
    if (_cache && Date.now() - _cache.ts < CACHE_MS) {
      setData({ ..._cache.data, loading: false });
      return;
    }

    // Yahoo Finance — WTI (CL=F) y Brent (BZ=F) — sin API key, CORS permitido
    const fetchPrice = async (symbol: string): Promise<number | null> => {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
          { headers: { 'Accept': 'application/json' } }
        );
        if (!res.ok) return null;
        const json = await res.json();
        const meta = json?.chart?.result?.[0]?.meta;
        return meta?.regularMarketPrice ?? meta?.previousClose ?? null;
      } catch {
        return null;
      }
    };

    Promise.all([fetchPrice('CL=F'), fetchPrice('BZ=F')])
      .then(([wti, brent]) => {
        const d = { wti, brent };
        _cache = { data: d, ts: Date.now() };
        setData({ ...d, loading: false });
      })
      .catch(() => setData({ wti: null, brent: null, loading: false }));
  }, []);

  return data;
}
