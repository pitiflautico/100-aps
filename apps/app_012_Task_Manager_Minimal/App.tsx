import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Task_Manager_Minimal_data';

type Priority = 'high' | 'medium' | 'low';
type Category = 'work' | 'personal' | 'shopping' | 'other';
type Filter = 'all' | 'active' | 'completed';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  dueDate?: string;
  createdAt: string;
}

const PRIORITY_COLORS = {
  high: '#F44336',
  medium: '#FF9800',
  low: '#4CAF50',
};

const CATEGORIES = [
  { value: 'work' as Category, label: 'Work', icon: '💼' },
  { value: 'personal' as Category, label: 'Personal', icon: '👤' },
  { value: 'shopping' as Category, label: 'Shopping', icon: '🛒' },
  { value: 'other' as Category, label: 'Other', icon: '📌' },
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<Priority>('medium');
  const [selectedCategory, setSelectedCategory] = useState<Category>('personal');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [sortByDate, setSortByDate] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setTasks(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (data: Task[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setTasks(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const addTask = () => {
    if (!input.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: input,
      completed: false,
      priority: selectedPriority,
      category: selectedCategory,
      dueDate: dueDate?.toISOString(),
      createdAt: new Date().toISOString(),
    };
    saveData([newTask, ...tasks]);
    resetModal();
    const newCount = count + 1;
    setCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const resetModal = () => {
    setInput('');
    setSelectedPriority('medium');
    setSelectedCategory('personal');
    setDueDate(undefined);
    setShowModal(false);
  };

  const toggleTask = (id: string) => {
    saveData(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: string) => {
    saveData(tasks.filter((t) => t.id !== id));
  };

  const getFilteredTasks = () => {
    let filtered = [...tasks];

    // Status filter
    if (filter === 'active') filtered = filtered.filter((t) => !t.completed);
    if (filter === 'completed') filtered = filtered.filter((t) => t.completed);

    // Category filter
    if (categoryFilter !== 'all') filtered = filtered.filter((t) => t.category === categoryFilter);

    // Priority filter
    if (priorityFilter !== 'all') filtered = filtered.filter((t) => t.priority === priorityFilter);

    // Sort by due date
    if (sortByDate) {
      filtered.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }

    return filtered;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredTasks = getFilteredTasks();
  const activeCount = tasks.filter((t) => !t.completed).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Task Manager</Text>
        <Text style={styles.count}>
          {activeCount}/{tasks.length}
        </Text>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        <View style={styles.filters}>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'active' && styles.filterBtnActive]}
            onPress={() => setFilter('active')}
          >
            <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'completed' && styles.filterBtnActive]}
            onPress={() => setFilter('completed')}
          >
            <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>Completed</Text>
          </TouchableOpacity>

          {/* Category Filters */}
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[styles.filterBtn, categoryFilter === cat.value && styles.filterBtnActive]}
              onPress={() => setCategoryFilter(categoryFilter === cat.value ? 'all' : cat.value)}
            >
              <Text style={[styles.filterText, categoryFilter === cat.value && styles.filterTextActive]}>
                {cat.icon} {cat.label}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Priority Filters */}
          <TouchableOpacity
            style={[styles.filterBtn, priorityFilter === 'high' && styles.filterBtnActive]}
            onPress={() => setPriorityFilter(priorityFilter === 'high' ? 'all' : 'high')}
          >
            <Text style={[styles.filterText, priorityFilter === 'high' && styles.filterTextActive]}>High Priority</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, sortByDate && styles.filterBtnActive]}
            onPress={() => setSortByDate(!sortByDate)}
          >
            <Text style={[styles.filterText, sortByDate && styles.filterTextActive]}>Sort by Date</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add a new task</Text>
          </View>
        }
        renderItem={({ item }) => {
          const categoryInfo = CATEGORIES.find((c) => c.value === item.category);
          return (
            <TouchableOpacity
              style={styles.taskCard}
              onPress={() => toggleTask(item.id)}
              onLongPress={() => deleteTask(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.taskHeader}>
                <View style={styles.taskLeft}>
                  <View style={[styles.checkbox, item.completed && styles.checkboxActive]}>
                    {item.completed && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.taskContent}>
                    <Text style={[styles.taskText, item.completed && styles.taskTextDone]}>{item.text}</Text>
                    <View style={styles.taskMeta}>
                      <Text style={styles.categoryBadge}>
                        {categoryInfo?.icon} {categoryInfo?.label}
                      </Text>
                      {item.dueDate && (
                        <Text style={styles.dueDateText}>📅 {formatDate(item.dueDate)}</Text>
                      )}
                    </View>
                  </View>
                </View>
                <View style={[styles.priorityIndicator, { backgroundColor: PRIORITY_COLORS[item.priority] }]} />
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AdBanner />

      {/* Add Task Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Task</Text>

            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Task description..."
              placeholderTextColor={colors.gray.medium}
              autoFocus
              multiline
            />

            {/* Priority Selector */}
            <Text style={styles.sectionLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityBtn,
                    { borderColor: PRIORITY_COLORS[p] },
                    selectedPriority === p && { backgroundColor: PRIORITY_COLORS[p] },
                  ]}
                  onPress={() => setSelectedPriority(p)}
                >
                  <Text
                    style={[
                      styles.priorityBtnText,
                      { color: selectedPriority === p ? colors.white : PRIORITY_COLORS[p] },
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category Selector */}
            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.categoryBtn, selectedCategory === cat.value && styles.categoryBtnActive]}
                  onPress={() => setSelectedCategory(cat.value)}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryBtnText,
                      selectedCategory === cat.value && styles.categoryBtnTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Due Date */}
            <Text style={styles.sectionLabel}>Due Date (Optional)</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateBtnText}>
                {dueDate ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date'}
              </Text>
            </TouchableOpacity>
            {dueDate && (
              <TouchableOpacity onPress={() => setDueDate(undefined)}>
                <Text style={styles.clearDateText}>Clear date</Text>
              </TouchableOpacity>
            )}

            {showDatePicker && (
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setDueDate(selectedDate);
                }}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={resetModal}>
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnAdd]}
                onPress={addTask}
                disabled={!input.trim()}
              >
                <Text style={styles.modalBtnText}>Add Task</Text>
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
    padding: spacing.lg,
    alignItems: 'center',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  count: { fontSize: 18, color: colors.gray.dark, fontWeight: '600' },
  filtersContainer: { maxHeight: 50, marginBottom: spacing.sm },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.gray.light,
  },
  filterBtnActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  filterTextActive: { color: colors.white },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', marginTop: spacing['2xl'] },
  emptyText: { fontSize: 18, color: colors.gray.dark, fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: colors.gray.medium, marginTop: spacing.sm },
  taskCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  taskLeft: { flexDirection: 'row', flex: 1 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray.medium,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: { backgroundColor: colors.status.success, borderColor: colors.status.success },
  checkmark: { color: colors.white, fontSize: 14, fontWeight: 'bold' },
  taskContent: { flex: 1 },
  taskText: { fontSize: 16, color: colors.text, marginBottom: spacing.xs },
  taskTextDone: { textDecorationLine: 'line-through', color: colors.gray.medium },
  taskMeta: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  categoryBadge: { fontSize: 12, color: colors.gray.dark },
  dueDateText: { fontSize: 12, color: colors.status.info },
  priorityIndicator: { width: 4, height: '100%', borderRadius: 2 },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: { color: colors.white, fontSize: 32, fontWeight: '300' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    maxHeight: '90%',
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  input: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: spacing.lg,
    minHeight: 60,
  },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: colors.gray.dark, marginBottom: spacing.sm },
  priorityRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  priorityBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  priorityBtnText: { fontSize: 14, fontWeight: '600' },
  categoryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  categoryBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.gray.light,
    alignItems: 'center',
  },
  categoryBtnActive: { backgroundColor: colors.primary },
  categoryIcon: { fontSize: 20, marginBottom: spacing.xs },
  categoryBtnText: { fontSize: 12, color: colors.text, fontWeight: '600' },
  categoryBtnTextActive: { color: colors.white },
  dateBtn: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  dateBtnText: { fontSize: 16, color: colors.text },
  clearDateText: { fontSize: 14, color: colors.status.error, textAlign: 'center', marginBottom: spacing.md },
  modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  modalBtn: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: colors.gray.light },
  modalBtnAdd: { backgroundColor: colors.primary },
  modalBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  modalBtnTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
