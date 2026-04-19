import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStoryStore, PRESET_AVATARS } from '@/store/story.store';
import { ScreenShell, PrimaryButton, GhostButton } from '@/components';
import { theme } from '@/theme';

export default function AvatarSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ preselect?: string }>();
  const setAvatar = useStoryStore((s) => s.setAvatar);
  const currentAvatarId = useStoryStore((s) => s.avatarId);

  const [selectedId, setSelectedId] = useState(currentAvatarId ?? '');
  const [customImageUri, setCustomImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setCustomImageUri(reader.result as string);
            setSelectedId('custom');
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }

    try {
      const ImagePicker = require('expo-image-picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setCustomImageUri(result.assets[0].uri);
        setSelectedId('custom');
      }
    } catch {
      // expo-image-picker not available
    }
  };

  const handleNext = () => {
    if (!selectedId) return;

    if (selectedId === 'custom' && customImageUri) {
      setAvatar({ id: 'custom', emoji: '📷', name: 'My Avatar', customImageUri });
    } else {
      const preset = PRESET_AVATARS.find((a) => a.id === selectedId);
      if (preset) {
        setAvatar({ id: preset.id, emoji: preset.emoji, name: preset.name });
      }
    }
    if (params.preselect) {
      router.push({ pathname: '/story/role', params: { preselect: params.preselect } });
    } else {
      router.push('/story/role');
    }
  };

  return (
    <ScreenShell scroll>
      <GhostButton title="← Back" onPress={() => router.back()} style={styles.backBtn} />

      <Text style={styles.title} accessibilityRole="header">Choose Your Storyteller</Text>
      <Text style={styles.subtitle}>Pick an avatar or upload your own photo</Text>

      <View style={styles.grid}>
        {PRESET_AVATARS.map((avatar) => (
          <TouchableOpacity
            key={avatar.id}
            style={[styles.avatarCard, selectedId === avatar.id && styles.avatarCardSelected]}
            onPress={() => { setSelectedId(avatar.id); setCustomImageUri(null); }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${avatar.name}: ${avatar.description}`}
            accessibilityState={{ selected: selectedId === avatar.id }}
          >
            <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
            <Text style={styles.avatarName}>{avatar.name}</Text>
            <Text style={styles.avatarDesc} numberOfLines={2}>{avatar.description}</Text>
            {selectedId === avatar.id && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>
        ))}

        {/* Custom upload card */}
        <TouchableOpacity
          style={[styles.avatarCard, styles.uploadCard, selectedId === 'custom' && styles.avatarCardSelected]}
          onPress={pickImage}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Upload your own photo"
        >
          {customImageUri ? (
            <Image source={{ uri: customImageUri }} style={styles.customImage} />
          ) : (
            <Text style={styles.uploadIcon}>📷</Text>
          )}
          <Text style={styles.avatarName}>Your Photo</Text>
          <Text style={styles.avatarDesc}>Upload an image</Text>
          {selectedId === 'custom' && <Text style={styles.check}>✓</Text>}
        </TouchableOpacity>
      </View>

      <PrimaryButton
        title="Next: Choose Role"
        onPress={handleNext}
        disabled={!selectedId}
        style={styles.nextBtn}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  backBtn: { alignSelf: 'flex-start' },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.text, marginTop: 8 },
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, marginTop: 4, marginBottom: 20, lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  avatarCard: {
    width: '47%',
    alignItems: 'center',
    padding: 16,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  avatarCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFF5F0',
  },
  avatarEmoji: { fontSize: 48, marginBottom: 8 },
  avatarName: { fontSize: 15, fontWeight: '600', color: theme.colors.text, marginBottom: 2 },
  avatarDesc: { fontSize: 11, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 16 },
  check: { position: 'absolute', top: 8, right: 8, fontSize: 16, color: theme.colors.primary, fontWeight: '700' },
  uploadCard: { borderStyle: 'dashed', borderColor: theme.colors.border, borderWidth: 2 },
  uploadIcon: { fontSize: 48, marginBottom: 8, opacity: 0.5 },
  customImage: { width: 64, height: 64, borderRadius: 32, marginBottom: 8 },
  nextBtn: { marginTop: 8 },
});
