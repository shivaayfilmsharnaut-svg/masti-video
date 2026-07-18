import { getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// The web build of expo-firebase-recaptcha (used by the phone-auth invisible
// verifier on web) reaches into the legacy `firebase.app()` compat namespace,
// so the app must be created there — compat.initializeApp registers into the
// same underlying app registry that the modular getApp()/getAuth() read from.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDeKh3-XpmleLD0amDHc5lblT6vTNo-J6k',
  authDomain: 'masti-video-38e71.firebaseapp.com',
  projectId: 'masti-video-38e71',
  messagingSenderId: '175132980753',
  appId: '1:175132980753:web:ac60fa3311f8ea117923b0',
};

if (firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
}

const app = getApp();

// Use AsyncStorage persistence so login session survives app restarts.
// User only needs to log in once — session is remembered until they
// explicitly log out or uninstall the app.
let firebaseAuth: ReturnType<typeof initializeAuth>;
try {
  firebaseAuth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e: any) {
  // initializeAuth throws if called more than once (e.g. hot reload).
  // Fall back to getAuth which returns the already-initialized instance.
  const { getAuth } = require('firebase/auth');
  firebaseAuth = getAuth(app);
}

export { firebaseAuth, firebaseConfig };
export default app;
