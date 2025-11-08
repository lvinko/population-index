import mapboxgl from 'mapbox-gl';

import { HOVER_POPUP_CLASS_NAME, MAJOR_CITIES, MAJOR_CITIES_LAYER_ID, TAP_POPUP_CLASS_NAME, UNKNOWN_CITY_LABEL } from './constants';
import type { CleanupCallback, LayerEvent, MapInstance } from './types';

const getLocalizedCityName = (feature?: mapboxgl.MapboxGeoJSONFeature) => {
  const properties = feature?.properties as Record<string, unknown> | undefined;
  const nameEn =
    (properties?.name_en as string | undefined) ??
    (properties?.name as string | undefined) ??
    '';

  if (!nameEn) {
    return UNKNOWN_CITY_LABEL;
  }

  const normalized = nameEn.toLowerCase();
  const match = MAJOR_CITIES.find((city) => city.nameEn.toLowerCase() === normalized);

  return match?.nameUk ?? nameEn;
};

export const attachMajorCitiesInteractions = (
  map: MapInstance,
  cleanupCallbacks: CleanupCallback[]
) => {
  const hoverPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 12,
    className: HOVER_POPUP_CLASS_NAME,
  });

  const tapPopup = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: true,
    offset: 12,
    className: TAP_POPUP_CLASS_NAME,
  });

  const handleMouseEnter = () => {
    map.getCanvas().style.cursor = 'pointer';
  };

  const handleMouseMove = (event: LayerEvent) => {
    const feature = event.features?.[0];
    if (!feature) {
      return;
    }

    const cityName = getLocalizedCityName(feature);

    hoverPopup
      .setLngLat(event.lngLat)
      .setHTML(`<div class="text-sm font-medium">${cityName}</div>`)
      .addTo(map);
  };

  const handleMouseLeave = () => {
    map.getCanvas().style.cursor = '';
    hoverPopup.remove();
  };

  const handleClick = (event: LayerEvent) => {
    const feature = event.features?.[0];
    if (!feature) {
      return;
    }

    const cityName = getLocalizedCityName(feature);

    tapPopup
      .setLngLat(event.lngLat)
      .setHTML(`<div class="text-sm font-medium">${cityName}</div>`)
      .addTo(map);
  };

  map.on('mouseenter', MAJOR_CITIES_LAYER_ID, handleMouseEnter);
  cleanupCallbacks.push(() => map.off('mouseenter', MAJOR_CITIES_LAYER_ID, handleMouseEnter));

  map.on('mousemove', MAJOR_CITIES_LAYER_ID, handleMouseMove);
  cleanupCallbacks.push(() => map.off('mousemove', MAJOR_CITIES_LAYER_ID, handleMouseMove));

  map.on('mouseleave', MAJOR_CITIES_LAYER_ID, handleMouseLeave);
  cleanupCallbacks.push(() => map.off('mouseleave', MAJOR_CITIES_LAYER_ID, handleMouseLeave));

  map.on('click', MAJOR_CITIES_LAYER_ID, handleClick);
  cleanupCallbacks.push(() => map.off('click', MAJOR_CITIES_LAYER_ID, handleClick));

  cleanupCallbacks.push(() => {
    hoverPopup.remove();
    tapPopup.remove();
  });
};

