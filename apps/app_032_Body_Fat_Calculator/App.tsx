import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [waist, setWaist] = useState('80');
  const [neck, setNeck] = useState('35');
  const [height, setHeight] = useState('170');
  const bf = 495 / (1.0324 - 0.19077 * Math.log10(parseFloat(waist) - parseFloat(neck)) + 0.15456 * Math.log10(parseFloat(height))) - 450;

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Body Fat Calculator</Text>
      <View style={styles.box}>
        <Text style={styles.l}>Waist (cm)</Text>
        <TextInput style={styles.i} value={waist} onChangeText={setWaist} keyboardType="number-pad"/>
      </View>
      <View style={styles.box}>
        <Text style={styles.l}>Neck (cm)</Text>
        <TextInput style={styles.i} value={neck} onChangeText={setNeck} keyboardType="number-pad"/>
      </View>
      <View style={styles.box}>
        <Text style={styles.l}>Height (cm)</Text>
        <TextInput style={styles.i} value={height} onChangeText={setHeight} keyboardType="number-pad"/>
      </View>
      <Text style={styles.r}>Body Fat: {isNaN(bf) ? '--' : bf.toFixed(1)}%</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginBottom: spacing.xl },
  box: { marginBottom: spacing.md },
  l: { fontSize: 14, marginBottom: spacing.xs, color: colors.gray.dark },
  i: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 8, fontSize: 18 },
  r: { fontSize: 32, fontWeight: 'bold', color: colors.status.success, textAlign: 'center', marginTop: spacing.xl },
});
