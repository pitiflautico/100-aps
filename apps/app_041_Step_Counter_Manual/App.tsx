import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [steps, setSteps] = useState(0);
  const goal = 10000;

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Step Counter</Text>
      <Text style={styles.steps}>{steps}</Text>
      <Text style={styles.goal}>Goal: {goal} steps</Text>
      <Text style={styles.perc}>{Math.round(steps/goal*100)}%</Text>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.b} onPress={()=>setSteps(steps+100)}>
          <Text style={styles.bt}>+100</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.b} onPress={()=>setSteps(0)}>
          <Text style={styles.bt}>Reset</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xl },
  steps: { fontSize: 96, fontWeight: 'bold', color: colors.secondary, marginBottom: spacing.md },
  goal: { fontSize: 18, color: colors.gray.dark, marginBottom: spacing.sm },
  perc: { fontSize: 32, fontWeight: 'bold', color: colors.status.success, marginBottom: spacing.xl },
  buttons: { flexDirection: 'row', gap: spacing.md },
  b: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderRadius: 12 },
  bt: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
});
