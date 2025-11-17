import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Modal, ScrollView, TextInput, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { AdsManager } from './services/adsManager';

type SessionType = 'work' | 'shortBreak' | 'longBreak';

interface Settings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
}

interface SessionRecord {
  id: string;
  type: SessionType;
  duration: number;
  completedAt: string;
}

interface Stats {
  totalSessions: number;
  totalWorkTime: number;
  currentStreak: number;
  longestStreak: number;
  todaySessions: number;
  lastSessionDate: string;
}

const DEFAULT_SETTINGS: Settings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStartBreaks: false,
  autoStartWork: false,
  soundEnabled: true,
};

const SETTINGS_KEY = '@pomodoro_settings';
const STATS_KEY = '@pomodoro_stats';
const HISTORY_KEY = '@pomodoro_history';

export default function App() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    totalWorkTime: 0,
    currentStreak: 0,
    longestStreak: 0,
    todaySessions: 0,
    lastSessionDate: new Date().toDateString(),
  });
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    loadSettings();
    loadStats();
    loadHistory();
    setupAudio();
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleSessionComplete();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const playSound = async () => {
    if (!settings.soundEnabled) return;

    try {
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/notification.mp3'),
        { shouldPlay: true }
      );
      soundRef.current = sound;
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const loadedSettings = JSON.parse(stored);
        setSettings(loadedSettings);
        setTimeLeft(loadedSettings.workDuration * 60);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      if (!isRunning) {
        setTimeLeft(newSettings.workDuration * 60);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const loadStats = async () => {
    try {
      const stored = await AsyncStorage.getItem(STATS_KEY);
      if (stored) {
        const loadedStats = JSON.parse(stored);
        const today = new Date().toDateString();
        if (loadedStats.lastSessionDate !== today) {
          loadedStats.todaySessions = 0;
        }
        setStats(loadedStats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const saveStats = async (newStats: Stats) => {
    try {
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(newStats));
      setStats(newStats);
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const saveHistory = async (newHistory: SessionRecord[]) => {
    try {
      const limited = newHistory.slice(0, 100); // Keep last 100 sessions
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(limited));
      setHistory(limited);
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const handleSessionComplete = () => {
    setIsRunning(false);
    playSound();

    const today = new Date().toDateString();
    const wasWork = sessionType === 'work';

    // Save session to history
    const newSession: SessionRecord = {
      id: Date.now().toString(),
      type: sessionType,
      duration: getDuration(sessionType),
      completedAt: new Date().toISOString(),
    };
    saveHistory([newSession, ...history]);

    // Update stats
    if (wasWork) {
      const newStats = {
        ...stats,
        totalSessions: stats.totalSessions + 1,
        totalWorkTime: stats.totalWorkTime + settings.workDuration,
        todaySessions: stats.lastSessionDate === today ? stats.todaySessions + 1 : 1,
        currentStreak: stats.lastSessionDate === today ? stats.currentStreak + 1 : 1,
        longestStreak: Math.max(stats.longestStreak, stats.currentStreak + 1),
        lastSessionDate: today,
      };
      saveStats(newStats);

      setSessionsCompleted(sessionsCompleted + 1);

      // Show ad after work session
      setTimeout(() => {
        AdsManager.showInterstitialAd();
      }, 2000);
    }

    // Move to next session
    if (wasWork) {
      const nextBreak = (sessionsCompleted + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
      setSessionType(nextBreak);
      setTimeLeft(getDuration(nextBreak) * 60);
      if (settings.autoStartBreaks) {
        setIsRunning(true);
      }
    } else {
      setSessionType('work');
      setTimeLeft(settings.workDuration * 60);
      if (settings.autoStartWork) {
        setIsRunning(true);
      }
    }
  };

  const getDuration = (type: SessionType): number => {
    switch (type) {
      case 'work': return settings.workDuration;
      case 'shortBreak': return settings.shortBreakDuration;
      case 'longBreak': return settings.longBreakDuration;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(getDuration(sessionType) * 60);
  };

  const skip = () => {
    setTimeLeft(0);
    if (!isRunning) {
      handleSessionComplete();
    }
  };

  const getSessionLabel = () => {
    switch (sessionType) {
      case 'work': return 'FOCUS TIME';
      case 'shortBreak': return 'SHORT BREAK';
      case 'longBreak': return 'LONG BREAK';
    }
  };

  const getBackgroundColor = () => {
    switch (sessionType) {
      case 'work': return colors.primary;
      case 'shortBreak': return colors.status.success;
      case 'longBreak': return colors.accent;
    }
  };

  const renderSettingsModal = () => (
    <Modal
      visible={showSettings}
      animationType="slide"
      transparent
      onRequestClose={() => setShowSettings(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Settings</Text>

          <ScrollView>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Work Duration (minutes)</Text>
              <TextInput
                style={styles.settingInput}
                keyboardType="number-pad"
                value={settings.workDuration.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text) || 1;
                  saveSettings({ ...settings, workDuration: Math.max(1, Math.min(60, num)) });
                }}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Short Break (minutes)</Text>
              <TextInput
                style={styles.settingInput}
                keyboardType="number-pad"
                value={settings.shortBreakDuration.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text) || 1;
                  saveSettings({ ...settings, shortBreakDuration: Math.max(1, Math.min(30, num)) });
                }}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Long Break (minutes)</Text>
              <TextInput
                style={styles.settingInput}
                keyboardType="number-pad"
                value={settings.longBreakDuration.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text) || 1;
                  saveSettings({ ...settings, longBreakDuration: Math.max(1, Math.min(60, num)) });
                }}
              />
            </View>

            <TouchableOpacity
              style={styles.settingToggle}
              onPress={() => saveSettings({ ...settings, autoStartBreaks: !settings.autoStartBreaks })}
            >
              <Text style={styles.settingLabel}>Auto-start Breaks</Text>
              <Text style={[styles.toggleIndicator, settings.autoStartBreaks && styles.toggleActive]}>
                {settings.autoStartBreaks ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingToggle}
              onPress={() => saveSettings({ ...settings, autoStartWork: !settings.autoStartWork })}
            >
              <Text style={styles.settingLabel}>Auto-start Work</Text>
              <Text style={[styles.toggleIndicator, settings.autoStartWork && styles.toggleActive]}>
                {settings.autoStartWork ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingToggle}
              onPress={() => saveSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
            >
              <Text style={styles.settingLabel}>Sound Notifications</Text>
              <Text style={[styles.toggleIndicator, settings.soundEnabled && styles.toggleActive]}>
                {settings.soundEnabled ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowSettings(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderStatsModal = () => (
    <Modal
      visible={showStats}
      animationType="slide"
      transparent
      onRequestClose={() => setShowStats(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Statistics</Text>

          <ScrollView style={styles.statsScroll}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Sessions Completed</Text>
              <Text style={styles.statValue}>{stats.totalSessions}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Study Time</Text>
              <Text style={styles.statValue}>{formatDuration(stats.totalWorkTime)}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Today's Sessions</Text>
              <Text style={styles.statValue}>{stats.todaySessions}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Current Streak</Text>
              <Text style={styles.statValue}>{stats.currentStreak} sessions</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Longest Streak</Text>
              <Text style={styles.statValue}>{stats.longestStreak} sessions</Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowStats(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderHistoryModal = () => (
    <Modal
      visible={showHistory}
      animationType="slide"
      transparent
      onRequestClose={() => setShowHistory(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Session History</Text>

          <FlatList
            data={history}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.historyItem}>
                <View>
                  <Text style={styles.historyType}>
                    {item.type === 'work' ? '🎯 Work Session' : item.type === 'shortBreak' ? '☕ Short Break' : '🌴 Long Break'}
                  </Text>
                  <Text style={styles.historyDate}>
                    {new Date(item.completedAt).toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.historyDuration}>{item.duration} min</Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No sessions yet. Start your first Pomodoro!</Text>
            }
          />

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowHistory(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowSettings(true)}>
          <Text style={styles.headerButton}>⚙️</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pomodoro</Text>
        <TouchableOpacity onPress={() => setShowStats(true)}>
          <Text style={styles.headerButton}>📊</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.main}>
        <Text style={styles.sessionLabel}>{getSessionLabel()}</Text>

        <View style={styles.pomodoroCounter}>
          <Text style={styles.counterLabel}>Pomodoros Completed</Text>
          <Text style={styles.counterValue}>{sessionsCompleted}</Text>
        </View>

        <Text style={styles.timer}>{formatTime(timeLeft)}</Text>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.mainButton]}
            onPress={() => setIsRunning(!isRunning)}
          >
            <Text style={styles.mainButtonText}>{isRunning ? 'PAUSE' : 'START'}</Text>
          </TouchableOpacity>

          <View style={styles.secondaryButtons}>
            <TouchableOpacity style={styles.secondaryButton} onPress={reset}>
              <Text style={styles.secondaryButtonText}>RESET</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={skip}>
              <Text style={styles.secondaryButtonText}>SKIP</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowHistory(true)}>
              <Text style={styles.secondaryButtonText}>HISTORY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <AdBanner />
      {renderSettingsModal()}
      {renderStatsModal()}
      {renderHistoryModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  headerButton: { fontSize: 28, color: colors.white },
  title: { fontSize: 24, color: colors.white, fontWeight: 'bold' },
  main: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  sessionLabel: { fontSize: 20, color: colors.white, marginBottom: spacing.lg, letterSpacing: 2 },
  pomodoroCounter: { alignItems: 'center', marginBottom: spacing.xl },
  counterLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.xs },
  counterValue: { fontSize: 32, color: colors.white, fontWeight: 'bold' },
  timer: { fontSize: 80, color: colors.white, fontWeight: 'bold', marginBottom: spacing.xl },
  controls: { alignItems: 'center', width: '100%' },
  mainButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.xl * 2,
    paddingVertical: spacing.lg,
    borderRadius: 50,
    minWidth: 200,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  mainButtonText: { color: colors.white, fontSize: 24, fontWeight: 'bold' },
  secondaryButtons: { flexDirection: 'row', gap: spacing.sm },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  secondaryButtonText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.xl,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg, textAlign: 'center' },
  settingItem: { marginBottom: spacing.lg },
  settingLabel: { fontSize: 16, color: colors.text, marginBottom: spacing.sm, fontWeight: '600' },
  settingInput: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 8,
    fontSize: 16,
  },
  settingToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  toggleIndicator: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.gray.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    backgroundColor: colors.gray.light,
  },
  toggleActive: { color: colors.white, backgroundColor: colors.status.success },
  statsScroll: { maxHeight: 400 },
  statCard: {
    backgroundColor: colors.gray.light,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  statLabel: { fontSize: 14, color: colors.gray.dark, marginBottom: spacing.xs },
  statValue: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  historyType: { fontSize: 16, fontWeight: '600', color: colors.text },
  historyDate: { fontSize: 12, color: colors.gray.dark, marginTop: spacing.xs },
  historyDuration: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  emptyText: { fontSize: 16, color: colors.gray.dark, textAlign: 'center', marginTop: spacing.xl },
  closeButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  closeButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
