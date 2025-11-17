import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [tasks, setTasks] = useState([{id:'1',text:'Sample task',done:false}]);
  const [input, setInput] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Tasks</Text>
      <View style={styles.inputRow}>
        <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Add task..." />
        <TouchableOpacity style={styles.btn} onPress={() => {if(input.trim()){setTasks([...tasks,{id:Date.now().toString(),text:input,done:false}]);setInput('');}}}>
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList data={tasks} keyExtractor={i=>i.id} renderItem={({item})=>(
        <TouchableOpacity style={styles.task} onPress={()=>setTasks(tasks.map(t=>t.id===item.id?{...t,done:!t.done}:t))}>
          <Text style={[styles.taskText,item.done&&styles.done]}>{item.text}</Text>
        </TouchableOpacity>
      )}/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  inputRow: { flexDirection: 'row', marginBottom: spacing.lg },
  input: { flex: 1, backgroundColor: colors.white, padding: spacing.md, borderRadius: 8, marginRight: spacing.sm },
  btn: { backgroundColor: colors.primary, width: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  btnText: { color: colors.white, fontSize: 24 },
  task: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: 12, marginBottom: spacing.sm },
  taskText: { fontSize: 16 },
  done: { textDecorationLine: 'line-through', color: colors.gray.medium },
});
