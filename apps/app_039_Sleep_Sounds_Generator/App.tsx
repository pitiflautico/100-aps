import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

const SOUNDS = ['White Noise', 'Rain', 'Ocean', 'Forest', 'Thunder'];

export default function App() {
  const [playing, setPlaying] = useState(null);

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Sleep Sounds</Text>
      <FlatList data={SOUNDS} keyExtractor={i=>i} renderItem={({item})=>(
        <TouchableOpacity
          style={[styles.sound, playing === item && styles.soundPlaying]}
          onPress={()=>setPlaying(playing === item ? null : item)}
        >
          <Text style={[styles.text, playing === item && styles.textPlaying]}>
            {item} {playing === item && '▶'}
          </Text>
        </TouchableOpacity>
      )}/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg, textAlign: 'center' },
  sound: { backgroundColor: colors.white, padding: spacing.xl, borderRadius: 12, marginBottom: spacing.md },
  soundPlaying: { backgroundColor: colors.secondary },
  text: { fontSize: 20, color: colors.text, textAlign: 'center' },
  textPlaying: { color: colors.white, fontWeight: 'bold' },
});
