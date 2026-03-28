import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { theme } from '@/theme';

export function LoginScreen() {
  const { t } = useTranslation();
  const login = useAuthStore((state) => state.login);

  const handleEmailLogin = () => {
    // TODO: Implement email login flow
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth
  };

  const handleAppleLogin = () => {
    // TODO: Implement Apple Sign-In
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.welcome')}</Text>
        <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.emailButton} onPress={handleEmailLogin}>
          <Text style={styles.emailButtonText}>{t('auth.continueWithEmail')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
          <Text style={styles.socialButtonText}>{t('auth.continueWithGoogle')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton} onPress={handleAppleLogin}>
          <Text style={styles.socialButtonText}>{t('auth.continueWithApple')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.terms}>{t('auth.termsNotice')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  buttons: {
    gap: 12,
  },
  emailButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  emailButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  socialButton: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  socialButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  terms: {
    marginTop: 24,
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
