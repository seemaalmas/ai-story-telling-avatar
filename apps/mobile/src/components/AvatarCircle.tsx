import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@/theme';

interface Props {
  name: string;
  imageUrl?: string;
  size?: number;
  selected?: boolean;
  style?: ViewStyle;
}

export function AvatarCircle({ name, size = 56, selected, style }: Props) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        selected && styles.selected,
        style,
      ]}
      accessibilityLabel={`Avatar: ${name}`}
    >
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  initials: {
    color: '#FFF',
    fontWeight: '700',
  },
});
