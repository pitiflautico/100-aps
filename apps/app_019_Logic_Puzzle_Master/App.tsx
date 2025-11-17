import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

const PUZZLES = [
  { q: 'If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops Lazzies?', a: 'Yes' },
  { q: 'If some Cats are Dogs, are all Dogs Cats?', a: 'No' },
];

export default function App() {
  const [current, setCurrent] = useState(0);
  const [show, setShow] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Logic Puzzle</Text>
      <View style={styles.box}>
        <Text style={styles.question}>{PUZZLES[current].q}</Text>
        {show && <Text style={styles.answer}>Answer: {PUZZLES[current].a}</Text>}
      </View>
      <TouchableOpacity style={styles.btn} onPress={() => setShow(!show)}>
        <Text style={styles.btnText}>{show ? 'Hide' : 'Show'} Answer</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={() => { setCurrent((current + 1) % PUZZLES.length); setShow(false); }}>
        <Text style={styles.btnText}>Next Puzzle</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginBottom: spacing.xl },
  box: { backgroundColor: colors.gray.light, padding: spacing.xl, borderRadius: 16, marginBottom: spacing.lg, minHeight: 150, justifyContent: 'center' },
  question: { fontSize: 18, textAlign: 'center', lineHeight: 26, marginBottom: spacing.md },
  answer: { fontSize: 20, textAlign: 'center', color: colors.status.success, fontWeight: 'bold' },
  btn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: 12, alignItems: 'center', marginBottom: spacing.md },
  btnText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
});
