import { useState, useCallback } from 'react';

const TOKEN_KEY = 'tankear_token';
const API_BASE  = import.meta.env.VITE_API_BASE || '';

export interface GarageVehicle {
  id:             number;
  usuario_id:     string;
  marca:          string;
  modelo:         string;
  version?:       string | null;
  anio?:          number | null;
  combustible?:   string | null;
  litros_tanque?: number | null;
  consumo_ciudad?:number | null;
  consumo_mixto?: number | null;
  consumo_ruta?:  number | null;
  es_principal:   boolean;
  origen:         'registro' | 'usuario';
  estado:         'activo' | 'eliminado';
  created_at:     string;
  updated_at:     string;
  // Km y mantenimiento
  km_actual?:           number | null;
  km_ultimo_aceite?:    number | null;
  fecha_ultimo_aceite?: string | null;
  intervalo_aceite_km?: number | null;
  vencimiento_vtv?:     string | null;
  // Seguro
  vencimiento_seguro?:  string | null;
  costo_seguro?:        number | null;
  aseguradora?:         string | null;
  cobertura_seguro?:    string | null;
}

export interface GarageVehicleIn {
  marca:          string;
  modelo:         string;
  version?:       string;
  anio?:          number;
  combustible?:   string;
  litros_tanque?: number;
  consumo_ciudad?:number;
  consumo_mixto?: number;
  consumo_ruta?:  number;
  es_principal?:  boolean;
  // Km y mantenimiento
  km_actual?:           number;
  km_ultimo_aceite?:    number;
  fecha_ultimo_aceite?: string;
  intervalo_aceite_km?: number;
  vencimiento_vtv?:     string;
  // Seguro
  vencimiento_seguro?:  string;
  costo_seguro?:        number;
  aseguradora?:         string;
  cobertura_seguro?:    string;
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const t = getToken();
  return t
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }
    : { 'Content-Type': 'application/json' };
}

export function useGarage() {
  const [vehicles, setVehicles] = useState<GarageVehicle[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const loadVehicles = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/garage`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Error al cargar el garage');
      const json = await res.json();
      setVehicles(json.vehiculos ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  const addVehicle = useCallback(async (vehiculo: GarageVehicleIn): Promise<{ ok: boolean; error?: string }> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/garage`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(vehiculo),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, error: err.detail || 'No se pudo agregar el vehículo' };
      }
      const nuevo: GarageVehicle = await res.json();
      setVehicles(prev => {
        const base = nuevo.es_principal
          ? prev.map(v => ({ ...v, es_principal: false }))
          : prev;
        return [...base, nuevo];
      });
      return { ok: true };
    } catch {
      return { ok: false, error: 'Sin conexión, reintentá' };
    } finally {
      setLoading(false);
    }
  }, []);

  const editVehicle = useCallback(async (id: number, vehiculo: GarageVehicleIn): Promise<{ ok: boolean; error?: string }> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/garage/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(vehiculo),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, error: err.detail || 'No se pudo guardar los cambios' };
      }
      const updated: GarageVehicle = await res.json();
      setVehicles(prev => {
        const base = updated.es_principal
          ? prev.map(v => ({ ...v, es_principal: v.id === id ? true : false }))
          : prev;
        return base.map(v => v.id === id ? updated : v);
      });
      return { ok: true };
    } catch {
      return { ok: false, error: 'Sin conexión, reintentá' };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteVehicle = useCallback(async (id: number): Promise<{ ok: boolean; error?: string }> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/garage/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, error: err.detail || 'No se pudo eliminar el vehículo' };
      }
      setVehicles(prev => prev.filter(v => v.id !== id));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Sin conexión, reintentá' };
    } finally {
      setLoading(false);
    }
  }, []);

  const setPrincipal = useCallback(async (id: number): Promise<{ ok: boolean }> => {
    try {
      const res = await fetch(`${API_BASE}/garage/${id}/principal`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) return { ok: false };
      setVehicles(prev => prev.map(v => ({ ...v, es_principal: v.id === id })));
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }, []);

  /** Vehículo principal del garage (o primero activo) */
  const principalVehicle = vehicles.find(v => v.es_principal) ?? vehicles[0] ?? null;

  return {
    vehicles,
    loading,
    error,
    principalVehicle,
    loadVehicles,
    addVehicle,
    editVehicle,
    deleteVehicle,
    setPrincipal,
  };
}
