'use server';

import { NextResponse } from 'next/server';

import { fetchCountryPopulation } from '@/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const country = searchParams.get('country') ?? 'Ukraine';

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
    const population = await fetchCountryPopulation(country);
    const matchedYear = population.data.populationCounts.find(
      (entry) => Number(entry.year) === Number(year)
    );

    if (!matchedYear) {
      return NextResponse.json(
        {
          error: true,
          message: `Population not found for ${country} in ${year}`,
          country,
          year: Number(year),
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      error: false,
      country,
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
      },
      { status: 500 }
    );
  }
}
