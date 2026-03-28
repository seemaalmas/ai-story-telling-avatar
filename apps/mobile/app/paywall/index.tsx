import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenShell, PrimaryButton, GhostButton } from '@/components';
import { theme } from '@/theme';

const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: '🎭', text: 'Unlimited stories per day' },
  { icon: '🎙️', text: 'Custom voice narration' },
  { icon: '🌐', text: 'All 10 Indian languages' },
  { icon: '⭐', text: 'Premium story templates' },
  { icon: '👨‍👩‍👧‍👦', text: 'Family sharing (up to 5)' },
  { icon: '🚫', text: 'No ads, ever' },
];

export default function PaywallScreen() {
  const router = useRouter();

  return (
    <ScreenShell scroll style={styles.container}>
      <GhostButton title="✕ Close" onPress={() => router.back()} style={styles.close} accessibilityLabel="Close paywall" />

      <Text style={styles.badge}>✨ PREMIUM</Text>
      <Text style={styles.title} accessibilityRole="header">Unlock the Full Katha Experience</Text>

      <View style={styles.features}>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featureRow} accessibilityLabel={f.text}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.priceCard}>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.planName}>Monthly</Text>
            <Text style={styles.planPrice}>₹149/mo</Text>
          </View>
          <PrimaryButton title="Subscribe" onPress={() => {}} style={styles.subBtn} accessibilityLabel="Subscribe monthly at 149 rupees" />
        </View>
        <View style={styles.divider} />
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.planName}>Yearly</Text>
            <Text style={styles.planPrice}>₹999/yr</Text>
            <Text style={styles.planSave}>Save 44%</Text>
          </View>
          <PrimaryButton title="Subscribe" onPress={() => {}} style={styles.subBtn} accessibilityLabel="Subscribe yearly at 999 rupees" />
        </View>
      </View>

      <Text style={styles.legal}>
        Payment will be charged to your App Store or Google Play account. Subscription auto-renews unless cancelled 24 hours before the end of the current period.
      </Text>

      <GhostButton title="Restore Purchases" onPress={() => {}} accessibilityLabel="Restore previous purchases" />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  close: { alignSelf: 'flex-end' },
  badge: { fontSize: 14, fontWeight: '700', color: '#D97706', backgroundColor: '#FFF5E6', paddingHorizontal: 14, paddingVertical: 6, borderRadius: theme.borderRadius.full, marginTop: 16 },
  title: { fontSize: 26, fontWeight: '700', color: theme.colors.text, textAlign: 'center', marginTop: 16, marginBottom: 24, maxWidth: width * 0.85 },
  features: { gap: 12, width: '100%', marginBottom: 32 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { fontSize: 22 },
  featureText: { fontSize: 15, color: theme.colors.text },
  priceCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: 20, width: '100%', borderWidth: 1, borderColor: theme.colors.border },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, backgroundColor: theme.colors.divider, marginVertical: 16 },
  planName: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  planPrice: { fontSize: 20, fontWeight: '700', color: theme.colors.primary, marginTop: 2 },
  planSave: { fontSize: 12, fontWeight: '600', color: theme.colors.success, marginTop: 2 },
  subBtn: { paddingHorizontal: 20, paddingVertical: 12 },
  legal: { fontSize: 11, color: theme.colors.textLight, textAlign: 'center', marginTop: 24, lineHeight: 16, paddingHorizontal: 16 },
});
