import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';
import { useStoryStore } from '@/store/story.store';
import { ScreenShell, PrimaryButton, GhostButton, ErrorBox, Skeleton, SyntheticLabel } from '@/components';
import { theme } from '@/theme';

const { width } = Dimensions.get('window');

export default function NowPlayingScreen() {
  const router = useRouter();
  const {
    sessionId,
    currentNode,
    turnCount,
    isGenerating,
    isPlaying,
    currentSubtitleIndex,
    error,
    mode,
    tone,
    language,
    seedId,
    prompt,
    avatarId,
    setGenerating,
    setSession,
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

  // Start story via API on mount
  useEffect(() => {
    if (!currentNode && !isGenerating && !sessionId && mode && tone) {
      const startStory = async () => {
        setGenerating(true);
        try {
          const { data } = await api.post('/story-engine/start', {
            mode,
            tone,
            language,
            ...(seedId && { seedId }),
            ...(prompt && { prompt }),
            ...(avatarId && { avatarId }),
          });
          setSession(data.sessionId, data.node, data.turnCount);
          setPlaying(true);
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          setError(msg ?? 'Failed to start story. Is the API running?');
        }
      };
      startStory();
    }
  }, [currentNode, isGenerating, sessionId, mode, tone, language, seedId, prompt, avatarId, setGenerating, setSession, setPlaying, setError]);

  const handleChoice = async (choiceId: string) => {
    if (!sessionId) return;
    setGenerating(true);
    try {
      const { data } = await api.post('/story-engine/continue', {
        sessionId,
        choiceId,
      });
      setCurrentNode(data.node, data.turnCount);
      setPlaying(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to continue story');
    }
  };

  const handleEnd = () => {
    reset();
    router.replace('/(tabs)/home');
  };

  const handleRetry = () => {
    setError(null);
    reset();
    router.replace('/story/mode');
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
          <ErrorBox message={error} onRetry={handleRetry} />
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
