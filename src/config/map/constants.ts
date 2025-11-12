export const MAP_STYLE_LIGHT = 'mapbox://styles/mapbox/light-v11';
export const MAP_STYLE_DARK = 'mapbox://styles/mapbox/dark-v11';
export const MAP_STYLE = MAP_STYLE_LIGHT; // Default style
export const MAP_CENTER: [number, number] = [31.1656, 48.3794];
export const MAP_INITIAL_ZOOM = 5.5;

export const getMapStyle = (theme: 'light' | 'dark'): string => {
  return theme === 'dark' ? MAP_STYLE_DARK : MAP_STYLE_LIGHT;
};

export const UKRAINE_OBLAST_SOURCE_ID = 'ukraine-oblasts';
export const UKRAINE_OBLAST_FILL_LAYER_ID = 'ukraine-oblasts-fill';
export const UKRAINE_OBLAST_OUTLINE_LAYER_ID = 'ukraine-oblasts-outline';

export const MAJOR_CITIES_LAYER_ID = 'major-cities';
export const STATE_CITIES_SOURCE_ID = 'state-cities';
export const STATE_CITIES_LAYER_ID = 'state-cities-layer';

export const HOVER_POPUP_CLASS_NAME = 'major-cities-hover-popup';
export const TAP_POPUP_CLASS_NAME = 'major-cities-tap-popup';
export const UNKNOWN_CITY_LABEL = 'Невідоме місто';

