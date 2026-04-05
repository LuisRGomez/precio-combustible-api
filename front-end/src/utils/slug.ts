/**
 * Genera un slug URL-friendly a partir de los datos de una estación.
 * Formato: {bandera}-{localidad}-{direccion}
 * Ej: "ypf-moreno-rivadavia-1234"
 */
export function stationSlug(params: {
  empresa: string;
  bandera?: string;
  direccion: string;
  localidad: string;
  provincia: string;
}): string {
  const parts = [
    params.bandera || params.empresa,
    params.localidad,
    params.direccion,
  ];
  return parts
    .join('-')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

export function provinciaSlug(provincia: string): string {
  return provincia
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

export function slugToProvincia(slug: string): string {
  return slug.replace(/-/g, ' ').toUpperCase();
}
