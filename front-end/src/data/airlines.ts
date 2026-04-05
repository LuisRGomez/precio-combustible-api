export interface Airline {
  icao:     string;  // ICAO 3-letter code (usado en callsign)
  iata:     string;
  nombre:   string;
  callsign: string;  // Radio callsign prefix
  color:    string;
}

// Prefijos de callsign — el callsign de OpenSky empieza con estos caracteres
export const AEROLINEAS_AR: Airline[] = [
  { icao: 'ARG', iata: 'AR', nombre: 'Aerolíneas Argentinas', callsign: 'ARG', color: '#00b0ff' },
  { icao: 'LAN', iata: 'LA', nombre: 'LATAM Argentina',       callsign: 'LAN', color: '#e40046' },
  { icao: 'FBZ', iata: 'FO', nombre: 'Flybondi',             callsign: 'FBZ', color: '#ff6600' },
  { icao: 'JSM', iata: 'JA', nombre: 'JetSmart',             callsign: 'JSM', color: '#ffcc00' },
  { icao: 'DAL', iata: 'DL', nombre: 'Delta Air Lines',       callsign: 'DAL', color: '#e21836' },
  { icao: 'AAL', iata: 'AA', nombre: 'American Airlines',     callsign: 'AAL', color: '#0078d2' },
  { icao: 'UAL', iata: 'UA', nombre: 'United Airlines',       callsign: 'UAL', color: '#003580' },
  { icao: 'IBE', iata: 'IB', nombre: 'Iberia',               callsign: 'IBE', color: '#c60b1e' },
  { icao: 'AFR', iata: 'AF', nombre: 'Air France',           callsign: 'AFR', color: '#002157' },
  { icao: 'DLH', iata: 'LH', nombre: 'Lufthansa',            callsign: 'DLH', color: '#05164d' },
];

export function getAirline(callsign: string): Airline | null {
  if (!callsign) return null;
  const cs = callsign.trim().toUpperCase();
  return AEROLINEAS_AR.find(a => cs.startsWith(a.callsign)) ?? null;
}
