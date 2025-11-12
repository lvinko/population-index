import { NextResponse } from 'next/server';

import { fetchCityArticleSummary } from '@/server/wikidata';
import type { CityArticleParams } from '@/types/wikidata';

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<CityArticleParams>;

    if (!payload?.cityName || typeof payload.cityName !== 'string') {
      return NextResponse.json(
        { error: 'cityName is required' },
        {
          status: 400,
        }
      );
    }

    const result = await fetchCityArticleSummary({
      cityName: payload.cityName,
      fallbackNames: Array.isArray(payload.fallbackNames)
        ? payload.fallbackNames.filter((value): value is string => typeof value === 'string')
        : undefined,
      languages: Array.isArray(payload.languages)
        ? payload.languages
            .map((value) => (typeof value === 'string' ? value : null))
            .filter((value): value is string => Boolean(value))
        : undefined,
    });

    return NextResponse.json(result, {
      status: 200,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to proxy city article request', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve city data from Wikipedia',
      },
      { status: 500 }
    );
  }
}


