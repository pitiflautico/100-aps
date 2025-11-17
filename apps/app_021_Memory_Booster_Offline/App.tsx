import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [sequence, setSequence] = useState([1, 2, 3]);
  const [userSeq, setUserSeq] = useState([]);
  const [showSeq, setShowSeq] = useState(true);

  setTimeout(() => setShowSeq(false), 3000);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Memory Game</Text>
      {showSeq ? (
        <Text style={styles.seq}>{sequence.join(' ')}</Text>
      ) : (
        <Text style={styles.hint}>Remember the sequence!</Text>
      )}
      <View style={styles.grid}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <TouchableOpacity key={n} style={styles.btn} onPress={() => setUserSeq([...userSeq, n])}>
            <Text style={styles.btnText}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {userSeq.length > 0 && <Text style={styles.your}>Your sequence: {userSeq.join(' ')}</Text>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginBottom: spacing.xl },
  seq: { fontSize: 48, textAlign: 'center', marginBottom: spacing.xl, color: colors.primary, fontWeight: 'bold' },
  hint: { fontSize: 18, textAlign: 'center', marginBottom: spacing.xl, color: colors.gray.dark },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center' },
  btn: { width: 80, height: 80, backgroundColor: colors.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: colors.white, fontSize: 32, fontWeight: 'bold' },
  your: { fontSize: 18, textAlign: 'center', marginTop: spacing.xl, color: colors.text },
});
