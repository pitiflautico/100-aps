import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [locked, setLocked] = useState(true);
  const [pin, setPin] = useState('');
  const correctPin = '1234';

  if(locked) return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Secure Notes</Text>
      <Text style={styles.subtitle}>Enter PIN (1234)</Text>
      <TextInput style={styles.input} value={pin} onChangeText={setPin} placeholder="PIN" secureTextEntry keyboardType="number-pad"/>
      <TouchableOpacity style={styles.btn} onPress={()=>{if(pin===correctPin)setLocked(false);}}>
        <Text style={styles.btnText}>Unlock</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Secure Notes</Text>
      <Text style={styles.subtitle}>Your private notes here</Text>
      <TouchableOpacity style={styles.btn} onPress={()=>setLocked(true)}>
        <Text style={styles.btnText}>Lock</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginBottom: spacing.md },
  subtitle: { fontSize: 16, color: colors.gray.dark, textAlign: 'center', marginBottom: spacing.xl },
  input: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: 8, marginBottom: spacing.lg, fontSize: 18, textAlign: 'center' },
  btn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  btnText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
});
