import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

interface Stretch { id: string; name: string; bodyArea: string; duration: number; instructions: string; }
interface Routine { id: string; name: string; stretchIds: string[]; }

const STRETCHES: Stretch[] = [
  { id: '1', name: 'Neck Rotation', bodyArea: 'Neck', duration: 30, instructions: 'Slowly rotate head in circles' },
  { id: '2', name: 'Neck Tilt', bodyArea: 'Neck', duration: 30, instructions: 'Tilt head side to side' },
  { id: '3', name: 'Shoulder Rolls', bodyArea: 'Shoulders', duration: 30, instructions: 'Roll shoulders forward and back' },
  { id: '4', name: 'Arm Circles', bodyArea: 'Shoulders', duration: 30, instructions: 'Make circles with extended arms' },
  { id: '5', name: 'Chest Opener', bodyArea: 'Shoulders', duration: 30, instructions: 'Clasp hands behind back, lift' },
  { id: '6', name: 'Cat-Cow Stretch', bodyArea: 'Back', duration: 60, instructions: 'Arch and round back on all fours' },
  { id: '7', name: 'Child Pose', bodyArea: 'Back', duration: 60, instructions: 'Kneel and reach forward' },
  { id: '8', name: 'Seated Twist', bodyArea: 'Back', duration: 30, instructions: 'Twist torso while seated' },
  { id: '9', name: 'Hamstring Stretch', bodyArea: 'Legs', duration: 30, instructions: 'Reach for toes while seated' },
  { id: '10', name: 'Quad Stretch', bodyArea: 'Legs', duration: 30, instructions: 'Pull foot to glute while standing' },
  { id: '11', name: 'Calf Stretch', bodyArea: 'Legs', duration: 30, instructions: 'Push against wall, leg extended' },
  { id: '12', name: 'Hip Flexor', bodyArea: 'Legs', duration: 30, instructions: 'Lunge position, push hips forward' },
  { id: '13', name: 'Butterfly Stretch', bodyArea: 'Legs', duration: 60, instructions: 'Sit with soles together' },
  { id: '14', name: 'Pigeon Pose', bodyArea: 'Legs', duration: 60, instructions: 'Hip opener stretch' },
  { id: '15', name: 'Ankle Circles', bodyArea: 'Legs', duration: 30, instructions: 'Rotate ankles in circles' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'library'|'routines'|'session'>('library');
  const [selectedArea, setSelectedArea] = useState('All');
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [newRoutine, setNewRoutine] = useState({name:'', stretchIds:[] as string[]});
  const [sessionRoutine, setSessionRoutine] = useState<Routine|null>(null);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => { loadRoutines(); }, []);
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && sessionTime > 0) {
      interval = setInterval(() => setSessionTime(t => t - 1), 1000);
    } else if (sessionTime === 0 && isRunning && sessionRoutine) {
      if (sessionIndex + 1 < sessionRoutine.stretchIds.length) {
        setSessionIndex(prev => prev + 1);
        const nextStretch = STRETCHES.find(s => s.id === sessionRoutine.stretchIds[sessionIndex + 1]);
        setSessionTime(nextStretch?.duration || 30);
      } else {
        setIsRunning(false);
        Alert.alert('Session Complete!', 'Great stretching!');
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, sessionTime]);

  const loadRoutines = async () => {
    const stored = await AsyncStorage.getItem('stretch_routines');
    if (stored) setRoutines(JSON.parse(stored));
  };

  const saveRoutine = async () => {
    if (!newRoutine.name || newRoutine.stretchIds.length === 0) return;
    const routine: Routine = { id: Date.now().toString(), name: newRoutine.name, stretchIds: newRoutine.stretchIds };
    const updated = [...routines, routine];
    setRoutines(updated);
    await AsyncStorage.setItem('stretch_routines', JSON.stringify(updated));
    setNewRoutine({name:'', stretchIds:[]});
  };

  const deleteRoutine = async (id: string) => {
    const updated = routines.filter(r => r.id !== id);
    setRoutines(updated);
    await AsyncStorage.setItem('stretch_routines', JSON.stringify(updated));
  };

  const toggleStretch = (id: string) => {
    if (newRoutine.stretchIds.includes(id)) {
      setNewRoutine({...newRoutine, stretchIds: newRoutine.stretchIds.filter(sid => sid !== id)});
    } else {
      setNewRoutine({...newRoutine, stretchIds: [...newRoutine.stretchIds, id]});
    }
  };

  const startSession = (routine: Routine) => {
    setSessionRoutine(routine);
    setSessionIndex(0);
    const firstStretch = STRETCHES.find(s => s.id === routine.stretchIds[0]);
    setSessionTime(firstStretch?.duration || 30);
    setIsRunning(true);
    setActiveTab('session');
  };

  const filteredStretches = selectedArea === 'All' ? STRETCHES : STRETCHES.filter(s => s.bodyArea === selectedArea);

  if (activeTab === 'session' && sessionRoutine && isRunning) {
    const currentStretch = STRETCHES.find(s => s.id === sessionRoutine.stretchIds[sessionIndex]);
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.sessionContainer}>
          <Text style={styles.sessionTitle}>{sessionRoutine.name}</Text>
          <Text style={styles.sessionProgress}>{sessionIndex + 1} / {sessionRoutine.stretchIds.length}</Text>
          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{sessionTime}</Text>
          </View>
          <Text style={styles.stretchName}>{currentStretch?.name}</Text>
          <Text style={styles.stretchInstructions}>{currentStretch?.instructions}</Text>
          <TouchableOpacity style={styles.stopButton} onPress={() => setIsRunning(false)}>
            <Text style={styles.stopButtonText}>STOP</Text>
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
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'library' && styles.tabActive]} onPress={() => setActiveTab('library')}>
          <Text style={[styles.tabText, activeTab === 'library' && styles.tabTextActive]}>Library</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'routines' && styles.tabActive]} onPress={() => setActiveTab('routines')}>
          <Text style={[styles.tabText, activeTab === 'routines' && styles.tabTextActive]}>Routines</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'library' && (
          <>
            <Text style={styles.title}>Stretch Library</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
              {['All', 'Neck', 'Shoulders', 'Back', 'Legs'].map(area => (
                <TouchableOpacity key={area} style={[styles.filterButton, selectedArea === area && styles.filterButtonActive]} onPress={() => setSelectedArea(area)}>
                  <Text style={[styles.filterButtonText, selectedArea === area && styles.filterButtonTextActive]}>{area}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput style={styles.input} placeholder="Routine Name" placeholderTextColor="#6B7280" value={newRoutine.name} onChangeText={(text) => setNewRoutine({...newRoutine, name: text})} />
            {filteredStretches.map(stretch => (
              <TouchableOpacity key={stretch.id} style={[styles.stretchCard, newRoutine.stretchIds.includes(stretch.id) && styles.stretchCardSelected]} onPress={() => toggleStretch(stretch.id)}>
                <Text style={styles.stretchCardName}>{stretch.name}</Text>
                <Text style={styles.stretchCardArea}>{stretch.bodyArea} • {stretch.duration}s</Text>
                <Text style={styles.stretchCardInstructions}>{stretch.instructions}</Text>
              </TouchableOpacity>
            ))}
            {newRoutine.stretchIds.length > 0 && (
              <TouchableOpacity style={styles.saveButton} onPress={saveRoutine}>
                <Text style={styles.saveButtonText}>Save Routine ({newRoutine.stretchIds.length} stretches)</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        {activeTab === 'routines' && (
          <>
            <Text style={styles.title}>My Routines</Text>
            {routines.map(routine => (
              <View key={routine.id} style={styles.routineCard}>
                <Text style={styles.routineName}>{routine.name}</Text>
                <Text style={styles.routineCount}>{routine.stretchIds.length} stretches</Text>
                <View style={styles.routineButtons}>
                  <TouchableOpacity style={styles.startButton} onPress={() => startSession(routine)}>
                    <Text style={styles.startButtonText}>Start</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteRoutine(routine.id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#0F172A' },
  tabs: { flexDirection: 'row', backgroundColor: '#1E293B', padding: 5 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#A855F7', borderRadius: 8 },
  tabText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#FFFFFF' },
  scrollContent: { padding: 20, paddingBottom: 80 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 20 },
  filters: { maxHeight: 50, marginBottom: 15 },
  filterButton: { backgroundColor: '#1E293B', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, marginRight: 10 },
  filterButtonActive: { backgroundColor: '#A855F7' },
  filterButtonText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  filterButtonTextActive: { color: '#FFFFFF' },
  input: { backgroundColor: '#1E293B', borderRadius: 10, padding: 15, fontSize: 16, color: '#FFFFFF', marginBottom: 15 },
  stretchCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: '#334155' },
  stretchCardSelected: { borderColor: '#A855F7' },
  stretchCardName: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 6 },
  stretchCardArea: { fontSize: 14, color: '#94A3B8', marginBottom: 6 },
  stretchCardInstructions: { fontSize: 14, color: '#6B7280' },
  saveButton: { backgroundColor: '#A855F7', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  routineCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12 },
  routineName: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 6 },
  routineCount: { fontSize: 14, color: '#A855F7', marginBottom: 12 },
  routineButtons: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  startButton: { backgroundColor: '#A855F7', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 30 },
  startButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  deleteText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
  sessionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  sessionTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 10 },
  sessionProgress: { fontSize: 16, color: '#94A3B8', marginBottom: 30 },
  timerCircle: { width: 180, height: 180, borderRadius: 90, borderWidth: 8, borderColor: '#A855F7', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  timerText: { fontSize: 56, fontWeight: 'bold', color: '#FFFFFF' },
  stretchName: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 15, textAlign: 'center' },
  stretchInstructions: { fontSize: 16, color: '#94A3B8', marginBottom: 30, textAlign: 'center' },
  stopButton: { backgroundColor: '#EF4444', borderRadius: 10, paddingVertical: 15, paddingHorizontal: 40 },
  stopButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  adContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', backgroundColor: '#0F172A', paddingVertical: 5 },
});
