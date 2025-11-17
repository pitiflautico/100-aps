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

const STORAGE_KEY = '@Hydration_Reminder_Offline_data';

type Unit = 'ml' | 'oz';

interface Drink {
  id: string;
  amount: number;
  timestamp: string;
}

interface DayData {
  date: string;
  drinks: Drink[];
  totalMl: number;
}

interface Settings {
  unit: Unit;
  dailyGoalMl: number;
}

const ML_PER_OZ = 29.5735;
const DEFAULT_GOAL_ML = 2000;

export default function App() {
  const [settings, setSettings] = useState<Settings>({
    unit: 'ml',
    dailyGoalMl: DEFAULT_GOAL_ML,
  });

  const [history, setHistory] = useState<DayData[]>([]);
  const [todayData, setTodayData] = useState<DayData>({
    date: new Date().toISOString().split('T')[0],
    drinks: [],
    totalMl: 0,
  });

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
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
    const interval = setInterval(checkDayReset, 60000); // Check every minute
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
        } else {
          resetDay();
        }
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (newToday: DayData, newHistory: DayData[], newSettings?: Settings) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY + '_today', JSON.stringify(newToday)),
        AsyncStorage.setItem(STORAGE_KEY + '_history', JSON.stringify(newHistory)),
        newSettings && AsyncStorage.setItem(STORAGE_KEY + '_settings', JSON.stringify(newSettings)),
      ]);
      setTodayData(newToday);
      setHistory(newHistory);
      if (newSettings) setSettings(newSettings);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const resetDay = () => {
    if (todayData.drinks.length > 0) {
      // Save yesterday's data to history
      const newHistory = [todayData, ...history.slice(0, 6)];
      setHistory(newHistory);
      AsyncStorage.setItem(STORAGE_KEY + '_history', JSON.stringify(newHistory));
    }

    const newToday: DayData = {
      date: new Date().toISOString().split('T')[0],
      drinks: [],
      totalMl: 0,
    };
    setTodayData(newToday);
    AsyncStorage.setItem(STORAGE_KEY + '_today', JSON.stringify(newToday));
  };

  const addDrink = (amountMl: number) => {
    const drink: Drink = {
      id: Date.now().toString(),
      amount: amountMl,
      timestamp: new Date().toISOString(),
    };

    const newToday: DayData = {
      ...todayData,
      drinks: [drink, ...todayData.drinks],
      totalMl: todayData.totalMl + amountMl,
    };

    saveData(newToday, history);

    if (newToday.totalMl >= settings.dailyGoalMl && todayData.totalMl < settings.dailyGoalMl) {
      Alert.alert('Goal Reached!', 'You have reached your daily hydration goal!');
      showInterstitialAd();
    }
  };

  const addCustomDrink = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    const amountMl = settings.unit === 'ml' ? amount : amount * ML_PER_OZ;
    addDrink(amountMl);
    setCustomAmount('');
    setShowCustomModal(false);
  };

  const updateGoal = () => {
    const newGoal = parseFloat(goalInput);
    if (isNaN(newGoal) || newGoal < 500 || newGoal > 10000) {
      Alert.alert('Invalid Goal', 'Please enter a goal between 500ml and 10000ml');
      return;
    }

    const newSettings = { ...settings, dailyGoalMl: newGoal };
    setSettings(newSettings);
    AsyncStorage.setItem(STORAGE_KEY + '_settings', JSON.stringify(newSettings));
    setShowGoalModal(false);
  };

  const toggleUnit = () => {
    const newSettings = { ...settings, unit: settings.unit === 'ml' ? 'oz' : 'ml' } as Settings;
    setSettings(newSettings);
    AsyncStorage.setItem(STORAGE_KEY + '_settings', JSON.stringify(newSettings));
  };

  const formatAmount = (ml: number): string => {
    if (settings.unit === 'ml') {
      return `${Math.round(ml)}ml`;
    }
    return `${Math.round(ml / ML_PER_OZ)}oz`;
  };

  const progress = Math.min(100, (todayData.totalMl / settings.dailyGoalMl) * 100);
  const remaining = Math.max(0, settings.dailyGoalMl - todayData.totalMl);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Hydration</Text>
        <TouchableOpacity onPress={toggleUnit} style={styles.unitToggle}>
          <Text style={styles.unitToggleText}>{settings.unit}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Progress Circle */}
        <View style={styles.progressSection}>
          <View style={styles.progressCircle}>
            <View style={styles.progressCircleInner}>
              <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
              <Text style={styles.progressLabel}>of goal</Text>
            </View>
          </View>
          <View style={styles.progressDetails}>
            <View style={styles.progressDetail}>
              <Text style={styles.progressDetailValue}>{formatAmount(todayData.totalMl)}</Text>
              <Text style={styles.progressDetailLabel}>Consumed</Text>
            </View>
            <View style={styles.progressDetail}>
              <Text style={styles.progressDetailValue}>{formatAmount(settings.dailyGoalMl)}</Text>
              <Text style={styles.progressDetailLabel}>Goal</Text>
            </View>
            <View style={styles.progressDetail}>
              <Text style={styles.progressDetailValue}>{formatAmount(remaining)}</Text>
              <Text style={styles.progressDetailLabel}>Remaining</Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {/* Quick Add Buttons */}
        <Text style={styles.sectionTitle}>Quick Add</Text>
        <View style={styles.quickButtons}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => addDrink(settings.unit === 'ml' ? 250 : 8 * ML_PER_OZ)}
          >
            <Text style={styles.quickBtnIcon}>💧</Text>
            <Text style={styles.quickBtnText}>{settings.unit === 'ml' ? '250ml' : '8oz'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => addDrink(settings.unit === 'ml' ? 500 : 16 * ML_PER_OZ)}
          >
            <Text style={styles.quickBtnIcon}>🥤</Text>
            <Text style={styles.quickBtnText}>{settings.unit === 'ml' ? '500ml' : '16oz'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => addDrink(settings.unit === 'ml' ? 1000 : 33 * ML_PER_OZ)}
          >
            <Text style={styles.quickBtnIcon}>🍶</Text>
            <Text style={styles.quickBtnText}>{settings.unit === 'ml' ? '1000ml' : '33oz'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, styles.customBtn]}
            onPress={() => setShowCustomModal(true)}
          >
            <Text style={styles.quickBtnIcon}>+</Text>
            <Text style={styles.quickBtnText}>Custom</Text>
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={styles.settingsRow}>
          <TouchableOpacity style={styles.settingBtn} onPress={() => {
            setGoalInput(settings.dailyGoalMl.toString());
            setShowGoalModal(true);
          }}>
            <Text style={styles.settingBtnText}>Set Daily Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Log */}
        <Text style={styles.sectionTitle}>Today's Log</Text>
        {todayData.drinks.length === 0 ? (
          <Text style={styles.emptyText}>No drinks logged yet today</Text>
        ) : (
          todayData.drinks.map((drink) => (
            <View key={drink.id} style={styles.drinkItem}>
              <Text style={styles.drinkIcon}>💧</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.drinkAmount}>{formatAmount(drink.amount)}</Text>
                <Text style={styles.drinkTime}>
                  {new Date(drink.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          ))
        )}

        {/* History Chart */}
        {history.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Last 7 Days</Text>
            <View style={styles.chartContainer}>
              {history.map((day, index) => {
                const dayProgress = (day.totalMl / settings.dailyGoalMl) * 100;
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
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <AdBanner />

      {/* Custom Amount Modal */}
      <Modal visible={showCustomModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Custom Amount</Text>
            <TextInput
              style={styles.input}
              value={customAmount}
              onChangeText={setCustomAmount}
              keyboardType="numeric"
              placeholder={`Enter amount in ${settings.unit}`}
              autoFocus
            />
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => setShowCustomModal(false)}
              >
                <Text style={styles.btnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnAdd]} onPress={addCustomDrink}>
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
            <Text style={styles.modalTitle}>Daily Goal (ml)</Text>
            <Text style={styles.modalHint}>Recommended: 1500-4000ml per day</Text>
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
  unitToggle: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  unitToggleText: { color: colors.white, fontSize: 14, fontWeight: 'bold' },
  content: { padding: spacing.lg, paddingBottom: 100 },
  progressSection: { alignItems: 'center', marginBottom: spacing.lg },
  progressCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    elevation: 4,
  },
  progressCircleInner: { alignItems: 'center' },
  progressPercent: { fontSize: 40, fontWeight: 'bold', color: colors.primary },
  progressLabel: { fontSize: 14, color: colors.gray.dark, marginTop: 4 },
  progressDetails: { flexDirection: 'row', gap: spacing.lg },
  progressDetail: { alignItems: 'center' },
  progressDetailValue: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  progressDetailLabel: { fontSize: 12, color: colors.gray.dark, marginTop: 2 },
  progressBarContainer: { marginBottom: spacing.xl },
  progressBar: {
    height: 12,
    backgroundColor: colors.gray.light,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
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
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    elevation: 2,
  },
  customBtn: { backgroundColor: colors.primary },
  quickBtnIcon: { fontSize: 32, marginBottom: spacing.sm },
  quickBtnText: { fontSize: 12, fontWeight: '600', color: colors.text },
  settingsRow: { marginBottom: spacing.lg },
  settingBtn: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  settingBtnText: { fontSize: 16, fontWeight: '600', color: colors.primary },
  emptyText: { textAlign: 'center', color: colors.gray.dark, marginTop: spacing.md },
  drinkItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  drinkIcon: { fontSize: 24, marginRight: spacing.md },
  drinkAmount: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  drinkTime: { fontSize: 12, color: colors.gray.dark, marginTop: 2 },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    height: 200,
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.md },
  modalHint: { fontSize: 14, color: colors.gray.dark, marginBottom: spacing.lg },
  input: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  buttons: { flexDirection: 'row', gap: spacing.md },
  btn: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  btnCancel: { backgroundColor: colors.gray.light },
  btnAdd: { backgroundColor: colors.primary },
  btnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  btnTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
