import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Modal,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@House_Cleaning_Schedule_data';

type Frequency = 'Daily' | 'Weekly' | 'Bi-weekly' | 'Monthly';

interface Task {
  id: string;
  name: string;
  room: string;
  frequency: Frequency;
  lastCleaned: string | null;
  createdAt: string;
}

const ROOMS = ['Kitchen', 'Bathroom', 'Bedroom', 'Living Room', 'Dining Room', 'Office', 'Garage', 'Laundry'];
const COMMON_TASKS = [
  { name: 'Mop Floor', rooms: ['Kitchen', 'Bathroom', 'Laundry'] },
  { name: 'Vacuum', rooms: ['Bedroom', 'Living Room', 'Dining Room', 'Office'] },
  { name: 'Dust Surfaces', rooms: ['All'] },
  { name: 'Clean Windows', rooms: ['All'] },
  { name: 'Wipe Counters', rooms: ['Kitchen', 'Bathroom'] },
  { name: 'Clean Toilet', rooms: ['Bathroom'] },
  { name: 'Change Sheets', rooms: ['Bedroom'] },
  { name: 'Empty Trash', rooms: ['All'] },
  { name: 'Organize', rooms: ['All'] },
  { name: 'Deep Clean', rooms: ['All'] },
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>('Kitchen');
  const [selectedFrequency, setSelectedFrequency] = useState<Frequency>('Weekly');
  const [actionCount, setActionCount] = useState(0);
  const [filterRoom, setFilterRoom] = useState<string>('All');

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setTasks(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (newTasks: Task[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
      setTasks(newTasks);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const addTask = (taskName: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      name: taskName,
      room: selectedRoom,
      frequency: selectedFrequency,
      lastCleaned: null,
      createdAt: new Date().toISOString(),
    };

    saveData([...tasks, newTask]);
    setShowAddModal(false);

    const newCount = actionCount + 1;
    setActionCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const markAsDone = (taskId: string) => {
    const updated = tasks.map(task =>
      task.id === taskId
        ? { ...task, lastCleaned: new Date().toISOString() }
        : task
    );
    saveData(updated);

    const newCount = actionCount + 1;
    setActionCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const deleteTask = (taskId: string) => {
    saveData(tasks.filter(t => t.id !== taskId));
  };

  const resetAllTasks = () => {
    const updated = tasks.map(task => ({
      ...task,
      lastCleaned: null,
    }));
    saveData(updated);
  };

  const getDaysSinceLastCleaned = (task: Task): number | null => {
    if (!task.lastCleaned) return null;
    const lastCleaned = new Date(task.lastCleaned);
    const now = new Date();
    const diffTime = now.getTime() - lastCleaned.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const isOverdue = (task: Task): boolean => {
    const days = getDaysSinceLastCleaned(task);
    if (days === null) return true;

    switch (task.frequency) {
      case 'Daily': return days >= 1;
      case 'Weekly': return days >= 7;
      case 'Bi-weekly': return days >= 14;
      case 'Monthly': return days >= 30;
      default: return false;
    }
  };

  const getProgress = (period: 'week' | 'month'): number => {
    const now = new Date();
    const relevantTasks = tasks.filter(task => {
      if (period === 'week') {
        return task.frequency === 'Daily' || task.frequency === 'Weekly';
      } else {
        return true;
      }
    });

    if (relevantTasks.length === 0) return 0;

    const completedTasks = relevantTasks.filter(task => {
      if (!task.lastCleaned) return false;
      const lastCleaned = new Date(task.lastCleaned);
      const diffDays = (now.getTime() - lastCleaned.getTime()) / (1000 * 60 * 60 * 24);

      if (period === 'week') {
        return diffDays <= 7;
      } else {
        return diffDays <= 30;
      }
    });

    return (completedTasks.length / relevantTasks.length) * 100;
  };

  const formatLastCleaned = (date: string | null): string => {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diffTime = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredTasks = filterRoom === 'All'
    ? tasks
    : tasks.filter(t => t.room === filterRoom);

  const weekProgress = getProgress('week');
  const monthProgress = getProgress('month');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>Cleaning Schedule</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Progress Section */}
        <View style={styles.progressContainer}>
          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>This Week</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${weekProgress}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{weekProgress.toFixed(0)}%</Text>
          </View>
          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>This Month</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${monthProgress}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{monthProgress.toFixed(0)}%</Text>
          </View>
        </View>

        {/* Room Filter */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, filterRoom === 'All' && styles.filterChipActive]}
              onPress={() => setFilterRoom('All')}
            >
              <Text style={[styles.filterChipText, filterRoom === 'All' && styles.filterChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {ROOMS.map(room => (
              <TouchableOpacity
                key={room}
                style={[styles.filterChip, filterRoom === room && styles.filterChipActive]}
                onPress={() => setFilterRoom(room)}
              >
                <Text style={[styles.filterChipText, filterRoom === room && styles.filterChipTextActive]}>
                  {room}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tasks List */}
        <View style={styles.section}>
          {filteredTasks.length === 0 ? (
            <Text style={styles.emptyText}>No cleaning tasks yet</Text>
          ) : (
            <FlatList
              data={filteredTasks.sort((a, b) => {
                const aOverdue = isOverdue(a);
                const bOverdue = isOverdue(b);
                if (aOverdue && !bOverdue) return -1;
                if (!aOverdue && bOverdue) return 1;
                return 0;
              })}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const overdue = isOverdue(item);
                const daysSince = getDaysSinceLastCleaned(item);

                return (
                  <TouchableOpacity
                    style={[styles.taskCard, overdue && styles.taskCardOverdue]}
                    onLongPress={() => deleteTask(item.id)}
                  >
                    <View style={styles.taskHeader}>
                      <View style={styles.taskInfo}>
                        <Text style={styles.taskName}>{item.name}</Text>
                        <View style={styles.taskMeta}>
                          <Text style={styles.taskRoom}>{item.room}</Text>
                          <Text style={styles.taskSeparator}>•</Text>
                          <Text style={styles.taskFrequency}>{item.frequency}</Text>
                        </View>
                      </View>
                      {overdue && (
                        <View style={styles.overdueBadge}>
                          <Text style={styles.overdueText}>Due!</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.taskFooter}>
                      <Text style={styles.lastCleanedText}>
                        Last cleaned: {formatLastCleaned(item.lastCleaned)}
                      </Text>
                      <TouchableOpacity
                        style={styles.doneButton}
                        onPress={() => markAsDone(item.id)}
                      >
                        <Text style={styles.doneButtonText}>Mark Done</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={resetAllTasks}>
          <Text style={styles.resetButtonText}>Reset All Tasks</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AdBanner />

      {/* Add Task Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Cleaning Task</Text>

            <ScrollView>
              <Text style={styles.inputLabel}>Select Room</Text>
              <View style={styles.roomGrid}>
                {ROOMS.map(room => (
                  <TouchableOpacity
                    key={room}
                    style={[
                      styles.roomButton,
                      selectedRoom === room && styles.roomButtonActive
                    ]}
                    onPress={() => setSelectedRoom(room)}
                  >
                    <Text style={[
                      styles.roomButtonText,
                      selectedRoom === room && styles.roomButtonTextActive
                    ]}>
                      {room}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Frequency</Text>
              <View style={styles.frequencyButtons}>
                {(['Daily', 'Weekly', 'Bi-weekly', 'Monthly'] as Frequency[]).map(freq => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.frequencyButton,
                      selectedFrequency === freq && styles.frequencyButtonActive
                    ]}
                    onPress={() => setSelectedFrequency(freq)}
                  >
                    <Text style={[
                      styles.frequencyButtonText,
                      selectedFrequency === freq && styles.frequencyButtonTextActive
                    ]}>
                      {freq}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Select Task</Text>
              <View style={styles.taskButtons}>
                {COMMON_TASKS
                  .filter(t => t.rooms.includes('All') || t.rooms.includes(selectedRoom))
                  .map(task => (
                    <TouchableOpacity
                      key={task.name}
                      style={styles.taskButton}
                      onPress={() => addTask(task.name)}
                    >
                      <Text style={styles.taskButtonText}>{task.name}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  progressCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.gray.dark,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray.light,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
  },
  filterContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.gray.light,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.white,
  },
  section: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.gray.medium,
    fontSize: 16,
    marginTop: spacing.xl,
  },
  taskCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  taskCardOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: colors.status.error,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskRoom: {
    fontSize: 14,
    color: colors.gray.dark,
  },
  taskSeparator: {
    fontSize: 14,
    color: colors.gray.medium,
    marginHorizontal: spacing.sm,
  },
  taskFrequency: {
    fontSize: 14,
    color: colors.gray.dark,
  },
  overdueBadge: {
    backgroundColor: colors.status.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  overdueText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  lastCleanedText: {
    fontSize: 12,
    color: colors.gray.medium,
  },
  doneButton: {
    backgroundColor: colors.status.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  doneButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    margin: spacing.md,
    marginBottom: 100,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.gray.light,
    alignItems: 'center',
  },
  resetButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
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
  fabText: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '300',
  },
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
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  roomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  roomButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.gray.light,
    minWidth: '30%',
    alignItems: 'center',
  },
  roomButtonActive: {
    backgroundColor: colors.primary,
  },
  roomButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  roomButtonTextActive: {
    color: colors.white,
  },
  frequencyButtons: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  frequencyButton: {
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.gray.light,
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: colors.primary,
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  frequencyButtonTextActive: {
    color: colors.white,
  },
  taskButtons: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  taskButton: {
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.gray.light,
    alignItems: 'center',
  },
  taskButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
