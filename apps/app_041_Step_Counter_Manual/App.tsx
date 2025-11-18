import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@step_counter_data';
const SETTINGS_KEY = '@step_counter_settings';

interface DayData {
  date: string;
  steps: number;
  distance: number;
  calories: number;
}

interface Settings {
  dailyGoal: number;
}

const STEP_TO_METERS = 0.762;
const STEP_TO_CALORIES = 0.04;

export default function App() {
  const [todaySteps, setTodaySteps] = useState(0);
  const [history, setHistory] = useState<DayData[]>([]);
  const [dailyGoal, setDailyGoal] = useState(10000);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [interactionCount, setInteractionCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'today' | 'weekly' | 'monthly'>('today');

  useEffect(() => {
    initializeAds();
    loadData();
    loadSettings();
  }, []);

  useEffect(() => {
    saveData();
  }, [todaySteps, history]);

  useEffect(() => {
    if (interactionCount > 0 && interactionCount % 10 === 0) {
      showInterstitialAd();
    }
  }, [interactionCount]);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        const today = getToday();
        const todayData = data.find((d: DayData) => d.date === today);
        if (todayData) {
          setTodaySteps(todayData.steps);
        }
        setHistory(data);
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const settings = JSON.parse(saved);
        setDailyGoal(settings.dailyGoal);
      }
    } catch (error) {
      console.error('Load settings error:', error);
    }
  };

  const saveData = async () => {
    try {
      const today = getToday();
      const distance = todaySteps * STEP_TO_METERS;
      const calories = todaySteps * STEP_TO_CALORIES;

      const updatedHistory = [...history];
      const todayIndex = updatedHistory.findIndex(d => d.date === today);

      if (todayIndex >= 0) {
        updatedHistory[todayIndex] = { date: today, steps: todaySteps, distance, calories };
      } else {
        updatedHistory.push({ date: today, steps: todaySteps, distance, calories });
      }

      // Keep only last 30 days
      const sortedHistory = updatedHistory
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 30);

      setHistory(sortedHistory);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sortedHistory));
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const saveSettings = async (goal: number) => {
    try {
      const settings: Settings = { dailyGoal: goal };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      setDailyGoal(goal);
    } catch (error) {
      console.error('Save settings error:', error);
    }
  };

  const getToday = () => {
    return new Date().toISOString().split('T')[0];
  };

  const addSteps = (amount: number) => {
    setTodaySteps(prev => prev + amount);
    setInteractionCount(prev => prev + 1);
  };

  const addCustomSteps = () => {
    const amount = parseInt(customAmount);
    if (!isNaN(amount) && amount > 0) {
      addSteps(amount);
      setCustomAmount('');
      setShowCustomModal(false);
    }
  };

  const updateGoal = () => {
    const goal = parseInt(customGoal);
    if (!isNaN(goal) && goal >= 5000 && goal <= 20000) {
      saveSettings(goal);
      setCustomGoal('');
      setShowSettingsModal(false);
    }
  };

  const calculateProgress = () => {
    return Math.min((todaySteps / dailyGoal) * 100, 100);
  };

  const calculateDistance = () => {
    return (todaySteps * STEP_TO_METERS / 1000).toFixed(2);
  };

  const calculateCalories = () => {
    return (todaySteps * STEP_TO_CALORIES).toFixed(0);
  };

  const getWeeklyStats = () => {
    const last7Days = history.slice(0, 7);
    const totalSteps = last7Days.reduce((sum, day) => sum + day.steps, 0);
    const avgSteps = last7Days.length > 0 ? Math.round(totalSteps / last7Days.length) : 0;
    const totalDistance = last7Days.reduce((sum, day) => sum + day.distance, 0);
    const totalCalories = last7Days.reduce((sum, day) => sum + day.calories, 0);
    return { totalSteps, avgSteps, totalDistance, totalCalories, days: last7Days.length };
  };

  const getMonthlyStats = () => {
    const totalSteps = history.reduce((sum, day) => sum + day.steps, 0);
    const avgSteps = history.length > 0 ? Math.round(totalSteps / history.length) : 0;
    const totalDistance = history.reduce((sum, day) => sum + day.distance, 0);
    const totalCalories = history.reduce((sum, day) => sum + day.calories, 0);
    return { totalSteps, avgSteps, totalDistance, totalCalories, days: history.length };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const progress = calculateProgress();
  const weeklyStats = getWeeklyStats();
  const monthlyStats = getMonthlyStats();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Step Counter</Text>
        <TouchableOpacity onPress={() => setShowSettingsModal(true)} style={styles.settingsBtn}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Today's Steps Card */}
        <View style={styles.mainCard}>
          <Text style={styles.stepsLabel}>Today's Steps</Text>
          <Text style={styles.stepsCount}>{todaySteps.toLocaleString()}</Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {todaySteps.toLocaleString()} / {dailyGoal.toLocaleString()} ({progress.toFixed(0)}%)
            </Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{calculateDistance()}</Text>
              <Text style={styles.statLabel}>km</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{calculateCalories()}</Text>
              <Text style={styles.statLabel}>calories</Text>
            </View>
          </View>
        </View>

        {/* Quick Add Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Add Steps</Text>
          <View style={styles.buttonGrid}>
            <TouchableOpacity style={styles.addButton} onPress={() => addSteps(100)}>
              <Text style={styles.addButtonText}>+100</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={() => addSteps(500)}>
              <Text style={styles.addButtonText}>+500</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={() => addSteps(1000)}>
              <Text style={styles.addButtonText}>+1000</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, styles.customButton]}
              onPress={() => setShowCustomModal(true)}
            >
              <Text style={styles.addButtonText}>Custom</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics Tabs */}
        <View style={styles.section}>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'today' && styles.tabActive]}
              onPress={() => setActiveTab('today')}
            >
              <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'weekly' && styles.tabActive]}
              onPress={() => setActiveTab('weekly')}
            >
              <Text style={[styles.tabText, activeTab === 'weekly' && styles.tabTextActive]}>Weekly</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'monthly' && styles.tabActive]}
              onPress={() => setActiveTab('monthly')}
            >
              <Text style={[styles.tabText, activeTab === 'monthly' && styles.tabTextActive]}>Monthly</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'today' && (
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Today's Summary</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statsItem}>
                  <Text style={styles.statsValue}>{todaySteps.toLocaleString()}</Text>
                  <Text style={styles.statsLabel}>Total Steps</Text>
                </View>
                <View style={styles.statsItem}>
                  <Text style={styles.statsValue}>{calculateDistance()}</Text>
                  <Text style={styles.statsLabel}>Distance (km)</Text>
                </View>
                <View style={styles.statsItem}>
                  <Text style={styles.statsValue}>{calculateCalories()}</Text>
                  <Text style={styles.statsLabel}>Calories Burned</Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'weekly' && (
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Last 7 Days</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statsItem}>
                  <Text style={styles.statsValue}>{weeklyStats.totalSteps.toLocaleString()}</Text>
                  <Text style={styles.statsLabel}>Total Steps</Text>
                </View>
                <View style={styles.statsItem}>
                  <Text style={styles.statsValue}>{weeklyStats.avgSteps.toLocaleString()}</Text>
                  <Text style={styles.statsLabel}>Avg Steps/Day</Text>
                </View>
                <View style={styles.statsItem}>
                  <Text style={styles.statsValue}>{(weeklyStats.totalDistance / 1000).toFixed(1)}</Text>
                  <Text style={styles.statsLabel}>Distance (km)</Text>
                </View>
                <View style={styles.statsItem}>
                  <Text style={styles.statsValue}>{weeklyStats.totalCalories.toFixed(0)}</Text>
                  <Text style={styles.statsLabel}>Calories</Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'monthly' && (
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Last 30 Days</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statsItem}>
                  <Text style={styles.statsValue}>{monthlyStats.totalSteps.toLocaleString()}</Text>
                  <Text style={styles.statsLabel}>Total Steps</Text>
                </View>
                <View style={styles.statsItem}>
                  <Text style={styles.statsValue}>{monthlyStats.avgSteps.toLocaleString()}</Text>
                  <Text style={styles.statsLabel}>Avg Steps/Day</Text>
                </View>
                <View style={styles.statsItem}>
                  <Text style={styles.statsValue}>{(monthlyStats.totalDistance / 1000).toFixed(1)}</Text>
                  <Text style={styles.statsLabel}>Distance (km)</Text>
                </View>
                <View style={styles.statsItem}>
                  <Text style={styles.statsValue}>{monthlyStats.totalCalories.toFixed(0)}</Text>
                  <Text style={styles.statsLabel}>Calories</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* History Button */}
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => setShowHistoryModal(true)}
        >
          <Text style={styles.historyButtonText}>📅 View 30-Day Calendar</Text>
        </TouchableOpacity>
      </ScrollView>

      <AdBanner />

      {/* Custom Amount Modal */}
      <Modal visible={showCustomModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Steps</Text>
            <TextInput
              style={styles.input}
              value={customAmount}
              onChangeText={setCustomAmount}
              placeholder="Enter number of steps"
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setShowCustomModal(false);
                  setCustomAmount('');
                }}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnAdd]} onPress={addCustomSteps}>
                <Text style={styles.modalBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={showSettingsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Daily Goal Settings</Text>
            <Text style={styles.modalSubtitle}>Current Goal: {dailyGoal.toLocaleString()} steps</Text>
            <TextInput
              style={styles.input}
              value={customGoal}
              onChangeText={setCustomGoal}
              placeholder="Enter goal (5000-20000)"
              keyboardType="numeric"
              autoFocus
            />
            <Text style={styles.modalHint}>Recommended: 10,000 steps/day</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setShowSettingsModal(false);
                  setCustomGoal('');
                }}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnAdd]} onPress={updateGoal}>
                <Text style={styles.modalBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal visible={showHistoryModal} animationType="slide">
        <SafeAreaView style={styles.modalFull}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>30-Day History</Text>
            <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.historyList}>
            {history.map((day, index) => {
              const goalMet = day.steps >= dailyGoal;
              return (
                <View key={day.date} style={styles.historyItem}>
                  <View style={styles.historyDate}>
                    <Text style={styles.historyDateText}>{formatDate(day.date)}</Text>
                    {goalMet && <Text style={styles.goalBadge}>✓ Goal</Text>}
                  </View>
                  <View style={styles.historyStats}>
                    <View style={styles.historyStatItem}>
                      <Text style={styles.historyStatValue}>{day.steps.toLocaleString()}</Text>
                      <Text style={styles.historyStatLabel}>steps</Text>
                    </View>
                    <View style={styles.historyStatItem}>
                      <Text style={styles.historyStatValue}>{(day.distance / 1000).toFixed(2)}</Text>
                      <Text style={styles.historyStatLabel}>km</Text>
                    </View>
                    <View style={styles.historyStatItem}>
                      <Text style={styles.historyStatValue}>{day.calories.toFixed(0)}</Text>
                      <Text style={styles.historyStatLabel}>cal</Text>
                    </View>
                  </View>
                  <View style={styles.historyProgress}>
                    <View style={styles.historyProgressBar}>
                      <View
                        style={[
                          styles.historyProgressFill,
                          { width: `${Math.min((day.steps / dailyGoal) * 100, 100)}%` },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
            {history.length === 0 && (
              <Text style={styles.emptyText}>No history yet. Start tracking your steps!</Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  settingsBtn: {
    padding: spacing.sm,
  },
  settingsIcon: {
    fontSize: 24,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  mainCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  stepsLabel: {
    fontSize: 16,
    color: colors.gray.dark,
    marginBottom: spacing.sm,
  },
  stepsCount: {
    fontSize: 56,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  progressContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: colors.gray.light,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.status.success,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: colors.gray.dark,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: colors.gray.dark,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.gray.medium,
    marginHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  addButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  customButton: {
    backgroundColor: colors.secondary,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.xs,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray.dark,
  },
  tabTextActive: {
    color: colors.white,
  },
  statsCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  statsItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statsLabel: {
    fontSize: 12,
    color: colors.gray.dark,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  historyButton: {
    backgroundColor: colors.accent,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  historyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.gray.dark,
    marginBottom: spacing.lg,
  },
  modalHint: {
    fontSize: 14,
    color: colors.gray.medium,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.gray.light,
    padding: spacing.lg,
    borderRadius: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalBtn: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: colors.gray.light,
  },
  modalBtnAdd: {
    backgroundColor: colors.primary,
  },
  modalBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalBtnTextCancel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalFull: {
    flex: 1,
    backgroundColor: colors.gray.light,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  modalClose: {
    fontSize: 28,
    color: colors.gray.dark,
    fontWeight: '300',
  },
  historyList: {
    padding: spacing.lg,
  },
  historyItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  historyDate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  historyDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  goalBadge: {
    backgroundColor: colors.status.success,
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  historyStatItem: {
    alignItems: 'center',
  },
  historyStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  historyStatLabel: {
    fontSize: 12,
    color: colors.gray.dark,
    marginTop: spacing.xs,
  },
  historyProgress: {
    width: '100%',
  },
  historyProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.gray.light,
    borderRadius: 3,
    overflow: 'hidden',
  },
  historyProgressFill: {
    height: '100%',
    backgroundColor: colors.status.success,
    borderRadius: 3,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.gray.medium,
    fontSize: 16,
    marginTop: spacing.xl,
  },
});
