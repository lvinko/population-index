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
  attachCityInteractions,
  ensureOblastLayers,
  ensureStateCitiesLayer,
  updateStateCitiesLayer,
  type CityFeature,
} from '@/config/map';
import type { CleanupCallback } from '@/config/map';
import { useMapFilter } from '@/context/MapFilterContext';
import { fetchCityCoordinates, fetchCityPopulation, fetchStateCities } from '@/queries';
import { Spinner } from '@/components';

const Map = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const majorCitiesCleanupRef = useRef<CleanupCallback | null>(null);
  const previousStateRef = useRef<string | null>(null);
  const { filters } = useMapFilter();

  const {
    data: citiesResponse,
    isFetching: isFetchingCities,
  } = useQuery({
    queryKey: ['state-cities', filters.state],
    queryFn: () => fetchStateCities(filters.country, filters.state),
    enabled: Boolean(filters.country && filters.state),
    staleTime: 1000 * 60 * 60 * 6,
    gcTime: 1000 * 60 * 60 * 12,
  });

  const cityNames = useMemo(() => {
    const names =
      citiesResponse?.data
        .map((name) => name?.trim())
        .filter((name): name is string => Boolean(name && name.length > 0)) ?? [];

    return Array.from(new Set(names));
  }, [citiesResponse]);

  const cityNamesKey = useMemo(() => cityNames.join('|'), [cityNames]);

  const {
    data: cityCoordinates,
    isFetching: isFetchingCoordinates,
  } = useQuery({
    queryKey: ['state-city-coordinates', filters.country, filters.state, cityNamesKey],
    queryFn: () => fetchCityCoordinates(filters.country, cityNames),
    enabled: Boolean(config.mapboxAccessToken && filters.country && filters.state && cityNames.length > 0),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
  });

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

  type CityPopulationSummary = {
    population: number | null;
    year?: number;
  };

  const cityPopulationStoreRef = useRef<Partial<Record<string, CityPopulationSummary>>>({});
  const cityPopulationRequestsRef = useRef<Partial<Record<string, Promise<CityPopulationSummary>>>>({});

  useEffect(() => {
    cityPopulationStoreRef.current = {};
    cityPopulationRequestsRef.current = {};
  }, [filters.state, filters.country]);

  const getCityPopulation = useCallback(
    async (canonicalCityName: string) => {
      const key = canonicalCityName.trim();
      if (!key) {
        return { population: null };
      }

      const store = cityPopulationStoreRef.current;
      if (store[key]) {
        return store[key];
      }

      const pendingRequests = cityPopulationRequestsRef.current;
      if (pendingRequests[key]) {
        return pendingRequests[key];
      }

      const requestPromise = (async () => {
        const response = await fetchCityPopulation(filters.country, key);
        const sorted = [...response.populationCounts].sort((a, b) => b.year - a.year);
        const latest = sorted.find((entry) => Number.isFinite(entry.value));

        const summary: CityPopulationSummary = {
          population: latest ? latest.value : null,
          year: latest?.year,
        };

        cityPopulationStoreRef.current[key] = summary;
        return summary;
      })();

      pendingRequests[key] = requestPromise;

      try {
        const result = await requestPromise;
        return result;
      } finally {
        delete pendingRequests[key];
      }
    },
    [filters.country]
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
      mapRef.current?.remove();
      mapRef.current = null;
      majorCitiesCleanupRef.current = null;
    };
  }, []);

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
  }, [cityFeatures, getCityPopulation]);

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

  const shouldShowSelectionHint = !filters.state;
  const showLoadingOverlay =
    !mapRef.current || isFetchingCities || isFetchingCoordinates || shouldShowSelectionHint;
  const loadingMessage = shouldShowSelectionHint
    ? 'Оберіть область, щоб переглянути міста'
    : !mapRef.current
      ? 'Підготовка карти…'
      : isFetchingCoordinates
      ? 'Геокодування міст…'
      : 'Оновлення міст…';
  const spinnerSize = !mapRef.current ? 'md' : 'sm';
  const showSpinner = !shouldShowSelectionHint;

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