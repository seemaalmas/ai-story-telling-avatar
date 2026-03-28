import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useStoryStore } from '@/store/story.store';
import { ScreenShell, PrimaryButton, GhostButton, ErrorBox, Skeleton, SyntheticLabel } from '@/components';
import { theme } from '@/theme';

const { width } = Dimensions.get('window');

export default function NowPlayingScreen() {
  const router = useRouter();
  const {
    currentNode,
    turnCount,
    isGenerating,
    isPlaying,
    currentSubtitleIndex,
    error,
    mode,
    tone,
    setGenerating,
    setCurrentNode,
    setPlaying,
    setSubtitleIndex,
    setError,
    reset,
  } = useStoryStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  // Fade in when new node arrives
  useEffect(() => {
    if (currentNode) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  }, [currentNode?.nodeId, fadeAnim]);

  // Auto-advance subtitles
  useEffect(() => {
    if (!currentNode || !isPlaying || !currentNode.subtitles.length) return;
    const sub = currentNode.subtitles[currentSubtitleIndex];
    if (!sub) return;

    const duration = sub.endMs - sub.startMs;
    const timer = setTimeout(() => {
      if (currentSubtitleIndex < currentNode.subtitles.length - 1) {
        setSubtitleIndex(currentSubtitleIndex + 1);
      } else {
        setPlaying(false);
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [currentSubtitleIndex, isPlaying, currentNode, setSubtitleIndex, setPlaying]);

  // Mock: start generating on mount if no node yet
  useEffect(() => {
    if (!currentNode && !isGenerating) {
      setGenerating(true);
      // Simulate API call delay
      const timer = setTimeout(() => {
        setCurrentNode(
          {
            nodeId: 'mock-node-1',
            text: 'The moonlight danced on the river as the storyteller cleared her throat. "Listen closely," she whispered, "for this tale has been waiting for you."\n\nThe wind carried the scent of jasmine through the village, and every child leaned in closer.',
            choices: [
              { choiceId: 'c1', label: 'Follow the river downstream', hint: 'Where the fireflies gather', icon: '🌊' },
              { choiceId: 'c2', label: 'Climb the ancient banyan tree', hint: 'To see the stars up close', icon: '🌳' },
              { choiceId: 'c3', label: 'Ask the storyteller a question', hint: 'She knows all the secrets', icon: '🙋' },
            ],
            animationCues: [
              { timestampMs: 0, durationMs: 2000, type: 'expression', value: 'wonder', intensity: 0.8 },
              { timestampMs: 3000, durationMs: 1500, type: 'gesture', value: 'lean_in', intensity: 0.6 },
            ],
            subtitles: [
              { startMs: 0, endMs: 3000, text: 'The moonlight danced on the river as the storyteller cleared her throat.' },
              { startMs: 3000, endMs: 5500, text: '"Listen closely," she whispered, "for this tale has been waiting for you."' },
              { startMs: 5500, endMs: 9000, text: 'The wind carried the scent of jasmine through the village, and every child leaned in closer.' },
            ],
            isEnding: false,
          },
          1,
        );
        setPlaying(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentNode, isGenerating, setGenerating, setCurrentNode, setPlaying]);

  const handleChoice = (choiceId: string) => {
    setGenerating(true);
    // TODO: call api.post('/story-engine/continue', { sessionId, choiceId })
    setTimeout(() => {
      setCurrentNode(
        {
          nodeId: `mock-node-${turnCount + 1}`,
          text: 'The path opened before you, shimmering with possibilities. Each step revealed something new — a hidden garden, a talking parrot, a door made of clouds.',
          choices:
            turnCount >= 4
              ? []
              : [
                  { choiceId: 'c1', label: 'Enter the hidden garden', icon: '🌺' },
                  { choiceId: 'c2', label: 'Follow the parrot', icon: '🦜' },
                ],
          animationCues: [{ timestampMs: 0, durationMs: 2000, type: 'expression', value: 'excited', intensity: 0.9 }],
          subtitles: [
            { startMs: 0, endMs: 3000, text: 'The path opened before you, shimmering with possibilities.' },
            { startMs: 3000, endMs: 6500, text: 'Each step revealed something new — a hidden garden, a talking parrot, a door made of clouds.' },
          ],
          isEnding: turnCount >= 4,
        },
        turnCount + 1,
      );
      setPlaying(true);
    }, 1200);
  };

  const handleEnd = () => {
    reset();
    router.replace('/(tabs)/home');
  };

  return (
    <ScreenShell>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.turnBadge} accessibilityLabel={`Turn ${turnCount}`}>Turn {turnCount}</Text>
        <SyntheticLabel />
        <GhostButton title="End" onPress={handleEnd} />
      </View>

      {/* Avatar area */}
      <View style={styles.avatarArea} accessibilityLabel="Story narrator avatar">
        <Text style={styles.avatarEmoji}>
          {mode === 'bedtime' ? '🌙' : mode === 'mythology' ? '🕉️' : mode === 'warrior_success' ? '⚔️' : '🚀'}
        </Text>
        {/* Animation cue indicator */}
        {currentNode?.animationCues?.[0] && (
          <Text style={styles.cueIndicator}>{currentNode.animationCues[0].value}</Text>
        )}
      </View>

      {/* Subtitle display */}
      <View style={styles.subtitleArea}>
        {isGenerating ? (
          <Skeleton width={width * 0.7} height={20} />
        ) : currentNode?.subtitles?.[currentSubtitleIndex] ? (
          <Animated.Text style={[styles.subtitle, { opacity: fadeAnim }]} accessibilityRole="text" accessibilityLiveRegion="polite">
            {currentNode.subtitles[currentSubtitleIndex].text}
          </Animated.Text>
        ) : null}
      </View>

      {/* Story text */}
      <ScrollView ref={scrollRef} style={styles.textArea} showsVerticalScrollIndicator={false}>
        {isGenerating ? (
          <View style={styles.skeletonGroup}>
            <Skeleton width="100%" height={16} />
            <Skeleton width="90%" height={16} />
            <Skeleton width="95%" height={16} />
          </View>
        ) : error ? (
          <ErrorBox message={error} onRetry={() => setError(null)} />
        ) : (
          <Animated.Text style={[styles.storyText, { opacity: fadeAnim }]} accessibilityRole="text">
            {currentNode?.text}
          </Animated.Text>
        )}
      </ScrollView>

      {/* Choices */}
      {!isGenerating && currentNode && !currentNode.isEnding && (
        <View style={styles.choices}>
          {currentNode.choices.map((c) => (
            <TouchableOpacity
              key={c.choiceId}
              style={styles.choiceBtn}
              onPress={() => handleChoice(c.choiceId)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Choice: ${c.label}${c.hint ? `. ${c.hint}` : ''}`}
            >
              {c.icon && <Text style={styles.choiceIcon}>{c.icon}</Text>}
              <View style={styles.choiceTextWrap}>
                <Text style={styles.choiceLabel}>{c.label}</Text>
                {c.hint && <Text style={styles.choiceHint}>{c.hint}</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Ending */}
      {currentNode?.isEnding && (
        <View style={styles.ending}>
          <Text style={styles.endingText} accessibilityRole="header">The End ✨</Text>
          <PrimaryButton title="Back to Home" onPress={handleEnd} accessibilityLabel="Return to home screen" />
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  turnBadge: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary, backgroundColor: theme.colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.full },
  avatarArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    marginBottom: 16,
  },
  avatarEmoji: { fontSize: 56 },
  cueIndicator: { fontSize: 12, color: theme.colors.textLight, marginTop: 4, fontStyle: 'italic' },
  subtitleArea: { minHeight: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, fontWeight: '500', color: theme.colors.text, textAlign: 'center', lineHeight: 24 },
  textArea: { flex: 1, marginBottom: 12 },
  skeletonGroup: { gap: 10, padding: 8 },
  storyText: { fontSize: 16, color: theme.colors.text, lineHeight: 26 },
  choices: { gap: 8, marginBottom: 8 },
  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  choiceIcon: { fontSize: 20 },
  choiceTextWrap: { flex: 1 },
  choiceLabel: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  choiceHint: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  ending: { alignItems: 'center', gap: 16, paddingVertical: 24 },
  endingText: { fontSize: 28, fontWeight: '700', color: theme.colors.primary },
});
