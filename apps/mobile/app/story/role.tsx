import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useStoryStore, NARRATOR_ROLES } from '@/store/story.store';
import { ScreenShell, PrimaryButton, GhostButton, OptionCard } from '@/components';
import { theme } from '@/theme';

export default function RolePickerScreen() {
  const router = useRouter();
  const setNarratorRole = useStoryStore((s) => s.setNarratorRole);
  const avatarEmoji = useStoryStore((s) => s.avatarEmoji);
  const avatarName = useStoryStore((s) => s.avatarName);
  const currentRole = useStoryStore((s) => s.narratorRole);

  const [role, setRole] = useState(currentRole ?? '');

  const handleNext = () => {
    if (!role) return;
    setNarratorRole(role as typeof currentRole & string);
    router.push('/story/mode');
  };

  return (
    <ScreenShell scroll>
      <GhostButton title="← Back" onPress={() => router.back()} style={styles.backBtn} />

      <View style={styles.headerRow}>
        <Text style={styles.avatarPreview}>{avatarEmoji}</Text>
        <View>
          <Text style={styles.title} accessibilityRole="header">Choose Narrator Role</Text>
          <Text style={styles.subtitle}>How should {avatarName || 'your avatar'} tell the story?</Text>
        </View>
      </View>

      <View style={styles.options}>
        {NARRATOR_ROLES.map((r) => (
          <OptionCard
            key={r.key}
            icon={r.emoji}
            title={r.label}
            subtitle={r.voiceHint}
            selected={role === r.key}
            onPress={() => setRole(r.key)}
          />
        ))}
      </View>

      <PrimaryButton
        title="Next: Story Mode"
        onPress={handleNext}
        disabled={!role}
        style={styles.nextBtn}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  backBtn: { alignSelf: 'flex-start' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 20 },
  avatarPreview: { fontSize: 48 },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.text },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 2 },
  options: { gap: 10, marginBottom: 16 },
  nextBtn: { marginTop: 8 },
});
