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

const STORAGE_KEY = '@Protein_Calculator_data';

type Unit = 'kg' | 'lbs';
type ActivityLevel = 'Sedentary' | 'Light' | 'Moderate' | 'Active' | 'Very Active';

interface Entry {
  id: string;
  source: string;
  grams: number;
  meal: string;
  timestamp: string;
}

interface DayData {
  date: string;
  entries: Entry[];
  totalProtein: number;
}

interface Settings {
  unit: Unit;
  weight: number;
  activityLevel: ActivityLevel;
  proteinGoal: number;
}

const ACTIVITY_MULTIPLIERS = {
  Sedentary: 1.6,
  Light: 1.8,
  Moderate: 2.0,
  Active: 2.2,
  'Very Active': 2.4,
};

const ACTIVITY_DESCRIPTIONS = {
  Sedentary: 'Little to no exercise',
  Light: '1-3 days/week',
  Moderate: '3-5 days/week',
  Active: '6-7 days/week',
  'Very Active': 'Intense training daily',
};

export default function App() {
  const [settings, setSettings] = useState<Settings>({
    unit: 'kg',
    weight: 70,
    activityLevel: 'Moderate',
    proteinGoal: 140,
  });

  const [history, setHistory] = useState<DayData[]>([]);
  const [todayData, setTodayData] = useState<DayData>({
    date: new Date().toISOString().split('T')[0],
    entries: [],
    totalProtein: 0,
  });

  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [source, setSource] = useState('');
  const [proteinAmount, setProteinAmount] = useState('');
  const [meal, setMeal] = useState('');

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
      totalProtein: 0,
    };
    setTodayData(newToday);
    AsyncStorage.setItem(STORAGE_KEY + '_today', JSON.stringify(newToday));
  };

  const calculateGoal = () => {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight');
      return;
    }

    // Convert to kg if lbs
    const weightKg = settings.unit === 'kg' ? weight : weight / 2.205;
    const multiplier = ACTIVITY_MULTIPLIERS[settings.activityLevel];
    const goal = Math.round(weightKg * multiplier);

    const newSettings = { ...settings, weight, proteinGoal: goal };
    setSettings(newSettings);
    AsyncStorage.setItem(STORAGE_KEY + '_settings', JSON.stringify(newSettings));
    setShowCalculatorModal(false);
    setWeightInput('');
  };

  const addEntry = () => {
    if (!source.trim()) {
      Alert.alert('Error', 'Please enter protein source');
      return;
    }

    const grams = parseInt(proteinAmount);
    if (isNaN(grams) || grams <= 0) {
      Alert.alert('Error', 'Please enter valid protein amount');
      return;
    }

    const entry: Entry = {
      id: Date.now().toString(),
      source: source.trim(),
      grams,
      meal: meal.trim() || 'General',
      timestamp: new Date().toISOString(),
    };

    const newToday: DayData = {
      ...todayData,
      entries: [entry, ...todayData.entries],
      totalProtein: todayData.totalProtein + grams,
    };

    saveData(newToday, history);
    setSource('');
    setProteinAmount('');
    setMeal('');
    setShowAddModal(false);

    if (newToday.totalProtein >= settings.proteinGoal) {
      showInterstitialAd();
    }
  };

  const deleteEntry = (id: string) => {
    const entry = todayData.entries.find((e) => e.id === id);
    if (!entry) return;

    const newToday: DayData = {
      ...todayData,
      entries: todayData.entries.filter((e) => e.id !== id),
      totalProtein: todayData.totalProtein - entry.grams,
    };

    saveData(newToday, history);
  };

  const toggleUnit = () => {
    const newUnit: Unit = settings.unit === 'kg' ? 'lbs' : 'kg';
    const newWeight =
      newUnit === 'kg' ? settings.weight / 2.205 : settings.weight * 2.205;

    const newSettings = { ...settings, unit: newUnit, weight: parseFloat(newWeight.toFixed(1)) };
    setSettings(newSettings);
    AsyncStorage.setItem(STORAGE_KEY + '_settings', JSON.stringify(newSettings));
  };

  const quickAdd = (grams: number) => {
    const entry: Entry = {
      id: Date.now().toString(),
      source: 'Quick Add',
      grams,
      meal: 'Snack',
      timestamp: new Date().toISOString(),
    };

    const newToday: DayData = {
      ...todayData,
      entries: [entry, ...todayData.entries],
      totalProtein: todayData.totalProtein + grams,
    };

    saveData(newToday, history);

    if (newToday.totalProtein >= settings.proteinGoal) {
      showInterstitialAd();
    }
  };

  const progress = (todayData.totalProtein / settings.proteinGoal) * 100;
  const remaining = Math.max(0, settings.proteinGoal - todayData.totalProtein);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Protein Tracker</Text>
        <TouchableOpacity onPress={toggleUnit} style={styles.unitToggle}>
          <Text style={styles.unitToggleText}>{settings.unit}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Goal Calculator Card */}
        <TouchableOpacity
          style={styles.calculatorCard}
          onPress={() => {
            setWeightInput(settings.weight.toString());
            setShowCalculatorModal(true);
          }}
        >
          <Text style={styles.calculatorTitle}>Your Protein Goal</Text>
          <View style={styles.calculatorRow}>
            <View style={styles.calculatorItem}>
              <Text style={styles.calculatorLabel}>Weight</Text>
              <Text style={styles.calculatorValue}>
                {settings.weight} {settings.unit}
              </Text>
            </View>
            <View style={styles.calculatorItem}>
              <Text style={styles.calculatorLabel}>Activity</Text>
              <Text style={styles.calculatorValue}>{settings.activityLevel}</Text>
            </View>
            <View style={styles.calculatorItem}>
              <Text style={styles.calculatorLabel}>Daily Goal</Text>
              <Text style={[styles.calculatorValue, { color: colors.primary }]}>
                {settings.proteinGoal}g
              </Text>
            </View>
          </View>
          <Text style={styles.tapToEdit}>Tap to recalculate</Text>
        </TouchableOpacity>

        {/* Progress Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{todayData.totalProtein}g</Text>
              <Text style={styles.summaryLabel}>Consumed</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{settings.proteinGoal}g</Text>
              <Text style={styles.summaryLabel}>Goal</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.status.success }]}>
                {remaining}g
              </Text>
              <Text style={styles.summaryLabel}>Remaining</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressBarFill, { width: `${Math.min(100, progress)}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        </View>

        {/* Quick Add Buttons */}
        <Text style={styles.sectionTitle}>Quick Add</Text>
        <View style={styles.quickButtons}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => quickAdd(10)}>
            <Text style={styles.quickBtnText}>10g</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => quickAdd(20)}>
            <Text style={styles.quickBtnText}>20g</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => quickAdd(30)}>
            <Text style={styles.quickBtnText}>30g</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => quickAdd(50)}>
            <Text style={styles.quickBtnText}>50g</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, styles.customBtn]}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.quickBtnTextCustom}>Custom</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Log */}
        <Text style={styles.sectionTitle}>Today's Intake</Text>
        {todayData.entries.length === 0 ? (
          <Text style={styles.emptyText}>No protein logged yet today</Text>
        ) : (
          todayData.entries.map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.entrySource}>{entry.source}</Text>
                <Text style={styles.entryMeal}>
                  {entry.meal} •{' '}
                  {new Date(entry.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.entryRight}>
                <Text style={styles.entryProtein}>{entry.grams}g</Text>
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
                const dayProgress = (day.totalProtein / settings.proteinGoal) * 100;
                return (
                  <View key={day.date} style={styles.chartBar}>
                    <View style={styles.chartBarContainer}>
                      <View
                        style={[
                          styles.chartBarFill,
                          {
                            height: `${Math.min(100, dayProgress)}%`,
                            backgroundColor:
                              dayProgress >= 100 ? colors.status.success : colors.primary,
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
                    <Text style={styles.chartValue}>{day.totalProtein}g</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <AdBanner />

      {/* Calculator Modal */}
      <Modal visible={showCalculatorModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Calculate Protein Goal</Text>

            <Text style={styles.label}>Body Weight ({settings.unit})</Text>
            <TextInput
              style={styles.input}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="numeric"
              placeholder={`e.g. ${settings.unit === 'kg' ? '70' : '154'}`}
              autoFocus
            />

            <Text style={styles.label}>Activity Level</Text>
            {(Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[]).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.activityOption,
                  settings.activityLevel === level && styles.activityOptionSelected,
                ]}
                onPress={() => {
                  const newSettings = { ...settings, activityLevel: level };
                  setSettings(newSettings);
                }}
              >
                <View>
                  <Text style={styles.activityName}>{level}</Text>
                  <Text style={styles.activityDescription}>
                    {ACTIVITY_DESCRIPTIONS[level]} • {ACTIVITY_MULTIPLIERS[level]}g/kg
                  </Text>
                </View>
                {settings.activityLevel === level && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}

            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => setShowCalculatorModal(false)}
              >
                <Text style={styles.btnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnAdd]} onPress={calculateGoal}>
                <Text style={styles.btnText}>Calculate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Entry Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Protein Entry</Text>

            <Text style={styles.label}>Protein Source</Text>
            <TextInput
              style={styles.input}
              value={source}
              onChangeText={setSource}
              placeholder="e.g. Chicken breast"
              autoFocus
            />

            <Text style={styles.label}>Protein Amount (grams)</Text>
            <TextInput
              style={styles.input}
              value={proteinAmount}
              onChangeText={setProteinAmount}
              keyboardType="numeric"
              placeholder="e.g. 30"
            />

            <Text style={styles.label}>Meal (optional)</Text>
            <TextInput
              style={styles.input}
              value={meal}
              onChangeText={setMeal}
              placeholder="e.g. Breakfast, Lunch"
            />

            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => {
                  setShowAddModal(false);
                  setSource('');
                  setProteinAmount('');
                  setMeal('');
                }}
              >
                <Text style={styles.btnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnAdd]} onPress={addEntry}>
                <Text style={styles.btnText}>Add</Text>
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
  unitToggle: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  unitToggleText: { color: colors.white, fontSize: 14, fontWeight: 'bold' },
  content: { padding: spacing.lg, paddingBottom: 100 },
  calculatorCard: {
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 4,
  },
  calculatorTitle: { fontSize: 16, color: colors.white, marginBottom: spacing.md, opacity: 0.9 },
  calculatorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  calculatorItem: { alignItems: 'center' },
  calculatorLabel: { fontSize: 11, color: colors.white, opacity: 0.8 },
  calculatorValue: { fontSize: 18, fontWeight: 'bold', color: colors.white, marginTop: 4 },
  tapToEdit: { fontSize: 12, color: colors.white, opacity: 0.7, textAlign: 'center', marginTop: spacing.xs },
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
  progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 6 },
  progressText: { fontSize: 14, fontWeight: '600', color: colors.text, minWidth: 45 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  quickButtons: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  quickBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    elevation: 1,
  },
  customBtn: { backgroundColor: colors.primary },
  quickBtnText: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  quickBtnTextCustom: { fontSize: 14, fontWeight: 'bold', color: colors.white },
  emptyText: { textAlign: 'center', color: colors.gray.dark, marginTop: spacing.md },
  entryCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  entrySource: { fontSize: 15, fontWeight: '600', color: colors.text },
  entryMeal: { fontSize: 12, color: colors.gray.dark, marginTop: 2 },
  entryRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  entryProtein: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
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
  chartLabel: { fontSize: 10, color: colors.gray.dark, marginTop: spacing.sm, textAlign: 'center' },
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
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
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
  activityOption: {
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityOptionSelected: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  activityName: { fontSize: 15, fontWeight: 'bold', color: colors.text },
  activityDescription: { fontSize: 12, color: colors.gray.dark, marginTop: 2 },
  checkmark: { fontSize: 20, color: colors.white },
  buttons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  btn: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  btnCancel: { backgroundColor: colors.gray.light },
  btnAdd: { backgroundColor: colors.primary },
  btnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  btnTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
