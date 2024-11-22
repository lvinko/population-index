'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import UkraineRegions from '@/helpers/ua.json';
import { PopulationData } from '@/types/population';
import { useMapFilter } from '@/context/MapFilterContext';

const Map = ({ data }: { data: PopulationData }) => {
  const { filters } = useMapFilter();
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // NOTE: init map
  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string;
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      // center of Ukraine
      center: [30.5233, 48.5069],
      zoom: 6
    });
    mapRef.current = map;

    return () => {
      mapRef.current?.remove();
    }
  }, []);

  // NOTE: handle map events
  useEffect(() => {
    let hoveredPolygonId: string | null;

    // Create a popup but don’t add it to the map yet
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    });

    // Add Ukraine regions layer
    mapRef.current?.on('load', () => {
      mapRef.current?.addSource('ukraine', {
        type: 'geojson',
        data: UkraineRegions as unknown as GeoJSON.FeatureCollection,
      });

      // Add fill layer for regions
      mapRef.current?.addLayer({
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
      mapRef.current?.addLayer({
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
    mapRef.current?.on('mousemove', 'ukraine-regions', (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.GeoJSONFeature[] }) => {
      
      if (e.features && e.features.length > 0) {
        if (!!hoveredPolygonId) {
          mapRef.current?.setFeatureState(
            { source: 'ukraine', id: hoveredPolygonId },
            { hover: false }
          );
        }
        hoveredPolygonId = e.features[0].id?.toString() ?? null;
        mapRef.current?.setFeatureState(
          { source: 'ukraine', id: hoveredPolygonId as string },
          { hover: true }
        );
        const region = e.features[0]?.properties?.name;
        const regionId = e.features[0]?.properties?.id;
        const yearData = data.find((item) => item.year === filters.year);
        const regionData = yearData?.regions.find((r) => r.code === regionId);
        const population = regionData?.dataset.population.find((p) => p.type === filters.type)?.value;
        let hint = '';
        if (regionId === 'UA43') {
          hint = 'Дані втрачені через агресію росії';
        }

        // Set popup content
        popup.setLngLat(e.lngLat)
          .setHTML(`<div class="tooltip text-sm text-gray-500"><strong>${region}</strong><br>Population: ${population}<br><small>${hint}</small></div>`)
          .addTo(mapRef.current as mapboxgl.Map);
      }
    });

    // When the mouse leaves the state-fill layer, update the feature state of the
    // previously hovered feature.
    mapRef.current?.on('mouseleave', 'ukraine-regions', () => {
      if (!!hoveredPolygonId) {
        mapRef.current?.setFeatureState(
          { source: 'ukraine', id: hoveredPolygonId },
          { hover: false }
        );
      }
      hoveredPolygonId = null;

      popup.remove();
    });
  }, [filters]);

  return <div id="map" className="flex-1 w-full h-full"></div>
}

export default Map;