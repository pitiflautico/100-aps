import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const income = 3000;
  const expenses = [
    { name: 'Rent', amount: 1000 },
    { name: 'Food', amount: 400 },
  ];
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = income - total;

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Budget Manager</Text>
      <Text style={styles.income}>Income: $${income}</Text>
      {expenses.map((e, i) => (
        <View key={i} style={styles.row}>
          <Text>{e.name}</Text>
          <Text>$${e.amount}</Text>
        </View>
      ))}
      <Text style={styles.total}>Remaining: $${remaining}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  income: { fontSize: 20, marginBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, backgroundColor: colors.white, marginBottom: spacing.sm, borderRadius: 8 },
  total: { fontSize: 24, fontWeight: 'bold', marginTop: spacing.lg, color: colors.status.success },
});