import ky from 'ky';

import type { CityArticleParams, CityArticleResponse } from '@/types/wikidata';

const internalCityClient = ky.create({
  prefixUrl: '/api/city',
  timeout: 20000,
  retry: {
    limit: 1,
  },
});

export const fetchCityArticle = async (params: CityArticleParams): Promise<CityArticleResponse> => {
  const payload: CityArticleParams = {
    ...params,
    fallbackNames: params.fallbackNames?.filter((value) => value && value.trim().length > 0),
    languages: params.languages,
  };

  return internalCityClient
    .post('', {
      json: payload,
    })
    .json<CityArticleResponse>();
};


