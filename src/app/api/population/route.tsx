
import { NextResponse } from 'next/server';
import UkraineData from '@/helpers/ua-data.json';

export async function GET() {
  return NextResponse.json(UkraineData);
}