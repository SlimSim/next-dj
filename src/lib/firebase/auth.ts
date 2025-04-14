import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google using a popup
 */
export const signInWithGoogle = async () => {
  if (!auth) {
    console.error('Firebase auth is not initialized');
    console.error('Please check if your .env.local file exists with valid Firebase credentials');
    return { user: null, error: 'Firebase auth is not initialized - check your API keys' };
  }
  
  try {
    console.log('Attempting to sign in with Google...');
    const result = await signInWithPopup(auth, googleProvider);
    console.log('Sign in successful');
    return { user: result.user, error: null };
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    
    // Provide more detailed error messages for common errors
    if (error.code === 'auth/invalid-api-key') {
      console.error('Invalid API key provided. Please check your .env.local file');
      return { user: null, error: 'Invalid API key - please check your Firebase configuration' };
    } else if (error.code === 'auth/configuration-not-found') {
      console.error('Firebase configuration is incorrect or missing');
      return { user: null, error: 'Firebase configuration error - check your project settings' };
    }
    
    return { user: null, error: `Authentication error: ${error.message}` };
  }
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  if (!auth) {
    console.error('Firebase auth is not initialized');
    return { error: 'Firebase auth is not initialized - check your configuration' };
  }
  
  try {
    console.log('Attempting to sign out...');
    await firebaseSignOut(auth);
    console.log('Sign out successful');
    return { error: null };
  } catch (error: any) {
    console.error('Error signing out:', error);
    return { error: `Sign out error: ${error.message}` };
  }
};

/**
 * Subscribe to auth state changes
 * @param callback Function to call when auth state changes
 * @returns Unsubscribe function
 */
export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
): (() => void) => {
  if (!auth) {
    console.error('Firebase auth is not initialized');
    return () => {};
  }
  
  return onAuthStateChanged(auth, callback);
};

/**
 * Get the current authenticated user
 */
export const getCurrentUser = (): User | null => {
  return auth?.currentUser || null;
};
