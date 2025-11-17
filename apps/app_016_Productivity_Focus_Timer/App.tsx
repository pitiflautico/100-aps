import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Productivity_Focus_Timer_data';
const STATS_KEY = '@Productivity_Focus_Timer_stats';

type SessionType = 'work' | 'break';
type TimerStatus = 'stopped' | 'running' | 'paused';

interface Settings {
  workDuration: number; // minutes
  breakDuration: number; // minutes
  autoStart: boolean;
  sessionsGoal: number;
}

interface Stats {
  sessionsToday: number;
  totalMinutesToday: number;
  lastSessionDate: string;
}

export default function App() {
  const [settings, setSettings] = useState<Settings>({
    workDuration: 25,
    breakDuration: 5,
    autoStart: false,
    sessionsGoal: 8,
  });
  const [stats, setStats] = useState<Stats>({
    sessionsToday: 0,
    totalMinutesToday: 0,
    lastSessionDate: new Date().toDateString(),
  });

  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [remaining, setRemaining] = useState(settings.workDuration * 60);
  const [status, setStatus] = useState<TimerStatus>('stopped');
  const [currentSession, setCurrentSession] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeAds();
    loadData();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const loadData = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(STORAGE_KEY);
      const savedStats = await AsyncStorage.getItem(STATS_KEY);

      if (savedSettings) {
        const loaded = JSON.parse(savedSettings);
        setSettings(loaded);
        setRemaining(loaded.workDuration * 60);
      }

      if (savedStats) {
        const loadedStats: Stats = JSON.parse(savedStats);
        const today = new Date().toDateString();
        if (loadedStats.lastSessionDate === today) {
          setStats(loadedStats);
        } else {
          const newStats: Stats = {
            sessionsToday: 0,
            totalMinutesToday: 0,
            lastSessionDate: today,
          };
          setStats(newStats);
          await AsyncStorage.setItem(STATS_KEY, JSON.stringify(newStats));
        }
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Save settings error:', error);
    }
  };

  const saveStats = async (newStats: Stats) => {
    try {
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(newStats));
      setStats(newStats);
    } catch (error) {
      console.error('Save stats error:', error);
    }
  };

  const startTimer = () => {
    if (status === 'stopped' && sessionType === 'work') {
      setCurrentSession(currentSession + 1);
    }
    setStatus('running');

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStatus('paused');
  };

  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStatus('stopped');
    const duration = sessionType === 'work' ? settings.workDuration : settings.breakDuration;
    setRemaining(duration * 60);
    if (sessionType === 'work') setCurrentSession(0);
  };

  const handleTimerComplete = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const duration = sessionType === 'work' ? settings.workDuration : settings.breakDuration;

    if (sessionType === 'work') {
      // Update stats
      const newStats: Stats = {
        ...stats,
        sessionsToday: stats.sessionsToday + 1,
        totalMinutesToday: stats.totalMinutesToday + duration,
        lastSessionDate: new Date().toDateString(),
      };
      saveStats(newStats);

      Alert.alert('Work Session Complete!', 'Time for a break!');
      setSessionType('break');
      setRemaining(settings.breakDuration * 60);
    } else {
      Alert.alert('Break Complete!', 'Ready for another session?');
      setSessionType('work');
      setRemaining(settings.workDuration * 60);
    }

    if (settings.autoStart) {
      setStatus('running');
      startTimer();
    } else {
      setStatus('stopped');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    const total = sessionType === 'work' ? settings.workDuration * 60 : settings.breakDuration * 60;
    return (remaining / total) * 100;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Focus Timer</Text>
        <TouchableOpacity onPress={() => setShowSettings(true)}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Session Info */}
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionType}>
            {sessionType === 'work' ? '💼 Work Session' : '☕ Break Time'}
          </Text>
          <Text style={styles.sessionCount}>
            Session {currentSession} of {settings.sessionsGoal}
          </Text>
        </View>

        {/* Timer Display */}
        <View style={styles.timerCircle}>
          <View
            style={[
              styles.progressRing,
              {
                background: `conic-gradient(${colors.primary} ${getProgress()}%, ${colors.gray.light} ${getProgress()}%)`,
              },
            ]}
          />
          <View style={styles.timerInner}>
            <Text style={[styles.timeDisplay, { color: sessionType === 'work' ? colors.primary : colors.status.success }]}>
              {formatTime(remaining)}
            </Text>
            <Text style={styles.sessionLabel}>
              {sessionType === 'work' ? 'Focus Time' : 'Break Time'}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {status === 'stopped' && (
            <TouchableOpacity style={[styles.btn, styles.btnStart]} onPress={startTimer}>
              <Text style={styles.btnText}>▶ Start</Text>
            </TouchableOpacity>
          )}
          {status === 'running' && (
            <TouchableOpacity style={[styles.btn, styles.btnPause]} onPress={pauseTimer}>
              <Text style={styles.btnText}>⏸ Pause</Text>
            </TouchableOpacity>
          )}
          {status === 'paused' && (
            <TouchableOpacity style={[styles.btn, styles.btnResume]} onPress={startTimer}>
              <Text style={styles.btnText}>▶ Resume</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.btn, styles.btnReset]} onPress={resetTimer}>
            <Text style={[styles.btnText, styles.btnResetText]}>↻ Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.sessionsToday}</Text>
            <Text style={styles.statLabel}>Sessions Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalMinutesToday}</Text>
            <Text style={styles.statLabel}>Minutes Today</Text>
          </View>
        </View>
      </View>

      <AdBanner />

      {/* Settings Modal */}
      <Modal visible={showSettings} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Settings</Text>

            <ScrollView>
              <Text style={styles.label}>Work Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={settings.workDuration.toString()}
                onChangeText={(text) => {
                  const val = parseInt(text) || 25;
                  saveSettings({ ...settings, workDuration: val });
                  if (sessionType === 'work' && status === 'stopped') {
                    setRemaining(val * 60);
                  }
                }}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Break Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={settings.breakDuration.toString()}
                onChangeText={(text) => {
                  const val = parseInt(text) || 5;
                  saveSettings({ ...settings, breakDuration: val });
                  if (sessionType === 'break' && status === 'stopped') {
                    setRemaining(val * 60);
                  }
                }}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Sessions Goal</Text>
              <TextInput
                style={styles.input}
                value={settings.sessionsGoal.toString()}
                onChangeText={(text) => {
                  const val = parseInt(text) || 8;
                  saveSettings({ ...settings, sessionsGoal: val });
                }}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => saveSettings({ ...settings, autoStart: !settings.autoStart })}
              >
                <View style={[styles.checkbox, settings.autoStart && styles.checkboxChecked]}>
                  {settings.autoStart && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Auto-start next session</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={[styles.btn, styles.btnClose]}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.btnText}>Close</Text>
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
    padding: spacing.lg,
    alignItems: 'center',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  settingsIcon: { fontSize: 28, padding: spacing.sm },
  content: { flex: 1, alignItems: 'center', paddingTop: spacing.xl },
  sessionInfo: { alignItems: 'center', marginBottom: spacing.xl },
  sessionType: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  sessionCount: { fontSize: 14, color: colors.gray.dark },
  timerCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.gray.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  progressRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  timerInner: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeDisplay: { fontSize: 64, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
  sessionLabel: { fontSize: 16, color: colors.gray.dark, marginTop: spacing.sm },
  controls: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl, paddingHorizontal: spacing.xl },
  btn: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnStart: { backgroundColor: colors.status.success },
  btnPause: { backgroundColor: colors.status.warning },
  btnResume: { backgroundColor: colors.status.success },
  btnReset: { backgroundColor: colors.gray.light },
  btnClose: { backgroundColor: colors.primary, marginTop: spacing.lg },
  btnText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  btnResetText: { color: colors.text },
  stats: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xl },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: { fontSize: 32, fontWeight: 'bold', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.gray.dark, marginTop: spacing.xs, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', color: colors.gray.dark, marginBottom: spacing.sm, marginTop: spacing.md },
  input: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 16,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.gray.medium,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  checkboxLabel: { fontSize: 16, color: colors.text },
});
