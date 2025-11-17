import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const data = { income: 4000, expenses: 2500, savings: 1500 };
  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Finance Tracker</Text>
      <ScrollView>
        <View style={styles.card}><Text style={styles.label}>Income</Text><Text style={styles.value}>$${data.income}</Text></View>
        <View style={styles.card}><Text style={styles.label}>Expenses</Text><Text style={styles.value}>$${data.expenses}</Text></View>
        <View style={[styles.card, styles.savings]}><Text style={styles.label}>Savings</Text><Text style={styles.value}>$${data.savings}</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  card: { backgroundColor: colors.white, padding: spacing.xl, borderRadius: 12, marginBottom: spacing.md },
  savings: { backgroundColor: colors.status.success },
  label: { fontSize: 16, color: colors.gray.dark, marginBottom: spacing.sm },
  value: { fontSize: 32, fontWeight: 'bold', color: colors.primary },
});