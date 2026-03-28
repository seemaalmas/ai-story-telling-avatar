import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStoryStore } from '@/store/story.store';
import { ScreenShell, PrimaryButton, GhostButton, OptionCard, TextInput } from '@/components';
import { theme } from '@/theme';

const MODES = [
  { key: 'bedtime', icon: '🌙', title: 'Bedtime', subtitle: 'Gentle, soothing stories' },
  { key: 'warrior_success', icon: '⚔️', title: 'Warrior & Success', subtitle: 'Courage, grit, triumph' },
  { key: 'mythology', icon: '🕉️', title: 'Mythology', subtitle: 'Epics, folklore, dharma' },
  { key: 'motivation', icon: '🚀', title: 'Motivation', subtitle: 'Inspiring real-world tales' },
] as const;

const TONES = [
  { key: 'calm', icon: '🧘', title: 'Calm', subtitle: 'Peaceful and measured' },
  { key: 'funny', icon: '😄', title: 'Funny', subtitle: 'Light-hearted and playful' },
  { key: 'energetic', icon: '⚡', title: 'Energetic', subtitle: 'Fast-paced and exciting' },
] as const;

export default function StoryModeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ preselect?: string; seedId?: string }>();
  const setConfig = useStoryStore((s) => s.setConfig);

  const [mode, setMode] = useState(params.preselect ?? '');
  const [tone, setTone] = useState('');
  const [prompt, setPrompt] = useState('');
  const [step, setStep] = useState<'mode' | 'tone' | 'prompt'>('mode');

  const handleStart = () => {
    if (!mode || !tone) return;
    setConfig({
      mode: mode as 'bedtime' | 'warrior_success' | 'mythology' | 'motivation',
      tone: tone as 'calm' | 'funny' | 'energetic',
      language: 'en',
      seedId: params.seedId,
      prompt: prompt || undefined,
    });
    router.push('/story/playing');
  };

  return (
    <ScreenShell scroll>
      <GhostButton title="← Back" onPress={() => router.back()} style={styles.backBtn} />

      {step === 'mode' && (
        <>
          <Text style={styles.stepTitle} accessibilityRole="header">Choose a Story Mode</Text>
          <Text style={styles.stepSubtitle}>What kind of story are you in the mood for?</Text>
          <View style={styles.options}>
            {MODES.map((m) => (
              <OptionCard
                key={m.key}
                icon={m.icon}
                title={m.title}
                subtitle={m.subtitle}
                selected={mode === m.key}
                onPress={() => setMode(m.key)}
              />
            ))}
          </View>
          <PrimaryButton
            title="Next: Choose Tone"
            onPress={() => setStep('tone')}
            disabled={!mode}
            style={styles.nextBtn}
          />
        </>
      )}

      {step === 'tone' && (
        <>
          <Text style={styles.stepTitle} accessibilityRole="header">Set the Tone</Text>
          <Text style={styles.stepSubtitle}>How should the story feel?</Text>
          <View style={styles.options}>
            {TONES.map((t) => (
              <OptionCard
                key={t.key}
                icon={t.icon}
                title={t.title}
                subtitle={t.subtitle}
                selected={tone === t.key}
                onPress={() => setTone(t.key)}
              />
            ))}
          </View>
          <PrimaryButton
            title="Next: Story Prompt"
            onPress={() => setStep('prompt')}
            disabled={!tone}
            style={styles.nextBtn}
          />
          <GhostButton title="← Change Mode" onPress={() => setStep('mode')} />
        </>
      )}

      {step === 'prompt' && (
        <>
          <Text style={styles.stepTitle} accessibilityRole="header">Your Story Prompt</Text>
          <Text style={styles.stepSubtitle}>Optional — describe what the story should be about, or leave blank for a surprise!</Text>
          <TextInput
            placeholder="A brave girl who tames a river dragon..."
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={4}
            style={styles.promptInput}
            maxLength={1000}
            accessibilityLabel="Story prompt"
          />
          <Text style={styles.charCount}>{prompt.length}/1000</Text>

          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Mode: <Text style={styles.summaryValue}>{MODES.find((m) => m.key === mode)?.title}</Text></Text>
            <Text style={styles.summaryLabel}>Tone: <Text style={styles.summaryValue}>{TONES.find((t) => t.key === tone)?.title}</Text></Text>
          </View>

          <PrimaryButton title="Start Story ✨" onPress={handleStart} style={styles.nextBtn} accessibilityLabel="Begin the story" />
          <GhostButton title="← Change Tone" onPress={() => setStep('tone')} />
        </>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  backBtn: { alignSelf: 'flex-start' },
  stepTitle: { fontSize: 24, fontWeight: '700', color: theme.colors.text, marginTop: 8 },
  stepSubtitle: { fontSize: 15, color: theme.colors.textSecondary, marginTop: 4, marginBottom: 20, lineHeight: 22 },
  options: { gap: 10, marginBottom: 16 },
  nextBtn: { marginTop: 8 },
  promptInput: { height: 120, textAlignVertical: 'top' },
  charCount: { fontSize: 12, color: theme.colors.textLight, textAlign: 'right', marginTop: -8, marginBottom: 16 },
  summary: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: 16, gap: 8, marginBottom: 16 },
  summaryLabel: { fontSize: 14, color: theme.colors.textSecondary },
  summaryValue: { fontWeight: '600', color: theme.colors.text },
});
