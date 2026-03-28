import React, { useState, useRef } from 'react';
import { View, Text, TextInput as RNTextInput, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { ScreenShell, PrimaryButton, GhostButton, ErrorBox } from '@/components';
import { theme } from '@/theme';

const OTP_LENGTH = 6;

export default function OtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const refs = useRef<Array<RNTextInput | null>>([]);

  const handleDigit = (text: string, index: number) => {
    const next = [...digits];
    next[index] = text.slice(-1);
    setDigits(next);
    if (text && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter the full OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // TODO: call api.post('/auth/otp/verify', { email, code })
      // Mock success for now
      await setTokens('mock-access-token', 'mock-refresh-token');
      setUser({
        id: 'mock-user',
        email: email ?? 'user@example.com',
        name: 'Katha User',
        preferredLanguage: 'en',
        role: 'USER',
        emailVerified: true,
      });
      router.replace('/(tabs)/home');
    } catch {
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell scroll style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">Enter OTP</Text>
      <Text style={styles.subtitle}>
        We sent a 6-digit code to{'\n'}
        <Text style={styles.email}>{email}</Text>
      </Text>

      <View style={styles.otpRow} accessibilityLabel="OTP input">
        {digits.map((d, i) => (
          <RNTextInput
            key={i}
            ref={(r) => { refs.current[i] = r; }}
            style={[styles.otpBox, d ? styles.otpBoxFilled : null]}
            value={d}
            onChangeText={(t) => handleDigit(t, i)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
            keyboardType="number-pad"
            maxLength={1}
            textContentType="oneTimeCode"
            accessibilityLabel={`Digit ${i + 1}`}
          />
        ))}
      </View>

      {error ? <ErrorBox message={error} /> : null}

      <PrimaryButton title="Verify" onPress={handleVerify} loading={loading} accessibilityLabel="Verify OTP" />
      <GhostButton title="Resend OTP" onPress={() => {}} accessibilityLabel="Request new OTP" />
      <GhostButton title="Change email" onPress={() => router.back()} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: theme.colors.text, marginTop: 48 },
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 32, lineHeight: 22 },
  email: { fontWeight: '600', color: theme.colors.text },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
  },
  otpBoxFilled: { borderColor: theme.colors.primary },
});
