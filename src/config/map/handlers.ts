import mapboxgl from 'mapbox-gl';

import {
  MAJOR_CITIES_LAYER_ID,
  TAP_POPUP_CLASS_NAME,
  UNKNOWN_CITY_LABEL,
  UKRAINE_OBLAST_FILL_LAYER_ID,
  UKRAINE_OBLAST_SOURCE_ID,
} from './constants';
import { getUkraineOblastLabelByCode, getUkraineOblastNameByCode } from './regions';
import type { CleanupCallback, LayerEvent, MapInstance } from './types';

const getCityName = (feature?: mapboxgl.MapboxGeoJSONFeature) => {
  const properties = feature?.properties as Record<string, unknown> | undefined;
  const name =
    (properties?.name as string | undefined) ??
    (properties?.name_en as string | undefined) ??
    (properties?.text as string | undefined) ??
    '';

  return name || UNKNOWN_CITY_LABEL;
};

const getCanonicalCityName = (feature?: mapboxgl.MapboxGeoJSONFeature) => {
  const properties = feature?.properties as Record<string, unknown> | undefined;
  const canonical =
    (properties?.canonicalName as string | undefined) ??
    (properties?.canonical_name as string | undefined) ??
    (properties?.name as string | undefined) ??
    '';

  return canonical;
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return character;
    }
  });

const formatPopulation = (population: number | null | undefined) => {
  if (population == null) {
    return null;
  }

  return population.toLocaleString('uk-UA');
};

type CityPopupState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; population: number | null; year?: number };

const buildPopupContent = (cityName: string, state: CityPopupState) => {
  const safeCityName = escapeHtml(cityName);

  let body: string;

  switch (state.status) {
    case 'loading':
      body = '<span class="text-xs text-zinc-500">Завантаження населення…</span>';
      break;
    case 'error':
      body = '<span class="text-xs text-red-500">Не вдалося отримати населення</span>';
      break;
    case 'success': {
      const formatted = formatPopulation(state.population);
      body =
        formatted != null
          ? `<span class="text-xs text-zinc-600">Населення${
              state.year ? ` (${state.year})` : ''
            }: ${formatted}</span>`
          : '<span class="text-xs text-zinc-500">Немає даних про населення</span>';
      break;
    }
    default:
      body = '<span class="text-xs text-zinc-500">Натисніть, щоб переглянути населення</span>';
      break;
  }

  return `<div class="flex flex-col gap-1">
    <span class="text-sm font-medium">${safeCityName}</span>
    ${body}
  </div>`;
};

type CityPopulationResolverResult = {
  population: number | null;
  year?: number;
  records?: CityPopulationRecordSummary[];
};

type AttachCityInteractionsOptions = {
  getCityPopulation?: (cityName: string) => Promise<CityPopulationResolverResult>;
  onCitySelected?: (payload: {
    cityName: string;
    canonicalCityName: string;
    result: CityPopulationResolverResult | null;
    records?: CityPopulationRecordSummary[];
    error?: string;
  }) => void;
};

type CityPopulationRecordSummary = {
  year: number;
  value: number;
  sex?: string;
  reliability?: string;
};

export const attachCityInteractions = (
  map: MapInstance,
  layerId = MAJOR_CITIES_LAYER_ID,
  options: AttachCityInteractionsOptions = {}
): CleanupCallback => {
  const tapPopup = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: true,
    offset: 12,
    className: TAP_POPUP_CLASS_NAME,
  });

  let tapRequestId = 0;

  const handleMouseEnter = () => {
    map.getCanvas().style.cursor = 'pointer';
  };

  const handleMouseLeave = () => {
    map.getCanvas().style.cursor = '';
  };

  const handleClick = (event: LayerEvent) => {
    const feature = event.features?.[0];
    if (!feature) {
      return;
    }

    const cityName = getCityName(feature);
    const canonicalCityName = getCanonicalCityName(feature) || cityName;

    tapPopup
      .setLngLat(event.lngLat)
      .setHTML(
        buildPopupContent(cityName, {
          status: options.getCityPopulation ? 'loading' : 'idle',
        })
      );

    tapPopup.addTo(map);

    if (!options.getCityPopulation) {
      return;
    }

    const requestId = ++tapRequestId;

    options
      .getCityPopulation(canonicalCityName)
      .then((result) => {
        if (tapRequestId !== requestId) {
          return;
        }

        tapPopup.setLngLat(event.lngLat).setHTML(
          buildPopupContent(cityName, {
            status: 'success',
            population: result.population,
            year: result.year,
          })
        );

        options.onCitySelected?.({
          cityName,
          canonicalCityName,
          result,
          records: result.records ?? [],
        });
      })
      .catch((error) => {
        if (tapRequestId !== requestId) {
          return;
        }

        tapPopup.setLngLat(event.lngLat).setHTML(
          buildPopupContent(cityName, {
            status: 'error',
          })
        );

        options.onCitySelected?.({
          cityName,
          canonicalCityName,
          result: null,
          records: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
  };

  map.on('mouseenter', layerId, handleMouseEnter);
  map.on('mouseleave', layerId, handleMouseLeave);
  map.on('click', layerId, handleClick);

  return () => {
    map.off('mouseenter', layerId, handleMouseEnter);
    map.off('mouseleave', layerId, handleMouseLeave);
    map.off('click', layerId, handleClick);
    tapPopup.remove();
  };
};

type OblastSelectionPayload = {
  code: string;
  name: string;
  label: string;
};

type AttachOblastInteractionsOptions = {
  onStateSelected?: (payload: OblastSelectionPayload) => void;
};

const getOblastFeatureCode = (feature?: mapboxgl.MapboxGeoJSONFeature) => {
  const properties = feature?.properties as Record<string, unknown> | undefined;
  const directId = properties?.id;
  if (typeof directId === 'string' && directId.trim().length > 0) {
    return directId;
  }

  const featureId = feature?.id;
  if (typeof featureId === 'string') {
    return featureId;
  }

  return null;
};

const getOblastName = (feature?: mapboxgl.MapboxGeoJSONFeature) => {
  const code = getOblastFeatureCode(feature);
  if (!code) {
    return null;
  }

  const normalizedCode = code.toString();
  const mappedName = getUkraineOblastNameByCode(normalizedCode);
  if (!mappedName) {
    return null;
  }

  return {
    code: normalizedCode,
    name: mappedName,
    label: getUkraineOblastLabelByCode(normalizedCode) ?? mappedName,
  };
};

export const attachOblastInteractions = (
  map: MapInstance,
  layerId = UKRAINE_OBLAST_FILL_LAYER_ID,
  options: AttachOblastInteractionsOptions = {}
): CleanupCallback => {
  let hoveredFeatureId: number | string | null = null;
  const hasOblastSource = () => Boolean(map.getSource(UKRAINE_OBLAST_SOURCE_ID));

  const resetHoverState = () => {
    if (hoveredFeatureId == null) {
      return;
    }

    if (hasOblastSource()) {
      map.setFeatureState(
        { source: UKRAINE_OBLAST_SOURCE_ID, id: hoveredFeatureId },
        { hover: false }
      );
    }
    hoveredFeatureId = null;
  };

  const applyHoverState = (featureId: number | string | undefined) => {
    if (featureId == null || hoveredFeatureId === featureId) {
      return;
    }

    resetHoverState();

    if (hasOblastSource()) {
      map.setFeatureState({ source: UKRAINE_OBLAST_SOURCE_ID, id: featureId }, { hover: true });
      hoveredFeatureId = featureId;
      return;
    }

    hoveredFeatureId = featureId;
  };

  const handleMouseEnter = () => {
    map.getCanvas().style.cursor = 'pointer';
  };

  const handleMouseMove = (event: LayerEvent) => {
    const feature = event.features?.[0];
    if (!feature) {
      resetHoverState();
      return;
    }

    applyHoverState(feature.id);
  };

  const handleMouseLeave = () => {
    map.getCanvas().style.cursor = '';
    resetHoverState();
  };

  const handleOblastClick = (event: LayerEvent) => {
    const feature = event.features?.[0];
    if (!feature) {
      return;
    }

    const oblast = getOblastName(feature);
    if (!oblast) {
      return;
    }

    if (options.onStateSelected) {
      options.onStateSelected({
        code: oblast.code.toUpperCase(),
        name: oblast.name,
        label: oblast.label,
      });
    }
  };

  map.on('mouseenter', layerId, handleMouseEnter);
  map.on('mousemove', layerId, handleMouseMove);
  map.on('mouseleave', layerId, handleMouseLeave);
  map.on('click', layerId, handleOblastClick);

  return () => {
    resetHoverState();
    map.off('mouseenter', layerId, handleMouseEnter);
    map.off('mousemove', layerId, handleMouseMove);
    map.off('mouseleave', layerId, handleMouseLeave);
    map.off('click', layerId, handleOblastClick);
    map.getCanvas().style.cursor = '';
  };
};


