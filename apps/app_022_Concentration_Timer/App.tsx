import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Modal, Alert, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Concentration_Timer_data';

type SessionType = 'deep_work' | 'study' | 'reading' | 'custom';

interface SessionHistory {
  id: string;
  type: SessionType;
  duration: number;
  breakInterval: number;
  completedAt: string;
  interrupted: boolean;
}

interface DailyStats {
  date: string;
  totalMinutes: number;
  sessionsCompleted: number;
}

interface AppData {
  history: SessionHistory[];
  dailyStats: DailyStats[];
  customDuration: number;
}

const SESSION_PRESETS = {
  deep_work: { name: 'Deep Work', duration: 90, color: '#8B5CF6' },
  study: { name: 'Study', duration: 45, color: '#3B82F6' },
  reading: { name: 'Reading', duration: 30, color: '#10B981' },
  custom: { name: 'Custom', duration: 25, color: '#F59E0B' },
};

export default function App() {
  const [data, setData] = useState<AppData>({
    history: [],
    dailyStats: [],
    customDuration: 25,
  });
  const [sessionType, setSessionType] = useState<SessionType>('deep_work');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(0);
  const [showBreakInterval, setShowBreakInterval] = useState(false);
  const [breakInterval, setBreakInterval] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showCustomSetup, setShowCustomSetup] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('25');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeAds();
    loadData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      finishSession(false);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setData(parsed);
        if (parsed.customDuration) {
          setCustomMinutes(parsed.customDuration.toString());
        }
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (newData: AppData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setData(newData);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const startSession = () => {
    let duration = SESSION_PRESETS[sessionType].duration;
    if (sessionType === 'custom') {
      duration = data.customDuration;
    }

    setTimeLeft(duration * 60);
    setSessionStartTime(Date.now());
    setIsRunning(true);
  };

  const pauseSession = () => {
    setIsRunning(false);
  };

  const resumeSession = () => {
    setIsRunning(true);
  };

  const stopSession = () => {
    Alert.alert(
      'Stop Session?',
      'Your progress will be saved as interrupted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop', style: 'destructive', onPress: () => finishSession(true) },
      ]
    );
  };

  const finishSession = (interrupted: boolean) => {
    const totalDuration = sessionType === 'custom' ? data.customDuration : SESSION_PRESETS[sessionType].duration;
    const completedMinutes = Math.floor((totalDuration * 60 - timeLeft) / 60);

    const newSession: SessionHistory = {
      id: Date.now().toString(),
      type: sessionType,
      duration: completedMinutes,
      breakInterval,
      completedAt: new Date().toISOString(),
      interrupted,
    };

    const today = new Date().toISOString().split('T')[0];
    const existingDayIndex = data.dailyStats.findIndex(s => s.date === today);

    let newDailyStats = [...data.dailyStats];
    if (existingDayIndex >= 0) {
      newDailyStats[existingDayIndex] = {
        ...newDailyStats[existingDayIndex],
        totalMinutes: newDailyStats[existingDayIndex].totalMinutes + completedMinutes,
        sessionsCompleted: newDailyStats[existingDayIndex].sessionsCompleted + (interrupted ? 0 : 1),
      };
    } else {
      newDailyStats.push({
        date: today,
        totalMinutes: completedMinutes,
        sessionsCompleted: interrupted ? 0 : 1,
      });
    }

    const newData: AppData = {
      ...data,
      history: [newSession, ...data.history].slice(0, 10),
      dailyStats: newDailyStats.sort((a, b) => b.date.localeCompare(a.date)),
    };

    saveData(newData);
    setIsRunning(false);
    setTimeLeft(0);

    if (!interrupted) {
      Alert.alert('Session Complete!', `Great focus! You completed ${completedMinutes} minutes.`);
      showInterstitialAd();
    }
  };

  const setupCustomSession = () => {
    const minutes = parseInt(customMinutes);
    if (isNaN(minutes) || minutes < 1 || minutes > 120) {
      Alert.alert('Invalid Duration', 'Please enter a duration between 1 and 120 minutes.');
      return;
    }

    const newData = { ...data, customDuration: minutes };
    saveData(newData);
    setShowCustomSetup(false);
    setSessionType('custom');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    return data.dailyStats.find(s => s.date === today) || { totalMinutes: 0, sessionsCompleted: 0 };
  };

  const todayStats = getTodayStats();
  const progressPercent = isRunning && timeLeft > 0
    ? (timeLeft / ((sessionType === 'custom' ? data.customDuration : SESSION_PRESETS[sessionType].duration) * 60)) * 100
    : 0;

  if (isRunning || timeLeft > 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.timerContainer}>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTypeText}>
              {SESSION_PRESETS[sessionType].name}
            </Text>
            {breakInterval > 0 && (
              <Text style={styles.breakInfo}>Break every {breakInterval} min</Text>
            )}
          </View>

          <View style={styles.dndIndicator}>
            <Text style={styles.dndIcon}>🔕</Text>
            <Text style={styles.dndText}>Do Not Disturb</Text>
          </View>

          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            <View style={styles.progressRing}>
              <View
                style={[
                  styles.progressBar,
                  {
                    height: `${progressPercent}%`,
                    backgroundColor: SESSION_PRESETS[sessionType].color,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.controls}>
            {isRunning ? (
              <TouchableOpacity style={styles.controlBtn} onPress={pauseSession}>
                <Text style={styles.controlBtnText}>⏸ Pause</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.controlBtn} onPress={resumeSession}>
                <Text style={styles.controlBtnText}>▶ Resume</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.controlBtn, styles.stopBtn]}
              onPress={stopSession}
            >
              <Text style={[styles.controlBtnText, styles.stopBtnText]}>⏹ Stop</Text>
            </TouchableOpacity>
          </View>
        </View>
        <AdBanner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Focus Timer</Text>
        <TouchableOpacity onPress={() => setShowHistory(true)}>
          <Text style={styles.historyBtn}>📊</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Today's Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayStats.totalMinutes}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayStats.sessionsCompleted}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Session Type</Text>
        <View style={styles.sessionTypes}>
          {(Object.keys(SESSION_PRESETS) as SessionType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.sessionTypeCard,
                sessionType === type && {
                  borderColor: SESSION_PRESETS[type].color,
                  borderWidth: 2,
                },
              ]}
              onPress={() => {
                if (type === 'custom') {
                  setShowCustomSetup(true);
                } else {
                  setSessionType(type);
                }
              }}
            >
              <Text style={styles.sessionTypeName}>
                {SESSION_PRESETS[type].name}
              </Text>
              <Text style={styles.sessionTypeDuration}>
                {type === 'custom' ? `${data.customDuration} min` : `${SESSION_PRESETS[type].duration} min`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.breakSection}>
          <View style={styles.breakHeader}>
            <Text style={styles.sectionTitle}>Break Interval (Optional)</Text>
            <TouchableOpacity
              onPress={() => setBreakInterval(0)}
              disabled={breakInterval === 0}
            >
              <Text style={[styles.clearBtn, breakInterval === 0 && styles.clearBtnDisabled]}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.breakOptions}>
            {[5, 10, 15, 20].map((mins) => (
              <TouchableOpacity
                key={mins}
                style={[
                  styles.breakBtn,
                  breakInterval === mins && styles.breakBtnActive,
                ]}
                onPress={() => setBreakInterval(mins)}
              >
                <Text
                  style={[
                    styles.breakBtnText,
                    breakInterval === mins && styles.breakBtnTextActive,
                  ]}
                >
                  {mins} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={startSession}>
          <Text style={styles.startBtnText}>Start Session</Text>
        </TouchableOpacity>
      </ScrollView>

      <AdBanner />

      {/* Custom Setup Modal */}
      <Modal visible={showCustomSetup} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Custom Session</Text>
            <Text style={styles.modalLabel}>Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={customMinutes}
              onChangeText={setCustomMinutes}
              keyboardType="number-pad"
              placeholder="1-120"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowCustomSetup(false)}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={setupCustomSession}
              >
                <Text style={styles.modalBtnText}>Set</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal visible={showHistory} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Session History</Text>
            <ScrollView style={styles.historyList}>
              {data.history.length === 0 ? (
                <Text style={styles.emptyText}>No sessions yet</Text>
              ) : (
                data.history.map((session) => (
                  <View key={session.id} style={styles.historyItem}>
                    <View style={styles.historyItemHeader}>
                      <Text style={styles.historyItemType}>
                        {SESSION_PRESETS[session.type].name}
                      </Text>
                      {session.interrupted && (
                        <Text style={styles.interruptedBadge}>Interrupted</Text>
                      )}
                    </View>
                    <Text style={styles.historyItemDuration}>
                      {session.duration} minutes
                    </Text>
                    <Text style={styles.historyItemDate}>
                      {new Date(session.completedAt).toLocaleString()}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowHistory(false)}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.gray.light },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  historyBtn: { fontSize: 28 },
  content: { flex: 1 },
  contentPadding: { padding: spacing.lg, paddingBottom: 100 },
  statsCard: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.xl, marginBottom: spacing.xl, elevation: 2 },
  statsTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: spacing.lg, textAlign: 'center', color: colors.text },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 36, fontWeight: 'bold', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.gray.dark, marginTop: spacing.xs },
  statDivider: { width: 1, height: 40, backgroundColor: colors.gray.light },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: spacing.md, color: colors.text },
  sessionTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  sessionTypeCard: { width: '48%', backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  sessionTypeName: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: spacing.xs },
  sessionTypeDuration: { fontSize: 14, color: colors.gray.dark },
  breakSection: { marginBottom: spacing.xl },
  breakHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  clearBtn: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  clearBtnDisabled: { color: colors.gray.medium },
  breakOptions: { flexDirection: 'row', gap: spacing.sm },
  breakBtn: { flex: 1, backgroundColor: colors.gray.light, padding: spacing.md, borderRadius: 12, alignItems: 'center' },
  breakBtnActive: { backgroundColor: colors.primary },
  breakBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },
  breakBtnTextActive: { color: colors.white },
  startBtn: { backgroundColor: colors.primary, paddingVertical: spacing.xl, borderRadius: 16, alignItems: 'center', elevation: 4 },
  startBtnText: { color: colors.white, fontSize: 20, fontWeight: 'bold' },

  // Timer View
  timerContainer: { flex: 1, padding: spacing.xl, justifyContent: 'space-between' },
  sessionInfo: { alignItems: 'center', marginTop: spacing.xl },
  sessionTypeText: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  breakInfo: { fontSize: 14, color: colors.gray.dark, marginTop: spacing.xs },
  dndIndicator: { alignItems: 'center', backgroundColor: colors.gray.light, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: 20, alignSelf: 'center' },
  dndIcon: { fontSize: 24, marginBottom: spacing.xs },
  dndText: { fontSize: 12, color: colors.gray.dark, fontWeight: '600' },
  timerCircle: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center', position: 'relative' },
  timerText: { fontSize: 72, fontWeight: 'bold', color: colors.text },
  progressRing: { position: 'absolute', bottom: -20, width: 200, height: 6, backgroundColor: colors.gray.light, borderRadius: 3, overflow: 'hidden' },
  progressBar: { position: 'absolute', bottom: 0, width: '100%', borderRadius: 3 },
  controls: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  controlBtn: { flex: 1, backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: 12, alignItems: 'center' },
  controlBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  stopBtn: { backgroundColor: colors.status.error },
  stopBtnText: { color: colors.white },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl },
  modalContent: { backgroundColor: colors.white, borderRadius: 24, padding: spacing.xl },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xl, textAlign: 'center' },
  modalLabel: { fontSize: 14, fontWeight: '600', marginBottom: spacing.sm, color: colors.text },
  input: { backgroundColor: colors.gray.light, padding: spacing.lg, borderRadius: 12, fontSize: 16, marginBottom: spacing.xl },
  modalButtons: { flexDirection: 'row', gap: spacing.md },
  modalBtn: { flex: 1, paddingVertical: spacing.lg, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: colors.gray.light },
  modalBtnConfirm: { backgroundColor: colors.primary },
  modalBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  modalBtnTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  historyList: { maxHeight: 400, marginBottom: spacing.lg },
  emptyText: { textAlign: 'center', color: colors.gray.medium, fontSize: 16, paddingVertical: spacing.xl },
  historyItem: { backgroundColor: colors.gray.light, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.md },
  historyItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  historyItemType: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  interruptedBadge: { fontSize: 10, color: colors.status.error, backgroundColor: colors.gray.light, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 8, fontWeight: '600' },
  historyItemDuration: { fontSize: 14, color: colors.primary, fontWeight: '600', marginBottom: spacing.xs },
  historyItemDate: { fontSize: 12, color: colors.gray.dark },
  closeBtn: { backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: 12, alignItems: 'center' },
  closeBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
