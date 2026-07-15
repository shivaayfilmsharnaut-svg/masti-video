import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import type { ConfirmationResult } from 'firebase/auth';
import { signInWithEmail, signInWithGoogle, forgotPassword, sendPhoneOtp, confirmPhoneOtp } from '../lib/auth';
import { firebaseConfig } from '../lib/firebase';

type Tab = 'email' | 'phone' | 'otp';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<Tab>('email');

  // Email tab
  const [emailInput, setEmailInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone tab
  const [countryCode] = useState('+91');
  const [phone, setPhone] = useState('');

  // OTP tab
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<Array<TextInput | null>>([]);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifier = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const clearError = () => setError('');

  const handleEmailLogin = async () => {
    if (!emailInput.trim()) { setError('Please enter your email.'); return; }
    if (!password.trim()) { setError('Please enter your password.'); return; }
    setLoading(true); setError('');
    const res = await signInWithEmail(emailInput.trim(), password.trim());
    setLoading(false);
    if (res.success) router.back();
    else setError(res.error || 'Login failed.');
  };

  const handleGoogle = async () => {
    setLoading(true); setError('');
    const res = await signInWithGoogle();
    setLoading(false);
    if (res.success) router.back();
    else if (res.error !== 'auth/popup-closed-by-user') setError(res.error || 'Google sign-in failed.');
  };

  const handleForgotPassword = async () => {
    if (!emailInput.trim()) { setError('Enter your email above to reset password.'); return; }
    const res = await forgotPassword(emailInput.trim());
    if (res.success) Alert.alert('Done', 'Password reset email sent! Check your inbox.');
    else setError(res.error || 'Failed to send reset email.');
  };

  const handleSendOTP = async () => {
    if (!phone.trim() || phone.length < 10) { setError('Please enter a valid 10-digit phone number.'); return; }
    if (!recaptchaVerifier.current) { setError('Verification not ready yet. Please try again in a moment.'); return; }
    setLoading(true); setError('');
    const res = await sendPhoneOtp(`${countryCode}${phone}`, recaptchaVerifier.current);
    setLoading(false);
    if (res.success) {
      confirmationRef.current = res.confirmation;
      setOtp(['', '', '', '', '', '']);
      setActiveTab('otp');
    } else {
      setError(res.error || 'Failed to send OTP.');
    }
  };

  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter the 6-digit OTP.'); return; }
    if (!confirmationRef.current) { setError('Please request a new OTP.'); return; }
    setLoading(true); setError('');
    const res = await confirmPhoneOtp(confirmationRef.current, code);
    setLoading(false);
    if (res.success) router.back();
    else setError(res.error || 'OTP verification failed.');
  };

  const handleResendOTP = async () => {
    setError('');
    await handleSendOTP();
  };

  const handleOtpChange = (val: string, idx: number) => {
    const next = [...otp];
    next[idx] = val.replace(/[^0-9]/g, '').slice(-1);
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!val && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const getLoginAction = () => {
    if (activeTab === 'email') handleEmailLogin();
    else if (activeTab === 'phone') handleSendOTP();
    else handleVerifyOTP();
  };

  const getLoginLabel = () => {
    if (activeTab === 'phone') return 'Send OTP';
    if (activeTab === 'otp') return 'Verify OTP';
    return 'Login';
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#121212' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Invisible reCAPTCHA verifier required by Firebase Phone Auth — renders
          nothing on screen unless Firebase itself needs a manual challenge. */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification
      />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: topPadding }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <StatusBar barStyle="light-content" backgroundColor="#121212" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Login</Text>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View style={styles.logoSection}>
          <Text style={styles.flameEmoji}>🔥</Text>
          <Text style={styles.appName}>Masti Video</Text>
          <Text style={styles.appSubtitle}>India Entertainment</Text>
        </View>

        {/* ── Tab Switcher ── */}
        <View style={styles.tabBar}>
          {(['email', 'phone', 'otp'] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
              onPress={() => { setActiveTab(tab); clearError(); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                {tab === 'email' ? 'Email / Username' : tab === 'phone' ? 'Phone' : 'OTP'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Email Tab ── */}
        {activeTab === 'email' && (
          <>
            <View style={[styles.inputContainer, !!error && styles.inputError]}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#777" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email or Username"
                placeholderTextColor="#555"
                value={emailInput}
                onChangeText={(t) => { setEmailInput(t); clearError(); }}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                editable={!loading}
              />
            </View>

            <View style={[styles.inputContainer, !!error && styles.inputError]}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#777" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor="#555"
                value={password}
                onChangeText={(t) => { setPassword(t); clearError(); }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleEmailLogin}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20} color="#777"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotContainer} onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Phone Tab ── */}
        {activeTab === 'phone' && (
          <>
            <View style={[styles.inputContainer, !!error && styles.inputError]}>
              <View style={styles.countryCodeBox}>
                <Text style={styles.countryCodeText}>{countryCode}</Text>
                <MaterialCommunityIcons name="chevron-down" size={16} color="#888" />
              </View>
              <View style={styles.countryDivider} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Phone Number"
                placeholderTextColor="#555"
                value={phone}
                onChangeText={(t) => { setPhone(t.replace(/[^0-9]/g, '')); clearError(); }}
                keyboardType="phone-pad"
                maxLength={10}
                returnKeyType="done"
                editable={!loading}
              />
            </View>
            <Text style={styles.phoneHint}>We'll send an OTP to verify your number</Text>
          </>
        )}

        {/* ── OTP Tab ── */}
        {activeTab === 'otp' && (
          <>
            <Text style={styles.otpHint}>
              Enter the 6-digit OTP sent to{'\n'}
              <Text style={styles.otpPhone}>{countryCode} {phone || 'your number'}</Text>
            </Text>
            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { otpRefs.current[i] = r; }}
                  style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                  value={digit}
                  onChangeText={(v) => handleOtpChange(v, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                  editable={!loading}
                />
              ))}
            </View>
            <TouchableOpacity style={styles.resendRow} onPress={handleResendOTP} disabled={loading}>
              <Text style={styles.resendText}>Didn't get OTP? <Text style={styles.resendLink}>Resend</Text></Text>
            </TouchableOpacity>
          </>
        )}

        {/* Error */}
        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={14} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          activeOpacity={0.85}
          onPress={getLoginAction}
          disabled={loading}
        >
          <LinearGradient
            colors={['#FF2D55', '#FF6040']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.loginGradient}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.loginBtnText}>{getLoginLabel()}</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social: Google + Facebook + Phone */}
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialCircle} onPress={handleGoogle} disabled={loading}>
            <Text style={styles.googleG}>G</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialCircle, styles.fbCircle]}
            onPress={() => Alert.alert('Facebook', 'Facebook Sign-In coming soon!')}
            disabled={loading}
          >
            <FontAwesome name="facebook-f" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialCircle, styles.phoneCircle]}
            onPress={() => { setActiveTab('phone'); clearError(); }}
            disabled={loading}
          >
            <MaterialCommunityIcons name="phone" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Sign Up */}
        <View style={[styles.signupRow, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity disabled={loading}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#121212', paddingHorizontal: 20 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 12, paddingBottom: 8,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },

  logoSection: { alignItems: 'center', paddingVertical: 20 },
  flameEmoji: { fontSize: 52, marginBottom: 6 },
  appName: { fontSize: 30, fontWeight: '700', color: '#FF2D55', letterSpacing: 0.3 },
  appSubtitle: { fontSize: 14, color: '#aaa', marginTop: 4 },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 30,
    padding: 4,
    marginBottom: 22,
  },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 26 },
  tabItemActive: { backgroundColor: '#FF2D55' },
  tabLabel: { color: '#777', fontSize: 12, fontWeight: '600' },
  tabLabelActive: { color: '#fff', fontWeight: '700' },

  // Inputs
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1C1C1C', borderRadius: 12,
    paddingHorizontal: 14, height: 54, marginBottom: 14,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  inputError: { borderColor: '#FF6B6B' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#fff', fontSize: 15 },
  eyeBtn: { padding: 4 },

  // Phone
  countryCodeBox: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingRight: 8 },
  countryCodeText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  countryDivider: { width: 1, height: 22, backgroundColor: '#333', marginRight: 12 },
  phoneHint: { color: '#666', fontSize: 12, marginTop: -6, marginBottom: 18, marginLeft: 4 },

  // OTP
  otpHint: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 22, lineHeight: 22 },
  otpPhone: { color: '#FF2D55', fontWeight: '700' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  otpBox: {
    width: 46, height: 54, borderRadius: 10,
    backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#2A2A2A',
    color: '#fff', fontSize: 22, fontWeight: '700',
  },
  otpBoxFilled: { borderColor: '#FF2D55' },
  resendRow: { alignItems: 'center', marginBottom: 20 },
  resendText: { color: '#888', fontSize: 13 },
  resendLink: { color: '#FF2D55', fontWeight: '700' },

  // Forgot
  forgotContainer: { alignItems: 'flex-end', marginBottom: 18, marginTop: -4 },
  forgotText: { color: '#FF2D55', fontSize: 14, fontWeight: '500' },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: 'rgba(255,107,107,0.12)',
    borderRadius: 8, padding: 10, marginBottom: 14,
  },
  errorText: { color: '#FF6B6B', fontSize: 13, flex: 1 },

  // Login button
  loginBtn: { borderRadius: 30, overflow: 'hidden', marginBottom: 26 },
  loginBtnDisabled: { opacity: 0.65 },
  loginGradient: { height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 30 },
  loginBtnText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2A2A2A' },
  dividerText: { color: '#777', fontSize: 13, marginHorizontal: 12 },

  // Social
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 30 },
  socialCircle: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: '#1C1C1C', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  fbCircle: { backgroundColor: '#1877F2', borderColor: '#1877F2' },
  phoneCircle: { backgroundColor: '#FF2D55', borderColor: '#FF2D55' },
  googleG: { fontSize: 22, fontWeight: '700', color: '#EA4335' },

  // Footer
  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signupText: { color: '#888', fontSize: 14 },
  signupLink: { color: '#FF2D55', fontSize: 14, fontWeight: '700' },
});
