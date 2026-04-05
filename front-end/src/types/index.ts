export interface Station {
  empresa: string;
  razon_social?: string;
  bandera?: string;
  tipo_bandera?: string;
  numero_establecimiento?: string;
  calle?: string;
  numero?: string;
  direccion: string;
  localidad: string;
  provincia: string;
  codigo_postal?: string;
  latitud?: number;
  longitud?: number;
  producto: string;
  precio: number;
  fecha_vigencia: string;
  precio_vigente?: boolean;
  distancia?: number;
}

export interface FilterState {
  provincia: string;
  localidad: string;
  barrio: string;
  empresa: string;
  producto: string;
  fecha_desde: string;
}

export interface UbicacionResuelta {
  method: 'gps' | 'ip_cache' | 'ip_geo' | 'localidad' | 'provincia' | 'default';
  precision: 'exacta' | 'aproximada' | 'localidad' | 'provincia' | 'default';
  lat: number | null;
  lon: number | null;
  localidad?: string | null;
  provincia?: string | null;
  geocoded?: true | null;
  localidad_detectada?: string | null;
  localidad_dataset?: string | null;
  distancia_dataset_km?: number | null;
  advertencia_fecha?: string | null;
  radio_ampliado?: true | null;
  provincia_ajustada?: string | null;
  nota?: string | null;
  ubicacion_aproximada?: boolean;
  sugerencia?: string | null;
}

export interface SmartAPIResponse {
  ubicacion_resuelta: UbicacionResuelta;
  total: number;
  estaciones: RenderStation[];
}

export interface RenderAPIResponse {
  total: number;
  estaciones: RenderStation[];
}

export interface RenderStation {
  empresa: string;
  razon_social?: string;
  bandera?: string;
  tipo_bandera?: string;
  numero_establecimiento?: string;
  calle?: string;
  numero?: string;
  direccion: string;
  localidad: string;
  provincia: string;
  codigo_postal?: string;
  latitud?: number;
  longitud?: number;
  producto: string;
  precio: number;
  fecha_vigencia: string;
  precio_vigente?: boolean;
  distancia_km?: number;
}

export interface DatasetInfo {
  dataset: string;
  fuente: string;
  last_modified: string;
}

export interface FuelDataState {
  data: Station[];
  loading: boolean;
  error: string | null;
  isUsingFallback: boolean;
}

// ─── Product Helpers ─────────────────────────────────────────────────
export interface ProductInfo {
  key: ProductKey;
  label: string;
  shortLabel: string;
  unit: string;
  match: string;
  color: string;
  bgClass: string;
  textClass: string;
}

export type ProductKey =
'gnc' |
'nafta_super' |
'nafta_premium' |
'gasoil_g2' |
'gasoil_g3' |
'infinia' |
'infinia_diesel';

export const PRODUCT_MAP: ProductInfo[] = [
{
  key: 'nafta_super',
  label: 'Nafta Súper',
  shortLabel: 'Súper',
  unit: '$/L',
  match: 'entre 92 y 95',
  color: '#3b82f6',
  bgClass: 'bg-blue-500/15',
  textClass: 'text-blue-400'
},
{
  key: 'nafta_premium',
  label: 'Nafta Premium',
  shortLabel: 'Premium',
  unit: '$/L',
  match: 'más de 95',
  color: '#8b5cf6',
  bgClass: 'bg-violet-500/15',
  textClass: 'text-violet-400'
},
{
  key: 'gasoil_g2',
  label: 'Gasoil Grado 2',
  shortLabel: 'Gasoil G2',
  unit: '$/L',
  match: 'Grado 2',
  color: '#f97316',
  bgClass: 'bg-orange-500/15',
  textClass: 'text-orange-400'
},
{
  key: 'gasoil_g3',
  label: 'Gasoil Grado 3',
  shortLabel: 'Gasoil G3',
  unit: '$/L',
  match: 'Grado 3',
  color: '#ef4444',
  bgClass: 'bg-red-500/15',
  textClass: 'text-red-400'
},
{
  key: 'infinia',
  label: 'Infinia',
  shortLabel: 'Infinia',
  unit: '$/L',
  match: 'Infinia',
  color: '#06b6d4',
  bgClass: 'bg-cyan-500/15',
  textClass: 'text-cyan-400'
},
{
  key: 'infinia_diesel',
  label: 'Infinia Diesel',
  shortLabel: 'Inf. Diesel',
  unit: '$/L',
  match: 'Infinia Diesel',
  color: '#14b8a6',
  bgClass: 'bg-teal-500/15',
  textClass: 'text-teal-400'
},
{
  key: 'gnc',
  label: 'GNC',
  shortLabel: 'GNC',
  unit: '$/m³',
  match: 'GNC',
  color: '#10b981',
  bgClass: 'bg-emerald-500/15',
  textClass: 'text-emerald-400'
}];


export function getProductInfo(producto: string): ProductInfo {
  return (
    PRODUCT_MAP.find((p) => producto.includes(p.match)) || {
      key: 'nafta_super' as ProductKey,
      label: producto,
      shortLabel: producto.slice(0, 12),
      unit: '$/L',
      match: producto,
      color: '#64748b',
      bgClass: 'bg-slate-500/15',
      textClass: 'text-slate-400'
    });

}