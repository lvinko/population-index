const config = {
  mapboxAccessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,

  // firebase
  firebaseConfig: {
    apiKey: process.env.DB_FIREBASE_API_KEY,
    authDomain: process.env.DB_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.DB_FIREBASE_PROJECT_ID,
    storageBucket: process.env.DB_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.DB_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.DB_FIREBASE_APP_ID,
    measurementId: process.env.DB_FIREBASE_MEASUREMENT_ID
  }
}


export { config };
