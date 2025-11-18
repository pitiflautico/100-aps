import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, TextInput, Modal, ScrollView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Exam_Countdown_Tracker_data';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface Exam {
  id: string;
  subject: string;
  date: string;
  time: string;
  location: string;
  checklist: ChecklistItem[];
  createdAt: string;
}

export default function App() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    initializeAds();
    loadData();
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setExams(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (data: Exam[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setExams(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const addExam = () => {
    if (!subject.trim() || !date.trim()) return;

    const newExam: Exam = {
      id: Date.now().toString(),
      subject,
      date,
      time: time || '09:00',
      location: location || 'TBD',
      checklist: [
        { id: '1', text: 'Review notes', completed: false },
        { id: '2', text: 'Practice problems', completed: false },
        { id: '3', text: 'Get supplies ready', completed: false },
      ],
      createdAt: new Date().toISOString(),
    };

    const sorted = [newExam, ...exams].sort((a, b) =>
      new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()
    );

    saveData(sorted);
    setSubject('');
    setDate('');
    setTime('');
    setLocation('');
    setShowModal(false);
    showInterstitialAd();
  };

  const deleteExam = (id: string) => {
    saveData(exams.filter(e => e.id !== id));
    if (selectedExam?.id === id) setShowDetails(false);
  };

  const toggleChecklistItem = (examId: string, itemId: string) => {
    const updated = exams.map(exam => {
      if (exam.id === examId) {
        return {
          ...exam,
          checklist: exam.checklist.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          ),
        };
      }
      return exam;
    });
    saveData(updated);
    if (selectedExam?.id === examId) {
      setSelectedExam(updated.find(e => e.id === examId) || null);
    }
  };

  const getCountdown = (exam: Exam) => {
    const examDate = new Date(exam.date + ' ' + exam.time);
    const diff = examDate.getTime() - currentTime;

    if (diff < 0) return { text: 'Exam passed', urgent: false, color: colors.gray.medium };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return {
        text: `${days}d ${hours}h`,
        urgent: days <= 3,
        color: days <= 3 ? colors.status.error : colors.primary,
      };
    } else if (hours > 0) {
      return {
        text: `${hours}h ${minutes}m`,
        urgent: true,
        color: colors.status.error,
      };
    } else {
      return {
        text: `${minutes}m`,
        urgent: true,
        color: colors.status.error,
      };
    }
  };

  const renderExam = ({ item }: { item: Exam }) => {
    const countdown = getCountdown(item);
    const completedItems = item.checklist.filter(i => i.completed).length;

    return (
      <TouchableOpacity
        style={[styles.examCard, countdown.urgent && styles.examCardUrgent]}
        onPress={() => {
          setSelectedExam(item);
          setShowDetails(true);
        }}
        onLongPress={() => deleteExam(item.id)}
      >
        <View style={styles.examHeader}>
          <Text style={styles.examSubject}>{item.subject}</Text>
          <Text style={[styles.countdown, { color: countdown.color }]}>
            {countdown.text}
          </Text>
        </View>
        <View style={styles.examDetails}>
          <Text style={styles.examDate}>📅 {item.date} at {item.time}</Text>
          <Text style={styles.examLocation}>📍 {item.location}</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(completedItems / item.checklist.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Prep: {completedItems}/{item.checklist.length} completed
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Exam Tracker</Text>
        <Text style={styles.count}>{exams.length} exams</Text>
      </View>

      <FlatList
        data={exams}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No exams scheduled</Text>
            <Text style={styles.emptyHint}>Tap + to add your first exam</Text>
          </View>
        }
        renderItem={renderExam}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AdBanner />

      {/* Add Exam Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Exam</Text>
            <ScrollView>
              <Text style={styles.label}>Subject *</Text>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="e.g. Mathematics"
                autoFocus
              />
              <Text style={styles.label}>Date * (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="2025-12-31"
              />
              <Text style={styles.label}>Time (HH:MM)</Text>
              <TextInput
                style={styles.input}
                value={time}
                onChangeText={setTime}
                placeholder="09:00"
              />
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Room 101"
              />
            </ScrollView>
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.btnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnAdd]} onPress={addExam}>
                <Text style={styles.btnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Exam Details Modal */}
      <Modal visible={showDetails} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedExam && (
              <>
                <Text style={styles.modalTitle}>{selectedExam.subject}</Text>
                <View style={styles.detailsInfo}>
                  <Text style={styles.detailsDate}>
                    📅 {selectedExam.date} at {selectedExam.time}
                  </Text>
                  <Text style={styles.detailsLocation}>📍 {selectedExam.location}</Text>
                  <Text style={[styles.detailsCountdown, { color: getCountdown(selectedExam).color }]}>
                    ⏱ {getCountdown(selectedExam).text}
                  </Text>
                </View>

                <Text style={styles.checklistTitle}>Preparation Checklist:</Text>
                <ScrollView style={styles.checklist}>
                  {selectedExam.checklist.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.checklistItem}
                      onPress={() => toggleChecklistItem(selectedExam.id, item.id)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          item.completed && styles.checkboxActive,
                        ]}
                      >
                        {item.completed && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text
                        style={[
                          styles.checklistText,
                          item.completed && styles.checklistTextDone,
                        ]}
                      >
                        {item.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.buttons}>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnDelete]}
                    onPress={() => deleteExam(selectedExam.id)}
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
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.gray.light },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  count: { fontSize: 14, color: colors.gray.dark },
  list: { padding: spacing.lg, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: spacing.xl * 2 },
  emptyIcon: { fontSize: 64, marginBottom: spacing.lg },
  emptyText: { fontSize: 18, color: colors.text, fontWeight: '600', marginBottom: spacing.xs },
  emptyHint: { fontSize: 14, color: colors.gray.dark },
  examCard: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.md, elevation: 2, borderLeftWidth: 4, borderLeftColor: colors.primary },
  examCardUrgent: { borderLeftColor: colors.status.error },
  examHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  examSubject: { fontSize: 18, fontWeight: 'bold', color: colors.text, flex: 1 },
  countdown: { fontSize: 16, fontWeight: 'bold', marginLeft: spacing.sm },
  examDetails: { marginBottom: spacing.md },
  examDate: { fontSize: 14, color: colors.gray.dark, marginBottom: spacing.xs },
  examLocation: { fontSize: 14, color: colors.gray.dark },
  progressBar: { height: 6, backgroundColor: colors.gray.light, borderRadius: 3, marginTop: spacing.md, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.status.success, borderRadius: 3 },
  progressText: { fontSize: 12, color: colors.gray.dark, marginTop: spacing.xs },
  fab: { position: 'absolute', right: spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  fabText: { color: colors.white, fontSize: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, maxHeight: '85%' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: spacing.xs, marginTop: spacing.md, color: colors.text },
  input: { backgroundColor: colors.gray.light, padding: spacing.md, borderRadius: 12, fontSize: 16, marginBottom: spacing.sm },
  buttons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  btn: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  btnCancel: { backgroundColor: colors.gray.light },
  btnAdd: { backgroundColor: colors.primary },
  btnDelete: { backgroundColor: colors.status.error },
  btnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  btnTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  detailsInfo: { backgroundColor: colors.gray.light, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.lg },
  detailsDate: { fontSize: 16, marginBottom: spacing.xs, color: colors.text },
  detailsLocation: { fontSize: 16, marginBottom: spacing.xs, color: colors.text },
  detailsCountdown: { fontSize: 18, fontWeight: 'bold', marginTop: spacing.sm },
  checklistTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: spacing.md, color: colors.text },
  checklist: { maxHeight: 200, marginBottom: spacing.lg },
  checklistItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray.light },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.gray.medium, marginRight: spacing.md, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: colors.status.success, borderColor: colors.status.success },
  checkmark: { color: colors.white, fontSize: 14, fontWeight: 'bold' },
  checklistText: { flex: 1, fontSize: 15, color: colors.text },
  checklistTextDone: { textDecorationLine: 'line-through', color: colors.gray.medium },
});
