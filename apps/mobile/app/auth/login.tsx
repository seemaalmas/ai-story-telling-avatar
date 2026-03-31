import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';
import { ScreenShell, PrimaryButton, SecondaryButton, TextInput, GhostButton } from '@/components';
import { theme } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleOtp = async () => {
    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    setError('');
    try {
      await api.post('/auth/otp/request', { email });
      router.push({ pathname: '/auth/otp', params: { email } });
    } catch {
      // Still navigate — OTP might have been sent even if response was slow
      router.push({ pathname: '/auth/otp', params: { email } });
    }
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
          error={error}
          accessibilityLabel="Email address"
        />
        <PrimaryButton title="Continue with OTP" onPress={handleOtp} accessibilityLabel="Get one-time password" />

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.line} />
        </View>

        <SecondaryButton title="Continue with Google" onPress={() => {}} accessibilityLabel="Sign in with Google" />
        {Platform.OS === 'ios' && (
          <SecondaryButton title="Continue with Apple" onPress={() => {}} accessibilityLabel="Sign in with Apple" />
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
  terms: { fontSize: 12, color: theme.colors.textLight, textAlign: 'center', marginTop: 24, lineHeight: 18 },
});
