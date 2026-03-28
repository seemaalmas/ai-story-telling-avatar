import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/auth.store';
import { theme } from '@/theme';

export default function Index() {
  const { isAuthenticated, isLoading, hasCompletedOnboarding } = useAuthStore();

  if (isLoading) {
    return (
      <View style={styles.loader} accessibilityLabel="Loading app">
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
});
