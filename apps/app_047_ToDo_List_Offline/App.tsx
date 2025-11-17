import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

interface Todo {
  id: string;
  text: string;
  done: boolean;
  priority: 'low' | 'medium' | 'high';
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: '1', text: 'Finish project', done: false, priority: 'high' },
  ]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now().toString(), text: input, done: false, priority: 'medium' }]);
      setInput('');
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>To-Do List</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Add task..."
          onSubmitEditing={addTodo}
        />
        <TouchableOpacity style={styles.addButton} onPress={addTodo}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={todos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.todo, item.done && styles.todoDone]}>
            <TouchableOpacity style={styles.todoContent} onPress={() => toggleTodo(item.id)}>
              <Text style={styles.checkbox}>{item.done ? '✓' : '○'}</Text>
              <Text style={[styles.todoText, item.done && styles.todoTextDone]}>{item.text}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteTodo(item.id)}>
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  inputRow: { flexDirection: 'row', marginBottom: spacing.lg },
  input: { flex: 1, backgroundColor: colors.white, padding: spacing.md, borderRadius: 8, marginRight: spacing.sm },
  addButton: { backgroundColor: colors.primary, width: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  addText: { color: colors.white, fontSize: 24 },
  todo: { flexDirection: 'row', backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, marginBottom: spacing.sm, alignItems: 'center' },
  todoDone: { backgroundColor: colors.gray.light },
  todoContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  checkbox: { fontSize: 24, marginRight: spacing.md, color: colors.primary },
  todoText: { fontSize: 16, color: colors.text, flex: 1 },
  todoTextDone: { textDecorationLine: 'line-through', color: colors.gray.medium },
  deleteText: { fontSize: 20, color: colors.status.error, padding: spacing.sm },
});
