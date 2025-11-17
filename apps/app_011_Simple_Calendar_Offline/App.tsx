import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [currentMonth] = useState(new Date().getMonth());
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [selected, setSelected] = useState(new Date().getDate());

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Calendar - {monthNames[currentMonth]}</Text>
      <View style={styles.daysRow}>
        {days.map(d => <Text key={d} style={styles.dayName}>{d}</Text>)}
      </View>
      <View style={styles.grid}>
        {Array.from({ length: 30 }).map((_, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.day, selected === i + 1 && styles.daySelected]}
            onPress={() => setSelected(i + 1)}
          >
            <Text style={[styles.dayText, selected === i + 1 && styles.dayTextSelected]}>{i + 1}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  daysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.md },
  dayName: { fontSize: 12, color: colors.gray.dark, width: 40, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  day: { width: '14%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xs },
  daySelected: { backgroundColor: colors.primary, borderRadius: 20 },
  dayText: { fontSize: 16, color: colors.text },
  dayTextSelected: { color: colors.white, fontWeight: 'bold' },
});
