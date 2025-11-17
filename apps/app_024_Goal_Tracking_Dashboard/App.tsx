import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [goals] = useState([
    { id: '1', name: 'Read 12 books', current: 3, target: 12 },
    { id: '2', name: 'Exercise 100 days', current: 45, target: 100 },
  ]);

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Goals</Text>
      <FlatList data={goals} keyExtractor={i=>i.id} renderItem={({item})=>(
        <View style={styles.g}>
          <Text style={styles.n}>{item.name}</Text>
          <Text style={styles.p}>{item.current}/{item.target} ({Math.floor(item.current/item.target*100)}%)</Text>
        </View>
      )}/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  g: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: 12, marginBottom: spacing.sm },
  n: { fontSize: 18, fontWeight: 'bold', marginBottom: spacing.xs },
  p: { fontSize: 16, color: colors.gray.dark },
});
