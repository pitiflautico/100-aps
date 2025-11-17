import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [height, setHeight] = useState('170');
  const [weight, setWeight] = useState('70');
  const h = parseFloat(height) / 100;
  const w = parseFloat(weight);
  const bmi = w / (h * h);
  const category = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>BMI Calculator</Text>
      <View style={styles.box}>
        <Text style={styles.l}>Height (cm)</Text>
        <TextInput style={styles.i} value={height} onChangeText={setHeight} keyboardType="number-pad"/>
      </View>
      <View style={styles.box}>
        <Text style={styles.l}>Weight (kg)</Text>
        <TextInput style={styles.i} value={weight} onChangeText={setWeight} keyboardType="number-pad"/>
      </View>
      <View style={styles.result}>
        <Text style={styles.bmi}>{isNaN(bmi) ? '--' : bmi.toFixed(1)}</Text>
        <Text style={styles.cat}>{isNaN(bmi) ? '' : category}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginBottom: spacing.xl },
  box: { marginBottom: spacing.lg },
  l: { fontSize: 16, marginBottom: spacing.sm, color: colors.gray.dark },
  i: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: 8, fontSize: 20 },
  result: { marginTop: spacing.xl, alignItems: 'center' },
  bmi: { fontSize: 64, fontWeight: 'bold', color: colors.secondary },
  cat: { fontSize: 24, color: colors.text },
});
