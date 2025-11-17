import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [foods, setFoods] = useState([{id:'1',food:'Dairy',reaction:'Bloating'}]);
  const [input, setInput] = useState('');

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Food Intolerance</Text>
      <View style={styles.inputRow}>
        <TextInput style={styles.i} value={input} onChangeText={setInput} placeholder="Food item..."/>
        <TouchableOpacity style={styles.b} onPress={()=>{if(input.trim()){setFoods([...foods,{id:Date.now().toString(),food:input,reaction:'Unknown'}]);setInput('');}}}>
          <Text style={styles.bt}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList data={foods} keyExtractor={i=>i.id} renderItem={({item})=>(
        <View style={styles.item}>
          <Text style={styles.food}>{item.food}</Text>
          <Text style={styles.reaction}>Reaction: {item.reaction}</Text>
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
  item: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: 12, marginBottom: spacing.sm },
  food: { fontSize: 18, fontWeight: 'bold', marginBottom: spacing.xs },
  reaction: { fontSize: 14, color: colors.gray.dark },
});
