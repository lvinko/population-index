import { useMemo } from 'react';

import { useMapFilter } from '@/context/MapFilterContext';
import { Spinner } from '@/components';

const formatPopulation = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  return value.toLocaleString('uk-UA');
};

const StatePopulationPanel = () => {
  const { filters } = useMapFilter();

  const formattedPopulation = useMemo(
    () => formatPopulation(filters.statePopulation),
    [filters.statePopulation]
  );

  if (!filters.state) {
    return null;
  }

  return (
    <div className="absolute top-24 right-5 sm:right-10 z-10 pointer-events-none">
      <div className="w-64 max-w-[85vw] bg-white/90 px-4 py-3 rounded-md shadow pointer-events-auto">
        <h2 className="text-xs uppercase tracking-wide text-zinc-500">
          Населення області
        </h2>
        <p className="text-sm text-zinc-600 mt-1">{filters.state}</p>
        <div className="mt-3 min-h-[32px] flex items-center">
          {filters.statePopulation === null ? (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Spinner size="sm" />
              <span>Розрахунок населення області…</span>
            </div>
          ) : formattedPopulation ? (
            <span className="text-lg font-semibold text-zinc-900">
              {formattedPopulation}
            </span>
          ) : (
            <span className="text-xs text-zinc-500">
              Немає даних про населення
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatePopulationPanel;

