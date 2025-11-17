import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ScrollView,
  Picker,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Meditation_Timer_Offline_data';

type AmbientSound = 'None' | 'Bell' | 'Chime' | 'Gong';
type IntervalBell = 0 | 5 | 10 | 15;

interface Session {
  id: string;
  duration: number;
  completedAt: string;
}

interface Stats {
  totalSessions: number;
  totalMinutes: number;
  streak: number;
  lastSessionDate: string | null;
  sessions: Session[];
}

const DURATIONS = Array.from({ length: 60 }, (_, i) => i + 1);

export default function App() {
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    totalMinutes: 0,
    streak: 0,
    lastSessionDate: null,
    sessions: [],
  });

  const [duration, setDuration] = useState(10); // minutes
  const [intervalBell, setIntervalBell] = useState<IntervalBell>(0);
  const [ambientSound, setAmbientSound] = useState<AmbientSound>('None');
  const [prepTime, setPrepTime] = useState(5); // seconds

  const [isActive, setIsActive] = useState(false);
  const [isPrep, setIsPrep] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive || isPrep) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (isPrep) {
              // Prep done, start meditation
              setIsPrep(false);
              setTimeRemaining(duration * 60);
              playSound('start');
            } else {
              // Meditation done
              finishSession();
            }
            return 0;
          }

          const newTime = prev - 1;

          // Play interval bells
          if (!isPrep && intervalBell > 0 && newTime % (intervalBell * 60) === 0 && newTime > 0) {
            playSound('interval');
          }

          return newTime;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, isPrep, intervalBell, duration]);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const loadedStats = JSON.parse(saved);
        // Calculate streak
        const streak = calculateStreak(loadedStats.sessions);
        setStats({ ...loadedStats, streak });
      }
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

  const calculateStreak = (sessions: Session[]): number => {
    if (sessions.length === 0) return 0;

    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastSessionDate = new Date(sortedSessions[0].completedAt);
    lastSessionDate.setHours(0, 0, 0, 0);

    // Check if last session was today or yesterday
    if (lastSessionDate.getTime() < yesterday.getTime()) {
      return 0; // Streak broken
    }

    let streak = 1;
    let checkDate = new Date(lastSessionDate);

    for (let i = 1; i < sortedSessions.length; i++) {
      const sessionDate = new Date(sortedSessions[i].completedAt);
      sessionDate.setHours(0, 0, 0, 0);

      const prevDate = new Date(checkDate);
      prevDate.setDate(prevDate.getDate() - 1);

      if (sessionDate.getTime() === prevDate.getTime()) {
        streak++;
        checkDate = sessionDate;
      } else if (sessionDate.getTime() < prevDate.getTime()) {
        break;
      }
    }

    return streak;
  };

  const playSound = (type: 'start' | 'interval' | 'end') => {
    // In a real app, play actual sounds based on ambientSound setting
    console.log(`Playing ${type} sound: ${ambientSound}`);
  };

  const startSession = () => {
    if (prepTime > 0) {
      setIsPrep(true);
      setTimeRemaining(prepTime);
    } else {
      setIsActive(true);
      setTimeRemaining(duration * 60);
    }
  };

  const stopSession = () => {
    setIsActive(false);
    setIsPrep(false);
    setTimeRemaining(0);
  };

  const finishSession = () => {
    const session: Session = {
      id: Date.now().toString(),
      duration: duration,
      completedAt: new Date().toISOString(),
    };

    const newSessions = [session, ...stats.sessions];
    const newStreak = calculateStreak(newSessions);

    const newStats: Stats = {
      totalSessions: stats.totalSessions + 1,
      totalMinutes: stats.totalMinutes + duration,
      streak: newStreak,
      lastSessionDate: session.completedAt,
      sessions: newSessions.slice(0, 100),
    };

    saveData(newStats);
    setIsActive(false);
    playSound('end');
    showInterstitialAd();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeHM = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Meditation</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowStats(true)}>
            <Text style={styles.iconBtn}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowSettings(true)}>
            <Text style={styles.iconBtn}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!isActive && !isPrep ? (
        <ScrollView contentContainerStyle={styles.setupContainer}>
          {/* Duration Selector */}
          <Text style={styles.label}>Duration</Text>
          <View style={styles.durationDisplay}>
            <TouchableOpacity
              style={styles.durationBtn}
              onPress={() => setDuration(Math.max(1, duration - 1))}
            >
              <Text style={styles.durationBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.durationValueContainer}>
              <Text style={styles.durationValue}>{duration}</Text>
              <Text style={styles.durationUnit}>minutes</Text>
            </View>
            <TouchableOpacity
              style={styles.durationBtn}
              onPress={() => setDuration(Math.min(60, duration + 1))}
            >
              <Text style={styles.durationBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Duration Buttons */}
          <View style={styles.quickDurations}>
            {[5, 10, 15, 20, 30].map((min) => (
              <TouchableOpacity
                key={min}
                style={[
                  styles.quickBtn,
                  duration === min && styles.quickBtnActive,
                ]}
                onPress={() => setDuration(min)}
              >
                <Text
                  style={[
                    styles.quickBtnText,
                    duration === min && styles.quickBtnTextActive,
                  ]}
                >
                  {min}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Start Button */}
          <TouchableOpacity style={styles.startBtn} onPress={startSession}>
            <Text style={styles.startBtnText}>🧘 Start Meditation</Text>
          </TouchableOpacity>

          {/* Stats Preview */}
          <View style={styles.statsPreview}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalSessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatTimeHM(stats.totalMinutes)}</Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                {stats.streak}🔥
              </Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>

          {/* Recent Sessions */}
          {stats.sessions.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Recent Sessions</Text>
              {stats.sessions.slice(0, 5).map((session) => (
                <View key={session.id} style={styles.sessionCard}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionDuration}>{session.duration} min</Text>
                    <Text style={styles.sessionDate}>
                      {new Date(session.completedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.sessionIcon}>✓</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      ) : (
        <View style={styles.timerContainer}>
          {isPrep ? (
            <>
              <Text style={styles.prepLabel}>Get Ready...</Text>
              <Text style={styles.prepTimer}>{timeRemaining}</Text>
            </>
          ) : (
            <>
              <Text style={styles.meditateLabel}>Meditate</Text>
              <Text style={styles.timer}>{formatTime(timeRemaining)}</Text>
              <View style={styles.timerProgress}>
                <View
                  style={[
                    styles.timerProgressBar,
                    {
                      width: `${((duration * 60 - timeRemaining) / (duration * 60)) * 100}%`,
                    },
                  ]}
                />
              </View>
            </>
          )}

          <TouchableOpacity style={styles.stopBtn} onPress={stopSession}>
            <Text style={styles.stopBtnText}>End Session</Text>
          </TouchableOpacity>
        </View>
      )}

      <AdBanner />

      {/* Settings Modal */}
      <Modal visible={showSettings} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Settings</Text>

            <Text style={styles.settingLabel}>Preparation Time</Text>
            <View style={styles.optionsRow}>
              {[0, 5, 10, 15].map((sec) => (
                <TouchableOpacity
                  key={sec}
                  style={[
                    styles.optionBtn,
                    prepTime === sec && styles.optionBtnActive,
                  ]}
                  onPress={() => setPrepTime(sec)}
                >
                  <Text
                    style={[
                      styles.optionBtnText,
                      prepTime === sec && styles.optionBtnTextActive,
                    ]}
                  >
                    {sec}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.settingLabel}>Interval Bells</Text>
            <View style={styles.optionsRow}>
              {[0, 5, 10, 15].map((min) => (
                <TouchableOpacity
                  key={min}
                  style={[
                    styles.optionBtn,
                    intervalBell === min && styles.optionBtnActive,
                  ]}
                  onPress={() => setIntervalBell(min as IntervalBell)}
                >
                  <Text
                    style={[
                      styles.optionBtnText,
                      intervalBell === min && styles.optionBtnTextActive,
                    ]}
                  >
                    {min === 0 ? 'Off' : `${min}m`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.settingLabel}>Ambient Sound</Text>
            <View style={styles.optionsRow}>
              {(['None', 'Bell', 'Chime', 'Gong'] as AmbientSound[]).map((sound) => (
                <TouchableOpacity
                  key={sound}
                  style={[
                    styles.optionBtn,
                    ambientSound === sound && styles.optionBtnActive,
                  ]}
                  onPress={() => setAmbientSound(sound)}
                >
                  <Text
                    style={[
                      styles.optionBtnText,
                      ambientSound === sound && styles.optionBtnTextActive,
                    ]}
                  >
                    {sound}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Stats Modal */}
      <Modal visible={showStats} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Your Progress</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statBoxValue}>{stats.totalSessions}</Text>
                <Text style={styles.statBoxLabel}>Total Sessions</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxValue}>{stats.totalMinutes}</Text>
                <Text style={styles.statBoxLabel}>Total Minutes</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statBoxValue, { color: '#F59E0B' }]}>
                  {stats.streak}
                </Text>
                <Text style={styles.statBoxLabel}>Day Streak 🔥</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Session History</Text>
            <ScrollView style={styles.historyList}>
              {stats.sessions.length === 0 ? (
                <Text style={styles.emptyText}>No sessions yet</Text>
              ) : (
                stats.sessions.map((session) => (
                  <View key={session.id} style={styles.historyItem}>
                    <View>
                      <Text style={styles.historyDuration}>{session.duration} minutes</Text>
                      <Text style={styles.historyDate}>
                        {new Date(session.completedAt).toLocaleString()}
                      </Text>
                    </View>
                    <Text style={styles.historyIcon}>🧘</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowStats(false)}
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
  headerActions: { flexDirection: 'row', gap: spacing.md },
  iconBtn: { fontSize: 24 },
  setupContainer: { padding: spacing.lg, paddingBottom: 100 },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  durationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  durationBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBtnText: { color: colors.white, fontSize: 32, fontWeight: 'bold' },
  durationValueContainer: { alignItems: 'center', marginHorizontal: spacing.xl * 2 },
  durationValue: { fontSize: 64, fontWeight: 'bold', color: colors.primary },
  durationUnit: { fontSize: 16, color: colors.gray.dark, marginTop: -8 },
  quickDurations: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  quickBtn: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray.light,
  },
  quickBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },
  quickBtnTextActive: { color: colors.white },
  startBtn: {
    backgroundColor: colors.primary,
    padding: spacing.xl,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  startBtnText: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
  statsPreview: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.gray.dark, marginTop: 4, textAlign: 'center' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sessionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionInfo: { flex: 1 },
  sessionDuration: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  sessionDate: { fontSize: 12, color: colors.gray.dark, marginTop: 2 },
  sessionIcon: { fontSize: 24 },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  prepLabel: { fontSize: 24, color: colors.gray.dark, marginBottom: spacing.lg },
  prepTimer: { fontSize: 120, fontWeight: 'bold', color: colors.primary },
  meditateLabel: { fontSize: 24, color: colors.gray.dark, marginBottom: spacing.lg },
  timer: { fontSize: 72, fontWeight: 'bold', color: colors.primary },
  timerProgress: {
    width: '80%',
    height: 8,
    backgroundColor: colors.gray.light,
    borderRadius: 4,
    marginTop: spacing.xl,
    overflow: 'hidden',
  },
  timerProgressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  stopBtn: {
    backgroundColor: colors.status.error,
    paddingHorizontal: spacing.xl * 2,
    paddingVertical: spacing.lg,
    borderRadius: 16,
    marginTop: spacing.xl * 2,
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
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  optionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  optionBtn: {
    flex: 1,
    backgroundColor: colors.gray.light,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },
  optionBtnTextActive: { color: colors.white },
  closeBtn: {
    backgroundColor: colors.gray.light,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  closeBtnText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statBox: {
    flex: 1,
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  statBoxValue: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  statBoxLabel: { fontSize: 11, color: colors.gray.dark, marginTop: 4, textAlign: 'center' },
  historyList: { maxHeight: 300 },
  emptyText: { textAlign: 'center', color: colors.gray.dark, marginTop: spacing.lg },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  historyDuration: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  historyDate: { fontSize: 12, color: colors.gray.dark, marginTop: 2 },
  historyIcon: { fontSize: 24 },
});
