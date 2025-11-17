import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
}

export default function App() {
  const [items, setItems] = useState<ShoppingItem[]>([
    { id: '1', name: 'Milk', checked: false },
    { id: '2', name: 'Bread', checked: false },
  ]);
  const [input, setInput] = useState('');

  const addItem = () => {
    if (input.trim()) {
      setItems([...items, { id: Date.now().toString(), name: input, checked: false }]);
      setInput('');
    }
  };

  const toggleItem = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Shopping List</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Add item..."
          onSubmitEditing={addItem}
        />
        <TouchableOpacity style={styles.addButton} onPress={addItem}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <TouchableOpacity
              style={styles.itemContent}
              onPress={() => toggleItem(item.id)}
            >
              <Text style={styles.checkbox}>{item.checked ? '☑' : '☐'}</Text>
              <Text style={[styles.itemText, item.checked && styles.checkedText]}>
                {item.name}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteItem(item.id)}>
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
  item: { flexDirection: 'row', backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, marginBottom: spacing.sm, alignItems: 'center' },
  itemContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  checkbox: { fontSize: 24, marginRight: spacing.md, color: colors.primary },
  itemText: { fontSize: 16, color: colors.text },
  checkedText: { textDecorationLine: 'line-through', color: colors.gray.medium },
  deleteText: { fontSize: 20, color: colors.status.error, padding: spacing.sm },
});
