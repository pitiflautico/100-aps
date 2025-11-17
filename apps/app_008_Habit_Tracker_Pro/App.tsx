import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, TextInput, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@habit_tracker_data';

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
}

interface HabitLog {
  habitId: string;
  date: string;
}

const PRESET_HABITS = [
  { name: 'Exercise', icon: '💪', color: colors.status.error },
  { name: 'Read', icon: '📚', color: colors.primary },
  { name: 'Meditate', icon: '🧘', color: colors.status.info },
  { name: 'Drink Water', icon: '💧', color: colors.status.success },
  { name: 'Sleep 8h', icon: '😴', color: colors.secondary },
  { name: 'Study', icon: '📖', color: colors.status.warning },
];

const ICONS = ['💪', '📚', '🧘', '💧', '😴', '📖', '🏃', '🎯', '✍️', '🎨', '🎵', '🍎'];
const COLORS = [colors.primary, colors.secondary, colors.status.success, colors.status.warning, colors.status.error, colors.status.info];

export default function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [checkCount, setCheckCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setHabits(data.habits || []);
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = async (newHabits: Habit[], newLogs: HabitLog[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ habits: newHabits, logs: newLogs }));
      setHabits(newHabits);
      setLogs(newLogs);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const addHabit = () => {
    if (!newHabitName.trim()) return;

    const newHabit: Habit = {
      id: Date.now().toString(),
      name: newHabitName,
      icon: selectedIcon,
      color: selectedColor,
      createdAt: new Date().toISOString(),
    };

    saveData([...habits, newHabit], logs);
    setNewHabitName('');
    setShowAddModal(false);
  };

  const addPresetHabit = (preset: typeof PRESET_HABITS[0]) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      ...preset,
      createdAt: new Date().toISOString(),
    };
    saveData([...habits, newHabit], logs);
  };

  const toggleHabit = (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const existingLog = logs.find(log => log.habitId === habitId && log.date === today);

    let newLogs: HabitLog[];
    if (existingLog) {
      newLogs = logs.filter(log => !(log.habitId === habitId && log.date === today));
    } else {
      newLogs = [...logs, { habitId, date: today }];
      const newCount = checkCount + 1;
      setCheckCount(newCount);
      if (newCount % 7 === 0) showInterstitialAd();
    }

    saveData(habits, newLogs);
  };

  const isHabitCompletedToday = (habitId: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return logs.some(log => log.habitId === habitId && log.date === today);
  };

  const getHabitStreak = (habitId: string): number => {
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      if (logs.some(log => log.habitId === habitId && log.date === dateStr)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const getTodayCompletionRate = (): number => {
    if (habits.length === 0) return 0;
    const today = new Date().toISOString().split('T')[0];
    const completedToday = habits.filter(h => logs.some(log => log.habitId === h.id && log.date === today)).length;
    return Math.round((completedToday / habits.length) * 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Habit Tracker</Text>
        <View style={styles.completionBadge}>
          <Text style={styles.completionText}>{getTodayCompletionRate()}%</Text>
        </View>
      </View>

      {habits.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Start Building Habits!</Text>
          <Text style={styles.emptySubtitle}>Add your first habit below</Text>

          <Text style={styles.presetsTitle}>Quick Start:</Text>
          {PRESET_HABITS.map((preset, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.presetButton, { borderColor: preset.color }]}
              onPress={() => addPresetHabit(preset)}
            >
              <Text style={styles.presetIcon}>{preset.icon}</Text>
              <Text style={styles.presetName}>{preset.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isCompleted = isHabitCompletedToday(item.id);
            const streak = getHabitStreak(item.id);

            return (
              <TouchableOpacity
                style={[styles.habitCard, { borderLeftColor: item.color, borderLeftWidth: 4 }]}
                onPress={() => toggleHabit(item.id)}
              >
                <View style={[styles.habitIcon, { backgroundColor: item.color + '20' }]}>
                  <Text style={styles.habitIconText}>{item.icon}</Text>
                </View>

                <View style={styles.habitInfo}>
                  <Text style={styles.habitName}>{item.name}</Text>
                  {streak > 0 && (
                    <Text style={styles.streakText}>🔥 {streak} day streak</Text>
                  )}
                </View>

                <View style={[styles.checkbox, isCompleted && { backgroundColor: item.color }]}>
                  {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AdBanner />

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Habit</Text>

            <TextInput
              style={styles.modalInput}
              value={newHabitName}
              onChangeText={setNewHabitName}
              placeholder="Habit name..."
              autoFocus
            />

            <Text style={styles.label}>Icon</Text>
            <View style={styles.iconRow}>
              {ICONS.map(icon => (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconOption, selectedIcon === icon && styles.iconOptionActive]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Text style={styles.iconOptionText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Color</Text>
            <View style={styles.colorRow}>
              {COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorOption, { backgroundColor: color }, selectedColor === color && styles.colorOptionActive]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewHabitName('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonAdd]}
                onPress={addHabit}
              >
                <Text style={styles.modalButtonText}>Add Habit</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  title: { fontSize: 32, fontWeight: 'bold', color: colors.primary },
  completionBadge: { backgroundColor: colors.status.success, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 16 },
  completionText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: spacing.xs },
  emptySubtitle: { fontSize: 16, color: colors.gray.dark, marginBottom: spacing.xl },
  presetsTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: spacing.md, alignSelf: 'flex-start' },
  presetButton: { width: '100%', flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: 12, borderWidth: 2, marginBottom: spacing.sm, backgroundColor: colors.white },
  presetIcon: { fontSize: 32, marginRight: spacing.md },
  presetName: { fontSize: 18, fontWeight: '600', color: colors.text },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  habitCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  habitIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  habitIconText: { fontSize: 24 },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 18, fontWeight: '600', color: colors.text },
  streakText: { fontSize: 14, color: colors.gray.dark, marginTop: 2 },
  checkbox: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: colors.gray.medium, justifyContent: 'center', alignItems: 'center' },
  checkmark: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  fab: { position: 'absolute', right: spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 8 },
  fabText: { color: colors.white, fontSize: 32, fontWeight: '300' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  modalInput: { backgroundColor: colors.gray.light, padding: spacing.md, borderRadius: 12, fontSize: 16, marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  iconOption: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.gray.light, justifyContent: 'center', alignItems: 'center' },
  iconOptionActive: { backgroundColor: colors.primary + '30', borderWidth: 2, borderColor: colors.primary },
  iconOptionText: { fontSize: 24 },
  colorRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  colorOption: { width: 40, height: 40, borderRadius: 20 },
  colorOptionActive: { borderWidth: 3, borderColor: colors.text },
  modalButtons: { flexDirection: 'row', gap: spacing.md },
  modalButton: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: colors.gray.light },
  modalButtonAdd: { backgroundColor: colors.primary },
  modalButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  modalButtonTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
