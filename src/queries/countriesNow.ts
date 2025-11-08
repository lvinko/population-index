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

type CityPopulationRequest = {
  country: string;
  city: string;
};

type CityPopulationRecordRaw = {
  year: number | string;
  value: number | string;
  sex?: string;
  reliability?: string;
};

type CityPopulationRecord = {
  year: number;
  value: number;
  sex?: string;
  reliability?: string;
};

type CityPopulationData = {
  country: string;
  city: string;
  populationCounts: CityPopulationRecordRaw[];
};

type CityPopulationResponse = {
  error: boolean;
  msg: string;
  data: CityPopulationData;
};

export type CityPopulationResult = {
  country: string;
  city: string;
  populationCounts: CityPopulationRecord[];
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
  iso3: string
): Promise<CountryPopulationResponse> => {
  if (!iso3) {
    throw new Error('ISO3 code is required');
  }

  const data = await countriesNowClient
    .get('countries/population/q', {
      searchParams: {
        iso3: iso3.toUpperCase(),
      },
    })
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

const normalizeCityPopulationRecord = (record: CityPopulationRecordRaw): CityPopulationRecord => ({
  year: Number(record.year),
  value: Number(record.value),
  sex: record.sex,
  reliability: record.reliability,
});

export const fetchCityPopulation = async (
  country: string,
  city: string
): Promise<CityPopulationResult> => {
  if (!country || !city) {
    throw new Error('Country and city are required');
  }

  const payload: CityPopulationRequest = {
    country,
    city,
  };

  const data = await countriesNowClient
    .post('countries/population/cities', { json: payload })
    .json<CityPopulationResponse>();

  if (data.error) {
    throw new Error(data.msg || `Unable to retrieve population for ${city}`);
  }

  return {
    country: data.data.country,
    city: data.data.city,
    populationCounts: (data.data.populationCounts ?? []).map(normalizeCityPopulationRecord),
  };
};
