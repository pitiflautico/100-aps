import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [amount, setAmount] = useState('10000');
  const [rate, setRate] = useState('5');
  const [years, setYears] = useState('30');
  const monthlyRate = parseFloat(rate || 0) / 100 / 12;
  const months = parseFloat(years || 0) * 12;
  const monthly = months > 0 ? (parseFloat(amount || 0) * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1) : 0;

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Loan Calculator</Text>
      <Text style={styles.label}>Loan Amount</Text>
      <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <Text style={styles.label}>Interest Rate (%)</Text>
      <TextInput style={styles.input} value={rate} onChangeText={setRate} keyboardType="numeric" />
      <Text style={styles.label}>Years</Text>
      <TextInput style={styles.input} value={years} onChangeText={setYears} keyboardType="numeric" />
      <View style={styles.result}>
        <Text style={styles.resultLabel}>Monthly Payment</Text>
        <Text style={styles.resultValue}>$${monthly.toFixed(2)}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xl },
  label: { fontSize: 16, marginBottom: spacing.sm, color: colors.gray.dark },
  input: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 8, marginBottom: spacing.lg, fontSize: 18 },
  result: { backgroundColor: colors.primary, padding: spacing.xl, borderRadius: 12, marginTop: spacing.xl, alignItems: 'center' },
  resultLabel: { fontSize: 16, color: colors.white, marginBottom: spacing.sm },
  resultValue: { fontSize: 36, fontWeight: 'bold', color: colors.white },
});