import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

interface WorkoutPreset { id: string; name: string; work: number; rest: number; rounds: number; exercises: string[]; }
interface WorkoutHistory { id: string; presetName: string; date: string; duration: number; completed: boolean; }

const PRESETS: WorkoutPreset[] = [
  { id: '1', name: 'HIIT', work: 30, rest: 15, rounds: 8, exercises: ['Jumping Jacks', 'Push-ups', 'Squats', 'Burpees', 'Mountain Climbers', 'Plank', 'High Knees', 'Rest'] },
  { id: '2', name: 'Tabata', work: 20, rest: 10, rounds: 8, exercises: ['Burpees', 'Jump Squats', 'Push-ups', 'Mountain Climbers', 'Jumping Lunges', 'Plank Jacks', 'High Knees', 'Rest'] },
  { id: '3', name: 'Strength', work: 45, rest: 15, rounds: 6, exercises: ['Push-ups', 'Squats', 'Lunges', 'Plank', 'Tricep Dips', 'Crunches'] },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'timer' | 'custom' | 'history'>('timer');
  const [selectedPreset, setSelectedPreset] = useState<WorkoutPreset>(PRESETS[0]);
  const [customWork, setCustomWork] = useState('30');
  const [customRest, setCustomRest] = useState('15');
  const [customRounds, setCustomRounds] = useState('8');
  const [exercises, setExercises] = useState<string[]>(['Exercise 1']);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [history, setHistory] = useState<WorkoutHistory[]>([]);
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => { loadHistory(); }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !isPaused && timeLeft > 0) {
      interval = setInterval(() => { setTimeLeft(t => t - 1); }, 1000);
    } else if (timeLeft === 0 && isRunning && !isPaused) {
      handleTimerEnd();
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused, timeLeft]);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('workout_history');
      if (stored) setHistory(JSON.parse(stored));
    } catch (error) { console.error('Error loading history:', error); }
  };

  const handleTimerEnd = () => {
    if (isResting) {
      setIsResting(false);
      setCurrentExercise(prev => prev + 1);
      if (currentExercise + 1 >= selectedPreset.exercises.length) {
        if (currentRound < selectedPreset.rounds) {
          setCurrentRound(prev => prev + 1);
          setCurrentExercise(0);
          setTimeLeft(selectedPreset.work);
        } else {
          finishWorkout(true);
        }
      } else {
        setTimeLeft(selectedPreset.work);
      }
    } else {
      setIsResting(true);
      setTimeLeft(selectedPreset.rest);
    }
  };

  const startWorkout = (preset: WorkoutPreset) => {
    setSelectedPreset(preset);
    setIsRunning(true);
    setIsPaused(false);
    setCurrentRound(1);
    setCurrentExercise(0);
    setTimeLeft(preset.work);
    setIsResting(false);
    setStartTime(Date.now());
  };

  const pauseWorkout = () => { setIsPaused(!isPaused); };

  const stopWorkout = () => {
    Alert.alert('Stop Workout', 'Are you sure you want to stop?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Stop', style: 'destructive', onPress: () => finishWorkout(false) },
    ]);
  };

  const finishWorkout = async (completed: boolean) => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const record: WorkoutHistory = {
      id: Date.now().toString(),
      presetName: selectedPreset.name,
      date: new Date().toISOString(),
      duration,
      completed,
    };
    const newHistory = [record, ...history].slice(0, 50);
    setHistory(newHistory);
    await AsyncStorage.setItem('workout_history', JSON.stringify(newHistory));
    setIsRunning(false);
    setIsPaused(false);
    if (completed) Alert.alert('Workout Complete!', `Great job! Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`);
  };

  const createCustomWorkout = () => {
    const work = parseInt(customWork);
    const rest = parseInt(customRest);
    const rounds = parseInt(customRounds);
    if (isNaN(work) || isNaN(rest) || isNaN(rounds) || exercises.length === 0) {
      Alert.alert('Invalid Input', 'Please enter valid values');
      return;
    }
    const custom: WorkoutPreset = {
      id: 'custom',
      name: 'Custom Workout',
      work,
      rest,
      rounds,
      exercises,
    };
    startWorkout(custom);
    setActiveTab('timer');
  };

  const addExercise = () => { setExercises([...exercises, `Exercise ${exercises.length + 1}`]); };
  const updateExercise = (index: number, value: string) => {
    const updated = [...exercises];
    updated[index] = value;
    setExercises(updated);
  };
  const removeExercise = (index: number) => { setExercises(exercises.filter((_, i) => i !== index)); };

  if (isRunning) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.workoutContainer}>
          <Text style={styles.workoutTitle}>{selectedPreset.name}</Text>
          <Text style={styles.roundText}>Round {currentRound} / {selectedPreset.rounds}</Text>
          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{timeLeft}</Text>
            <Text style={styles.timerLabel}>{isResting ? 'REST' : 'WORK'}</Text>
          </View>
          <Text style={styles.exerciseName}>
            {selectedPreset.exercises[currentExercise] || 'Complete'}
          </Text>
          <View style={styles.controlButtons}>
            <TouchableOpacity style={styles.pauseButton} onPress={pauseWorkout}>
              <Text style={styles.buttonText}>{isPaused ? 'RESUME' : 'PAUSE'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stopButton} onPress={stopWorkout}>
              <Text style={styles.buttonText}>STOP</Text>
            </TouchableOpacity>
          </View>
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
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'timer' && styles.tabActive]} onPress={() => setActiveTab('timer')}>
          <Text style={[styles.tabText, activeTab === 'timer' && styles.tabTextActive]}>Presets</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'custom' && styles.tabActive]} onPress={() => setActiveTab('custom')}>
          <Text style={[styles.tabText, activeTab === 'custom' && styles.tabTextActive]}>Custom</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'history' && styles.tabActive]} onPress={() => setActiveTab('history')}>
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'timer' && (
          <>
            <Text style={styles.title}>Workout Timer</Text>
            {PRESETS.map(preset => (
              <View key={preset.id} style={styles.presetCard}>
                <Text style={styles.presetName}>{preset.name}</Text>
                <Text style={styles.presetDetails}>
                  Work: {preset.work}s • Rest: {preset.rest}s • Rounds: {preset.rounds}
                </Text>
                <TouchableOpacity style={styles.startButton} onPress={() => startWorkout(preset)}>
                  <Text style={styles.startButtonText}>Start Workout</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {activeTab === 'custom' && (
          <>
            <Text style={styles.title}>Custom Workout</Text>
            <View style={styles.inputCard}>
              <Text style={styles.label}>Work Time (seconds)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={customWork} onChangeText={setCustomWork} />
              <Text style={styles.label}>Rest Time (seconds)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={customRest} onChangeText={setCustomRest} />
              <Text style={styles.label}>Number of Rounds</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={customRounds} onChangeText={setCustomRounds} />
              <Text style={styles.label}>Exercises</Text>
              {exercises.map((ex, index) => (
                <View key={index} style={styles.exerciseRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={ex}
                    onChangeText={(text) => updateExercise(index, text)}
                  />
                  <TouchableOpacity onPress={() => removeExercise(index)}>
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addButton} onPress={addExercise}>
                <Text style={styles.addButtonText}>+ Add Exercise</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createButton} onPress={createCustomWorkout}>
                <Text style={styles.createButtonText}>Start Custom Workout</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {activeTab === 'history' && (
          <>
            <Text style={styles.title}>Workout History</Text>
            {history.map(record => (
              <View key={record.id} style={styles.historyItem}>
                <Text style={styles.historyName}>{record.presetName}</Text>
                <Text style={styles.historyDate}>{new Date(record.date).toLocaleDateString()}</Text>
                <Text style={styles.historyDuration}>
                  {Math.floor(record.duration / 60)}:{(record.duration % 60).toString().padStart(2, '0')}
                </Text>
                <Text style={[styles.historyStatus, { color: record.completed ? '#10B981' : '#F59E0B' }]}>
                  {record.completed ? 'Completed' : 'Stopped'}
                </Text>
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
  container: { flex: 1, backgroundColor: '#0F172A' },
  tabs: { flexDirection: 'row', backgroundColor: '#1E293B', paddingHorizontal: 5, paddingVertical: 5 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#F97316', borderRadius: 8 },
  tabText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#FFFFFF' },
  scrollContent: { padding: 20, paddingBottom: 80 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 20 },
  presetCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 20, marginBottom: 15 },
  presetName: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  presetDetails: { fontSize: 14, color: '#94A3B8', marginBottom: 15 },
  startButton: { backgroundColor: '#F97316', borderRadius: 10, padding: 15, alignItems: 'center' },
  startButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  inputCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 20 },
  label: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#0F172A', borderRadius: 10, padding: 15, fontSize: 16, color: '#FFFFFF', marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  removeText: { color: '#EF4444', fontSize: 24, fontWeight: 'bold' },
  addButton: { backgroundColor: '#334155', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 10 },
  addButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  createButton: { backgroundColor: '#F97316', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 15 },
  createButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  historyItem: { backgroundColor: '#1E293B', borderRadius: 12, padding: 15, marginBottom: 10 },
  historyName: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  historyDate: { fontSize: 14, color: '#94A3B8', marginBottom: 4 },
  historyDuration: { fontSize: 16, color: '#F97316', marginBottom: 4 },
  historyStatus: { fontSize: 14, fontWeight: '600' },
  workoutContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  workoutTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 20 },
  roundText: { fontSize: 18, color: '#94A3B8', marginBottom: 30 },
  timerCircle: { width: 200, height: 200, borderRadius: 100, borderWidth: 8, borderColor: '#F97316', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  timerText: { fontSize: 64, fontWeight: 'bold', color: '#FFFFFF' },
  timerLabel: { fontSize: 20, color: '#F97316', marginTop: 10 },
  exerciseName: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 40 },
  controlButtons: { flexDirection: 'row', gap: 15 },
  pauseButton: { backgroundColor: '#F59E0B', borderRadius: 10, paddingVertical: 15, paddingHorizontal: 30 },
  stopButton: { backgroundColor: '#EF4444', borderRadius: 10, paddingVertical: 15, paddingHorizontal: 30 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  adContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', backgroundColor: '#0F172A', paddingVertical: 5 },
});
