import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Calorie_Counter_Offline_data';

type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

interface Entry {
  id: string;
  name: string;
  calories: number;
  mealType: MealType;
  timestamp: string;
}

interface DayData {
  date: string;
  entries: Entry[];
  totalCalories: number;
}

interface Settings {
  dailyGoalCalories: number;
}

const MEAL_ICONS = {
  Breakfast: '🍳',
  Lunch: '🍱',
  Dinner: '🍽️',
  Snacks: '🍿',
};

const MEAL_COLORS = {
  Breakfast: '#F59E0B',
  Lunch: '#10B981',
  Dinner: '#3B82F6',
  Snacks: '#EC4899',
};

export default function App() {
  const [settings, setSettings] = useState<Settings>({
    dailyGoalCalories: 2000,
  });

  const [history, setHistory] = useState<DayData[]>([]);
  const [todayData, setTodayData] = useState<DayData>({
    date: new Date().toISOString().split('T')[0],
    entries: [],
    totalCalories: 0,
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('Breakfast');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [goalInput, setGoalInput] = useState('');

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  useEffect(() => {
    const checkDayReset = () => {
      const today = new Date().toISOString().split('T')[0];
      if (todayData.date !== today) {
        resetDay();
      }
    };

    checkDayReset();
    const interval = setInterval(checkDayReset, 60000);
    return () => clearInterval(interval);
  }, [todayData.date]);

  const loadData = async () => {
    try {
      const [savedSettings, savedHistory, savedToday] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY + '_settings'),
        AsyncStorage.getItem(STORAGE_KEY + '_history'),
        AsyncStorage.getItem(STORAGE_KEY + '_today'),
      ]);

      if (savedSettings) setSettings(JSON.parse(savedSettings));
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      if (savedToday) {
        const loaded = JSON.parse(savedToday);
        const today = new Date().toISOString().split('T')[0];
        if (loaded.date === today) {
          setTodayData(loaded);
        }
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (newToday: DayData, newHistory: DayData[]) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY + '_today', JSON.stringify(newToday)),
        AsyncStorage.setItem(STORAGE_KEY + '_history', JSON.stringify(newHistory)),
      ]);
      setTodayData(newToday);
      setHistory(newHistory);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const resetDay = () => {
    if (todayData.entries.length > 0) {
      const newHistory = [todayData, ...history.slice(0, 6)];
      setHistory(newHistory);
      AsyncStorage.setItem(STORAGE_KEY + '_history', JSON.stringify(newHistory));
    }

    const newToday: DayData = {
      date: new Date().toISOString().split('T')[0],
      entries: [],
      totalCalories: 0,
    };
    setTodayData(newToday);
    AsyncStorage.setItem(STORAGE_KEY + '_today', JSON.stringify(newToday));
  };

  const addEntry = () => {
    if (!foodName.trim()) {
      Alert.alert('Error', 'Please enter food name');
      return;
    }

    const cals = parseInt(calories);
    if (isNaN(cals) || cals <= 0) {
      Alert.alert('Error', 'Please enter valid calories');
      return;
    }

    const entry: Entry = {
      id: Date.now().toString(),
      name: foodName.trim(),
      calories: cals,
      mealType: selectedMealType,
      timestamp: new Date().toISOString(),
    };

    const newToday: DayData = {
      ...todayData,
      entries: [entry, ...todayData.entries],
      totalCalories: todayData.totalCalories + cals,
    };

    saveData(newToday, history);
    setFoodName('');
    setCalories('');
    setShowAddModal(false);

    if (newToday.totalCalories >= settings.dailyGoalCalories) {
      showInterstitialAd();
    }
  };

  const deleteEntry = (id: string) => {
    const entry = todayData.entries.find((e) => e.id === id);
    if (!entry) return;

    const newToday: DayData = {
      ...todayData,
      entries: todayData.entries.filter((e) => e.id !== id),
      totalCalories: todayData.totalCalories - entry.calories,
    };

    saveData(newToday, history);
  };

  const updateGoal = () => {
    const newGoal = parseInt(goalInput);
    if (isNaN(newGoal) || newGoal < 500 || newGoal > 10000) {
      Alert.alert('Invalid Goal', 'Please enter a goal between 500 and 10000 calories');
      return;
    }

    const newSettings = { ...settings, dailyGoalCalories: newGoal };
    setSettings(newSettings);
    AsyncStorage.setItem(STORAGE_KEY + '_settings', JSON.stringify(newSettings));
    setShowGoalModal(false);
  };

  const getMealCalories = (mealType: MealType): number => {
    return todayData.entries
      .filter((e) => e.mealType === mealType)
      .reduce((sum, e) => sum + e.calories, 0);
  };

  const getMealPercentage = (mealType: MealType): number => {
    if (todayData.totalCalories === 0) return 0;
    return (getMealCalories(mealType) / todayData.totalCalories) * 100;
  };

  const progress = (todayData.totalCalories / settings.dailyGoalCalories) * 100;
  const remaining = Math.max(0, settings.dailyGoalCalories - todayData.totalCalories);
  const isOverGoal = todayData.totalCalories > settings.dailyGoalCalories;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Calorie Counter</Text>
        <TouchableOpacity
          onPress={() => {
            setGoalInput(settings.dailyGoalCalories.toString());
            setShowGoalModal(true);
          }}
        >
          <Text style={styles.goalBtn}>🎯</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{todayData.totalCalories}</Text>
              <Text style={styles.summaryLabel}>Consumed</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{settings.dailyGoalCalories}</Text>
              <Text style={styles.summaryLabel}>Goal</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text
                style={[
                  styles.summaryValue,
                  { color: isOverGoal ? colors.status.error : colors.status.success },
                ]}
              >
                {isOverGoal ? `+${todayData.totalCalories - settings.dailyGoalCalories}` : remaining}
              </Text>
              <Text style={styles.summaryLabel}>{isOverGoal ? 'Over' : 'Remaining'}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, progress)}%`,
                    backgroundColor: isOverGoal ? colors.status.error : colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        </View>

        {/* Meal Breakdown */}
        <Text style={styles.sectionTitle}>Meal Breakdown</Text>
        <View style={styles.mealBreakdown}>
          {(['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as MealType[]).map((mealType) => {
            const mealCals = getMealCalories(mealType);
            const mealPerc = getMealPercentage(mealType);
            return (
              <View key={mealType} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealIcon}>{MEAL_ICONS[mealType]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mealName}>{mealType}</Text>
                    <Text style={styles.mealCalories}>{mealCals} cal</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.addMealBtn, { backgroundColor: MEAL_COLORS[mealType] }]}
                    onPress={() => {
                      setSelectedMealType(mealType);
                      setShowAddModal(true);
                    }}
                  >
                    <Text style={styles.addMealBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                {mealPerc > 0 && (
                  <View style={styles.mealProgressBar}>
                    <View
                      style={[
                        styles.mealProgressFill,
                        {
                          width: `${mealPerc}%`,
                          backgroundColor: MEAL_COLORS[mealType],
                        },
                      ]}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Today's Log */}
        <Text style={styles.sectionTitle}>Today's Log</Text>
        {todayData.entries.length === 0 ? (
          <Text style={styles.emptyText}>No entries yet today</Text>
        ) : (
          todayData.entries.map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryIcon}>{MEAL_ICONS[entry.mealType]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.entryName}>{entry.name}</Text>
                  <Text style={styles.entryMeal}>
                    {entry.mealType} •{' '}
                    {new Date(entry.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View style={styles.entryRight}>
                  <Text style={styles.entryCalories}>{entry.calories}</Text>
                  <Text style={styles.entryCalLabel}>cal</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteEntry(entry.id)}
                >
                  <Text style={styles.deleteBtnText}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* History Chart */}
        {history.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Last 7 Days</Text>
            <View style={styles.chartContainer}>
              {history.map((day) => {
                const dayProgress = (day.totalCalories / settings.dailyGoalCalories) * 100;
                const isOver = day.totalCalories > settings.dailyGoalCalories;
                return (
                  <View key={day.date} style={styles.chartBar}>
                    <View style={styles.chartBarContainer}>
                      <View
                        style={[
                          styles.chartBarFill,
                          {
                            height: `${Math.min(100, dayProgress)}%`,
                            backgroundColor: isOver ? colors.status.error : colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.chartLabel}>
                      {new Date(day.date).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.chartValue}>{day.totalCalories}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <AdBanner />

      {/* Add Entry Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add to {selectedMealType}</Text>

            <Text style={styles.label}>Food Name</Text>
            <TextInput
              style={styles.input}
              value={foodName}
              onChangeText={setFoodName}
              placeholder="e.g. Chicken Salad"
              autoFocus
            />

            <Text style={styles.label}>Calories</Text>
            <TextInput
              style={styles.input}
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
              placeholder="e.g. 350"
            />

            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => {
                  setShowAddModal(false);
                  setFoodName('');
                  setCalories('');
                }}
              >
                <Text style={styles.btnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnAdd]}
                onPress={addEntry}
              >
                <Text style={styles.btnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Goal Modal */}
      <Modal visible={showGoalModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Daily Calorie Goal</Text>
            <Text style={styles.modalHint}>Recommended: 1500-2500 calories/day</Text>
            <TextInput
              style={styles.input}
              value={goalInput}
              onChangeText={setGoalInput}
              keyboardType="numeric"
              placeholder="2000"
              autoFocus
            />
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => setShowGoalModal(false)}
              >
                <Text style={styles.btnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnAdd]} onPress={updateGoal}>
                <Text style={styles.btnText}>Save</Text>
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
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  goalBtn: { fontSize: 28 },
  content: { padding: spacing.lg, paddingBottom: 100 },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.lg },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  summaryLabel: { fontSize: 12, color: colors.gray.dark, marginTop: 4 },
  summaryDivider: { width: 1, backgroundColor: colors.gray.light },
  progressBarContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: colors.gray.light,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 6 },
  progressText: { fontSize: 14, fontWeight: '600', color: colors.text, minWidth: 45 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  mealBreakdown: { gap: spacing.sm, marginBottom: spacing.lg },
  mealCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    elevation: 1,
  },
  mealHeader: { flexDirection: 'row', alignItems: 'center' },
  mealIcon: { fontSize: 28, marginRight: spacing.md },
  mealName: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  mealCalories: { fontSize: 13, color: colors.gray.dark, marginTop: 2 },
  addMealBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMealBtnText: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
  mealProgressBar: {
    height: 4,
    backgroundColor: colors.gray.light,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  mealProgressFill: { height: '100%', borderRadius: 2 },
  emptyText: { textAlign: 'center', color: colors.gray.dark, marginTop: spacing.md },
  entryCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    elevation: 1,
  },
  entryHeader: { flexDirection: 'row', alignItems: 'center' },
  entryIcon: { fontSize: 24, marginRight: spacing.md },
  entryName: { fontSize: 15, fontWeight: '600', color: colors.text },
  entryMeal: { fontSize: 12, color: colors.gray.dark, marginTop: 2 },
  entryRight: { alignItems: 'flex-end', marginRight: spacing.md },
  entryCalories: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  entryCalLabel: { fontSize: 11, color: colors.gray.dark },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: { fontSize: 24, color: colors.gray.dark, marginTop: -4 },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    height: 220,
  },
  chartBar: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  chartBarContainer: {
    width: '80%',
    height: 140,
    backgroundColor: colors.gray.light,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  chartBarFill: { width: '100%', borderRadius: 8 },
  chartLabel: {
    fontSize: 10,
    color: colors.gray.dark,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  chartValue: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
    textAlign: 'center',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.md },
  modalHint: { fontSize: 14, color: colors.gray.dark, marginBottom: spacing.lg },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  buttons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  btn: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  btnCancel: { backgroundColor: colors.gray.light },
  btnAdd: { backgroundColor: colors.primary },
  btnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  btnTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
