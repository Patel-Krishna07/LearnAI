// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// We check if the API key is provided before initializing Firebase.
// This prevents the app from crashing if the .env file is not configured.
const isFirebaseConfigured = firebaseConfig.apiKey;

let auth = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (e) {
      console.error("Firebase initialization failed. Please check your configuration in the .env file.", e);
      auth = null;
      googleProvider = null;
  }
} else {
  // This message will be visible in the browser's developer console.
  console.warn("Firebase API key is missing. Firebase authentication will be disabled. Please add NEXT_PUBLIC_FIREBASE_API_KEY to your .env file.");
}

export { auth, googleProvider };
