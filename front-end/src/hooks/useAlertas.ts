import { useState, useEffect, useCallback } from 'react';
import { useUser } from './useUser';
import type { AlertaVehiculo } from './useMantenimiento';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export function useAlertas() {
  const { token, user } = useUser();
  const [alertas, setAlertas] = useState<AlertaVehiculo[]>([]);
  const [totalAlertas, setTotalAlertas] = useState(0);

  const fetchAlertas = useCallback(async () => {
    if (!token) { setAlertas([]); setTotalAlertas(0); return; }
    try {
      const res = await fetch(`${API_BASE}/garage/alertas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const list: AlertaVehiculo[] = data.alertas || [];
      setAlertas(list);
      setTotalAlertas(list.length);
    } catch {
      // silencioso
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      fetchAlertas();
    } else {
      setAlertas([]);
      setTotalAlertas(0);
    }
  }, [user, fetchAlertas]);

  return { alertas, totalAlertas, fetchAlertas };
}
