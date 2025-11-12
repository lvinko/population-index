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
  const iso3 = resolveIso3(searchParams.get('iso3') ?? searchParams.get('country'));

  try {
    const population = await fetchCountryPopulation(iso3);
    return NextResponse.json(population);
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