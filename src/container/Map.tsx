'use client';

import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import UkraineRegions from '@/helpers/ua.json';

const Map = () => {
  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string;
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      // center of Ukraine
      center: [30.5233, 48.5069],
      zoom: 6
    });

    let hoveredPolygonId: string | null;

    // Create a popup but don’t add it to the map yet
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    });

    // Add Ukraine regions layer
    map.on('load', () => {
      map.addSource('ukraine', {
        type: 'geojson',
        data: UkraineRegions as any,
      });

      // // Add fill layer for regions
      map.addLayer({
        id: 'ukraine-regions',
        type: 'fill',
        source: 'ukraine',
        layout: {},
        paint: {
          'fill-color': 'rgba(100, 123, 193, 0.5)',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1,
            0.5
          ]
        }
      });

      // Add border line for regions
      map.addLayer({
        id: 'ukraine-borders',
        type: 'line',
        source: 'ukraine',
        layout: {},
        paint: {
          'line-color': '#999',
          'line-width': 2,
        },
      });
    });

    // When the user moves their mouse over the state-fill layer, we'll update the
    // feature state for the feature under the mouse.
    map.on('mousemove', 'ukraine-regions', (e: any) => {
      if (e.features && e.features.length > 0) {
        if (!!hoveredPolygonId) {
          map.setFeatureState(
            { source: 'ukraine', id: hoveredPolygonId },
            { hover: false }
          );
        }
        hoveredPolygonId = e.features[0].id;
        map.setFeatureState(
          { source: 'ukraine', id: hoveredPolygonId as string },
          { hover: true }
        );
        const region = e.features[0].properties.name;
        const population = e.features[0].properties.population || 'unknown';

        // Set popup content
        popup.setLngLat(e.lngLat)
          .setHTML(`<div class="tooltip"><strong>${region}</strong><br>Population: ${population}</div>`)
          .addTo(map);
      }
    });

    // When the mouse leaves the state-fill layer, update the feature state of the
    // previously hovered feature.
    map.on('mouseleave', 'ukraine-regions', () => {
      if (!!hoveredPolygonId) {
        map.setFeatureState(
          { source: 'ukraine', id: hoveredPolygonId },
          { hover: false }
        );
      }
      hoveredPolygonId = null;

      popup.remove();
    });

    return () => {
      map.remove();
    }
  }, []);

  return <div id="map" className="flex-1 w-full h-full"></div>
}

export default Map;