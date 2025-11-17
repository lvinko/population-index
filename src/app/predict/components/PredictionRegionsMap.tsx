'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { Spinner } from '@/components';
import { config } from '@/config';
import {
  MAP_CENTER,
  MAP_INITIAL_ZOOM,
  UKRAINE_OBLAST_OUTLINE_LAYER_ID,
  UKRAINE_OBLAST_SOURCE_ID,
  attachOblastInteractions,
  ensureOblastLayers,
  getMapStyle,
  getUkraineOblastCodeByName,
  getUkraineOblastLabelByCode,
  type CleanupCallback,
} from '@/config/map';
import type { RegionForecast } from '@/lib/utils/types';

type SelectedRegionMeta = {
  code: string;
  label: string;
  name: string;
};

type PredictionRegionsMapProps = {
  regions?: RegionForecast[];
};

const PREDICTION_OBLAST_FILL_LAYER_ID = 'prediction-oblast-fill';
const PREDICTION_OBLAST_LABEL_LAYER_ID = 'prediction-oblast-labels';

const isoToMapCode = (code?: string | null) => {
  if (!code) {
    return null;
  }
  return code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
};

const mapCodeToIso = (code?: string | null) => {
  if (!code) {
    return null;
  }
  const normalized = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (!normalized.startsWith('UA')) {
    return normalized;
  }
  const suffix = normalized.slice(2);
  return suffix ? `UA-${suffix}` : normalized;
};

const formatCompactPopulation = (value: number) => {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const fixed = millions >= 10 ? millions.toFixed(0) : millions.toFixed(1);
    return `${fixed.replace(/\.0$/, '')} млн`;
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    const fixed = thousands >= 10 ? thousands.toFixed(0) : thousands.toFixed(1);
    return `${fixed.replace(/\.0$/, '')} тис.`;
  }
  return value.toString();
};

const PredictionRegionsMap = ({ regions }: PredictionRegionsMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const oblastCleanupRef = useRef<CleanupCallback | null>(null);
  const selectedFeatureIdRef = useRef<number | string | null>(null);
  const selectedCodeRef = useRef<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [selectedRegionMeta, setSelectedRegionMeta] = useState<SelectedRegionMeta | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const appliedFeatureStatesRef = useRef<Set<string>>(new Set());

  const regionsByCode = useMemo(() => {
    if (!regions || regions.length === 0) {
      return new Map<string, RegionForecast>();
    }

    return regions.reduce((acc, region) => {
      const mapCode =
        isoToMapCode(region.code) ??
        getUkraineOblastCodeByName(region.label ?? region.region ?? region.code);
      if (!mapCode) {
        return acc;
      }
      acc.set(mapCode.toUpperCase(), region);
      return acc;
    }, new Map<string, RegionForecast>());
  }, [regions]);

  const selectedRegionStats = selectedCode ? regionsByCode.get(selectedCode.toUpperCase()) : null;

  const populationRange = useMemo(() => {
    if (!regions || regions.length === 0) {
      return null;
    }
    const values = regions.map((region) => region.population).filter((value) => Number.isFinite(value));
    if (values.length === 0) {
      return null;
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return null;
    }
    return {
      min,
      max: max === min ? min + 1 : max,
    };
  }, [regions]);

  const fillColorExpression = useMemo(() => {
    if (!populationRange) {
      return [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        '#2563eb',
        ['>', ['coalesce', ['feature-state', 'populationValue'], 0], 0],
        '#60a5fa',
        '#cbd5f5',
      ];
    }

    const { min, max } = populationRange;
    const range = max - min || 1;
    return [
      'interpolate',
      ['linear'],
      ['coalesce', ['feature-state', 'populationValue'], 0],
      min,
      '#c7d2fe',
      min + range * 0.25,
      '#93c5fd',
      min + range * 0.5,
      '#3b82f6',
      min + range * 0.75,
      '#1d4ed8',
      max,
      '#1e3a8a',
    ];
  }, [populationRange]);

  const labelExpression = useMemo(
    () => [
      'case',
      ['==', ['coalesce', ['feature-state', 'populationLabel'], ''], ''],
      '',
      [
        'concat',
        ['coalesce', ['feature-state', 'labelShort'], ''],
        '\n',
        ['coalesce', ['feature-state', 'populationCompact'], ''],
      ],
    ],
    []
  );

  const ensurePredictionLayers = useCallback(
    (mapInstance: mapboxgl.Map) => {
      if (!mapInstance.getSource(UKRAINE_OBLAST_SOURCE_ID)) {
        return;
      }

      ensureOblastLayers(mapInstance);

      if (!mapInstance.getLayer(PREDICTION_OBLAST_FILL_LAYER_ID)) {
        mapInstance.addLayer(
          {
            id: PREDICTION_OBLAST_FILL_LAYER_ID,
            type: 'fill',
            source: UKRAINE_OBLAST_SOURCE_ID,
            paint: {
              'fill-color': fillColorExpression,
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'selected'], false],
                0.9,
                ['>', ['coalesce', ['feature-state', 'populationValue'], 0], 0],
                0.7,
                0.2,
              ],
            },
          },
          UKRAINE_OBLAST_OUTLINE_LAYER_ID
        );
      } else {
        mapInstance.setPaintProperty(PREDICTION_OBLAST_FILL_LAYER_ID, 'fill-color', fillColorExpression);
      }

      if (!mapInstance.getLayer(PREDICTION_OBLAST_LABEL_LAYER_ID)) {
        mapInstance.addLayer({
          id: PREDICTION_OBLAST_LABEL_LAYER_ID,
          type: 'symbol',
          source: UKRAINE_OBLAST_SOURCE_ID,
          layout: {
            'symbol-placement': 'point',
            'text-field': labelExpression,
            'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 6, 12, 8, 14],
            'text-allow-overlap': false,
          },
          paint: {
            'text-color': '#0f172a',
            'text-halo-color': 'rgba(255,255,255,0.85)',
            'text-halo-width': 1.5,
          },
        });
      } else {
        mapInstance.setLayoutProperty(PREDICTION_OBLAST_LABEL_LAYER_ID, 'text-field', labelExpression);
      }
    },
    [fillColorExpression, labelExpression]
  );

  const syncRegionFeatureStates = useCallback(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance || !mapReady || !mapInstance.getSource(UKRAINE_OBLAST_SOURCE_ID)) {
      return;
    }

    const nextApplied = new Set<string>();

    regionsByCode.forEach((region, code) => {
      const normalizedCode = code.toUpperCase();
      const features = mapInstance.querySourceFeatures(UKRAINE_OBLAST_SOURCE_ID, {
        filter: ['==', ['get', 'id'], normalizedCode],
      });
      if (!features.length) {
        return;
      }
      const target = features[0];
      const featureId = target.id ?? normalizedCode;
      mapInstance.setFeatureState(
        {
          source: UKRAINE_OBLAST_SOURCE_ID,
          id: featureId,
        },
        {
          populationValue: region.population,
          populationLabel: region.population.toLocaleString('uk-UA'),
          populationCompact: formatCompactPopulation(region.population),
          percentValue: region.percent,
          labelShort: region.label ?? getUkraineOblastLabelByCode(normalizedCode) ?? region.region,
        }
      );
      nextApplied.add(normalizedCode);
    });

    appliedFeatureStatesRef.current.forEach((code) => {
      if (nextApplied.has(code)) {
        return;
      }
      const features = mapInstance.querySourceFeatures(UKRAINE_OBLAST_SOURCE_ID, {
        filter: ['==', ['get', 'id'], code],
      });
      if (!features.length) {
        return;
      }
      const target = features[0];
      const featureId = target.id ?? code;
      mapInstance.removeFeatureState({
        source: UKRAINE_OBLAST_SOURCE_ID,
        id: featureId,
      });
    });

    appliedFeatureStatesRef.current = nextApplied;
  }, [mapReady, regionsByCode]);

  const clearSelectedOblast = useCallback(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance || selectedFeatureIdRef.current == null) {
      selectedFeatureIdRef.current = null;
      selectedCodeRef.current = null;
      return;
    }

    if (mapInstance.getSource(UKRAINE_OBLAST_SOURCE_ID)) {
      mapInstance.setFeatureState(
        {
          source: UKRAINE_OBLAST_SOURCE_ID,
          id: selectedFeatureIdRef.current,
        },
        { selected: false }
      );
    }

    selectedFeatureIdRef.current = null;
    selectedCodeRef.current = null;
  }, []);

  const applySelectedOblast = useCallback(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance || !mapReady) {
      return;
    }

    if (!mapInstance.getSource(UKRAINE_OBLAST_SOURCE_ID)) {
      return;
    }

    if (!selectedCode) {
      clearSelectedOblast();
      return;
    }

    const normalizedCode = selectedCode.toUpperCase();
    if (selectedCodeRef.current === normalizedCode) {
      return;
    }

    clearSelectedOblast();

    const features = mapInstance.querySourceFeatures(UKRAINE_OBLAST_SOURCE_ID, {
      filter: ['==', ['get', 'id'], normalizedCode],
    });
    const target = features[0];
    if (!target || target.id == null) {
      selectedCodeRef.current = null;
      return;
    }

    mapInstance.setFeatureState(
      {
        source: UKRAINE_OBLAST_SOURCE_ID,
        id: target.id,
      },
      { selected: true }
    );
    selectedFeatureIdRef.current = target.id;
    selectedCodeRef.current = normalizedCode;
  }, [clearSelectedOblast, mapReady, selectedCode]);

  const handleStateSelected = useCallback(
    ({ code, name, label }: { code: string; name: string; label: string }) => {
      setSelectedCode(code);
      setSelectedRegionMeta({
        code: mapCodeToIso(code) ?? code,
        name,
        label,
      });
    },
    []
  );

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) {
      return;
    }

    if (!config.mapboxAccessToken) {
      setMapError('Mapbox access token відсутній. Додайте NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN.');
      return;
    }

    (mapboxgl as typeof mapboxgl & { setTelemetryEnabled?: (enabled: boolean) => void }).setTelemetryEnabled?.(false);
    mapboxgl.accessToken = config.mapboxAccessToken;

    const initialTheme = (document.documentElement.getAttribute('data-theme') || 'light') as 'light' | 'dark';
    setCurrentTheme(initialTheme);

    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: getMapStyle(initialTheme),
      center: MAP_CENTER,
      zoom: MAP_INITIAL_ZOOM,
    });

    mapRef.current = mapInstance;

    const handleLoad = () => {
      ensureOblastLayers(mapInstance);
      ensurePredictionLayers(mapInstance);
      oblastCleanupRef.current?.();
      oblastCleanupRef.current = attachOblastInteractions(mapInstance, undefined, {
        onStateSelected: handleStateSelected,
      });
      setMapReady(true);
    };

    mapInstance.on('load', handleLoad);

    return () => {
      mapInstance.off('load', handleLoad);
      oblastCleanupRef.current?.();
      oblastCleanupRef.current = null;
      clearSelectedOblast();
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [clearSelectedOblast, ensurePredictionLayers, handleStateSelected]);

  useEffect(() => {
    if (selectedCode || regionsByCode.size === 0) {
      return;
    }

    const [firstCode] = regionsByCode.keys();
    if (!firstCode) {
      return;
    }

    const stats = regionsByCode.get(firstCode);
    setSelectedCode(firstCode);
    setSelectedRegionMeta({
      code: stats?.code ?? mapCodeToIso(firstCode) ?? firstCode,
      name: stats?.region ?? firstCode,
      label: stats?.label ?? getUkraineOblastLabelByCode(firstCode) ?? stats?.region ?? firstCode,
    });
  }, [regionsByCode, selectedCode]);

  useEffect(() => {
    applySelectedOblast();
  }, [applySelectedOblast]);

  useEffect(() => {
    if (!mapReady) {
      return;
    }
    ensurePredictionLayers(mapRef.current!);
    syncRegionFeatureStates();
  }, [ensurePredictionLayers, mapReady, syncRegionFeatureStates]);

  useEffect(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance || !mapReady) {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = (document.documentElement.getAttribute('data-theme') || 'light') as 'light' | 'dark';
          if (newTheme === currentTheme) {
            continue;
          }

          setCurrentTheme(newTheme);
          const newStyle = getMapStyle(newTheme);
          mapInstance.setStyle(newStyle);
          mapInstance.once('style.load', () => {
            ensureOblastLayers(mapInstance);
            ensurePredictionLayers(mapInstance);
            oblastCleanupRef.current?.();
            oblastCleanupRef.current = attachOblastInteractions(mapInstance, undefined, {
              onStateSelected: handleStateSelected,
            });
            applySelectedOblast();
            syncRegionFeatureStates();
          });
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      observer.disconnect();
    };
  }, [applySelectedOblast, currentTheme, ensurePredictionLayers, handleStateSelected, mapReady, syncRegionFeatureStates]);

  const overlayState = useMemo(() => {
    if (mapError) {
      return {
        show: true,
        message: mapError,
        showSpinner: false,
      };
    }

    if (!mapReady) {
      return {
        show: true,
        message: 'Завантаження карти регіонів…',
        showSpinner: true,
      };
    }

    return {
      show: false,
      message: '',
      showSpinner: false,
    };
  }, [mapError, mapReady]);

  const renderRegionStats = () => {
    if (selectedRegionStats) {
      const { population, male, female, percent, lowerBound, upperBound } = selectedRegionStats;
      return (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-base-content/60">Прогноз, осіб</p>
            <p className="text-2xl font-semibold text-base-content">{population.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-base-content/60">Частка</p>
            <p className="text-2xl font-semibold text-primary">{percent.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-blue-500/70">♂ Чоловіки</p>
            <p className="text-lg font-semibold text-blue-500">{male.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-pink-500/70">♀ Жінки</p>
            <p className="text-lg font-semibold text-pink-500">{female.toLocaleString()}</p>
          </div>
          <div className="col-span-2 text-xs text-base-content/70">
            Діапазон невизначеності: {lowerBound.toLocaleString()} – {upperBound.toLocaleString()}
          </div>
        </div>
      );
    }

    if (selectedRegionMeta) {
      return (
        <p className="text-sm text-base-content/70">
          Дані для регіону поки що не завантажені. Після наступного прогнозу відобразимо розподіл населення.
        </p>
      );
    }

    return (
      <p className="text-sm text-base-content/70">
        Натисніть на область на карті, щоб побачити деталі.
      </p>
    );
  };

  return (
    <div className="card bg-base-100 shadow-xl border border-base-300">
      <div className="card-body p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-base-content">Карта регіонів</h3>
            <p className="text-sm text-base-content/70">
              Оберіть область, щоб відслідкувати майбутній розподіл населення
            </p>
          </div>
          <div className="badge badge-primary badge-outline text-xs sm:text-sm">
            Mapbox • Beta
          </div>
        </div>

        <div className="relative rounded-xl overflow-hidden border border-base-300 bg-base-200">
          <div ref={mapContainerRef} className="h-[420px] w-full" />
          {overlayState.show && (
            <div className="absolute inset-0 flex items-center justify-center bg-base-100/90 backdrop-blur-sm text-center px-4">
              <div className="flex items-center gap-3">
                {overlayState.showSpinner && <Spinner size="sm" />}
                <p className="text-sm font-medium text-base-content">{overlayState.message}</p>
              </div>
            </div>
          )}
          {populationRange && (
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-64 bg-base-100/85 backdrop-blur rounded-lg border border-base-200 px-3 py-2 shadow-md">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-base-content/60 mb-1">
                <span>Менше</span>
                <span>Більше</span>
              </div>
              <div className="h-2 rounded-full bg-gradient-to-r from-indigo-100 via-blue-400 to-indigo-900" />
              <div className="flex items-center justify-between text-xs text-base-content/70 mt-1">
                <span>{populationRange.min.toLocaleString('uk-UA')}</span>
                <span>{populationRange.max.toLocaleString('uk-UA')}</span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-base-200 bg-base-200/60 p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-base-content/60">Обраний регіон</p>
              <p className="text-lg font-semibold text-base-content">
                {selectedRegionMeta?.label ?? 'Не обрано'}
              </p>
            </div>
            {selectedRegionMeta?.code && (
              <span className="px-2 py-1 text-xs font-mono bg-base-100 border border-base-300 rounded">
                {selectedRegionMeta.code}
              </span>
            )}
          </div>
          {renderRegionStats()}
        </div>
      </div>
    </div>
  );
};

export default PredictionRegionsMap;


