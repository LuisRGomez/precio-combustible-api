export interface Airport {
  icao:   string;
  iata:   string;
  nombre: string;
  ciudad: string;
  lat:    number;
  lon:    number;
}

export const AEROPUERTOS_AR: Airport[] = [
  { icao: 'SAEZ', iata: 'EZE', nombre: 'Ministro Pistarini',            ciudad: 'Buenos Aires',   lat: -34.8222, lon: -58.5358 },
  { icao: 'SABE', iata: 'AEP', nombre: 'Aeroparque Jorge Newbery',      ciudad: 'Buenos Aires',   lat: -34.5592, lon: -58.4156 },
  { icao: 'SACO', iata: 'COR', nombre: 'Ingeniero Taravella',           ciudad: 'Córdoba',        lat: -31.3123, lon: -64.2083 },
  { icao: 'SAME', iata: 'MDZ', nombre: 'El Plumerillo',                 ciudad: 'Mendoza',        lat: -32.8255, lon: -68.7899 },
  { icao: 'SASJ', iata: 'MDP', nombre: 'Astor Piazzolla',               ciudad: 'Mar del Plata',  lat: -37.9342, lon: -57.5733 },
  { icao: 'SANI', iata: 'NQN', nombre: 'Presidente Perón',              ciudad: 'Neuquén',        lat: -38.9476, lon: -68.2986 },
  { icao: 'SAZS', iata: 'BRC', nombre: 'Bariloche International',       ciudad: 'Bariloche',      lat: -41.1457, lon: -71.1613 },
  { icao: 'SAWH', iata: 'USH', nombre: 'Malvinas Argentinas',           ciudad: 'Ushuaia',        lat: -54.8426, lon: -68.2938 },
  { icao: 'SAOR', iata: 'IGR', nombre: 'Cataratas del Iguazú',          ciudad: 'Puerto Iguazú',  lat: -25.7374, lon: -54.4734 },
  { icao: 'SAVT', iata: 'TUC', nombre: 'Benjamín Matienzo',             ciudad: 'Tucumán',        lat: -26.8409, lon: -65.1045 },
  { icao: 'SAVC', iata: 'CRD', nombre: 'General E. Mosconi',            ciudad: 'Comodoro',       lat: -45.7853, lon: -67.4655 },
  { icao: 'SAWG', iata: 'RGL', nombre: 'Piloto Civil N. Fernández',     ciudad: 'Río Gallegos',   lat: -51.6189, lon: -69.3126 },
  { icao: 'SASA', iata: 'SLA', nombre: 'Martín Miguel de Güemes',       ciudad: 'Salta',          lat: -24.8560, lon: -65.4862 },
  { icao: 'SARI', iata: 'ROS', nombre: 'Rosario Islas Malvinas',        ciudad: 'Rosario',        lat: -32.9036, lon: -60.7850 },
];
