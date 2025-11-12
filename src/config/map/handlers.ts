import mapboxgl from 'mapbox-gl';

import { MAJOR_CITIES_LAYER_ID, UNKNOWN_CITY_LABEL, UKRAINE_OBLAST_FILL_LAYER_ID, UKRAINE_OBLAST_SOURCE_ID } from './constants';
import { getUkraineOblastLabelByCode, getUkraineOblastNameByCode } from './regions';
import type { CleanupCallback, LayerEvent, MapInstance } from './types';
import type { CityArticleResponse } from '@/types/wikidata';

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

type CityInfoResolverResult = Pick<
  CityArticleResponse,
  'cityLabel' | 'summary' | 'wikipediaUrl' | 'coordinates' | 'language' | 'wikidataId' | 'wikidataEntity'
>;

type CityInfoResolverInput = {
  canonicalCityName: string;
  cityName: string;
};

type AttachCityInteractionsOptions = {
  getCityDetails?: (payload: CityInfoResolverInput) => Promise<CityInfoResolverResult>;
  onCityLoading?: (payload: {
    cityName: string;
    canonicalCityName: string;
  }) => void;
  onCitySelected?: (payload: {
    cityName: string;
    canonicalCityName: string;
    result: CityInfoResolverResult | null;
    error?: string;
  }) => void;
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
    className: 'city-pin-popup',
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
      .setHTML('<div class="flex items-center justify-center text-xl">📍</div>')
      .addTo(map);

    options.onCityLoading?.({
      cityName,
      canonicalCityName,
    });

    if (!options.getCityDetails) {
      return;
    }

    const requestId = ++tapRequestId;

    options
      .getCityDetails({
        canonicalCityName,
        cityName,
      })
      .then((result) => {
        if (tapRequestId !== requestId) {
          return;
        }

        options.onCitySelected?.({
          cityName,
          canonicalCityName,
          result,
        });
      })
      .catch((error) => {
        if (tapRequestId !== requestId) {
          return;
        }

        options.onCitySelected?.({
          cityName,
          canonicalCityName,
          result: null,
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


