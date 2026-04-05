export function haversine(
lat1: number,
lon1: number,
lat2: number,
lon2: number)
: number {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return Infinity;

  const R = 6371; // Earth radius in km
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const dphi = (lat2 - lat1) * Math.PI / 180;
  const dlambda = (lon2 - lon1) * Math.PI / 180;

  const a =
  Math.sin(dphi / 2) ** 2 +
  Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) ** 2;

  return R * 2 * Math.asin(Math.sqrt(a));
}