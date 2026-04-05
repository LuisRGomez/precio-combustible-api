import { useState, useCallback } from 'react';
import { useUser } from './useUser';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export type TipoMantenimiento = 'aceite' | 'vtv' | 'frenos' | 'cubiertas' | 'filtro' | 'patente' | 'otro';

export interface MantenimientoEntry {
  id: number;
  usuario_id: string;
  vehiculo_id: number;
  tipo: TipoMantenimiento;
  fecha: string;
  km_vehiculo?: number | null;
  km_proximo?: number | null;
  fecha_proxima?: string | null;
  costo?: number | null;
  taller_nombre?: string | null;
  taller_localidad?: string | null;
  taller_provincia?: string | null;
  taller_telefono?: string | null;
  notas?: string | null;
  created_at: string;
}

export type MantenimientoInput = Omit<MantenimientoEntry, 'id' | 'usuario_id' | 'created_at'>;

export interface AlertaVehiculo {
  tipo: 'aceite' | 'vtv' | 'seguro';
  vehiculo_id: number;
  vehiculo: string;
  urgencia: 'pronto' | 'urgente';
  km_desde_ultimo?: number;
  km_faltantes?: number;
  intervalo?: number;
  dias_restantes?: number;
  vencimiento?: string;
  aseguradora?: string;
}

export function useMantenimiento() {
  const { token } = useUser();
  const [registros, setRegistros] = useState<MantenimientoEntry[]>([]);
  const [alertas, setAlertas] = useState<AlertaVehiculo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = useCallback((): HeadersInit => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const loadRegistros = useCallback(async (vehiculoId?: number) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const url = vehiculoId
        ? `${API_BASE}/mantenimiento?vehiculo_id=${vehiculoId}`
        : `${API_BASE}/mantenimiento`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error('Error al cargar mantenimiento');
      const data = await res.json();
      setRegistros(data.registros || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  const loadAlertas = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/garage/alertas`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setAlertas(data.alertas || []);
    } catch {
      // silencioso — no bloquear UI
    }
  }, [token, authHeaders]);

  const addRegistro = useCallback(async (input: MantenimientoInput): Promise<MantenimientoEntry | null> => {
    if (!token) return null;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/mantenimiento`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Error al guardar');
      }
      const entry: MantenimientoEntry = await res.json();
      setRegistros(prev => [entry, ...prev]);
      await loadAlertas(); // refresh alertas after new maintenance
      return entry;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders, loadAlertas]);

  const editRegistro = useCallback(async (id: number, input: MantenimientoInput): Promise<MantenimientoEntry | null> => {
    if (!token) return null;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/mantenimiento/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Error al actualizar');
      const updated: MantenimientoEntry = await res.json();
      setRegistros(prev => prev.map(r => r.id === id ? updated : r));
      return updated;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  const deleteRegistro = useCallback(async (id: number): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/mantenimiento/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) return false;
      setRegistros(prev => prev.filter(r => r.id !== id));
      return true;
    } catch {
      return false;
    }
  }, [token, authHeaders]);

  return { registros, alertas, loading, error, loadRegistros, loadAlertas, addRegistro, editRegistro, deleteRegistro };
}
