import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [bill, setBill] = useState('50');
  const [tip, setTip] = useState('15');
  const billAmount = parseFloat(bill || 0);
  const tipPercent = parseFloat(tip || 0);
  const tipAmount = billAmount * (tipPercent / 100);
  const total = billAmount + tipAmount;

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Tip Calculator</Text>
      <Text style={styles.label}>Bill Amount</Text>
      <TextInput style={styles.input} value={bill} onChangeText={setBill} keyboardType="numeric" />
      <Text style={styles.label}>Tip %</Text>
      <TextInput style={styles.input} value={tip} onChangeText={setTip} keyboardType="numeric" />
      <View style={styles.summary}>
        <View style={styles.row}>
          <Text style={styles.sumLabel}>Tip:</Text>
          <Text style={styles.sumValue}>$${tipAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.sumLabel}>Total:</Text>
          <Text style={styles.sumTotal}>$${total.toFixed(2)}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xl },
  label: { fontSize: 16, marginBottom: spacing.sm, color: colors.gray.dark },
  input: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 8, marginBottom: spacing.lg, fontSize: 18 },
  summary: { backgroundColor: colors.gray.light, padding: spacing.lg, borderRadius: 12, marginTop: spacing.xl },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  sumLabel: { fontSize: 18, color: colors.text },
  sumValue: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  sumTotal: { fontSize: 24, fontWeight: 'bold', color: colors.status.success },
});