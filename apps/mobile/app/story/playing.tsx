import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';
import { useStoryStore, NARRATOR_ROLES } from '@/store/story.store';
import { speak, stopSpeaking } from '@/utils/tts';
import { ScreenShell, PrimaryButton, GhostButton, ErrorBox, Skeleton, SyntheticLabel } from '@/components';
import { theme } from '@/theme';

const { width } = Dimensions.get('window');

const SCENE_THEMES: Record<string, { bg: string[]; emoji: string }> = {
  bedtime: { bg: ['#1a1a4e', '#2d2b6b', '#0f0f3d'], emoji: '🌙' },
  mythology: { bg: ['#4a2c0a', '#6b3a0e', '#8b5e34'], emoji: '🕉️' },
  warrior_success: { bg: ['#3d0c0c', '#5a1a1a', '#8b2500'], emoji: '⚔️' },
  motivation: { bg: ['#0a3d0a', '#145214', '#2d6b2d'], emoji: '🚀' },
};

const EXPRESSION_EMOJIS: Record<string, string> = {
  wonder: '😮',
  smile: '😊',
  curious: '🤔',
  excited: '😄',
  sad: '😢',
  angry: '😠',
  thinking: '🤔',
  surprised: '😲',
  laugh: '😂',
  scared: '😰',
  proud: '😤',
  love: '🥰',
  calm: '😌',
  determined: '💪',
};

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
    avatarEmoji,
    avatarName,
    customImageUri,
    narratorRole,
    setGenerating,
    setSession,
    setCurrentNode,
    setPlaying,
    setSubtitleIndex,
    setError,
    reset,
  } = useStoryStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;
  const mouthAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const [currentExpression, setCurrentExpression] = useState('😊');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const sceneTheme = SCENE_THEMES[mode ?? 'bedtime'] ?? SCENE_THEMES.bedtime;
  const roleLabel = NARRATOR_ROLES.find((r) => r.key === narratorRole)?.label;

  // Lip-sync mouth animation while speaking
  useEffect(() => {
    if (!isSpeaking) {
      mouthAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(mouthAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(mouthAnim, { toValue: 0.3, duration: 100, useNativeDriver: true }),
        Animated.timing(mouthAnim, { toValue: 0.8, duration: 120, useNativeDriver: true }),
        Animated.timing(mouthAnim, { toValue: 0, duration: 130, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isSpeaking, mouthAnim]);

  // Breathing/pulse animation for avatar
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Scene background transition
  useEffect(() => {
    Animated.timing(bgAnim, { toValue: 1, duration: 1000, useNativeDriver: false }).start();
  }, [mode, bgAnim]);

  // Process animation cues for expressions
  useEffect(() => {
    if (!currentNode?.animationCues?.length) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const cue of currentNode.animationCues) {
      if (cue.type === 'expression' && EXPRESSION_EMOJIS[cue.value]) {
        const timer = setTimeout(() => {
          setCurrentExpression(EXPRESSION_EMOJIS[cue.value]);
        }, cue.timestampMs);
        timers.push(timer);

        if (cue.durationMs) {
          const resetTimer = setTimeout(() => {
            setCurrentExpression('😊');
          }, cue.timestampMs + cue.durationMs);
          timers.push(resetTimer);
        }
      }
    }
    return () => timers.forEach(clearTimeout);
  }, [currentNode?.nodeId]);

  // Fade in + speak when new node arrives
  useEffect(() => {
    if (currentNode) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      setIsSpeaking(true);
      speak(currentNode.text, language, narratorRole, () => {
        setIsSpeaking(false);
      });
    }
  }, [currentNode?.nodeId, fadeAnim, language, narratorRole]);

  // Stop TTS on unmount
  useEffect(() => {
    return () => { stopSpeaking(); };
  }, []);

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
        setIsSpeaking(false);
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
            ...(narratorRole && { narratorRole }),
          });
          setSession(data.sessionId, data.node, data.turnCount);
          setPlaying(true);
        } catch (err: unknown) {
          const axiosErr = err as { response?: { data?: { message?: string } }; code?: string; message?: string };
          let msg = axiosErr?.response?.data?.message;
          if (!msg && (axiosErr?.code === 'ECONNABORTED' || axiosErr?.message?.includes('timeout'))) {
            msg = 'Story generation timed out. Please try again.';
          }
          setError(msg ?? 'Failed to start story. Is the API running?');
        }
      };
      startStory();
    }
  }, [currentNode, isGenerating, sessionId, mode, tone, language, seedId, prompt, avatarId, narratorRole, setGenerating, setSession, setPlaying, setError]);

  const handleChoice = async (choiceId: string) => {
    if (!sessionId) return;
    stopSpeaking();
    setIsSpeaking(false);
    setGenerating(true);
    try {
      const { data } = await api.post('/story-engine/continue', {
        sessionId,
        choiceId,
      });
      setCurrentNode(data.node, data.turnCount);
      setPlaying(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; code?: string; message?: string };
      let msg = axiosErr?.response?.data?.message;
      if (!msg && (axiosErr?.code === 'ECONNABORTED' || axiosErr?.message?.includes('timeout'))) {
        msg = 'Story generation timed out. Please try again.';
      }
      setError(msg ?? 'Failed to continue story');
    }
  };

  const handleEnd = () => {
    stopSpeaking();
    setIsSpeaking(false);
    reset();
    router.replace('/(tabs)/home');
  };

  const handleRetry = () => {
    setError(null);
    reset();
    router.replace('/story/avatar');
  };

  const mouthScale = mouthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  return (
    <View style={[styles.container, { backgroundColor: sceneTheme.bg[0] }]}>
      {/* Animated background layers */}
      <Animated.View style={[styles.bgLayer, styles.bgLayer1, { backgroundColor: sceneTheme.bg[1], opacity: bgAnim }]} />
      <Animated.View style={[styles.bgLayer, styles.bgLayer2, { backgroundColor: sceneTheme.bg[2], opacity: bgAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) }]} />

      {/* Scene particles/stars effect */}
      {mode === 'bedtime' && (
        <View style={styles.starsContainer}>
          {[...Array(12)].map((_, i) => (
            <Text key={i} style={[styles.star, { left: `${(i * 8.3) % 100}%`, top: `${(i * 13.7) % 40}%`, opacity: 0.3 + (i % 4) * 0.2 }]}>
              ✦
            </Text>
          ))}
        </View>
      )}

      <ScreenShell style={styles.shell}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Text style={styles.turnBadge} accessibilityLabel={`Turn ${turnCount}`}>Turn {turnCount}</Text>
            {roleLabel && <Text style={styles.roleBadge}>{roleLabel}</Text>}
          </View>
          <SyntheticLabel />
          <GhostButton title="End" onPress={handleEnd} />
        </View>

        {/* Animated Avatar Area */}
        <View style={styles.avatarArea}>
          <Animated.View style={[styles.avatarCircle, { transform: [{ scale: pulseAnim }] }]}>
            {customImageUri ? (
              <Animated.View style={{ transform: [{ scale: mouthScale }] }}>
                <Image source={{ uri: customImageUri }} style={styles.customAvatarImage} />
              </Animated.View>
            ) : (
              <Animated.Text style={[styles.avatarEmoji, { transform: [{ scale: mouthScale }] }]}>
                {isSpeaking ? currentExpression : avatarEmoji || sceneTheme.emoji}
              </Animated.Text>
            )}

            {/* Speaking indicator ring */}
            {isSpeaking && <View style={styles.speakingRing} />}
          </Animated.View>

          {avatarName ? <Text style={styles.avatarLabel}>{avatarName}</Text> : null}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgLayer: { ...StyleSheet.absoluteFillObject },
  bgLayer1: { borderBottomLeftRadius: 200, borderBottomRightRadius: 200, height: '40%' },
  bgLayer2: { borderTopLeftRadius: 300, borderTopRightRadius: 300, top: '60%' },
  starsContainer: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  star: { position: 'absolute', fontSize: 10, color: '#FFD700' },
  shell: { flex: 1, backgroundColor: 'transparent' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  turnBadge: { fontSize: 13, fontWeight: '600', color: '#FFF', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.full, overflow: 'hidden' },
  roleBadge: { fontSize: 11, fontWeight: '500', color: '#FFD700', backgroundColor: 'rgba(255,215,0,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.borderRadius.full, overflow: 'hidden' },
  avatarArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarEmoji: { fontSize: 56 },
  customAvatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarLabel: { fontSize: 14, fontWeight: '600', color: '#FFF', marginTop: 6 },
  speakingRing: {
    position: 'absolute',
    width: 134,
    height: 134,
    borderRadius: 67,
    borderWidth: 3,
    borderColor: theme.colors.accent,
    opacity: 0.6,
  },
  cueIndicator: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontStyle: 'italic' },
  subtitleArea: { minHeight: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, fontWeight: '500', color: '#FFF', textAlign: 'center', lineHeight: 24, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  textArea: { flex: 1, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: theme.borderRadius.lg, padding: 12 },
  skeletonGroup: { gap: 10, padding: 8 },
  storyText: { fontSize: 16, color: '#FFF', lineHeight: 26 },
  choices: { gap: 8, marginBottom: 8 },
  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 10,
  },
  choiceIcon: { fontSize: 20 },
  choiceTextWrap: { flex: 1 },
  choiceLabel: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  choiceHint: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  ending: { alignItems: 'center', gap: 16, paddingVertical: 24 },
  endingText: { fontSize: 28, fontWeight: '700', color: theme.colors.accent },
});
