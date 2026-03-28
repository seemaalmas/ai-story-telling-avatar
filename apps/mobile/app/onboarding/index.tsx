import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { ScreenShell, PrimaryButton, GhostButton } from '@/components';
import { theme } from '@/theme';

const { width } = Dimensions.get('window');

const PAGES = [
  {
    icon: '📖',
    title: 'Stories Come Alive',
    body: 'AI-powered avatars narrate personalised stories in your language.',
  },
  {
    icon: '🇮🇳',
    title: 'Made for India',
    body: 'Hindi, Tamil, Telugu, Bengali, Marathi, Kannada and more — stories in the language you love.',
  },
  {
    icon: '🛡️',
    title: 'Safe for Everyone',
    body: 'Family-safe by default. Every story is moderated. Your data stays private.',
  },
];

export default function OnboardingScreen() {
  const [page, setPage] = useState(0);
  const router = useRouter();
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);

  const finish = async () => {
    await setOnboardingComplete();
    router.replace('/auth/login');
  };

  const current = PAGES[page];

  return (
    <ScreenShell style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon} accessibilityLabel={current.title}>{current.icon}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.body}>{current.body}</Text>
      </View>

      <View style={styles.dots}>
        {PAGES.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} accessibilityLabel={`Page ${i + 1} of ${PAGES.length}`} />
        ))}
      </View>

      <View style={styles.buttons}>
        {page < PAGES.length - 1 ? (
          <>
            <PrimaryButton title="Next" onPress={() => setPage(page + 1)} accessibilityLabel="Next page" />
            <GhostButton title="Skip" onPress={finish} accessibilityLabel="Skip onboarding" />
          </>
        ) : (
          <PrimaryButton title="Get Started" onPress={finish} accessibilityLabel="Begin using Katha" />
        )}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
  content: { alignItems: 'center', paddingHorizontal: 24, flex: 1, justifyContent: 'center' },
  icon: { fontSize: 72, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: theme.colors.text, textAlign: 'center', marginBottom: 12 },
  body: { fontSize: 16, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 24, maxWidth: width * 0.8 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.border },
  dotActive: { backgroundColor: theme.colors.primary, width: 24 },
  buttons: { gap: 8, paddingHorizontal: 24, paddingBottom: 16 },
});
