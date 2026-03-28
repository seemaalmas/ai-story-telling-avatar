import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useSettingsStore } from '@/store/settings.store';
import { ScreenShell, AvatarCircle, SectionHeader } from '@/components';
import { theme } from '@/theme';

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  accessibilityLabel,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      <Text style={styles.rowChevron}>›</Text>
    </TouchableOpacity>
  );
}

function ToggleRow({
  icon,
  label,
  value,
  onToggle,
  accessibilityLabel,
}: {
  icon: string;
  label: string;
  value: boolean;
  onToggle: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <View style={styles.row} accessibilityRole="switch" accessibilityState={{ checked: value }}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
        thumbColor={value ? theme.colors.primary : '#f4f3f4'}
        accessibilityLabel={accessibilityLabel ?? label}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { familySafeMode, toggleFamilySafe, isPremium, language } = useSettingsStore();

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => { logout(); router.replace('/auth/login'); } },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { /* TODO: API call */ } },
      ],
    );
  };

  return (
    <ScreenShell scroll>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <AvatarCircle name={user?.name ?? 'User'} size={72} />
        <Text style={styles.profileName} accessibilityRole="header">{user?.name ?? 'Katha User'}</Text>
        <Text style={styles.profileEmail}>{user?.email ?? 'user@example.com'}</Text>
        {!isPremium && (
          <TouchableOpacity
            style={styles.premiumBadge}
            onPress={() => router.push('/paywall')}
            accessibilityLabel="Upgrade to premium"
          >
            <Text style={styles.premiumText}>✨ Upgrade to Premium</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Settings */}
      <SectionHeader title="Settings" />
      <View style={styles.section}>
        <SettingsRow icon="🌐" label="Language" value={language.toUpperCase()} onPress={() => {}} />
        <ToggleRow icon="🛡️" label="Family Safe Mode" value={familySafeMode} onToggle={toggleFamilySafe} accessibilityLabel="Toggle family safe mode" />
        <SettingsRow icon="🔔" label="Notifications" onPress={() => {}} />
        <SettingsRow icon="🎙️" label="Voice Settings" onPress={() => {}} />
      </View>

      {/* Support */}
      <SectionHeader title="Support" />
      <View style={styles.section}>
        <SettingsRow icon="🚩" label="Report a Problem" onPress={() => router.push('/report')} />
        <SettingsRow icon="📄" label="Privacy Policy" onPress={() => {}} />
        <SettingsRow icon="📜" label="Terms of Service" onPress={() => {}} />
      </View>

      {/* Account */}
      <SectionHeader title="Account" />
      <View style={styles.section}>
        <SettingsRow icon="🚪" label="Log Out" onPress={handleLogout} />
        <TouchableOpacity style={styles.deleteRow} onPress={handleDeleteAccount} accessibilityRole="button" accessibilityLabel="Delete account permanently">
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Katha AI v0.1.0</Text>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  profileHeader: { alignItems: 'center', paddingVertical: 24 },
  profileName: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginTop: 12 },
  profileEmail: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 },
  premiumBadge: {
    marginTop: 12,
    backgroundColor: '#FFF5E6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
  },
  premiumText: { color: '#D97706', fontWeight: '600', fontSize: 13 },
  section: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    gap: 12,
  },
  rowIcon: { fontSize: 20 },
  rowLabel: { flex: 1, fontSize: 15, color: theme.colors.text },
  rowValue: { fontSize: 14, color: theme.colors.textSecondary },
  rowChevron: { fontSize: 20, color: theme.colors.textLight },
  deleteRow: { padding: 16, alignItems: 'center' },
  deleteText: { color: theme.colors.error, fontWeight: '600', fontSize: 15 },
  version: { textAlign: 'center', color: theme.colors.textLight, fontSize: 12, marginTop: 24, marginBottom: 16 },
});
