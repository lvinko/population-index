
import { NextResponse, NextRequest } from 'next/server';
import UkraineData from '@/helpers/ua-data.json';

export async function GET(request: NextRequest) {
  return NextResponse.json(UkraineData);
}