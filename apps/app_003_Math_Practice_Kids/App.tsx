import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

type Operation = '+' | '-' | '×' | '÷';

export default function App() {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operation, setOperation] = useState<Operation>('+');
  const [answer, setAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState('');

  const generateProblem = () => {
    const ops: Operation[] = ['+', '-', '×', '÷'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let n1, n2;

    switch (op) {
      case '+':
        n1 = Math.floor(Math.random() * 50) + 1;
        n2 = Math.floor(Math.random() * 50) + 1;
        break;
      case '-':
        n1 = Math.floor(Math.random() * 50) + 20;
        n2 = Math.floor(Math.random() * n1);
        break;
      case '×':
        n1 = Math.floor(Math.random() * 12) + 1;
        n2 = Math.floor(Math.random() * 12) + 1;
        break;
      case '÷':
        n2 = Math.floor(Math.random() * 12) + 1;
        n1 = n2 * (Math.floor(Math.random() * 12) + 1);
        break;
    }

    setNum1(n1);
    setNum2(n2);
    setOperation(op);
    setAnswer(null);
    setFeedback('');
  };

  useEffect(() => {
    generateProblem();
  }, []);

  const getCorrectAnswer = () => {
    switch (operation) {
      case '+': return num1 + num2;
      case '-': return num1 - num2;
      case '×': return num1 * num2;
      case '÷': return num1 / num2;
    }
  };

  const handleAnswer = (userAnswer: number) => {
    setAnswer(userAnswer);
    setTotal(total + 1);
    const correct = userAnswer === getCorrectAnswer();

    if (correct) {
      setScore(score + 1);
      setFeedback('✓ Correct!');
    } else {
      setFeedback(`✗ Incorrect. Answer: ${getCorrectAnswer()}`);
    }

    setTimeout(() => generateProblem(), 1500);
  };

  const generateAnswerOptions = () => {
    const correct = getCorrectAnswer();
    const options = [correct];

    while (options.length < 4) {
      const offset = Math.floor(Math.random() * 20) - 10;
      const wrong = correct + offset;
      if (wrong > 0 && !options.includes(wrong)) {
        options.push(wrong);
      }
    }

    return options.sort(() => Math.random() - 0.5);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Math Practice</Text>
        <Text style={styles.score}>Score: {score}/{total}</Text>
      </View>

      <View style={styles.problemContainer}>
        <Text style={styles.problem}>
          {num1} {operation} {num2} = ?
        </Text>
      </View>

      {feedback ? (
        <Text style={[styles.feedback, feedback.includes('✓') && styles.correct]}>
          {feedback}
        </Text>
      ) : null}

      <View style={styles.optionsContainer}>
        {generateAnswerOptions().map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              answer === option && (option === getCorrectAnswer() ? styles.correctButton : styles.incorrectButton)
            ]}
            onPress={() => handleAnswer(option)}
            disabled={answer !== null}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  score: { fontSize: 18, color: colors.text },
  problemContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  problem: { fontSize: 48, fontWeight: 'bold', color: colors.text },
  feedback: { fontSize: 24, textAlign: 'center', marginBottom: spacing.lg, color: colors.status.error },
  correct: { color: colors.status.success },
  optionsContainer: { padding: spacing.lg, gap: spacing.md },
  optionButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  correctButton: { backgroundColor: colors.status.success },
  incorrectButton: { backgroundColor: colors.status.error },
  optionText: { color: colors.white, fontSize: 24, fontWeight: 'bold' },
});
