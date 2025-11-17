import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const milestones = [
    { month: 1, milestone: 'First smile' },
    { month: 3, milestone: 'Holds head up' },
    { month: 6, milestone: 'Sits without support' },
    { month: 9, milestone: 'Crawls' },
    { month: 12, milestone: 'First steps' },
  ];

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Baby Growth Tracker</Text>
      <FlatList data={milestones} keyExtractor={i=>i.month.toString()} renderItem={({item})=>(
        <View style={styles.item}>
          <Text style={styles.month}>Month {item.month}</Text>
          <Text style={styles.ms}>{item.milestone}</Text>
        </View>
      )}/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg, textAlign: 'center' },
  item: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: 12, marginBottom: spacing.sm },
  month: { fontSize: 14, color: colors.primary, fontWeight: 'bold', marginBottom: spacing.xs },
  ms: { fontSize: 18, color: colors.text },
});
