import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Modal, Share } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@shopping_list';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  price: string;
  category: string;
  checked: boolean;
}

const CATEGORIES = [
  { id: 'produce', name: 'Produce', icon: '🥬', color: '#4CAF50' },
  { id: 'meat', name: 'Meat', icon: '🥩', color: '#F44336' },
  { id: 'dairy', name: 'Dairy', icon: '🥛', color: '#2196F3' },
  { id: 'bakery', name: 'Bakery', icon: '🍞', color: '#FF9800' },
  { id: 'pantry', name: 'Pantry', icon: '🥫', color: '#9C27B0' },
  { id: 'frozen', name: 'Frozen', icon: '🧊', color: '#00BCD4' },
  { id: 'snacks', name: 'Snacks', icon: '🍿', color: '#FFC107' },
  { id: 'other', name: 'Other', icon: '🛒', color: '#607D8B' },
];

export default function App() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('other');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  useEffect(() => {
    if (interactionCount > 0 && interactionCount % 8 === 0) {
      showInterstitialAd();
    }
  }, [interactionCount]);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (data: ShoppingItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setItems(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const addItem = () => {
    if (!name.trim()) return;
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name,
      quantity: quantity || '1',
      price,
      category,
      checked: false,
    };
    saveData([...items, newItem]);
    resetForm();
    setShowAddModal(false);
    setInteractionCount(prev => prev + 1);
  };

  const toggleItem = (id: string) => {
    saveData(items.map(i => (i.id === id ? { ...i, checked: !i.checked } : i)));
  };

  const deleteItem = (id: string) => {
    saveData(items.filter(i => i.id !== id));
  };

  const clearChecked = () => {
    saveData(items.filter(i => !i.checked));
    setInteractionCount(prev => prev + 1);
  };

  const resetForm = () => {
    setName('');
    setQuantity('1');
    setPrice('');
    setCategory('other');
  };

  const getCategoryName = (id: string) => CATEGORIES.find(c => c.id === id)?.name || 'Other';
  const getCategoryIcon = (id: string) => CATEGORIES.find(c => c.id === id)?.icon || '🛒';
  const getCategoryColor = (id: string) => CATEGORIES.find(c => c.id === id)?.color || colors.gray.medium;

  const getTotal = () => {
    return items.reduce((sum, item) => {
      const itemPrice = parseFloat(item.price) || 0;
      const itemQty = parseFloat(item.quantity) || 1;
      return sum + itemPrice * itemQty;
    }, 0);
  };

  const exportList = async () => {
    if (items.length === 0) return;
    const exportText = items
      .map(item => `${item.checked ? '✓' : '○'} ${item.name} (${item.quantity}) - $${item.price || '0.00'}`)
      .join('\n');
    try {
      await Share.share({
        message: `Shopping List\n\nTotal: $${getTotal().toFixed(2)}\n\n${exportText}`,
        title: 'Shopping List',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const filteredItems = filter === 'all' ? items : items.filter(i => i.category === filter);
  const groupedItems = filteredItems.reduce((groups, item) => {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
    return groups;
  }, {} as Record<string, ShoppingItem[]>);

  const checkedCount = items.filter(i => i.checked).length;
  const totalAmount = getTotal();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Shopping List</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={exportList} style={styles.exportBtn}>
            <Text style={styles.exportIcon}>📤</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length > 0 && (
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{checkedCount}/{items.length}</Text>
            <Text style={styles.statLabel}>Checked</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${totalAmount.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          {checkedCount > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearChecked}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.filterBtn, filter === cat.id && styles.filterBtnActive]}
            onPress={() => setFilter(cat.id)}
          >
            <Text style={styles.filterIcon}>{cat.icon}</Text>
            <Text style={[styles.filterText, filter === cat.id && styles.filterTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {items.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyText}>Your list is empty</Text>
            <Text style={styles.emptySubtext}>Add items to start shopping</Text>
          </View>
        )}

        {Object.keys(groupedItems)
          .sort()
          .map(catId => (
            <View key={catId} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryIcon}>{getCategoryIcon(catId)}</Text>
                <Text style={styles.categoryTitle}>{getCategoryName(catId)}</Text>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(catId) }]}>
                  <Text style={styles.categoryBadgeText}>{groupedItems[catId].length}</Text>
                </View>
              </View>

              {groupedItems[catId].map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemCard, item.checked && styles.itemCardChecked]}
                  onPress={() => toggleItem(item.id)}
                  onLongPress={() => deleteItem(item.id)}
                >
                  <View style={styles.itemLeft}>
                    <View style={[styles.checkbox, item.checked && styles.checkboxActive]}>
                      {item.checked && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>{item.name}</Text>
                      <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                    </View>
                  </View>
                  {item.price && (
                    <Text style={[styles.itemPrice, item.checked && styles.itemPriceChecked]}>
                      ${parseFloat(item.price).toFixed(2)}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AdBanner />

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Item</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Item name *" autoFocus />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.inputHalf]}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="Qty"
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.inputHalf]}
                value={price}
                onChangeText={setPrice}
                placeholder="Price"
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryBtn,
                    category === cat.id && [styles.categoryBtnActive, { borderColor: cat.color }],
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text style={styles.categoryBtnIcon}>{cat.icon}</Text>
                  <Text style={[styles.categoryBtnText, category === cat.id && { color: cat.color }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnAdd]} onPress={addItem}>
                <Text style={styles.modalBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray.light },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.white },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  exportBtn: { padding: spacing.sm },
  exportIcon: { fontSize: 24 },
  statsCard: { flexDirection: 'row', backgroundColor: colors.white, marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: 12, padding: spacing.md, gap: spacing.md, alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.gray.dark, marginTop: spacing.xs },
  clearBtn: { backgroundColor: colors.status.error, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8 },
  clearBtnText: { color: colors.white, fontSize: 12, fontWeight: 'bold' },
  filterScroll: { maxHeight: 60, marginTop: spacing.md, paddingHorizontal: spacing.lg },
  filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8, marginRight: spacing.sm, gap: spacing.xs },
  filterBtnActive: { backgroundColor: colors.primary },
  filterIcon: { fontSize: 16 },
  filterText: { fontSize: 14, color: colors.text },
  filterTextActive: { color: colors.white, fontWeight: 'bold' },
  content: { padding: spacing.lg, paddingBottom: 100 },
  emptyState: { alignItems: 'center', marginTop: spacing['3xl'] },
  emptyIcon: { fontSize: 64, marginBottom: spacing.lg },
  emptyText: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  emptySubtext: { fontSize: 14, color: colors.gray.dark },
  categorySection: { marginBottom: spacing.lg },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  categoryIcon: { fontSize: 24 },
  categoryTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, flex: 1 },
  categoryBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 8 },
  categoryBadgeText: { color: colors.white, fontSize: 12, fontWeight: 'bold' },
  itemCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemCardChecked: { opacity: 0.6 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.gray.medium, marginRight: spacing.md, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: colors.status.success, borderColor: colors.status.success },
  checkmark: { color: colors.white, fontSize: 14, fontWeight: 'bold' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', color: colors.text },
  itemNameChecked: { textDecorationLine: 'line-through' },
  itemQuantity: { fontSize: 12, color: colors.gray.dark, marginTop: 2 },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  itemPriceChecked: { textDecorationLine: 'line-through' },
  fab: { position: 'absolute', right: spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  fabText: { color: colors.white, fontSize: 32, fontWeight: '300' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  input: { backgroundColor: colors.gray.light, padding: spacing.md, borderRadius: 12, fontSize: 16, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  inputHalf: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  categoriesScroll: { maxHeight: 80, marginBottom: spacing.lg },
  categoryBtn: { alignItems: 'center', backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, marginRight: spacing.md, borderWidth: 2, borderColor: colors.gray.light, minWidth: 80 },
  categoryBtnActive: { borderWidth: 3 },
  categoryBtnIcon: { fontSize: 24, marginBottom: spacing.xs },
  categoryBtnText: { fontSize: 12, color: colors.gray.dark, fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  modalBtn: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: colors.gray.light },
  modalBtnAdd: { backgroundColor: colors.primary },
  modalBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  modalBtnTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
