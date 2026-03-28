import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscriptionStore } from '@/store/subscription.store';
import { ScreenShell, PrimaryButton, SecondaryButton, GhostButton, ErrorBox, Badge } from '@/components';
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
  const { purchase, restore, isPremium, entitlements, isLoading, error } = useSubscriptionStore();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const platform = Platform.OS === 'ios' ? 'app_store' : 'play_store';

  const handlePurchase = async () => {
    const productId =
      selectedPlan === 'monthly'
        ? (platform === 'app_store' ? 'com.katha.ai.premium.monthly' : 'premium_monthly')
        : (platform === 'app_store' ? 'com.katha.ai.premium.yearly' : 'premium_yearly');

    // In production: use expo-in-app-purchases or react-native-iap to get the receipt
    // For now, use a mock receipt for development
    const mockReceipt = `mock_${Date.now()}`;

    const success = await purchase(platform, mockReceipt, productId);
    if (success) {
      Alert.alert('Welcome to Premium!', 'Your subscription is now active.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  const handleRestore = async () => {
    // In production: get all receipts from the device store
    const success = await restore(platform, []);
    if (success) {
      if (isPremium()) {
        Alert.alert('Restored!', 'Your premium subscription has been restored.');
      } else {
        Alert.alert('No Purchases', 'No previous purchases were found.');
      }
    }
  };

  if (isPremium()) {
    return (
      <ScreenShell scroll style={styles.container}>
        <GhostButton title="✕ Close" onPress={() => router.back()} style={styles.close} accessibilityLabel="Close" />
        <Text style={styles.activeIcon}>✨</Text>
        <Text style={styles.title} accessibilityRole="header">You're Premium!</Text>
        <Badge text={entitlements.plan.replace('_', ' ').toUpperCase()} color="success" />
        <Text style={styles.activeDetails}>
          {entitlements.expiresAt
            ? `Your subscription renews on ${new Date(entitlements.expiresAt).toLocaleDateString('en-IN')}`
            : 'Your premium features are active'}
        </Text>
        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          ))}
        </View>
      </ScreenShell>
    );
  }

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

      {/* Plan Selection */}
      <View style={styles.planCards}>
        <SecondaryButton
          title="₹999/yr — Save 44%"
          onPress={() => setSelectedPlan('yearly')}
          style={[styles.planBtn, selectedPlan === 'yearly' && styles.planBtnSelected]}
          textStyle={selectedPlan === 'yearly' ? styles.planBtnSelectedText : undefined}
          accessibilityLabel="Select yearly plan at 999 rupees"
        />
        <SecondaryButton
          title="₹149/mo"
          onPress={() => setSelectedPlan('monthly')}
          style={[styles.planBtn, selectedPlan === 'monthly' && styles.planBtnSelected]}
          textStyle={selectedPlan === 'monthly' ? styles.planBtnSelectedText : undefined}
          accessibilityLabel="Select monthly plan at 149 rupees"
        />
      </View>

      {error && <ErrorBox message={error} />}

      <PrimaryButton
        title={`Subscribe ${selectedPlan === 'yearly' ? 'Yearly' : 'Monthly'}`}
        onPress={handlePurchase}
        loading={isLoading}
        style={styles.subscribeBtn}
        accessibilityLabel={`Subscribe to ${selectedPlan} plan`}
      />

      <GhostButton title="Restore Purchases" onPress={handleRestore} accessibilityLabel="Restore previous purchases" />

      <Text style={styles.legal}>
        Payment will be charged to your {Platform.OS === 'ios' ? 'App Store' : 'Google Play'} account. Subscription auto-renews unless cancelled 24 hours before the end of the current period.
      </Text>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  close: { alignSelf: 'flex-end' },
  badge: { fontSize: 14, fontWeight: '700', color: '#D97706', backgroundColor: '#FFF5E6', paddingHorizontal: 14, paddingVertical: 6, borderRadius: theme.borderRadius.full, marginTop: 16 },
  title: { fontSize: 26, fontWeight: '700', color: theme.colors.text, textAlign: 'center', marginTop: 16, marginBottom: 24, maxWidth: width * 0.85 },
  features: { gap: 12, width: '100%', marginBottom: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { fontSize: 22 },
  featureText: { fontSize: 15, color: theme.colors.text, flex: 1 },
  checkmark: { fontSize: 16, color: theme.colors.success, fontWeight: '700' },
  planCards: { gap: 10, width: '100%', marginBottom: 16 },
  planBtn: { borderColor: theme.colors.border },
  planBtnSelected: { borderColor: theme.colors.primary, borderWidth: 2, backgroundColor: '#FFF5F0' },
  planBtnSelectedText: { color: theme.colors.primary },
  subscribeBtn: { width: '100%', marginBottom: 8 },
  legal: { fontSize: 11, color: theme.colors.textLight, textAlign: 'center', marginTop: 16, lineHeight: 16, paddingHorizontal: 16 },
  activeIcon: { fontSize: 56, marginTop: 32, marginBottom: 8 },
  activeDetails: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 12, marginBottom: 24 },
});
