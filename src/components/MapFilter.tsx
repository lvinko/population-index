import { ChangeEvent, useEffect, useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useMapFilter } from '@/context/MapFilterContext';
import { fetchCountryStates } from '@/queries';
import { Spinner } from '@/components';

type SelectOption<TValue> = {
  value: TValue;
  label: string;
};

const COUNTRY = 'Ukraine';

const MapFilter = () => {
  const { filters, setFilters } = useMapFilter();

  const { data: statesResponse, isLoading, isFetching } = useQuery({
    queryKey: ['ukraine-states'],
    queryFn: () => fetchCountryStates(COUNTRY),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 48,
  });

  const stateOptions = useMemo<SelectOption<string>[]>(() => {
    const states = statesResponse?.data.states ?? [];
    return states.map((state) => ({
      value: state.name,
      label: state.name,
    }));
  }, [statesResponse]);

  useEffect(() => {
    if (filters.country !== COUNTRY) {
      setFilters((prev) => ({
        ...prev,
        country: COUNTRY,
      }));
    }
  }, [filters.country, setFilters]);

  useEffect(() => {
    if (stateOptions.length === 0) {
      setFilters((prev) => ({
        ...prev,
        state: '',
      }));
      return;
    }

    const hasSelectedState = stateOptions.some(
      (option) => option.value === filters.state
    );

    if (!hasSelectedState) {
      setFilters((prev) => ({
        ...prev,
        state: stateOptions[0]?.value ?? '',
      }));
    }
  }, [filters.state, setFilters, stateOptions]);

  const handleStateChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextState = event.target.value;
    setFilters((prev) => ({
      ...prev,
      state: nextState,
    }));
  };

  return (
    <div className="flex flex-wrap gap-4 items-center absolute bottom-32 sm:right-10 right-5 z-10 text-zinc-900 bg-white p-3 rounded-md shadow">
      <div className="flex flex-col text-sm font-medium">
        <span className="text-xs uppercase text-zinc-500">Країна</span>
        <span className="mt-1 px-4 py-2 border rounded-md bg-zinc-100 text-zinc-600">
          {COUNTRY}
        </span>
      </div>

      <label className="flex flex-col text-sm font-medium">
        Область
        <select
          value={filters.state}
          onChange={handleStateChange}
          className="mt-1 px-4 py-2 border rounded-md"
          disabled={isLoading || stateOptions.length === 0}
        >
          {stateOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {(isLoading || isFetching) && (
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Spinner size="sm" />
          <span>Оновлення списку областей…</span>
        </div>
      )}
    </div>
  );
};

export default MapFilter;