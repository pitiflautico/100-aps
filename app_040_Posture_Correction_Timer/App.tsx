import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

interface Exercise { id: string; name: string; description: string; }
interface CheckRecord { id: string; date: string; }

const EXERCISES: Exercise[] = [
  { id: '1', name: 'Shoulder Rolls', description: 'Roll shoulders backward 10 times' },
  { id: '2', name: 'Chin Tucks', description: 'Pull chin straight back, hold 5 seconds' },
  { id: '3', name: 'Chest Opener', description: 'Clasp hands behind back, lift arms' },
  { id: '4', name: 'Neck Stretch', description: 'Tilt head side to side, hold 10 sec each' },
  { id: '5', name: 'Wall Angels', description: 'Stand against wall, move arms up and down' },
];

export default function App() {
  const [interval, setInterval] = useState(30);
  const [isActive, setIsActive] = useState(false);
  const [timeUntilCheck, setTimeUntilCheck] = useState(0);
  const [checks, setChecks] = useState<CheckRecord[]>([]);
  const [todayChecks, setTodayChecks] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showExercise, setShowExercise] = useState(false);

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive && timeUntilCheck > 0) {
      timer = setInterval(() => setTimeUntilCheck(t => t - 1), 1000);
    } else if (timeUntilCheck === 0 && isActive) {
      showPostureCheck();
    }
    return () => clearInterval(timer);
  }, [isActive, timeUntilCheck]);

  const loadData = async () => {
    const stored = await AsyncStorage.getItem('posture_checks');
    if (stored) {
      const data: CheckRecord[] = JSON.parse(stored);
      setChecks(data);
      calculateStats(data);
    }
  };

  const calculateStats = (data: CheckRecord[]) => {
    const today = new Date().toDateString();
    const todayCount = data.filter(c => new Date(c.date).toDateString() === today).length;
    setTodayChecks(todayCount);

    let currentStreak = 0;
    const dates = [...new Set(data.map(c => new Date(c.date).toDateString()))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    for (let i = 0; i < dates.length; i++) {
      const date = new Date(dates[i]);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      if (date.toDateString() === expectedDate.toDateString()) {
        currentStreak++;
      } else {
        break;
      }
    }
    setStreak(currentStreak);
  };

  const startTimer = () => {
    setTimeUntilCheck(interval * 60);
    setIsActive(true);
  };

  const stopTimer = () => {
    setIsActive(false);
    setTimeUntilCheck(0);
  };

  const showPostureCheck = () => {
    setShowExercise(true);
    setTimeUntilCheck(interval * 60);
  };

  const completeCheck = async () => {
    const record: CheckRecord = { id: Date.now().toString(), date: new Date().toISOString() };
    const newChecks = [record, ...checks];
    setChecks(newChecks);
    await AsyncStorage.setItem('posture_checks', JSON.stringify(newChecks));
    calculateStats(newChecks);
    setShowExercise(false);
  };

  const skipCheck = () => {
    setShowExercise(false);
  };

  if (showExercise) {
    const exercise = EXERCISES[Math.floor(Math.random() * EXERCISES.length)];
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.exerciseContainer}>
          <Text style={styles.exerciseTitle}>Posture Check!</Text>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseDescription}>{exercise.description}</Text>
          <TouchableOpacity style={styles.doneButton} onPress={completeCheck}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={skipCheck}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.adContainer}>
          <BannerAd unitId={TestIds.BANNER} size={BannerAdSize.BANNER} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Posture Correction</Text>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{todayChecks}</Text>
            <Text style={styles.statLabel}>Today's Checks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        <View style={styles.intervalCard}>
          <Text style={styles.cardTitle}>Reminder Interval</Text>
          <View style={styles.intervalButtons}>
            {[5, 15, 30, 45, 60].map(min => (
              <TouchableOpacity key={min} style={[styles.intervalButton, interval === min && styles.intervalButtonActive]} onPress={() => setInterval(min)}>
                <Text style={[styles.intervalButtonText, interval === min && styles.intervalButtonTextActive]}>{min}m</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isActive ? (
          <>
            <View style={styles.timerCard}>
              <Text style={styles.timerTitle}>Next Check In</Text>
              <Text style={styles.timerValue}>{Math.floor(timeUntilCheck / 60)}:{(timeUntilCheck % 60).toString().padStart(2, '0')}</Text>
            </View>
            <TouchableOpacity style={styles.stopButton} onPress={stopTimer}>
              <Text style={styles.stopButtonText}>Stop Timer</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.startButton} onPress={startTimer}>
            <Text style={styles.startButtonText}>Start Reminders</Text>
          </TouchableOpacity>
        )}

        <View style={styles.exerciseListCard}>
          <Text style={styles.cardTitle}>Posture Exercises</Text>
          {EXERCISES.map(exercise => (
            <View key={exercise.id} style={styles.exerciseItem}>
              <Text style={styles.exerciseItemName}>{exercise.name}</Text>
              <Text style={styles.exerciseItemDescription}>{exercise.description}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.historyTitle}>Recent Checks</Text>
        {checks.slice(0, 10).map(check => (
          <View key={check.id} style={styles.historyItem}>
            <Text style={styles.historyDate}>
              {new Date(check.date).toLocaleDateString()} {new Date(check.date).toLocaleTimeString()}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.adContainer}>
        <BannerAd unitId={TestIds.BANNER} size={BannerAdSize.BANNER} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scrollContent: { padding: 20, paddingBottom: 80 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 20, textAlign: 'center' },
  statsCard: { flexDirection: 'row', backgroundColor: '#1E293B', borderRadius: 16, padding: 20, marginBottom: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 36, fontWeight: 'bold', color: '#14B8A6', marginBottom: 5 },
  statLabel: { fontSize: 14, color: '#94A3B8' },
  intervalCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 15 },
  intervalButtons: { flexDirection: 'row', gap: 10 },
  intervalButton: { flex: 1, backgroundColor: '#334155', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  intervalButtonActive: { backgroundColor: '#14B8A6' },
  intervalButtonText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  intervalButtonTextActive: { color: '#FFFFFF' },
  timerCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 30, marginBottom: 20, alignItems: 'center' },
  timerTitle: { fontSize: 18, color: '#94A3B8', marginBottom: 10 },
  timerValue: { fontSize: 48, fontWeight: 'bold', color: '#14B8A6' },
  startButton: { backgroundColor: '#14B8A6', borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 20 },
  startButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  stopButton: { backgroundColor: '#EF4444', borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 20 },
  stopButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  exerciseListCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, marginBottom: 20 },
  exerciseItem: { marginBottom: 15 },
  exerciseItemName: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  exerciseItemDescription: { fontSize: 14, color: '#94A3B8' },
  historyTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 15 },
  historyItem: { backgroundColor: '#1E293B', borderRadius: 10, padding: 12, marginBottom: 8 },
  historyDate: { fontSize: 14, color: '#94A3B8' },
  exerciseContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  exerciseTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 30 },
  exerciseName: { fontSize: 24, fontWeight: 'bold', color: '#14B8A6', marginBottom: 20, textAlign: 'center' },
  exerciseDescription: { fontSize: 18, color: '#94A3B8', marginBottom: 40, textAlign: 'center' },
  doneButton: { backgroundColor: '#14B8A6', borderRadius: 12, paddingVertical: 18, paddingHorizontal: 60, marginBottom: 15 },
  doneButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  skipButton: { backgroundColor: '#334155', borderRadius: 12, paddingVertical: 15, paddingHorizontal: 50 },
  skipButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  adContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', backgroundColor: '#0F172A', paddingVertical: 5 },
});
