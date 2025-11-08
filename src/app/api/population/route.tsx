'use server';

import { NextResponse } from 'next/server';

import { fetchCountryPopulation } from '@/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country') ?? 'Ukraine';

  try {
    const population = await fetchCountryPopulation(country);
    return NextResponse.json(population);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to fetch population data';

    return NextResponse.json(
      {
        error: true,
        message,
      },
      { status: 500 }
    );
  }
}