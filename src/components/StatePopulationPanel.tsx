import { useEffect, useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useMapFilter } from '@/context/MapFilterContext';
import { getUkraineOblastLabelByName } from '@/config/map';
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
  const isStateSelected = Boolean(filters.state);
  const selectedStateLabel = useMemo(
    () => getUkraineOblastLabelByName(filters.state) ?? filters.state,
    [filters.state]
  );
  const cityStatus = selectedCity?.status ?? 'idle';
  const isCityLoading = cityStatus === 'loading';
  const isCityError = cityStatus === 'error';
  const isCitySuccess = cityStatus === 'success';

  const renderCitySection = () => {
    if (!selectedCity) {
      return (
        <>
          <h3 className="text-xs uppercase tracking-wide text-base-content/60">Місто не обрано</h3>
          <p className="text-xs text-base-content/60 mt-1">
            Оберіть місто на карті, щоб переглянути короткий опис.
          </p>
        </>
      );
    }

    const nameLine = (
      <p className="text-sm text-base-content mt-1">
        {selectedCity.canonicalName && selectedCity.canonicalName !== selectedCity.name
          ? `${selectedCity.name} (${selectedCity.canonicalName})`
          : selectedCity.name}
      </p>
    );

    if (isCityLoading) {
      return (
        <>
          <h3 className="text-xs uppercase tracking-wide text-base-content/60">Інформація про місто</h3>
          {nameLine}
          <div className="space-y-2">
            <div className="skeleton h-3 w-full"></div>
            <div className="skeleton h-3 w-3/4"></div>
          </div>
        </>
      );
    }

    if (isCityError) {
      return (
        <>
          <h3 className="text-xs uppercase tracking-wide text-base-content/60">Інформація про місто</h3>
          {nameLine}
          <span className="text-xs text-error">
            Не вдалося отримати інформацію про це місто
          </span>
        </>
      );
    }

    const description = selectedCity.summary ? (
      <p className="text-xs text-base-content leading-snug">{selectedCity.summary}</p>
    ) : (
      <span className="text-xs text-base-content/60">Опис для цього міста відсутній.</span>
    );

    return (
      <>
        <h3 className="text-xs uppercase tracking-wide text-base-content/60">Інформація про місто</h3>
        {nameLine}
        {description}
        {selectedCity.wikipediaUrl && (
          <a
            href={selectedCity.wikipediaUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary link link-hover"
          >
            Переглянути у Вікіпедії
          </a>
        )}
      </>
    );
  };

  return (
    <div className="absolute top-24 right-5 sm:right-10 z-10 pointer-events-none">
      <div className="w-64 max-w-[85vw] bg-base-100/90 backdrop-blur-sm px-4 py-3 rounded-md shadow-lg border border-base-300 pointer-events-auto">
        <h2 className="text-xs uppercase tracking-wide text-base-content/60">
          Населення країни
        </h2>
        <p className="text-sm text-base-content mt-1">{filters.country}</p>
        <p className="text-xs text-base-content/60 mt-2">
          {isStateSelected ? `Обрана область: ${selectedStateLabel}` : 'Область не обрана'}
        </p>
        {!isLoading && !isError && availableYears.length > 0 && (
          <label className="mt-3 flex flex-col gap-1 text-xs text-base-content/60">
            <span className="uppercase tracking-wide">Рік</span>
            <select
              value={selectedYear ?? availableYears[0]}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              className="select select-bordered select-sm text-sm text-base-content bg-base-100 border-base-300 focus:outline-none focus:ring-2 focus:ring-primary"
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
            <div className="w-full space-y-2">
              <div className="skeleton h-4 w-3/4"></div>
              <div className="skeleton h-6 w-1/2"></div>
            </div>
          ) : isError ? (
            <span className="text-xs text-error">
              Не вдалося завантажити дані про населення
            </span>
          ) : formattedPopulation ? (
            <span className="text-lg font-semibold text-base-content">
              {formattedPopulation}
            </span>
          ) : (
            <span className="text-xs text-base-content/60">
              Немає даних про населення
            </span>
          )}
        </div>
        <div className="mt-4 border-t border-base-300 pt-3 flex flex-col gap-2">
          {renderCitySection()}
        </div>
      </div>
    </div>
  );
};

export default StatePopulationPanel;

