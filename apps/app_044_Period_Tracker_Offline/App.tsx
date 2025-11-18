import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  Share,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@period_tracker_data';

interface PeriodEntry {
  id: string;
  startDate: string;
  endDate: string | null;
  flow: string;
  symptoms: string[];
  notes: string;
}

const SYMPTOMS = [
  { id: 'cramps', name: 'Cramps', icon: '😣' },
  { id: 'bloating', name: 'Bloating', icon: '🎈' },
  { id: 'headache', name: 'Headache', icon: '🤕' },
  { id: 'mood', name: 'Mood Swings', icon: '😢' },
  { id: 'fatigue', name: 'Fatigue', icon: '😴' },
  { id: 'backpain', name: 'Back Pain', icon: '🔙' },
  { id: 'acne', name: 'Acne', icon: '😖' },
  { id: 'tenderness', name: 'Breast Tenderness', icon: '💢' },
];

const FLOW_LEVELS = [
  { id: 'spotting', name: 'Spotting', icon: '💧', color: '#FFB6C1' },
  { id: 'light', name: 'Light', icon: '💧💧', color: '#FF69B4' },
  { id: 'medium', name: 'Medium', icon: '💧💧💧', color: '#FF1493' },
  { id: 'heavy', name: 'Heavy', icon: '💧💧💧💧', color: '#DC143C' },
];

export default function App() {
  const [periods, setPeriods] = useState<PeriodEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodEntry | null>(null);
  const [interactionCount, setInteractionCount] = useState(0);
  const [currentPeriod, setCurrentPeriod] = useState<PeriodEntry | null>(null);

  // Form fields
  const [selectedFlow, setSelectedFlow] = useState('medium');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  useEffect(() => {
    if (interactionCount > 0 && interactionCount % 7 === 0) {
      showInterstitialAd();
    }
  }, [interactionCount]);

  useEffect(() => {
    // Check if there's an active period
    const active = periods.find(p => p.endDate === null);
    setCurrentPeriod(active || null);
  }, [periods]);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPeriods(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (data: PeriodEntry[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setPeriods(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const startPeriod = () => {
    const newPeriod: PeriodEntry = {
      id: Date.now().toString(),
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
      flow: selectedFlow,
      symptoms: selectedSymptoms,
      notes,
    };

    saveData([newPeriod, ...periods]);
    resetForm();
    setShowAddModal(false);
    setInteractionCount(prev => prev + 1);
  };

  const endPeriod = () => {
    if (!currentPeriod) return;

    const updatedPeriods = periods.map(p =>
      p.id === currentPeriod.id
        ? { ...p, endDate: new Date().toISOString().split('T')[0] }
        : p
    );

    saveData(updatedPeriods);
    setInteractionCount(prev => prev + 1);
  };

  const updatePeriodDay = () => {
    if (!currentPeriod) return;

    const updatedPeriods = periods.map(p =>
      p.id === currentPeriod.id
        ? { ...p, flow: selectedFlow, symptoms: selectedSymptoms, notes }
        : p
    );

    saveData(updatedPeriods);
    resetForm();
    setShowAddModal(false);
    setInteractionCount(prev => prev + 1);
  };

  const deletePeriod = (id: string) => {
    saveData(periods.filter(p => p.id !== id));
    setShowDetailModal(false);
  };

  const resetForm = () => {
    setSelectedFlow('medium');
    setSelectedSymptoms([]);
    setNotes('');
  };

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptomId)
        ? prev.filter(s => s !== symptomId)
        : [...prev, symptomId]
    );
  };

  const getSymptomName = (id: string) => SYMPTOMS.find(s => s.id === id)?.name || id;
  const getSymptomIcon = (id: string) => SYMPTOMS.find(s => s.id === id)?.icon || '•';
  const getFlowName = (id: string) => FLOW_LEVELS.find(f => f.id === id)?.name || id;
  const getFlowIcon = (id: string) => FLOW_LEVELS.find(f => f.id === id)?.icon || '💧';
  const getFlowColor = (id: string) => FLOW_LEVELS.find(f => f.id === id)?.color || colors.primary;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPeriodDuration = (period: PeriodEntry) => {
    if (!period.endDate) {
      const start = new Date(period.startDate);
      const today = new Date();
      const days = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return `${days} day${days !== 1 ? 's' : ''} (ongoing)`;
    }
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  const getCycleLength = () => {
    if (periods.length < 2) return 0;
    const completedPeriods = periods.filter(p => p.endDate !== null);
    if (completedPeriods.length < 2) return 0;

    let totalDays = 0;
    for (let i = 0; i < completedPeriods.length - 1; i++) {
      const current = new Date(completedPeriods[i].startDate);
      const next = new Date(completedPeriods[i + 1].startDate);
      const days = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
      totalDays += days;
    }
    return Math.round(totalDays / (completedPeriods.length - 1));
  };

  const getAverageDuration = () => {
    const completedPeriods = periods.filter(p => p.endDate !== null);
    if (completedPeriods.length === 0) return 0;

    let totalDays = 0;
    completedPeriods.forEach(p => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate!);
      const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      totalDays += days;
    });
    return Math.round(totalDays / completedPeriods.length);
  };

  const predictNextPeriod = () => {
    const cycleLength = getCycleLength();
    if (cycleLength === 0 || periods.length === 0) return 'Not enough data';

    const lastPeriod = periods[0];
    const lastStart = new Date(lastPeriod.startDate);
    const nextDate = new Date(lastStart.getTime() + cycleLength * 24 * 60 * 60 * 1000);

    const today = new Date();
    const daysUntil = Math.floor((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return 'Overdue';
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    return `in ${daysUntil} days`;
  };

  const exportData = async () => {
    if (periods.length === 0) return;

    const exportText = periods
      .map(period => {
        const duration = getPeriodDuration(period);
        const symps = period.symptoms.map(s => getSymptomName(s)).join(', ');
        return `Start: ${formatDate(period.startDate)}\nEnd: ${period.endDate ? formatDate(period.endDate) : 'Ongoing'}\nDuration: ${duration}\nFlow: ${getFlowName(period.flow)}\nSymptoms: ${symps || 'None'}\nNotes: ${period.notes || 'None'}\n---`;
      })
      .join('\n\n');

    const cycleLength = getCycleLength();
    const avgDuration = getAverageDuration();

    try {
      await Share.share({
        message: `Period Tracker Export\n\nTotal Periods: ${periods.length}\nAvg Cycle Length: ${cycleLength} days\nAvg Period Duration: ${avgDuration} days\nNext Period: ${predictNextPeriod()}\n\n${exportText}`,
        title: 'Period Tracker Data',
      });
      setInteractionCount(prev => prev + 1);
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const viewPeriodDetails = (period: PeriodEntry) => {
    setSelectedPeriod(period);
    setShowDetailModal(true);
  };

  const cycleLength = getCycleLength();
  const avgDuration = getAverageDuration();
  const nextPeriod = predictNextPeriod();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Period Tracker</Text>
        {periods.length > 0 && (
          <TouchableOpacity onPress={exportData} style={styles.exportBtn}>
            <Text style={styles.exportIcon}>📤</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Current Status Card */}
      <View style={styles.statusCard}>
        {currentPeriod ? (
          <>
            <Text style={styles.statusTitle}>Period In Progress</Text>
            <Text style={styles.statusDay}>{getPeriodDuration(currentPeriod)}</Text>
            <Text style={styles.statusSubtitle}>Started {formatDate(currentPeriod.startDate)}</Text>
            <TouchableOpacity style={styles.endButton} onPress={endPeriod}>
              <Text style={styles.endButtonText}>End Period</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={() => {
                setSelectedFlow(currentPeriod.flow);
                setSelectedSymptoms(currentPeriod.symptoms);
                setNotes(currentPeriod.notes);
                setShowAddModal(true);
              }}
            >
              <Text style={styles.updateButtonText}>Update Today's Symptoms</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.statusTitle}>No Active Period</Text>
            {periods.length > 0 && cycleLength > 0 && (
              <>
                <Text style={styles.statusSubtitle}>Next period expected:</Text>
                <Text style={styles.statusDay}>{nextPeriod}</Text>
              </>
            )}
            <TouchableOpacity style={styles.startButton} onPress={() => setShowAddModal(true)}>
              <Text style={styles.startButtonText}>Start Period</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Stats */}
      {periods.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{periods.length}</Text>
            <Text style={styles.statLabel}>Total Periods</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{cycleLength || '—'}</Text>
            <Text style={styles.statLabel}>Avg Cycle (days)</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{avgDuration || '—'}</Text>
            <Text style={styles.statLabel}>Avg Duration (days)</Text>
          </View>
        </View>
      )}

      {/* History */}
      <ScrollView contentContainerStyle={styles.content}>
        {periods.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>No periods tracked yet</Text>
            <Text style={styles.emptySubtext}>Tap the button above to start tracking</Text>
          </View>
        )}

        {periods.length > 0 && <Text style={styles.historyTitle}>History</Text>}

        {periods.map(period => (
          <TouchableOpacity
            key={period.id}
            style={[styles.periodCard, !period.endDate && styles.periodCardActive]}
            onPress={() => viewPeriodDetails(period)}
          >
            <View style={styles.periodHeader}>
              <View>
                <Text style={styles.periodDate}>{formatDate(period.startDate)}</Text>
                {period.endDate && (
                  <Text style={styles.periodEndDate}>to {formatDate(period.endDate)}</Text>
                )}
              </View>
              <View style={[styles.flowBadge, { backgroundColor: getFlowColor(period.flow) }]}>
                <Text style={styles.flowBadgeText}>{getFlowIcon(period.flow)}</Text>
              </View>
            </View>

            <View style={styles.periodDetails}>
              <Text style={styles.periodDuration}>{getPeriodDuration(period)}</Text>
              {period.symptoms.length > 0 && (
                <Text style={styles.periodSymptoms} numberOfLines={1}>
                  {period.symptoms.map(s => getSymptomIcon(s)).join(' ')}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <AdBanner />

      {/* Add/Update Modal */}
      <Modal visible={showAddModal} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {currentPeriod ? 'Update Period Day' : 'Start New Period'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Flow Level */}
            <Text style={styles.sectionTitle}>Flow Level</Text>
            <View style={styles.flowGrid}>
              {FLOW_LEVELS.map(flow => (
                <TouchableOpacity
                  key={flow.id}
                  style={[
                    styles.flowBtn,
                    selectedFlow === flow.id && [styles.flowBtnActive, { borderColor: flow.color }],
                  ]}
                  onPress={() => setSelectedFlow(flow.id)}
                >
                  <Text style={styles.flowBtnIcon}>{flow.icon}</Text>
                  <Text
                    style={[styles.flowBtnText, selectedFlow === flow.id && { color: flow.color }]}
                  >
                    {flow.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Symptoms */}
            <Text style={styles.sectionTitle}>Symptoms</Text>
            <View style={styles.symptomsGrid}>
              {SYMPTOMS.map(symptom => (
                <TouchableOpacity
                  key={symptom.id}
                  style={[
                    styles.symptomBtn,
                    selectedSymptoms.includes(symptom.id) && styles.symptomBtnActive,
                  ]}
                  onPress={() => toggleSymptom(symptom.id)}
                >
                  <Text style={styles.symptomIcon}>{symptom.icon}</Text>
                  <Text
                    style={[
                      styles.symptomText,
                      selectedSymptoms.includes(symptom.id) && styles.symptomTextActive,
                    ]}
                  >
                    {symptom.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={currentPeriod ? updatePeriodDay : startPeriod}
            >
              <Text style={styles.saveButtonText}>
                {currentPeriod ? 'Update Day' : 'Start Period'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.detailOverlay}>
          <View style={styles.detailContent}>
            {selectedPeriod && (
              <ScrollView>
                <View style={styles.detailHeader}>
                  <View>
                    <Text style={styles.detailTitle}>Period Details</Text>
                    <Text style={styles.detailDate}>
                      {formatDate(selectedPeriod.startDate)}
                      {selectedPeriod.endDate && ` - ${formatDate(selectedPeriod.endDate)}`}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>{getPeriodDuration(selectedPeriod)}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Flow Level</Text>
                  <View style={styles.detailFlowRow}>
                    <Text style={styles.detailFlowIcon}>{getFlowIcon(selectedPeriod.flow)}</Text>
                    <Text style={styles.detailValue}>{getFlowName(selectedPeriod.flow)}</Text>
                  </View>
                </View>

                {selectedPeriod.symptoms.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Symptoms</Text>
                    <View style={styles.detailSymptoms}>
                      {selectedPeriod.symptoms.map(symptomId => (
                        <View key={symptomId} style={styles.detailSymptomTag}>
                          <Text style={styles.detailSymptomText}>
                            {getSymptomIcon(symptomId)} {getSymptomName(symptomId)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {selectedPeriod.notes && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Notes</Text>
                    <Text style={styles.detailValue}>{selectedPeriod.notes}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deletePeriod(selectedPeriod.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete Period</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray.light },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.white },
  title: { fontSize: 28, fontWeight: 'bold', color: '#DC143C' },
  exportBtn: { padding: spacing.sm },
  exportIcon: { fontSize: 24 },
  statusCard: { backgroundColor: colors.white, marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: 16, padding: spacing.xl, alignItems: 'center' },
  statusTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  statusDay: { fontSize: 36, fontWeight: 'bold', color: '#DC143C', marginVertical: spacing.sm },
  statusSubtitle: { fontSize: 14, color: colors.gray.dark, marginBottom: spacing.lg },
  startButton: { backgroundColor: '#DC143C', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 12, marginTop: spacing.md },
  startButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  endButton: { backgroundColor: colors.status.error, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 12, marginTop: spacing.sm },
  endButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  updateButton: { backgroundColor: colors.gray.light, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 8, marginTop: spacing.md },
  updateButtonText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  statsContainer: { flexDirection: 'row', backgroundColor: colors.white, marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: 12, padding: spacing.md, gap: spacing.md },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#DC143C' },
  statLabel: { fontSize: 11, color: colors.gray.dark, marginTop: spacing.xs, textAlign: 'center' },
  content: { padding: spacing.lg, paddingBottom: 100 },
  emptyState: { alignItems: 'center', marginTop: spacing['3xl'] },
  emptyIcon: { fontSize: 64, marginBottom: spacing.lg },
  emptyText: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  emptySubtext: { fontSize: 14, color: colors.gray.dark, textAlign: 'center' },
  historyTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  periodCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  periodCardActive: { borderWidth: 2, borderColor: '#DC143C' },
  periodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  periodDate: { fontSize: 16, fontWeight: '600', color: colors.text },
  periodEndDate: { fontSize: 12, color: colors.gray.dark, marginTop: spacing.xs },
  flowBadge: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  flowBadgeText: { fontSize: 20 },
  periodDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  periodDuration: { fontSize: 14, color: colors.gray.dark, fontWeight: '600' },
  periodSymptoms: { fontSize: 16 },
  modalContainer: { flex: 1, backgroundColor: colors.gray.light },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray.light },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#DC143C' },
  modalClose: { fontSize: 28, color: colors.gray.dark, fontWeight: '300' },
  modalContent: { padding: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.md, marginTop: spacing.md },
  flowGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  flowBtn: { flex: 1, minWidth: '45%', backgroundColor: colors.white, padding: spacing.lg, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: colors.gray.light },
  flowBtnActive: { borderWidth: 3 },
  flowBtnIcon: { fontSize: 32, marginBottom: spacing.sm },
  flowBtnText: { fontSize: 14, color: colors.gray.dark, fontWeight: '600' },
  symptomsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  symptomBtn: { flex: 1, minWidth: '30%', backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: colors.gray.light },
  symptomBtnActive: { borderColor: '#DC143C', backgroundColor: '#DC143C' + '10' },
  symptomIcon: { fontSize: 24, marginBottom: spacing.sm },
  symptomText: { fontSize: 12, color: colors.gray.dark, fontWeight: '600', textAlign: 'center' },
  symptomTextActive: { color: '#DC143C' },
  notesInput: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, fontSize: 16, minHeight: 80, borderWidth: 1, borderColor: colors.gray.light, textAlignVertical: 'top' },
  saveButton: { backgroundColor: '#DC143C', padding: spacing.lg, borderRadius: 12, alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl },
  saveButtonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  detailContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, maxHeight: '80%' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  detailTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  detailDate: { fontSize: 14, color: colors.gray.dark, marginTop: spacing.xs },
  detailSection: { marginBottom: spacing.lg },
  detailLabel: { fontSize: 14, fontWeight: '600', color: colors.gray.dark, marginBottom: spacing.sm, textTransform: 'uppercase' },
  detailValue: { fontSize: 16, color: colors.text, lineHeight: 24 },
  detailFlowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailFlowIcon: { fontSize: 24 },
  detailSymptoms: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  detailSymptomTag: { backgroundColor: colors.gray.light, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8 },
  detailSymptomText: { fontSize: 14, color: colors.gray.dark },
  deleteButton: { backgroundColor: colors.status.error, padding: spacing.lg, borderRadius: 12, alignItems: 'center', marginTop: spacing.md },
  deleteButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
