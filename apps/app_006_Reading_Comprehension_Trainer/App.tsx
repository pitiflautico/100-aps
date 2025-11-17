import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

const PASSAGE = "The Sun is the star at the center of our solar system. It is a nearly perfect sphere of hot plasma.";
const QUESTIONS = [
  { q: "What is the Sun?", a: "A star at the center of our solar system" },
  { q: "What is it made of?", a: "Hot plasma" },
];

export default function App() {
  const [currentQ, setCurrentQ] = useState(0);
  const [show, setShow] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scroll}>
        <Text style={styles.title}>Reading Comprehension</Text>
        <View style={styles.box}>
          <Text style={styles.passage}>{PASSAGE}</Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.q}>{QUESTIONS[currentQ].q}</Text>
          {show && <Text style={styles.a}>{QUESTIONS[currentQ].a}</Text>}
        </View>
        <TouchableOpacity style={styles.btn} onPress={() => setShow(!show)}>
          <Text style={styles.btnText}>{show ? 'Hide' : 'Show'} Answer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => { setCurrentQ((currentQ + 1) % 2); setShow(false); }}>
          <Text style={styles.btnText}>Next Question</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, padding: spacing.lg },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  box: { backgroundColor: colors.gray.light, padding: spacing.lg, borderRadius: 12, marginBottom: spacing.md },
  passage: { fontSize: 16, lineHeight: 24, color: colors.text },
  q: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  a: { fontSize: 16, color: colors.status.success },
  btn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: 12, alignItems: 'center', marginBottom: spacing.md },
  btnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
