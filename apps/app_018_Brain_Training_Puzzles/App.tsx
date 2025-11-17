import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState({ q: 'What is 5 + 7?', a: 12, options: [10, 11, 12, 13] });

  const check = (ans) => {
    if (ans === question.a) setScore(score + 1);
    const n1 = Math.floor(Math.random() * 20);
    const n2 = Math.floor(Math.random() * 20);
    const correct = n1 + n2;
    setQuestion({ q: `What is ${n1} + ${n2}?`, a: correct, options: [correct-1, correct, correct+1, correct+2].sort(() => Math.random()-0.5) });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Brain Training</Text>
      <Text style={styles.score}>Score: {score}</Text>
      <View style={styles.box}>
        <Text style={styles.question}>{question.q}</Text>
      </View>
      <View style={styles.options}>
        {question.options.map((opt, i) => (
          <TouchableOpacity key={i} style={styles.btn} onPress={() => check(opt)}>
            <Text style={styles.btnText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginBottom: spacing.sm },
  score: { fontSize: 18, color: colors.text, textAlign: 'center', marginBottom: spacing.xl },
  box: { backgroundColor: colors.gray.light, padding: spacing.xl, borderRadius: 16, marginBottom: spacing.lg, minHeight: 100, justifyContent: 'center' },
  question: { fontSize: 24, textAlign: 'center', fontWeight: 'bold' },
  options: { gap: spacing.md },
  btn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  btnText: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
});
