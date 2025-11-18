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
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@ToDo_List_Offline_data';
const CATEGORIES_KEY = '@ToDo_Categories_data';

type Priority = 'High' | 'Medium' | 'Low';
type RecurringType = 'none' | 'daily' | 'weekly' | 'monthly';
type FilterType = 'all' | 'today' | 'priority' | 'category' | 'completed';

interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoItem {
  id: string;
  text: string;
  description: string;
  completed: boolean;
  priority: Priority;
  category: string;
  dueDate: string;
  recurring: RecurringType;
  subtasks: Subtask[];
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Work', color: '#3498db' },
  { id: '2', name: 'Personal', color: '#2ecc71' },
  { id: '3', name: 'Shopping', color: '#e74c3c' },
  { id: '4', name: 'Health', color: '#9b59b6' },
];

export default function App() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [showModal, setShowModal] = useState(false);
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [currentTodoId, setCurrentTodoId] = useState<string>('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [count, setCount] = useState(0);

  // Form states
  const [text, setText] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [selectedCategory, setSelectedCategory] = useState('Personal');
  const [dueDate, setDueDate] = useState('');
  const [recurring, setRecurring] = useState<RecurringType>('none');
  const [subtaskText, setSubtaskText] = useState('');

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedTodos, savedCategories] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(CATEGORIES_KEY),
      ]);
      if (savedTodos) setTodos(JSON.parse(savedTodos));
      if (savedCategories) setCategories(JSON.parse(savedCategories));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (data: TodoItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setTodos(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const resetForm = () => {
    setText('');
    setDescription('');
    setPriority('Medium');
    setSelectedCategory('Personal');
    setDueDate('');
    setRecurring('none');
    setEditingTodo(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (todo: TodoItem) => {
    setEditingTodo(todo);
    setText(todo.text);
    setDescription(todo.description);
    setPriority(todo.priority);
    setSelectedCategory(todo.category);
    setDueDate(todo.dueDate);
    setRecurring(todo.recurring);
    setShowModal(true);
  };

  const saveTodo = () => {
    if (!text.trim()) return;

    const newCount = count + 1;
    setCount(newCount);

    if (editingTodo) {
      const updated = todos.map((t) =>
        t.id === editingTodo.id
          ? {
              ...editingTodo,
              text,
              description,
              priority,
              category: selectedCategory,
              dueDate,
              recurring,
            }
          : t
      );
      saveData(updated);
    } else {
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        text,
        description,
        completed: false,
        priority,
        category: selectedCategory,
        dueDate,
        recurring,
        subtasks: [],
        createdAt: new Date().toISOString(),
      };
      saveData([newTodo, ...todos]);
    }

    setShowModal(false);
    resetForm();

    if (newCount % 5 === 0) showInterstitialAd();
  };

  const toggleTodo = (id: string) => {
    saveData(
      todos.map((t) => {
        if (t.id === id) {
          const completed = !t.completed;
          // Handle recurring tasks
          if (completed && t.recurring !== 'none') {
            const newDueDate = getNextDueDate(t.dueDate, t.recurring);
            return { ...t, completed: false, dueDate: newDueDate };
          }
          return { ...t, completed };
        }
        return t;
      })
    );
  };

  const deleteTodo = (id: string) => {
    saveData(todos.filter((t) => t.id !== id));
  };

  const getNextDueDate = (currentDate: string, type: RecurringType): string => {
    if (!currentDate) return '';
    const date = new Date(currentDate);
    switch (type) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
    }
    return date.toISOString().split('T')[0];
  };

  const openSubtaskModal = (todoId: string) => {
    setCurrentTodoId(todoId);
    setSubtaskText('');
    setShowSubtaskModal(true);
  };

  const addSubtask = () => {
    if (!subtaskText.trim()) return;
    const newSubtask: Subtask = {
      id: Date.now().toString(),
      text: subtaskText,
      completed: false,
    };
    saveData(
      todos.map((t) =>
        t.id === currentTodoId ? { ...t, subtasks: [...t.subtasks, newSubtask] } : t
      )
    );
    setSubtaskText('');
    setShowSubtaskModal(false);
  };

  const toggleSubtask = (todoId: string, subtaskId: string) => {
    saveData(
      todos.map((t) =>
        t.id === todoId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, completed: !s.completed } : s
              ),
            }
          : t
      )
    );
  };

  const deleteSubtask = (todoId: string, subtaskId: string) => {
    saveData(
      todos.map((t) =>
        t.id === todoId
          ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) }
          : t
      )
    );
  };

  const getFilteredTodos = (): TodoItem[] => {
    const today = new Date().toISOString().split('T')[0];
    switch (filter) {
      case 'today':
        return todos.filter((t) => t.dueDate === today);
      case 'priority':
        return [...todos].sort((a, b) => {
          const priorities = { High: 3, Medium: 2, Low: 1 };
          return priorities[b.priority] - priorities[a.priority];
        });
      case 'category':
        return [...todos].sort((a, b) => a.category.localeCompare(b.category));
      case 'completed':
        return todos.filter((t) => t.completed);
      default:
        return todos;
    }
  };

  const getPriorityColor = (priority: Priority): string => {
    switch (priority) {
      case 'High':
        return '#e74c3c';
      case 'Medium':
        return '#f39c12';
      case 'Low':
        return '#3498db';
    }
  };

  const getCategoryColor = (categoryName: string): string => {
    const category = categories.find((c) => c.name === categoryName);
    return category?.color || colors.gray.medium;
  };

  const isOverdue = (dueDate: string): boolean => {
    if (!dueDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return dueDate < today;
  };

  const filteredTodos = getFilteredTodos();
  const stats = {
    total: todos.length,
    completed: todos.filter((t) => t.completed).length,
    today: todos.filter((t) => t.dueDate === new Date().toISOString().split('T')[0]).length,
    overdue: todos.filter((t) => !t.completed && isOverdue(t.dueDate)).length,
  };

  const renderTodoItem = ({ item }: { item: TodoItem }) => {
    const completedSubtasks = item.subtasks.filter((s) => s.completed).length;
    const overdue = !item.completed && isOverdue(item.dueDate);

    return (
      <TouchableOpacity
        style={[styles.todoCard, item.completed && styles.todoCompleted]}
        onPress={() => toggleTodo(item.id)}
        onLongPress={() => openEditModal(item)}
      >
        <View style={styles.todoHeader}>
          <View style={styles.todoLeft}>
            <View
              style={[
                styles.checkbox,
                item.completed && styles.checkboxActive,
                { borderColor: getPriorityColor(item.priority) },
              ]}
            >
              {item.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.todoInfo}>
              <Text style={[styles.todoText, item.completed && styles.todoTextCompleted]}>
                {item.text}
              </Text>
              {item.description && (
                <Text style={styles.todoDescription}>{item.description}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={() => deleteTodo(item.id)} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.todoMeta}>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.priorityText}>{item.priority}</Text>
          </View>
          {item.dueDate && (
            <Text style={[styles.dueDate, overdue && styles.overdue]}>
              {overdue ? '⚠ ' : ''}
              {item.dueDate}
            </Text>
          )}
          {item.recurring !== 'none' && (
            <Text style={styles.recurring}>🔄 {item.recurring}</Text>
          )}
        </View>

        {item.subtasks.length > 0 && (
          <View style={styles.subtasksContainer}>
            <Text style={styles.subtasksHeader}>
              Subtasks ({completedSubtasks}/{item.subtasks.length})
            </Text>
            {item.subtasks.map((subtask) => (
              <TouchableOpacity
                key={subtask.id}
                style={styles.subtaskItem}
                onPress={() => toggleSubtask(item.id, subtask.id)}
                onLongPress={() => deleteSubtask(item.id, subtask.id)}
              >
                <View
                  style={[styles.subtaskCheck, subtask.completed && styles.subtaskCheckActive]}
                >
                  {subtask.completed && <Text style={styles.subtaskCheckmark}>✓</Text>}
                </View>
                <Text style={[styles.subtaskText, subtask.completed && styles.subtaskTextDone]}>
                  {subtask.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.addSubtaskBtn}
          onPress={() => openSubtaskModal(item.id)}
        >
          <Text style={styles.addSubtaskText}>+ Add Subtask</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const FilterButton = ({ type, label }: { type: FilterType; label: string }) => (
    <TouchableOpacity
      style={[styles.filterBtn, filter === type && styles.filterBtnActive]}
      onPress={() => setFilter(type)}
    >
      <Text style={[styles.filterText, filter === type && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const PriorityButton = ({ level }: { level: Priority }) => (
    <TouchableOpacity
      style={[
        styles.priorityOption,
        { backgroundColor: getPriorityColor(level) },
        priority === level && styles.priorityOptionActive,
      ]}
      onPress={() => setPriority(level)}
    >
      <Text style={styles.priorityOptionText}>{level}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>ToDo List</Text>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>{stats.completed}/{stats.total}</Text>
          {stats.overdue > 0 && <Text style={styles.overdueBadge}>{stats.overdue} overdue</Text>}
        </View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        <FilterButton type="all" label="All" />
        <FilterButton type="today" label={`Today (${stats.today})`} />
        <FilterButton type="priority" label="Priority" />
        <FilterButton type="category" label="Category" />
        <FilterButton type="completed" label="Completed" />
      </ScrollView>

      {/* Todo List */}
      <FlatList
        data={filteredTodos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No tasks yet. Tap + to add one!</Text>
        }
        renderItem={renderTodoItem}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AdBanner />

      {/* Add/Edit Todo Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editingTodo ? 'Edit Task' : 'New Task'}
              </Text>

              <TextInput
                style={styles.input}
                value={text}
                onChangeText={setText}
                placeholder="Task title..."
                placeholderTextColor={colors.gray.medium}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Description (optional)..."
                placeholderTextColor={colors.gray.medium}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityButtons}>
                <PriorityButton level="High" />
                <PriorityButton level="Medium" />
                <PriorityButton level="Low" />
              </View>

              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      { backgroundColor: cat.color },
                      selectedCategory === cat.name && styles.categoryOptionActive,
                    ]}
                    onPress={() => setSelectedCategory(cat.name)}
                  >
                    <Text style={styles.categoryOptionText}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Due Date</Text>
              <TextInput
                style={styles.input}
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.gray.medium}
              />

              <Text style={styles.label}>Recurring</Text>
              <View style={styles.recurringButtons}>
                {(['none', 'daily', 'weekly', 'monthly'] as RecurringType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.recurringBtn,
                      recurring === type && styles.recurringBtnActive,
                    ]}
                    onPress={() => setRecurring(type)}
                  >
                    <Text
                      style={[
                        styles.recurringText,
                        recurring === type && styles.recurringTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnCancel]}
                  onPress={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.btnTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={saveTodo}>
                  <Text style={styles.btnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Subtask Modal */}
      <Modal visible={showSubtaskModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.subtaskModalContent}>
            <Text style={styles.modalTitle}>Add Subtask</Text>
            <TextInput
              style={styles.input}
              value={subtaskText}
              onChangeText={setSubtaskText}
              placeholder="Subtask description..."
              placeholderTextColor={colors.gray.medium}
              autoFocus
            />
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => setShowSubtaskModal(false)}
              >
                <Text style={styles.btnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={addSubtask}>
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
  },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stat: { fontSize: 16, color: colors.gray.dark, fontWeight: '600' },
  overdueBadge: {
    backgroundColor: '#e74c3c',
    color: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  filterBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.gray.light,
    marginRight: spacing.sm,
  },
  filterBtnActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  filterTextActive: { color: colors.white },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  empty: {
    textAlign: 'center',
    marginTop: spacing.xl * 2,
    color: colors.gray.medium,
    fontSize: 16,
  },
  todoCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  todoCompleted: { opacity: 0.6 },
  todoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  todoLeft: { flexDirection: 'row', flex: 1 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: { backgroundColor: colors.status.success, borderColor: colors.status.success },
  checkmark: { color: colors.white, fontSize: 14, fontWeight: 'bold' },
  todoInfo: { flex: 1 },
  todoText: { fontSize: 16, color: colors.text, fontWeight: '600', marginBottom: 4 },
  todoTextCompleted: { textDecorationLine: 'line-through', color: colors.gray.medium },
  todoDescription: { fontSize: 14, color: colors.gray.dark, marginTop: 4 },
  deleteBtn: { padding: spacing.sm },
  deleteText: { fontSize: 28, color: colors.gray.medium, fontWeight: '300' },
  todoMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: { fontSize: 12, color: colors.white, fontWeight: '600' },
  priorityBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: { fontSize: 12, color: colors.white, fontWeight: '600' },
  dueDate: { fontSize: 12, color: colors.gray.dark, paddingVertical: 4 },
  overdue: { color: '#e74c3c', fontWeight: 'bold' },
  recurring: { fontSize: 12, color: colors.gray.dark, paddingVertical: 4 },
  subtasksContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray.light,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  subtasksHeader: { fontSize: 12, color: colors.gray.dark, fontWeight: '600', marginBottom: spacing.sm },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  subtaskCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.gray.medium,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtaskCheckActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  subtaskCheckmark: { color: colors.white, fontSize: 10, fontWeight: 'bold' },
  subtaskText: { fontSize: 14, color: colors.text, flex: 1 },
  subtaskTextDone: { textDecorationLine: 'line-through', color: colors.gray.medium },
  addSubtaskBtn: { marginTop: spacing.sm },
  addSubtaskText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
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
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: { color: colors.white, fontSize: 32, fontWeight: '300' },
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
    maxHeight: '90%',
  },
  subtaskModalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    margin: spacing.xl,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  priorityButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  priorityOption: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  priorityOptionActive: {
    borderWidth: 3,
    borderColor: colors.text,
  },
  priorityOptionText: { color: colors.white, fontSize: 14, fontWeight: 'bold' },
  categoryOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginRight: spacing.sm,
  },
  categoryOptionActive: {
    borderWidth: 3,
    borderColor: colors.text,
  },
  categoryOptionText: { color: colors.white, fontSize: 14, fontWeight: 'bold' },
  recurringButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  recurringBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.gray.light,
  },
  recurringBtnActive: { backgroundColor: colors.primary },
  recurringText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  recurringTextActive: { color: colors.white },
  buttons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  btn: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  btnCancel: { backgroundColor: colors.gray.light },
  btnSave: { backgroundColor: colors.primary },
  btnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  btnTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
