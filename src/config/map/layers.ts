import type mapboxgl from 'mapbox-gl';

import UkraineRegions from '@/helpers/ua.json';

import { MAJOR_CITIES_LAYER_ID, MAJOR_CITY_NAMES_EN, UKRAINE_OBLAST_FILL_LAYER_ID, UKRAINE_OBLAST_OUTLINE_LAYER_ID, UKRAINE_OBLAST_SOURCE_ID } from './constants';

export const ensureOblastLayers = (map: mapboxgl.Map) => {
  if (!map.getSource(UKRAINE_OBLAST_SOURCE_ID)) {
    map.addSource(UKRAINE_OBLAST_SOURCE_ID, {
      type: 'geojson',
      data: UkraineRegions as unknown as GeoJSON.FeatureCollection,
    });
  }

  if (!map.getLayer(UKRAINE_OBLAST_FILL_LAYER_ID)) {
    map.addLayer({
      id: UKRAINE_OBLAST_FILL_LAYER_ID,
      type: 'fill',
      source: UKRAINE_OBLAST_SOURCE_ID,
      paint: {
        'fill-color': '#000000',
        'fill-opacity': 0,
      },
    });
  }

  if (!map.getLayer(UKRAINE_OBLAST_OUTLINE_LAYER_ID)) {
    map.addLayer({
      id: UKRAINE_OBLAST_OUTLINE_LAYER_ID,
      type: 'line',
      source: UKRAINE_OBLAST_SOURCE_ID,
      paint: {
        'line-color': '#FF8800',
        'line-width': 1,
      },
    });
  }
};

export const ensureMajorCitiesLayer = (map: mapboxgl.Map) => {
  if (map.getLayer(MAJOR_CITIES_LAYER_ID)) {
    return;
  }

  map.addLayer({
    id: MAJOR_CITIES_LAYER_ID,
    type: 'circle',
    source: 'composite',
    'source-layer': 'place_label',
    filter: ['match', ['get', 'name_en'], [...MAJOR_CITY_NAMES_EN], true, false],
    paint: {
      'circle-radius': 6,
      'circle-color': '#FF0000',
    },
  });
};

