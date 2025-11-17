import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Breathing_Exercise_Coach_data';

interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  inhale: number;
  hold: number;
  exhale: number;
  holdAfterExhale?: number;
  color: string;
}

interface Session {
  id: string;
  patternName: string;
  duration: number;
  cycles: number;
  completedAt: string;
}

interface Stats {
  totalSessions: number;
  totalCycles: number;
  totalMinutes: number;
  sessions: Session[];
}

const PATTERNS: BreathingPattern[] = [
  {
    id: '478',
    name: '4-7-8 Relaxation',
    description: 'Calming breath for stress relief',
    inhale: 4,
    hold: 7,
    exhale: 8,
    color: '#8B5CF6',
  },
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Equal breathing for focus',
    inhale: 4,
    hold: 4,
    exhale: 4,
    holdAfterExhale: 4,
    color: '#3B82F6',
  },
  {
    id: 'deep',
    name: 'Deep Breathing',
    description: 'Deep relaxation technique',
    inhale: 6,
    hold: 2,
    exhale: 6,
    color: '#10B981',
  },
  {
    id: 'energizing',
    name: 'Energizing',
    description: 'Quick energy boost',
    inhale: 2,
    hold: 0,
    exhale: 4,
    color: '#F59E0B',
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Your own pattern',
    inhale: 4,
    hold: 4,
    exhale: 4,
    color: '#EC4899',
  },
];

type Phase = 'inhale' | 'hold' | 'exhale' | 'holdAfterExhale' | 'idle';

export default function App() {
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    totalCycles: 0,
    totalMinutes: 0,
    sessions: [],
  });

  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(PATTERNS[0]);
  const [duration, setDuration] = useState(5); // minutes
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<Phase>('idle');
  const [cycleCount, setCycleCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [phaseTimer, setPhaseTimer] = useState(0);

  const [showPatternModal, setShowPatternModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Custom pattern inputs
  const [customInhale, setCustomInhale] = useState('4');
  const [customHold, setCustomHold] = useState('4');
  const [customExhale, setCustomExhale] = useState('4');

  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  useEffect(() => {
    if (isActive) {
      animateBreathing();
    }
  }, [currentPhase, isActive]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            finishSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    let phaseInterval: NodeJS.Timeout;

    if (isActive && phaseTimer > 0) {
      phaseInterval = setInterval(() => {
        setPhaseTimer((prev) => {
          if (prev <= 1) {
            advancePhase();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(phaseInterval);
  }, [isActive, phaseTimer]);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setStats(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (data: Stats) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setStats(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const animateBreathing = () => {
    const pattern = selectedPattern;
    let toScale = 0.4;
    let toOpacity = 0.6;
    let animDuration = 1000;

    switch (currentPhase) {
      case 'inhale':
        toScale = 1.0;
        toOpacity = 1.0;
        animDuration = pattern.inhale * 1000;
        break;
      case 'hold':
        toScale = 1.0;
        toOpacity = 1.0;
        animDuration = pattern.hold * 1000;
        break;
      case 'exhale':
        toScale = 0.4;
        toOpacity = 0.6;
        animDuration = pattern.exhale * 1000;
        break;
      case 'holdAfterExhale':
        toScale = 0.4;
        toOpacity = 0.6;
        animDuration = (pattern.holdAfterExhale || 0) * 1000;
        break;
    }

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: toScale,
        duration: animDuration,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: toOpacity,
        duration: animDuration,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const advancePhase = () => {
    const pattern = selectedPattern;

    switch (currentPhase) {
      case 'inhale':
        if (pattern.hold > 0) {
          setCurrentPhase('hold');
          setPhaseTimer(pattern.hold);
        } else {
          setCurrentPhase('exhale');
          setPhaseTimer(pattern.exhale);
        }
        break;
      case 'hold':
        setCurrentPhase('exhale');
        setPhaseTimer(pattern.exhale);
        break;
      case 'exhale':
        if (pattern.holdAfterExhale && pattern.holdAfterExhale > 0) {
          setCurrentPhase('holdAfterExhale');
          setPhaseTimer(pattern.holdAfterExhale);
        } else {
          setCycleCount((prev) => prev + 1);
          setCurrentPhase('inhale');
          setPhaseTimer(pattern.inhale);
        }
        break;
      case 'holdAfterExhale':
        setCycleCount((prev) => prev + 1);
        setCurrentPhase('inhale');
        setPhaseTimer(pattern.inhale);
        break;
    }
  };

  const startSession = () => {
    setIsActive(true);
    setCycleCount(0);
    setTimeRemaining(duration * 60);
    setCurrentPhase('inhale');
    setPhaseTimer(selectedPattern.inhale);
  };

  const stopSession = () => {
    setIsActive(false);
    setCurrentPhase('idle');
    setCycleCount(0);
    setPhaseTimer(0);
    scaleAnim.setValue(0.4);
    opacityAnim.setValue(0.6);
  };

  const finishSession = () => {
    const session: Session = {
      id: Date.now().toString(),
      patternName: selectedPattern.name,
      duration: duration,
      cycles: cycleCount,
      completedAt: new Date().toISOString(),
    };

    const newStats: Stats = {
      totalSessions: stats.totalSessions + 1,
      totalCycles: stats.totalCycles + cycleCount,
      totalMinutes: stats.totalMinutes + duration,
      sessions: [session, ...stats.sessions.slice(0, 49)],
    };

    saveData(newStats);
    stopSession();
    showInterstitialAd();
  };

  const applyCustomPattern = () => {
    const inhale = parseInt(customInhale) || 4;
    const hold = parseInt(customHold) || 4;
    const exhale = parseInt(customExhale) || 4;

    const customPattern: BreathingPattern = {
      ...PATTERNS[4],
      inhale,
      hold,
      exhale,
    };

    PATTERNS[4] = customPattern;
    setSelectedPattern(customPattern);
    setShowCustomModal(false);
  };

  const getPhaseText = () => {
    switch (currentPhase) {
      case 'inhale':
        return 'Breathe In';
      case 'hold':
        return 'Hold';
      case 'exhale':
        return 'Breathe Out';
      case 'holdAfterExhale':
        return 'Hold';
      case 'idle':
        return 'Ready';
      default:
        return '';
    }
  };

  const getPhaseColor = () => {
    switch (currentPhase) {
      case 'inhale':
        return '#10B981';
      case 'hold':
        return '#F59E0B';
      case 'exhale':
        return '#3B82F6';
      case 'holdAfterExhale':
        return '#F59E0B';
      default:
        return selectedPattern.color;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Breathing Coach</Text>
        <TouchableOpacity onPress={() => setShowStatsModal(true)}>
          <Text style={styles.statsBtn}>📊</Text>
        </TouchableOpacity>
      </View>

      {!isActive ? (
        <ScrollView contentContainerStyle={styles.setupContainer}>
          {/* Pattern Selection */}
          <Text style={styles.label}>Breathing Pattern</Text>
          <TouchableOpacity
            style={[styles.patternCard, { borderColor: selectedPattern.color }]}
            onPress={() => setShowPatternModal(true)}
          >
            <View style={[styles.patternIcon, { backgroundColor: selectedPattern.color }]}>
              <Text style={styles.patternIconText}>🫁</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patternName}>{selectedPattern.name}</Text>
              <Text style={styles.patternDescription}>{selectedPattern.description}</Text>
              <Text style={styles.patternTiming}>
                Inhale {selectedPattern.inhale}s
                {selectedPattern.hold > 0 && ` • Hold ${selectedPattern.hold}s`}
                {` • Exhale ${selectedPattern.exhale}s`}
                {selectedPattern.holdAfterExhale && selectedPattern.holdAfterExhale > 0
                  ? ` • Hold ${selectedPattern.holdAfterExhale}s`
                  : ''}
              </Text>
            </View>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>

          {/* Duration Selector */}
          <Text style={styles.label}>Session Duration</Text>
          <View style={styles.durationContainer}>
            {[1, 3, 5, 7, 10].map((min) => (
              <TouchableOpacity
                key={min}
                style={[
                  styles.durationBtn,
                  duration === min && {
                    backgroundColor: selectedPattern.color,
                    borderColor: selectedPattern.color,
                  },
                ]}
                onPress={() => setDuration(min)}
              >
                <Text
                  style={[
                    styles.durationBtnText,
                    duration === min && styles.durationBtnTextActive,
                  ]}
                >
                  {min} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Start Button */}
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: selectedPattern.color }]}
            onPress={startSession}
          >
            <Text style={styles.startBtnText}>Start Session</Text>
          </TouchableOpacity>

          {/* Recent Stats */}
          <View style={styles.statsPreview}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalSessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalCycles}</Text>
              <Text style={styles.statLabel}>Cycles</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalMinutes}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.sessionContainer}>
          {/* Timer Display */}
          <Text style={styles.timeRemaining}>{formatTime(timeRemaining)}</Text>
          <Text style={styles.cycleCount}>{cycleCount} cycles</Text>

          {/* Breathing Circle */}
          <View style={styles.circleContainer}>
            <Animated.View
              style={[
                styles.breathingCircle,
                {
                  backgroundColor: getPhaseColor(),
                  transform: [{ scale: scaleAnim }],
                  opacity: opacityAnim,
                },
              ]}
            />
            <View style={styles.phaseTextContainer}>
              <Text style={styles.phaseText}>{getPhaseText()}</Text>
              <Text style={styles.phaseTimer}>{phaseTimer}</Text>
            </View>
          </View>

          {/* Stop Button */}
          <TouchableOpacity style={styles.stopBtn} onPress={stopSession}>
            <Text style={styles.stopBtnText}>Stop Session</Text>
          </TouchableOpacity>
        </View>
      )}

      <AdBanner />

      {/* Pattern Selection Modal */}
      <Modal visible={showPatternModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Pattern</Text>
            <ScrollView>
              {PATTERNS.map((pattern) => (
                <TouchableOpacity
                  key={pattern.id}
                  style={[
                    styles.patternOption,
                    { borderLeftColor: pattern.color },
                    selectedPattern.id === pattern.id && styles.patternOptionSelected,
                  ]}
                  onPress={() => {
                    if (pattern.id === 'custom') {
                      setShowPatternModal(false);
                      setShowCustomModal(true);
                    } else {
                      setSelectedPattern(pattern);
                      setShowPatternModal(false);
                    }
                  }}
                >
                  <Text style={styles.patternOptionName}>{pattern.name}</Text>
                  <Text style={styles.patternOptionDesc}>{pattern.description}</Text>
                  <Text style={styles.patternOptionTiming}>
                    {pattern.inhale}-
                    {pattern.hold > 0 ? `${pattern.hold}-` : ''}
                    {pattern.exhale}
                    {pattern.holdAfterExhale ? `-${pattern.holdAfterExhale}` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowPatternModal(false)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Pattern Modal */}
      <Modal visible={showCustomModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Custom Pattern</Text>
            <Text style={styles.label}>Inhale (seconds)</Text>
            <TextInput
              style={styles.input}
              value={customInhale}
              onChangeText={setCustomInhale}
              keyboardType="number-pad"
              placeholder="4"
            />
            <Text style={styles.label}>Hold (seconds)</Text>
            <TextInput
              style={styles.input}
              value={customHold}
              onChangeText={setCustomHold}
              keyboardType="number-pad"
              placeholder="4"
            />
            <Text style={styles.label}>Exhale (seconds)</Text>
            <TextInput
              style={styles.input}
              value={customExhale}
              onChangeText={setCustomExhale}
              keyboardType="number-pad"
              placeholder="4"
            />
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => setShowCustomModal(false)}
              >
                <Text style={styles.btnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnAdd]}
                onPress={applyCustomPattern}
              >
                <Text style={styles.btnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Stats Modal */}
      <Modal visible={showStatsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Your Progress</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statBoxValue}>{stats.totalSessions}</Text>
                <Text style={styles.statBoxLabel}>Total Sessions</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxValue}>{stats.totalCycles}</Text>
                <Text style={styles.statBoxLabel}>Total Cycles</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxValue}>{stats.totalMinutes}</Text>
                <Text style={styles.statBoxLabel}>Total Minutes</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            <ScrollView style={styles.sessionsList}>
              {stats.sessions.length === 0 ? (
                <Text style={styles.emptyText}>No sessions yet</Text>
              ) : (
                stats.sessions.slice(0, 10).map((session) => (
                  <View key={session.id} style={styles.sessionItem}>
                    <View>
                      <Text style={styles.sessionPattern}>{session.patternName}</Text>
                      <Text style={styles.sessionDate}>
                        {new Date(session.completedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.sessionStats}>
                      <Text style={styles.sessionDetail}>
                        {session.cycles} cycles • {session.duration} min
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowStatsModal(false)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  statsBtn: { fontSize: 28 },
  setupContainer: { padding: spacing.lg, paddingBottom: 100 },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  patternCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: spacing.md,
  },
  patternIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  patternIconText: { fontSize: 24 },
  patternName: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  patternDescription: { fontSize: 13, color: colors.gray.dark, marginTop: 2 },
  patternTiming: { fontSize: 12, color: colors.gray.medium, marginTop: 4 },
  changeText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  durationContainer: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  durationBtn: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray.light,
  },
  durationBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },
  durationBtnTextActive: { color: colors.white },
  startBtn: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  startBtnText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  statsPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.gray.dark, marginTop: 4 },
  sessionContainer: { flex: 1, justifyContent: 'space-around', alignItems: 'center', padding: spacing.xl },
  timeRemaining: { fontSize: 48, fontWeight: 'bold', color: colors.text },
  cycleCount: { fontSize: 16, color: colors.gray.dark, marginTop: spacing.xs },
  circleContainer: { position: 'relative', justifyContent: 'center', alignItems: 'center', height: 300 },
  breathingCircle: { width: 250, height: 250, borderRadius: 125 },
  phaseTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseText: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  phaseTimer: { fontSize: 40, fontWeight: 'bold', color: colors.primary, marginTop: spacing.sm },
  stopBtn: {
    backgroundColor: colors.status.error,
    paddingHorizontal: spacing.xl * 2,
    paddingVertical: spacing.lg,
    borderRadius: 16,
  },
  stopBtnText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  patternOption: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.gray.light,
  },
  patternOptionSelected: { backgroundColor: colors.gray.light },
  patternOptionName: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  patternOptionDesc: { fontSize: 13, color: colors.gray.dark, marginTop: 4 },
  patternOptionTiming: { fontSize: 12, color: colors.gray.medium, marginTop: 4 },
  input: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  buttons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  btn: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  btnCancel: { backgroundColor: colors.gray.light },
  btnAdd: { backgroundColor: colors.primary },
  btnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  btnTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  closeBtn: {
    backgroundColor: colors.gray.light,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  closeBtnText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  statBoxValue: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  statBoxLabel: { fontSize: 11, color: colors.gray.dark, marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: spacing.md, color: colors.text },
  sessionsList: { maxHeight: 250 },
  emptyText: { textAlign: 'center', color: colors.gray.dark, marginTop: spacing.lg },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sessionPattern: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  sessionDate: { fontSize: 12, color: colors.gray.dark, marginTop: 2 },
  sessionStats: { alignItems: 'flex-end' },
  sessionDetail: { fontSize: 12, color: colors.gray.dark },
});
