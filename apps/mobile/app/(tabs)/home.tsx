import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { ScreenShell, SectionHeader, OptionCard, EmptyState, PrimaryButton, AvatarCircle, Skeleton, BottomSheet } from '@/components';
import { theme } from '@/theme';

const MODES = [
  { key: 'bedtime', icon: '🌙', title: 'Bedtime', subtitle: 'Calm stories for sleep' },
  { key: 'mythology', icon: '🕉️', title: 'Mythology', subtitle: 'Epics & folk tales' },
  { key: 'warrior_success', icon: '⚔️', title: 'Warrior', subtitle: 'Courage & triumph' },
  { key: 'motivation', icon: '🚀', title: 'Motivation', subtitle: 'Inspiring journeys' },
];

const AVATARS = [
  { id: 'dadi', name: 'Dadi', emoji: '👵' },
  { id: 'guru', name: 'Guru Ji', emoji: '🧓' },
  { id: 'rani', name: 'Rani', emoji: '👑' },
  { id: 'kavi', name: 'Kavi', emoji: '📝' },
];

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [avatarSheet, setAvatarSheet] = useState(false);

  return (
    <ScreenShell scroll>
      {/* Greeting */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting} accessibilityRole="header">
            {t('home.greeting')}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </Text>
          <Text style={styles.subtitle}>{t('home.whatStory')}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} accessibilityLabel="Go to profile">
          <AvatarCircle name={user?.name ?? 'User'} size={44} />
        </TouchableOpacity>
      </View>

      {/* Quick Start */}
      <PrimaryButton
        title={t('home.createStory')}
        onPress={() => router.push('/story/mode')}
        style={styles.createBtn}
        accessibilityLabel="Create a new story"
      />

      {/* Story Modes */}
      <SectionHeader title="Story Modes" />
      <View style={styles.modeGrid}>
        {MODES.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={styles.modeCard}
            onPress={() => router.push({ pathname: '/story/mode', params: { preselect: m.key } })}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${m.title} mode: ${m.subtitle}`}
          >
            <Text style={styles.modeIcon}>{m.icon}</Text>
            <Text style={styles.modeTitle}>{m.title}</Text>
            <Text style={styles.modeSubtitle}>{m.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Avatars */}
      <SectionHeader title="Narrators" action="See all" onAction={() => setAvatarSheet(true)} />
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={AVATARS}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.avatarItem} accessibilityLabel={`Narrator: ${item.name}`}>
            <Text style={styles.avatarEmoji}>{item.emoji}</Text>
            <Text style={styles.avatarName}>{item.name}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.avatarList}
      />

      {/* Recent Stories */}
      <SectionHeader title={t('home.recentStories')} />
      <EmptyState
        icon="📚"
        title={t('home.noStories')}
        message="Start your first story and it will appear here."
        action={<PrimaryButton title="Create Story" onPress={() => router.push('/story/mode')} />}
      />

      {/* Avatar Picker Sheet */}
      <BottomSheet visible={avatarSheet} onClose={() => setAvatarSheet(false)} title="Choose a Narrator">
        {AVATARS.map((a) => (
          <OptionCard
            key={a.id}
            icon={a.emoji}
            title={a.name}
            onPress={() => setAvatarSheet(false)}
            accessibilityLabel={`Select narrator ${a.name}`}
          />
        ))}
      </BottomSheet>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 26, fontWeight: '700', color: theme.colors.text },
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, marginTop: 2 },
  createBtn: { marginBottom: 8 },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  modeCard: {
    width: '47%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  modeIcon: { fontSize: 32, marginBottom: 8 },
  modeTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  modeSubtitle: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2, textAlign: 'center' },
  avatarList: { gap: 16, paddingVertical: 4 },
  avatarItem: { alignItems: 'center', width: 72 },
  avatarEmoji: { fontSize: 40, marginBottom: 4 },
  avatarName: { fontSize: 12, color: theme.colors.text, fontWeight: '500' },
});
