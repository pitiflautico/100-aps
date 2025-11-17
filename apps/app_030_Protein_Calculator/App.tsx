import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [weight, setWeight] = useState('70');
  const protein = Math.round(parseFloat(weight) * 1.6);

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Protein Calculator</Text>
      <Text style={styles.l}>Weight (kg)</Text>
      <TextInput style={styles.i} value={weight} onChangeText={setWeight} keyboardType="number-pad"/>
      <Text style={styles.r}>Daily protein: {isNaN(protein) ? 0 : protein}g</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xl },
  l: { fontSize: 18, marginBottom: spacing.sm },
  i: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: 8, fontSize: 24, width: 200, marginBottom: spacing.xl, textAlign: 'center' },
  r: { fontSize: 24, fontWeight: 'bold', color: colors.status.success },
});
