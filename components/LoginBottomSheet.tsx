import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  StyleSheet,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import type { ConfirmationResult } from 'firebase/auth';
import { signInWithEmail, signInWithGoogle, sendPhoneOtp, confirmPhoneOtp } from '../lib/auth';
import { firebaseConfig } from '../lib/firebase';

const { height } = Dimensions.get('window');
type Tab = 'email' | 'phone' | 'otp';

interface Props {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export default function LoginBottomSheet({ visible, onClose, onLogin }: Props) {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  // Tab
  const [activeTab, setActiveTab] = useState<Tab>('email');

  // Email tab
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

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
  const clearError = () => setError('');

  useEffect(() => {
    if (visible) {
      setError('');
      setLoading(false);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 12 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: height, duration: 280, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleEmailLogin = async () => {
    if (!emailOrUser.trim()) { setError('Please enter your email or username.'); return; }
    if (!password.trim()) { setError('Please enter your password.'); return; }
    setLoading(true); setError('');
    const res = await signInWithEmail(emailOrUser.trim(), password.trim());
    setLoading(false);
    if (res.success) onLogin();
    else setError(res.error || 'Login failed.');
  };

  const handleGoogle = async () => {
    setLoading(true); setError('');
    const res = await signInWithGoogle();
    setLoading(false);
    if (res.success) onLogin();
    else if (res.error !== 'auth/popup-closed-by-user') setError(res.error || 'Google sign-in failed.');
  };

  const handleForgotPassword = async () => {
    const { forgotPassword } = await import('../lib/auth');
    if (!emailOrUser.trim()) { setError('Enter your email above to reset password.'); return; }
    const res = await forgotPassword(emailOrUser.trim());
    if (res.success) Alert.alert('Done', 'Password reset email sent! Check your inbox.');
    else setError(res.error || 'Failed to send reset email.');
  };

  const handleSendOTP = async () => {
    if (!phone.trim() || phone.length < 10) { setError('Please enter a valid phone number.'); return; }
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
    if (res.success) onLogin();
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose} statusBarTranslucent>
      {/* Invisible reCAPTCHA verifier required by Firebase Phone Auth — renders
          nothing on screen unless Firebase itself needs a manual challenge. */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification
      />
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top || 48 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Login</Text>
              <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Brand */}
            <View style={styles.brandBlock}>
              <Text style={styles.flame}>🔥</Text>
              <Text style={styles.brandName}>Masti Video</Text>
              <Text style={styles.brandSub}>India Entertainment</Text>
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
                <View style={[styles.inputRow, !!error && styles.inputRowError]}>
                  <MaterialCommunityIcons name="email-outline" size={20} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email or Username"
                    placeholderTextColor="#555"
                    value={emailOrUser}
                    onChangeText={(t) => { setEmailOrUser(t); clearError(); }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    returnKeyType="next"
                    editable={!loading}
                  />
                </View>

                <View style={[styles.inputRow, !!error && styles.inputRowError]}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Password"
                    placeholderTextColor="#555"
                    value={password}
                    onChangeText={(t) => { setPassword(t); clearError(); }}
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleEmailLogin}
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                    <MaterialCommunityIcons
                      name={showPass ? 'eye-outline' : 'eye-off-outline'}
                      size={20} color="#888"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.forgotRow} onPress={handleForgotPassword}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── Phone Tab ── */}
            {activeTab === 'phone' && (
              <>
                <View style={[styles.inputRow, !!error && styles.inputRowError]}>
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
                <TouchableOpacity
                  style={styles.resendRow}
                  onPress={handleResendOTP}
                  disabled={loading}
                >
                  <Text style={styles.resendText}>Didn't get OTP? <Text style={styles.resendLink}>Resend</Text></Text>
                </TouchableOpacity>
              </>
            )}

            {/* Error */}
            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={15} color="#FF6B6B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Login / Send OTP / Verify button */}
            <TouchableOpacity
              onPress={getLoginAction}
              activeOpacity={0.88}
              style={[styles.loginBtnWrap, loading && styles.loginBtnDisabled]}
              disabled={loading}
            >
              <LinearGradient
                colors={['#FF2D55', '#FF6040']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginBtn}
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
              <TouchableOpacity
                style={[styles.socialCircle, styles.socialGoogle]}
                onPress={handleGoogle}
                disabled={loading}
              >
                <Text style={styles.googleG}>G</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialCircle, styles.socialFacebook]}
                onPress={() => Alert.alert('Facebook', 'Facebook Sign-In coming soon!')}
                disabled={loading}
              >
                <FontAwesome name="facebook-f" size={22} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialCircle, styles.socialPhone]}
                onPress={() => { setActiveTab('phone'); clearError(); }}
                disabled={loading}
              >
                <MaterialCommunityIcons name="phone" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Sign Up footer */}
            <View style={[styles.footerRow, { paddingBottom: insets.bottom + 8 }]}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity disabled={loading}>
                <Text style={styles.signUpText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#121212',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerBtn: { width: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  // Brand
  brandBlock: { alignItems: 'center', marginBottom: 28 },
  flame: { fontSize: 50, marginBottom: 6 },
  brandName: { color: '#FF2D55', fontSize: 28, fontWeight: '800', letterSpacing: 0.4 },
  brandSub: { color: '#999', fontSize: 14, marginTop: 4 },

  // Tab bar — pill style matching the image
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 30,
    padding: 4,
    marginBottom: 24,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 26,
  },
  tabItemActive: {
    backgroundColor: '#FF2D55',
  },
  tabLabel: { color: '#888', fontSize: 13, fontWeight: '600' },
  tabLabelActive: { color: '#fff', fontWeight: '700' },

  // Inputs
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 14,
    marginBottom: 14,
    height: 54,
  },
  inputRowError: { borderColor: '#FF6B6B' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#fff', fontSize: 15, height: '100%' },
  eyeBtn: { padding: 4 },

  // Phone tab
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
    gap: 2,
  },
  countryCodeText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  countryDivider: { width: 1, height: 22, backgroundColor: '#333', marginRight: 12 },
  phoneHint: { color: '#666', fontSize: 12, marginTop: -6, marginBottom: 18, marginLeft: 4 },

  // OTP tab
  otpHint: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 22, lineHeight: 22 },
  otpPhone: { color: '#FF2D55', fontWeight: '700' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  otpBoxFilled: { borderColor: '#FF2D55' },
  resendRow: { alignItems: 'center', marginBottom: 20 },
  resendText: { color: '#888', fontSize: 13 },
  resendLink: { color: '#FF2D55', fontWeight: '700' },

  // Forgot
  forgotRow: { alignItems: 'flex-end', marginBottom: 22, marginTop: -4 },
  forgotText: { color: '#FF2D55', fontSize: 13, fontWeight: '600' },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,107,107,0.12)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    gap: 6,
  },
  errorText: { color: '#FF6B6B', fontSize: 13, flex: 1 },

  // Login button
  loginBtnWrap: { borderRadius: 30, overflow: 'hidden', marginBottom: 24 },
  loginBtnDisabled: { opacity: 0.65 },
  loginBtn: { height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 30 },
  loginBtnText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2A2A2A' },
  dividerText: { color: '#666', fontSize: 13, marginHorizontal: 12 },

  // Social
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 30 },
  socialCircle: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  socialGoogle: { backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333' },
  googleG: { fontSize: 22, fontWeight: '800', color: '#EA4335' },
  socialFacebook: { backgroundColor: '#1877F2' },
  socialPhone: { backgroundColor: '#FF2D55' },

  // Footer
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#888', fontSize: 14 },
  signUpText: { color: '#FF2D55', fontSize: 14, fontWeight: '700' },
});
