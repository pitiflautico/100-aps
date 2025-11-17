import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

const POSES = [
  { id: '1', name: 'Downward Dog', desc: 'Start on hands and knees, lift hips up' },
  { id: '2', name: 'Warrior I', desc: 'Step forward, bend front knee, arms up' },
  { id: '3', name: 'Tree Pose', desc: 'Balance on one leg, foot on inner thigh' },
  { id: '4', name: 'Child Pose', desc: 'Sit back on heels, arms forward' },
];

export default function App() {
  const [selected, setSelected] = useState(null);

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Yoga Poses</Text>
      <FlatList data={POSES} keyExtractor={i=>i.id} renderItem={({item})=>(
        <TouchableOpacity style={styles.pose} onPress={()=>setSelected(item.id)}>
          <Text style={styles.name}>{item.name}</Text>
          {selected === item.id && <Text style={styles.desc}>{item.desc}</Text>}
        </TouchableOpacity>
      )}/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg, textAlign: 'center' },
  pose: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: 12, marginBottom: spacing.sm },
  name: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  desc: { fontSize: 14, color: colors.gray.dark, marginTop: spacing.sm },
});
