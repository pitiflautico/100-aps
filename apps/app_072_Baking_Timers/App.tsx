import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, TextInput,
  Modal, ScrollView, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const TIMERS_KEY = '@Baking_Timers';

interface Timer {
  id: string;
  name: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  isFinished: boolean;
  createdAt: string;
}

interface Preset {
  name: string;
  emoji: string;
  minutes: number;
}

const PRESETS: Preset[] = [
  { name: 'Cookies', emoji: '🍪', minutes: 12 },
  { name: 'Cake', emoji: '🎂', minutes: 30 },
  { name: 'Bread', emoji: '🍞', minutes: 45 },
  { name: 'Pizza', emoji: '🍕', minutes: 15 },
  { name: 'Muffins', emoji: '🧁', minutes: 20 },
  { name: 'Brownies', emoji: '🍫', minutes: 25 },
];

export default function App() {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [timerName, setTimerName] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [count, setCount] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeAds();
    loadTimers();
    loadSound();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (sound) sound.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const activeTimers = timers.filter(t => t.isRunning && !t.isFinished);
    if (activeTimers.length > 0) {
      intervalRef.current = setInterval(() => {
        setTimers(prev => {
          const updated = prev.map(timer => {
            if (!timer.isRunning || timer.isFinished) return timer;

            const newRemaining = timer.remainingSeconds - 1;
            if (newRemaining <= 0) {
              playSound();
              return {
                ...timer,
                remainingSeconds: 0,
                isRunning: false,
                isFinished: true,
              };
            }

            return { ...timer, remainingSeconds: newRemaining };
          });

          saveTimers(updated);
          return updated;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timers]);

  const loadSound = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('./assets/notification.mp3'),
        { shouldPlay: false }
      );
      setSound(newSound);
    } catch (error) {
      console.log('Sound load error:', error);
    }
  };

  const playSound = async () => {
    try {
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.log('Sound play error:', error);
    }
  };

  const loadTimers = async () => {
    try {
      const saved = await AsyncStorage.getItem(TIMERS_KEY);
      if (saved) {
        const loaded = JSON.parse(saved);
        // Reset all timers to not running on app load
        setTimers(loaded.map((t: Timer) => ({ ...t, isRunning: false })));
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveTimers = async (data: Timer[]) => {
    try {
      await AsyncStorage.setItem(TIMERS_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const addTimer = (name: string, totalMinutes: number) => {
    if (timers.length >= 6) {
      Alert.alert('Limit Reached', 'Maximum 6 timers allowed');
      return;
    }

    const totalSecs = totalMinutes * 60;
    const newTimer: Timer = {
      id: Date.now().toString(),
      name,
      totalSeconds: totalSecs,
      remainingSeconds: totalSecs,
      isRunning: false,
      isPaused: false,
      isFinished: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [...timers, newTimer];
    setTimers(updated);
    saveTimers(updated);
    setShowAddModal(false);
    resetAddForm();

    const newCount = count + 1;
    setCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const addCustomTimer = () => {
    if (!timerName.trim()) {
      Alert.alert('Error', 'Please enter a timer name');
      return;
    }

    const mins = parseInt(minutes) || 0;
    const secs = parseInt(seconds) || 0;
    const totalMinutes = mins + secs / 60;

    if (totalMinutes === 0) {
      Alert.alert('Error', 'Please enter a valid time');
      return;
    }

    addTimer(timerName, totalMinutes);
  };

  const addPresetTimer = (preset: Preset) => {
    addTimer(preset.name + ' ' + preset.emoji, preset.minutes);
  };

  const resetAddForm = () => {
    setTimerName('');
    setMinutes('');
    setSeconds('');
  };

  const toggleTimer = (id: string) => {
    setTimers(prev => {
      const updated = prev.map(t => {
        if (t.id !== id) return t;

        if (t.isFinished) {
          // Reset timer
          return {
            ...t,
            remainingSeconds: t.totalSeconds,
            isRunning: true,
            isPaused: false,
            isFinished: false,
          };
        }

        return {
          ...t,
          isRunning: !t.isRunning,
          isPaused: !t.isRunning ? false : true,
        };
      });

      saveTimers(updated);
      return updated;
    });
  };

  const deleteTimer = (id: string) => {
    const updated = timers.filter(t => t.id !== id);
    setTimers(updated);
    saveTimers(updated);
  };

  const resetTimer = (id: string) => {
    setTimers(prev => {
      const updated = prev.map(t =>
        t.id === id
          ? {
              ...t,
              remainingSeconds: t.totalSeconds,
              isRunning: false,
              isPaused: false,
              isFinished: false,
            }
          : t
      );
      saveTimers(updated);
      return updated;
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerProgress = (timer: Timer): number => {
    return (timer.remainingSeconds / timer.totalSeconds) * 100;
  };

  const getTimerColor = (timer: Timer): string => {
    if (timer.isFinished) return colors.status.success;
    const progress = getTimerProgress(timer);
    if (progress < 25) return colors.status.error;
    if (progress < 50) return colors.status.warning;
    return colors.primary;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Baking Timers</Text>
        <Text style={styles.activeCount}>
          {timers.filter(t => t.isRunning).length}/{timers.length}
        </Text>
      </View>

      <FlatList
        data={timers}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>⏱️</Text>
            <Text style={styles.emptyText}>No timers yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add a timer</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.timerCard,
              item.isFinished && styles.timerCardFinished,
            ]}
          >
            <View style={styles.timerHeader}>
              <Text style={styles.timerName}>{item.name}</Text>
              <TouchableOpacity onPress={() => deleteTimer(item.id)}>
                <Text style={styles.deleteBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timerBody}>
              <Text
                style={[
                  styles.timeDisplay,
                  { color: getTimerColor(item) },
                  item.isFinished && styles.timeDisplayFinished,
                ]}
              >
                {formatTime(item.remainingSeconds)}
              </Text>

              {!item.isFinished && (
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${getTimerProgress(item)}%`,
                        backgroundColor: getTimerColor(item),
                      },
                    ]}
                  />
                </View>
              )}

              {item.isFinished && (
                <Text style={styles.finishedText}>Timer Finished!</Text>
              )}
            </View>

            <View style={styles.timerActions}>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  item.isRunning && styles.actionBtnPause,
                  item.isFinished && styles.actionBtnReset,
                ]}
                onPress={() => toggleTimer(item.id)}
              >
                <Text style={styles.actionBtnText}>
                  {item.isFinished
                    ? 'Restart'
                    : item.isRunning
                    ? 'Pause'
                    : 'Start'}
                </Text>
              </TouchableOpacity>

              {!item.isFinished && (
                <TouchableOpacity
                  style={styles.actionBtnSecondary}
                  onPress={() => resetTimer(item.id)}
                >
                  <Text style={styles.actionBtnSecondaryText}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      {timers.length < 6 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      <AdBanner />

      <Modal visible={showAddModal} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Timer</Text>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                resetAddForm();
              }}
            >
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Quick Presets</Text>
            <View style={styles.presetsGrid}>
              {PRESETS.map((preset, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.presetCard}
                  onPress={() => addPresetTimer(preset)}
                >
                  <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                  <Text style={styles.presetName}>{preset.name}</Text>
                  <Text style={styles.presetTime}>{preset.minutes} min</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Custom Timer</Text>
            <View style={styles.customForm}>
              <Text style={styles.label}>Timer Name</Text>
              <TextInput
                style={styles.input}
                value={timerName}
                onChangeText={setTimerName}
                placeholder="e.g., Chocolate Chip Cookies"
                placeholderTextColor={colors.gray.dark}
              />

              <Text style={styles.label}>Duration</Text>
              <View style={styles.timeInputRow}>
                <View style={styles.timeInputGroup}>
                  <TextInput
                    style={styles.timeInput}
                    value={minutes}
                    onChangeText={setMinutes}
                    placeholder="00"
                    placeholderTextColor={colors.gray.dark}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                  <Text style={styles.timeLabel}>minutes</Text>
                </View>

                <Text style={styles.timeSeparator}>:</Text>

                <View style={styles.timeInputGroup}>
                  <TextInput
                    style={styles.timeInput}
                    value={seconds}
                    onChangeText={setSeconds}
                    placeholder="00"
                    placeholderTextColor={colors.gray.dark}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={styles.timeLabel}>seconds</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.addBtn}
                onPress={addCustomTimer}
              >
                <Text style={styles.addBtnText}>Add Timer</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
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
  activeCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray.dark,
  },
  list: { padding: spacing.lg, paddingBottom: 100 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 3,
  },
  emptyEmoji: { fontSize: 64, marginBottom: spacing.md },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray.dark,
    marginBottom: spacing.xs,
  },
  emptySubtext: { fontSize: 14, color: colors.gray.medium },
  timerCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    elevation: 2,
  },
  timerCardFinished: {
    borderWidth: 2,
    borderColor: colors.status.success,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  timerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  deleteBtn: {
    fontSize: 24,
    color: colors.gray.dark,
    fontWeight: '300',
    paddingHorizontal: spacing.sm,
  },
  timerBody: { marginBottom: spacing.lg },
  timeDisplay: {
    fontSize: 56,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.md,
    fontVariant: ['tabular-nums'],
  },
  timeDisplayFinished: { color: colors.status.success },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  finishedText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.status.success,
    textAlign: 'center',
  },
  timerActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnPause: { backgroundColor: colors.status.warning },
  actionBtnReset: { backgroundColor: colors.status.success },
  actionBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
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
    elevation: 8,
  },
  fabText: { fontSize: 32, fontWeight: '300', color: colors.white },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  closeBtn: { fontSize: 32, color: colors.gray.dark, fontWeight: '300' },
  modalContent: { flex: 1, padding: spacing.lg },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  presetCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  presetEmoji: { fontSize: 32, marginBottom: spacing.xs },
  presetName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  presetTime: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  customForm: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 16,
    color: colors.text,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  timeInputGroup: { flex: 1, alignItems: 'center' },
  timeInput: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: 12,
    color: colors.gray.dark,
    marginTop: spacing.xs,
  },
  timeSeparator: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  addBtn: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
});
