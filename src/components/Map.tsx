'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { config } from '@/config';
import {
  MAP_CENTER,
  MAP_INITIAL_ZOOM,
  MAP_STYLE,
  attachMajorCitiesInteractions,
  ensureMajorCitiesLayer,
  ensureOblastLayers,
} from '@/config/map';
import type { CleanupCallback } from '@/config/map';

const Map = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    if (!config.mapboxAccessToken) {
      // eslint-disable-next-line no-console
      console.error('Mapbox access token is missing. Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN.');
      return;
    }

    (mapboxgl as unknown as { setTelemetryEnabled?: (enabled: boolean) => void }).setTelemetryEnabled?.(false);
    mapboxgl.accessToken = config.mapboxAccessToken;

    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: MAP_CENTER,
      zoom: MAP_INITIAL_ZOOM,
    });

    mapRef.current = mapInstance;

    const cleanupCallbacks: CleanupCallback[] = [];

    const handleLoad = () => {
      ensureOblastLayers(mapInstance);
      ensureMajorCitiesLayer(mapInstance);
      attachMajorCitiesInteractions(mapInstance, cleanupCallbacks);
    };

    mapInstance.on('load', handleLoad);
    cleanupCallbacks.push(() => mapInstance.off('load', handleLoad));

    return () => {
      cleanupCallbacks.forEach((cleanup) => cleanup());
      mapRef.current?.remove();
    };
  }, []);

  return <div ref={mapContainerRef} className="flex-1 w-full h-full" />;
};

export default Map;