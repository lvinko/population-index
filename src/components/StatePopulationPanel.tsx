import { useEffect, useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useMapFilter, normalizeCityKey } from '@/context/MapFilterContext';
import { Spinner } from '@/components';
import { fetchCountryPopulation } from '@/queries';

const formatPopulation = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  return value.toLocaleString('uk-UA');
};

const StatePopulationPanel = () => {
  const { filters } = useMapFilter();

  const {
    data: populationResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['country-population', filters.countryIso3],
    queryFn: () => fetchCountryPopulation(filters.countryIso3),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 48,
  });

  const populationCounts = populationResponse?.data.populationCounts ?? [];
  const availableYears = useMemo(
    () =>
      populationCounts
        .map((entry) => Number(entry.year))
        .filter((year) => Number.isFinite(year))
        .sort((a, b) => b - a),
    [populationCounts]
  );

  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    if (availableYears.length === 0) {
      setSelectedYear(null);
      return;
    }

    setSelectedYear((prev) =>
      prev && availableYears.includes(prev) ? prev : availableYears[0]
    );
  }, [availableYears]);

  const selectedPopulation = useMemo(() => {
    if (selectedYear == null) {
      return null;
    }

    const record = populationCounts.find(
      (entry) => Number(entry.year) === selectedYear
    );

    if (!record || !Number.isFinite(record.value)) {
      return null;
    }

    return Number(record.value);
  }, [populationCounts, selectedYear]);

  const formattedPopulation = useMemo(
    () => formatPopulation(selectedPopulation),
    [selectedPopulation]
  );

  const selectedCity = filters.selectedCity;
  const selectedCityEntry = useMemo(() => {
    if (!selectedCity) {
      return null;
    }
    const catalog = filters.cityPopulationCatalog;
    const directMatch = catalog[normalizeCityKey(selectedCity.name)];
    if (directMatch) {
      return directMatch;
    }

    if (selectedCity.canonicalName) {
      return catalog[normalizeCityKey(selectedCity.canonicalName)] ?? null;
    }

    return null;
  }, [filters.cityPopulationCatalog, selectedCity]);

  const cityPopulationForYear = useMemo(() => {
    if (!selectedCityEntry) {
      return null;
    }
    if (selectedYear == null) {
      const latest = [...selectedCityEntry.populationCounts].sort(
        (a, b) => Number(b.year) - Number(a.year)
      )[0];
      if (!latest || !Number.isFinite(latest.value)) {
        return null;
      }
      return {
        value: Number(latest.value),
        year: Number(latest.year),
      };
    }

    const matching = selectedCityEntry.populationCounts.find(
      (entry) => Number(entry.year) === selectedYear
    );

    if (!matching || !Number.isFinite(matching.value)) {
      return null;
    }

    return {
      value: Number(matching.value),
      year: Number(matching.year),
    };
  }, [selectedCityEntry, selectedYear]);

  const formattedCityPopulation = useMemo(
    () => (cityPopulationForYear ? formatPopulation(cityPopulationForYear.value) : null),
    [cityPopulationForYear]
  );

  const isStateSelected = Boolean(filters.state);

  return (
    <div className="absolute top-24 right-5 sm:right-10 z-10 pointer-events-none">
      <div className="w-64 max-w-[85vw] bg-white/90 px-4 py-3 rounded-md shadow pointer-events-auto">
        <h2 className="text-xs uppercase tracking-wide text-zinc-500">
          Населення країни
        </h2>
        <p className="text-sm text-zinc-600 mt-1">{filters.country}</p>
        <p className="text-xs text-zinc-500 mt-2">
          {isStateSelected ? `Обрана область: ${filters.state}` : 'Область не обрана'}
        </p>
        {!isLoading && !isError && availableYears.length > 0 && (
          <label className="mt-3 flex flex-col gap-1 text-xs text-zinc-500">
            <span className="uppercase tracking-wide">Рік</span>
            <select
              value={selectedYear ?? availableYears[0]}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              className="text-sm text-zinc-700 px-3 py-1.5 border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="mt-3 min-h-[32px] flex items-center">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Spinner size="sm" />
              <span>Завантаження статистики населення…</span>
            </div>
          ) : isError ? (
            <span className="text-xs text-red-500">
              Не вдалося завантажити дані про населення
            </span>
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
        <div className="mt-4 border-t border-zinc-200 pt-3">
          <h3 className="text-xs uppercase tracking-wide text-zinc-500">
            {selectedCity ? 'Населення міста' : 'Місто не обрано'}
          </h3>
          {selectedCity ? (
            <>
              <p className="text-sm text-zinc-600 mt-1">{selectedCity.name}</p>
              <div className="mt-2 min-h-[32px] flex flex-col">
                {selectedCity.error ? (
                  <span className="text-xs text-red-500">
                    Не вдалося отримати дані про населення
                  </span>
                ) : formattedCityPopulation ? (
                  <span className="text-lg font-semibold text-zinc-900">
                    {formattedCityPopulation}
                    {cityPopulationForYear?.year ? (
                      <span className="text-xs text-zinc-500 ml-1">
                        ({cityPopulationForYear.year})
                      </span>
                    ) : null}
                  </span>
                ) : selectedCityEntry ? (
                  <span className="text-xs text-zinc-500">
                    Немає даних про населення для обраного року
                  </span>
                ) : (
                  <span className="text-xs text-zinc-500">
                    Немає даних про населення для цього міста
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-zinc-500 mt-1">
              Оберіть місто на карті, щоб переглянути його населення.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatePopulationPanel;

