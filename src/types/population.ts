export type PopulationCount = {
  year: string;
  value: number;
  sex?: string;
  reliability?: string;
};

export type CountryPopulation = {
  country: string;
  code: string;
  iso3: string;
  populationCounts: PopulationCount[];
};

export type CountryPopulationResponse = {
  error: boolean;
  msg: string;
  data: CountryPopulation;
};

