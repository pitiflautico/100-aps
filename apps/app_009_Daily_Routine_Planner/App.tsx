import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@daily_routine';

interface RoutineItem {
  id: string;
  time: string;
  task: string;
  completed: boolean;
}

const DEFAULT_ROUTINE: RoutineItem[] = [
  { id: '1', time: '06:00', task: 'Wake up & Morning routine', completed: false },
  { id: '2', time: '07:00', task: 'Breakfast', completed: false },
  { id: '3', time: '08:00', task: 'Work/Study session', completed: false },
  { id: '4', time: '12:00', task: 'Lunch break', completed: false },
  { id: '5', time: '14:00', task: 'Afternoon work', completed: false },
  { id: '6', time: '17:00', task: 'Exercise/Gym', completed: false },
  { id: '7', time: '19:00', task: 'Dinner', completed: false },
  { id: '8', time: '21:00', task: 'Relax/Hobbies', completed: false },
  { id: '9', time: '22:00', task: 'Prepare for bed', completed: false },
];

export default function App() {
  const [routine, setRoutine] = useState<RoutineItem[]>(DEFAULT_ROUTINE);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTime, setNewTime] = useState('');
  const [newTask, setNewTask] = useState('');
  const [toggleCount, setToggleCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadRoutine();
  }, []);

  const loadRoutine = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setRoutine(JSON.parse(saved));
    } catch (error) {
      console.error('Error loading routine:', error);
    }
  };

  const saveRoutine = async (newRoutine: RoutineItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newRoutine));
      setRoutine(newRoutine);
    } catch (error) {
      console.error('Error saving routine:', error);
    }
  };

  const toggleItem = (id: string) => {
    const updated = routine.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    saveRoutine(updated);

    const newCount = toggleCount + 1;
    setToggleCount(newCount);
    if (newCount % 8 === 0) showInterstitialAd();
  };

  const addItem = () => {
    if (!newTime.trim() || !newTask.trim()) return;

    const newItem: RoutineItem = {
      id: Date.now().toString(),
      time: newTime,
      task: newTask,
      completed: false,
    };

    const updated = [...routine, newItem].sort((a, b) => a.time.localeCompare(b.time));
    saveRoutine(updated);
    setNewTime('');
    setNewTask('');
    setShowAddModal(false);
  };

  const resetDay = () => {
    const updated = routine.map(item => ({ ...item, completed: false }));
    saveRoutine(updated);
  };

  const completedCount = routine.filter(i => i.completed).length;
  const totalCount = routine.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Daily Routine</Text>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statsText}>{completedCount}/{totalCount} tasks completed</Text>
        <TouchableOpacity onPress={resetDay} style={styles.resetBtn}>
          <Text style={styles.resetText}>Reset Day</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {routine.map(item => (
          <TouchableOpacity
            key={item.id}
            style={[styles.routineItem, item.completed && styles.routineItemDone]}
            onPress={() => toggleItem(item.id)}
          >
            <View style={[styles.checkbox, item.completed && styles.checkboxActive]}>
              {item.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.time}>{item.time}</Text>
              <Text style={[styles.task, item.completed && styles.taskDone]}>{item.task}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AdBanner />

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Routine Item</Text>

            <Text style={styles.label}>Time</Text>
            <TextInput
              style={styles.input}
              value={newTime}
              onChangeText={setNewTime}
              placeholder="HH:MM (e.g., 15:30)"
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.label}>Task</Text>
            <TextInput
              style={styles.input}
              value={newTask}
              onChangeText={setNewTask}
              placeholder="What to do..."
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewTime('');
                  setNewTask('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonAdd]}
                onPress={addItem}
              >
                <Text style={styles.modalButtonText}>Add</Text>
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
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  progressBadge: { backgroundColor: colors.status.success, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 16 },
  progressText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  stats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  statsText: { fontSize: 14, color: colors.gray.dark },
  resetBtn: { padding: spacing.xs },
  resetText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  routineItem: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  routineItemDone: { opacity: 0.6 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.gray.medium, marginRight: spacing.md, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: colors.status.success, borderColor: colors.status.success },
  checkmark: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  itemContent: { flex: 1 },
  time: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: 2 },
  task: { fontSize: 16, color: colors.text },
  taskDone: { textDecorationLine: 'line-through', color: colors.gray.medium },
  fab: { position: 'absolute', right: spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 8 },
  fabText: { color: colors.white, fontSize: 32, fontWeight: '300' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  input: { backgroundColor: colors.gray.light, padding: spacing.md, borderRadius: 12, fontSize: 16, marginBottom: spacing.md },
  modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  modalButton: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: colors.gray.light },
  modalButtonAdd: { backgroundColor: colors.primary },
  modalButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  modalButtonTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
