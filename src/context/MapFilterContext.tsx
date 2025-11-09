'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

import type { CityPopulationRecord } from '@/queries/countriesNow';

export type SelectedCity = {
  name: string;
  canonicalName?: string;
  error?: string;
};

export type CityPopulationCatalogEntry = {
  city: string;
  populationCounts: CityPopulationRecord[];
};

export type CityPopulationCatalog = Record<string, CityPopulationCatalogEntry>;

export const normalizeCityKey = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export type Filters = {
  country: string;
  countryIso3: string;
  state: string;
  selectedCity: SelectedCity | null;
  cityPopulationCatalog: CityPopulationCatalog;
};

type MapFilterContextType = {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
};

const MapFilterContext = createContext<MapFilterContextType | undefined>(undefined);

type MapFilterProviderProps = {
  children: ReactNode;
};

export function MapFilterProvider({ children }: MapFilterProviderProps) {
  const [filters, setFilters] = useState<Filters>({
    country: 'Ukraine',
    countryIso3: 'UKR',
    state: '',
    cityPopulationCatalog: {},
    selectedCity: null,
  });

  return (
    <MapFilterContext.Provider value={{ filters, setFilters }}>
      {children}
    </MapFilterContext.Provider>
  );
}

// Custom hook to use the FilterContext
export function useMapFilter() {
  const context = useContext(MapFilterContext);
  if (!context) {
    throw new Error('useMapFilter must be used within a MapFilterProvider');
  }
  return context;
}
