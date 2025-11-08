import ky from 'ky';

type PopulationQueryParams = {
  country?: string;
  year?: number;
};

const buildQueryString = (params: PopulationQueryParams) => {
  const searchParams = new URLSearchParams();

  if (params.country) {
    searchParams.set('country', params.country);
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

const getPopulationByYear = async (params: Required<Pick<PopulationQueryParams, 'year'>> & { country?: string }) => {
  const queryString = buildQueryString(params);
  return internalApi.get(`populationByYear?${queryString}`).json();
};

const getPopulation = async (params: Pick<PopulationQueryParams, 'country'> = {}) => {
  const queryString = buildQueryString(params);
  const endpoint = queryString ? `population?${queryString}` : 'population';
  return internalApi.get(endpoint).json();
};

export { getPopulationByYear, getPopulation };

export * from './countriesNow';
export * from './mapbox';
