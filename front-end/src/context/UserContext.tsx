import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

const TOKEN_KEY = 'tankear_token';
const USER_KEY  = 'tankear_user';
const API_BASE  = import.meta.env.VITE_API_BASE || '';

export interface UserProfile {
  id: string;
  mail?: string | null;
  celular?: string | null;
  provincia?: string | null;
  localidad?: string | null;
  auto_marca?: string | null;
  auto_modelo?: string | null;
  auto_anio?: number | null;
  combustible_preferido?: string | null;
  preferencias?: string[];
}

export interface RegisterData {
  mail: string;
  password: string;
  captcha_token: string;
  celular?: string;
  provincia?: string;
  localidad?: string;
  auto_marca?: string;
  auto_modelo?: string;
  auto_anio?: number;
  combustible_preferido?: string;
  preferencias?: string[];
}

export type RegisterResult =
  | { ok: true; pendingVerification: false }
  | { ok: true; pendingVerification: true; mail: string }
  | { ok: false; error: string };

function readCached(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface UserContextValue {
  user:          UserProfile | null;
  token:         string | null;
  loading:       boolean;
  login:         (data: { mail: string; password: string }) => Promise<{ ok: boolean; error?: string }>;
  logout:        () => void;
  register:      (data: RegisterData) => Promise<RegisterResult>;
  updateProfile: (data: Partial<RegisterData>) => Promise<{ ok: boolean }>;
  getUserInitials: () => string;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<UserProfile | null>(readCached);
  const [token,   setToken]   = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(false);

  const _saveSession = useCallback((tok: string, profile: UserProfile) => {
    localStorage.setItem(TOKEN_KEY, tok);
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
    setToken(tok);
    setUser(profile);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<RegisterResult> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/usuarios/registro`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, error: err.detail || 'Error al registrarse' };
      }
      const json = await res.json();
      if (json.pendiente_verificacion) {
        return { ok: true, pendingVerification: true, mail: json.mail || data.mail };
      }
      if (json.token && json.usuario) {
        _saveSession(json.token, json.usuario);
      }
      return { ok: true, pendingVerification: false };
    } catch {
      return { ok: false, error: 'Sin conexión, reintentá' };
    } finally {
      setLoading(false);
    }
  }, [_saveSession]);

  const login = useCallback(async (data: { mail: string; password: string }): Promise<{ ok: boolean; error?: string }> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/usuarios/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, error: err.detail || 'Email o contraseña incorrectos' };
      }
      const { token: tok, usuario } = await res.json();
      _saveSession(tok, usuario);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Sin conexión, reintentá' };
    } finally {
      setLoading(false);
    }
  }, [_saveSession]);

  const updateProfile = useCallback(async (data: Partial<RegisterData>): Promise<{ ok: boolean }> => {
    if (!token) return { ok: false };
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/usuarios/perfil`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(data),
      });
      if (!res.ok) return { ok: false };
      const updated: UserProfile = await res.json();
      const merged = { ...user, ...updated };
      localStorage.setItem(USER_KEY, JSON.stringify(merged));
      setUser(merged);
      return { ok: true };
    } catch {
      return { ok: false };
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  const getUserInitials = useCallback((): string => {
    if (!user) return '';
    if (user.mail) return user.mail.slice(0, 2).toUpperCase();
    if (user.celular) return user.celular.slice(-2);
    return '??';
  }, [user]);

  return (
    <UserContext.Provider value={{ user, token, loading, login, logout, register, updateProfile, getUserInitials }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUserContext must be used within UserProvider');
  return ctx;
}
