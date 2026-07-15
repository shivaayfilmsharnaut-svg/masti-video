import { getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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

export const firebaseAuth = getAuth(app);
export { firebaseConfig };
export default app;
