import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [count, setCount] = useState(0);
  const [severity, setSeverity] = useState(0);

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Headache Tracker</Text>
      <Text style={styles.label}>This week: {count} headaches</Text>
      <TouchableOpacity style={styles.b} onPress={()=>setCount(count+1)}>
        <Text style={styles.bt}>Log Headache</Text>
      </TouchableOpacity>
      <Text style={styles.label2}>Severity (1-10)</Text>
      <View style={styles.severity}>
        {[1,2,3,4,5,6,7,8,9,10].map(n=>(
          <TouchableOpacity key={n} style={[styles.num,severity===n&&styles.numActive]} onPress={()=>setSeverity(n)}>
            <Text style={[styles.numText,severity===n&&styles.numTextActive]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginBottom: spacing.xl },
  label: { fontSize: 20, textAlign: 'center', marginBottom: spacing.xl, color: colors.text },
  b: { backgroundColor: colors.status.error, padding: spacing.lg, borderRadius: 12, alignItems: 'center', marginBottom: spacing.xl },
  bt: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  label2: { fontSize: 16, marginBottom: spacing.md, color: colors.gray.dark },
  severity: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  num: { width: 50, height: 50, backgroundColor: colors.gray.light, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  numActive: { backgroundColor: colors.status.error },
  numText: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  numTextActive: { color: colors.white },
});
