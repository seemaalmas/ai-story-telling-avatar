import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '@/theme';

interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorBox({ message, onRetry }: Props) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.retry} accessibilityRole="button" accessibilityLabel="Retry">
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF2F2',
    borderRadius: theme.borderRadius.md,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  icon: { fontSize: 24, marginBottom: 8 },
  message: { fontSize: 14, color: theme.colors.error, textAlign: 'center' },
  retry: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.colors.error, borderRadius: theme.borderRadius.sm },
  retryText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
});
