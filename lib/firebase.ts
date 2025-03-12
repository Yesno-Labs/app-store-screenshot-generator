import { initializeApp } from "firebase/app";
import {
  getAnalytics,
  isSupported,
  logEvent as firebaseLogEvent,
} from "firebase/analytics";
// Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const isDevelopment = process.env.NODE_ENV === "development";

export const app = initializeApp(firebaseConfig);

let analyticsInstance: any = null;

export const getFirebaseAnalytics = async () => {
  if (analyticsInstance) return analyticsInstance;

  if (!isDevelopment && typeof window !== "undefined") {
    try {
      if (await isSupported()) {
        analyticsInstance = getAnalytics(app);
        return analyticsInstance;
      }
    } catch (error) {
      console.log("Firebase Analytics not available:", error);
    }
  } else if (isDevelopment) {
    console.log("Firebase Analytics disabled in development");
  }

  return null;
};

export const logEvent = async (eventName: string, eventParams?: object) => {
  const analytics = await getFirebaseAnalytics();

  if (!analytics) {
    console.log(`[Mock Analytics] Event: ${eventName}`, eventParams);
    return;
  }

  firebaseLogEvent(analytics, eventName, eventParams);
};
