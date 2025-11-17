import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [entries, setEntries] = useState([{id:'1',date:'Today',symptom:'Headache',severity:5}]);
  const [input, setInput] = useState('');

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Symptoms Diary</Text>
      <View style={styles.inputRow}>
        <TextInput style={styles.i} value={input} onChangeText={setInput} placeholder="Symptom..."/>
        <TouchableOpacity style={styles.b} onPress={()=>{if(input.trim()){setEntries([...entries,{id:Date.now().toString(),date:'Today',symptom:input,severity:3}]);setInput('');}}}>
          <Text style={styles.bt}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList data={entries} keyExtractor={i=>i.id} renderItem={({item})=>(
        <View style={styles.entry}>
          <Text style={styles.sym}>{item.symptom}</Text>
          <Text style={styles.date}>{item.date} - Severity: {item.severity}/10</Text>
        </View>
      )}/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg, textAlign: 'center' },
  inputRow: { flexDirection: 'row', marginBottom: spacing.lg },
  i: { flex: 1, backgroundColor: colors.white, padding: spacing.md, borderRadius: 8, marginRight: spacing.sm },
  b: { backgroundColor: colors.primary, width: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  bt: { color: colors.white, fontSize: 24 },
  entry: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: 12, marginBottom: spacing.sm },
  sym: { fontSize: 18, fontWeight: 'bold', marginBottom: spacing.xs },
  date: { fontSize: 14, color: colors.gray.dark },
});
