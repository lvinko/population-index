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

export type RegionalPopulationValue = {
  year: number;
  value: number;
  type: string;
};

export type RegionDataset = {
  population: RegionalPopulationValue[];
};

export type PopulationRegion = {
  name: string;
  label: string;
  code: string;
  dataset: RegionDataset;
};

export type PopulationYearRecord = {
  name: string;
  code: string;
  year: number;
  regions: PopulationRegion[];
};

export type PopulationData = PopulationYearRecord[];

export type RegionData = {
  year: string;
  name: string;
  total: number;
  label?: string;
};

