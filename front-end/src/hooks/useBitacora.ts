import { useState, useCallback } from 'react';
import { useUser } from './useUser';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export interface BitacoraEntry {
  id: number;
  usuario_id: string;
  vehiculo_id?: number | null;
  origen: string;
  destino: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  km_recorridos?: number | null;
  litros_cargados?: number | null;
  precio_litro?: number | null;
  costo_total?: number | null;
  tiempo_min?: number | null;
  clima_origen?: string | null;
  notas?: string | null;
  created_at: string;
}

export type BitacoraInput = Omit<BitacoraEntry, 'id' | 'usuario_id' | 'created_at'>;

export function useBitacora() {
  const { token } = useUser();
  const [entries, setEntries] = useState<BitacoraEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = useCallback((): HeadersInit => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const loadEntries = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/bitacora`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Error al cargar bitácora');
      const data = await res.json();
      setEntries(data.entradas || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  const addEntry = useCallback(async (input: BitacoraInput): Promise<BitacoraEntry | null> => {
    if (!token) return null;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bitacora`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Error al guardar');
      }
      const entry: BitacoraEntry = await res.json();
      setEntries(prev => [entry, ...prev]);
      return entry;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  const editEntry = useCallback(async (id: number, input: BitacoraInput): Promise<BitacoraEntry | null> => {
    if (!token) return null;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bitacora/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Error al actualizar');
      const updated: BitacoraEntry = await res.json();
      setEntries(prev => prev.map(e => e.id === id ? updated : e));
      return updated;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  const deleteEntry = useCallback(async (id: number): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/bitacora/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) return false;
      setEntries(prev => prev.filter(e => e.id !== id));
      return true;
    } catch {
      return false;
    }
  }, [token, authHeaders]);

  return { entries, loading, error, loadEntries, addEntry, editEntry, deleteEntry };
}
