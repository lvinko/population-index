import ky from 'ky';

import { config } from '@/config';

type GeocodingFeature = {
  center: [number, number];
  text: string;
};

type GeocodingResponse = {
  features: GeocodingFeature[];
};

type CityCoordinate = {
  displayName: string;
  canonicalName: string;
  coordinates: [number, number];
};

const mapboxGeocodingClient = ky.create({
  prefixUrl: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
  timeout: 10000,
  retry: {
    limit: 1,
  },
});

const resolveCountryCode = (country: string) => {
  if (country.toLowerCase() === 'ukraine') {
    return 'ua';
  }

  return country.slice(0, 2).toLowerCase();
};

export const fetchCityCoordinates = async (
  country: string,
  cityNames: string[]
): Promise<CityCoordinate[]> => {
  if (!config.mapboxAccessToken) {
    throw new Error('Mapbox access token is required to geocode cities.');
  }

  const countryCode = resolveCountryCode(country);

  const results = await Promise.all(
    cityNames.map(async (city) => {
      try {
        const response = await mapboxGeocodingClient
          .get(`${encodeURIComponent(city)}.json`, {
            searchParams: {
              access_token: config.mapboxAccessToken,
              limit: 1,
              country: countryCode,
              types: 'place',
              language: 'en,uk',
              autocomplete: 'false',
            },
          })
          .json<GeocodingResponse>();

        const feature = response.features[0];
        if (!feature) {
          return null;
        }

        return {
          displayName: feature.text ?? city,
          canonicalName: city,
          coordinates: feature.center,
        };
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Failed to geocode city "${city}":`, error);
        return null;
      }
    })
  );

  return results
    .filter((result): result is CityCoordinate => Boolean(result))
    .map((result) => ({
      ...result,
      displayName: result.displayName || result.canonicalName,
    }));
};

