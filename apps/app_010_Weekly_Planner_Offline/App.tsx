import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, TextInput, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@weekly_planner';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

type WeekData = { [key: number]: Task[] };

export default function App() {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const [weekData, setWeekData] = useState<WeekData>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [actionCount, setActionCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setWeekData(JSON.parse(saved));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = async (data: WeekData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setWeekData(data);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText,
      completed: false,
    };

    const dayTasks = weekData[selectedDay] || [];
    const updated = { ...weekData, [selectedDay]: [...dayTasks, newTask] };
    saveData(updated);
    setNewTaskText('');
    setShowAddModal(false);

    const newCount = actionCount + 1;
    setActionCount(newCount);
    if (newCount % 10 === 0) showInterstitialAd();
  };

  const toggleTask = (taskId: string) => {
    const dayTasks = weekData[selectedDay] || [];
    const updated = {
      ...weekData,
      [selectedDay]: dayTasks.map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    };
    saveData(updated);
  };

  const deleteTask = (taskId: string) => {
    const dayTasks = weekData[selectedDay] || [];
    const updated = {
      ...weekData,
      [selectedDay]: dayTasks.filter(t => t.id !== taskId),
    };
    saveData(updated);
  };

  const currentTasks = weekData[selectedDay] || [];
  const completedToday = currentTasks.filter(t => t.completed).length;
  const totalToday = currentTasks.length;

  const getTotalTasksForWeek = () => {
    return Object.values(weekData).reduce((sum, tasks) => sum + tasks.length, 0);
  };

  const getCompletedTasksForWeek = () => {
    return Object.values(weekData).reduce((sum, tasks) => sum + tasks.filter(t => t.completed).length, 0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Weekly Planner</Text>
        <View style={styles.weekStats}>
          <Text style={styles.weekStatsText}>
            {getCompletedTasksForWeek()}/{getTotalTasksForWeek()} this week
          </Text>
        </View>
      </View>

      <View style={styles.daysContainer}>
        <FlatList
          horizontal
          data={DAYS}
          keyExtractor={(item, index) => index.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const taskCount = (weekData[index] || []).length;
            const isSelected = selectedDay === index;

            return (
              <TouchableOpacity
                style={[styles.dayButton, isSelected && styles.dayButtonActive]}
                onPress={() => setSelectedDay(index)}
              >
                <Text style={[styles.dayName, isSelected && styles.dayNameActive]}>
                  {item.slice(0, 3)}
                </Text>
                {taskCount > 0 && (
                  <View style={[styles.badge, isSelected && styles.badgeActive]}>
                    <Text style={[styles.badgeText, isSelected && styles.badgeTextActive]}>
                      {taskCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle}>{DAYS[selectedDay]}</Text>
        {totalToday > 0 && (
          <Text style={styles.dayProgress}>
            {completedToday}/{totalToday} done
          </Text>
        )}
      </View>

      <FlatList
        data={currentTasks}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add a task</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.taskCard}
            onPress={() => toggleTask(item.id)}
            onLongPress={() => deleteTask(item.id)}
          >
            <View style={[styles.checkbox, item.completed && styles.checkboxActive]}>
              {item.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.taskText, item.completed && styles.taskTextDone]}>
              {item.text}
            </Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AdBanner />

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Task for {DAYS[selectedDay]}</Text>

            <TextInput
              style={styles.modalInput}
              value={newTaskText}
              onChangeText={setNewTaskText}
              placeholder="What needs to be done..."
              multiline
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewTaskText('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonAdd]}
                onPress={addTask}
              >
                <Text style={styles.modalButtonText}>Add Task</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  weekStats: { backgroundColor: colors.gray.light, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 12 },
  weekStatsText: { fontSize: 12, color: colors.text, fontWeight: '600' },
  daysContainer: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  dayButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.gray.light, borderRadius: 12, marginRight: spacing.xs, alignItems: 'center', minWidth: 60 },
  dayButtonActive: { backgroundColor: colors.primary },
  dayName: { fontSize: 14, fontWeight: '600', color: colors.text },
  dayNameActive: { color: colors.white },
  badge: { marginTop: 2, backgroundColor: colors.white, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  badgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: colors.primary },
  badgeTextActive: { color: colors.white },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  dayTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  dayProgress: { fontSize: 14, color: colors.gray.dark },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: spacing.xl * 2 },
  emptyText: { fontSize: 18, fontWeight: '600', color: colors.gray.dark },
  emptySubtext: { fontSize: 14, color: colors.gray.medium, marginTop: spacing.xs },
  taskCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.gray.medium, marginRight: spacing.md, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: colors.status.success, borderColor: colors.status.success },
  checkmark: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  taskText: { flex: 1, fontSize: 16, color: colors.text },
  taskTextDone: { textDecorationLine: 'line-through', color: colors.gray.medium },
  fab: { position: 'absolute', right: spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 8 },
  fabText: { color: colors.white, fontSize: 32, fontWeight: '300' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  modalInput: { backgroundColor: colors.gray.light, padding: spacing.md, borderRadius: 12, fontSize: 16, minHeight: 80, textAlignVertical: 'top', marginBottom: spacing.lg },
  modalButtons: { flexDirection: 'row', gap: spacing.md },
  modalButton: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: colors.gray.light },
  modalButtonAdd: { backgroundColor: colors.primary },
  modalButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  modalButtonTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
