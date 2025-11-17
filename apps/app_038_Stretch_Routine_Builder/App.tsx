import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

const STRETCHES = ['Neck', 'Shoulders', 'Back', 'Hamstrings', 'Quads', 'Calves'];

export default function App() {
  const [selected, setSelected] = useState([]);

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Stretch Routine</Text>
      <Text style={styles.sub}>Selected: {selected.length} stretches</Text>
      <FlatList data={STRETCHES} keyExtractor={i=>i} renderItem={({item})=>(
        <TouchableOpacity
          style={[styles.item, selected.includes(item) && styles.itemSelected]}
          onPress={()=>{
            if(selected.includes(item)) setSelected(selected.filter(s=>s!==item));
            else setSelected([...selected, item]);
          }}
        >
          <Text style={[styles.text, selected.includes(item) && styles.textSelected]}>
            {selected.includes(item) ? '✓ ' : '○ '}{item}
          </Text>
        </TouchableOpacity>
      )}/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.sm, textAlign: 'center' },
  sub: { fontSize: 16, color: colors.gray.dark, marginBottom: spacing.lg, textAlign: 'center' },
  item: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: 12, marginBottom: spacing.sm },
  itemSelected: { backgroundColor: colors.status.success },
  text: { fontSize: 18, color: colors.text },
  textSelected: { color: colors.white, fontWeight: 'bold' },
});
