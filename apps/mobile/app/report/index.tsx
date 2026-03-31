import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';
import { ScreenShell, PrimaryButton, GhostButton, TextInput, OptionCard } from '@/components';
import { theme } from '@/theme';

const CATEGORIES = [
  { key: 'impersonation', icon: '🎭', title: 'Impersonation', subtitle: 'Someone\'s voice is being faked' },
  { key: 'harassment', icon: '🚫', title: 'Harassment', subtitle: 'Bullying or threatening content' },
  { key: 'deepfake', icon: '🤖', title: 'Deepfake', subtitle: 'AI-generated misleading content' },
  { key: 'unauthorized_voice_use', icon: '🎙️', title: 'Unauthorized Voice', subtitle: 'Voice used without consent' },
  { key: 'hate_speech', icon: '💢', title: 'Hate Speech', subtitle: 'Discriminatory or hateful content' },
  { key: 'other', icon: '📋', title: 'Other', subtitle: 'Something else' },
];

export default function ReportAbuseScreen() {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!category || description.length < 10) {
      Alert.alert('Please select a category and describe the issue (at least 10 characters)');
      return;
    }
    setLoading(true);
    try {
      await api.post('/voice/abuse/report', {
        targetType: 'voice_output',
        targetId: 'app-report',
        category,
        description,
      });
      Alert.alert('Report Submitted', 'Thank you. Our team will review this within 48 hours.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell scroll>
      <GhostButton title="✕ Close" onPress={() => router.back()} style={styles.close} accessibilityLabel="Close report" />

      <Text style={styles.title} accessibilityRole="header">Report a Problem</Text>
      <Text style={styles.subtitle}>
        Help us keep Katha safe. All reports are reviewed by our trust & safety team.
      </Text>

      <Text style={styles.sectionLabel}>What happened?</Text>
      <View style={styles.categories}>
        {CATEGORIES.map((c) => (
          <OptionCard
            key={c.key}
            icon={c.icon}
            title={c.title}
            subtitle={c.subtitle}
            selected={category === c.key}
            onPress={() => setCategory(c.key)}
          />
        ))}
      </View>

      <Text style={styles.sectionLabel}>Tell us more</Text>
      <TextInput
        placeholder="Describe what you experienced..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        style={styles.descInput}
        maxLength={2000}
        accessibilityLabel="Describe the problem"
      />
      <Text style={styles.charCount}>{description.length}/2000</Text>

      <PrimaryButton
        title="Submit Report"
        onPress={handleSubmit}
        loading={loading}
        disabled={!category || description.length < 10}
        accessibilityLabel="Submit abuse report"
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  close: { alignSelf: 'flex-end' },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.text, marginTop: 8 },
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, marginTop: 4, marginBottom: 20, lineHeight: 22 },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: theme.colors.text, marginBottom: 10, marginTop: 8 },
  categories: { gap: 8, marginBottom: 20 },
  descInput: { height: 100, textAlignVertical: 'top' },
  charCount: { fontSize: 12, color: theme.colors.textLight, textAlign: 'right', marginTop: -8, marginBottom: 20 },
});
