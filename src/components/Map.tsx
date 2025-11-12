'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
import { fetchCityCoordinates, fetchStateCities, fetchCityArticle } from '@/queries';
import type { CityArticleResponse } from '@/types/wikidata';
import { Spinner } from '@/components';
import { CITY_NAME_ALIASES, generateCityVariants } from '@/utils/cityNameVariants';

const Map = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const majorCitiesCleanupRef = useRef<CleanupCallback | null>(null);
  const oblastInteractionsCleanupRef = useRef<CleanupCallback | null>(null);
  const previousStateRef = useRef<string | null>(null);
  const selectedOblastFeatureIdRef = useRef<number | string | null>(null);
  const selectedOblastCodeRef = useRef<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
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

  const cityFeatures = useMemo<CityFeature[]>(() => {
    if (!cityCoordinates) {
      return [];
    }

    return cityCoordinates.map((entry) => {
      const featureId = `${normalizeCityKey(entry.canonicalName)}|${entry.coordinates[0]}|${entry.coordinates[1]}`;

      return {
        type: 'Feature' as const,
        id: featureId,
        properties: {
          name: entry.displayName,
          canonicalName: entry.canonicalName,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: entry.coordinates,
        },
      };
    });
  }, [cityCoordinates]);

  const getCityDetails = useCallback(
    async ({ canonicalCityName, cityName }: { canonicalCityName: string; cityName: string }) => {
      const fallbackNames = Array.from(
        new Set([
          ...generateCityVariants(cityName),
          ...generateCityVariants(canonicalCityName),
          ...(CITY_NAME_ALIASES[normalizeCityKey(canonicalCityName)] ?? []),
        ])
      );

      const response = await fetchCityArticle({
        cityName: canonicalCityName,
        fallbackNames,
      });

      if (!response.summary && !response.cityLabel) {
        throw new Error(`Сторінку для "${canonicalCityName}" не знайдено`);
      }

      return response;
    },
    []
  );

  const handleCityLoading = useCallback(
    ({ cityName, canonicalCityName }: { cityName: string; canonicalCityName: string }) => {
      setFilters((prev) => ({
        ...prev,
        selectedCity: {
          name: cityName,
          canonicalName: canonicalCityName,
          summary: null,
          wikipediaUrl: null,
          coordinates: null,
          language: null,
          wikidataId: null,
          wikidataEntity: null,
          status: 'loading',
        },
      }));
    },
    [setFilters]
  );

  const handleCitySelection = useCallback(
    ({
      cityName,
      canonicalCityName,
      error,
      result,
    }: {
      cityName: string;
      canonicalCityName: string;
      error?: string;
      result?: CityArticleResponse | null;
    }) => {
      setFilters((prev) => ({
        ...prev,
        selectedCity: {
          name: result?.cityLabel ?? cityName,
          canonicalName: canonicalCityName,
          summary: result?.summary ?? null,
          wikipediaUrl: result?.wikipediaUrl ?? null,
          coordinates: result?.coordinates ?? null,
          language: result?.language ?? null,
          wikidataId: result?.wikidataId ?? null,
          wikidataEntity: result?.wikidataEntity ?? null,
          error,
          status: error ? 'error' : 'success',
        },
      }));
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
      setIsMapReady(true);
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
      setIsMapReady(false);
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
          getCityDetails,
          onCityLoading: handleCityLoading,
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
  }, [cityFeatures, getCityDetails, handleCityLoading, handleCitySelection]);

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

  const overlayState = useMemo(
    () => {
      if (!isMapReady) {
        return {
          show: true,
          message: 'Підготовка карти…',
          showSpinner: true,
          spinnerSize: 'md' as const,
        };
      }

      if (!isStateSelected) {
        return {
          show: true,
          message: 'Оберіть область, щоб почати',
          showSpinner: false,
          spinnerSize: 'sm' as const,
        };
      }

      if (isFetchingCityList) {
        return {
          show: true,
          message: 'Завантаження міст області…',
          showSpinner: true,
          spinnerSize: 'sm' as const,
        };
      }

      if (isFetchingCoordinates) {
        return {
          show: true,
          message: 'Геокодування міст…',
          showSpinner: true,
          spinnerSize: 'sm' as const,
        };
      }

      return {
        show: false,
        message: '',
        showSpinner: false,
        spinnerSize: 'sm' as const,
      };
    },
    [isFetchingCityList, isFetchingCoordinates, isMapReady, isStateSelected]
  );

  const {
    show: showLoadingOverlay,
    message: loadingMessage,
    showSpinner,
    spinnerSize,
  } = overlayState;

  return (
    <div className="relative w-screen h-screen flex-1 flex" >
      <div id="map" ref={mapContainerRef} className="flex-1" />
      {showLoadingOverlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-3 bg-base-100/90 backdrop-blur-sm px-5 py-3 rounded-md shadow-lg border border-base-300">
            {showSpinner && <Spinner size={spinnerSize} />}
            <span className="text-sm font-medium text-base-content">{loadingMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;