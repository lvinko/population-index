
import { NextResponse } from 'next/server';
import UkraineData from '@/helpers/ua-data.json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const data = UkraineData.filter((item) => item.year === Number(year))[0];

  if (!year) {
    return NextResponse.json({
      data: UkraineData,
      year: 2022,
    });
  }

  return NextResponse.json({
    data,
    year: Number(year),
  });
}
