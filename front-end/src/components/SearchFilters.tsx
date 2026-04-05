import React, { useEffect, useState } from 'react';
import { FilterState, Station } from '../types';
import { fetchProvincias, fetchLocalidades } from '../utils/api';
import {
  SearchIcon,
  FilterIcon,
  MapPinIcon,
  XIcon,
  CalendarIcon,
  LoaderIcon } from
'lucide-react';
// Fallback lists if API endpoints aren't ready yet
const FALLBACK_PROVINCIAS = [
'BUENOS AIRES',
'CABA',
'CATAMARCA',
'CHACO',
'CHUBUT',
'CORDOBA',
'CORRIENTES',
'ENTRE RIOS',
'FORMOSA',
'JUJUY',
'LA PAMPA',
'LA RIOJA',
'MENDOZA',
'MISIONES',
'NEUQUEN',
'RIO NEGRO',
'SALTA',
'SAN JUAN',
'SAN LUIS',
'SANTA CRUZ',
'SANTA FE',
'SANTIAGO DEL ESTERO',
'TIERRA DEL FUEGO',
'TUCUMAN'];

const PRODUCTOS = [
'Nafta (súper) entre 92 y 95 Ron',
'Nafta de más de 95 Ron',
'Gasoil grado 2',
'Gasoil grado 3',
'GNC',
'Infinia',
'Infinia Diesel'];

const BARRIOS_CABA = [
  'Agronomía','Almagro','Balvanera','Barracas','Belgrano','Boedo','Caballito',
  'Chacarita','Coghlan','Colegiales','Constitución','Flores','Floresta',
  'La Boca','La Paternal','Liniers','Mataderos','Monte Castro','Montserrat',
  'Nueva Pompeya','Núñez','Palermo','Parque Avellaneda','Parque Chacabuco',
  'Parque Chas','Parque Patricios','Puerto Madero','Recoleta','Retiro',
  'Saavedra','San Cristóbal','San Nicolás','San Telmo','Vélez Sársfield',
  'Versalles','Villa Crespo','Villa del Parque','Villa Devoto','Villa General Mitre',
  'Villa Lugano','Villa Luro','Villa Ortúzar','Villa Pueyrredón','Villa Real',
  'Villa Riachuelo','Villa Santa Rita','Villa Soldati','Villa Urquiza',
];

const EMPRESAS_COMUNES = [
'YPF',
'Shell',
'Axion Energy',
'Puma Energy',
'Gulf',
'ACA',
'Petrobras',
'Oil Combustibles',
'Refinor',
'Dapsa'];

const DATE_PRESETS = [
{
  label: 'Última semana',
  days: 7
},
{
  label: 'Último mes',
  days: 30
},
{
  label: '3 meses',
  days: 90
},
{
  label: '1 año',
  days: 365
},
{
  label: 'Todo',
  days: 0
}];

function daysAgoISO(days: number): string {
  if (days === 0) return '';
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}
interface SearchFiltersProps {
  filters: FilterState;
  onSearch: (filters: FilterState) => void;
  availableData: Station[];
  loading: boolean;
}
export function SearchFilters({
  filters,
  onSearch,
  availableData,
  loading
}: SearchFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [datePreset, setDatePreset] = useState(1);
  // Sync localFilters ONLY when parent auto-fills from ubicacion (non-empty values from backend)
  // Don't use `|| prev.X` fallback — that prevented clearing filters
  useEffect(() => {
    if (!filters.provincia) return; // don't override user clearing the province
    setLocalFilters((prev) => ({
      ...prev,
      provincia: filters.provincia,
      localidad: filters.localidad || prev.localidad,
    }));
  }, [filters.provincia, filters.localidad]);
  // Dynamic province/localidad lists from API
  const [provincias, setProvincias] = useState<string[]>(FALLBACK_PROVINCIAS);
  const [localidades, setLocalidades] = useState<string[]>([]);
  const [loadingLocalidades, setLoadingLocalidades] = useState(false);
  // Fetch provinces on mount
  useEffect(() => {
    fetchProvincias().then((list) => {
      if (list.length > 0) {
        setProvincias(list.sort());
      }
    });
  }, []);
  // Fetch localidades when province changes
  useEffect(() => {
    if (!localFilters.provincia) {
      setLocalidades([]);
      return;
    }
    setLoadingLocalidades(true);
    fetchLocalidades(localFilters.provincia).then((list) => {
      setLocalidades(list.sort());
      setLoadingLocalidades(false);
    });
  }, [localFilters.provincia]);
  // Merge empresas from loaded data with defaults
  const empresasFromData = Array.from(
    new Set(availableData.map((d) => d.empresa))
  ).filter(Boolean);
  const allEmpresas = Array.from(
    new Set([...EMPRESAS_COMUNES, ...empresasFromData])
  ).sort();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[SearchFilters] Submitting with localFilters:', localFilters);
    onSearch(localFilters);
  };
  const handleProvinciaChange = (provincia: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      provincia,
      localidad: '',
      barrio: ''
    }));
  };
  const handleDatePreset = (presetIdx: number) => {
    setDatePreset(presetIdx);
    const fecha_desde = daysAgoISO(DATE_PRESETS[presetIdx].days);
    setLocalFilters((prev) => ({
      ...prev,
      fecha_desde
    }));
  };
  const handleClearFilters = () => {
    const cleared: FilterState = {
      provincia: '',
      localidad: '',
      barrio: '',
      empresa: '',
      producto: '',
      fecha_desde: daysAgoISO(30)
    };
    setLocalFilters(cleared);
    setDatePreset(1);
    console.log('[SearchFilters] Clearing filters - will use GPS');
    onSearch(cleared);
  };
  const hasActiveFilters =
  localFilters.provincia ||
  localFilters.localidad ||
  localFilters.barrio ||
  localFilters.empresa ||
  localFilters.producto;
  const selectClass =
  'w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors';
  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FilterIcon className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-slate-100">
            Filtros de Búsqueda
          </h2>
        </div>
        {hasActiveFilters &&
        <button
          type="button"
          onClick={handleClearFilters}
          className="text-xs text-slate-400 hover:text-amber-500 flex items-center gap-1 transition-colors">
          
            <XIcon className="w-3 h-3" />
            Limpiar
          </button>
        }
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Vigencia */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-slate-500" />
            Vigencia
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DATE_PRESETS.map((preset, idx) =>
            <button
              key={idx}
              type="button"
              onClick={() => handleDatePreset(idx)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${datePreset === idx ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'text-slate-400 bg-slate-800/50 border border-slate-700/50 hover:text-slate-200'}`}>
              
                {preset.label}
              </button>
            )}
          </div>
          {localFilters.fecha_desde &&
          <p className="text-xs text-slate-500 mt-1">
              Desde:{' '}
              {new Date(
              localFilters.fecha_desde + 'T00:00:00'
            ).toLocaleDateString('es-AR')}
            </p>
          }
        </div>

        {/* Provincia */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
            <MapPinIcon className="w-4 h-4 text-slate-500" />
            Provincia
          </label>
          <select
            value={localFilters.provincia}
            onChange={(e) => handleProvinciaChange(e.target.value)}
            className={selectClass}>
            
            <option value="">Todas las provincias</option>
            {provincias.map((p) =>
            <option key={p} value={p}>
                {p}
              </option>
            )}
          </select>
        </div>

        {/* Localidad — dynamic dropdown from API */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
            Localidad
            {loadingLocalidades &&
            <LoaderIcon className="w-3 h-3 text-amber-500 animate-spin" />
            }
          </label>
          {localidades.length > 0 ?
          <select
            value={localFilters.localidad}
            onChange={(e) => {
              const newFilters = { ...localFilters, localidad: e.target.value, barrio: '' };
              setLocalFilters(newFilters);
              if (e.target.value && !loading) onSearch(newFilters);
            }}
            className={selectClass}>
            
              <option value="">Todas las localidades</option>
              {localidades.map((l) =>
            <option key={l} value={l}>
                  {l}
                </option>
            )}
            </select> :

          <input
            type="text"
            value={localFilters.localidad}
            onChange={(e) =>
            setLocalFilters({
              ...localFilters,
              localidad: e.target.value.toUpperCase()
            })
            }
            placeholder={
            localFilters.provincia ?
            'Cargando localidades...' :
            'Elegí una provincia primero'
            }
            className={`${selectClass} placeholder:text-slate-500`} />

          }
        </div>

        {/* Barrio — solo CABA */}
        {(() => {
          const provUp = (localFilters.provincia || '').toUpperCase();
          const isCaba = provUp.includes('CABA') || provUp.includes('CAPITAL');
          const hasOtherProv = localFilters.provincia && !isCaba;
          return (
            <div className="space-y-1.5">
              <label className={`text-sm font-medium flex items-center gap-1.5 ${hasOtherProv ? 'text-slate-600' : 'text-slate-300'}`}>
                Barrio
                {isCaba && <span className="text-xs text-amber-500 font-normal">requerido en CABA</span>}
                {hasOtherProv && <span className="text-xs text-slate-600 font-normal">solo para CABA</span>}
              </label>
              {isCaba ? (
                <select
                  value={localFilters.barrio}
                  onChange={(e) => {
                    const newFilters = { ...localFilters, barrio: e.target.value };
                    setLocalFilters(newFilters);
                    if (e.target.value && !loading) onSearch(newFilters);
                  }}
                  className={selectClass}
                >
                  <option value="">Todos los barrios</option>
                  {BARRIOS_CABA.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  disabled
                  value=""
                  placeholder="Solo disponible para CABA"
                  className={`${selectClass} opacity-30 cursor-not-allowed placeholder:text-slate-600`}
                />
              )}
            </div>
          );
        })()}

        {/* Empresa */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">Empresa</label>
          <select
            value={localFilters.empresa}
            onChange={(e) =>
            setLocalFilters({
              ...localFilters,
              empresa: e.target.value
            })
            }
            className={selectClass}>
            
            <option value="">Todas las empresas</option>
            {allEmpresas.map((e) =>
            <option key={e} value={e}>
                {e}
              </option>
            )}
          </select>
        </div>

        {/* Producto */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">Producto</label>
          <select
            value={localFilters.producto}
            onChange={(e) =>
            setLocalFilters({
              ...localFilters,
              producto: e.target.value
            })
            }
            className={selectClass}>
            
            <option value="">Todos los productos</option>
            {PRODUCTOS.map((p) =>
            <option key={p} value={p}>
                {p}
              </option>
            )}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          
          {loading ?
          <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div> :

          <SearchIcon className="w-5 h-5" />
          }
          {loading ? 'Buscando...' : 'Buscar Estaciones'}
        </button>
      </form>
    </div>);

}