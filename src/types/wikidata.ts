export type CityArticleParams = {
  cityName: string;
  fallbackNames?: string[];
  languages?: string[];
};

export type CityArticleResponse = {
  cityLabel: string | null;
  summary: string | null;
  wikipediaUrl: string | null;
  coordinates: {
    lat: number | null;
    lon: number | null;
  } | null;
  language: string | null;
  wikidataId: string | null;
  wikidataEntity: unknown | null;
};
