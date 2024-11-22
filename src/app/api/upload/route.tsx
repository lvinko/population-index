import uaData from '@/helpers/ua-data.json';
import { db } from '@/config/dbClient';
import { collection, doc, runTransaction } from 'firebase/firestore';

export async function POST(request: Request) {
  // provide only for localhost
  if (request.headers.get('host') !== 'localhost:3000') {
    return Response.json({ error: 'Not allowed' }, { status: 403 });
  }

  try {
    // Track unique countries
    const processedCountries = new Set();

    await runTransaction(db, async (transaction) => {
      for (const yearData of uaData) {
        // Add country if not already added
        if (!processedCountries.has(yearData.code)) {
          const countryRef = doc(db, 'countries', yearData.code);
          transaction.set(countryRef, {
            name: yearData.name,
            code: yearData.code
          });
          processedCountries.add(yearData.code);
        }

        // Add year document with reference to country
        const yearRef = doc(collection(db, 'years'));
        transaction.set(yearRef, {
          year: yearData.year,
          countryCode: yearData.code
        });

        // Add regions with their datasets
        for (const region of yearData.regions) {
          const regionRef = doc(collection(db, 'regions'));
          transaction.set(regionRef, {
            name: region.name,
            label: region.label,
            code: region.code,
            yearId: yearRef.id,
            countryCode: yearData.code,
            dataset: region.dataset
          });
        }
      }
    });
  } catch (error) {
    console.error('Error uploading data:', error);
    return Response.json({ error: 'Failed to upload data' }, { status: 500 });
  }
  return Response.json({ message: 'Data uploaded successfully' });
}
