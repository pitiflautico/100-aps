import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [glasses, setGlasses] = useState(0);
  const goal = 8;

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Hydration Tracker</Text>
      <Text style={styles.g}>{glasses}/{goal} glasses</Text>
      <TouchableOpacity style={styles.b} onPress={() => setGlasses(glasses + 1)}>
        <Text style={styles.bt}>+ Add Glass</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xl },
  g: { fontSize: 48, fontWeight: 'bold', color: colors.status.info, marginBottom: spacing.xl },
  b: { backgroundColor: colors.status.info, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderRadius: 12 },
  bt: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
});
