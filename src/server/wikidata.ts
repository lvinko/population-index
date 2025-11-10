import ky from 'ky';

import type { CityArticleParams, CityArticleResponse } from '@/types/wikidata';

const DEFAULT_LANGUAGES = ['uk', 'en', 'ru'];
const USER_AGENT = 'population-index-ui/1.0 (https://github.com/)';
const SUMMARY_MAX_LENGTH = 400;
const cloneCityArticle = (value: CityArticleResponse): CityArticleResponse => ({
  ...value,
  coordinates: value.coordinates ? { ...value.coordinates } : null,
});

const EMPTY_RESULT: CityArticleResponse = {
  cityLabel: null,
  summary: null,
  wikipediaUrl: null,
  coordinates: null,
  language: null,
  wikidataId: null,
  wikidataEntity: null,
};

const articleCache = new Map<string, CityArticleResponse>();

const buildCacheKey = (term: string, language: string) =>
  `${language.toLowerCase()}|${term.trim().toLowerCase()}`;

type SearchResponse = {
  query?: {
    search?: Array<{
      title: string;
    }>;
  };
};

type ArticleQueryResponse = {
  query?: {
    pages?: Array<{
      missing?: boolean;
      title?: string;
      extract?: string;
      description?: string;
      fullurl?: string;
      coordinates?: Array<{
        lat?: number;
        lon?: number;
      }>;
      pageprops?: {
        wikibase_item?: string;
      };
    }>;
  };
};

type ArticleData = {
  cityLabel: string | null;
  summary: string | null;
  wikipediaUrl: string | null;
  coordinates: {
    lat: number | null;
    lon: number | null;
  } | null;
  language: string;
  wikidataId: string | null;
};

const uniqueSearchTerms = (values: string[]) =>
  Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    )
  );

const truncateSummary = (value: string, maxLength = SUMMARY_MAX_LENGTH) => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  const truncated = trimmed.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : truncated.length)}…`;
};

const buildApiUrl = (language: string) => `https://${language}.wikipedia.org/w/api.php`;

const requestJson = async <T>(url: string, searchParams: Record<string, string>) =>
  ky
    .get(url, {
      timeout: 15000,
      searchParams,
      headers: {
        'User-Agent': USER_AGENT,
      },
    })
    .json<T>();

const findArticleTitle = async (term: string, language: string) => {
  try {
    const response = await requestJson<SearchResponse>(buildApiUrl(language), {
      action: 'query',
      list: 'search',
      srsearch: term,
      srlimit: '1',
      format: 'json',
      origin: '*',
    });

    return response.query?.search?.[0]?.title ?? null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to search Wikipedia for "${term}" (${language})`, error);
    return null;
  }
};

const fetchArticleData = async (title: string, language: string): Promise<ArticleData | null> => {
  try {
    const response = await requestJson<ArticleQueryResponse>(buildApiUrl(language), {
      action: 'query',
      prop: 'extracts|description|coordinates|info|pageprops',
      titles: title,
      exintro: '1',
      explaintext: '1',
      redirects: '1',
      inprop: 'url',
      ppprop: 'wikibase_item',
      format: 'json',
      formatversion: '2',
      origin: '*',
    });

    const pages = response.query?.pages ?? [];
    const page = pages.find((entry) => !entry.missing) ?? pages[0];
    if (!page || page.missing) {
      return null;
    }

    const rawExtract = typeof page.extract === 'string' ? page.extract.trim() : '';
    const fallbackDescription = typeof page.description === 'string' ? page.description.trim() : '';
    const summarySource = rawExtract || fallbackDescription;

    const summary = summarySource ? truncateSummary(summarySource) : null;

    const coordinatesEntry = page.coordinates?.[0];
    const coordinates = coordinatesEntry
      ? {
          lat: typeof coordinatesEntry.lat === 'number' ? coordinatesEntry.lat : null,
          lon: typeof coordinatesEntry.lon === 'number' ? coordinatesEntry.lon : null,
        }
      : null;

    const wikidataId =
      typeof page.pageprops?.wikibase_item === 'string' && page.pageprops.wikibase_item.trim().length > 0
        ? page.pageprops.wikibase_item.trim()
        : null;

    return {
      cityLabel: page.title ?? title,
      summary,
      wikipediaUrl: page.fullurl ?? null,
      coordinates,
      language,
      wikidataId,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to load article data for "${title}" (${language})`, error);
    return null;
  }
};

const fetchWikidataEntity = async (wikidataId: string) => {
  const trimmed = wikidataId.trim();
  if (!trimmed) {
    return null;
  }

  const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(trimmed)}.json`;

  try {
    const response = await ky
      .get(entityUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': USER_AGENT,
        },
      })
      .json<{ entities?: Record<string, unknown> }>();

    return response.entities?.[trimmed] ?? null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to fetch Wikidata entity for "${trimmed}"`, error);
    return null;
  }
};

const buildFallbackNames = (term: string, fallbackNames: string[] = []) =>
  uniqueSearchTerms([term, ...fallbackNames]);

export const fetchCityArticleSummary = async ({
  cityName,
  fallbackNames = [],
  languages = DEFAULT_LANGUAGES,
}: CityArticleParams): Promise<CityArticleResponse> => {
  const languageList = Array.isArray(languages) && languages.length > 0 ? languages : DEFAULT_LANGUAGES;
  const terms = buildFallbackNames(cityName, fallbackNames);

  for (const term of terms) {
    for (const language of languageList) {
      const cacheKey = buildCacheKey(term, language);
      const cached = articleCache.get(cacheKey);
      if (cached) {
        return cloneCityArticle(cached);
      }

      const title = await findArticleTitle(term, language);
      if (!title) {
        articleCache.set(cacheKey, cloneCityArticle(EMPTY_RESULT));
        continue;
      }

      const articleData = await fetchArticleData(title, language);

      if (articleData) {
        let wikidataEntity: unknown = null;

        if (articleData.wikidataId) {
          wikidataEntity = await fetchWikidataEntity(articleData.wikidataId);
        }

        const enriched: CityArticleResponse = {
          cityLabel: articleData.cityLabel,
          summary: articleData.summary,
          wikipediaUrl: articleData.wikipediaUrl,
          coordinates: articleData.coordinates,
          language: articleData.language,
          wikidataId: articleData.wikidataId ?? null,
          wikidataEntity,
        };

        articleCache.set(cacheKey, cloneCityArticle(enriched));
        if (enriched.cityLabel) {
          articleCache.set(buildCacheKey(enriched.cityLabel, language), cloneCityArticle(enriched));
        }

        return cloneCityArticle(enriched);
      }

      articleCache.set(cacheKey, cloneCityArticle(EMPTY_RESULT));
    }
  }

  return cloneCityArticle(EMPTY_RESULT);
};
