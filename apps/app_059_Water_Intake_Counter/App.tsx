import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Water_Intake_data';
const SETTINGS_KEY = '@Water_Settings';

interface DailyRecord {
  date: string;
  intake: number;
}

interface Settings {
  dailyGoal: number;
  unit: 'ml' | 'oz';
  customSizes: number[];
}

const DEFAULT_SIZES = [250, 500, 750, 1000];

export default function App() {
  const [todayIntake, setTodayIntake] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [unit, setUnit] = useState<'ml' | 'oz'>('ml');
  const [customSizes, setCustomSizes] = useState(DEFAULT_SIZES);
  const [history, setHistory] = useState<DailyRecord[]>([]);
  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [count, setCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadData();
    checkDailyReset();
  }, []);

  const loadData = async () => {
    try {
      const [savedRecords, savedSettings] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
      ]);

      if (savedRecords) {
        const records: DailyRecord[] = JSON.parse(savedRecords);
        setHistory(records);

        const today = new Date().toISOString().split('T')[0];
        const todayRecord = records.find(r => r.date === today);
        if (todayRecord) setTodayIntake(todayRecord.intake);
      }

      if (savedSettings) {
        const settings: Settings = JSON.parse(savedSettings);
        setDailyGoal(settings.dailyGoal);
        setUnit(settings.unit);
        setCustomSizes(settings.customSizes);
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const checkDailyReset = () => {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = localStorage.getItem('lastCheckDate');

    if (lastDate !== today) {
      localStorage.setItem('lastCheckDate', today);
    }
  };

  const saveData = async (intake: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const updatedHistory = history.filter(r => r.date !== today);
      updatedHistory.unshift({ date: today, intake });

      const last30Days = updatedHistory.slice(0, 30);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(last30Days));
      setHistory(last30Days);
      setTodayIntake(intake);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const saveSettings = async (goal: number, newUnit: 'ml' | 'oz', sizes: number[]) => {
    try {
      const settings: Settings = { dailyGoal: goal, unit: newUnit, customSizes: sizes };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      setDailyGoal(goal);
      setUnit(newUnit);
      setCustomSizes(sizes);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const addWater = (amount: number) => {
    const newIntake = todayIntake + amount;
    saveData(newIntake);

    const newCount = count + 1;
    setCount(newCount);
    if (newCount % 10 === 0) showInterstitialAd();
  };

  const addCustom = () => {
    const amount = parseFloat(customAmount);
    if (!isNaN(amount) && amount > 0) {
      addWater(amount);
      setShowCustom(false);
      setCustomAmount('');
    }
  };

  const updateGoal = () => {
    const goal = parseFloat(newGoal);
    if (!isNaN(goal) && goal > 0) {
      saveSettings(goal, unit, customSizes);
      setShowSettings(false);
      setNewGoal('');
    }
  };

  const toggleUnit = () => {
    const newUnit = unit === 'ml' ? 'oz' : 'ml';
    const conversionFactor = newUnit === 'oz' ? 0.033814 : 29.5735;

    const newGoal = Math.round(dailyGoal * conversionFactor);
    const newIntake = Math.round(todayIntake * conversionFactor);
    const newSizes = customSizes.map(s => Math.round(s * conversionFactor));

    saveSettings(newGoal, newUnit, newSizes);
    setTodayIntake(newIntake);
  };

  const percentage = Math.min((todayIntake / dailyGoal) * 100, 100);

  const getAverage = (): number => {
    if (history.length === 0) return 0;
    const total = history.reduce((sum, r) => sum + r.intake, 0);
    return Math.round(total / history.length);
  };

  const getStreak = (): number => {
    let streak = 0;
    const sortedHistory = [...history].sort((a, b) => b.date.localeCompare(a.date));

    for (let i = 0; i < sortedHistory.length; i++) {
      if (sortedHistory[i].intake >= dailyGoal) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Water Intake</Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => setShowSettings(true)}>
          <Text style={styles.settingsBtnText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.progressSection}>
          <View style={styles.unitToggle}>
            <TouchableOpacity onPress={toggleUnit}>
              <Text style={styles.unitText}>{unit.toUpperCase()} ↔️</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.intakeAmount}>{todayIntake} {unit}</Text>
          <Text style={styles.goalText}>of {dailyGoal} {unit}</Text>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: percentage + '%' }]} />
          </View>
          <Text style={styles.percentageText}>{percentage.toFixed(0)}%</Text>
        </View>

        <View style={styles.quickButtons}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.buttonsGrid}>
            {customSizes.map((size, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickBtn}
                onPress={() => addWater(size)}
              >
                <Text style={styles.quickBtnAmount}>{size}</Text>
                <Text style={styles.quickBtnUnit}>{unit}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.customBtn}
            onPress={() => setShowCustom(true)}
          >
            <Text style={styles.customBtnText}>+ Custom Amount</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{getAverage()}</Text>
              <Text style={styles.statLabel}>Avg/Day ({unit})</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{getStreak()}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Last 7 Days</Text>
          {history.slice(0, 7).map((record) => {
            const recordPercentage = (record.intake / dailyGoal) * 100;
            const date = new Date(record.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

            return (
              <View key={record.date} style={styles.historyCard}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyDay}>{dayName}</Text>
                  <Text style={styles.historyDate}>{record.date}</Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyAmount}>{record.intake} {unit}</Text>
                  <View style={styles.miniProgress}>
                    <View style={[styles.miniProgressFill, { width: Math.min(recordPercentage, 100) + '%' }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <AdBanner />

      <Modal visible={showCustom} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Custom Amount</Text>
            <TextInput
              style={styles.modalInput}
              value={customAmount}
              onChangeText={setCustomAmount}
              placeholder={'Enter amount in ' + unit}
              keyboardType="decimal-pad"
              placeholderTextColor={colors.gray.medium}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => { setShowCustom(false); setCustomAmount(''); }}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={addCustom}
              >
                <Text style={styles.modalBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showSettings} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>Settings</Text>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Text style={styles.closeBtn}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.settingsContent}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Daily Goal ({unit})</Text>
              <TextInput
                style={styles.settingInput}
                value={newGoal || String(dailyGoal)}
                onChangeText={setNewGoal}
                keyboardType="number-pad"
                placeholderTextColor={colors.gray.medium}
              />
              <TouchableOpacity style={styles.updateBtn} onPress={updateGoal}>
                <Text style={styles.updateBtnText}>Update</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Unit</Text>
              <TouchableOpacity style={styles.unitSwitchBtn} onPress={toggleUnit}>
                <Text style={styles.unitSwitchText}>
                  Currently: {unit.toUpperCase()} (Tap to switch)
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray.light },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gray.light, justifyContent: 'center', alignItems: 'center' },
  settingsBtnText: { fontSize: 20 },
  progressSection: { padding: spacing.xl, alignItems: 'center', backgroundColor: colors.primary, margin: spacing.lg, borderRadius: 16 },
  unitToggle: { alignSelf: 'flex-end' },
  unitText: { fontSize: 14, color: colors.white, fontWeight: '600' },
  intakeAmount: { fontSize: 48, fontWeight: 'bold', color: colors.white },
  goalText: { fontSize: 18, color: 'rgba(255,255,255,0.9)', marginBottom: spacing.lg },
  progressBar: { width: '100%', height: 12, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 6, overflow: 'hidden', marginBottom: spacing.sm },
  progressFill: { height: '100%', backgroundColor: colors.secondary, borderRadius: 6 },
  percentageText: { fontSize: 16, fontWeight: '600', color: colors.white },
  quickButtons: { padding: spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  buttonsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.md },
  quickBtn: { width: '47%', padding: spacing.lg, backgroundColor: colors.accent, borderRadius: 12, alignItems: 'center' },
  quickBtnAmount: { fontSize: 32, fontWeight: 'bold', color: colors.white },
  quickBtnUnit: { fontSize: 14, color: colors.white, marginTop: spacing.xs },
  customBtn: { padding: spacing.lg, backgroundColor: colors.gray.light, borderRadius: 12, alignItems: 'center' },
  customBtnText: { fontSize: 16, fontWeight: '600', color: colors.primary },
  statsSection: { padding: spacing.lg },
  statsGrid: { flexDirection: 'row', gap: spacing.md },
  statCard: { flex: 1, padding: spacing.lg, backgroundColor: colors.white, borderRadius: 12, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 32, fontWeight: 'bold', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.gray.dark, marginTop: spacing.xs, textAlign: 'center' },
  historySection: { padding: spacing.lg },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, marginBottom: spacing.sm, elevation: 1 },
  historyLeft: {},
  historyDay: { fontSize: 16, fontWeight: '600', color: colors.text },
  historyDate: { fontSize: 12, color: colors.gray.dark, marginTop: spacing.xs },
  historyRight: { alignItems: 'flex-end' },
  historyAmount: { fontSize: 14, fontWeight: '600', color: colors.primary },
  miniProgress: { width: 100, height: 4, backgroundColor: colors.gray.light, borderRadius: 2, overflow: 'hidden', marginTop: spacing.xs },
  miniProgressFill: { height: '100%', backgroundColor: colors.accent },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.xl, width: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  modalInput: { backgroundColor: colors.gray.light, padding: spacing.md, borderRadius: 12, fontSize: 16, marginBottom: spacing.lg },
  modalButtons: { flexDirection: 'row', gap: spacing.md },
  modalBtn: { flex: 1, padding: spacing.md, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: colors.gray.light },
  modalBtnSave: { backgroundColor: colors.primary },
  modalBtnText: { fontSize: 16, fontWeight: 'bold', color: colors.white },
  modalBtnTextCancel: { fontSize: 16, fontWeight: '600', color: colors.text },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray.light },
  modalHeaderTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  closeBtn: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  settingsContent: { padding: spacing.lg },
  settingItem: { marginBottom: spacing.xl },
  settingLabel: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  settingInput: { backgroundColor: colors.gray.light, padding: spacing.md, borderRadius: 12, fontSize: 18, marginBottom: spacing.md },
  updateBtn: { padding: spacing.md, backgroundColor: colors.primary, borderRadius: 12, alignItems: 'center' },
  updateBtnText: { fontSize: 16, fontWeight: 'bold', color: colors.white },
  unitSwitchBtn: { padding: spacing.lg, backgroundColor: colors.gray.light, borderRadius: 12 },
  unitSwitchText: { fontSize: 16, color: colors.text, textAlign: 'center' },
});
