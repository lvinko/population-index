const config = {
  // env
  isDev: process.env.NODE_ENV === 'development',

  // mapbox
  mapboxAccessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,

  // firebase
  firebaseConfig: {
    apiKey: process.env.NEXT_PUBLIC_DB_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_DB_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_DB_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_DB_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_DB_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_DB_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_DB_FIREBASE_MEASUREMENT_ID
  },
}


export { config };
