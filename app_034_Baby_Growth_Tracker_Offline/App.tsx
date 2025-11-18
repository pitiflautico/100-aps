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

interface BabyProfile {
  name: string;
  birthDate: string;
  gender: 'boy' | 'girl';
}

interface GrowthRecord {
  id: string;
  date: string;
  weight: number;
  height: number;
  headCirc: number;
}

interface Milestone {
  id: string;
  age: string;
  milestone: string;
  completed: boolean;
}

interface FeedingLog {
  id: string;
  date: string;
  type: 'breast' | 'bottle';
  amount?: string;
  duration?: string;
}

interface SleepLog {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
}

const DEFAULT_MILESTONES: Milestone[] = [
  { id: '1', age: '0-3 months', milestone: 'Lifts head when on tummy', completed: false },
  { id: '2', age: '0-3 months', milestone: 'Opens and shuts hands', completed: false },
  { id: '3', age: '0-3 months', milestone: 'Smiles at people', completed: false },
  { id: '4', age: '3-6 months', milestone: 'Rolls over', completed: false },
  { id: '5', age: '3-6 months', milestone: 'Babbles and imitates sounds', completed: false },
  { id: '6', age: '3-6 months', milestone: 'Sits without support', completed: false },
  { id: '7', age: '6-12 months', milestone: 'Crawls', completed: false },
  { id: '8', age: '6-12 months', milestone: 'Says "mama" or "dada"', completed: false },
  { id: '9', age: '6-12 months', milestone: 'Pulls to stand', completed: false },
  { id: '10', age: '12-18 months', milestone: 'Walks independently', completed: false },
  { id: '11', age: '12-18 months', milestone: 'Points to objects', completed: false },
  { id: '12', age: '18-24 months', milestone: 'Runs', completed: false },
  { id: '13', age: '18-24 months', milestone: 'Says several single words', completed: false },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'profile' | 'growth' | 'milestones' | 'feeding' | 'sleep'>('profile');
  const [profile, setProfile] = useState<BabyProfile | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(true);
  const [profileForm, setProfileForm] = useState({ name: '', birthDate: '', gender: 'boy' as 'boy' | 'girl' });

  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([]);
  const [newGrowth, setNewGrowth] = useState({ date: '', weight: '', height: '', headCirc: '' });

  const [milestones, setMilestones] = useState<Milestone[]>(DEFAULT_MILESTONES);

  const [feedingLogs, setFeedingLogs] = useState<FeedingLog[]>([]);
  const [newFeeding, setNewFeeding] = useState({ date: '', type: 'breast' as 'breast' | 'bottle', amount: '', duration: '' });

  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [newSleep, setNewSleep] = useState({ date: '', startTime: '', endTime: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedProfile = await AsyncStorage.getItem('baby_profile');
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
        setShowProfileForm(false);
      }

      const storedGrowth = await AsyncStorage.getItem('growth_records');
      if (storedGrowth) setGrowthRecords(JSON.parse(storedGrowth));

      const storedMilestones = await AsyncStorage.getItem('milestones');
      if (storedMilestones) setMilestones(JSON.parse(storedMilestones));

      const storedFeeding = await AsyncStorage.getItem('feeding_logs');
      if (storedFeeding) setFeedingLogs(JSON.parse(storedFeeding));

      const storedSleep = await AsyncStorage.getItem('sleep_logs');
      if (storedSleep) setSleepLogs(JSON.parse(storedSleep));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveProfile = async () => {
    if (!profileForm.name || !profileForm.birthDate) {
      Alert.alert('Error', 'Please enter name and birth date');
      return;
    }

    const newProfile: BabyProfile = {
      name: profileForm.name,
      birthDate: profileForm.birthDate,
      gender: profileForm.gender,
    };

    setProfile(newProfile);
    await AsyncStorage.setItem('baby_profile', JSON.stringify(newProfile));
    setShowProfileForm(false);
  };

  const addGrowthRecord = async () => {
    if (!newGrowth.date || !newGrowth.weight || !newGrowth.height) {
      Alert.alert('Error', 'Please enter date, weight, and height');
      return;
    }

    const record: GrowthRecord = {
      id: Date.now().toString(),
      date: newGrowth.date,
      weight: parseFloat(newGrowth.weight),
      height: parseFloat(newGrowth.height),
      headCirc: parseFloat(newGrowth.headCirc) || 0,
    };

    const updated = [record, ...growthRecords].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    setGrowthRecords(updated);
    await AsyncStorage.setItem('growth_records', JSON.stringify(updated));
    setNewGrowth({ date: '', weight: '', height: '', headCirc: '' });
  };

  const toggleMilestone = async (id: string) => {
    const updated = milestones.map(m =>
      m.id === id ? { ...m, completed: !m.completed } : m
    );
    setMilestones(updated);
    await AsyncStorage.setItem('milestones', JSON.stringify(updated));
  };

  const addFeedingLog = async () => {
    if (!newFeeding.date) {
      Alert.alert('Error', 'Please enter date');
      return;
    }

    const log: FeedingLog = {
      id: Date.now().toString(),
      date: newFeeding.date,
      type: newFeeding.type,
      amount: newFeeding.amount,
      duration: newFeeding.duration,
    };

    const updated = [log, ...feedingLogs];
    setFeedingLogs(updated);
    await AsyncStorage.setItem('feeding_logs', JSON.stringify(updated));
    setNewFeeding({ date: '', type: 'breast', amount: '', duration: '' });
  };

  const addSleepLog = async () => {
    if (!newSleep.date || !newSleep.startTime || !newSleep.endTime) {
      Alert.alert('Error', 'Please enter all fields');
      return;
    }

    const start = new Date(`${newSleep.date}T${newSleep.startTime}`);
    const end = new Date(`${newSleep.date}T${newSleep.endTime}`);
    const duration = Math.abs(end.getTime() - start.getTime()) / (1000 * 60);

    const log: SleepLog = {
      id: Date.now().toString(),
      date: newSleep.date,
      startTime: newSleep.startTime,
      endTime: newSleep.endTime,
      duration,
    };

    const updated = [log, ...sleepLogs];
    setSleepLogs(updated);
    await AsyncStorage.setItem('sleep_logs', JSON.stringify(updated));
    setNewSleep({ date: '', startTime: '', endTime: '' });
  };

  const calculateAge = () => {
    if (!profile) return '';
    const birth = new Date(profile.birthDate);
    const today = new Date();
    const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    if (months < 1) {
      const days = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
      return `${days} days old`;
    }
    if (months < 24) return `${months} months old`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''} old`;
  };

  const getGrowthPercentile = (value: number, type: 'weight' | 'height') => {
    if (type === 'weight') {
      if (value < 3) return '3rd';
      if (value < 5) return '10th';
      if (value < 7) return '25th';
      if (value < 9) return '50th';
      if (value < 11) return '75th';
      if (value < 13) return '90th';
      return '97th';
    } else {
      if (value < 50) return '3rd';
      if (value < 55) return '10th';
      if (value < 60) return '25th';
      if (value < 65) return '50th';
      if (value < 70) return '75th';
      if (value < 75) return '90th';
      return '97th';
    }
  };

  if (showProfileForm) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Baby Growth Tracker</Text>
            <Text style={styles.subtitle}>Create your baby's profile</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Baby's Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter baby's name"
              placeholderTextColor="#6B7280"
              value={profileForm.name}
              onChangeText={(text) => setProfileForm({ ...profileForm, name: text })}
            />

            <Text style={styles.label}>Birth Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2024-01-15"
              placeholderTextColor="#6B7280"
              value={profileForm.birthDate}
              onChangeText={(text) => setProfileForm({ ...profileForm, birthDate: text })}
            />

            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderToggle}>
              <TouchableOpacity
                style={[styles.genderButton, profileForm.gender === 'boy' && styles.genderButtonActive]}
                onPress={() => setProfileForm({ ...profileForm, gender: 'boy' })}
              >
                <Text style={[styles.genderButtonText, profileForm.gender === 'boy' && styles.genderButtonTextActive]}>
                  Boy
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderButton, profileForm.gender === 'girl' && styles.genderButtonActive]}
                onPress={() => setProfileForm({ ...profileForm, gender: 'girl' })}
              >
                <Text style={[styles.genderButtonText, profileForm.gender === 'girl' && styles.genderButtonTextActive]}>
                  Girl
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={saveProfile}>
              <Text style={styles.primaryButtonText}>Create Profile</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'growth' && styles.tabActive]}
          onPress={() => setActiveTab('growth')}
        >
          <Text style={[styles.tabText, activeTab === 'growth' && styles.tabTextActive]}>Growth</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'milestones' && styles.tabActive]}
          onPress={() => setActiveTab('milestones')}
        >
          <Text style={[styles.tabText, activeTab === 'milestones' && styles.tabTextActive]}>Milestones</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feeding' && styles.tabActive]}
          onPress={() => setActiveTab('feeding')}
        >
          <Text style={[styles.tabText, activeTab === 'feeding' && styles.tabTextActive]}>Feeding</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sleep' && styles.tabActive]}
          onPress={() => setActiveTab('sleep')}
        >
          <Text style={[styles.tabText, activeTab === 'sleep' && styles.tabTextActive]}>Sleep</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'profile' && profile && (
          <>
            <View style={styles.profileCard}>
              <Text style={styles.babyName}>{profile.name}</Text>
              <Text style={styles.babyAge}>{calculateAge()}</Text>
              <Text style={styles.babyGender}>{profile.gender === 'boy' ? 'Boy' : 'Girl'}</Text>
              <Text style={styles.birthDate}>Born: {new Date(profile.birthDate).toLocaleDateString()}</Text>
            </View>

            {growthRecords.length > 0 && (
              <View style={styles.statsCard}>
                <Text style={styles.cardTitle}>Latest Measurements</Text>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Weight:</Text>
                  <Text style={styles.statValue}>{growthRecords[growthRecords.length - 1].weight} kg</Text>
                  <Text style={styles.percentile}>
                    {getGrowthPercentile(growthRecords[growthRecords.length - 1].weight, 'weight')} percentile
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Height:</Text>
                  <Text style={styles.statValue}>{growthRecords[growthRecords.length - 1].height} cm</Text>
                  <Text style={styles.percentile}>
                    {getGrowthPercentile(growthRecords[growthRecords.length - 1].height, 'height')} percentile
                  </Text>
                </View>
                {growthRecords[growthRecords.length - 1].headCirc > 0 && (
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Head:</Text>
                    <Text style={styles.statValue}>{growthRecords[growthRecords.length - 1].headCirc} cm</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {activeTab === 'growth' && (
          <>
            <View style={styles.inputCard}>
              <Text style={styles.cardTitle}>Add Growth Record</Text>
              <TextInput
                style={styles.input}
                placeholder="Date (YYYY-MM-DD)"
                placeholderTextColor="#6B7280"
                value={newGrowth.date}
                onChangeText={(text) => setNewGrowth({ ...newGrowth, date: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Weight (kg)"
                placeholderTextColor="#6B7280"
                keyboardType="decimal-pad"
                value={newGrowth.weight}
                onChangeText={(text) => setNewGrowth({ ...newGrowth, weight: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Height (cm)"
                placeholderTextColor="#6B7280"
                keyboardType="decimal-pad"
                value={newGrowth.height}
                onChangeText={(text) => setNewGrowth({ ...newGrowth, height: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Head Circumference (cm) - optional"
                placeholderTextColor="#6B7280"
                keyboardType="decimal-pad"
                value={newGrowth.headCirc}
                onChangeText={(text) => setNewGrowth({ ...newGrowth, headCirc: text })}
              />
              <TouchableOpacity style={styles.addButton} onPress={addGrowthRecord}>
                <Text style={styles.addButtonText}>Add Record</Text>
              </TouchableOpacity>
            </View>

            {growthRecords.map((record) => (
              <View key={record.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemDate}>{new Date(record.date).toLocaleDateString()}</Text>
                  <Text style={styles.listItemText}>Weight: {record.weight} kg - Height: {record.height} cm</Text>
                  {record.headCirc > 0 && <Text style={styles.listItemText}>Head: {record.headCirc} cm</Text>}
                </View>
              </View>
            ))}
          </>
        )}

        {activeTab === 'milestones' && (
          <>
            <Text style={styles.sectionTitle}>Developmental Milestones</Text>
            {milestones.map((milestone) => (
              <TouchableOpacity
                key={milestone.id}
                style={[styles.milestoneItem, milestone.completed && styles.milestoneCompleted]}
                onPress={() => toggleMilestone(milestone.id)}
              >
                <View style={styles.checkbox}>
                  {milestone.completed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.milestoneContent}>
                  <Text style={[styles.milestoneText, milestone.completed && styles.milestoneTextCompleted]}>
                    {milestone.milestone}
                  </Text>
                  <Text style={styles.milestoneAge}>{milestone.age}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {activeTab === 'feeding' && (
          <>
            <View style={styles.inputCard}>
              <Text style={styles.cardTitle}>Log Feeding</Text>
              <TextInput
                style={styles.input}
                placeholder="Date (YYYY-MM-DD)"
                placeholderTextColor="#6B7280"
                value={newFeeding.date}
                onChangeText={(text) => setNewFeeding({ ...newFeeding, date: text })}
              />
              <View style={styles.typeToggle}>
                <TouchableOpacity
                  style={[styles.typeButton, newFeeding.type === 'breast' && styles.typeButtonActive]}
                  onPress={() => setNewFeeding({ ...newFeeding, type: 'breast' })}
                >
                  <Text style={[styles.typeButtonText, newFeeding.type === 'breast' && styles.typeButtonTextActive]}>
                    Breastfeeding
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, newFeeding.type === 'bottle' && styles.typeButtonActive]}
                  onPress={() => setNewFeeding({ ...newFeeding, type: 'bottle' })}
                >
                  <Text style={[styles.typeButtonText, newFeeding.type === 'bottle' && styles.typeButtonTextActive]}>
                    Bottle
                  </Text>
                </TouchableOpacity>
              </View>
              {newFeeding.type === 'breast' ? (
                <TextInput
                  style={styles.input}
                  placeholder="Duration (e.g., 15 min)"
                  placeholderTextColor="#6B7280"
                  value={newFeeding.duration}
                  onChangeText={(text) => setNewFeeding({ ...newFeeding, duration: text })}
                />
              ) : (
                <TextInput
                  style={styles.input}
                  placeholder="Amount (e.g., 120 ml)"
                  placeholderTextColor="#6B7280"
                  value={newFeeding.amount}
                  onChangeText={(text) => setNewFeeding({ ...newFeeding, amount: text })}
                />
              )}
              <TouchableOpacity style={styles.addButton} onPress={addFeedingLog}>
                <Text style={styles.addButtonText}>Add Feeding</Text>
              </TouchableOpacity>
            </View>

            {feedingLogs.map((log) => (
              <View key={log.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemDate}>{new Date(log.date).toLocaleDateString()}</Text>
                  <Text style={styles.listItemText}>
                    {log.type === 'breast' ? 'Breastfeeding' : 'Bottle'}
                    {log.duration && ` - ${log.duration}`}
                    {log.amount && ` - ${log.amount}`}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {activeTab === 'sleep' && (
          <>
            <View style={styles.inputCard}>
              <Text style={styles.cardTitle}>Log Sleep</Text>
              <TextInput
                style={styles.input}
                placeholder="Date (YYYY-MM-DD)"
                placeholderTextColor="#6B7280"
                value={newSleep.date}
                onChangeText={(text) => setNewSleep({ ...newSleep, date: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Start Time (HH:MM)"
                placeholderTextColor="#6B7280"
                value={newSleep.startTime}
                onChangeText={(text) => setNewSleep({ ...newSleep, startTime: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="End Time (HH:MM)"
                placeholderTextColor="#6B7280"
                value={newSleep.endTime}
                onChangeText={(text) => setNewSleep({ ...newSleep, endTime: text })}
              />
              <TouchableOpacity style={styles.addButton} onPress={addSleepLog}>
                <Text style={styles.addButtonText}>Add Sleep</Text>
              </TouchableOpacity>
            </View>

            {sleepLogs.map((log) => (
              <View key={log.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemDate}>{new Date(log.date).toLocaleDateString()}</Text>
                  <Text style={styles.listItemText}>
                    {log.startTime} - {log.endTime} ({Math.round(log.duration)} min)
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
  formSection: {
    marginBottom: 20,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  genderToggle: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 4,
    marginBottom: 25,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  genderButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  genderButtonText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: '#8B5CF6',
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
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  profileCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  babyName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  babyAge: {
    fontSize: 20,
    color: '#8B5CF6',
    marginBottom: 8,
  },
  babyGender: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 4,
  },
  birthDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsCard: {
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
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 16,
    color: '#94A3B8',
    width: 70,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  percentile: {
    fontSize: 14,
    color: '#8B5CF6',
  },
  inputCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#8B5CF6',
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
  },
  listItemContent: {
    flex: 1,
  },
  listItemDate: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 6,
  },
  listItemText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  milestoneItem: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneCompleted: {
    backgroundColor: '#1F2937',
    opacity: 0.7,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneText: {
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 4,
  },
  milestoneTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  milestoneAge: {
    color: '#6B7280',
    fontSize: 13,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 4,
    marginBottom: 15,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  typeButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
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
