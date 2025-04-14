// Firebase configuration 
import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { enableIndexedDbPersistence } from 'firebase/firestore';

// Check if Firebase environment variables are available and log status
const logEnvVarStatus = () => {
  if (typeof window === 'undefined') return;

  const envVars = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  console.log('Firebase environment variables status:', {
    apiKey: envVars.apiKey ? 'Provided ✓' : 'Missing ✗',
    authDomain: envVars.authDomain ? 'Provided ✓' : 'Missing ✗',
    projectId: envVars.projectId ? 'Provided ✓' : 'Missing ✗',
    storageBucket: envVars.storageBucket ? 'Provided ✓' : 'Missing ✗',
    messagingSenderId: envVars.messagingSenderId ? 'Provided ✓' : 'Missing ✗',
    appId: envVars.appId ? 'Provided ✓' : 'Missing ✗'
  });

  if (!envVars.apiKey) {
    console.error('NEXT_PUBLIC_FIREBASE_API_KEY is not set! Authentication will not work.')
    console.error('Please check your .env.local file and make sure it contains your Firebase API key.');
    console.error('You need to create a .env.local file in the root directory with your Firebase credentials.');
  }
};

// Log environment variables in browser
logEnvVarStatus();

// Your web app's Firebase configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only in browser environment
const getFirebaseApp = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  // Check if required Firebase config is available
  if (!firebaseConfig.apiKey) {
    console.error('Firebase initialization failed: API key is missing');
    console.error('Please check your .env.local file and restart the application');
    return null;
  }
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    console.log('Firebase successfully initialized');
    return app;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return null;
  }
};

// Get Firebase app instance
const app = getFirebaseApp();

// Initialize Firebase services
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

// Enable offline persistence for Firestore
if (db) {
  enableIndexedDbPersistence(db)
    .catch((err) => {
      console.error('Firestore persistence failed:', err.code);
    });
}

export { app };
