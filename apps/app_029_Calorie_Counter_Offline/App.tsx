import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [total, setTotal] = useState(0);
  const [input, setInput] = useState('');

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Calorie Counter</Text>
      <Text style={styles.tot}>{total} cal</Text>
      <TextInput style={styles.i} value={input} onChangeText={setInput} placeholder="Calories" keyboardType="number-pad"/>
      <TouchableOpacity style={styles.b} onPress={() => {const n = parseInt(input); if(!isNaN(n)){setTotal(total + n); setInput('');}}}>
        <Text style={styles.bt}>Add</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xl },
  tot: { fontSize: 64, fontWeight: 'bold', color: colors.secondary, marginBottom: spacing.xl },
  i: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: 8, fontSize: 18, width: 200, marginBottom: spacing.lg },
  b: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderRadius: 12 },
  bt: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
});
