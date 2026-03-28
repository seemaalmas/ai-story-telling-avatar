import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '@/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  icon?: React.ReactNode;
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  style,
  textStyle,
  accessibilityLabel,
  icon,
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.primary, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.primaryText, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function SecondaryButton({ title, onPress, disabled, loading, style, textStyle, accessibilityLabel, icon }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.secondary, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.primary} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.secondaryText, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function GhostButton({ title, onPress, disabled, style, textStyle, accessibilityLabel }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.ghost, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
    >
      <Text style={[styles.ghostText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 52,
  },
  primaryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondary: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 52,
  },
  secondaryText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  ghost: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  ghostText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
