'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useQuery } from '@tanstack/react-query';

import { config } from '@/config';
import {
  MAP_CENTER,
  MAP_INITIAL_ZOOM,
  MAP_STYLE,
  STATE_CITIES_LAYER_ID,
  UKRAINE_OBLAST_SOURCE_ID,
  attachCityInteractions,
  attachOblastInteractions,
  ensureOblastLayers,
  ensureStateCitiesLayer,
  updateStateCitiesLayer,
  type CityFeature,
  getUkraineOblastCodeByName,
} from '@/config/map';
import type { CleanupCallback } from '@/config/map';
import { useMapFilter, normalizeCityKey } from '@/context/MapFilterContext';
import type { Filters } from '@/context/MapFilterContext';
import { fetchCityCoordinates, fetchCountryCitiesPopulation, fetchStateCities } from '@/queries';
import type { CityPopulationRecord } from '@/queries/countriesNow';
import { Spinner } from '@/components';

const CITY_NAME_ALIASES: Record<string, string[]> = {
  kiev: ['kyiv', 'kyyiv'],
  odessa: ['odesa'],
  kharkov: ['kharkiv'],
  nikolaev: ['mykolaiv'],
  lugansk: ['luhansk'],
  zaporozhe: ['zaporizhzhia', 'zaporizhia'],
  zaporozhye: ['zaporizhzhia', 'zaporizhia'],
  dnipropetrovsk: ['dnipro'],
  dnepropetrovsk: ['dnipro'],
  kremenchug: ['kremenchuk'],
  rovno: ['rivne'],
  chernigov: ['chernihiv'],
  kirovograd: ['kropyvnytskyi'],
  'ivano-frankovsk': ['ivano-frankivsk'],
  uzhgorod: ['uzhhorod'],
  khmelnitskiy: ['khmelnytskyi', 'khmelnytskyy'],
  ternopol: ['ternopil'],
  chernovtsy: ['chernivtsi'],
};

const generateCityVariants = (value: string) => {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  const withoutParens = trimmed.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  const segments = withoutParens
    .split(/[,/]/)
    .map((part) => part.trim())
    .filter(Boolean);

  return [trimmed, withoutParens, ...segments];
};

const resolveCatalogEntry = (
  catalog: Filters['cityPopulationCatalog'],
  ...names: (string | undefined | null)[]
) => {
  for (const name of names) {
    if (!name) {
      continue;
    }

    for (const variant of generateCityVariants(name)) {
      const normalized = normalizeCityKey(variant);
      if (!normalized) {
        continue;
      }

      const directMatch = catalog[normalized];
      if (directMatch) {
        return directMatch;
      }

      const aliasList = CITY_NAME_ALIASES[normalized];
      if (aliasList) {
        for (const alias of aliasList) {
          const aliasNormalized = normalizeCityKey(alias);
          if (aliasNormalized && catalog[aliasNormalized]) {
            return catalog[aliasNormalized];
          }
        }
      }
    }
  }

  return null;
};

const Map = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const majorCitiesCleanupRef = useRef<CleanupCallback | null>(null);
  const oblastInteractionsCleanupRef = useRef<CleanupCallback | null>(null);
  const previousStateRef = useRef<string | null>(null);
  const selectedOblastFeatureIdRef = useRef<number | string | null>(null);
  const selectedOblastCodeRef = useRef<string | null>(null);
  const { filters, setFilters } = useMapFilter();

  const {
    data: stateCitiesResponse,
    isFetching: isFetchingStateCities,
  } = useQuery({
    queryKey: ['state-cities', filters.state],
    queryFn: () => fetchStateCities(filters.country, filters.state),
    enabled: Boolean(filters.country && filters.state),
    staleTime: 1000 * 60 * 60 * 6,
    gcTime: 1000 * 60 * 60 * 12,
  });

  const stateCityNames = useMemo(() => {
    const names =
      stateCitiesResponse?.data
        .map((name) => name?.trim())
        .filter((name): name is string => Boolean(name && name.length > 0)) ?? [];

    return Array.from(new Set(names));
  }, [stateCitiesResponse]);

  const isStateSelected = Boolean(filters.state);
  const cityNames = isStateSelected ? stateCityNames : [];

  const cityNamesKey = useMemo(
    () => `${isStateSelected ? filters.state : 'country'}|${cityNames.join('|')}`,
    [filters.state, cityNames, isStateSelected]
  );

  const {
    data: cityCoordinates,
    isFetching: isFetchingCoordinates,
  } = useQuery({
    queryKey: ['city-coordinates', filters.country, filters.state, cityNamesKey],
    queryFn: () => fetchCityCoordinates(filters.country, cityNames),
    enabled: Boolean(
      config.mapboxAccessToken && filters.country && isStateSelected && cityNames.length > 0
    ),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
  });

  const {
    data: countryCityPopulations,
    isLoading: isLoadingCountryCityPopulations,
  } = useQuery({
    queryKey: ['country-city-populations', filters.country],
    queryFn: () =>
      fetchCountryCitiesPopulation({
        country: filters.country,
        limit: 200,
        order: 'asc',
        orderBy: 'name',
      }),
    enabled: Boolean(filters.country),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
  });

  useEffect(() => {
    if (!countryCityPopulations) {
      return;
    }

    const registerVariant = (
      catalog: Filters['cityPopulationCatalog'],
      entry: (typeof countryCityPopulations)[number],
      value: string | undefined | null
    ) => {
      if (!value) {
        return;
      }

      const normalized = normalizeCityKey(value);
      if (!normalized || normalized.length === 0 || catalog[normalized]) {
        return;
      }

      catalog[normalized] = entry;
    };

    setFilters((prev) => {
      const nextCatalog = countryCityPopulations.reduce((acc, entry) => {
        registerVariant(acc, entry, entry.city);

        const normalizedCity = normalizeCityKey(entry.city);
        const aliasVariants = CITY_NAME_ALIASES[normalizedCity] ?? [];
        aliasVariants.forEach((alias) => registerVariant(acc, entry, alias));

        const noParens = entry.city.replace(/\([^)]*\)/g, ' ');
        registerVariant(acc, entry, noParens);

        const parenthesesMatches = [...entry.city.matchAll(/\(([^)]+)\)/g)];
        parenthesesMatches.forEach((match) => registerVariant(acc, entry, match[1]));

        noParens
          .split(/[,/]/)
          .map((part) => part.trim())
          .filter(Boolean)
          .forEach((part) => registerVariant(acc, entry, part));

        return acc;
      }, {} as typeof prev.cityPopulationCatalog);

      const selectedCityKey = prev.selectedCity
        ? normalizeCityKey(prev.selectedCity.canonicalName ?? prev.selectedCity.name)
        : null;

      const hasSelectedCity =
        selectedCityKey != null && nextCatalog[selectedCityKey] !== undefined;

      const prevKeys = Object.keys(prev.cityPopulationCatalog);
      const nextKeys = Object.keys(nextCatalog);

      const catalogsDiffer =
        prevKeys.length !== nextKeys.length ||
        nextKeys.some((key) => {
          const nextEntry = nextCatalog[key];
          const prevEntry = prev.cityPopulationCatalog[key];
          if (!prevEntry) {
            return true;
          }
          if (prevEntry.populationCounts.length !== nextEntry.populationCounts.length) {
            return true;
          }
          return false;
        });

      if (!catalogsDiffer && hasSelectedCity === Boolean(prev.selectedCity)) {
        return prev;
      }

      const nextSelectedCity = hasSelectedCity && prev.selectedCity
        ? { ...prev.selectedCity, error: undefined }
        : null;

      return {
        ...prev,
        cityPopulationCatalog: nextCatalog,
        selectedCity: nextSelectedCity,
      };
    });
  }, [countryCityPopulations, setFilters]);

  const cityFeatures = useMemo<CityFeature[]>(() => {
    if (!cityCoordinates) {
      return [];
    }

    return cityCoordinates.map((entry) => ({
      type: 'Feature' as const,
      properties: {
        name: entry.displayName,
        canonicalName: entry.canonicalName,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: entry.coordinates,
      },
    }));
  }, [cityCoordinates]);

  const getCityPopulation = useCallback(
    async (canonicalCityName: string) => {
      const catalog = filters.cityPopulationCatalog;
      if (Object.keys(catalog).length === 0) {
        throw new Error('Дані про населення міст завантажуються…');
      }

      const entry = resolveCatalogEntry(catalog, canonicalCityName);

      if (!entry) {
        throw new Error(`Дані про населення для "${canonicalCityName}" не знайдено`);
      }

      const sorted = [...entry.populationCounts].sort((a, b) => Number(b.year) - Number(a.year));
      const latest = sorted.find((record) => Number.isFinite(record.value));

      return {
        population: latest ? Number(latest.value) : null,
        year: latest ? Number(latest.year) : undefined,
        records: entry.populationCounts,
      };
    },
    [filters.cityPopulationCatalog]
  );

  const handleCitySelection = useCallback(
    ({
      cityName,
      canonicalCityName,
      error,
      result: _result,
      records,
    }: {
      cityName: string;
      canonicalCityName: string;
      error?: string;
      result?: { population: number | null; year?: number | null } | null;
      records?: CityPopulationRecord[];
    }) => {
      setFilters((prev) => {
        const catalogEntry = resolveCatalogEntry(
          prev.cityPopulationCatalog,
          canonicalCityName,
          cityName
        );

        const nextError = error ?? (records && records.length > 0
          ? undefined
          : catalogEntry
            ? undefined
            : 'Дані про населення для цього міста не знайдено');

        return {
          ...prev,
          selectedCity: {
            name: cityName,
            canonicalName: canonicalCityName,
            error: nextError ?? undefined,
          },
        };
      });
    },
    [setFilters]
  );

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) {
      return;
    }

    if (!config.mapboxAccessToken) {
      // eslint-disable-next-line no-console
      console.error('Mapbox access token is missing. Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN.');
      return;
    }

    (mapboxgl as unknown as { setTelemetryEnabled?: (enabled: boolean) => void }).setTelemetryEnabled?.(false);
    mapboxgl.accessToken = config.mapboxAccessToken;

    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: MAP_CENTER,
      zoom: MAP_INITIAL_ZOOM,
    });

    mapRef.current = mapInstance;

    const handleLoad = () => {
      ensureOblastLayers(mapInstance);
      ensureStateCitiesLayer(mapInstance);
    };

    mapInstance.on('load', handleLoad);

    return () => {
      mapInstance.off('load', handleLoad);
      majorCitiesCleanupRef.current?.();
      oblastInteractionsCleanupRef.current?.();
      mapRef.current?.remove();
      mapRef.current = null;
      majorCitiesCleanupRef.current = null;
      oblastInteractionsCleanupRef.current = null;
    };
  }, []);

  const handleStateSelection = useCallback(
    ({ name }: { code: string; name: string; label: string }) => {
      setFilters((prev) => {
        if (prev.state === name) {
          return prev;
        }

        return {
          ...prev,
          state: name,
          selectedCity: null,
        };
      });
    },
    [setFilters]
  );

  useEffect(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance) {
      return;
    }

    const apply = () => {
      ensureStateCitiesLayer(mapInstance);
      updateStateCitiesLayer(mapInstance, cityFeatures);

      majorCitiesCleanupRef.current?.();
      if (cityFeatures.length > 0) {
        majorCitiesCleanupRef.current = attachCityInteractions(mapInstance, STATE_CITIES_LAYER_ID, {
          getCityPopulation,
          onCitySelected: handleCitySelection,
        });
      } else {
        majorCitiesCleanupRef.current = null;
      }
    };

    if (!mapInstance.isStyleLoaded()) {
      const onLoad = () => {
        apply();
        mapInstance.off('load', onLoad);
      };
      mapInstance.on('load', onLoad);
      return () => {
        mapInstance.off('load', onLoad);
      };
    }

    apply();
  }, [cityFeatures, getCityPopulation, handleCitySelection]);

  useEffect(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance) {
      return;
    }

    const setup = () => {
      ensureOblastLayers(mapInstance);
      oblastInteractionsCleanupRef.current?.();
      oblastInteractionsCleanupRef.current = attachOblastInteractions(mapInstance, undefined, {
        onStateSelected: handleStateSelection,
      });
    };

    if (!mapInstance.isStyleLoaded()) {
      const onLoad = () => {
        setup();
        mapInstance.off('load', onLoad);
      };
      mapInstance.on('load', onLoad);
      return () => {
        mapInstance.off('load', onLoad);
      };
    }

    setup();

    return () => {
      oblastInteractionsCleanupRef.current?.();
      oblastInteractionsCleanupRef.current = null;
    };
  }, [handleStateSelection]);

  useEffect(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance || cityFeatures.length === 0) {
      return;
    }

    if (previousStateRef.current === filters.state) {
      return;
    }

    const bounds = cityFeatures.reduce((acc, feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      if (!acc) {
        return new mapboxgl.LngLatBounds([lng, lat], [lng, lat]);
      }
      return acc.extend([lng, lat]);
    }, null as mapboxgl.LngLatBounds | null);

    if (bounds) {
      mapInstance.fitBounds(bounds, {
        padding: 40,
        duration: 800,
      });
    }

    previousStateRef.current = filters.state;
  }, [cityFeatures, filters.state]);

  useEffect(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance) {
      return;
    }

    const clearSelectedOblast = () => {
      if (selectedOblastFeatureIdRef.current == null) {
        return;
      }

      if (mapInstance.getSource(UKRAINE_OBLAST_SOURCE_ID)) {
        mapInstance.setFeatureState(
          {
            source: UKRAINE_OBLAST_SOURCE_ID,
            id: selectedOblastFeatureIdRef.current,
          },
          { selected: false }
        );
      }

      selectedOblastFeatureIdRef.current = null;
      selectedOblastCodeRef.current = null;
    };

    const applySelection = () => {
      if (!mapInstance.getSource(UKRAINE_OBLAST_SOURCE_ID)) {
        return;
      }

      if (!filters.state) {
        clearSelectedOblast();
        return;
      }

      const code = getUkraineOblastCodeByName(filters.state);
      if (!code) {
        clearSelectedOblast();
        return;
      }

      const normalizedCode = code.toUpperCase();
      if (selectedOblastCodeRef.current === normalizedCode) {
        return;
      }

      clearSelectedOblast();

      const features = mapInstance.querySourceFeatures(UKRAINE_OBLAST_SOURCE_ID, {
        filter: ['==', ['get', 'id'], normalizedCode],
      });
      const target = features[0];
      if (!target || target.id == null) {
        selectedOblastCodeRef.current = null;
        return;
      }

      mapInstance.setFeatureState(
        {
          source: UKRAINE_OBLAST_SOURCE_ID,
          id: target.id,
        },
        { selected: true }
      );
      selectedOblastFeatureIdRef.current = target.id;
      selectedOblastCodeRef.current = normalizedCode;
    };

    if (!mapInstance.isStyleLoaded()) {
      const onLoad = () => {
        applySelection();
        mapInstance.off('load', onLoad);
      };
      mapInstance.on('load', onLoad);
      return () => {
        mapInstance.off('load', onLoad);
      };
    }

    applySelection();

    return () => {
      clearSelectedOblast();
    };
  }, [filters.state]);

  const isFetchingCityList = isStateSelected ? isFetchingStateCities : false;
  const showLoadingOverlay =
    !mapRef.current ||
    !isStateSelected ||
    isFetchingCityList ||
    (isStateSelected && (isFetchingCoordinates || isLoadingCountryCityPopulations));
  const loadingMessage = !mapRef.current
    ? 'Підготовка карти…'
    : !isStateSelected
      ? 'Оберіть область, щоб почати'
      : isFetchingCityList
        ? 'Завантаження міст області…'
        : isLoadingCountryCityPopulations
          ? 'Завантаження даних про населення міст…'
          : isFetchingCoordinates
            ? 'Геокодування міст…'
            : 'Оновлення міст…';
  const spinnerSize = !mapRef.current ? 'md' : 'sm';
  const showSpinner =
    !mapRef.current ||
    isFetchingCityList ||
    (isStateSelected && (isFetchingCoordinates || isLoadingCountryCityPopulations));

  return (
    <div className="relative w-screen h-screen flex-1 flex" >
      <div id="map" ref={mapContainerRef} className="flex-1" />
      {showLoadingOverlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-3 bg-white/80 px-5 py-3 rounded-md shadow">
            {showSpinner && <Spinner size={spinnerSize} />}
            <span className="text-sm font-medium text-zinc-700">{loadingMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;