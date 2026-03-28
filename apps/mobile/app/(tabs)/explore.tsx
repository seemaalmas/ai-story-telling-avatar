import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenShell, SectionHeader, OptionCard, BottomSheet } from '@/components';
import { theme } from '@/theme';

const SEEDS = [
  { id: 'myth-hanuman-mountain', mode: 'mythology', title: "Hanuman's Great Leap", icon: '🐵', tags: ['ramayana', 'courage'] },
  { id: 'myth-ganesha-moon', mode: 'mythology', title: 'Ganesha & the Moon', icon: '🌙', tags: ['humour', 'chaturthi'] },
  { id: 'bedtime-moon-rabbit', mode: 'bedtime', title: 'The Moon Rabbit', icon: '🐰', tags: ['space', 'gentle'] },
  { id: 'warrior-cricket-dream', mode: 'warrior_success', title: 'Gully Cricket to Glory', icon: '🏏', tags: ['sports', 'mumbai'] },
  { id: 'motivation-rocket-girl', mode: 'motivation', title: 'Rocket Girl', icon: '🚀', tags: ['ISRO', 'science'] },
  { id: 'motivation-chai-entrepreneur', mode: 'motivation', title: 'The Chai Startup', icon: '☕', tags: ['business', 'grit'] },
];

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const [langSheet, setLangSheet] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');

  return (
    <ScreenShell scroll>
      <Text style={styles.title} accessibilityRole="header">Explore Stories</Text>

      {/* Language Picker */}
      <TouchableOpacity style={styles.langPicker} onPress={() => setLangSheet(true)} accessibilityLabel="Select story language">
        <Text style={styles.langLabel}>Language:</Text>
        <Text style={styles.langValue}>{LANGUAGES.find((l) => l.code === selectedLang)?.native ?? 'English'}</Text>
        <Text style={styles.langChevron}>▼</Text>
      </TouchableOpacity>

      {/* Seeds */}
      <SectionHeader title="Popular Story Templates" />
      <FlatList
        data={SEEDS}
        keyExtractor={(s) => s.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.seedItem}>
            <OptionCard
              icon={item.icon}
              title={item.title}
              subtitle={item.tags.join(' · ')}
              onPress={() => router.push({ pathname: '/story/mode', params: { seedId: item.id, preselect: item.mode } })}
              accessibilityLabel={`Start story: ${item.title}`}
            />
          </View>
        )}
      />

      {/* Language Sheet */}
      <BottomSheet visible={langSheet} onClose={() => setLangSheet(false)} title="Choose Language">
        {LANGUAGES.map((l) => (
          <OptionCard
            key={l.code}
            icon={l.code === selectedLang ? '✓' : '🌐'}
            title={l.native}
            subtitle={l.name}
            selected={l.code === selectedLang}
            onPress={() => { setSelectedLang(l.code); setLangSheet(false); }}
            accessibilityLabel={`Select ${l.name}`}
          />
        ))}
      </BottomSheet>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '700', color: theme.colors.text, marginBottom: 16 },
  langPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
    gap: 8,
  },
  langLabel: { fontSize: 14, color: theme.colors.textSecondary },
  langValue: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.colors.text },
  langChevron: { fontSize: 12, color: theme.colors.textLight },
  seedItem: { marginBottom: 10 },
});
