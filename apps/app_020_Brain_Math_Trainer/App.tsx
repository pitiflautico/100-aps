import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [score, setScore] = useState(0);
  const [problem, setProblem] = useState({ q: '8 × 7', a: 56, opts: [54, 55, 56, 57] });

  const newProblem = () => {
    const n1 = Math.floor(Math.random() * 12) + 1;
    const n2 = Math.floor(Math.random() * 12) + 1;
    const ans = n1 * n2;
    setProblem({ q: `${n1} × ${n2}`, a: ans, opts: [ans-2, ans-1, ans, ans+1].sort(() => Math.random()-0.5) });
  };

  const check = (ans) => {
    if (ans === problem.a) setScore(score + 1);
    newProblem();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Math Trainer</Text>
      <Text style={styles.score}>Score: {score}</Text>
      <Text style={styles.problem}>{problem.q} = ?</Text>
      <View style={styles.options}>
        {problem.opts.map((opt, i) => (
          <TouchableOpacity key={i} style={styles.btn} onPress={() => check(opt)}>
            <Text style={styles.btnText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginBottom: spacing.sm },
  score: { fontSize: 18, color: colors.text, textAlign: 'center', marginBottom: spacing.xl },
  problem: { fontSize: 48, fontWeight: 'bold', textAlign: 'center', marginBottom: spacing.xl },
  options: { gap: spacing.md },
  btn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  btnText: { color: colors.white, fontSize: 24, fontWeight: 'bold' },
});
