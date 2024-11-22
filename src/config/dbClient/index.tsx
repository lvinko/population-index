import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { config } from "@/config";

const firebaseConfig = {
  apiKey: config.firebaseConfig.apiKey,
  authDomain: config.firebaseConfig.authDomain,
  projectId: config.firebaseConfig.projectId,
  storageBucket: config.firebaseConfig.storageBucket,
  messagingSenderId: config.firebaseConfig.messagingSenderId,
  appId: config.firebaseConfig.appId,
  measurementId: config.firebaseConfig.measurementId
};

// Initialize Firebase
const firestore = initializeApp(firebaseConfig);
if (typeof window !== 'undefined') {
  getAnalytics(firestore);
}
const db = getFirestore(firestore);

export { firestore, db };