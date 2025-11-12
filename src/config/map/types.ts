import type mapboxgl from 'mapbox-gl';

export type MapInstance = mapboxgl.Map;
export type CleanupCallback = () => void;
export type LayerEvent = mapboxgl.MapLayerMouseEvent;

