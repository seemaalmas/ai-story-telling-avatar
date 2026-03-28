import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/theme';

interface Props {
  text: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

const BG_MAP = {
  primary: '#FFF5F0',
  success: '#ECFDF5',
  warning: '#FFFBEB',
  error: '#FEF2F2',
  info: '#EFF6FF',
};

const TEXT_MAP = {
  primary: theme.colors.primary,
  success: theme.colors.success,
  warning: theme.colors.warning,
  error: theme.colors.error,
  info: theme.colors.info,
};

export function Badge({ text, color = 'primary' }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: BG_MAP[color] }]}>
      <Text style={[styles.text, { color: TEXT_MAP[color] }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.full },
  text: { fontSize: 12, fontWeight: '600' },
});
