import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Modal,
  Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@headache_tracker_data';

interface HeadacheEntry {
  id: string;
  date: string;
  time: string;
  duration: number; // minutes
  intensity: number; // 1-10
  type: string;
  location: string[];
  triggers: string[];
  symptoms: string[];
  medication: string;
  notes: string;
}

const HEADACHE_TYPES = [
  { id: 'migraine', name: 'Migraine', icon: '⚡' },
  { id: 'tension', name: 'Tension', icon: '🔄' },
  { id: 'cluster', name: 'Cluster', icon: '💥' },
  { id: 'sinus', name: 'Sinus', icon: '🌡️' },
  { id: 'hormone', name: 'Hormonal', icon: '🔬' },
  { id: 'other', name: 'Other', icon: '❓' },
];

const LOCATIONS = [
  { id: 'forehead', name: 'Forehead', icon: '🔸' },
  { id: 'temples', name: 'Temples', icon: '🔹' },
  { id: 'back', name: 'Back of Head', icon: '🔺' },
  { id: 'top', name: 'Top of Head', icon: '⬆️' },
  { id: 'eyes', name: 'Behind Eyes', icon: '👁️' },
  { id: 'bilateral', name: 'Both Sides', icon: '↔️' },
];

const TRIGGERS = [
  { id: 'stress', name: 'Stress', icon: '😰' },
  { id: 'food', name: 'Food', icon: '🍽️' },
  { id: 'sleep', name: 'Lack of Sleep', icon: '😴' },
  { id: 'weather', name: 'Weather', icon: '🌤️' },
  { id: 'screen', name: 'Screen Time', icon: '📱' },
  { id: 'caffeine', name: 'Caffeine', icon: '☕' },
  { id: 'alcohol', name: 'Alcohol', icon: '🍷' },
  { id: 'noise', name: 'Loud Noise', icon: '🔊' },
];

const SYMPTOMS = [
  { id: 'nausea', name: 'Nausea', icon: '🤢' },
  { id: 'lightsens', name: 'Light Sensitivity', icon: '💡' },
  { id: 'soundsens', name: 'Sound Sensitivity', icon: '🔉' },
  { id: 'visualdist', name: 'Visual Disturbance', icon: '👀' },
  { id: 'dizziness', name: 'Dizziness', icon: '😵' },
  { id: 'fatigue', name: 'Fatigue', icon: '😪' },
];

export default function App() {
  const [entries, setEntries] = useState<HeadacheEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<HeadacheEntry | null>(null);
  const [interactionCount, setInteractionCount] = useState(0);

  // Form fields
  const [duration, setDuration] = useState('60');
  const [intensity, setIntensity] = useState(5);
  const [type, setType] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [medication, setMedication] = useState('');
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'triggers' | 'symptoms'>('details');

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  useEffect(() => {
    if (interactionCount > 0 && interactionCount % 8 === 0) {
      showInterstitialAd();
    }
  }, [interactionCount]);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setEntries(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (data: HeadacheEntry[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setEntries(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const addEntry = () => {
    if (!type) return;

    const now = new Date();
    const newEntry: HeadacheEntry = {
      id: Date.now().toString(),
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      duration: parseInt(duration) || 60,
      intensity,
      type,
      location: locations,
      triggers,
      symptoms,
      medication,
      notes,
    };

    saveData([newEntry, ...entries]);
    resetForm();
    setShowAddModal(false);
    setInteractionCount(prev => prev + 1);
  };

  const resetForm = () => {
    setDuration('60');
    setIntensity(5);
    setType('');
    setLocations([]);
    setTriggers([]);
    setSymptoms([]);
    setMedication('');
    setNotes('');
    setActiveTab('details');
  };

  const deleteEntry = (id: string) => {
    saveData(entries.filter(e => e.id !== id));
    setShowDetailModal(false);
  };

  const toggleLocation = (loc: string) => {
    setLocations(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]);
  };

  const toggleTrigger = (trig: string) => {
    setTriggers(prev => prev.includes(trig) ? prev.filter(t => t !== trig) : [...prev, trig]);
  };

  const toggleSymptom = (symp: string) => {
    setSymptoms(prev => prev.includes(symp) ? prev.filter(s => s !== symp) : [...prev, symp]);
  };

  const getTypeName = (id: string) => HEADACHE_TYPES.find(t => t.id === id)?.name || id;
  const getTypeIcon = (id: string) => HEADACHE_TYPES.find(t => t.id === id)?.icon || '📍';
  const getLocationName = (id: string) => LOCATIONS.find(l => l.id === id)?.name || id;
  const getTriggerName = (id: string) => TRIGGERS.find(t => t.id === id)?.name || id;
  const getSymptomName = (id: string) => SYMPTOMS.find(s => s.id === id)?.name || id;

  const getIntensityColor = (value: number) => {
    if (value <= 3) return colors.status.success;
    if (value <= 6) return colors.status.warning;
    return colors.status.error;
  };

  const getIntensityLabel = (value: number) => {
    if (value <= 3) return 'Mild';
    if (value <= 6) return 'Moderate';
    return 'Severe';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStats = () => {
    if (entries.length === 0) return { avgIntensity: 0, avgDuration: 0, totalHeadaches: 0, mostCommonType: 'N/A' };

    const avgIntensity = (entries.reduce((sum, e) => sum + e.intensity, 0) / entries.length).toFixed(1);
    const avgDuration = Math.round(entries.reduce((sum, e) => sum + e.duration, 0) / entries.length);
    const totalHeadaches = entries.length;

    const typeCounts: { [key: string]: number } = {};
    entries.forEach(e => {
      typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
    });
    const mostCommonType = Object.keys(typeCounts).length > 0
      ? getTypeName(Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b))
      : 'N/A';

    return { avgIntensity, avgDuration, totalHeadaches, mostCommonType };
  };

  const exportData = async () => {
    if (entries.length === 0) return;

    const exportText = entries
      .map(entry => {
        const locs = entry.location.map(l => getLocationName(l)).join(', ');
        const trigs = entry.triggers.map(t => getTriggerName(t)).join(', ');
        const symps = entry.symptoms.map(s => getSymptomName(s)).join(', ');
        return `Date: ${entry.date} ${entry.time}\nType: ${getTypeName(entry.type)}\nIntensity: ${entry.intensity}/10 (${getIntensityLabel(entry.intensity)})\nDuration: ${formatDuration(entry.duration)}\nLocations: ${locs}\nTriggers: ${trigs}\nSymptoms: ${symps}\nMedication: ${entry.medication || 'None'}\nNotes: ${entry.notes || 'None'}\n---`;
      })
      .join('\n\n');

    try {
      await Share.share({
        message: `Headache Tracker Export\n\nTotal Entries: ${entries.length}\n\n${exportText}`,
        title: 'Headache Tracker Data',
      });
      setInteractionCount(prev => prev + 1);
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const viewEntry = (entry: HeadacheEntry) => {
    setSelectedEntry(entry);
    setShowDetailModal(true);
  };

  const stats = getStats();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Headache Tracker</Text>
        {entries.length > 0 && (
          <TouchableOpacity onPress={exportData} style={styles.exportBtn}>
            <Text style={styles.exportIcon}>📤</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      {entries.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.totalHeadaches}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.avgIntensity}</Text>
            <Text style={styles.statLabel}>Avg Intensity</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatDuration(stats.avgDuration)}</Text>
            <Text style={styles.statLabel}>Avg Duration</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue} numberOfLines={1}>{stats.mostCommonType}</Text>
            <Text style={styles.statLabel}>Most Common</Text>
          </View>
        </View>
      )}

      {/* Entries */}
      <ScrollView contentContainerStyle={styles.content}>
        {entries.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🧠</Text>
            <Text style={styles.emptyText}>No headaches tracked</Text>
            <Text style={styles.emptySubtext}>Tap + to log a headache</Text>
          </View>
        )}

        {entries.map(entry => (
          <TouchableOpacity
            key={entry.id}
            style={styles.entryCard}
            onPress={() => viewEntry(entry)}
          >
            <View style={styles.entryHeader}>
              <View style={styles.entryHeaderLeft}>
                <Text style={styles.entryIcon}>{getTypeIcon(entry.type)}</Text>
                <View>
                  <Text style={styles.entryType}>{getTypeName(entry.type)}</Text>
                  <Text style={styles.entryDateTime}>
                    {formatDate(entry.date)} • {entry.time}
                  </Text>
                </View>
              </View>
              <View style={[styles.intensityBadge, { backgroundColor: getIntensityColor(entry.intensity) }]}>
                <Text style={styles.intensityText}>{entry.intensity}/10</Text>
              </View>
            </View>

            <View style={styles.entryDetails}>
              <View style={styles.entryDetailItem}>
                <Text style={styles.entryDetailLabel}>Duration:</Text>
                <Text style={styles.entryDetailValue}>{formatDuration(entry.duration)}</Text>
              </View>
              {entry.location.length > 0 && (
                <View style={styles.entryDetailItem}>
                  <Text style={styles.entryDetailLabel}>Location:</Text>
                  <Text style={styles.entryDetailValue} numberOfLines={1}>
                    {entry.location.map(l => getLocationName(l)).join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AdBanner />

      {/* Add Entry Modal */}
      <Modal visible={showAddModal} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Headache Entry</Text>
            <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'details' && styles.tabActive]}
              onPress={() => setActiveTab('details')}
            >
              <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'triggers' && styles.tabActive]}
              onPress={() => setActiveTab('triggers')}
            >
              <Text style={[styles.tabText, activeTab === 'triggers' && styles.tabTextActive]}>Triggers</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'symptoms' && styles.tabActive]}
              onPress={() => setActiveTab('symptoms')}
            >
              <Text style={[styles.tabText, activeTab === 'symptoms' && styles.tabTextActive]}>Symptoms</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {activeTab === 'details' && (
              <>
                {/* Headache Type */}
                <Text style={styles.sectionTitle}>Headache Type *</Text>
                <View style={styles.optionsGrid}>
                  {HEADACHE_TYPES.map(t => (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.optionBtn, type === t.id && styles.optionBtnActive]}
                      onPress={() => setType(t.id)}
                    >
                      <Text style={styles.optionIcon}>{t.icon}</Text>
                      <Text style={[styles.optionText, type === t.id && styles.optionTextActive]}>
                        {t.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Pain Intensity */}
                <Text style={styles.sectionTitle}>Pain Intensity: {intensity}/10</Text>
                <View style={styles.intensitySlider}>
                  <View style={styles.intensityScale}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.intensityBtn,
                          intensity === i && { backgroundColor: getIntensityColor(i) },
                        ]}
                        onPress={() => setIntensity(i)}
                      >
                        <Text style={[styles.intensityBtnText, intensity === i && { color: colors.white }]}>
                          {i}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={[styles.intensityLabel, { backgroundColor: getIntensityColor(intensity) }]}>
                    <Text style={styles.intensityLabelText}>
                      {intensity}/10 - {getIntensityLabel(intensity)}
                    </Text>
                  </View>
                </View>

                {/* Duration */}
                <Text style={styles.sectionTitle}>Duration (minutes)</Text>
                <TextInput
                  style={styles.input}
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="60"
                  keyboardType="numeric"
                />

                {/* Pain Location */}
                <Text style={styles.sectionTitle}>Pain Location</Text>
                <View style={styles.optionsGrid}>
                  {LOCATIONS.map(loc => (
                    <TouchableOpacity
                      key={loc.id}
                      style={[styles.optionBtn, locations.includes(loc.id) && styles.optionBtnActive]}
                      onPress={() => toggleLocation(loc.id)}
                    >
                      <Text style={styles.optionIcon}>{loc.icon}</Text>
                      <Text style={[styles.optionText, locations.includes(loc.id) && styles.optionTextActive]}>
                        {loc.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Medication */}
                <Text style={styles.sectionTitle}>Medication Taken</Text>
                <TextInput
                  style={styles.input}
                  value={medication}
                  onChangeText={setMedication}
                  placeholder="e.g., Ibuprofen 400mg"
                />

                {/* Notes */}
                <Text style={styles.sectionTitle}>Additional Notes</Text>
                <TextInput
                  style={styles.textArea}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any additional information..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </>
            )}

            {activeTab === 'triggers' && (
              <>
                <Text style={styles.sectionTitle}>Possible Triggers</Text>
                <View style={styles.optionsGrid}>
                  {TRIGGERS.map(trig => (
                    <TouchableOpacity
                      key={trig.id}
                      style={[styles.optionBtn, triggers.includes(trig.id) && styles.optionBtnActive]}
                      onPress={() => toggleTrigger(trig.id)}
                    >
                      <Text style={styles.optionIcon}>{trig.icon}</Text>
                      <Text style={[styles.optionText, triggers.includes(trig.id) && styles.optionTextActive]}>
                        {trig.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {activeTab === 'symptoms' && (
              <>
                <Text style={styles.sectionTitle}>Associated Symptoms</Text>
                <View style={styles.optionsGrid}>
                  {SYMPTOMS.map(symp => (
                    <TouchableOpacity
                      key={symp.id}
                      style={[styles.optionBtn, symptoms.includes(symp.id) && styles.optionBtnActive]}
                      onPress={() => toggleSymptom(symp.id)}
                    >
                      <Text style={styles.optionIcon}>{symp.icon}</Text>
                      <Text style={[styles.optionText, symptoms.includes(symp.id) && styles.optionTextActive]}>
                        {symp.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.saveButton, !type && styles.saveButtonDisabled]}
              onPress={addEntry}
              disabled={!type}
            >
              <Text style={styles.saveButtonText}>Save Entry</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.detailOverlay}>
          <View style={styles.detailContent}>
            {selectedEntry && (
              <ScrollView>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailIcon}>{getTypeIcon(selectedEntry.type)}</Text>
                  <View style={styles.detailHeaderText}>
                    <Text style={styles.detailType}>{getTypeName(selectedEntry.type)}</Text>
                    <Text style={styles.detailDateTime}>
                      {formatDate(selectedEntry.date)} • {selectedEntry.time}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.detailIntensity, { backgroundColor: getIntensityColor(selectedEntry.intensity) }]}>
                  <Text style={styles.detailIntensityText}>
                    Pain Level: {selectedEntry.intensity}/10 - {getIntensityLabel(selectedEntry.intensity)}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>{formatDuration(selectedEntry.duration)}</Text>
                </View>

                {selectedEntry.location.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Pain Location</Text>
                    <Text style={styles.detailValue}>
                      {selectedEntry.location.map(l => getLocationName(l)).join(', ')}
                    </Text>
                  </View>
                )}

                {selectedEntry.triggers.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Triggers</Text>
                    <Text style={styles.detailValue}>
                      {selectedEntry.triggers.map(t => getTriggerName(t)).join(', ')}
                    </Text>
                  </View>
                )}

                {selectedEntry.symptoms.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Symptoms</Text>
                    <Text style={styles.detailValue}>
                      {selectedEntry.symptoms.map(s => getSymptomName(s)).join(', ')}
                    </Text>
                  </View>
                )}

                {selectedEntry.medication && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Medication</Text>
                    <Text style={styles.detailValue}>{selectedEntry.medication}</Text>
                  </View>
                )}

                {selectedEntry.notes && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Notes</Text>
                    <Text style={styles.detailValue}>{selectedEntry.notes}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteEntry(selectedEntry.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete Entry</Text>
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
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  exportBtn: { padding: spacing.sm },
  exportIcon: { fontSize: 24 },
  statsContainer: { flexDirection: 'row', backgroundColor: colors.white, marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: 12, padding: spacing.md, gap: spacing.xs },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  statLabel: { fontSize: 10, color: colors.gray.dark, marginTop: spacing.xs, textAlign: 'center' },
  content: { padding: spacing.lg, paddingBottom: 100 },
  emptyState: { alignItems: 'center', marginTop: spacing['3xl'] },
  emptyIcon: { fontSize: 64, marginBottom: spacing.lg },
  emptyText: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  emptySubtext: { fontSize: 14, color: colors.gray.dark },
  entryCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  entryHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  entryIcon: { fontSize: 32, marginRight: spacing.md },
  entryType: { fontSize: 18, fontWeight: '600', color: colors.text },
  entryDateTime: { fontSize: 12, color: colors.gray.dark, marginTop: spacing.xs },
  intensityBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8 },
  intensityText: { color: colors.white, fontSize: 14, fontWeight: 'bold' },
  entryDetails: { gap: spacing.sm },
  entryDetailItem: { flexDirection: 'row', gap: spacing.sm },
  entryDetailLabel: { fontSize: 14, color: colors.gray.dark, fontWeight: '600' },
  entryDetailValue: { fontSize: 14, color: colors.text, flex: 1 },
  fab: { position: 'absolute', right: spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  fabText: { color: colors.white, fontSize: 32, fontWeight: '300' },
  modalContainer: { flex: 1, backgroundColor: colors.gray.light },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray.light },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  modalClose: { fontSize: 28, color: colors.gray.dark, fontWeight: '300' },
  tabs: { flexDirection: 'row', backgroundColor: colors.white, marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: 12, padding: spacing.xs },
  tab: { flex: 1, padding: spacing.md, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.gray.dark },
  tabTextActive: { color: colors.white },
  modalContent: { padding: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.md, marginTop: spacing.md },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  optionBtn: { flex: 1, minWidth: '30%', backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: colors.gray.light },
  optionBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  optionIcon: { fontSize: 24, marginBottom: spacing.sm },
  optionText: { fontSize: 12, color: colors.gray.dark, fontWeight: '600', textAlign: 'center' },
  optionTextActive: { color: colors.primary },
  intensitySlider: { marginBottom: spacing.lg },
  intensityScale: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  intensityBtn: { flex: 1, aspectRatio: 1, backgroundColor: colors.white, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.gray.light },
  intensityBtnText: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  intensityLabel: { padding: spacing.md, borderRadius: 12, alignItems: 'center' },
  intensityLabelText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  input: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: colors.gray.light },
  textArea: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, fontSize: 16, minHeight: 100, borderWidth: 1, borderColor: colors.gray.light, textAlignVertical: 'top' },
  saveButton: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: 12, alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl },
  saveButtonDisabled: { backgroundColor: colors.gray.medium },
  saveButtonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  detailContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, maxHeight: '80%' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  detailIcon: { fontSize: 48, marginRight: spacing.md },
  detailHeaderText: { flex: 1 },
  detailType: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  detailDateTime: { fontSize: 14, color: colors.gray.dark, marginTop: spacing.xs },
  detailIntensity: { padding: spacing.lg, borderRadius: 12, alignItems: 'center', marginBottom: spacing.lg },
  detailIntensityText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  detailSection: { marginBottom: spacing.lg },
  detailLabel: { fontSize: 14, fontWeight: '600', color: colors.gray.dark, marginBottom: spacing.sm, textTransform: 'uppercase' },
  detailValue: { fontSize: 16, color: colors.text, lineHeight: 24 },
  deleteButton: { backgroundColor: colors.status.error, padding: spacing.lg, borderRadius: 12, alignItems: 'center', marginTop: spacing.md },
  deleteButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
