import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { ScreenShell, PrimaryButton, TextInput, GhostButton } from '@/components';
import { theme } from '@/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (name.trim().length < 2) return 'Please enter your name';
    if (!email.includes('@')) return 'Please enter a valid email';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      return 'Password needs an uppercase, lowercase, and a number';
    }
    if (password !== confirm) return 'Passwords do not match';
    return null;
  };

  const handleRegister = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
      });
      await setTokens(data.accessToken, data.refreshToken);
      const profileRes = await api.get('/users/me');
      await setUser(profileRes.data);
      router.replace('/(tabs)/home');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      if (status === 409) {
        Alert.alert(
          'Account exists',
          'An account with this email already exists. Would you like to sign in instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => router.replace('/auth/login') },
          ],
        );
      } else {
        setError(Array.isArray(msg) ? msg[0] : msg ?? 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell scroll style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo} accessibilityRole="header">Create account</Text>
        <Text style={styles.tagline}>Start telling stories in seconds</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Full name"
          placeholder="Priya Sharma"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
          accessibilityLabel="Full name"
        />
        <TextInput
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          accessibilityLabel="Email address"
        />
        <TextInput
          label="Password"
          placeholder="At least 8 characters"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel="Password"
        />
        <TextInput
          label="Confirm password"
          placeholder="Re-enter your password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          accessibilityLabel="Confirm password"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryButton
          title="Create account"
          onPress={handleRegister}
          loading={loading}
          accessibilityLabel="Create account"
        />
        <GhostButton
          title="Already have an account? Sign in"
          onPress={() => router.replace('/auth/login')}
        />
      </View>

      <Text style={styles.terms} accessibilityRole="text">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </Text>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
  hero: { alignItems: 'center', marginTop: 32, marginBottom: 24 },
  logo: { fontSize: 32, fontWeight: '800', color: theme.colors.primary, letterSpacing: -0.5 },
  tagline: { fontSize: 15, color: theme.colors.textSecondary, marginTop: 4 },
  form: { gap: 12 },
  errorText: { color: theme.colors.error, fontSize: 13, textAlign: 'center' },
  terms: { fontSize: 12, color: theme.colors.textLight, textAlign: 'center', marginTop: 24, lineHeight: 18 },
});
