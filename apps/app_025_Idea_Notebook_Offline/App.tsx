import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [ideas, setIdeas] = useState([{id:'1',text:'Sample idea'}]);
  const [input, setInput] = useState('');

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Ideas</Text>
      <View style={styles.r}>
        <TextInput style={styles.i} value={input} onChangeText={setInput} placeholder="New idea..."/>
        <TouchableOpacity style={styles.b} onPress={()=>{if(input.trim()){setIdeas([...ideas,{id:Date.now().toString(),text:input}]);setInput('');}}}>
          <Text style={styles.bt}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList data={ideas} keyExtractor={i=>i.id} renderItem={({item})=>(<View style={styles.idea}><Text>{item.text}</Text></View>)}/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  r: { flexDirection: 'row', marginBottom: spacing.lg },
  i: { flex: 1, backgroundColor: colors.white, padding: spacing.md, borderRadius: 8, marginRight: spacing.sm },
  b: { backgroundColor: colors.primary, width: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  bt: { color: colors.white, fontSize: 24 },
  idea: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: 12, marginBottom: spacing.sm },
});
