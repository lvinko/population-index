import ky from 'ky';

type PopulationQueryParams = {
  country?: string;
  iso3?: string;
  year?: number;
};

const buildQueryString = (params: PopulationQueryParams) => {
  const searchParams = new URLSearchParams();

  if (params.country) {
    searchParams.set('country', params.country);
  }

  if (params.iso3) {
    searchParams.set('iso3', params.iso3);
  }

  if (typeof params.year === 'number') {
    searchParams.set('year', params.year.toString());
  }

  return searchParams.toString();
};

const internalApi = ky.create({
  prefixUrl: '/api',
  timeout: 10000,
  retry: {
    limit: 2,
  },
});

const withDefaultIso3 = (params: PopulationQueryParams) => {
  if (!params.country && !params.iso3) {
    return {
      ...params,
      iso3: 'UKR',
    };
  }

  return params;
};

const getPopulationByYear = async (
  params: Required<Pick<PopulationQueryParams, 'year'>> & { country?: string; iso3?: string }
) => {
  const queryString = buildQueryString(withDefaultIso3(params));
  return internalApi.get(`populationByYear?${queryString}`).json();
};

const getPopulation = async (params: Pick<PopulationQueryParams, 'country' | 'iso3'> = {}) => {
  const endpointParams = withDefaultIso3(params);
  const queryString = buildQueryString(endpointParams);
  const endpoint = queryString ? `population?${queryString}` : 'population';
  return internalApi.get(endpoint).json();
};

export { getPopulationByYear, getPopulation };

export * from './countriesNow';
export * from './mapbox';
export * from './city';
