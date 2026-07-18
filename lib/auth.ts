/**
 * Masti Video — Firebase Auth helpers
 *
 * Supported providers:
 *   ✅ Email / Password  (all platforms)
 *   ✅ Google            (web via signInWithPopup)
 *   ✅ Phone / SMS OTP   (all platforms, via invisible reCAPTCHA verifier)
 *   🔒 Facebook          (requires Facebook App ID — add later)
 */

import { Platform } from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  sendPasswordResetEmail as fbResetPassword,
  type ConfirmationResult,
  type ApplicationVerifier,
} from 'firebase/auth';
import { firebaseAuth } from './firebase';

// ─── Email / Password ─────────────────────────────────────────────────────────
// Tries sign-in first; if user not found → auto-creates account.
export async function signInWithEmail(emailOrUser: string, password: string) {
  if (!emailOrUser.includes('@')) {
    return { success: false as const, error: 'Please enter a valid email address.' };
  }
  const email = emailOrUser.trim().toLowerCase();
  try {
    const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
    return { success: true as const, user: cred.user };
  } catch (err: any) {
    const code: string = err?.code ?? '';
    if (
      code === 'auth/user-not-found' ||
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password'
    ) {
      try {
        const cred2 = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        return { success: true as const, user: cred2.user };
      } catch (e2: any) {
        return { success: false as const, error: friendlyError(e2?.code) };
      }
    }
    return { success: false as const, error: friendlyError(code) };
  }
}

// ─── Google Sign-In (web only) ────────────────────────────────────────────────
export async function signInWithGoogle() {
  if (Platform.OS !== 'web') {
    return {
      success: false as const,
      error: 'Google Sign-In needs a native build. Use Email login for now.',
    };
  }
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    provider.setCustomParameters({
      prompt: 'select_account',
      client_id: '175132980753-t53ccu689gbhipdusvu117674iv50irr.apps.googleusercontent.com',
    });
    const cred = await signInWithPopup(firebaseAuth, provider);
    return { success: true as const, user: cred.user };
  } catch (err: any) {
    const code: string = err?.code ?? '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return { success: false as const, error: 'auth/popup-closed-by-user' };
    }
    return { success: false as const, error: friendlyError(code) };
  }
}

// ─── Phone / SMS OTP ──────────────────────────────────────────────────────────
// `appVerifier` is a FirebaseRecaptchaVerifierModal ref (from expo-firebase-recaptcha).
// It satisfies Firebase's required invisible reCAPTCHA check internally — no
// custom CAPTCHA UI is shown to the user in the normal case.
export async function sendPhoneOtp(fullPhoneNumber: string, appVerifier: ApplicationVerifier) {
  try {
    const confirmation = await signInWithPhoneNumber(firebaseAuth, fullPhoneNumber, appVerifier);
    return { success: true as const, confirmation };
  } catch (err: any) {
    return { success: false as const, error: friendlyError(err?.code) };
  }
}

export async function confirmPhoneOtp(confirmation: ConfirmationResult, code: string) {
  try {
    const cred = await confirmation.confirm(code);
    return { success: true as const, user: cred.user };
  } catch (err: any) {
    return { success: false as const, error: friendlyError(err?.code) };
  }
}

// ─── Forgot Password ──────────────────────────────────────────────────────────
export async function forgotPassword(email: string) {
  if (!email) return { success: false as const, error: 'Enter your email first.' };
  try {
    await fbResetPassword(firebaseAuth, email);
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, error: friendlyError(err?.code) };
  }
}

// ─── Error code → human readable ─────────────────────────────────────────────
function friendlyError(code?: string): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'Email already registered. Try logging in.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/user-not-found': 'Account not found — creating new account…',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    'auth/popup-closed-by-user': 'Sign-in window closed. Please try again.',
    'auth/popup-blocked': 'Popup blocked by browser. Allow popups and retry.',
    'auth/cancelled-popup-request': 'Sign-in cancelled.',
    'auth/operation-not-allowed':
      'This sign-in method is not enabled. Check Firebase Console → Authentication → Sign-in methods.',
    'auth/internal-error': 'Firebase internal error. Please try again.',
    'auth/invalid-phone-number': 'Please enter a valid 10-digit phone number.',
    'auth/missing-phone-number': 'Please enter a phone number.',
    'auth/invalid-verification-code': 'Incorrect OTP. Please try again.',
    'auth/code-expired': 'OTP expired. Please request a new one.',
    'auth/captcha-check-failed': 'Verification failed. Please try again.',
    'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
  };
  return (code && map[code]) || 'Something went wrong. Please try again.';
}
