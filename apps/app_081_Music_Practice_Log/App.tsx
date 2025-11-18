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
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Music_Practice_Tracker_data';
const GOALS_KEY = '@Music_Practice_Goals';

interface PracticeSession {
  id: string;
  instrument: string;
  date: string;
  duration: number; // in minutes
  pieces: string[];
  notes: string;
  createdAt: string;
}

interface WeeklyGoal {
  hoursPerWeek: number;
}

interface InstrumentStats {
  totalHours: number;
  sessionCount: number;
}

type Instrument = 'Piano' | 'Guitar' | 'Violin' | 'Drums' | 'Voice' | 'Other';

const INSTRUMENTS: Instrument[] = ['Piano', 'Guitar', 'Violin', 'Drums', 'Voice', 'Other'];

const INSTRUMENT_EMOJIS: Record<Instrument, string> = {
  Piano: '🎹',
  Guitar: '🎸',
  Violin: '🎻',
  Drums: '🥁',
  Voice: '🎤',
  Other: '🎵',
};

export default function App() {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument>('Piano');
  const [pieces, setPieces] = useState<string[]>([]);
  const [pieceInput, setPieceInput] = useState('');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('');
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal>({ hoursPerWeek: 7 });
  const [goalInput, setGoalInput] = useState('7');
  const [activeTab, setActiveTab] = useState<'log' | 'calendar' | 'stats'>('log');
  const [adCount, setAdCount] = useState(0);

  // Timer states
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeAds();
    loadData();
    loadGoals();
  }, []);

  useEffect(() => {
    if (isTimerRunning) {
      timerInterval.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [isTimerRunning]);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setSessions(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const loadGoals = async () => {
    try {
      const saved = await AsyncStorage.getItem(GOALS_KEY);
      if (saved) {
        const goal = JSON.parse(saved);
        setWeeklyGoal(goal);
        setGoalInput(goal.hoursPerWeek.toString());
      }
    } catch (error) {
      console.error('Load goals error:', error);
    }
  };

  const saveData = async (data: PracticeSession[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSessions(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const saveGoals = async (goal: WeeklyGoal) => {
    try {
      await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goal));
      setWeeklyGoal(goal);
    } catch (error) {
      console.error('Save goals error:', error);
    }
  };

  const addPiece = () => {
    if (pieceInput.trim()) {
      setPieces([...pieces, pieceInput.trim()]);
      setPieceInput('');
    }
  };

  const removePiece = (index: number) => {
    setPieces(pieces.filter((_, i) => i !== index));
  };

  const addSession = () => {
    if (!duration || parseFloat(duration) <= 0) {
      Alert.alert('Error', 'Please enter a valid duration');
      return;
    }

    const newSession: PracticeSession = {
      id: Date.now().toString(),
      instrument: selectedInstrument,
      date: new Date().toISOString().split('T')[0],
      duration: parseFloat(duration),
      pieces: pieces,
      notes: notes,
      createdAt: new Date().toISOString(),
    };

    const newSessions = [newSession, ...sessions];
    saveData(newSessions);
    setShowModal(false);
    resetForm();

    const newCount = adCount + 1;
    setAdCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const saveTimerSession = () => {
    if (timerSeconds < 60) {
      Alert.alert('Error', 'Session too short (minimum 1 minute)');
      return;
    }

    const minutes = Math.floor(timerSeconds / 60);
    const newSession: PracticeSession = {
      id: Date.now().toString(),
      instrument: selectedInstrument,
      date: new Date().toISOString().split('T')[0],
      duration: minutes,
      pieces: pieces,
      notes: notes,
      createdAt: new Date().toISOString(),
    };

    const newSessions = [newSession, ...sessions];
    saveData(newSessions);
    setShowTimerModal(false);
    resetTimer();
    resetForm();
  };

  const resetForm = () => {
    setSelectedInstrument('Piano');
    setPieces([]);
    setNotes('');
    setDuration('');
    setPieceInput('');
  };

  const resetTimer = () => {
    setTimerSeconds(0);
    setIsTimerRunning(false);
  };

  const deleteSession = (id: string) => {
    Alert.alert('Delete Session', 'Are you sure you want to delete this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => saveData(sessions.filter((s) => s.id !== id)),
      },
    ]);
  };

  const updateGoal = () => {
    const hours = parseFloat(goalInput);
    if (hours > 0) {
      saveGoals({ hoursPerWeek: hours });
      setShowGoalsModal(false);
    }
  };

  // Statistics calculations
  const getTotalHours = () => {
    return sessions.reduce((sum, s) => sum + s.duration, 0) / 60;
  };

  const getStreak = () => {
    if (sessions.length === 0) return 0;
    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const session of sortedSessions) {
      const sessionDate = new Date(session.date);
      sessionDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === streak) {
        streak++;
      } else if (diffDays > streak) {
        break;
      }
    }
    return streak;
  };

  const getAveragePerDay = () => {
    if (sessions.length === 0) return 0;
    const oldest = new Date(
      Math.min(...sessions.map((s) => new Date(s.createdAt).getTime()))
    );
    const daysSince = Math.max(
      1,
      Math.ceil((Date.now() - oldest.getTime()) / (1000 * 60 * 60 * 24))
    );
    return getTotalHours() / daysSince;
  };

  const getInstrumentStats = (): Record<string, InstrumentStats> => {
    const stats: Record<string, InstrumentStats> = {};
    sessions.forEach((session) => {
      if (!stats[session.instrument]) {
        stats[session.instrument] = { totalHours: 0, sessionCount: 0 };
      }
      stats[session.instrument].totalHours += session.duration / 60;
      stats[session.instrument].sessionCount += 1;
    });
    return stats;
  };

  const getWeeklyProgress = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = sessions.filter(
      (s) => new Date(s.date) >= weekAgo
    );
    const hoursThisWeek = thisWeek.reduce((sum, s) => sum + s.duration, 0) / 60;
    return {
      current: hoursThisWeek,
      goal: weeklyGoal.hoursPerWeek,
      percentage: Math.min(100, (hoursThisWeek / weeklyGoal.hoursPerWeek) * 100),
    };
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCalendarDates = () => {
    const dates: { [key: string]: PracticeSession[] } = {};
    sessions.forEach((session) => {
      if (!dates[session.date]) {
        dates[session.date] = [];
      }
      dates[session.date].push(session);
    });
    return Object.keys(dates)
      .sort((a, b) => b.localeCompare(a))
      .map((date) => ({ date, sessions: dates[date] }));
  };

  const weeklyProgress = getWeeklyProgress();
  const instrumentStats = getInstrumentStats();

  const renderSessionItem = ({ item }: { item: PracticeSession }) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onLongPress={() => deleteSession(item.id)}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.sessionInstrument}>
          <Text style={styles.instrumentEmoji}>{INSTRUMENT_EMOJIS[item.instrument as Instrument]}</Text>
          <Text style={styles.instrumentText}>{item.instrument}</Text>
        </View>
        <Text style={styles.sessionDuration}>{item.duration} min</Text>
      </View>
      <Text style={styles.sessionDate}>{formatDate(item.date)}</Text>
      {item.pieces.length > 0 && (
        <View style={styles.piecesContainer}>
          <Text style={styles.piecesLabel}>Pieces:</Text>
          {item.pieces.map((piece, index) => (
            <Text key={index} style={styles.pieceText}>• {piece}</Text>
          ))}
        </View>
      )}
      {item.notes && <Text style={styles.notesText}>{item.notes}</Text>}
    </TouchableOpacity>
  );

  const renderCalendarView = () => {
    const calendarData = getCalendarDates();
    return (
      <FlatList
        data={calendarData}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.calendarDay}>
            <Text style={styles.calendarDate}>{formatDate(item.date)}</Text>
            <View style={styles.calendarSessions}>
              {item.sessions.map((session) => (
                <View key={session.id} style={styles.calendarSessionItem}>
                  <Text style={styles.calendarSessionEmoji}>
                    {INSTRUMENT_EMOJIS[session.instrument as Instrument]}
                  </Text>
                  <Text style={styles.calendarSessionText}>
                    {session.instrument} - {session.duration} min
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No practice sessions yet</Text>
        }
      />
    );
  };

  const renderStatsView = () => (
    <ScrollView style={styles.statsContainer} contentContainerStyle={styles.statsContent}>
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Overall Statistics</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Hours</Text>
          <Text style={styles.statValue}>{getTotalHours().toFixed(1)} hrs</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Sessions</Text>
          <Text style={styles.statValue}>{sessions.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Current Streak</Text>
          <Text style={styles.statValue}>{getStreak()} days</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Daily Average</Text>
          <Text style={styles.statValue}>{getAveragePerDay().toFixed(1)} hrs</Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.goalHeader}>
          <Text style={styles.statsTitle}>Weekly Goal</Text>
          <TouchableOpacity onPress={() => setShowGoalsModal(true)}>
            <Text style={styles.editGoal}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${weeklyProgress.percentage}%` }]}
          />
        </View>
        <Text style={styles.progressText}>
          {weeklyProgress.current.toFixed(1)} / {weeklyProgress.goal} hours (
          {weeklyProgress.percentage.toFixed(0)}%)
        </Text>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>By Instrument</Text>
        {Object.entries(instrumentStats).map(([instrument, stats]) => (
          <View key={instrument} style={styles.instrumentStatRow}>
            <Text style={styles.instrumentStatEmoji}>
              {INSTRUMENT_EMOJIS[instrument as Instrument]}
            </Text>
            <View style={styles.instrumentStatInfo}>
              <Text style={styles.instrumentStatName}>{instrument}</Text>
              <Text style={styles.instrumentStatDetail}>
                {stats.totalHours.toFixed(1)} hrs • {stats.sessionCount} sessions
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Practice Tracker</Text>
        <TouchableOpacity
          style={styles.timerButton}
          onPress={() => setShowTimerModal(true)}
        >
          <Text style={styles.timerButtonText}>⏱</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'log' && styles.tabActive]}
          onPress={() => setActiveTab('log')}
        >
          <Text style={[styles.tabText, activeTab === 'log' && styles.tabTextActive]}>
            Log
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'calendar' && styles.tabActive]}
          onPress={() => setActiveTab('calendar')}
        >
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.tabTextActive]}>
            Calendar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.tabActive]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
            Stats
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'log' && (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderSessionItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No practice sessions yet. Tap + to add!</Text>
          }
        />
      )}

      {activeTab === 'calendar' && renderCalendarView()}
      {activeTab === 'stats' && renderStatsView()}

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AdBanner />

      {/* Add Session Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Practice Session</Text>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.label}>Instrument</Text>
              <View style={styles.instrumentGrid}>
                {INSTRUMENTS.map((instrument) => (
                  <TouchableOpacity
                    key={instrument}
                    style={[
                      styles.instrumentButton,
                      selectedInstrument === instrument && styles.instrumentButtonActive,
                    ]}
                    onPress={() => setSelectedInstrument(instrument)}
                  >
                    <Text style={styles.instrumentButtonEmoji}>
                      {INSTRUMENT_EMOJIS[instrument]}
                    </Text>
                    <Text
                      style={[
                        styles.instrumentButtonText,
                        selectedInstrument === instrument &&
                          styles.instrumentButtonTextActive,
                      ]}
                    >
                      {instrument}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                placeholder="30"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Pieces Practiced</Text>
              <View style={styles.pieceInputContainer}>
                <TextInput
                  style={[styles.input, styles.pieceInput]}
                  value={pieceInput}
                  onChangeText={setPieceInput}
                  placeholder="Enter piece name"
                  onSubmitEditing={addPiece}
                />
                <TouchableOpacity style={styles.addPieceButton} onPress={addPiece}>
                  <Text style={styles.addPieceButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              {pieces.map((piece, index) => (
                <View key={index} style={styles.pieceItem}>
                  <Text style={styles.pieceItemText}>{piece}</Text>
                  <TouchableOpacity onPress={() => removePiece(index)}>
                    <Text style={styles.removePieceText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Practice notes..."
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={addSession}
              >
                <Text style={styles.addButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Timer Modal */}
      <Modal visible={showTimerModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Practice Timer</Text>

            <View style={styles.timerDisplay}>
              <Text style={styles.timerTime}>{formatTime(timerSeconds)}</Text>
            </View>

            <View style={styles.timerControls}>
              <TouchableOpacity
                style={[styles.timerControlButton, styles.resetButton]}
                onPress={resetTimer}
              >
                <Text style={styles.timerControlText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.timerControlButton,
                  isTimerRunning ? styles.pauseButton : styles.startButton,
                ]}
                onPress={() => setIsTimerRunning(!isTimerRunning)}
              >
                <Text style={styles.timerControlText}>
                  {isTimerRunning ? 'Pause' : 'Start'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.timerFormScroll}>
              <Text style={styles.label}>Instrument</Text>
              <View style={styles.instrumentGrid}>
                {INSTRUMENTS.map((instrument) => (
                  <TouchableOpacity
                    key={instrument}
                    style={[
                      styles.instrumentButton,
                      selectedInstrument === instrument && styles.instrumentButtonActive,
                    ]}
                    onPress={() => setSelectedInstrument(instrument)}
                  >
                    <Text style={styles.instrumentButtonEmoji}>
                      {INSTRUMENT_EMOJIS[instrument]}
                    </Text>
                    <Text
                      style={[
                        styles.instrumentButtonText,
                        selectedInstrument === instrument &&
                          styles.instrumentButtonTextActive,
                      ]}
                    >
                      {instrument}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Pieces Practiced (optional)</Text>
              <View style={styles.pieceInputContainer}>
                <TextInput
                  style={[styles.input, styles.pieceInput]}
                  value={pieceInput}
                  onChangeText={setPieceInput}
                  placeholder="Enter piece name"
                  onSubmitEditing={addPiece}
                />
                <TouchableOpacity style={styles.addPieceButton} onPress={addPiece}>
                  <Text style={styles.addPieceButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              {pieces.map((piece, index) => (
                <View key={index} style={styles.pieceItem}>
                  <Text style={styles.pieceItemText}>{piece}</Text>
                  <TouchableOpacity onPress={() => removePiece(index)}>
                    <Text style={styles.removePieceText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Practice notes..."
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowTimerModal(false);
                  resetTimer();
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={saveTimerSession}
              >
                <Text style={styles.addButtonText}>Save Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Goals Modal */}
      <Modal visible={showGoalsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Weekly Goal</Text>
            <Text style={styles.label}>Hours per Week</Text>
            <TextInput
              style={styles.input}
              value={goalInput}
              onChangeText={setGoalInput}
              placeholder="7"
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowGoalsModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={updateGoal}
              >
                <Text style={styles.addButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  timerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerButtonText: {
    fontSize: 20,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: colors.gray.dark,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  sessionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sessionInstrument: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instrumentEmoji: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  instrumentText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  sessionDuration: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  sessionDate: {
    fontSize: 14,
    color: colors.gray.dark,
    marginBottom: spacing.sm,
  },
  piecesContainer: {
    marginTop: spacing.sm,
  },
  piecesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray.dark,
    marginBottom: 4,
  },
  pieceText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  notesText: {
    fontSize: 14,
    color: colors.gray.dark,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacing.xl,
    color: colors.gray.medium,
    fontSize: 16,
  },
  calendarDay: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  calendarDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  calendarSessions: {
    gap: spacing.sm,
  },
  calendarSessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarSessionEmoji: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  calendarSessionText: {
    fontSize: 14,
    color: colors.text,
  },
  statsContainer: {
    flex: 1,
  },
  statsContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  statsCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  statLabel: {
    fontSize: 16,
    color: colors.gray.dark,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  editGoal: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray.light,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.status.success,
  },
  progressText: {
    fontSize: 14,
    color: colors.gray.dark,
    textAlign: 'center',
  },
  instrumentStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  instrumentStatEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  instrumentStatInfo: {
    flex: 1,
  },
  instrumentStatName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  instrumentStatDetail: {
    fontSize: 14,
    color: colors.gray.dark,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  modalScroll: {
    maxHeight: 400,
  },
  timerFormScroll: {
    maxHeight: 300,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  instrumentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  instrumentButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  instrumentButtonActive: {
    backgroundColor: colors.accent + '20',
    borderColor: colors.primary,
  },
  instrumentButtonEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  instrumentButtonText: {
    fontSize: 12,
    color: colors.gray.dark,
  },
  instrumentButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pieceInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pieceInput: {
    flex: 1,
  },
  addPieceButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.accent,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPieceButtonText: {
    fontSize: 24,
    color: colors.white,
  },
  pieceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.gray.light,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  pieceItemText: {
    fontSize: 14,
    color: colors.text,
  },
  removePieceText: {
    fontSize: 18,
    color: colors.status.error,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray.light,
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  timerDisplay: {
    backgroundColor: colors.gray.light,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  timerTime: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
  },
  timerControls: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  timerControlButton: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: colors.gray.medium,
  },
  startButton: {
    backgroundColor: colors.status.success,
  },
  pauseButton: {
    backgroundColor: colors.status.warning,
  },
  timerControlText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
