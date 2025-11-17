import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, TextInput, Modal, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Goal_Tracking_Dashboard_data';

type Category = 'career' | 'health' | 'personal' | 'financial';

interface Milestone {
  id: string;
  text: string;
  completed: boolean;
}

interface Goal {
  id: string;
  title: string;
  category: Category;
  progress: number;
  targetDate: string;
  milestones: Milestone[];
  createdAt: string;
}

const CATEGORIES = {
  career: { name: 'Career', color: '#8B5CF6', icon: '💼' },
  health: { name: 'Health', color: '#10B981', icon: '💪' },
  personal: { name: 'Personal', color: '#3B82F6', icon: '🎯' },
  financial: { name: 'Financial', color: '#F59E0B', icon: '💰' },
};

export default function App() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('personal');
  const [targetDate, setTargetDate] = useState('');

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setGoals(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (data: Goal[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setGoals(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const addGoal = () => {
    if (!title.trim()) return;

    const newGoal: Goal = {
      id: Date.now().toString(),
      title,
      category,
      progress: 0,
      targetDate: targetDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      milestones: [
        { id: '1', text: 'Start', completed: false },
        { id: '2', text: 'Midway progress', completed: false },
        { id: '3', text: 'Final sprint', completed: false },
      ],
      createdAt: new Date().toISOString(),
    };

    saveData([...goals, newGoal]);
    setTitle('');
    setTargetDate('');
    setShowModal(false);
    showInterstitialAd();
  };

  const updateProgress = (id: string, newProgress: number) => {
    const updated = goals.map(g =>
      g.id === id ? { ...g, progress: Math.min(100, Math.max(0, newProgress)) } : g
    );
    saveData(updated);
    if (selectedGoal?.id === id) {
      setSelectedGoal(updated.find(g => g.id === id) || null);
    }
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    const updated = goals.map(goal => {
      if (goal.id === goalId) {
        return {
          ...goal,
          milestones: goal.milestones.map(m =>
            m.id === milestoneId ? { ...m, completed: !m.completed } : m
          ),
        };
      }
      return goal;
    });
    saveData(updated);
    if (selectedGoal?.id === goalId) {
      setSelectedGoal(updated.find(g => g.id === goalId) || null);
    }
  };

  const deleteGoal = (id: string) => {
    Alert.alert('Delete Goal?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          saveData(goals.filter(g => g.id !== id));
          if (selectedGoal?.id === id) setShowDetails(false);
        },
      },
    ]);
  };

  const renderGoal = ({ item }: { item: Goal }) => {
    const cat = CATEGORIES[item.category];
    const completedMilestones = item.milestones.filter(m => m.completed).length;
    const daysUntil = Math.ceil((new Date(item.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return (
      <TouchableOpacity
        style={[styles.goalCard, { borderLeftColor: cat.color }]}
        onPress={() => {
          setSelectedGoal(item);
          setShowDetails(true);
        }}
        onLongPress={() => deleteGoal(item.id)}
      >
        <View style={styles.goalHeader}>
          <View style={styles.goalTitleRow}>
            <Text style={styles.goalIcon}>{cat.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.goalTitle}>{item.title}</Text>
              <Text style={styles.goalCategory}>{cat.name}</Text>
            </View>
          </View>
          <Text style={styles.goalProgress}>{item.progress}%</Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${item.progress}%`, backgroundColor: cat.color },
              ]}
            />
          </View>
        </View>

        <View style={styles.goalFooter}>
          <Text style={styles.goalMilestones}>
            Milestones: {completedMilestones}/{item.milestones.length}
          </Text>
          <Text style={styles.goalDate}>
            {daysUntil > 0 ? `${daysUntil}d left` : 'Overdue'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const activeGoals = goals.filter(g => g.progress < 100).length;
  const completedGoals = goals.filter(g => g.progress >= 100).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Goals</Text>
        <View style={styles.stats}>
          <Text style={styles.statText}>{activeGoals} Active</Text>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.statText}>{completedGoals} Done</Text>
        </View>
      </View>

      <FlatList
        data={goals}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyText}>No goals yet</Text>
          </View>
        }
        renderItem={renderGoal}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AdBanner />

      {/* Add Goal Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Goal</Text>
            <Text style={styles.label}>Goal Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Run a marathon"
              autoFocus
            />
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryRow}>
              {(Object.keys(CATEGORIES) as Category[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryBtn,
                    category === cat && {
                      backgroundColor: CATEGORIES[cat].color,
                      borderColor: CATEGORIES[cat].color,
                    },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={styles.categoryIcon}>{CATEGORIES[cat].icon}</Text>
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat && styles.categoryTextActive,
                    ]}
                  >
                    {CATEGORIES[cat].name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Target Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={targetDate}
              onChangeText={setTargetDate}
              placeholder="2025-12-31"
            />
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.btnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnAdd]} onPress={addGoal}>
                <Text style={styles.btnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Goal Details Modal */}
      <Modal visible={showDetails} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedGoal && (
              <ScrollView>
                <Text style={styles.modalTitle}>{selectedGoal.title}</Text>
                <View style={[styles.categoryBadge, { backgroundColor: CATEGORIES[selectedGoal.category].color }]}>
                  <Text style={styles.categoryBadgeText}>
                    {CATEGORIES[selectedGoal.category].icon} {CATEGORIES[selectedGoal.category].name}
                  </Text>
                </View>

                <Text style={styles.sectionTitle}>Progress: {selectedGoal.progress}%</Text>
                <View style={styles.progressControls}>
                  <TouchableOpacity
                    style={styles.progressBtn}
                    onPress={() => updateProgress(selectedGoal.id, selectedGoal.progress - 10)}
                  >
                    <Text style={styles.progressBtnText}>-10%</Text>
                  </TouchableOpacity>
                  <View style={styles.progressBarLarge}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${selectedGoal.progress}%`,
                          backgroundColor: CATEGORIES[selectedGoal.category].color,
                        },
                      ]}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.progressBtn}
                    onPress={() => updateProgress(selectedGoal.id, selectedGoal.progress + 10)}
                  >
                    <Text style={styles.progressBtnText}>+10%</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Milestones</Text>
                {selectedGoal.milestones.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.milestoneItem}
                    onPress={() => toggleMilestone(selectedGoal.id, m.id)}
                  >
                    <View style={[styles.checkbox, m.completed && styles.checkboxActive]}>
                      {m.completed && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={[styles.milestoneText, m.completed && styles.milestoneTextDone]}>
                      {m.text}
                    </Text>
                  </TouchableOpacity>
                ))}

                <View style={styles.buttons}>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnDelete]}
                    onPress={() => deleteGoal(selectedGoal.id)}
                  >
                    <Text style={styles.btnText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnAdd]}
                    onPress={() => setShowDetails(false)}
                  >
                    <Text style={styles.btnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray.light },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xs },
  stats: { flexDirection: 'row', alignItems: 'center' },
  statText: { fontSize: 14, color: colors.gray.dark },
  statDivider: { marginHorizontal: spacing.sm, color: colors.gray.medium },
  list: { padding: spacing.lg, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: spacing.xl * 2 },
  emptyIcon: { fontSize: 64, marginBottom: spacing.lg },
  emptyText: { fontSize: 18, color: colors.text, fontWeight: '600' },
  goalCard: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.md, elevation: 2, borderLeftWidth: 4 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  goalTitleRow: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  goalIcon: { fontSize: 24, marginRight: spacing.sm },
  goalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  goalCategory: { fontSize: 12, color: colors.gray.dark, marginTop: spacing.xs },
  goalProgress: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  progressBarContainer: { marginBottom: spacing.md },
  progressBar: { height: 8, backgroundColor: colors.gray.light, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  goalMilestones: { fontSize: 12, color: colors.gray.dark },
  goalDate: { fontSize: 12, color: colors.gray.dark },
  fab: { position: 'absolute', right: spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  fabText: { color: colors.white, fontSize: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, maxHeight: '85%' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: spacing.xs, marginTop: spacing.md, color: colors.text },
  input: { backgroundColor: colors.gray.light, padding: spacing.md, borderRadius: 12, fontSize: 16, marginBottom: spacing.sm },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  categoryBtn: { width: '48%', backgroundColor: colors.gray.light, borderRadius: 12, padding: spacing.md, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  categoryIcon: { fontSize: 24, marginBottom: spacing.xs },
  categoryText: { fontSize: 12, fontWeight: '600', color: colors.text },
  categoryTextActive: { color: colors.white },
  buttons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  btn: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  btnCancel: { backgroundColor: colors.gray.light },
  btnAdd: { backgroundColor: colors.primary },
  btnDelete: { backgroundColor: colors.status.error },
  btnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  btnTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 20, marginBottom: spacing.lg },
  categoryBadgeText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: spacing.md, color: colors.text },
  progressControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  progressBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8 },
  progressBtnText: { color: colors.white, fontSize: 12, fontWeight: 'bold' },
  progressBarLarge: { flex: 1, height: 12, backgroundColor: colors.gray.light, borderRadius: 6, overflow: 'hidden' },
  milestoneItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray.light },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.gray.medium, marginRight: spacing.md, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: colors.status.success, borderColor: colors.status.success },
  checkmark: { color: colors.white, fontSize: 14, fontWeight: 'bold' },
  milestoneText: { flex: 1, fontSize: 15, color: colors.text },
  milestoneTextDone: { textDecorationLine: 'line-through', color: colors.gray.medium },
});
