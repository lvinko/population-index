'use server';

import { NextResponse } from 'next/server';

import { fetchCountryPopulation } from '@/queries';

const DEFAULT_COUNTRY = 'Ukraine';
const DEFAULT_ISO3 = 'UKR';

const resolveIso3 = (value: string | null) => {
  if (!value) {
    return DEFAULT_ISO3;
  }

  const normalized = value.trim();
  if (normalized.length === 3) {
    return normalized.toUpperCase();
  }

  if (normalized.toLowerCase() === 'ukraine') {
    return DEFAULT_ISO3;
  }

  return DEFAULT_ISO3;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const iso3 = resolveIso3(searchParams.get('iso3') ?? searchParams.get('country'));

  if (!year) {
    return NextResponse.json(
      {
        error: true,
        message: 'Year query parameter is required',
      },
      { status: 400 }
    );
  }

  try {
    const population = await fetchCountryPopulation(iso3);
    const matchedYear = population.data.populationCounts.find(
      (entry) => Number(entry.year) === Number(year)
    );

    if (!matchedYear) {
      return NextResponse.json(
        {
          error: true,
          message: `Population not found for ${population.data.country} (${iso3}) in ${year}`,
          country: population.data.country ?? DEFAULT_COUNTRY,
          year: Number(year),
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      error: false,
      country: population.data.country,
      iso3,
      year: Number(year),
      data: matchedYear,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to fetch population data';

    return NextResponse.json(
      {
        error: true,
        message,
        iso3,
        country: DEFAULT_COUNTRY,
      },
      { status: 500 }
    );
  }
}
