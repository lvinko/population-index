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

type CityPopulationRecordRaw = {
  year: number | string;
  value: number | string;
  sex?: string;
  reliability?: string;
  reliabilty?: string;
};

export type CityPopulationRecord = {
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

type CountryCitiesPopulationResponse = {
  error: boolean;
  msg: string;
  data: {
    city: string;
    country: string;
    populationCounts: CityPopulationRecordRaw[];
  }[];
};

type CountryCitiesPopulationParams = {
  country: string;
  limit?: number;
  order?: 'asc' | 'desc';
  orderBy?: string;
};

export type CityPopulationCatalogEntry = {
  city: string;
  country: string;
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
  reliability: record.reliability ?? record.reliabilty,
});

export const fetchCountryCitiesPopulation = async (
  params: CountryCitiesPopulationParams
): Promise<CityPopulationCatalogEntry[]> => {
  if (!params.country) {
    throw new Error('Country is required');
  }

  const data = await countriesNowClient
    .get('countries/population/cities/filter/q', {
      searchParams: {
        country: params.country,
        limit: params.limit ?? 200,
        order: params.order ?? 'asc',
        orderBy: params.orderBy ?? 'name',
      },
      timeout: 20000,
    })
    .json<CountryCitiesPopulationResponse>();

  if (data.error) {
    throw new Error(data.msg || 'Unable to retrieve cities population for the selected country');
  }

  return (data.data ?? [])
    .filter(
      (entry) => entry.country?.toLowerCase() === params.country.toLowerCase()
    )
    .map((entry) => ({
      city: entry.city,
      country: entry.country,
      populationCounts: (entry.populationCounts ?? []).map(normalizeCityPopulationRecord),
    }));
};
