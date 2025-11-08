import ky from 'ky';

type CountryStatesRequest = {
  country: string;
};

type CountryStatesResponse = {
  error: boolean;
  msg: string;
  data: {
    name: string;
    iso3: string;
    iso2: string;
    states: {
      name: string;
      state_code: string;
    }[];
  };
};

type StateCitiesRequest = {
  country: string;
  state: string;
};

type StateCitiesResponse = {
  error: boolean;
  msg: string;
  data: string[];
};

type CountryPopulationRequest = {
  country: string;
};

type PopulationCount = {
  year: string;
  value: number;
  sex?: string;
  reliability?: string;
};

type CountryPopulationData = {
  country: string;
  code: string;
  iso3: string;
  populationCounts: PopulationCount[];
};

export type CountryPopulationResponse = {
  error: boolean;
  msg: string;
  data: CountryPopulationData;
};

const countriesNowClient = ky.create({
  prefixUrl: 'https://countriesnow.space/api/v0.1',
  headers: {
    Accept: 'application/json',
  },
  timeout: 10000,
  retry: {
    limit: 2,
  },
});

export const fetchCountryStates = async (country: string) => {
  if (!country) {
    throw new Error('Country is required');
  }

  const payload: CountryStatesRequest = { country };

  const data = await countriesNowClient
    .post('countries/states', { json: payload })
    .json<CountryStatesResponse>();

  if (data.error) {
    throw new Error(data.msg || 'Unable to retrieve states');
  }

  return data;
};

export const fetchStateCities = async (country: string, state: string) => {
  if (!country || !state) {
    throw new Error('Country and state are required');
  }

  const payload: StateCitiesRequest = { country, state };

  const data = await countriesNowClient
    .post('countries/state/cities', { json: payload })
    .json<StateCitiesResponse>();

  if (data.error) {
    throw new Error(data.msg || 'Unable to retrieve cities for the selected state');
  }

  return data;
};

export const fetchCountryPopulation = async (
  country: string
): Promise<CountryPopulationResponse> => {
  if (!country) {
    throw new Error('Country is required');
  }

  const payload: CountryPopulationRequest = { country };

  const data = await countriesNowClient
    .post('countries/population', { json: payload })
    .json<CountryPopulationResponse>();

  if (data.error) {
    throw new Error(data.msg || 'Unable to retrieve country population');
  }

  return {
    ...data,
    data: {
      ...data.data,
      populationCounts: data.data.populationCounts.map((entry) => ({
        ...entry,
        value: Number(entry.value),
      })),
    },
  };
};
