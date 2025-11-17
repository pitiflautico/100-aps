import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, TextInput, Modal, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@study_planner_tasks';

type Priority = 'low' | 'medium' | 'high';
type Category = 'study' | 'assignment' | 'exam' | 'reading' | 'other';

interface Task {
  id: string;
  text: string;
  category: Category;
  priority: Priority;
  dueDate: string;
  completed: boolean;
  createdAt: string;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('study');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('medium');
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setTasks(JSON.parse(saved));
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const saveTasks = async (newTasks: Task[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
      setTasks(newTasks);
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  const addTask = () => {
    if (!input.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      text: input,
      category: selectedCategory,
      priority: selectedPriority,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newTask, ...tasks];
    saveTasks(updated);
    setInput('');
    setShowAddModal(false);

    const newCount = taskCount + 1;
    setTaskCount(newCount);
    if (newCount % 10 === 0) showInterstitialAd();
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasks(updated);
  };

  const deleteTask = (id: string) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        saveTasks(tasks.filter(t => t.id !== id));
      }},
    ]);
  };

  const getFilteredTasks = (): Task[] => {
    if (filter === 'active') return tasks.filter(t => !t.completed);
    if (filter === 'completed') return tasks.filter(t => t.completed);
    return tasks;
  };

  const getCategoryColor = (category: Category): string => {
    const map: Record<Category, string> = {
      study: colors.primary,
      assignment: colors.status.warning,
      exam: colors.status.error,
      reading: colors.status.info,
      other: colors.gray.dark,
    };
    return map[category];
  };

  const getPriorityColor = (priority: Priority): string => {
    const map: Record<Priority, string> = {
      low: colors.status.success,
      medium: colors.status.warning,
      high: colors.status.error,
    };
    return map[priority];
  };

  const filteredTasks = getFilteredTasks();
  const stats = {
    total: tasks.length,
    active: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length,
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Study Planner</Text>
        <View style={styles.stats}>
          <Text style={styles.statText}>{stats.active} Active</Text>
          <Text style={styles.statText}>• {stats.completed} Done</Text>
        </View>
      </View>

      <View style={styles.filters}>
        {(['all', 'active', 'completed'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first study task</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.taskCard}>
            <TouchableOpacity
              style={styles.taskContent}
              onPress={() => toggleTask(item.id)}
              onLongPress={() => deleteTask(item.id)}
            >
              <View style={[styles.checkbox, item.completed && styles.checkboxActive]}>
                {item.completed && <Text style={styles.checkmark}>✓</Text>}
              </View>

              <View style={styles.taskInfo}>
                <Text style={[styles.taskText, item.completed && styles.taskTextDone]}>
                  {item.text}
                </Text>
                <View style={styles.taskMeta}>
                  <View style={[styles.badge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
                    <Text style={[styles.badgeText, { color: getCategoryColor(item.category) }]}>
                      {item.category}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                    <Text style={[styles.badgeText, { color: getPriorityColor(item.priority) }]}>
                      {item.priority}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}
      />

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
            <Text style={styles.modalTitle}>New Task</Text>

            <TextInput
              style={styles.modalInput}
              value={input}
              onChangeText={setInput}
              placeholder="Enter task description..."
              multiline
              autoFocus
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.optionRow}>
              {(['study', 'assignment', 'exam', 'reading', 'other'] as Category[]).map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.option, selectedCategory === cat && styles.optionActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.optionText, selectedCategory === cat && styles.optionTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Priority</Text>
            <View style={styles.optionRow}>
              {(['low', 'medium', 'high'] as Priority[]).map(pri => (
                <TouchableOpacity
                  key={pri}
                  style={[
                    styles.option,
                    selectedPriority === pri && styles.optionActive,
                    { borderColor: getPriorityColor(pri) }
                  ]}
                  onPress={() => setSelectedPriority(pri)}
                >
                  <Text style={[
                    styles.optionText,
                    selectedPriority === pri && styles.optionTextActive
                  ]}>
                    {pri}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAddModal(false);
                  setInput('');
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
  header: { padding: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: 32, fontWeight: 'bold', color: colors.primary },
  stats: { flexDirection: 'row', marginTop: spacing.xs },
  statText: { fontSize: 14, color: colors.gray.dark, marginRight: spacing.sm },
  filters: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginBottom: spacing.md, gap: spacing.sm },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 16, backgroundColor: colors.gray.light },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 14, color: colors.text },
  filterTextActive: { color: colors.white, fontWeight: '600' },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: spacing.xl * 2 },
  emptyText: { fontSize: 18, fontWeight: '600', color: colors.gray.dark },
  emptySubtext: { fontSize: 14, color: colors.gray.medium, marginTop: spacing.xs },
  taskCard: { backgroundColor: colors.white, borderRadius: 12, marginBottom: spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  taskContent: { flexDirection: 'row', padding: spacing.lg, alignItems: 'flex-start' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.gray.medium, marginRight: spacing.md, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: colors.status.success, borderColor: colors.status.success },
  checkmark: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  taskInfo: { flex: 1 },
  taskText: { fontSize: 16, color: colors.text, marginBottom: spacing.xs },
  taskTextDone: { textDecorationLine: 'line-through', color: colors.gray.medium },
  taskMeta: { flexDirection: 'row', gap: spacing.xs },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  fab: { position: 'absolute', right: spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 8 },
  fabText: { color: colors.white, fontSize: 32, fontWeight: '300' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  modalInput: { backgroundColor: colors.gray.light, padding: spacing.md, borderRadius: 12, fontSize: 16, minHeight: 80, textAlignVertical: 'top', marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  option: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8, borderWidth: 1, borderColor: colors.gray.light, backgroundColor: colors.white },
  optionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { fontSize: 14, color: colors.text },
  optionTextActive: { color: colors.white, fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: spacing.md },
  modalButton: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: colors.gray.light },
  modalButtonAdd: { backgroundColor: colors.primary },
  modalButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  modalButtonTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
