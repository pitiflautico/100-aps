import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

const PROMPTS = [
  "Write about a character who discovers a hidden door",
  "Describe a futuristic city",
  "Tell the story of a lost treasure",
  "Imagine a world without technology",
  "Write from the perspective of a tree",
];

export default function App() {
  const [prompt, setPrompt] = useState(PROMPTS[0]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Writing Prompt</Text>
      <View style={styles.promptBox}>
        <Text style={styles.prompt}>{prompt}</Text>
      </View>
      <TouchableOpacity style={styles.btn} onPress={() => setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])}>
        <Text style={styles.btnText}>Generate New Prompt</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginBottom: spacing.xl },
  promptBox: { backgroundColor: colors.secondary, padding: spacing.xl, borderRadius: 16, marginBottom: spacing.xl, minHeight: 150, justifyContent: 'center' },
  prompt: { fontSize: 20, color: colors.white, textAlign: 'center', lineHeight: 30 },
  btn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  btnText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
});
