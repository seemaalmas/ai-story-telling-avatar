import React from 'react';
import { View, StyleSheet, ViewStyle, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  padded?: boolean;
}

export function ScreenShell({ children, scroll = false, style, padded = true }: Props) {
  const insets = useSafeAreaInsets();

  const containerStyle = [
    styles.container,
    { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 },
    padded && styles.padded,
    style,
  ];

  if (scroll) {
    return (
      <ScrollView
        style={[styles.container, { paddingTop: insets.top + 8 }]}
        contentContainerStyle={[styles.scrollContent, padded && styles.padded, style]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  padded: {
    paddingHorizontal: theme.spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
});
