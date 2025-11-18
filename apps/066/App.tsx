import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Provider as PaperProvider,
  Appbar,
  FAB,
  Card,
  Text,
  Portal,
  Modal,
  TextInput,
  Button,
  Chip,
  Searchbar,
  IconButton,
  Menu,
  SegmentedButtons,
  Divider,
  Badge,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';

// TypeScript Interfaces
interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliances' | 'exterior' | 'interior' | 'yard' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  frequency: 'once' | 'weekly' | 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  lastCompleted: string;
  nextDue: string;
  estimatedDuration: number;
  cost: number;
  contractor: string;
  room: string;
  notes: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  history: CompletionRecord[];
  createdAt: number;
}

interface CompletionRecord {
  date: string;
  notes: string;
  cost: number;
}

// AdMob Configuration
const bannerId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';
const interstitialId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';

const interstitial = InterstitialAd.createForAdRequest(interstitialId);

const STORAGE_KEY = '@home_maintenance_tasks';

const CATEGORIES = [
  { label: 'Plumbing', value: 'plumbing', icon: 'pipe', color: '#2196F3' },
  { label: 'Electrical', value: 'electrical', icon: 'lightning-bolt', color: '#FFC107' },
  { label: 'HVAC', value: 'hvac', icon: 'air-conditioner', color: '#00BCD4' },
  { label: 'Appliances', value: 'appliances', icon: 'washing-machine', color: '#9C27B0' },
  { label: 'Exterior', value: 'exterior', icon: 'home', color: '#4CAF50' },
  { label: 'Interior', value: 'interior', icon: 'floor-plan', color: '#FF9800' },
  { label: 'Yard', value: 'yard', icon: 'tree', color: '#8BC34A' },
  { label: 'Other', value: 'other', icon: 'tools', color: '#607D8B' },
];

const PRIORITIES = [
  { label: 'Low', value: 'low', color: '#4CAF50' },
  { label: 'Medium', value: 'medium', color: '#FF9800' },
  { label: 'High', value: 'high', color: '#F44336' },
  { label: 'Urgent', value: 'urgent', color: '#D32F2F' },
];

const FREQUENCIES = [
  { label: 'Once', value: 'once' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Semi-Annual', value: 'semi-annual' },
  { label: 'Annual', value: 'annual' },
];

export default function App() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<MaintenanceTask[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [viewingHistory, setViewingHistory] = useState<MaintenanceTask | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentView, setCurrentView] = useState<'upcoming' | 'overdue' | 'completed'>('upcoming');
  const [menuVisible, setMenuVisible] = useState(false);
  const [interstitialLoaded, setInterstitialLoaded] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other' as MaintenanceTask['category'],
    priority: 'medium' as MaintenanceTask['priority'],
    frequency: 'monthly' as MaintenanceTask['frequency'],
    nextDue: '',
    estimatedDuration: '60',
    cost: '',
    contractor: '',
    room: '',
    notes: '',
  });

  // AdMob Interstitial Setup
  useEffect(() => {
    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setInterstitialLoaded(true);
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setInterstitialLoaded(false);
      interstitial.load();
    });

    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
    };
  }, []);

  // Load tasks from storage
  useEffect(() => {
    loadTasks();
  }, []);

  // Update task statuses
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updatedTasks = tasks.map(task => {
      const dueDate = new Date(task.nextDue);
      dueDate.setHours(0, 0, 0, 0);

      let status = task.status;
      if (task.status !== 'completed') {
        if (dueDate < today) {
          status = 'overdue';
        } else if (task.status !== 'in-progress') {
          status = 'pending';
        }
      }

      return { ...task, status };
    });

    if (JSON.stringify(updatedTasks) !== JSON.stringify(tasks)) {
      setTasks(updatedTasks);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
    }
  }, [tasks]);

  // Filter tasks
  useEffect(() => {
    let filtered = [...tasks];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.room.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(task => task.category === filterCategory);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    // View filter
    if (currentView === 'upcoming') {
      filtered = filtered.filter(task => task.status === 'pending' || task.status === 'in-progress');
    } else if (currentView === 'overdue') {
      filtered = filtered.filter(task => task.status === 'overdue');
    } else if (currentView === 'completed') {
      filtered = filtered.filter(task => task.status === 'completed');
    }

    // Sort by due date
    filtered.sort((a, b) => {
      const dateA = new Date(a.nextDue).getTime();
      const dateB = new Date(b.nextDue).getTime();
      return dateA - dateB;
    });

    setFilteredTasks(filtered);
  }, [tasks, searchQuery, filterCategory, filterStatus, currentView]);

  const loadTasks = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTasks(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const saveTasks = async (newTasks: MaintenanceTask[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
      setTasks(newTasks);
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  const calculateNextDueDate = (lastDate: string, frequency: string): string => {
    const date = new Date(lastDate);

    switch (frequency) {
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'semi-annual':
        date.setMonth(date.getMonth() + 6);
        break;
      case 'annual':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        return lastDate;
    }

    return date.toISOString().split('T')[0];
  };

  const openModal = (task?: MaintenanceTask) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        frequency: task.frequency,
        nextDue: task.nextDue,
        estimatedDuration: task.estimatedDuration.toString(),
        cost: task.cost.toString(),
        contractor: task.contractor,
        room: task.room,
        notes: task.notes,
      });
    } else {
      setEditingTask(null);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData({
        title: '',
        description: '',
        category: 'other',
        priority: 'medium',
        frequency: 'monthly',
        nextDue: tomorrow.toISOString().split('T')[0],
        estimatedDuration: '60',
        cost: '',
        contractor: '',
        room: '',
        notes: '',
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingTask(null);
  };

  const saveTask = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter task title');
      return;
    }

    if (!formData.nextDue) {
      Alert.alert('Error', 'Please enter due date');
      return;
    }

    const task: MaintenanceTask = {
      id: editingTask?.id || Date.now().toString(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      priority: formData.priority,
      frequency: formData.frequency,
      lastCompleted: editingTask?.lastCompleted || '',
      nextDue: formData.nextDue,
      estimatedDuration: parseInt(formData.estimatedDuration) || 0,
      cost: parseFloat(formData.cost) || 0,
      contractor: formData.contractor.trim(),
      room: formData.room.trim(),
      notes: formData.notes.trim(),
      status: editingTask?.status || 'pending',
      history: editingTask?.history || [],
      createdAt: editingTask?.createdAt || Date.now(),
    };

    let newTasks: MaintenanceTask[];
    if (editingTask) {
      newTasks = tasks.map(t => (t.id === editingTask.id ? task : t));
    } else {
      newTasks = [...tasks, task];

      if (newTasks.length % 5 === 0 && interstitialLoaded) {
        interstitial.show();
      }
    }

    await saveTasks(newTasks);
    closeModal();
  };

  const deleteTask = (id: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const newTasks = tasks.filter(task => task.id !== id);
          await saveTasks(newTasks);
        },
      },
    ]);
  };

  const markComplete = (task: MaintenanceTask) => {
    Alert.prompt(
      'Complete Task',
      'Add notes about the completion (optional)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async (notes) => {
            const completionRecord: CompletionRecord = {
              date: new Date().toISOString().split('T')[0],
              notes: notes || '',
              cost: task.cost,
            };

            const updatedTask = {
              ...task,
              lastCompleted: completionRecord.date,
              nextDue: task.frequency === 'once' ? task.nextDue : calculateNextDueDate(completionRecord.date, task.frequency),
              status: (task.frequency === 'once' ? 'completed' : 'pending') as MaintenanceTask['status'],
              history: [...task.history, completionRecord],
            };

            const newTasks = tasks.map(t => (t.id === task.id ? updatedTask : t));
            await saveTasks(newTasks);
          },
        },
      ],
      'plain-text'
    );
  };

  const updateStatus = async (id: string, status: MaintenanceTask['status']) => {
    const newTasks = tasks.map(task =>
      task.id === id ? { ...task, status } : task
    );
    await saveTasks(newTasks);
  };

  const viewHistory = (task: MaintenanceTask) => {
    setViewingHistory(task);
    setHistoryModalVisible(true);
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDueDateText = (dueDate: string) => {
    const days = getDaysUntilDue(dueDate);

    if (days < 0) {
      return `${Math.abs(days)} days overdue`;
    } else if (days === 0) {
      return 'Due today';
    } else if (days === 1) {
      return 'Due tomorrow';
    } else if (days <= 7) {
      return `Due in ${days} days`;
    } else {
      return `Due ${dueDate}`;
    }
  };

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[CATEGORIES.length - 1];
  };

  const getPriorityInfo = (priority: string) => {
    return PRIORITIES.find(p => p.value === priority) || PRIORITIES[1];
  };

  const renderTask = (task: MaintenanceTask) => {
    const categoryInfo = getCategoryInfo(task.category);
    const priorityInfo = getPriorityInfo(task.priority);
    const daysUntilDue = getDaysUntilDue(task.nextDue);

    return (
      <Card key={task.id} style={styles.taskCard}>
        <Card.Content>
          <View style={styles.taskHeader}>
            <View style={styles.taskHeaderLeft}>
              <IconButton
                icon={categoryInfo.icon}
                size={24}
                iconColor={categoryInfo.color}
              />
              <View style={styles.taskHeaderText}>
                <Text variant="titleMedium" style={styles.taskTitle}>
                  {task.title}
                </Text>
                {task.room ? (
                  <Text variant="bodySmall" style={styles.taskRoom}>
                    {task.room}
                  </Text>
                ) : null}
              </View>
            </View>
            <Chip
              style={[styles.priorityChip, { backgroundColor: priorityInfo.color + '20' }]}
              textStyle={[styles.chipText, { color: priorityInfo.color }]}
            >
              {priorityInfo.label}
            </Chip>
          </View>

          {task.description ? (
            <Text variant="bodyMedium" style={styles.taskDescription}>
              {task.description}
            </Text>
          ) : null}

          <View style={styles.taskDetails}>
            <View style={styles.taskDetail}>
              <IconButton icon="calendar" size={16} />
              <Text variant="bodySmall" style={styles.taskDetailText}>
                {getDueDateText(task.nextDue)}
              </Text>
            </View>

            {task.estimatedDuration > 0 && (
              <View style={styles.taskDetail}>
                <IconButton icon="clock" size={16} />
                <Text variant="bodySmall" style={styles.taskDetailText}>
                  {task.estimatedDuration} min
                </Text>
              </View>
            )}

            {task.cost > 0 && (
              <View style={styles.taskDetail}>
                <IconButton icon="currency-usd" size={16} />
                <Text variant="bodySmall" style={styles.taskDetailText}>
                  ${task.cost.toFixed(2)}
                </Text>
              </View>
            )}
          </View>

          {task.contractor ? (
            <View style={styles.contractorInfo}>
              <IconButton icon="account-hard-hat" size={16} />
              <Text variant="bodySmall">{task.contractor}</Text>
            </View>
          ) : null}

          <View style={styles.taskFooter}>
            <View style={styles.taskFooterLeft}>
              <Chip
                icon="refresh"
                style={styles.frequencyChip}
                textStyle={styles.chipText}
              >
                {task.frequency}
              </Chip>
              {task.history.length > 0 && (
                <Chip
                  icon="history"
                  style={styles.historyChip}
                  textStyle={styles.chipText}
                  onPress={() => viewHistory(task)}
                >
                  {task.history.length} times
                </Chip>
              )}
            </View>
            <View style={styles.taskActions}>
              {task.status !== 'completed' && (
                <>
                  <IconButton
                    icon="check-circle"
                    size={20}
                    iconColor="#4CAF50"
                    onPress={() => markComplete(task)}
                  />
                  <IconButton
                    icon={task.status === 'in-progress' ? 'pause' : 'play'}
                    size={20}
                    iconColor="#2196F3"
                    onPress={() =>
                      updateStatus(
                        task.id,
                        task.status === 'in-progress' ? 'pending' : 'in-progress'
                      )
                    }
                  />
                </>
              )}
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => openModal(task)}
              />
              <IconButton
                icon="delete"
                size={20}
                iconColor="#d32f2f"
                onPress={() => deleteTask(task.id)}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="Home Maintenance" />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Appbar.Action
                icon="dots-vertical"
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                setFilterCategory('all');
                setFilterStatus('all');
                setSearchQuery('');
              }}
              title="Clear Filters"
              leadingIcon="filter-off"
            />
          </Menu>
        </Appbar.Header>

        {/* View Tabs */}
        <SegmentedButtons
          value={currentView}
          onValueChange={value => setCurrentView(value as any)}
          buttons={[
            {
              value: 'upcoming',
              label: `Upcoming (${tasks.filter(t => t.status === 'pending' || t.status === 'in-progress').length})`,
              icon: 'calendar-clock',
            },
            {
              value: 'overdue',
              label: `Overdue (${tasks.filter(t => t.status === 'overdue').length})`,
              icon: 'alert',
            },
            {
              value: 'completed',
              label: 'Completed',
              icon: 'check',
            },
          ]}
          style={styles.segmentedButtons}
        />

        {/* Search and Filters */}
        <View style={styles.filtersContainer}>
          <Searchbar
            placeholder="Search tasks..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
            <Chip
              selected={filterCategory === 'all'}
              onPress={() => setFilterCategory('all')}
              style={styles.filterChip}
            >
              All
            </Chip>
            {CATEGORIES.map(cat => (
              <Chip
                key={cat.value}
                selected={filterCategory === cat.value}
                onPress={() => setFilterCategory(cat.value)}
                icon={cat.icon}
                style={styles.filterChip}
              >
                {cat.label}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Tasks List */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <IconButton
                icon={currentView === 'overdue' ? 'alert-circle-outline' : 'calendar-check-outline'}
                size={64}
                iconColor="#ccc"
              />
              <Text variant="titleMedium" style={styles.emptyText}>
                {currentView === 'overdue'
                  ? 'No overdue tasks'
                  : currentView === 'completed'
                  ? 'No completed tasks'
                  : 'No upcoming tasks'}
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                {searchQuery || filterCategory !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first maintenance task'}
              </Text>
            </View>
          ) : (
            filteredTasks.map(renderTask)
          )}

          <View style={styles.adContainer}>
            <BannerAd unitId={bannerId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
          </View>
        </ScrollView>

        {/* Add/Edit Task Modal */}
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={closeModal}
            contentContainerStyle={styles.modal}
          >
            <ScrollView>
              <Text variant="titleLarge" style={styles.modalTitle}>
                {editingTask ? 'Edit Task' : 'Add Task'}
              </Text>

              <TextInput
                label="Task Title *"
                value={formData.title}
                onChangeText={text => setFormData({ ...formData, title: text })}
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Description"
                value={formData.description}
                onChangeText={text => setFormData({ ...formData, description: text })}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
              />

              <Text variant="labelMedium" style={styles.label}>
                Category *
              </Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(cat => (
                  <Chip
                    key={cat.value}
                    selected={formData.category === cat.value}
                    onPress={() => setFormData({ ...formData, category: cat.value as any })}
                    icon={cat.icon}
                    style={styles.categoryChip}
                  >
                    {cat.label}
                  </Chip>
                ))}
              </View>

              <Text variant="labelMedium" style={styles.label}>
                Priority *
              </Text>
              <View style={styles.categoryGrid}>
                {PRIORITIES.map(pri => (
                  <Chip
                    key={pri.value}
                    selected={formData.priority === pri.value}
                    onPress={() => setFormData({ ...formData, priority: pri.value as any })}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: formData.priority === pri.value ? pri.color + '30' : '#e0e0e0' },
                    ]}
                  >
                    {pri.label}
                  </Chip>
                ))}
              </View>

              <Text variant="labelMedium" style={styles.label}>
                Frequency *
              </Text>
              <View style={styles.categoryGrid}>
                {FREQUENCIES.map(freq => (
                  <Chip
                    key={freq.value}
                    selected={formData.frequency === freq.value}
                    onPress={() => setFormData({ ...formData, frequency: freq.value as any })}
                    style={styles.categoryChip}
                  >
                    {freq.label}
                  </Chip>
                ))}
              </View>

              <TextInput
                label="Next Due Date (YYYY-MM-DD) *"
                value={formData.nextDue}
                onChangeText={text => setFormData({ ...formData, nextDue: text })}
                style={styles.input}
                mode="outlined"
                placeholder="2024-12-31"
              />

              <TextInput
                label="Room/Location"
                value={formData.room}
                onChangeText={text => setFormData({ ...formData, room: text })}
                style={styles.input}
                mode="outlined"
              />

              <View style={styles.row}>
                <TextInput
                  label="Duration (minutes)"
                  value={formData.estimatedDuration}
                  onChangeText={text => setFormData({ ...formData, estimatedDuration: text })}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  keyboardType="numeric"
                />
                <TextInput
                  label="Estimated Cost"
                  value={formData.cost}
                  onChangeText={text => setFormData({ ...formData, cost: text })}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  keyboardType="decimal-pad"
                  left={<TextInput.Affix text="$" />}
                />
              </View>

              <TextInput
                label="Contractor/Service Provider"
                value={formData.contractor}
                onChangeText={text => setFormData({ ...formData, contractor: text })}
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Notes"
                value={formData.notes}
                onChangeText={text => setFormData({ ...formData, notes: text })}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>
                <Button mode="outlined" onPress={closeModal} style={styles.modalButton}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={saveTask} style={styles.modalButton}>
                  {editingTask ? 'Update' : 'Add'}
                </Button>
              </View>
            </ScrollView>
          </Modal>

          {/* History Modal */}
          <Modal
            visible={historyModalVisible}
            onDismiss={() => setHistoryModalVisible(false)}
            contentContainerStyle={styles.modal}
          >
            <Text variant="titleLarge" style={styles.modalTitle}>
              Completion History
            </Text>
            {viewingHistory && (
              <>
                <Text variant="titleMedium" style={styles.historyTaskTitle}>
                  {viewingHistory.title}
                </Text>
                <ScrollView style={styles.historyList}>
                  {viewingHistory.history.length === 0 ? (
                    <Text variant="bodyMedium" style={styles.emptyHistoryText}>
                      No completion history yet
                    </Text>
                  ) : (
                    viewingHistory.history.map((record, index) => (
                      <Card key={index} style={styles.historyCard}>
                        <Card.Content>
                          <Text variant="titleSmall">{record.date}</Text>
                          {record.notes && (
                            <Text variant="bodyMedium" style={styles.historyNotes}>
                              {record.notes}
                            </Text>
                          )}
                          {record.cost > 0 && (
                            <Text variant="bodySmall" style={styles.historyCost}>
                              Cost: ${record.cost.toFixed(2)}
                            </Text>
                          )}
                        </Card.Content>
                      </Card>
                    ))
                  )}
                </ScrollView>
              </>
            )}
            <Button mode="contained" onPress={() => setHistoryModalVisible(false)} style={styles.closeButton}>
              Close
            </Button>
          </Modal>
        </Portal>

        <FAB icon="plus" style={styles.fab} onPress={() => openModal()} />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  segmentedButtons: {
    margin: 16,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 8,
    elevation: 2,
  },
  searchbar: {
    marginBottom: 8,
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  filterChips: {
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  taskCard: {
    marginBottom: 12,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskHeaderText: {
    flex: 1,
  },
  taskTitle: {
    fontWeight: 'bold',
  },
  taskRoom: {
    color: '#666',
    marginTop: 2,
  },
  priorityChip: {
    height: 24,
  },
  chipText: {
    fontSize: 12,
  },
  taskDescription: {
    color: '#666',
    marginBottom: 12,
  },
  taskDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  taskDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  taskDetailText: {
    color: '#666',
    marginLeft: -8,
  },
  contractorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  taskFooterLeft: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyChip: {
    backgroundColor: '#e3f2fd',
    height: 28,
  },
  historyChip: {
    backgroundColor: '#f3e5f5',
    height: 28,
  },
  taskActions: {
    flexDirection: 'row',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
  },
  emptySubtext: {
    marginTop: 8,
    color: '#999',
  },
  adContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '90%',
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    marginTop: 8,
    marginBottom: 8,
    color: '#666',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
  },
  historyTaskTitle: {
    marginBottom: 16,
    color: '#666',
  },
  historyList: {
    maxHeight: 400,
    marginBottom: 16,
  },
  historyCard: {
    marginBottom: 8,
  },
  historyNotes: {
    marginTop: 8,
    color: '#666',
  },
  historyCost: {
    marginTop: 4,
    color: '#388e3c',
    fontWeight: 'bold',
  },
  emptyHistoryText: {
    textAlign: 'center',
    color: '#999',
    padding: 32,
  },
  closeButton: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#6200ee',
  },
});
