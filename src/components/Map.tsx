'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import UkraineRegions from '@/helpers/ua.json';
import { PopulationDataByYear } from '@/types/population';
import { useMapFilter } from '@/context/MapFilterContext';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Spinner } from './Spinner';

const Map = ({ data, isLoading }: { data: PopulationDataByYear, isLoading: boolean }) => {
  const { filters } = useMapFilter();
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const navigate = useRouter();
  const [isUserEngaged, setIsUserEngaged] = useState(false);

  // wait user engagement and then show toast to check chart data visualization page to try it
  useEffect(() => {
    const handleUserEngagement = () => {
      setIsUserEngaged(true);
      toast(() => (
        <span className="flex items-center gap-2 text-sm text-foreground bg-background p-2 rounded-md">
          Перейдіть на сторінку зі статистичними даними, щоб побачити візуалізацію на карті
          <button onClick={() => navigate.push('/stat')} className="text-blue-500">
            Перейти
          </button>
        </span>
      ));
    };
    document.addEventListener('user:engagement', handleUserEngagement);

    setTimeout(() => {
      if (!isUserEngaged) {
        document.dispatchEvent(new Event('user:engagement'));
      }
    }, 30000, { once: true });

    return () => document.removeEventListener('user:engagement', handleUserEngagement);
  }, []);

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
      if (mapRef.current?.getLayer('ukraine-regions')) {
        return;
      }

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
        const regionData = data?.regions.find((r) => r.code === regionId);
        const population = regionData?.dataset.population.find((p) => p.type === filters.type)?.value;
        // make number format
        let formattedPopulation = population?.toLocaleString();
        let hint = '';
        if (regionId === 'UA43' && filters.year > 2014) {
          hint = 'Дані втрачені через агресію рф';
        }

        if (regionId === 'UA32') {
          formattedPopulation = '🇺🇦';
        }

        // Set popup content
        popup.setLngLat(e.lngLat)
          .setHTML(`<div class="tooltip text-sm text-gray-500">
              <strong>${region}</strong><br>
              Чисельність: ${formattedPopulation}<br>
              <small>${hint ? `⚠️${hint}` : ''}</small>
            </div>`)
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

    return () => {
      // remove previous hovered polygon
      if (!!hoveredPolygonId) {
        mapRef.current?.setFeatureState(
          { source: 'ukraine', id: hoveredPolygonId },
          { hover: false }
        );
      }

      // reset popup
      popup.remove();
    }
  }, [data]);

  return <>
    <div id="map" className="flex-1 w-full h-full"></div>
    {isLoading ? <div className="flex-1 w-full h-full fixed inset-0 flex items-center justify-center"><Spinner /></div> : null}
  </>
}

export default Map;