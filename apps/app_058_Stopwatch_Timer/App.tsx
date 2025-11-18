import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, FlatList, Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const SESSIONS_KEY = '@Stopwatch_Sessions';

interface Lap {
  lapNumber: number;
  time: number;
  totalTime: number;
}

interface SavedSession {
  id: string;
  type: 'stopwatch' | 'timer';
  duration: number;
  laps: Lap[];
  timestamp: string;
}

export default function App() {
  const [mode, setMode] = useState<'stopwatch' | 'timer'>('stopwatch');
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [timerDuration, setTimerDuration] = useState(60);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [count, setCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prev => {
          if (mode === 'timer') {
            if (prev <= 0) {
              handleStop();
              return 0;
            }
            return prev - 10;
          }
          return prev + 10;
        });
      }, 10);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(SESSIONS_KEY);
      if (saved) setSessions(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveSession = async () => {
    const session: SavedSession = {
      id: Date.now().toString(),
      type: mode,
      duration: time,
      laps,
      timestamp: new Date().toISOString(),
    };

    const updated = [session, ...sessions].slice(0, 50);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
    setSessions(updated);

    const newCount = count + 1;
    setCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleStop = () => {
    setIsRunning(false);
    if (time > 0) saveSession();
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(mode === 'timer' ? timerDuration * 1000 : 0);
    setLaps([]);
  };

  const handleLap = () => {
    if (!isRunning) return;
    const prevLapTime = laps.length > 0 ? laps[laps.length - 1].totalTime : 0;
    const lapTime = time - prevLapTime;
    setLaps([...laps, { lapNumber: laps.length + 1, time: lapTime, totalTime: time }]);
  };

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    const minStr = String(minutes).padStart(2, '0');
    const secStr = String(seconds).padStart(2, '0');
    const msStr = String(milliseconds).padStart(2, '0');
    return minStr + ':' + secStr + '.' + msStr;
  };

  const changeMode = (newMode: 'stopwatch' | 'timer') => {
    setMode(newMode);
    setIsRunning(false);
    setLaps([]);
    setTime(newMode === 'timer' ? timerDuration * 1000 : 0);
  };

  const setTimerMinutes = (minutes: number) => {
    setTimerDuration(minutes);
    if (!isRunning) setTime(minutes * 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Stopwatch & Timer</Text>
        <TouchableOpacity style={styles.sessionsBtn} onPress={() => setShowSessions(true)}>
          <Text style={styles.sessionsBtnText}>Sessions</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'stopwatch' && styles.modeBtnActive]}
          onPress={() => changeMode('stopwatch')}
        >
          <Text style={[styles.modeText, mode === 'stopwatch' && styles.modeTextActive]}>
            Stopwatch
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'timer' && styles.modeBtnActive]}
          onPress={() => changeMode('timer')}
        >
          <Text style={[styles.modeText, mode === 'timer' && styles.modeTextActive]}>
            Timer
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.timeDisplay}>
          <Text style={styles.timeText}>{formatTime(Math.abs(time))}</Text>
        </View>

        {mode === 'timer' && !isRunning && (
          <View style={styles.timerPresets}>
            <Text style={styles.presetsTitle}>Quick Set</Text>
            <View style={styles.presetsRow}>
              {[1, 3, 5, 10, 15, 30, 45, 60].map(min => (
                <TouchableOpacity
                  key={min}
                  style={[
                    styles.presetBtn,
                    timerDuration === min && styles.presetBtnActive,
                  ]}
                  onPress={() => setTimerMinutes(min)}
                >
                  <Text style={[
                    styles.presetText,
                    timerDuration === min && styles.presetTextActive,
                  ]}>
                    {min}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn} onPress={handleReset}>
            <Text style={styles.controlBtnText}>Reset</Text>
          </TouchableOpacity>

          {mode === 'stopwatch' && (
            <TouchableOpacity
              style={[styles.controlBtn, styles.lapBtn]}
              onPress={handleLap}
              disabled={!isRunning}
            >
              <Text style={[styles.controlBtnText, !isRunning && styles.disabled]}>
                Lap
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.controlBtn, styles.startBtn, isRunning && styles.pauseBtn]}
            onPress={handleStartPause}
          >
            <Text style={styles.startBtnText}>
              {isRunning ? 'Pause' : 'Start'}
            </Text>
          </TouchableOpacity>
        </View>

        {laps.length > 0 && (
          <View style={styles.lapsSection}>
            <Text style={styles.lapsTitle}>Laps ({laps.length})</Text>
            {[...laps].reverse().map(lap => (
              <View key={lap.lapNumber} style={styles.lapCard}>
                <Text style={styles.lapNumber}>Lap {lap.lapNumber}</Text>
                <View>
                  <Text style={styles.lapTime}>{formatTime(lap.time)}</Text>
                  <Text style={styles.lapTotal}>Total: {formatTime(lap.totalTime)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <AdBanner />

      <Modal visible={showSessions} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Saved Sessions</Text>
            <TouchableOpacity onPress={() => setShowSessions(false)}>
              <Text style={styles.closeBtn}>Close</Text>
            </TouchableOpacity>
          </View>

          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No saved sessions</Text>
            </View>
          ) : (
            <FlatList
              data={sessions}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <Text style={styles.sessionType}>
                      {item.type === 'stopwatch' ? '⏱️' : '⏲️'} {item.type.toUpperCase()}
                    </Text>
                    <Text style={styles.sessionDate}>
                      {new Date(item.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.sessionTime}>{formatTime(item.duration)}</Text>
                  {item.laps.length > 0 && (
                    <Text style={styles.sessionLaps}>
                      {item.laps.length} laps
                    </Text>
                  )}
                </View>
              )}
              contentContainerStyle={styles.sessionsList}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray.light },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  sessionsBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.primary, borderRadius: 8 },
  sessionsBtnText: { fontSize: 14, color: colors.white, fontWeight: '600' },
  modeToggle: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  modeBtn: { flex: 1, padding: spacing.md, backgroundColor: colors.gray.light, borderRadius: 12, alignItems: 'center' },
  modeBtnActive: { backgroundColor: colors.primary },
  modeText: { fontSize: 16, fontWeight: '600', color: colors.text },
  modeTextActive: { color: colors.white },
  timeDisplay: { alignItems: 'center', paddingVertical: spacing['3xl'] },
  timeText: { fontSize: 64, fontWeight: 'bold', color: colors.primary },
  timerPresets: { padding: spacing.lg },
  presetsTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  presetBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.gray.light, borderRadius: 8 },
  presetBtnActive: { backgroundColor: colors.primary },
  presetText: { fontSize: 14, fontWeight: '600', color: colors.text },
  presetTextActive: { color: colors.white },
  controls: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  controlBtn: { flex: 1, padding: spacing.lg, backgroundColor: colors.gray.light, borderRadius: 12, alignItems: 'center' },
  lapBtn: { backgroundColor: colors.secondary },
  startBtn: { backgroundColor: colors.status.success },
  pauseBtn: { backgroundColor: colors.status.warning },
  controlBtnText: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  startBtnText: { fontSize: 16, fontWeight: 'bold', color: colors.white },
  disabled: { color: colors.gray.medium },
  lapsSection: { padding: spacing.lg },
  lapsTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  lapCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, marginBottom: spacing.sm, elevation: 1 },
  lapNumber: { fontSize: 16, fontWeight: '600', color: colors.text },
  lapTime: { fontSize: 18, fontWeight: 'bold', color: colors.primary, textAlign: 'right' },
  lapTotal: { fontSize: 12, color: colors.gray.dark, textAlign: 'right', marginTop: spacing.xs },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray.light },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  closeBtn: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: colors.gray.medium },
  sessionsList: { padding: spacing.lg },
  sessionCard: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: 12, marginBottom: spacing.md, elevation: 2 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  sessionType: { fontSize: 14, fontWeight: '600', color: colors.primary },
  sessionDate: { fontSize: 12, color: colors.gray.dark },
  sessionTime: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  sessionLaps: { fontSize: 12, color: colors.gray.dark, marginTop: spacing.xs },
});
