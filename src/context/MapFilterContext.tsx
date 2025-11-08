'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type Filters = {
  country: string;
  countryIso3: string;
  state: string;
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
