import { createContext, useContext, useState, ReactNode } from 'react';

export type Filters = {
  year: number;
  type: string;
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
  // NOTE: default values
  const [filters, setFilters] = useState<Filters>({
    year: 2022,
    type: 'total',
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
