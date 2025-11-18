import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, TextInput, Modal, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Mood_Journal_Entries';

interface MoodEntry {
  id: string;
  date: string;
  mood: MoodType;
  notes: string;
  triggers: string[];
  createdAt: string;
}

type MoodType = 'Happy' | 'Sad' | 'Anxious' | 'Angry' | 'Calm' | 'Excited';
type TriggerType = 'Work' | 'Relationships' | 'Health' | 'Sleep' | 'Money' | 'Family' | 'Social' | 'Other';

const MOODS: { type: MoodType; emoji: string; color: string }[] = [
  { type: 'Happy', emoji: '😊', color: '#FFD700' },
  { type: 'Sad', emoji: '😢', color: '#4682B4' },
  { type: 'Anxious', emoji: '😰', color: '#FF6B6B' },
  { type: 'Angry', emoji: '😠', color: '#DC143C' },
  { type: 'Calm', emoji: '😌', color: '#90EE90' },
  { type: 'Excited', emoji: '🤩', color: '#FF69B4' },
];

const TRIGGERS: TriggerType[] = ['Work', 'Relationships', 'Health', 'Sleep', 'Money', 'Family', 'Social', 'Other'];

export default function App() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodType>('Happy');
  const [notes, setNotes] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'log' | 'calendar' | 'stats'>('log');
  const [adCount, setAdCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setEntries(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (data: MoodEntry[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setEntries(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers(prev =>
      prev.includes(trigger) ? prev.filter(t => t !== trigger) : [...prev, trigger]
    );
  };

  const addEntry = () => {
    const today = new Date().toISOString().split('T')[0];
    const existingToday = entries.find(e => e.date === today);

    if (existingToday) {
      Alert.alert('Entry Exists', 'You already have an entry for today. Do you want to replace it?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replace', onPress: () => replaceEntry(existingToday.id) }
      ]);
      return;
    }

    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      date: today,
      mood: selectedMood,
      notes: notes,
      triggers: selectedTriggers,
      createdAt: new Date().toISOString(),
    };

    const newEntries = [newEntry, ...entries];
    saveData(newEntries);
    resetForm();
    setShowModal(false);

    const newCount = adCount + 1;
    setAdCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const replaceEntry = (id: string) => {
    const updated = entries.map(e =>
      e.id === id ? { ...e, mood: selectedMood, notes, triggers: selectedTriggers } : e
    );
    saveData(updated);
    resetForm();
    setShowModal(false);
  };

  const deleteEntry = (id: string) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => saveData(entries.filter(e => e.id !== id)) }
    ]);
  };

  const resetForm = () => {
    setSelectedMood('Happy');
    setNotes('');
    setSelectedTriggers([]);
  };

  const getMoodData = (mood: MoodType) => MOODS.find(m => m.type === mood)!;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCalendarDates = () => {
    const last30Days: { date: string; entry?: MoodEntry }[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const entry = entries.find(e => e.date === dateStr);
      last30Days.push({ date: dateStr, entry });
    }
    return last30Days;
  };

  const getMoodStats = () => {
    const moodCounts: Record<MoodType, number> = { Happy: 0, Sad: 0, Anxious: 0, Angry: 0, Calm: 0, Excited: 0 };
    entries.forEach(e => moodCounts[e.mood]++);
    const mostCommon = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
    return { moodCounts, mostCommon: mostCommon ? mostCommon[0] as MoodType : null };
  };

  const getTriggerStats = () => {
    const triggerCounts: Record<string, number> = {};
    entries.forEach(e => {
      e.triggers.forEach(t => {
        triggerCounts[t] = (triggerCounts[t] || 0) + 1;
      });
    });
    return Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]);
  };

  const renderEntryItem = ({ item }: { item: MoodEntry }) => {
    const moodData = getMoodData(item.mood);
    return (
      <TouchableOpacity style={styles.entryCard} onLongPress={() => deleteEntry(item.id)}>
        <View style={styles.entryHeader}>
          <View style={styles.moodDisplay}>
            <Text style={styles.moodEmoji}>{moodData.emoji}</Text>
            <Text style={styles.moodText}>{item.mood}</Text>
          </View>
          <Text style={styles.entryDate}>{formatDate(item.date)}</Text>
        </View>
        {item.triggers.length > 0 && (
          <View style={styles.triggersContainer}>
            {item.triggers.map((trigger, index) => (
              <View key={index} style={styles.triggerBadge}>
                <Text style={styles.triggerText}>{trigger}</Text>
              </View>
            ))}
          </View>
        )}
        {item.notes && <Text style={styles.entryNotes}>{item.notes}</Text>}
      </TouchableOpacity>
    );
  };

  const renderCalendarView = () => {
    const calendarDates = getCalendarDates();
    return (
      <ScrollView contentContainerStyle={styles.calendarContainer}>
        <View style={styles.calendarGrid}>
          {calendarDates.map(({ date, entry }) => {
            const dayNum = new Date(date).getDate();
            return (
              <View key={date} style={[styles.calendarDay, !entry && styles.calendarDayEmpty]}>
                <Text style={styles.calendarDayNumber}>{dayNum}</Text>
                {entry && (
                  <Text style={styles.calendarDayMood}>{getMoodData(entry.mood).emoji}</Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  const renderStatsView = () => {
    const { moodCounts, mostCommon } = getMoodStats();
    const triggerStats = getTriggerStats();

    return (
      <ScrollView contentContainerStyle={styles.statsContainer}>
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Mood Patterns</Text>
          <Text style={styles.statsSummary}>Last 30 days</Text>
          {MOODS.map(mood => (
            <View key={mood.type} style={styles.moodStatRow}>
              <Text style={styles.moodStatEmoji}>{mood.emoji}</Text>
              <View style={styles.moodStatBar}>
                <View style={[styles.moodStatFill, { width: `${(moodCounts[mood.type] / entries.length) * 100}%`, backgroundColor: mood.color }]} />
              </View>
              <Text style={styles.moodStatCount}>{moodCounts[mood.type]}</Text>
            </View>
          ))}
          {mostCommon && (
            <View style={styles.mostCommonContainer}>
              <Text style={styles.mostCommonLabel}>Most Common Mood:</Text>
              <Text style={styles.mostCommonText}>{getMoodData(mostCommon).emoji} {mostCommon}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Top Triggers</Text>
          {triggerStats.slice(0, 5).map(([trigger, count]) => (
            <View key={trigger} style={styles.triggerStatRow}>
              <Text style={styles.triggerStatLabel}>{trigger}</Text>
              <Text style={styles.triggerStatCount}>{count} times</Text>
            </View>
          ))}
          {triggerStats.length === 0 && <Text style={styles.emptyText}>No triggers recorded yet</Text>}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Mood Journal</Text>
        <Text style={styles.subtitle}>{entries.length} entries</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'log' && styles.tabActive]} onPress={() => setActiveTab('log')}>
          <Text style={[styles.tabText, activeTab === 'log' && styles.tabTextActive]}>Log</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'calendar' && styles.tabActive]} onPress={() => setActiveTab('calendar')}>
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.tabTextActive]}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'stats' && styles.tabActive]} onPress={() => setActiveTab('stats')}>
          <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>Stats</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'log' && (
        <FlatList data={entries} keyExtractor={item => item.id} renderItem={renderEntryItem} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.emptyText}>No mood entries yet. Tap + to add!</Text>} />
      )}
      {activeTab === 'calendar' && renderCalendarView()}
      {activeTab === 'stats' && renderStatsView()}

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AdBanner />

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>How are you feeling?</Text>

            <Text style={styles.label}>Mood</Text>
            <View style={styles.moodGrid}>
              {MOODS.map(mood => (
                <TouchableOpacity key={mood.type} style={[styles.moodButton, selectedMood === mood.type && styles.moodButtonActive]} onPress={() => setSelectedMood(mood.type)}>
                  <Text style={styles.moodButtonEmoji}>{mood.emoji}</Text>
                  <Text style={[styles.moodButtonText, selectedMood === mood.type && styles.moodButtonTextActive]}>{mood.type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Triggers (optional)</Text>
            <View style={styles.triggersGrid}>
              {TRIGGERS.map(trigger => (
                <TouchableOpacity key={trigger} style={[styles.triggerChip, selectedTriggers.includes(trigger) && styles.triggerChipActive]} onPress={() => toggleTrigger(trigger)}>
                  <Text style={[styles.triggerChipText, selectedTriggers.includes(trigger) && styles.triggerChipTextActive]}>{trigger}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput style={styles.textArea} value={notes} onChangeText={setNotes} placeholder="What happened today?" multiline numberOfLines={4} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setShowModal(false); resetForm(); }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.addButton]} onPress={addEntry}>
                <Text style={styles.addButtonText}>Save</Text>
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
  header: { padding: spacing.lg },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  subtitle: { fontSize: 14, color: colors.gray.dark, marginTop: 4 },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 16, color: colors.gray.dark },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  entryCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  moodDisplay: { flexDirection: 'row', alignItems: 'center' },
  moodEmoji: { fontSize: 32, marginRight: spacing.sm },
  moodText: { fontSize: 18, fontWeight: '600', color: colors.text },
  entryDate: { fontSize: 14, color: colors.gray.dark },
  triggersContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  triggerBadge: { backgroundColor: colors.accent + '30', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 12 },
  triggerText: { fontSize: 12, color: colors.primary },
  entryNotes: { fontSize: 14, color: colors.gray.dark, fontStyle: 'italic' },
  emptyText: { textAlign: 'center', marginTop: spacing.xl, color: colors.gray.medium, fontSize: 16 },
  calendarContainer: { padding: spacing.lg, paddingBottom: 100 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  calendarDay: { width: '13%', aspectRatio: 1, backgroundColor: colors.white, borderRadius: 8, justifyContent: 'center', alignItems: 'center', padding: 4 },
  calendarDayEmpty: { backgroundColor: colors.gray.light },
  calendarDayNumber: { fontSize: 10, color: colors.gray.dark },
  calendarDayMood: { fontSize: 20, marginTop: 2 },
  statsContainer: { padding: spacing.lg, paddingBottom: 100 },
  statsCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.md },
  statsTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.md },
  statsSummary: { fontSize: 14, color: colors.gray.dark, marginBottom: spacing.md },
  moodStatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  moodStatEmoji: { fontSize: 24, width: 40 },
  moodStatBar: { flex: 1, height: 20, backgroundColor: colors.gray.light, borderRadius: 10, overflow: 'hidden', marginHorizontal: spacing.sm },
  moodStatFill: { height: '100%' },
  moodStatCount: { fontSize: 14, fontWeight: '600', color: colors.text, width: 30 },
  mostCommonContainer: { marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.gray.light, borderRadius: 8 },
  mostCommonLabel: { fontSize: 14, color: colors.gray.dark },
  mostCommonText: { fontSize: 18, fontWeight: 'bold', color: colors.primary, marginTop: 4 },
  triggerStatRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.gray.light },
  triggerStatLabel: { fontSize: 16, color: colors.text },
  triggerStatCount: { fontSize: 14, fontWeight: '600', color: colors.gray.dark },
  fab: { position: 'absolute', right: spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
  fabText: { color: colors.white, fontSize: 32, fontWeight: '300' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, maxHeight: '90%' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  label: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  moodButton: { width: '30%', backgroundColor: colors.gray.light, borderRadius: 12, padding: spacing.md, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  moodButtonActive: { borderColor: colors.primary, backgroundColor: colors.accent + '20' },
  moodButtonEmoji: { fontSize: 32, marginBottom: 4 },
  moodButtonText: { fontSize: 12, color: colors.gray.dark },
  moodButtonTextActive: { color: colors.primary, fontWeight: '600' },
  triggersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  triggerChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.gray.light, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  triggerChipActive: { backgroundColor: colors.accent, borderColor: colors.primary },
  triggerChipText: { fontSize: 12, color: colors.gray.dark },
  triggerChipTextActive: { color: colors.white, fontWeight: '600' },
  textArea: { backgroundColor: colors.gray.light, borderRadius: 12, padding: spacing.md, fontSize: 16, height: 100, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  modalButton: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: colors.gray.light },
  addButton: { backgroundColor: colors.primary },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: colors.text },
  addButtonText: { fontSize: 16, fontWeight: '600', color: colors.white },
});
