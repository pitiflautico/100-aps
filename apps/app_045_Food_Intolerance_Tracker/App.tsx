import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Modal, Share } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@food_intolerance_tracker';

interface FoodEntry {
  id: string;
  date: string;
  time: string;
  foods: string[];
  symptoms: string[];
  severity: number;
  notes: string;
}

const COMMON_FOODS = [
  { id: 'dairy', name: 'Dairy', icon: '🥛' },
  { id: 'gluten', name: 'Gluten', icon: '🍞' },
  { id: 'eggs', name: 'Eggs', icon: '🥚' },
  { id: 'nuts', name: 'Nuts', icon: '🥜' },
  { id: 'soy', name: 'Soy', icon: '🫘' },
  { id: 'seafood', name: 'Seafood', icon: '🦐' },
  { id: 'wheat', name: 'Wheat', icon: '🌾' },
  { id: 'corn', name: 'Corn', icon: '🌽' },
  { id: 'spicy', name: 'Spicy', icon: '🌶️' },
  { id: 'citrus', name: 'Citrus', icon: '🍊' },
];

const SYMPTOMS = [
  { id: 'bloating', name: 'Bloating', icon: '🎈' },
  { id: 'nausea', name: 'Nausea', icon: '🤢' },
  { id: 'stomach', name: 'Stomach Pain', icon: '😣' },
  { id: 'diarrhea', name: 'Diarrhea', icon: '💩' },
  { id: 'headache', name: 'Headache', icon: '🤕' },
  { id: 'rash', name: 'Skin Rash', icon: '😖' },
  { id: 'fatigue', name: 'Fatigue', icon: '😴' },
  { id: 'gas', name: 'Gas', icon: '💨' },
];

export default function App() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FoodEntry | null>(null);
  const [interactionCount, setInteractionCount] = useState(0);
  const [customFood, setCustomFood] = useState('');
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState(3);
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

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setEntries(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (data: FoodEntry[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setEntries(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const addEntry = () => {
    if (selectedFoods.length === 0 && !customFood) return;

    const foods = [...selectedFoods];
    if (customFood) foods.push(customFood);

    const now = new Date();
    const newEntry: FoodEntry = {
      id: Date.now().toString(),
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      foods,
      symptoms: selectedSymptoms,
      severity,
      notes,
    };

    saveData([newEntry, ...entries]);
    resetForm();
    setShowAddModal(false);
    setInteractionCount(prev => prev + 1);
  };

  const deleteEntry = (id: string) => {
    saveData(entries.filter(e => e.id !== id));
    setShowDetailModal(false);
  };

  const resetForm = () => {
    setSelectedFoods([]);
    setCustomFood('');
    setSelectedSymptoms([]);
    setSeverity(3);
    setNotes('');
  };

  const toggleFood = (foodId: string) => {
    setSelectedFoods(prev => prev.includes(foodId) ? prev.filter(f => f !== foodId) : [...prev, foodId]);
  };

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms(prev => prev.includes(symptomId) ? prev.filter(s => s !== symptomId) : [...prev, symptomId]);
  };

  const getFoodName = (id: string) => COMMON_FOODS.find(f => f.id === id)?.name || id;
  const getFoodIcon = (id: string) => COMMON_FOODS.find(f => f.id === id)?.icon || '🍽️';
  const getSymptomName = (id: string) => SYMPTOMS.find(s => s.id === id)?.name || id;
  const getSymptomIcon = (id: string) => SYMPTOMS.find(s => s.id === id)?.icon || '•';

  const getSeverityColor = (value: number) => {
    if (value <= 2) return colors.status.success;
    if (value <= 4) return colors.status.warning;
    return colors.status.error;
  };

  const getSeverityLabel = (value: number) => {
    if (value <= 2) return 'Mild';
    if (value <= 4) return 'Moderate';
    return 'Severe';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const analyzeTriggers = () => {
    const foodCounts: { [key: string]: number } = {};
    entries.forEach(entry => {
      if (entry.symptoms.length > 0) {
        entry.foods.forEach(food => {
          foodCounts[food] = (foodCounts[food] || 0) + 1;
        });
      }
    });

    return Object.entries(foodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([food, count]) => ({ food, count }));
  };

  const exportData = async () => {
    if (entries.length === 0) return;

    const exportText = entries
      .map(entry => {
        const foods = entry.foods.map(f => getFoodName(f)).join(', ');
        const symps = entry.symptoms.map(s => getSymptomName(s)).join(', ');
        return `Date: ${formatDate(entry.date)} ${entry.time}\nFoods: ${foods}\nSymptoms: ${symps || 'None'}\nSeverity: ${entry.severity}/5 (${getSeverityLabel(entry.severity)})\nNotes: ${entry.notes || 'None'}\n---`;
      })
      .join('\n\n');

    const triggers = analyzeTriggers();
    const triggersText = triggers.map(t => `${t.food}: ${t.count} times`).join('\n');

    try {
      await Share.share({
        message: `Food Intolerance Tracker\n\nTotal Entries: ${entries.length}\n\nTop Triggers:\n${triggersText}\n\n${exportText}`,
        title: 'Food Intolerance Data',
      });
      setInteractionCount(prev => prev + 1);
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const topTriggers = analyzeTriggers();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Food Intolerance</Text>
        {entries.length > 0 && (
          <TouchableOpacity onPress={exportData} style={styles.exportBtn}>
            <Text style={styles.exportIcon}>📤</Text>
          </TouchableOpacity>
        )}
      </View>

      {topTriggers.length > 0 && (
        <View style={styles.triggersCard}>
          <Text style={styles.triggersTitle}>Top Triggers</Text>
          <View style={styles.triggersGrid}>
            {topTriggers.map(trigger => (
              <View key={trigger.food} style={styles.triggerItem}>
                <Text style={styles.triggerFood}>{trigger.food}</Text>
                <Text style={styles.triggerCount}>{trigger.count}x</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {entries.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyText}>No entries yet</Text>
            <Text style={styles.emptySubtext}>Track your meals and reactions</Text>
          </View>
        )}

        {entries.map(entry => (
          <TouchableOpacity
            key={entry.id}
            style={styles.entryCard}
            onPress={() => { setSelectedEntry(entry); setShowDetailModal(true); }}
          >
            <View style={styles.entryHeader}>
              <View style={styles.entryHeaderLeft}>
                <Text style={styles.entryIcon}>🍽️</Text>
                <View>
                  <Text style={styles.entryFoods} numberOfLines={1}>
                    {entry.foods.map(f => getFoodName(f)).join(', ')}
                  </Text>
                  <Text style={styles.entryDateTime}>{formatDate(entry.date)} • {entry.time}</Text>
                </View>
              </View>
              {entry.symptoms.length > 0 && (
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(entry.severity) }]}>
                  <Text style={styles.severityText}>{entry.severity}/5</Text>
                </View>
              )}
            </View>
            {entry.symptoms.length > 0 && (
              <Text style={styles.entrySymptoms} numberOfLines={1}>
                {entry.symptoms.map(s => getSymptomIcon(s)).join(' ')}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AdBanner />

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Food Entry</Text>
            <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.sectionTitle}>Foods Eaten</Text>
            <View style={styles.foodsGrid}>
              {COMMON_FOODS.map(food => (
                <TouchableOpacity
                  key={food.id}
                  style={[styles.foodBtn, selectedFoods.includes(food.id) && styles.foodBtnActive]}
                  onPress={() => toggleFood(food.id)}
                >
                  <Text style={styles.foodIcon}>{food.icon}</Text>
                  <Text style={[styles.foodText, selectedFoods.includes(food.id) && styles.foodTextActive]}>
                    {food.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Other Food</Text>
            <TextInput
              style={styles.input}
              value={customFood}
              onChangeText={setCustomFood}
              placeholder="Enter food name..."
            />

            <Text style={styles.sectionTitle}>Symptoms Experienced</Text>
            <View style={styles.symptomsGrid}>
              {SYMPTOMS.map(symptom => (
                <TouchableOpacity
                  key={symptom.id}
                  style={[styles.symptomBtn, selectedSymptoms.includes(symptom.id) && styles.symptomBtnActive]}
                  onPress={() => toggleSymptom(symptom.id)}
                >
                  <Text style={styles.symptomIcon}>{symptom.icon}</Text>
                  <Text style={[styles.symptomText, selectedSymptoms.includes(symptom.id) && styles.symptomTextActive]}>
                    {symptom.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedSymptoms.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Severity: {severity}/5</Text>
                <View style={styles.severityScale}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.severityBtn, severity === i && { backgroundColor: getSeverityColor(i) }]}
                      onPress={() => setSeverity(i)}
                    >
                      <Text style={[styles.severityBtnText, severity === i && { color: colors.white }]}>{i}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={[styles.severityLabel, { backgroundColor: getSeverityColor(severity) }]}>
                  <Text style={styles.severityLabelText}>{getSeverityLabel(severity)}</Text>
                </View>
              </>
            )}

            <Text style={styles.sectionTitle}>Notes</Text>
            <TextInput
              style={styles.textArea}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.saveButton, (selectedFoods.length === 0 && !customFood) && styles.saveButtonDisabled]}
              onPress={addEntry}
              disabled={selectedFoods.length === 0 && !customFood}
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
                  <View>
                    <Text style={styles.detailTitle}>Entry Details</Text>
                    <Text style={styles.detailDate}>{formatDate(selectedEntry.date)} • {selectedEntry.time}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Foods Eaten</Text>
                  <View style={styles.detailFoods}>
                    {selectedEntry.foods.map((food, index) => (
                      <View key={index} style={styles.detailFoodTag}>
                        <Text style={styles.detailFoodText}>{getFoodIcon(food)} {getFoodName(food)}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {selectedEntry.symptoms.length > 0 && (
                  <>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Symptoms</Text>
                      <View style={styles.detailSymptoms}>
                        {selectedEntry.symptoms.map(symptom => (
                          <View key={symptom} style={styles.detailSymptomTag}>
                            <Text style={styles.detailSymptomText}>
                              {getSymptomIcon(symptom)} {getSymptomName(symptom)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Severity</Text>
                      <View style={[styles.detailSeverity, { backgroundColor: getSeverityColor(selectedEntry.severity) }]}>
                        <Text style={styles.detailSeverityText}>
                          {selectedEntry.severity}/5 - {getSeverityLabel(selectedEntry.severity)}
                        </Text>
                      </View>
                    </View>
                  </>
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
  triggersCard: { backgroundColor: colors.white, marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: 12, padding: spacing.lg },
  triggersTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  triggersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  triggerItem: { backgroundColor: colors.status.warning + '20', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8 },
  triggerFood: { fontSize: 14, fontWeight: '600', color: colors.text },
  triggerCount: { fontSize: 12, color: colors.gray.dark },
  content: { padding: spacing.lg, paddingBottom: 100 },
  emptyState: { alignItems: 'center', marginTop: spacing['3xl'] },
  emptyIcon: { fontSize: 64, marginBottom: spacing.lg },
  emptyText: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  emptySubtext: { fontSize: 14, color: colors.gray.dark },
  entryCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.md },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  entryHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  entryIcon: { fontSize: 32, marginRight: spacing.md },
  entryFoods: { fontSize: 16, fontWeight: '600', color: colors.text },
  entryDateTime: { fontSize: 12, color: colors.gray.dark, marginTop: spacing.xs },
  severityBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8 },
  severityText: { color: colors.white, fontSize: 14, fontWeight: 'bold' },
  entrySymptoms: { fontSize: 16, marginTop: spacing.sm },
  fab: { position: 'absolute', right: spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  fabText: { color: colors.white, fontSize: 32, fontWeight: '300' },
  modalContainer: { flex: 1, backgroundColor: colors.gray.light },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray.light },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  modalClose: { fontSize: 28, color: colors.gray.dark, fontWeight: '300' },
  modalContent: { padding: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.md, marginTop: spacing.md },
  foodsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  foodBtn: { flex: 1, minWidth: '30%', backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: colors.gray.light },
  foodBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  foodIcon: { fontSize: 24, marginBottom: spacing.sm },
  foodText: { fontSize: 12, color: colors.gray.dark, fontWeight: '600', textAlign: 'center' },
  foodTextActive: { color: colors.primary },
  input: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: colors.gray.light },
  symptomsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  symptomBtn: { flex: 1, minWidth: '30%', backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: colors.gray.light },
  symptomBtnActive: { borderColor: colors.status.error, backgroundColor: colors.status.error + '10' },
  symptomIcon: { fontSize: 24, marginBottom: spacing.sm },
  symptomText: { fontSize: 12, color: colors.gray.dark, fontWeight: '600', textAlign: 'center' },
  symptomTextActive: { color: colors.status.error },
  severityScale: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  severityBtn: { flex: 1, aspectRatio: 1, backgroundColor: colors.white, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.gray.light },
  severityBtnText: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  severityLabel: { padding: spacing.md, borderRadius: 12, alignItems: 'center', marginBottom: spacing.md },
  severityLabelText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  textArea: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, fontSize: 16, minHeight: 80, borderWidth: 1, borderColor: colors.gray.light, textAlignVertical: 'top' },
  saveButton: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: 12, alignItems: 'center', marginTop: spacing.xl },
  saveButtonDisabled: { backgroundColor: colors.gray.medium },
  saveButtonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  detailContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, maxHeight: '80%' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  detailTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  detailDate: { fontSize: 14, color: colors.gray.dark, marginTop: spacing.xs },
  detailSection: { marginBottom: spacing.lg },
  detailLabel: { fontSize: 14, fontWeight: '600', color: colors.gray.dark, marginBottom: spacing.sm, textTransform: 'uppercase' },
  detailValue: { fontSize: 16, color: colors.text, lineHeight: 24 },
  detailFoods: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  detailFoodTag: { backgroundColor: colors.primary + '10', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8 },
  detailFoodText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  detailSymptoms: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  detailSymptomTag: { backgroundColor: colors.gray.light, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8 },
  detailSymptomText: { fontSize: 14, color: colors.gray.dark },
  detailSeverity: { padding: spacing.md, borderRadius: 12, alignItems: 'center' },
  detailSeverityText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  deleteButton: { backgroundColor: colors.status.error, padding: spacing.lg, borderRadius: 12, alignItems: 'center', marginTop: spacing.md },
  deleteButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
