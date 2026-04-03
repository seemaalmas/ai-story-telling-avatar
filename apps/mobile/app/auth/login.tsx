import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { ScreenShell, PrimaryButton, SecondaryButton, TextInput, GhostButton } from '@/components';
import { theme } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'otp' | 'password'>('otp');
  const [loading, setLoading] = useState(false);

  const handleOtp = async () => {
    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/otp/request', { email });
      router.push({ pathname: '/auth/otp', params: { email, ...(data.code && { devCode: data.code }) } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to send OTP. Is the API server running?');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await setTokens(data.accessToken, data.refreshToken);
      const profileRes = await api.get('/users/me');
      await setUser(profileRes.data);
      router.replace('/(tabs)/home');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert(
      'Google Sign-In',
      'Google login requires OAuth credentials (GOOGLE_CLIENT_ID) configured in .env. ' +
      'For now, use OTP or email/password login.',
      [{ text: 'OK' }],
    );
  };

  return (
    <ScreenShell scroll style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo} accessibilityRole="header">Katha</Text>
        <Text style={styles.tagline}>Stories come alive</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={error && !password ? error : undefined}
          accessibilityLabel="Email address"
        />

        {mode === 'password' && (
          <TextInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={error && password ? error : undefined}
            accessibilityLabel="Password"
          />
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {mode === 'otp' ? (
          <>
            <PrimaryButton title="Continue with OTP" onPress={handleOtp} loading={loading} accessibilityLabel="Get one-time password" />
            <GhostButton title="Use password instead" onPress={() => { setMode('password'); setError(''); }} />
          </>
        ) : (
          <>
            <PrimaryButton title="Sign In" onPress={handlePasswordLogin} loading={loading} accessibilityLabel="Sign in with password" />
            <GhostButton title="Use OTP instead" onPress={() => { setMode('otp'); setError(''); }} />
          </>
        )}

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.line} />
        </View>

        <SecondaryButton title="Continue with Google" onPress={handleGoogleLogin} accessibilityLabel="Sign in with Google" />
        {Platform.OS === 'ios' && (
          <SecondaryButton title="Continue with Apple" onPress={() => {
            Alert.alert('Apple Sign-In', 'Apple login requires OAuth credentials configured in .env.');
          }} accessibilityLabel="Sign in with Apple" />
        )}
      </View>

      <Text style={styles.terms} accessibilityRole="text">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>

      <GhostButton title="Back to onboarding" onPress={() => router.replace('/onboarding')} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
  hero: { alignItems: 'center', marginTop: 48, marginBottom: 40 },
  logo: { fontSize: 44, fontWeight: '800', color: theme.colors.primary, letterSpacing: -1 },
  tagline: { fontSize: 16, color: theme.colors.textSecondary, marginTop: 4 },
  form: { gap: 12 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  line: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: theme.colors.textLight },
  errorText: { color: theme.colors.error, fontSize: 13, textAlign: 'center' },
  terms: { fontSize: 12, color: theme.colors.textLight, textAlign: 'center', marginTop: 24, lineHeight: 18 },
});
