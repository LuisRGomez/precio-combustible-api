import { useEffect, useState } from 'react';

interface DolarData {
  blueSell:    number | null;
  blueBuy:     number | null;
  oficialSell: number | null;
  oficialBuy:  number | null;
  loading:     boolean;
  /** @deprecated use blueSell */
  blue:        number | null;
  /** @deprecated use oficialSell */
  oficial:     number | null;
}

let _cache: { data: Omit<DolarData, 'loading'>; ts: number } | null = null;
const CACHE_MS = 15 * 60 * 1000;

export function useDolar(): DolarData {
  const [data, setData] = useState<DolarData>({
    blueSell: null, blueBuy: null,
    oficialSell: null, oficialBuy: null,
    blue: null, oficial: null,
    loading: true,
  });

  useEffect(() => {
    if (_cache && Date.now() - _cache.ts < CACHE_MS) {
      setData({ ..._cache.data, loading: false });
      return;
    }
    fetch('https://api.bluelytics.com.ar/v2/latest')
      .then(r => r.json())
      .then(j => {
        const d = {
          blueSell:    j.blue?.value_sell        ?? null,
          blueBuy:     j.blue?.value_buy         ?? null,
          oficialSell: j.oficial?.value_sell     ?? null,
          oficialBuy:  j.oficial?.value_buy      ?? null,
          // backward compat
          blue:        j.blue?.value_sell        ?? null,
          oficial:     j.oficial?.value_sell     ?? null,
        };
        _cache = { data: d, ts: Date.now() };
        setData({ ...d, loading: false });
      })
      .catch(() => setData({ blueSell: null, blueBuy: null, oficialSell: null, oficialBuy: null, blue: null, oficial: null, loading: false }));
  }, []);

  return data;
}

/** Devuelve el precio de 1L de Súper en USD blue (sell), usando el promedio guardado en localStorage */
export function getSuperUSD(blue: number): string {
  const superARS = parseFloat(localStorage.getItem('tankear_super_promedio') ?? '1800');
  return (superARS / blue).toFixed(2);
}
