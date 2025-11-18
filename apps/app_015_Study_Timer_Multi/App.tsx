import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Study_Timer_Multi_data';
const MAX_TIMERS = 5;

type TimerStatus = 'stopped' | 'running' | 'paused';

interface Timer {
  id: string;
  name: string;
  duration: number; // in seconds
  remaining: number; // in seconds
  status: TimerStatus;
}

export default function App() {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState('25');
  const [count, setCount] = useState(0);
  const intervalsRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    initializeAds();
    loadData();
    return () => {
      Object.values(intervalsRef.current).forEach(clearInterval);
    };
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const loaded = JSON.parse(saved);
        // Reset all timers to stopped when loading
        const reset = loaded.map((t: Timer) => ({ ...t, status: 'stopped' as TimerStatus, remaining: t.duration }));
        setTimers(reset);
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (data: Timer[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setTimers(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const addTimer = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a timer name');
      return;
    }
    const mins = parseInt(minutes);
    if (isNaN(mins) || mins < 1 || mins > 999) {
      Alert.alert('Error', 'Please enter valid minutes (1-999)');
      return;
    }
    if (timers.length >= MAX_TIMERS) {
      Alert.alert('Limit Reached', `Maximum ${MAX_TIMERS} timers allowed`);
      return;
    }

    const duration = mins * 60;
    const newTimer: Timer = {
      id: Date.now().toString(),
      name: name.trim(),
      duration,
      remaining: duration,
      status: 'stopped',
    };
    saveData([...timers, newTimer]);
    setName('');
    setMinutes('25');
    setShowModal(false);
    const newCount = count + 1;
    setCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const startTimer = (id: string) => {
    const timer = timers.find((t) => t.id === id);
    if (!timer || timer.remaining <= 0) return;

    const updated = timers.map((t) =>
      t.id === id ? { ...t, status: 'running' as TimerStatus } : t
    );
    setTimers(updated);

    intervalsRef.current[id] = setInterval(() => {
      setTimers((prev) => {
        const current = prev.find((t) => t.id === id);
        if (!current || current.remaining <= 0) {
          if (intervalsRef.current[id]) {
            clearInterval(intervalsRef.current[id]);
            delete intervalsRef.current[id];
          }
          if (current && current.remaining <= 0) {
            playSound();
            Alert.alert('Timer Complete', `${current.name} finished!`);
          }
          return prev.map((t) => (t.id === id ? { ...t, status: 'stopped' as TimerStatus } : t));
        }
        return prev.map((t) => (t.id === id ? { ...t, remaining: t.remaining - 1 } : t));
      });
    }, 1000);
  };

  const pauseTimer = (id: string) => {
    if (intervalsRef.current[id]) {
      clearInterval(intervalsRef.current[id]);
      delete intervalsRef.current[id];
    }
    const updated = timers.map((t) =>
      t.id === id ? { ...t, status: 'paused' as TimerStatus } : t
    );
    setTimers(updated);
  };

  const resetTimer = (id: string) => {
    if (intervalsRef.current[id]) {
      clearInterval(intervalsRef.current[id]);
      delete intervalsRef.current[id];
    }
    const updated = timers.map((t) =>
      t.id === id ? { ...t, remaining: t.duration, status: 'stopped' as TimerStatus } : t
    );
    setTimers(updated);
  };

  const deleteTimer = (id: string) => {
    if (intervalsRef.current[id]) {
      clearInterval(intervalsRef.current[id]);
      delete intervalsRef.current[id];
    }
    Alert.alert('Delete Timer', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => saveData(timers.filter((t) => t.id !== id)) },
    ]);
  };

  const playSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3' },
        { shouldPlay: true }
      );
      await sound.playAsync();
    } catch (error) {
      console.log('Sound error:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: TimerStatus): string => {
    switch (status) {
      case 'running':
        return colors.status.success;
      case 'paused':
        return colors.status.warning;
      default:
        return colors.gray.medium;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Multi Timer</Text>
        <Text style={styles.count}>
          {timers.length}/{MAX_TIMERS}
        </Text>
      </View>

      <FlatList
        data={timers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⏱️</Text>
            <Text style={styles.emptyText}>No timers yet</Text>
            <Text style={styles.emptySubtext}>Create up to {MAX_TIMERS} simultaneous timers</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.timerCard}>
            <View style={styles.timerHeader}>
              <Text style={styles.timerName}>{item.name}</Text>
              <TouchableOpacity onPress={() => deleteTimer(item.id)}>
                <Text style={styles.deleteBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timerDisplay}>
              <Text style={[styles.timeText, { color: getStatusColor(item.status) }]}>
                {formatTime(item.remaining)}
              </Text>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            </View>

            <View style={styles.progress}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${(item.remaining / item.duration) * 100}%` },
                ]}
              />
            </View>

            <View style={styles.timerControls}>
              {item.status === 'stopped' && (
                <TouchableOpacity
                  style={[styles.controlBtn, styles.startBtn]}
                  onPress={() => startTimer(item.id)}
                  disabled={item.remaining <= 0}
                >
                  <Text style={styles.controlBtnText}>▶ Start</Text>
                </TouchableOpacity>
              )}

              {item.status === 'running' && (
                <TouchableOpacity
                  style={[styles.controlBtn, styles.pauseBtn]}
                  onPress={() => pauseTimer(item.id)}
                >
                  <Text style={styles.controlBtnText}>⏸ Pause</Text>
                </TouchableOpacity>
              )}

              {item.status === 'paused' && (
                <TouchableOpacity
                  style={[styles.controlBtn, styles.resumeBtn]}
                  onPress={() => startTimer(item.id)}
                >
                  <Text style={styles.controlBtnText}>▶ Resume</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.controlBtn, styles.resetBtn]}
                onPress={() => resetTimer(item.id)}
              >
                <Text style={[styles.controlBtnText, styles.resetBtnText]}>↻ Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity
        style={[styles.fab, timers.length >= MAX_TIMERS && styles.fabDisabled]}
        onPress={() => setShowModal(true)}
        disabled={timers.length >= MAX_TIMERS}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AdBanner />

      {/* Add Timer Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Timer</Text>

            <Text style={styles.label}>Timer Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Study Session"
              placeholderTextColor={colors.gray.medium}
              autoFocus
            />

            <Text style={styles.label}>Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={minutes}
              onChangeText={setMinutes}
              placeholder="25"
              placeholderTextColor={colors.gray.medium}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setShowModal(false);
                  setName('');
                  setMinutes('25');
                }}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnAdd]} onPress={addTimer}>
                <Text style={styles.modalBtnText}>Add Timer</Text>
              </TouchableOpacity>
            </View>
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
  count: { fontSize: 16, color: colors.gray.dark, fontWeight: '600' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', marginTop: spacing['3xl'] },
  emptyIcon: { fontSize: 64, marginBottom: spacing.lg },
  emptyText: { fontSize: 20, fontWeight: '600', color: colors.gray.dark, marginBottom: spacing.sm },
  emptySubtext: { fontSize: 14, color: colors.gray.medium, textAlign: 'center' },
  timerCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  timerName: { fontSize: 18, fontWeight: 'bold', color: colors.text, flex: 1 },
  deleteBtn: { fontSize: 24, color: colors.status.error, padding: spacing.sm },
  timerDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  timeText: { fontSize: 48, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  progress: {
    height: 8,
    backgroundColor: colors.gray.light,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressBar: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  timerControls: { flexDirection: 'row', gap: spacing.sm },
  controlBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtn: { backgroundColor: colors.status.success },
  pauseBtn: { backgroundColor: colors.status.warning },
  resumeBtn: { backgroundColor: colors.status.success },
  resetBtn: { backgroundColor: colors.gray.light },
  controlBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  resetBtnText: { color: colors.text },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabDisabled: { backgroundColor: colors.gray.medium },
  fabText: { color: colors.white, fontSize: 32, fontWeight: '300' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', color: colors.gray.dark, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  modalButtons: { flexDirection: 'row', gap: spacing.md },
  modalBtn: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: colors.gray.light },
  modalBtnAdd: { backgroundColor: colors.primary },
  modalBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  modalBtnTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
