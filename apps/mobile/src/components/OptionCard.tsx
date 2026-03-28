import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { theme } from '@/theme';

interface Props {
  icon: string;
  title: string;
  subtitle?: string;
  selected?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

export function OptionCard({ icon, title, subtitle, selected, onPress, accessibilityLabel }: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ selected }}
    >
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.textWrap}>
        <Text style={[styles.title, selected && styles.titleSelected]}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {selected && <Text style={styles.check}>✓</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  cardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFF5F0',
  },
  icon: { fontSize: 28 },
  textWrap: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  titleSelected: { color: theme.colors.primary },
  subtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  check: { fontSize: 18, color: theme.colors.primary, fontWeight: '700' },
});
