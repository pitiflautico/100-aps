import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Vibration,
} from 'react-native';
import {
  Provider as PaperProvider,
  Appbar,
  FAB,
  Card,
  Text,
  Portal,
  Modal,
  TextInput,
  Button,
  Chip,
  IconButton,
  ProgressBar,
  Menu,
  Divider,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';

// TypeScript Interfaces
interface Timer {
  id: string;
  name: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  isFinished: boolean;
  createdAt: number;
}

// AdMob Configuration
const bannerId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';

const STORAGE_KEY = '@baking_timers_data';

const PRESETS = [
  { name: 'Cookies', minutes: 12, icon: 'cookie', color: '#FF9800' },
  { name: 'Cake', minutes: 30, icon: 'cake', color: '#E91E63' },
  { name: 'Bread', minutes: 45, icon: 'bread-slice', color: '#795548' },
  { name: 'Muffins', minutes: 20, icon: 'muffin', color: '#9C27B0' },
  { name: 'Pizza', minutes: 15, icon: 'food', color: '#F44336' },
  { name: 'Cupcakes', minutes: 18, icon: 'cupcake', color: '#E91E63' },
];

const MAX_TIMERS = 6;

export default function App() {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [timerName, setTimerName] = useState('');
  const [timerMinutes, setTimerMinutes] = useState('');
  const [timerSeconds, setTimerSeconds] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load data from storage
  useEffect(() => {
    loadTimers();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Timer tick
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const hasRunningTimers = timers.some(t => t.isRunning && !t.isPaused);

    if (hasRunningTimers) {
      intervalRef.current = setInterval(() => {
        setTimers(prevTimers => {
          const updatedTimers = prevTimers.map(timer => {
            if (timer.isRunning && !timer.isPaused && timer.remainingSeconds > 0) {
              const newRemaining = timer.remainingSeconds - 1;

              if (newRemaining === 0) {
                // Timer finished
                Vibration.vibrate([0, 500, 200, 500]);
                return {
                  ...timer,
                  remainingSeconds: 0,
                  isRunning: false,
                  isFinished: true,
                };
              }

              return {
                ...timer,
                remainingSeconds: newRemaining,
              };
            }
            return timer;
          });

          saveTimersToStorage(updatedTimers);
          return updatedTimers;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timers]);

  const loadTimers = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const loadedTimers = JSON.parse(stored);
        // Stop all timers on load
        const stoppedTimers = loadedTimers.map((t: Timer) => ({
          ...t,
          isRunning: false,
          isPaused: true,
        }));
        setTimers(stoppedTimers);
      }
    } catch (error) {
      console.error('Error loading timers:', error);
    }
  };

  const saveTimersToStorage = async (timersToSave: Timer[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(timersToSave));
    } catch (error) {
      console.error('Error saving timers:', error);
    }
  };

  const saveTimers = (newTimers: Timer[]) => {
    setTimers(newTimers);
    saveTimersToStorage(newTimers);
  };

  const openModal = () => {
    setTimerName('');
    setTimerMinutes('');
    setTimerSeconds('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const addTimer = () => {
    if (!timerName.trim()) {
      Alert.alert('Error', 'Please enter timer name');
      return;
    }

    const minutes = parseInt(timerMinutes) || 0;
    const seconds = parseInt(timerSeconds) || 0;
    const totalSeconds = minutes * 60 + seconds;

    if (totalSeconds === 0) {
      Alert.alert('Error', 'Please enter a valid time');
      return;
    }

    if (timers.length >= MAX_TIMERS) {
      Alert.alert('Limit Reached', `You can only have ${MAX_TIMERS} timers at once`);
      return;
    }

    const newTimer: Timer = {
      id: Date.now().toString(),
      name: timerName.trim(),
      totalSeconds,
      remainingSeconds: totalSeconds,
      isRunning: false,
      isPaused: false,
      isFinished: false,
      createdAt: Date.now(),
    };

    const newTimers = [...timers, newTimer];
    saveTimers(newTimers);
    closeModal();
  };

  const addPresetTimer = (preset: typeof PRESETS[0]) => {
    if (timers.length >= MAX_TIMERS) {
      Alert.alert('Limit Reached', `You can only have ${MAX_TIMERS} timers at once`);
      return;
    }

    const totalSeconds = preset.minutes * 60;
    const newTimer: Timer = {
      id: Date.now().toString(),
      name: preset.name,
      totalSeconds,
      remainingSeconds: totalSeconds,
      isRunning: false,
      isPaused: false,
      isFinished: false,
      createdAt: Date.now(),
    };

    const newTimers = [...timers, newTimer];
    saveTimers(newTimers);
  };

  const startTimer = (id: string) => {
    const newTimers = timers.map(timer =>
      timer.id === id
        ? { ...timer, isRunning: true, isPaused: false, isFinished: false }
        : timer
    );
    saveTimers(newTimers);
  };

  const pauseTimer = (id: string) => {
    const newTimers = timers.map(timer =>
      timer.id === id ? { ...timer, isPaused: true } : timer
    );
    saveTimers(newTimers);
  };

  const resumeTimer = (id: string) => {
    const newTimers = timers.map(timer =>
      timer.id === id ? { ...timer, isPaused: false } : timer
    );
    saveTimers(newTimers);
  };

  const resetTimer = (id: string) => {
    const newTimers = timers.map(timer =>
      timer.id === id
        ? {
            ...timer,
            remainingSeconds: timer.totalSeconds,
            isRunning: false,
            isPaused: false,
            isFinished: false,
          }
        : timer
    );
    saveTimers(newTimers);
  };

  const deleteTimer = (id: string) => {
    Alert.alert('Delete Timer', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const newTimers = timers.filter(timer => timer.id !== id);
          saveTimers(newTimers);
        },
      },
    ]);
  };

  const deleteAllTimers = () => {
    Alert.alert('Delete All Timers', 'Are you sure you want to delete all timers?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All',
        style: 'destructive',
        onPress: () => {
          saveTimers([]);
        },
      },
    ]);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (timer: Timer): number => {
    return (timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds;
  };

  const renderTimerCard = (timer: Timer) => {
    const progress = getProgress(timer);
    const isActive = timer.isRunning && !timer.isPaused;

    return (
      <Card
        key={timer.id}
        style={[
          styles.timerCard,
          timer.isFinished && styles.finishedCard,
          isActive && styles.activeCard,
        ]}
      >
        <Card.Content>
          <View style={styles.timerHeader}>
            <Text
              variant="titleLarge"
              style={[
                styles.timerName,
                timer.isFinished && styles.finishedText,
              ]}
            >
              {timer.name}
            </Text>
            <IconButton
              icon="delete"
              size={20}
              iconColor="#d32f2f"
              onPress={() => deleteTimer(timer.id)}
            />
          </View>

          <Text
            variant="displayMedium"
            style={[
              styles.timerDisplay,
              timer.isFinished && styles.finishedText,
              isActive && styles.activeText,
            ]}
          >
            {formatTime(timer.remainingSeconds)}
          </Text>

          <ProgressBar
            progress={progress}
            color={timer.isFinished ? '#4CAF50' : isActive ? '#2196F3' : '#6200ee'}
            style={styles.progressBar}
          />

          {timer.isFinished && (
            <View style={styles.finishedBanner}>
              <IconButton icon="check-circle" size={24} iconColor="#4CAF50" />
              <Text variant="titleMedium" style={styles.finishedBannerText}>
                Timer Finished!
              </Text>
            </View>
          )}

          <View style={styles.timerActions}>
            {!timer.isRunning || timer.isPaused ? (
              <Button
                mode="contained"
                onPress={() => timer.isPaused ? resumeTimer(timer.id) : startTimer(timer.id)}
                icon={timer.isPaused ? 'play' : 'play'}
                disabled={timer.isFinished}
                style={styles.actionButton}
              >
                {timer.isPaused ? 'Resume' : 'Start'}
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={() => pauseTimer(timer.id)}
                icon="pause"
                style={styles.actionButton}
                buttonColor="#FF9800"
              >
                Pause
              </Button>
            )}
            <Button
              mode="outlined"
              onPress={() => resetTimer(timer.id)}
              icon="restart"
              style={styles.actionButton}
            >
              Reset
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="Baking Timers" />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Appbar.Action
                icon="dots-vertical"
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                deleteAllTimers();
              }}
              title="Delete All Timers"
              leadingIcon="delete-sweep"
            />
          </Menu>
        </Appbar.Header>

        {/* Presets */}
        <View style={styles.presetsContainer}>
          <Text variant="labelLarge" style={styles.presetsLabel}>
            Quick Presets
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsList}>
            {PRESETS.map((preset, index) => (
              <Card
                key={index}
                style={styles.presetCard}
                onPress={() => addPresetTimer(preset)}
              >
                <Card.Content style={styles.presetContent}>
                  <IconButton
                    icon={preset.icon}
                    size={28}
                    iconColor={preset.color}
                  />
                  <Text variant="labelMedium" style={styles.presetName}>
                    {preset.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.presetTime}>
                    {preset.minutes} min
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        </View>

        <Divider />

        {/* Timers List */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {timers.length === 0 ? (
            <View style={styles.emptyState}>
              <IconButton icon="timer-outline" size={64} iconColor="#ccc" />
              <Text variant="titleMedium" style={styles.emptyText}>
                No timers yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                Add a timer using the + button or select a preset above
              </Text>
            </View>
          ) : (
            <>
              <Text variant="labelLarge" style={styles.activeLabel}>
                Active Timers ({timers.length}/{MAX_TIMERS})
              </Text>
              {timers.map(renderTimerCard)}
            </>
          )}

          <View style={styles.adContainer}>
            <BannerAd unitId={bannerId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
          </View>
        </ScrollView>

        {/* Add Timer Modal */}
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={closeModal}
            contentContainerStyle={styles.modal}
          >
            <Text variant="titleLarge" style={styles.modalTitle}>
              Add Custom Timer
            </Text>

            <TextInput
              label="Timer Name *"
              value={timerName}
              onChangeText={setTimerName}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., Brownies, Roast"
            />

            <View style={styles.timeInputRow}>
              <TextInput
                label="Minutes"
                value={timerMinutes}
                onChangeText={setTimerMinutes}
                style={[styles.input, styles.timeInput]}
                mode="outlined"
                keyboardType="numeric"
                placeholder="0"
              />
              <Text variant="headlineMedium" style={styles.timeSeparator}>
                :
              </Text>
              <TextInput
                label="Seconds"
                value={timerSeconds}
                onChangeText={setTimerSeconds}
                style={[styles.input, styles.timeInput]}
                mode="outlined"
                keyboardType="numeric"
                placeholder="0"
              />
            </View>

            <View style={styles.modalActions}>
              <Button mode="outlined" onPress={closeModal} style={styles.modalButton}>
                Cancel
              </Button>
              <Button mode="contained" onPress={addTimer} style={styles.modalButton}>
                Add Timer
              </Button>
            </View>
          </Modal>
        </Portal>

        <FAB
          icon="plus"
          style={styles.fab}
          onPress={openModal}
          disabled={timers.length >= MAX_TIMERS}
        />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  presetsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 2,
  },
  presetsLabel: {
    marginBottom: 8,
    color: '#666',
  },
  presetsList: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  presetCard: {
    marginRight: 12,
    width: 100,
    elevation: 1,
  },
  presetContent: {
    alignItems: 'center',
    padding: 8,
  },
  presetName: {
    textAlign: 'center',
    marginTop: 4,
  },
  presetTime: {
    textAlign: 'center',
    color: '#999',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  activeLabel: {
    marginBottom: 12,
    color: '#666',
  },
  timerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  finishedCard: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  activeCard: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timerName: {
    fontWeight: 'bold',
    flex: 1,
  },
  timerDisplay: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginVertical: 8,
    color: '#6200ee',
  },
  finishedText: {
    color: '#4CAF50',
  },
  activeText: {
    color: '#2196F3',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginVertical: 12,
  },
  finishedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C8E6C9',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  finishedBannerText: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  timerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
  },
  emptySubtext: {
    marginTop: 8,
    color: '#999',
    textAlign: 'center',
  },
  adContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 12,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  timeSeparator: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#6200ee',
  },
});
