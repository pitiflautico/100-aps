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
  Slider,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@pain_symptoms_diary';

interface PainEntry {
  id: string;
  date: string;
  time: string;
  bodyArea: string;
  intensity: number;
  description: string;
  triggers: string[];
}

const BODY_AREAS = [
  { id: 'head', name: 'Head', icon: '🧠' },
  { id: 'neck', name: 'Neck', icon: '💫' },
  { id: 'back', name: 'Back', icon: '🔲' },
  { id: 'chest', name: 'Chest', icon: '❤️' },
  { id: 'arms', name: 'Arms', icon: '💪' },
  { id: 'legs', name: 'Legs', icon: '🦵' },
  { id: 'abdomen', name: 'Abdomen', icon: '🫃' },
  { id: 'joints', name: 'Joints', icon: '🦴' },
];

const TRIGGERS = [
  { id: 'food', name: 'Food', icon: '🍽️' },
  { id: 'activity', name: 'Activity', icon: '🏃' },
  { id: 'weather', name: 'Weather', icon: '🌤️' },
  { id: 'stress', name: 'Stress', icon: '😰' },
  { id: 'sleep', name: 'Sleep', icon: '😴' },
  { id: 'posture', name: 'Posture', icon: '🪑' },
  { id: 'medication', name: 'Medication', icon: '💊' },
  { id: 'other', name: 'Other', icon: '❓' },
];

export default function App() {
  const [entries, setEntries] = useState<PainEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBodyArea, setSelectedBodyArea] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [description, setDescription] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [interactionCount, setInteractionCount] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PainEntry | null>(null);

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

  const saveData = async (data: PainEntry[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setEntries(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const addEntry = () => {
    if (!selectedBodyArea) return;

    const now = new Date();
    const newEntry: PainEntry = {
      id: Date.now().toString(),
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      bodyArea: selectedBodyArea,
      intensity,
      description,
      triggers: selectedTriggers,
    };

    saveData([newEntry, ...entries]);
    resetForm();
    setShowAddModal(false);
    setInteractionCount(prev => prev + 1);
  };

  const resetForm = () => {
    setSelectedBodyArea('');
    setIntensity(5);
    setDescription('');
    setSelectedTriggers([]);
  };

  const deleteEntry = (id: string) => {
    saveData(entries.filter(e => e.id !== id));
  };

  const toggleTrigger = (triggerId: string) => {
    setSelectedTriggers(prev =>
      prev.includes(triggerId)
        ? prev.filter(t => t !== triggerId)
        : [...prev, triggerId]
    );
  };

  const getBodyAreaName = (id: string) => {
    return BODY_AREAS.find(area => area.id === id)?.name || id;
  };

  const getBodyAreaIcon = (id: string) => {
    return BODY_AREAS.find(area => area.id === id)?.icon || '📍';
  };

  const getTriggerName = (id: string) => {
    return TRIGGERS.find(t => t.id === id)?.name || id;
  };

  const getTriggerIcon = (id: string) => {
    return TRIGGERS.find(t => t.id === id)?.icon || '•';
  };

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

  const exportData = async () => {
    if (entries.length === 0) return;

    const exportText = entries
      .map(entry => {
        const triggersList = entry.triggers.map(t => getTriggerName(t)).join(', ');
        return `Date: ${entry.date} ${entry.time}\nArea: ${getBodyAreaName(entry.bodyArea)}\nIntensity: ${entry.intensity}/10 (${getIntensityLabel(entry.intensity)})\nDescription: ${entry.description}\nTriggers: ${triggersList}\n---`;
      })
      .join('\n\n');

    try {
      await Share.share({
        message: `Pain & Symptoms Diary Export\n\nTotal Entries: ${entries.length}\n\n${exportText}`,
        title: 'Pain & Symptoms Diary',
      });
      setInteractionCount(prev => prev + 1);
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const viewEntryDetails = (entry: PainEntry) => {
    setSelectedEntry(entry);
    setShowDetailModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Pain Diary</Text>
        {entries.length > 0 && (
          <TouchableOpacity onPress={exportData} style={styles.exportBtn}>
            <Text style={styles.exportIcon}>📤</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Bar */}
      {entries.length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{entries.length}</Text>
            <Text style={styles.statLabel}>Total Entries</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {entries.length > 0
                ? (entries.reduce((sum, e) => sum + e.intensity, 0) / entries.length).toFixed(1)
                : '0'}
            </Text>
            <Text style={styles.statLabel}>Avg Intensity</Text>
          </View>
        </View>
      )}

      {/* Timeline */}
      <ScrollView contentContainerStyle={styles.content}>
        {entries.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No entries yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first pain log</Text>
          </View>
        )}

        {entries.map(entry => (
          <TouchableOpacity
            key={entry.id}
            style={styles.entryCard}
            onPress={() => viewEntryDetails(entry)}
            onLongPress={() => deleteEntry(entry.id)}
          >
            <View style={styles.entryHeader}>
              <View style={styles.entryHeaderLeft}>
                <Text style={styles.entryIcon}>{getBodyAreaIcon(entry.bodyArea)}</Text>
                <View>
                  <Text style={styles.entryBodyArea}>{getBodyAreaName(entry.bodyArea)}</Text>
                  <Text style={styles.entryDateTime}>
                    {formatDate(entry.date)} • {entry.time}
                  </Text>
                </View>
              </View>
              <View
                style={[styles.intensityBadge, { backgroundColor: getIntensityColor(entry.intensity) }]}
              >
                <Text style={styles.intensityText}>{entry.intensity}/10</Text>
              </View>
            </View>

            {entry.description && (
              <Text style={styles.entryDescription} numberOfLines={2}>
                {entry.description}
              </Text>
            )}

            {entry.triggers.length > 0 && (
              <View style={styles.triggersContainer}>
                {entry.triggers.map(triggerId => (
                  <View key={triggerId} style={styles.triggerTag}>
                    <Text style={styles.triggerTagText}>
                      {getTriggerIcon(triggerId)} {getTriggerName(triggerId)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
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
            <Text style={styles.modalTitle}>New Pain Entry</Text>
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
            {/* Body Area Selection */}
            <Text style={styles.sectionTitle}>Body Area *</Text>
            <View style={styles.bodyAreaGrid}>
              {BODY_AREAS.map(area => (
                <TouchableOpacity
                  key={area.id}
                  style={[
                    styles.bodyAreaBtn,
                    selectedBodyArea === area.id && styles.bodyAreaBtnActive,
                  ]}
                  onPress={() => setSelectedBodyArea(area.id)}
                >
                  <Text style={styles.bodyAreaIcon}>{area.icon}</Text>
                  <Text
                    style={[
                      styles.bodyAreaText,
                      selectedBodyArea === area.id && styles.bodyAreaTextActive,
                    ]}
                  >
                    {area.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Pain Intensity */}
            <Text style={styles.sectionTitle}>Pain Intensity: {intensity}/10</Text>
            <View style={styles.intensityContainer}>
              <Text style={styles.intensityLabel}>Mild</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={intensity}
                onValueChange={setIntensity}
                minimumTrackTintColor={getIntensityColor(intensity)}
                maximumTrackTintColor={colors.gray.light}
                thumbTintColor={getIntensityColor(intensity)}
              />
              <Text style={styles.intensityLabel}>Severe</Text>
            </View>
            <View style={[styles.intensityBadgeLarge, { backgroundColor: getIntensityColor(intensity) }]}>
              <Text style={styles.intensityTextLarge}>
                {intensity}/10 - {getIntensityLabel(intensity)}
              </Text>
            </View>

            {/* Description */}
            <Text style={styles.sectionTitle}>Symptom Description</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your symptoms..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Triggers */}
            <Text style={styles.sectionTitle}>Possible Triggers</Text>
            <View style={styles.triggersGrid}>
              {TRIGGERS.map(trigger => (
                <TouchableOpacity
                  key={trigger.id}
                  style={[
                    styles.triggerBtn,
                    selectedTriggers.includes(trigger.id) && styles.triggerBtnActive,
                  ]}
                  onPress={() => toggleTrigger(trigger.id)}
                >
                  <Text style={styles.triggerIcon}>{trigger.icon}</Text>
                  <Text
                    style={[
                      styles.triggerText,
                      selectedTriggers.includes(trigger.id) && styles.triggerTextActive,
                    ]}
                  >
                    {trigger.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Add Button */}
            <TouchableOpacity
              style={[styles.addButton, !selectedBodyArea && styles.addButtonDisabled]}
              onPress={addEntry}
              disabled={!selectedBodyArea}
            >
              <Text style={styles.addButtonText}>Save Entry</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.detailOverlay}>
          <View style={styles.detailContent}>
            {selectedEntry && (
              <>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailIcon}>{getBodyAreaIcon(selectedEntry.bodyArea)}</Text>
                  <View style={styles.detailHeaderText}>
                    <Text style={styles.detailBodyArea}>{getBodyAreaName(selectedEntry.bodyArea)}</Text>
                    <Text style={styles.detailDateTime}>
                      {formatDate(selectedEntry.date)} • {selectedEntry.time}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                    <Text style={styles.detailClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.detailIntensity,
                    { backgroundColor: getIntensityColor(selectedEntry.intensity) },
                  ]}
                >
                  <Text style={styles.detailIntensityText}>
                    Pain Level: {selectedEntry.intensity}/10 - {getIntensityLabel(selectedEntry.intensity)}
                  </Text>
                </View>

                {selectedEntry.description && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Description</Text>
                    <Text style={styles.detailDescription}>{selectedEntry.description}</Text>
                  </View>
                )}

                {selectedEntry.triggers.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Triggers</Text>
                    <View style={styles.detailTriggers}>
                      {selectedEntry.triggers.map(triggerId => (
                        <View key={triggerId} style={styles.detailTriggerTag}>
                          <Text style={styles.detailTriggerText}>
                            {getTriggerIcon(triggerId)} {getTriggerName(triggerId)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    deleteEntry(selectedEntry.id);
                    setShowDetailModal(false);
                  }}
                >
                  <Text style={styles.deleteButtonText}>Delete Entry</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  exportBtn: {
    padding: spacing.sm,
  },
  exportIcon: {
    fontSize: 24,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray.dark,
    marginTop: spacing.xs,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray.dark,
  },
  entryCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  entryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  entryIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  entryBodyArea: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  entryDateTime: {
    fontSize: 12,
    color: colors.gray.dark,
    marginTop: spacing.xs,
  },
  intensityBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  intensityText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  entryDescription: {
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.md,
  },
  triggersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  triggerTag: {
    backgroundColor: colors.gray.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  triggerTagText: {
    fontSize: 12,
    color: colors.gray.dark,
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.gray.light,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  modalClose: {
    fontSize: 28,
    color: colors.gray.dark,
    fontWeight: '300',
  },
  modalContent: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  bodyAreaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  bodyAreaBtn: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray.light,
  },
  bodyAreaBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  bodyAreaIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  bodyAreaText: {
    fontSize: 12,
    color: colors.gray.dark,
    fontWeight: '600',
  },
  bodyAreaTextActive: {
    color: colors.primary,
  },
  intensityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  intensityLabel: {
    fontSize: 12,
    color: colors.gray.dark,
  },
  intensityBadgeLarge: {
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  intensityTextLarge: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  textArea: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.gray.light,
  },
  triggersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  triggerBtn: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray.light,
  },
  triggerBtnActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '10',
  },
  triggerIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  triggerText: {
    fontSize: 12,
    color: colors.gray.dark,
    fontWeight: '600',
  },
  triggerTextActive: {
    color: colors.accent,
  },
  addButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  addButtonDisabled: {
    backgroundColor: colors.gray.medium,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    maxHeight: '80%',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  detailIcon: {
    fontSize: 48,
    marginRight: spacing.md,
  },
  detailHeaderText: {
    flex: 1,
  },
  detailBodyArea: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  detailDateTime: {
    fontSize: 14,
    color: colors.gray.dark,
    marginTop: spacing.xs,
  },
  detailClose: {
    fontSize: 28,
    color: colors.gray.dark,
    fontWeight: '300',
  },
  detailIntensity: {
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  detailIntensityText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailSection: {
    marginBottom: spacing.lg,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray.dark,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  detailDescription: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  detailTriggers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  detailTriggerTag: {
    backgroundColor: colors.gray.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  detailTriggerText: {
    fontSize: 14,
    color: colors.gray.dark,
  },
  deleteButton: {
    backgroundColor: colors.status.error,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
