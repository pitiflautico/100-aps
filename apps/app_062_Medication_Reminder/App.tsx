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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Medication_Reminder_data';

type Frequency = 'Once Daily' | 'Twice Daily' | 'Three Times Daily' | 'Four Times Daily' | 'As Needed';

interface DoseLog {
  id: string;
  timestamp: string;
  taken: boolean;
  skipped: boolean;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: Frequency;
  timesPerDay: number;
  scheduledTimes: string[];
  quantity: number;
  refillAt: number;
  doseLogs: DoseLog[];
  createdAt: string;
}

interface PendingDose {
  medId: string;
  medName: string;
  dosage: string;
  time: string;
}

export default function App() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [actionCount, setActionCount] = useState(0);

  // Form states
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('Once Daily');
  const [quantity, setQuantity] = useState('');
  const [refillAt, setRefillAt] = useState('');
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(['08:00']);

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setMedications(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (newMeds: Medication[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newMeds));
      setMedications(newMeds);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const getDefaultTimes = (freq: Frequency): string[] => {
    switch (freq) {
      case 'Once Daily': return ['08:00'];
      case 'Twice Daily': return ['08:00', '20:00'];
      case 'Three Times Daily': return ['08:00', '14:00', '20:00'];
      case 'Four Times Daily': return ['08:00', '12:00', '16:00', '20:00'];
      case 'As Needed': return [];
      default: return ['08:00'];
    }
  };

  const getTimesPerDay = (freq: Frequency): number => {
    switch (freq) {
      case 'Once Daily': return 1;
      case 'Twice Daily': return 2;
      case 'Three Times Daily': return 3;
      case 'Four Times Daily': return 4;
      case 'As Needed': return 0;
      default: return 1;
    }
  };

  const addMedication = () => {
    if (!name.trim() || !dosage.trim()) return;

    const newMed: Medication = {
      id: Date.now().toString(),
      name: name.trim(),
      dosage: dosage.trim(),
      frequency,
      timesPerDay: getTimesPerDay(frequency),
      scheduledTimes,
      quantity: parseInt(quantity) || 30,
      refillAt: parseInt(refillAt) || 5,
      doseLogs: [],
      createdAt: new Date().toISOString(),
    };

    saveData([...medications, newMed]);
    resetForm();
    setShowAddModal(false);

    const newCount = actionCount + 1;
    setActionCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const resetForm = () => {
    setName('');
    setDosage('');
    setFrequency('Once Daily');
    setQuantity('');
    setRefillAt('');
    setScheduledTimes(['08:00']);
  };

  const deleteMedication = (id: string) => {
    saveData(medications.filter(m => m.id !== id));
    if (selectedMed?.id === id) {
      setShowDetailModal(false);
      setSelectedMed(null);
    }
  };

  const logDose = (medId: string, taken: boolean) => {
    const updated = medications.map(med => {
      if (med.id === medId) {
        const newLog: DoseLog = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          taken,
          skipped: !taken,
        };

        // Update quantity if taken
        const newQuantity = taken ? Math.max(0, med.quantity - 1) : med.quantity;

        return {
          ...med,
          doseLogs: [newLog, ...med.doseLogs],
          quantity: newQuantity,
        };
      }
      return med;
    });

    saveData(updated);

    const newCount = actionCount + 1;
    setActionCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const getPendingDoses = (): PendingDose[] => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const pending: PendingDose[] = [];

    medications.forEach(med => {
      if (med.frequency === 'As Needed') return;

      // Get today's logs
      const today = now.toDateString();
      const todayLogs = med.doseLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate.toDateString() === today && log.taken;
      });

      // Check each scheduled time
      med.scheduledTimes.forEach(time => {
        const [hour, minute] = time.split(':').map(Number);
        const scheduleTimeInMinutes = hour * 60 + minute;

        // If it's past the scheduled time and no log for this time slot
        if (currentTimeInMinutes >= scheduleTimeInMinutes) {
          // Simple check: if taken count is less than expected doses up to now
          const expectedDoses = med.scheduledTimes.filter(t => {
            const [h, m] = t.split(':').map(Number);
            return (h * 60 + m) <= currentTimeInMinutes;
          }).length;

          if (todayLogs.length < expectedDoses) {
            pending.push({
              medId: med.id,
              medName: med.name,
              dosage: med.dosage,
              time,
            });
          }
        }
      });
    });

    return pending;
  };

  const needsRefill = (med: Medication): boolean => {
    return med.quantity <= med.refillAt;
  };

  const calculateAdherence = (med: Medication): number => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentLogs = med.doseLogs.filter(log =>
      new Date(log.timestamp) >= last30Days
    );

    if (recentLogs.length === 0) return 0;

    const takenCount = recentLogs.filter(log => log.taken).length;
    const expectedDoses = med.timesPerDay * 30;

    return expectedDoses > 0 ? Math.min(100, (takenCount / expectedDoses) * 100) : 0;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingDoses = getPendingDoses();

  const viewMedDetails = (med: Medication) => {
    setSelectedMed(med);
    setShowDetailModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>Med Reminder</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Pending Doses Section */}
        {pendingDoses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Doses</Text>
            {pendingDoses.map((dose, index) => (
              <View key={`${dose.medId}-${index}`} style={styles.pendingCard}>
                <View style={styles.pendingInfo}>
                  <Text style={styles.pendingName}>{dose.medName}</Text>
                  <Text style={styles.pendingDosage}>{dose.dosage}</Text>
                  <Text style={styles.pendingTime}>Scheduled: {dose.time}</Text>
                </View>
                <View style={styles.pendingActions}>
                  <TouchableOpacity
                    style={[styles.doseButton, styles.takeButton]}
                    onPress={() => logDose(dose.medId, true)}
                  >
                    <Text style={styles.doseButtonText}>Take</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.doseButton, styles.skipButton]}
                    onPress={() => logDose(dose.medId, false)}
                  >
                    <Text style={styles.doseButtonText}>Skip</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Medications List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Medications</Text>
          {medications.length === 0 ? (
            <Text style={styles.emptyText}>No medications added yet</Text>
          ) : (
            <FlatList
              data={medications}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const adherence = calculateAdherence(item);
                const refill = needsRefill(item);

                return (
                  <TouchableOpacity
                    style={styles.medCard}
                    onPress={() => viewMedDetails(item)}
                    onLongPress={() => deleteMedication(item.id)}
                  >
                    <View style={styles.medHeader}>
                      <View style={styles.medInfo}>
                        <Text style={styles.medName}>{item.name}</Text>
                        <Text style={styles.medDosage}>{item.dosage}</Text>
                      </View>
                      {refill && (
                        <View style={styles.refillBadge}>
                          <Text style={styles.refillText}>Refill!</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.medDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Frequency:</Text>
                        <Text style={styles.detailValue}>{item.frequency}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Remaining:</Text>
                        <Text style={[
                          styles.detailValue,
                          refill && styles.lowQuantity
                        ]}>
                          {item.quantity} doses
                        </Text>
                      </View>
                      {item.scheduledTimes.length > 0 && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Times:</Text>
                          <Text style={styles.detailValue}>
                            {item.scheduledTimes.join(', ')}
                          </Text>
                        </View>
                      )}
                    </View>

                    {item.doseLogs.length > 0 && (
                      <View style={styles.adherenceContainer}>
                        <Text style={styles.adherenceLabel}>
                          Adherence (30 days):
                        </Text>
                        <View style={styles.adherenceBar}>
                          <View
                            style={[
                              styles.adherenceFill,
                              { width: `${adherence}%` },
                              { backgroundColor: getAdherenceColor(adherence) }
                            ]}
                          />
                        </View>
                        <Text style={styles.adherencePercent}>
                          {adherence.toFixed(0)}%
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AdBanner />

      {/* Add Medication Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Medication</Text>

            <ScrollView>
              <Text style={styles.inputLabel}>Medication Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Aspirin"
              />

              <Text style={styles.inputLabel}>Dosage</Text>
              <TextInput
                style={styles.input}
                value={dosage}
                onChangeText={setDosage}
                placeholder="e.g., 100mg"
              />

              <Text style={styles.inputLabel}>Frequency</Text>
              <View style={styles.frequencySelector}>
                {(['Once Daily', 'Twice Daily', 'Three Times Daily', 'Four Times Daily', 'As Needed'] as Frequency[]).map(freq => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.frequencyButton,
                      frequency === freq && styles.frequencyButtonActive
                    ]}
                    onPress={() => {
                      setFrequency(freq);
                      setScheduledTimes(getDefaultTimes(freq));
                    }}
                  >
                    <Text style={[
                      styles.frequencyButtonText,
                      frequency === freq && styles.frequencyButtonTextActive
                    ]}>
                      {freq}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {scheduledTimes.length > 0 && (
                <>
                  <Text style={styles.inputLabel}>Scheduled Times</Text>
                  {scheduledTimes.map((time, index) => (
                    <TextInput
                      key={index}
                      style={styles.input}
                      value={time}
                      onChangeText={(text) => {
                        const newTimes = [...scheduledTimes];
                        newTimes[index] = text;
                        setScheduledTimes(newTimes);
                      }}
                      placeholder="HH:MM"
                    />
                  ))}
                </>
              )}

              <Text style={styles.inputLabel}>Initial Quantity (doses)</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="30"
                keyboardType="number-pad"
              />

              <Text style={styles.inputLabel}>Refill Alert At (doses remaining)</Text>
              <TextInput
                style={styles.input}
                value={refillAt}
                onChangeText={setRefillAt}
                placeholder="5"
                keyboardType="number-pad"
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={addMedication}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Medication Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedMed && (
              <>
                <Text style={styles.modalTitle}>{selectedMed.name}</Text>
                <ScrollView>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Information</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Dosage:</Text>
                      <Text style={styles.detailValue}>{selectedMed.dosage}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Frequency:</Text>
                      <Text style={styles.detailValue}>{selectedMed.frequency}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Remaining:</Text>
                      <Text style={styles.detailValue}>{selectedMed.quantity} doses</Text>
                    </View>
                    {selectedMed.scheduledTimes.length > 0 && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Times:</Text>
                        <Text style={styles.detailValue}>
                          {selectedMed.scheduledTimes.join(', ')}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>
                      Recent History ({selectedMed.doseLogs.length} logs)
                    </Text>
                    {selectedMed.doseLogs.slice(0, 10).map(log => (
                      <View key={log.id} style={styles.logEntry}>
                        <View style={[
                          styles.logIndicator,
                          { backgroundColor: log.taken ? colors.status.success : colors.status.warning }
                        ]} />
                        <View style={styles.logInfo}>
                          <Text style={styles.logStatus}>
                            {log.taken ? 'Taken' : 'Skipped'}
                          </Text>
                          <Text style={styles.logTime}>
                            {formatDate(log.timestamp)}
                          </Text>
                        </View>
                      </View>
                    ))}
                    {selectedMed.doseLogs.length === 0 && (
                      <Text style={styles.emptyText}>No history yet</Text>
                    )}
                  </View>
                </ScrollView>

                <TouchableOpacity
                  style={[styles.modalButton, styles.closeButton]}
                  onPress={() => setShowDetailModal(false)}
                >
                  <Text style={styles.addButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getAdherenceColor = (adherence: number): string => {
  if (adherence >= 80) return colors.status.success;
  if (adherence >= 60) return colors.status.warning;
  return colors.status.error;
};

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
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.gray.medium,
    fontSize: 16,
    marginTop: spacing.xl,
  },
  pendingCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.status.warning,
  },
  pendingInfo: {
    marginBottom: spacing.sm,
  },
  pendingName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  pendingDosage: {
    fontSize: 14,
    color: colors.gray.dark,
    marginTop: 2,
  },
  pendingTime: {
    fontSize: 12,
    color: colors.gray.dark,
    marginTop: 4,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  doseButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  takeButton: {
    backgroundColor: colors.status.success,
  },
  skipButton: {
    backgroundColor: colors.gray.medium,
  },
  doseButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  medCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  medHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  medDosage: {
    fontSize: 14,
    color: colors.gray.dark,
    marginTop: 2,
  },
  refillBadge: {
    backgroundColor: colors.status.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  refillText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  medDetails: {
    marginTop: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.gray.dark,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  lowQuantity: {
    color: colors.status.error,
  },
  adherenceContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray.light,
  },
  adherenceLabel: {
    fontSize: 12,
    color: colors.gray.dark,
    marginBottom: 4,
  },
  adherenceBar: {
    height: 8,
    backgroundColor: colors.gray.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  adherenceFill: {
    height: '100%',
  },
  adherencePercent: {
    fontSize: 12,
    color: colors.gray.dark,
    marginTop: 4,
    textAlign: 'right',
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
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  frequencySelector: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  frequencyButton: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
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
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray.light,
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  closeButton: {
    backgroundColor: colors.primary,
    marginTop: spacing.md,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailSection: {
    marginBottom: spacing.lg,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  logEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  logIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  logInfo: {
    flex: 1,
  },
  logStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  logTime: {
    fontSize: 12,
    color: colors.gray.dark,
    marginTop: 2,
  },
});
