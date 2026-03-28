import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/theme';

export function SyntheticLabel() {
  return (
    <View style={styles.container} accessibilityLabel="AI-generated audio">
      <Text style={styles.icon}>🤖</Text>
      <Text style={styles.text}>AI-Generated Voice</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
    gap: 4,
  },
  icon: { fontSize: 12 },
  text: { fontSize: 11, color: theme.colors.info, fontWeight: '600' },
});
