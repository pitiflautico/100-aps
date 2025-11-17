import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

interface Program { id: string; name: string; week: number; intervals: {type: 'walk'|'run', duration: number}[]; }
const C25K_PROGRAMS: Program[] = [
  { id: '1', name: 'C25K Week 1', week: 1, intervals: [{type:'walk',duration:300},{type:'run',duration:60},{type:'walk',duration:90},{type:'run',duration:60},{type:'walk',duration:90},{type:'run',duration:60},{type:'walk',duration:90},{type:'run',duration:60},{type:'walk',duration:90},{type:'run',duration:60},{type:'walk',duration:90},{type:'run',duration:60},{type:'walk',duration:90},{type:'run',duration:60},{type:'walk',duration:90},{type:'run',duration:60},{type:'walk',duration:300}] },
  { id: '2', name: 'C25K Week 2', week: 2, intervals: [{type:'walk',duration:300},{type:'run',duration:90},{type:'walk',duration:120},{type:'run',duration:90},{type:'walk',duration:120},{type:'run',duration:90},{type:'walk',duration:120},{type:'run',duration:90},{type:'walk',duration:120},{type:'run',duration:90},{type:'walk',duration:120},{type:'run',duration:90},{type:'walk',duration:300}] },
  { id: '3', name: 'C25K Week 3', week: 3, intervals: [{type:'walk',duration:300},{type:'run',duration:90},{type:'walk',duration:90},{type:'run',duration:180},{type:'walk',duration:180},{type:'run',duration:90},{type:'walk',duration:90},{type:'run',duration:180},{type:'walk',duration:300}] },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'programs'|'custom'|'history'>('programs');
  const [programs, setPrograms] = useState<Program[]>(C25K_PROGRAMS);
  const [customIntervals, setCustomIntervals] = useState<{type: 'walk'|'run', duration: string}[]>([{type:'run',duration:'60'},{type:'walk',duration:'90'}]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentProgram, setCurrentProgram] = useState<Program|null>(null);
  const [currentInterval, setCurrentInterval] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      if (currentProgram && currentInterval + 1 < currentProgram.intervals.length) {
        setCurrentInterval(prev => prev + 1);
        setTimeLeft(currentProgram.intervals[currentInterval + 1].duration);
      } else {
        finishRun();
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const loadHistory = async () => {
    const stored = await AsyncStorage.getItem('run_history');
    if (stored) setHistory(JSON.parse(stored));
  };

  const startProgram = (program: Program) => {
    setCurrentProgram(program);
    setCurrentInterval(0);
    setTimeLeft(program.intervals[0].duration);
    setIsRunning(true);
  };

  const finishRun = async () => {
    setIsRunning(false);
    const record = { id: Date.now().toString(), name: currentProgram?.name || 'Custom', date: new Date().toISOString() };
    const newHistory = [record, ...history].slice(0, 50);
    setHistory(newHistory);
    await AsyncStorage.setItem('run_history', JSON.stringify(newHistory));
    Alert.alert('Run Complete!', 'Great job!');
  };

  const createCustomRun = () => {
    const intervals = customIntervals.map(i => ({type: i.type, duration: parseInt(i.duration)}));
    const custom: Program = { id: 'custom', name: 'Custom Run', week: 0, intervals };
    startProgram(custom);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {isRunning ? (
        <View style={styles.runContainer}>
          <Text style={styles.runTitle}>{currentProgram?.name}</Text>
          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{timeLeft}</Text>
            <Text style={styles.timerLabel}>{currentProgram?.intervals[currentInterval].type.toUpperCase()}</Text>
          </View>
          <TouchableOpacity style={styles.stopButton} onPress={() => setIsRunning(false)}>
            <Text style={styles.stopButtonText}>STOP</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.tabs}>
            <TouchableOpacity style={[styles.tab, activeTab === 'programs' && styles.tabActive]} onPress={() => setActiveTab('programs')}>
              <Text style={[styles.tabText, activeTab === 'programs' && styles.tabTextActive]}>Programs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'custom' && styles.tabActive]} onPress={() => setActiveTab('custom')}>
              <Text style={[styles.tabText, activeTab === 'custom' && styles.tabTextActive]}>Custom</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'history' && styles.tabActive]} onPress={() => setActiveTab('history')}>
              <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>History</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {activeTab === 'programs' && programs.map(p => (
              <View key={p.id} style={styles.programCard}>
                <Text style={styles.programName}>{p.name}</Text>
                <TouchableOpacity style={styles.startButton} onPress={() => startProgram(p)}>
                  <Text style={styles.startButtonText}>Start</Text>
                </TouchableOpacity>
              </View>
            ))}
            {activeTab === 'custom' && (
              <View style={styles.customCard}>
                {customIntervals.map((interval, idx) => (
                  <View key={idx} style={styles.intervalRow}>
                    <TouchableOpacity style={styles.typeButton} onPress={() => {
                      const updated = [...customIntervals];
                      updated[idx].type = updated[idx].type === 'run' ? 'walk' : 'run';
                      setCustomIntervals(updated);
                    }}>
                      <Text style={styles.typeButtonText}>{interval.type.toUpperCase()}</Text>
                    </TouchableOpacity>
                    <TextInput style={styles.input} keyboardType="numeric" value={interval.duration} onChangeText={(text) => {
                      const updated = [...customIntervals];
                      updated[idx].duration = text;
                      setCustomIntervals(updated);
                    }} />
                  </View>
                ))}
                <TouchableOpacity style={styles.addButton} onPress={() => setCustomIntervals([...customIntervals, {type:'run',duration:'60'}])}>
                  <Text style={styles.addButtonText}>+ Add Interval</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.startButton} onPress={createCustomRun}>
                  <Text style={styles.startButtonText}>Start Custom Run</Text>
                </TouchableOpacity>
              </View>
            )}
            {activeTab === 'history' && history.map(r => (
              <View key={r.id} style={styles.historyItem}>
                <Text style={styles.historyName}>{r.name}</Text>
                <Text style={styles.historyDate}>{new Date(r.date).toLocaleDateString()}</Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}
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
  tabActive: { backgroundColor: '#06B6D4', borderRadius: 8 },
  tabText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#FFFFFF' },
  scrollContent: { padding: 20, paddingBottom: 80 },
  programCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 20, marginBottom: 15 },
  programName: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 15 },
  startButton: { backgroundColor: '#06B6D4', borderRadius: 10, padding: 15, alignItems: 'center' },
  startButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  customCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 20 },
  intervalRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  typeButton: { backgroundColor: '#334155', borderRadius: 8, padding: 12, flex: 1 },
  typeButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  input: { backgroundColor: '#0F172A', borderRadius: 8, padding: 12, fontSize: 16, color: '#FFFFFF', flex: 1 },
  addButton: { backgroundColor: '#334155', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 10, marginBottom: 15 },
  addButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  historyItem: { backgroundColor: '#1E293B', borderRadius: 12, padding: 15, marginBottom: 10 },
  historyName: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  historyDate: { fontSize: 14, color: '#94A3B8' },
  runContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  runTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 40 },
  timerCircle: { width: 200, height: 200, borderRadius: 100, borderWidth: 8, borderColor: '#06B6D4', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  timerText: { fontSize: 64, fontWeight: 'bold', color: '#FFFFFF' },
  timerLabel: { fontSize: 20, color: '#06B6D4', marginTop: 10 },
  stopButton: { backgroundColor: '#EF4444', borderRadius: 10, paddingVertical: 15, paddingHorizontal: 40 },
  stopButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  adContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', backgroundColor: '#0F172A', paddingVertical: 5 },
});
