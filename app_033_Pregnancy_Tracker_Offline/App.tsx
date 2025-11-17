import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

interface PregnancyData {
  dueDate: string;
  lastPeriod: string;
  calculationMethod: 'lmp' | 'conception';
}

interface Appointment {
  id: string;
  date: string;
  title: string;
  notes: string;
}

interface Symptom {
  id: string;
  date: string;
  symptom: string;
}

interface KickSession {
  id: string;
  date: string;
  count: number;
  duration: number;
}

const WEEK_INFO = [
  { week: 1, size: 'Poppy Seed', length: '0.1cm', development: 'Fertilization occurs' },
  { week: 4, size: 'Poppy Seed', length: '0.2cm', development: 'Implantation complete' },
  { week: 5, size: 'Sesame Seed', length: '0.3cm', development: 'Heart begins to beat' },
  { week: 6, size: 'Lentil', length: '0.6cm', development: 'Facial features forming' },
  { week: 7, size: 'Blueberry', length: '1.3cm', development: 'Arms and legs developing' },
  { week: 8, size: 'Raspberry', length: '1.6cm', development: 'All organs present' },
  { week: 9, size: 'Cherry', length: '2.3cm', development: 'Heartbeat detectable' },
  { week: 10, size: 'Strawberry', length: '3.1cm', development: 'Vital organs formed' },
  { week: 12, size: 'Lime', length: '5.4cm', development: 'Reflexes developing' },
  { week: 14, size: 'Lemon', length: '8.7cm', development: 'Can make facial expressions' },
  { week: 16, size: 'Avocado', length: '11.6cm', development: 'Can hear sounds' },
  { week: 18, size: 'Bell Pepper', length: '14.2cm', development: 'Can yawn and hiccup' },
  { week: 20, size: 'Banana', length: '16.4cm', development: 'Halfway there!' },
  { week: 22, size: 'Papaya', length: '27.8cm', development: 'Lips and eyelids formed' },
  { week: 24, size: 'Cantaloupe', length: '30cm', development: 'Lungs developing' },
  { week: 26, size: 'Lettuce', length: '35.6cm', development: 'Eyes opening' },
  { week: 28, size: 'Eggplant', length: '37.6cm', development: 'Can dream' },
  { week: 30, size: 'Cabbage', length: '39.9cm', development: 'Growing rapidly' },
  { week: 32, size: 'Squash', length: '42.4cm', development: 'Practicing breathing' },
  { week: 34, size: 'Pineapple', length: '45cm', development: 'Recognizes your voice' },
  { week: 36, size: 'Papaya', length: '47.4cm', development: 'Nearly ready' },
  { week: 38, size: 'Watermelon', length: '49.8cm', development: 'Full term!' },
  { week: 40, size: 'Pumpkin', length: '51.2cm', development: 'Due date!' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'symptoms' | 'appointments' | 'kicks'>('overview');
  const [pregnancyData, setPregnancyData] = useState<PregnancyData | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number>(0);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  // Setup
  const [showSetup, setShowSetup] = useState(true);
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [conceptionDate, setConceptionDate] = useState('');
  const [calculationMethod, setCalculationMethod] = useState<'lmp' | 'conception'>('lmp');

  // Symptoms
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [newSymptom, setNewSymptom] = useState('');

  // Appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [newAppointment, setNewAppointment] = useState({ date: '', title: '', notes: '' });

  // Kick counter
  const [kickCount, setKickCount] = useState(0);
  const [kickSessions, setKickSessions] = useState<KickSession[]>([]);
  const [kickStartTime, setKickStartTime] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (pregnancyData) {
      calculateWeek();
    }
  }, [pregnancyData]);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem('pregnancy_data');
      if (stored) {
        const data = JSON.parse(stored);
        setPregnancyData(data);
        setShowSetup(false);
      }

      const storedSymptoms = await AsyncStorage.getItem('pregnancy_symptoms');
      if (storedSymptoms) setSymptoms(JSON.parse(storedSymptoms));

      const storedAppointments = await AsyncStorage.getItem('pregnancy_appointments');
      if (storedAppointments) setAppointments(JSON.parse(storedAppointments));

      const storedKicks = await AsyncStorage.getItem('pregnancy_kicks');
      if (storedKicks) setKickSessions(JSON.parse(storedKicks));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const setupPregnancy = async () => {
    let dueDate: Date;

    if (calculationMethod === 'lmp') {
      if (!lastPeriodDate) {
        Alert.alert('Error', 'Please enter your last period date');
        return;
      }
      const lmp = new Date(lastPeriodDate);
      dueDate = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000);
    } else {
      if (!conceptionDate) {
        Alert.alert('Error', 'Please enter your conception date');
        return;
      }
      const conception = new Date(conceptionDate);
      dueDate = new Date(conception.getTime() + 266 * 24 * 60 * 60 * 1000);
    }

    const data: PregnancyData = {
      dueDate: dueDate.toISOString(),
      lastPeriod: calculationMethod === 'lmp' ? lastPeriodDate : '',
      calculationMethod,
    };

    setPregnancyData(data);
    await AsyncStorage.setItem('pregnancy_data', JSON.stringify(data));
    setShowSetup(false);
  };

  const calculateWeek = () => {
    if (!pregnancyData) return;

    const due = new Date(pregnancyData.dueDate);
    const today = new Date();
    const startDate = new Date(due.getTime() - 280 * 24 * 60 * 60 * 1000);

    const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const week = Math.floor(daysPassed / 7);
    const remaining = Math.floor((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

    setCurrentWeek(Math.min(Math.max(week, 1), 40));
    setDaysRemaining(Math.max(remaining, 0));
  };

  const addSymptom = async () => {
    if (!newSymptom.trim()) return;

    const symptom: Symptom = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      symptom: newSymptom,
    };

    const updated = [symptom, ...symptoms];
    setSymptoms(updated);
    await AsyncStorage.setItem('pregnancy_symptoms', JSON.stringify(updated));
    setNewSymptom('');
  };

  const deleteSymptom = async (id: string) => {
    const updated = symptoms.filter(s => s.id !== id);
    setSymptoms(updated);
    await AsyncStorage.setItem('pregnancy_symptoms', JSON.stringify(updated));
  };

  const addAppointment = async () => {
    if (!newAppointment.date || !newAppointment.title) {
      Alert.alert('Error', 'Please enter date and title');
      return;
    }

    const appointment: Appointment = {
      id: Date.now().toString(),
      ...newAppointment,
    };

    const updated = [appointment, ...appointments].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setAppointments(updated);
    await AsyncStorage.setItem('pregnancy_appointments', JSON.stringify(updated));
    setNewAppointment({ date: '', title: '', notes: '' });
  };

  const deleteAppointment = async (id: string) => {
    const updated = appointments.filter(a => a.id !== id);
    setAppointments(updated);
    await AsyncStorage.setItem('pregnancy_appointments', JSON.stringify(updated));
  };

  const startKickCounter = () => {
    setKickCount(0);
    setKickStartTime(Date.now());
  };

  const addKick = () => {
    setKickCount(prev => prev + 1);
  };

  const saveKickSession = async () => {
    if (kickStartTime === null) return;

    const duration = Math.floor((Date.now() - kickStartTime) / 1000 / 60);

    const session: KickSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      count: kickCount,
      duration,
    };

    const updated = [session, ...kickSessions].slice(0, 50);
    setKickSessions(updated);
    await AsyncStorage.setItem('pregnancy_kicks', JSON.stringify(updated));

    setKickCount(0);
    setKickStartTime(null);

    Alert.alert('Session Saved', `${kickCount} kicks in ${duration} minutes`);
  };

  const resetPregnancy = async () => {
    Alert.alert('Reset', 'Are you sure you want to reset all pregnancy data?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove([
            'pregnancy_data',
            'pregnancy_symptoms',
            'pregnancy_appointments',
            'pregnancy_kicks',
          ]);
          setPregnancyData(null);
          setSymptoms([]);
          setAppointments([]);
          setKickSessions([]);
          setShowSetup(true);
        },
      },
    ]);
  };

  const getWeekInfo = () => {
    return WEEK_INFO.find(w => w.week === currentWeek) || WEEK_INFO[WEEK_INFO.length - 1];
  };

  if (showSetup) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Pregnancy Tracker</Text>
            <Text style={styles.subtitle}>Let's calculate your due date</Text>
          </View>

          <View style={styles.methodSelector}>
            <TouchableOpacity
              style={[styles.methodButton, calculationMethod === 'lmp' && styles.methodButtonActive]}
              onPress={() => setCalculationMethod('lmp')}
            >
              <Text style={[styles.methodButtonText, calculationMethod === 'lmp' && styles.methodButtonTextActive]}>
                Last Period
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.methodButton, calculationMethod === 'conception' && styles.methodButtonActive]}
              onPress={() => setCalculationMethod('conception')}
            >
              <Text style={[styles.methodButtonText, calculationMethod === 'conception' && styles.methodButtonTextActive]}>
                Conception Date
              </Text>
            </TouchableOpacity>
          </View>

          {calculationMethod === 'lmp' ? (
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Last Period Date</Text>
              <Text style={styles.inputHint}>Format: YYYY-MM-DD</Text>
              <TextInput
                style={styles.input}
                placeholder="2024-01-15"
                placeholderTextColor="#6B7280"
                value={lastPeriodDate}
                onChangeText={setLastPeriodDate}
              />
            </View>
          ) : (
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Conception Date</Text>
              <Text style={styles.inputHint}>Format: YYYY-MM-DD</Text>
              <TextInput
                style={styles.input}
                placeholder="2024-01-29"
                placeholderTextColor="#6B7280"
                value={conceptionDate}
                onChangeText={setConceptionDate}
              />
            </View>
          )}

          <TouchableOpacity style={styles.primaryButton} onPress={setupPregnancy}>
            <Text style={styles.primaryButtonText}>Calculate Due Date</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const weekInfo = getWeekInfo();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'symptoms' && styles.tabActive]}
          onPress={() => setActiveTab('symptoms')}
        >
          <Text style={[styles.tabText, activeTab === 'symptoms' && styles.tabTextActive]}>Symptoms</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'appointments' && styles.tabActive]}
          onPress={() => setActiveTab('appointments')}
        >
          <Text style={[styles.tabText, activeTab === 'appointments' && styles.tabTextActive]}>Appointments</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'kicks' && styles.tabActive]}
          onPress={() => setActiveTab('kicks')}
        >
          <Text style={[styles.tabText, activeTab === 'kicks' && styles.tabTextActive]}>Kicks</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'overview' && (
          <>
            <View style={styles.weekCard}>
              <Text style={styles.weekNumber}>Week {currentWeek}</Text>
              <Text style={styles.weekSubtitle}>of 40</Text>
              <Text style={styles.daysRemaining}>{daysRemaining} days remaining</Text>
              <Text style={styles.dueDate}>
                Due: {new Date(pregnancyData!.dueDate).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.babyCard}>
              <Text style={styles.cardTitle}>Your Baby This Week</Text>
              <View style={styles.sizeInfo}>
                <Text style={styles.sizeEmoji}>🍎</Text>
                <View>
                  <Text style={styles.sizeText}>Size of a {weekInfo.size}</Text>
                  <Text style={styles.lengthText}>About {weekInfo.length} long</Text>
                </View>
              </View>
              <Text style={styles.developmentText}>{weekInfo.development}</Text>
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={resetPregnancy}>
              <Text style={styles.resetButtonText}>Reset Pregnancy Data</Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'symptoms' && (
          <>
            <View style={styles.inputCard}>
              <Text style={styles.cardTitle}>Log a Symptom</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Nausea, Fatigue, Back pain"
                placeholderTextColor="#6B7280"
                value={newSymptom}
                onChangeText={setNewSymptom}
              />
              <TouchableOpacity style={styles.addButton} onPress={addSymptom}>
                <Text style={styles.addButtonText}>Add Symptom</Text>
              </TouchableOpacity>
            </View>

            {symptoms.map(symptom => (
              <View key={symptom.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemText}>{symptom.symptom}</Text>
                  <Text style={styles.listItemDate}>
                    {new Date(symptom.date).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => deleteSymptom(symptom.id)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {activeTab === 'appointments' && (
          <>
            <View style={styles.inputCard}>
              <Text style={styles.cardTitle}>Schedule Appointment</Text>
              <TextInput
                style={styles.input}
                placeholder="Date (YYYY-MM-DD)"
                placeholderTextColor="#6B7280"
                value={newAppointment.date}
                onChangeText={(text) => setNewAppointment({ ...newAppointment, date: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Title (e.g., Ultrasound)"
                placeholderTextColor="#6B7280"
                value={newAppointment.title}
                onChangeText={(text) => setNewAppointment({ ...newAppointment, title: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Notes (optional)"
                placeholderTextColor="#6B7280"
                value={newAppointment.notes}
                onChangeText={(text) => setNewAppointment({ ...newAppointment, notes: text })}
                multiline
              />
              <TouchableOpacity style={styles.addButton} onPress={addAppointment}>
                <Text style={styles.addButtonText}>Add Appointment</Text>
              </TouchableOpacity>
            </View>

            {appointments.map(apt => (
              <View key={apt.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{apt.title}</Text>
                  <Text style={styles.listItemDate}>{new Date(apt.date).toLocaleDateString()}</Text>
                  {apt.notes ? <Text style={styles.listItemNotes}>{apt.notes}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => deleteAppointment(apt.id)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {activeTab === 'kicks' && (
          <>
            <View style={styles.kickCard}>
              <Text style={styles.cardTitle}>Kick Counter</Text>
              {kickStartTime === null ? (
                <TouchableOpacity style={styles.startButton} onPress={startKickCounter}>
                  <Text style={styles.startButtonText}>Start Counting Kicks</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <View style={styles.kickCounter}>
                    <Text style={styles.kickCount}>{kickCount}</Text>
                    <Text style={styles.kickLabel}>kicks</Text>
                  </View>
                  <TouchableOpacity style={styles.kickButton} onPress={addKick}>
                    <Text style={styles.kickButtonText}>TAP FOR EACH KICK</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={saveKickSession}>
                    <Text style={styles.saveButtonText}>Save Session</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <Text style={styles.historyTitle}>Recent Sessions</Text>
            {kickSessions.map(session => (
              <View key={session.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemText}>
                    {session.count} kicks in {session.duration} min
                  </Text>
                  <Text style={styles.listItemDate}>
                    {new Date(session.date).toLocaleDateString()} {new Date(session.date).toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <View style={styles.adContainer}>
        <BannerAd unitId={TestIds.BANNER} size={BannerAdSize.BANNER} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
  },
  methodSelector: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 4,
    marginBottom: 30,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  methodButtonActive: {
    backgroundColor: '#EC4899',
  },
  methodButtonText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  methodButtonTextActive: {
    color: '#FFFFFF',
  },
  inputSection: {
    marginBottom: 25,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  inputHint: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: '#EC4899',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#EC4899',
    borderRadius: 8,
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  weekCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#EC4899',
  },
  weekNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#EC4899',
  },
  weekSubtitle: {
    fontSize: 20,
    color: '#94A3B8',
    marginBottom: 15,
  },
  daysRemaining: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  dueDate: {
    fontSize: 16,
    color: '#94A3B8',
  },
  babyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  sizeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sizeEmoji: {
    fontSize: 48,
    marginRight: 15,
  },
  sizeText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  lengthText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  developmentText: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 22,
  },
  inputCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#EC4899',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listItem: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  listItemText: {
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 4,
  },
  listItemDate: {
    color: '#94A3B8',
    fontSize: 13,
  },
  listItemNotes: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
  },
  deleteText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  kickCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: '#EC4899',
    borderRadius: 12,
    padding: 18,
    width: '100%',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  kickCounter: {
    alignItems: 'center',
    marginBottom: 25,
  },
  kickCount: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#EC4899',
  },
  kickLabel: {
    fontSize: 20,
    color: '#94A3B8',
  },
  kickButton: {
    backgroundColor: '#EC4899',
    borderRadius: 100,
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  kickButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    padding: 15,
    width: '100%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  resetButton: {
    backgroundColor: '#334155',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  adContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 5,
  },
});
