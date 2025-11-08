import mapboxgl from 'mapbox-gl';

import {
  HOVER_POPUP_CLASS_NAME,
  MAJOR_CITIES_LAYER_ID,
  TAP_POPUP_CLASS_NAME,
  UNKNOWN_CITY_LABEL,
} from './constants';
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

export const attachCityInteractions = (
  map: MapInstance,
  layerId = MAJOR_CITIES_LAYER_ID
): CleanupCallback => {
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

    const cityName = getCityName(feature);

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

    const cityName = getCityName(feature);

    tapPopup.setLngLat(event.lngLat).setHTML(
      `<div class="text-sm font-medium">${cityName}</div>`
    );

    tapPopup.addTo(map);
  };

  map.on('mouseenter', layerId, handleMouseEnter);
  map.on('mousemove', layerId, handleMouseMove);
  map.on('mouseleave', layerId, handleMouseLeave);
  map.on('click', layerId, handleClick);

  return () => {
    map.off('mouseenter', layerId, handleMouseEnter);
    map.off('mousemove', layerId, handleMouseMove);
    map.off('mouseleave', layerId, handleMouseLeave);
    map.off('click', layerId, handleClick);
    hoverPopup.remove();
    tapPopup.remove();
  };
};

