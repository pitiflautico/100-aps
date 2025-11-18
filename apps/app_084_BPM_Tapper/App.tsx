import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@BPM_Tapper_data';
const MAX_TAPS = 8;

interface TapHistory {
  id: string;
  bpm: number;
  tempo: string;
  date: string;
  taps: number;
}

interface TempoDescription {
  name: string;
  min: number;
  max: number;
  color: string;
  emoji: string;
}

const TEMPO_RANGES: TempoDescription[] = [
  { name: 'Larghissimo', min: 0, max: 24, color: '#1e3a8a', emoji: '🐌' },
  { name: 'Grave', min: 25, max: 45, color: '#1e40af', emoji: '🐢' },
  { name: 'Largo', min: 46, max: 60, color: '#2563eb', emoji: '🚶' },
  { name: 'Larghetto', min: 61, max: 66, color: '#3b82f6', emoji: '🚶‍♂️' },
  { name: 'Adagio', min: 67, max: 76, color: '#60a5fa', emoji: '🚴' },
  { name: 'Andante', min: 77, max: 108, color: '#34d399', emoji: '🏃' },
  { name: 'Moderato', min: 109, max: 120, color: '#fbbf24', emoji: '🏃‍♂️' },
  { name: 'Allegro', min: 121, max: 156, color: '#f59e0b', emoji: '🏇' },
  { name: 'Vivace', min: 157, max: 176, color: '#f97316', emoji: '🚴‍♂️' },
  { name: 'Presto', min: 177, max: 200, color: '#ef4444', emoji: '🏎️' },
  { name: 'Prestissimo', min: 201, max: 999, color: '#dc2626', emoji: '🚀' },
];

export default function App() {
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [currentBPM, setCurrentBPM] = useState<number>(0);
  const [averageBPM, setAverageBPM] = useState<number>(0);
  const [history, setHistory] = useState<TapHistory[]>([]);
  const [adCount, setAdCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'tapper' | 'history'>('tapper');
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (data: TapHistory[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setHistory(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const getTempoDescription = (bpm: number): TempoDescription => {
    const tempo = TEMPO_RANGES.find(t => bpm >= t.min && bpm <= t.max);
    return tempo || TEMPO_RANGES[0];
  };

  const calculateBPM = (times: number[]): number => {
    if (times.length < 2) return 0;

    const intervals = [];
    for (let i = 1; i < times.length; i++) {
      intervals.push(times[i] - times[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = Math.round(60000 / avgInterval);

    return bpm > 0 && bpm < 999 ? bpm : 0;
  };

  const handleTap = () => {
    const now = Date.now();

    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Clear reset timer
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    // Add tap time
    const newTapTimes = [...tapTimes, now].slice(-MAX_TAPS);
    setTapTimes(newTapTimes);

    // Calculate BPM
    if (newTapTimes.length >= 2) {
      const bpm = calculateBPM(newTapTimes);
      setCurrentBPM(bpm);

      // Calculate average from last 8 taps
      if (newTapTimes.length >= 2) {
        const avgBpm = calculateBPM(newTapTimes);
        setAverageBPM(avgBpm);
      }
    }

    // Set reset timer (3 seconds of inactivity)
    resetTimerRef.current = setTimeout(() => {
      resetTapper();
    }, 3000);
  };

  const resetTapper = () => {
    setTapTimes([]);
    setCurrentBPM(0);
    setAverageBPM(0);
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
  };

  const saveToHistory = () => {
    if (averageBPM === 0) {
      Alert.alert('No BPM', 'Tap at least twice to save a BPM reading');
      return;
    }

    const tempo = getTempoDescription(averageBPM);
    const newEntry: TapHistory = {
      id: Date.now().toString(),
      bpm: averageBPM,
      tempo: tempo.name,
      date: new Date().toISOString(),
      taps: tapTimes.length,
    };

    const newHistory = [newEntry, ...history];
    saveData(newHistory);
    resetTapper();

    Alert.alert('Saved', `${averageBPM} BPM saved to history`);

    const newCount = adCount + 1;
    setAdCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const deleteHistoryItem = (id: string) => {
    Alert.alert('Delete Entry', 'Remove this BPM reading from history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => saveData(history.filter(h => h.id !== id)),
      },
    ]);
  };

  const clearHistory = () => {
    Alert.alert('Clear History', 'Delete all BPM readings?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: () => saveData([]),
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const currentTempo = averageBPM > 0 ? getTempoDescription(averageBPM) : null;

  const renderTapperView = () => (
    <View style={styles.tapperContainer}>
      <View style={styles.displayContainer}>
        <Text style={styles.bpmLabel}>BPM</Text>
        <Text style={styles.bpmValue}>{averageBPM || '---'}</Text>

        {currentTempo && (
          <View style={[styles.tempoCard, { backgroundColor: currentTempo.color + '20' }]}>
            <Text style={styles.tempoEmoji}>{currentTempo.emoji}</Text>
            <Text style={[styles.tempoName, { color: currentTempo.color }]}>
              {currentTempo.name}
            </Text>
            <Text style={styles.tempoRange}>
              {currentTempo.min}-{currentTempo.max} BPM
            </Text>
          </View>
        )}

        <View style={styles.tapInfo}>
          <View style={styles.tapInfoItem}>
            <Text style={styles.tapInfoLabel}>Taps</Text>
            <Text style={styles.tapInfoValue}>{tapTimes.length}/{MAX_TAPS}</Text>
          </View>
          {currentBPM > 0 && (
            <View style={styles.tapInfoItem}>
              <Text style={styles.tapInfoLabel}>Last Interval</Text>
              <Text style={styles.tapInfoValue}>{currentBPM} BPM</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.tapButtonContainer}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[
              styles.tapButton,
              currentTempo && { borderColor: currentTempo.color },
            ]}
            onPress={handleTap}
            activeOpacity={0.8}
          >
            <Text style={styles.tapButtonText}>TAP</Text>
            <Text style={styles.tapButtonSubtext}>Tap in rhythm</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.resetButton]}
          onPress={resetTapper}
        >
          <Text style={styles.actionButtonText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.saveButton,
            averageBPM === 0 && styles.saveButtonDisabled,
          ]}
          onPress={saveToHistory}
          disabled={averageBPM === 0}
        >
          <Text style={styles.actionButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tempoGuide}>
        <Text style={styles.guideTitle}>Tempo Guide</Text>
        <ScrollView style={styles.guideScroll} showsVerticalScrollIndicator={false}>
          {TEMPO_RANGES.map((tempo, index) => (
            <View key={index} style={styles.guideItem}>
              <View style={styles.guideLeft}>
                <Text style={styles.guideEmoji}>{tempo.emoji}</Text>
                <View>
                  <Text style={[styles.guideName, { color: tempo.color }]}>
                    {tempo.name}
                  </Text>
                  <Text style={styles.guideRange}>
                    {tempo.min}-{tempo.max} BPM
                  </Text>
                </View>
              </View>
              <View
                style={[styles.guideIndicator, { backgroundColor: tempo.color }]}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderHistoryView = () => (
    <View style={styles.historyContainer}>
      {history.length > 0 && (
        <View style={styles.historyHeader}>
          <Text style={styles.historyCount}>{history.length} readings</Text>
          <TouchableOpacity onPress={clearHistory}>
            <Text style={styles.clearButton}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={history}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.historyList}
        renderItem={({ item }) => {
          const tempo = getTempoDescription(item.bpm);
          return (
            <TouchableOpacity
              style={styles.historyCard}
              onLongPress={() => deleteHistoryItem(item.id)}
            >
              <View style={styles.historyLeft}>
                <Text style={styles.historyEmoji}>{tempo.emoji}</Text>
                <View style={styles.historyInfo}>
                  <View style={styles.historyBpmRow}>
                    <Text style={styles.historyBpm}>{item.bpm}</Text>
                    <Text style={styles.historyBpmLabel}>BPM</Text>
                  </View>
                  <Text style={[styles.historyTempo, { color: tempo.color }]}>
                    {item.tempo}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {item.taps} taps • {formatDate(item.date)}
                  </Text>
                </View>
              </View>
              <View
                style={[styles.historyIndicator, { backgroundColor: tempo.color }]}
              />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>⏱️</Text>
            <Text style={styles.emptyText}>No BPM readings yet</Text>
            <Text style={styles.emptySubtext}>
              Tap in rhythm and save your tempo
            </Text>
          </View>
        }
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>BPM Tapper</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tapper' && styles.tabActive]}
          onPress={() => setActiveTab('tapper')}
        >
          <Text style={[styles.tabText, activeTab === 'tapper' && styles.tabTextActive]}>
            Tapper
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'tapper' ? renderTapperView() : renderHistoryView()}

      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
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
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  tapperContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  displayContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bpmLabel: {
    fontSize: 16,
    color: colors.gray.dark,
    marginBottom: spacing.sm,
  },
  bpmValue: {
    fontSize: 72,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  tempoCard: {
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg,
  },
  tempoEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  tempoName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  tempoRange: {
    fontSize: 14,
    color: colors.gray.dark,
  },
  tapInfo: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  tapInfoItem: {
    alignItems: 'center',
  },
  tapInfoLabel: {
    fontSize: 12,
    color: colors.gray.dark,
    marginBottom: spacing.xs,
  },
  tapInfoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  tapButtonContainer: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  tapButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: colors.primary + '40',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  tapButtonText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  tapButtonSubtext: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: colors.gray.medium,
  },
  saveButton: {
    backgroundColor: colors.status.success,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray.light,
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  tempoGuide: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  guideScroll: {
    flex: 1,
  },
  guideItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  guideLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  guideEmoji: {
    fontSize: 24,
  },
  guideName: {
    fontSize: 14,
    fontWeight: '600',
  },
  guideRange: {
    fontSize: 12,
    color: colors.gray.dark,
  },
  guideIndicator: {
    width: 4,
    height: 30,
    borderRadius: 2,
  },
  historyContainer: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  historyCount: {
    fontSize: 14,
    color: colors.gray.dark,
  },
  clearButton: {
    fontSize: 14,
    color: colors.status.error,
    fontWeight: '600',
  },
  historyList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  historyEmoji: {
    fontSize: 32,
  },
  historyInfo: {
    flex: 1,
  },
  historyBpmRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  historyBpm: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: spacing.xs,
  },
  historyBpmLabel: {
    fontSize: 14,
    color: colors.gray.dark,
  },
  historyTempo: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  historyMeta: {
    fontSize: 12,
    color: colors.gray.dark,
  },
  historyIndicator: {
    width: 4,
    height: 50,
    borderRadius: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray.dark,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray.medium,
  },
});
