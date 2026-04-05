import { useEffect, useState } from 'react';

let _ip: string | null = null;

async function fetchIP(): Promise<string | null> {
  // Intentamos 3 servicios en orden, el primero que responda gana
  const services = [
    { url: 'https://api.ipify.org?format=json', parse: (j: any) => j.ip },
    { url: 'https://api.my-ip.io/v2/ip.json',  parse: (j: any) => j.ip },
    { url: 'https://ip.seeip.org/json',         parse: (j: any) => j.ip },
  ];
  for (const svc of services) {
    try {
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      const r     = await fetch(svc.url, { signal: ctrl.signal });
      clearTimeout(timer);
      const j = await r.json();
      const ip = svc.parse(j);
      if (ip && typeof ip === 'string') return ip;
    } catch { /* siguiente */ }
  }
  return null;
}

export function useClientIP(): string | null {
  const [ip, setIp] = useState<string | null>(_ip);

  useEffect(() => {
    if (_ip) { setIp(_ip); return; }
    fetchIP().then(result => {
      if (result) { _ip = result; setIp(result); }
    });
  }, []);

  return ip;
}
