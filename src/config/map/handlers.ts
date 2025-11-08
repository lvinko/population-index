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

const buildPopupContent = ({
  cityName,
  population,
  status,
}: {
  cityName: string;
  population?: number | null;
  status: 'idle' | 'loading' | 'error';
}) => {
  const safeCityName = escapeHtml(cityName);

  const populationContent =
    status === 'loading'
      ? '<span class="text-xs text-zinc-500">Завантаження населення…</span>'
      : status === 'error'
        ? '<span class="text-xs text-red-500">Не вдалося отримати населення</span>'
        : population != null
          ? `<span class="text-xs text-zinc-600">Населення: ${formatPopulation(population)}</span>`
          : '<span class="text-xs text-zinc-500">Немає даних про населення</span>';

  return `<div class="flex flex-col gap-1">
    <span class="text-sm font-medium">${safeCityName}</span>
    ${populationContent}
  </div>`;
};

type AttachCityInteractionsOptions = {
  getCityPopulation?: (cityName: string) => Promise<number | null>;
};

export const attachCityInteractions = (
  map: MapInstance,
  layerId = MAJOR_CITIES_LAYER_ID,
  options: AttachCityInteractionsOptions = {}
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

  let tapRequestId = 0;

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
      .setHTML(
        buildPopupContent({
          cityName,
          status: 'idle',
        })
      )
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
    const canonicalCityName = getCanonicalCityName(feature) || cityName;

    tapPopup
      .setLngLat(event.lngLat)
      .setHTML(
        buildPopupContent({
          cityName,
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
      .then((population) => {
        if (tapRequestId !== requestId) {
          return;
        }

        tapPopup.setLngLat(event.lngLat).setHTML(
          buildPopupContent({
            cityName,
            population,
            status: 'idle',
          })
        );
      })
      .catch(() => {
        if (tapRequestId !== requestId) {
          return;
        }

        tapPopup.setLngLat(event.lngLat).setHTML(
          buildPopupContent({
            cityName,
            status: 'error',
          })
        );
      });
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

