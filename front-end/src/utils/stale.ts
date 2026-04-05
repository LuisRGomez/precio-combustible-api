import { Station } from '../types';

// Precio "fresco" = vigente en los últimos 30 días
const STALE_DAYS = 30;

// Sanity: ningún combustible líquido en Argentina vale menos de $1000/L en 2026.
// Precios por debajo de esto son datos históricos del dataset gubernamental (pre-2025).
const MIN_PRICE_SANE = 1000;

export function isStale(station: Station): boolean {
  // Precio anacrónico (pre-2024) — descartarlo siempre
  if (station.precio > 0 && station.precio < MIN_PRICE_SANE) return true;
  // Si el backend ya lo marcó como no vigente, confiar en eso
  if (station.precio_vigente === false) return true;
  // Si no hay fecha, considerarlo stale
  if (!station.fecha_vigencia) return true;
  try {
    const diff = (Date.now() - new Date(station.fecha_vigencia).getTime()) / 86400000;
    return diff > STALE_DAYS;
  } catch {
    return true;
  }
}

export function filterFresh(data: Station[]): Station[] {
  return data.filter(s => !isStale(s));
}

export function staleDaysAgo(fecha: string): number {
  if (!fecha) return 999;
  try {
    return Math.round((Date.now() - new Date(fecha).getTime()) / 86400000);
  } catch {
    return 999;
  }
}
