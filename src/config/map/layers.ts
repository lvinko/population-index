import type mapboxgl from 'mapbox-gl';

import UkraineRegions from '@/helpers/ua.json';

import {
  STATE_CITIES_LAYER_ID,
  STATE_CITIES_SOURCE_ID,
  UKRAINE_OBLAST_FILL_LAYER_ID,
  UKRAINE_OBLAST_OUTLINE_LAYER_ID,
  UKRAINE_OBLAST_SOURCE_ID,
} from './constants';

export const ensureOblastLayers = (map: mapboxgl.Map) => {
  if (!map.getSource(UKRAINE_OBLAST_SOURCE_ID)) {
    map.addSource(UKRAINE_OBLAST_SOURCE_ID, {
      type: 'geojson',
      data: UkraineRegions as unknown as GeoJSON.FeatureCollection,
      promoteId: 'id',
    });
  }

  if (!map.getLayer(UKRAINE_OBLAST_FILL_LAYER_ID)) {
    map.addLayer({
      id: UKRAINE_OBLAST_FILL_LAYER_ID,
      type: 'fill',
      source: UKRAINE_OBLAST_SOURCE_ID,
      paint: {
        'fill-color': '#2563eb',
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          0.42,
          ['boolean', ['feature-state', 'hover'], false],
          0.24,
          0,
        ],
      },
    });
  }

  if (!map.getLayer(UKRAINE_OBLAST_OUTLINE_LAYER_ID)) {
    map.addLayer({
      id: UKRAINE_OBLAST_OUTLINE_LAYER_ID,
      type: 'line',
      source: UKRAINE_OBLAST_SOURCE_ID,
      paint: {
        'line-color': '#2563eb',
        'line-width': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          2.2,
          ['boolean', ['feature-state', 'hover'], false],
          1.6,
          1,
        ],
        'line-opacity': 0.8,
      },
    });
  }
};

type CityFeatureProperties = {
  name: string;
  canonicalName: string;
};

export type CityFeature = GeoJSON.Feature<GeoJSON.Point, CityFeatureProperties>;

const createEmptyFeatureCollection =
  (): GeoJSON.FeatureCollection<GeoJSON.Point, CityFeatureProperties> => ({
  type: 'FeatureCollection',
  features: [],
});

export const ensureStateCitiesLayer = (map: mapboxgl.Map) => {
  if (!map.getSource(STATE_CITIES_SOURCE_ID)) {
    map.addSource(STATE_CITIES_SOURCE_ID, {
      type: 'geojson',
      data: createEmptyFeatureCollection(),
    });
  }

  if (!map.getLayer(STATE_CITIES_LAYER_ID)) {
    map.addLayer({
      id: STATE_CITIES_LAYER_ID,
      type: 'circle',
      source: STATE_CITIES_SOURCE_ID,
      paint: {
        'circle-radius': 6,
        'circle-color': '#FF0000',
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#FFFFFF',
      },
    });
  }
};

export const updateStateCitiesLayer = (map: mapboxgl.Map, features: CityFeature[]) => {
  ensureStateCitiesLayer(map);

  const source = map.getSource(STATE_CITIES_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  if (!source) {
    return;
  }

  const collection: GeoJSON.FeatureCollection<GeoJSON.Point, CityFeatureProperties> = {
    type: 'FeatureCollection',
    features,
  };

  source.setData(collection);
};
