import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, TextInput, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Soundboard_Custom_data';

interface Item {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (data: Item[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setItems(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const addItem = () => {
    if (!input.trim()) return;
    const newItem: Item = {
      id: Date.now().toString(),
      text: input,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    saveData([newItem, ...items]);
    setInput('');
    setShowModal(false);
    const newCount = count + 1;
    setCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const toggleItem = (id: string) => {
    saveData(items.map(i => i.id === id ? { ...i, completed: !i.completed } : i));
  };

  const deleteItem = (id: string) => {
    saveData(items.filter(i => i.id !== id));
  };

  const completed = items.filter(i => i.completed).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Soundboard Custom</Text>
        <Text style={styles.count}>{completed}/{items.length}</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No items yet</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => toggleItem(item.id)}
            onLongPress={() => deleteItem(item.id)}
          >
            <View style={[styles.check, item.completed && styles.checkActive]}>
              {item.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.itemText, item.completed && styles.itemDone]}>{item.text}</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <AdBanner />
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New</Text>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Enter text..."
              autoFocus
            />
            <View style={styles.buttons}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setShowModal(false)}>
                <Text style={styles.btnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnAdd]} onPress={addItem}>
                <Text style={styles.btnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  count: { fontSize: 16, color: colors.gray.dark },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  empty: { textAlign: 'center', marginTop: spacing.xl, color: colors.gray.medium, fontSize: 16 },
  item: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center' },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.gray.medium, marginRight: spacing.md, justifyContent: 'center', alignItems: 'center' },
  checkActive: { backgroundColor: colors.status.success, borderColor: colors.status.success },
  checkmark: { color: colors.white, fontSize: 14, fontWeight: 'bold' },
  itemText: { flex: 1, fontSize: 16, color: colors.text },
  itemDone: { textDecorationLine: 'line-through', color: colors.gray.medium },
  fab: { position: 'absolute', right: spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  fabText: { color: colors.white, fontSize: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  input: { backgroundColor: colors.gray.light, padding: spacing.md, borderRadius: 12, fontSize: 16, marginBottom: spacing.lg },
  buttons: { flexDirection: 'row', gap: spacing.md },
  btn: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  btnCancel: { backgroundColor: colors.gray.light },
  btnAdd: { backgroundColor: colors.primary },
  btnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  btnTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
