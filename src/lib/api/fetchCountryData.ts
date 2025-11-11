import axios from 'axios';
import { PopulationDataPoint } from '../utils/types';

const FALLBACK_POPULATION: PopulationDataPoint[] = [
  { year: 2010, value: 45870700 },
  { year: 2011, value: 45750000 },
  { year: 2012, value: 45550000 },
  { year: 2013, value: 45400000 },
  { year: 2014, value: 45000000 },
  { year: 2015, value: 44400000 },
  { year: 2016, value: 42800000 },
  { year: 2017, value: 42400000 },
  { year: 2018, value: 42100000 },
  { year: 2019, value: 41900000 },
  { year: 2020, value: 41700000 },
  { year: 2021, value: 41500000 },
  { year: 2022, value: 41100000 },
  { year: 2023, value: 40800000 },
];

export async function fetchUkrainePopulation(): Promise<PopulationDataPoint[]> {
  try {
    const res = await axios.get('https://country.space/api/v0.1/population/ukraine', {
      timeout: 5000,
    });
    const data = res.data?.data?.populationCounts;
    if (!Array.isArray(data) || data.length === 0) {
      return FALLBACK_POPULATION;
    }
    return data;
  } catch (error) {
    console.error('Failed to fetch Ukraine population data. Falling back to local dataset.', error);
    return FALLBACK_POPULATION;
  }
}

