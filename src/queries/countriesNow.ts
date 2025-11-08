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

type CityPopulationRequest = {
  country: string;
  city: string;
};

type CityPopulationRecord = {
  year: string;
  value: number | string;
};

type CityPopulationData = {
  country: string;
  name: string;
  populationCounts: CityPopulationRecord[];
};

type CityPopulationResponse = {
  error: boolean;
  msg: string;
  data: CityPopulationData;
};

type CityPopulationSearchRecord = {
  city?: string;
  name?: string;
  cityName?: string;
};

type CityPopulationSearchResponse = {
  error: boolean;
  msg: string;
  data: CityPopulationSearchRecord[] | null;
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

const getLatestPopulation = (records: CityPopulationRecord[]) => {
  if (!Array.isArray(records) || records.length === 0) {
    return null;
  }

  const sorted = [...records].sort((a, b) => {
    const yearA = Number.parseInt(a.year, 10);
    const yearB = Number.parseInt(b.year, 10);
    return yearB - yearA;
  });

  for (const record of sorted) {
    const numericValue =
      typeof record.value === 'number' ? record.value : Number(record.value);
    if (Number.isFinite(numericValue)) {
      return numericValue;
    }
  }

  return null;
};

const HYPHEN_REGEX = /[-–—]/g;
const DIACRITIC_REGEX = /[\u0300-\u036f]/g;
const COMMON_SUFFIXES = ['raion', 'rayon', 'district', 'region', 'oblast', 'municipality'];

const normalizeSpacing = (value: string) => value.replace(/\s+/g, ' ').trim();

const removeParentheticalSegments = (value: string) => value.replace(/\s*\(.*?\)\s*/g, ' ').trim();

const stripCommonSuffixes = (value: string) => {
  let result = value;
  let changed = false;

  do {
    changed = false;
    for (const suffix of COMMON_SUFFIXES) {
      const regex = new RegExp(`(?:\\s|-)${suffix}$`, 'i');
      if (regex.test(result)) {
        result = result.replace(regex, '');
        changed = true;
      }
    }
  } while (changed);

  return normalizeSpacing(result);
};

const removeDiacritics = (value: string) => value.normalize('NFD').replace(DIACRITIC_REGEX, '');

const removeApostrophes = (value: string) => value.replace(/[’'`]/g, '');

const adjustAdjectiveSuffixes = (value: string) =>
  value.replace(/skyi\b/gi, 'sky').replace(/skyy\b/gi, 'sky').replace(/skij\b/gi, 'sky');

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const generateCityQueryCandidates = (city: string) => {
  const queue: string[] = [];
  const seen = new Set<string>();

  const enqueue = (input: string) => {
    const normalized = normalizeSpacing(input);
    if (!normalized) {
      return;
    }

    const title = toTitleCase(normalized);
    if (!title || seen.has(title)) {
      return;
    }

    seen.add(title);
    queue.push(title);
  };

  const processVariant = (variant: string) => {
    enqueue(variant);

    const hyphenVariant = variant.replace(HYPHEN_REGEX, ' ');
    enqueue(hyphenVariant);

    const noDiacritics = removeDiacritics(hyphenVariant);
    enqueue(noDiacritics);

    const noApostrophes = removeApostrophes(noDiacritics);
    enqueue(noApostrophes);

    const stripped = stripCommonSuffixes(noApostrophes);
    enqueue(stripped);

    const adjusted = adjustAdjectiveSuffixes(stripped);
    enqueue(adjusted);
  };

  processVariant(city);

  const withoutParentheses = removeParentheticalSegments(city);
  if (withoutParentheses && withoutParentheses !== city) {
    processVariant(withoutParentheses);
  }

  return queue;
};

const fetchCityPopulationSearchSuggestions = async (
  country: string,
  query: string
): Promise<string[]> => {
  try {
    const response = await countriesNowClient
      .post('countries/population/cities/q', {
        searchParams: {
          country,
          city: query,
        },
      })
      .json<CityPopulationSearchResponse>();

    if (response.error || !Array.isArray(response.data)) {
      return [];
    }

    const suggestions = response.data
      .map((record) => record.city ?? record.name ?? record.cityName ?? '')
      .map((value) => toTitleCase(normalizeSpacing(value)))
      .filter(Boolean);

    return Array.from(new Set(suggestions));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`City population suggestions request failed for "${query}":`, error);
    return [];
  }
};

const requestCityPopulationValue = async (
  country: string,
  cityName: string
): Promise<number | null> => {
  const payload: CityPopulationRequest = {
    country,
    city: cityName,
  };

  const response = await countriesNowClient
    .post('countries/population/cities', { json: payload })
    .json<CityPopulationResponse>();

  if (response.error) {
    return null;
  }

  const latestPopulation = getLatestPopulation(response.data.populationCounts ?? []);
  return latestPopulation;
};

type CityPopulationResult = {
  city: string;
  population: number | null;
};

export const fetchCityPopulation = async (
  country: string,
  city: string
): Promise<CityPopulationResult> => {
  if (!country || !city) {
    throw new Error('Country and city are required');
  }

  const baseCity = normalizeSpacing(city);
  if (!baseCity) {
    throw new Error('City is required');
  }

  const initialCandidates = generateCityQueryCandidates(baseCity);
  const candidateNames = initialCandidates.length > 0 ? initialCandidates : [toTitleCase(baseCity)];

  let lastError: unknown = null;
  const dynamicCandidates = [...candidateNames];
  const seenCandidates = new Set(dynamicCandidates);

  for (let index = 0; index < dynamicCandidates.length; index += 1) {
    const candidate = dynamicCandidates[index];

    try {
      const population = await requestCityPopulationValue(country, candidate);

      if (population !== null) {
        return {
          city: baseCity,
          population,
        };
      }

      if (index === 0) {
        const suggestions = await fetchCityPopulationSearchSuggestions(country, candidate);
        for (const suggestion of suggestions) {
          if (!seenCandidates.has(suggestion)) {
            seenCandidates.add(suggestion);
            dynamicCandidates.push(suggestion);
          }
        }
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return {
    city: baseCity,
    population: null,
  };
};
