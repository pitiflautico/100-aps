import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, TextInput,
  Modal, ScrollView, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography } from './theme';
import { AdBanner } from './components/AdBanner';
import { AdsManager } from './services/adsManager';

const STORAGE_KEY = '@Travel_Packing_Data';

interface PackingItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  packed: boolean;
}

interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  tripType: string;
  items: PackingItem[];
  createdAt: string;
}

const TRIP_TYPES = ['Beach', 'City', 'Mountain', 'Business', 'Adventure', 'Cruise', 'Camping'];
const CATEGORIES = ['Clothing', 'Documents', 'Electronics', 'Toiletries', 'Medications', 'Accessories', 'Other'];

const CATEGORY_ICONS: { [key: string]: string } = {
  Clothing: '👕',
  Documents: '📄',
  Electronics: '🔌',
  Toiletries: '🧴',
  Medications: '💊',
  Accessories: '👜',
  Other: '📦',
};

const TRIP_ICONS: { [key: string]: string } = {
  Beach: '🏖️',
  City: '🏙️',
  Mountain: '⛰️',
  Business: '💼',
  Adventure: '🎒',
  Cruise: '🚢',
  Camping: '⛺',
};

const PACKING_TEMPLATES: { [key: string]: Array<{ name: string; category: string; quantity: number }> } = {
  Beach: [
    { name: 'Swimsuit', category: 'Clothing', quantity: 2 },
    { name: 'Sunscreen', category: 'Toiletries', quantity: 1 },
    { name: 'Beach towel', category: 'Accessories', quantity: 1 },
    { name: 'Sunglasses', category: 'Accessories', quantity: 1 },
    { name: 'Flip flops', category: 'Clothing', quantity: 1 },
  ],
  Business: [
    { name: 'Suit', category: 'Clothing', quantity: 2 },
    { name: 'Dress shoes', category: 'Clothing', quantity: 1 },
    { name: 'Laptop', category: 'Electronics', quantity: 1 },
    { name: 'Business cards', category: 'Documents', quantity: 1 },
    { name: 'Charger', category: 'Electronics', quantity: 1 },
  ],
  Mountain: [
    { name: 'Hiking boots', category: 'Clothing', quantity: 1 },
    { name: 'Jacket', category: 'Clothing', quantity: 1 },
    { name: 'Water bottle', category: 'Accessories', quantity: 1 },
    { name: 'First aid kit', category: 'Medications', quantity: 1 },
  ],
  Camping: [
    { name: 'Tent', category: 'Accessories', quantity: 1 },
    { name: 'Sleeping bag', category: 'Accessories', quantity: 1 },
    { name: 'Flashlight', category: 'Electronics', quantity: 1 },
    { name: 'Matches', category: 'Other', quantity: 1 },
  ],
};

export default function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showAddTripModal, setShowAddTripModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Trip form
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tripType, setTripType] = useState('Beach');

  // Item form
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemCategory, setItemCategory] = useState('Clothing');
  const [editingItem, setEditingItem] = useState<PackingItem | null>(null);

  const [actionCount, setActionCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTrips();
  }, [trips, searchQuery]);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setTrips(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (data: Trip[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const filterTrips = () => {
    let filtered = [...trips];

    if (searchQuery.trim()) {
      filtered = filtered.filter(trip =>
        trip.destination.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by start date
    filtered.sort((a, b) => {
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

    setFilteredTrips(filtered);
  };

  const addTrip = () => {
    if (!destination.trim()) {
      Alert.alert('Error', 'Please enter a destination');
      return;
    }

    const templateItems = PACKING_TEMPLATES[tripType] || [];
    const items: PackingItem[] = templateItems.map((item, index) => ({
      id: `${Date.now()}-${index}`,
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      packed: false,
    }));

    const newTrip: Trip = {
      id: Date.now().toString(),
      destination: destination.trim(),
      startDate,
      endDate,
      tripType,
      items,
      createdAt: new Date().toISOString(),
    };

    const updated = [...trips, newTrip];
    setTrips(updated);
    saveData(updated);
    resetTripForm();
    setShowAddTripModal(false);
    incrementAction();
  };

  const updateTrip = (tripId: string, updates: Partial<Trip>) => {
    const updated = trips.map(t =>
      t.id === tripId ? { ...t, ...updates } : t
    );
    setTrips(updated);
    saveData(updated);
  };

  const deleteTrip = (tripId: string) => {
    Alert.alert(
      'Delete Trip',
      'Are you sure you want to delete this trip and all its items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updated = trips.filter(t => t.id !== tripId);
            setTrips(updated);
            saveData(updated);
            setSelectedTrip(null);
            incrementAction();
          },
        },
      ]
    );
  };

  const addItem = () => {
    if (!selectedTrip || !itemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    const newItem: PackingItem = {
      id: Date.now().toString(),
      name: itemName.trim(),
      quantity: parseInt(itemQuantity) || 1,
      category: itemCategory,
      packed: false,
    };

    const updatedItems = [...selectedTrip.items, newItem];
    updateTrip(selectedTrip.id, { items: updatedItems });
    setSelectedTrip({ ...selectedTrip, items: updatedItems });

    resetItemForm();
    setShowAddItemModal(false);
    incrementAction();
  };

  const updateItem = () => {
    if (!selectedTrip || !editingItem || !itemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    const updatedItems = selectedTrip.items.map(item =>
      item.id === editingItem.id
        ? { ...item, name: itemName.trim(), quantity: parseInt(itemQuantity) || 1, category: itemCategory }
        : item
    );

    updateTrip(selectedTrip.id, { items: updatedItems });
    setSelectedTrip({ ...selectedTrip, items: updatedItems });

    resetItemForm();
    setShowAddItemModal(false);
    incrementAction();
  };

  const deleteItem = (itemId: string) => {
    if (!selectedTrip) return;

    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updatedItems = selectedTrip.items.filter(item => item.id !== itemId);
          updateTrip(selectedTrip.id, { items: updatedItems });
          setSelectedTrip({ ...selectedTrip, items: updatedItems });
          incrementAction();
        },
      },
    ]);
  };

  const togglePacked = (itemId: string) => {
    if (!selectedTrip) return;

    const updatedItems = selectedTrip.items.map(item =>
      item.id === itemId ? { ...item, packed: !item.packed } : item
    );

    updateTrip(selectedTrip.id, { items: updatedItems });
    setSelectedTrip({ ...selectedTrip, items: updatedItems });
  };

  const incrementAction = () => {
    const newCount = actionCount + 1;
    setActionCount(newCount);
    if (newCount % 5 === 0) {
      AdsManager.showInterstitialAd();
    }
  };

  const resetTripForm = () => {
    setDestination('');
    setStartDate('');
    setEndDate('');
    setTripType('Beach');
  };

  const resetItemForm = () => {
    setItemName('');
    setItemQuantity('1');
    setItemCategory('Clothing');
    setEditingItem(null);
  };

  const openEditItem = (item: PackingItem) => {
    setItemName(item.name);
    setItemQuantity(item.quantity.toString());
    setItemCategory(item.category);
    setEditingItem(item);
    setShowAddItemModal(true);
  };

  const getItemsByCategory = () => {
    if (!selectedTrip) return {};

    const grouped: { [key: string]: PackingItem[] } = {};
    selectedTrip.items.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });

    return grouped;
  };

  const getProgress = (trip: Trip) => {
    if (trip.items.length === 0) return 0;
    const packed = trip.items.filter(item => item.packed).length;
    return Math.round((packed / trip.items.length) * 100);
  };

  const renderTripCard = ({ item }: { item: Trip }) => {
    const progress = getProgress(item);
    const totalItems = item.items.length;
    const packedItems = item.items.filter(i => i.packed).length;

    return (
      <TouchableOpacity
        style={styles.tripCard}
        onPress={() => setSelectedTrip(item)}
      >
        <View style={styles.tripHeader}>
          <View style={styles.tripInfo}>
            <Text style={styles.tripIcon}>{TRIP_ICONS[item.tripType] || '✈️'}</Text>
            <View style={styles.tripDetails}>
              <Text style={styles.tripDestination}>{item.destination}</Text>
              <Text style={styles.tripType}>{item.tripType}</Text>
              {item.startDate && (
                <Text style={styles.tripDate}>
                  {item.startDate} {item.endDate && `- ${item.endDate}`}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {packedItems}/{totalItems} items packed ({progress}%)
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderItemRow = (item: PackingItem) => (
    <View key={item.id} style={[styles.itemCard, item.packed && styles.itemPacked]}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => togglePacked(item.id)}
      >
        <Text style={styles.checkboxText}>{item.packed ? '✓' : ''}</Text>
      </TouchableOpacity>

      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, item.packed && styles.itemNamePacked]}>
          {item.name}
        </Text>
        <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity onPress={() => openEditItem(item)} style={styles.itemActionBtn}>
          <Text style={styles.itemActionText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.itemActionBtn}>
          <Text style={styles.itemActionText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (selectedTrip) {
    const itemsByCategory = getItemsByCategory();
    const progress = getProgress(selectedTrip);

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedTrip(null)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Packing List</Text>
          <TouchableOpacity onPress={() => deleteTrip(selectedTrip.id)}>
            <Text style={styles.deleteButton}>Delete</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tripDetailHeader}>
          <View style={styles.tripDetailInfo}>
            <Text style={styles.tripDetailIcon}>
              {TRIP_ICONS[selectedTrip.tripType] || '✈️'}
            </Text>
            <View>
              <Text style={styles.tripDetailDestination}>{selectedTrip.destination}</Text>
              <Text style={styles.tripDetailType}>{selectedTrip.tripType}</Text>
              {selectedTrip.startDate && (
                <Text style={styles.tripDetailDate}>
                  {selectedTrip.startDate} {selectedTrip.endDate && `- ${selectedTrip.endDate}`}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.progressContainerLarge}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressTextLarge}>{progress}% Complete</Text>
          </View>
        </View>

        <AdBanner />

        <ScrollView style={styles.itemsContainer}>
          {Object.entries(itemsByCategory).map(([category, items]) => (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryIcon}>{CATEGORY_ICONS[category]}</Text>
                <Text style={styles.categoryTitle}>{category}</Text>
                <Text style={styles.categoryCount}>
                  {items.filter(i => i.packed).length}/{items.length}
                </Text>
              </View>
              {items.map(item => renderItemRow(item))}
            </View>
          ))}

          {selectedTrip.items.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎒</Text>
              <Text style={styles.emptyText}>No items yet</Text>
              <Text style={styles.emptySubtext}>Tap the + button to add items</Text>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            resetItemForm();
            setShowAddItemModal(true);
          }}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        {/* Add/Edit Item Modal */}
        <Modal visible={showAddItemModal} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingItem ? 'Edit Item' : 'Add Item'}
                </Text>
                <TouchableOpacity onPress={() => {
                  setShowAddItemModal(false);
                  resetItemForm();
                }}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <Text style={styles.label}>Item Name *</Text>
                <TextInput
                  style={styles.input}
                  value={itemName}
                  onChangeText={setItemName}
                  placeholder="e.g., T-shirts, Passport..."
                />

                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={itemQuantity}
                  onChangeText={setItemQuantity}
                  placeholder="1"
                  keyboardType="number-pad"
                />

                <Text style={styles.label}>Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categorySelector}
                >
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryOption,
                        itemCategory === cat && styles.categoryOptionActive,
                      ]}
                      onPress={() => setItemCategory(cat)}
                    >
                      <Text style={styles.categoryOptionIcon}>{CATEGORY_ICONS[cat]}</Text>
                      <Text
                        style={[
                          styles.categoryOptionText,
                          itemCategory === cat && styles.categoryOptionTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={editingItem ? updateItem : addItem}
                >
                  <Text style={styles.addButtonText}>
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Travel Packing</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search trips..."
        />
      </View>

      <AdBanner />

      <FlatList
        data={filteredTrips}
        renderItem={renderTripCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✈️</Text>
            <Text style={styles.emptyText}>No trips yet</Text>
            <Text style={styles.emptySubtext}>Start planning your next adventure!</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          resetTripForm();
          setShowAddTripModal(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Trip Modal */}
      <Modal visible={showAddTripModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Trip</Text>
              <TouchableOpacity onPress={() => {
                setShowAddTripModal(false);
                resetTripForm();
              }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.label}>Destination *</Text>
              <TextInput
                style={styles.input}
                value={destination}
                onChangeText={setDestination}
                placeholder="e.g., Paris, Tokyo, New York..."
              />

              <Text style={styles.label}>Trip Type</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categorySelector}
              >
                {TRIP_TYPES.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.categoryOption,
                      tripType === type && styles.categoryOptionActive,
                    ]}
                    onPress={() => setTripType(type)}
                  >
                    <Text style={styles.categoryOptionIcon}>{TRIP_ICONS[type]}</Text>
                    <Text
                      style={[
                        styles.categoryOptionText,
                        tripType === type && styles.categoryOptionTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Start Date</Text>
              <TextInput
                style={styles.input}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
              />

              <Text style={styles.label}>End Date</Text>
              <TextInput
                style={styles.input}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
              />

              <Text style={styles.helperText}>
                💡 A packing template will be added based on your trip type
              </Text>

              <TouchableOpacity style={styles.addButton} onPress={addTrip}>
                <Text style={styles.addButtonText}>Create Trip</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  headerTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  backButton: {
    fontSize: typography.sizes.lg,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  deleteButton: {
    fontSize: typography.sizes.base,
    color: colors.status.error,
    fontWeight: typography.weights.semibold,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: typography.sizes.base,
  },
  list: {
    padding: spacing.md,
  },
  tripCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripHeader: {
    marginBottom: spacing.md,
  },
  tripInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripIcon: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  tripDetails: {
    flex: 1,
  },
  tripDestination: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  tripType: {
    fontSize: typography.sizes.sm,
    color: colors.gray.dark,
    marginTop: spacing.xs,
  },
  tripDate: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  progressContainer: {
    marginTop: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: typography.sizes.sm,
    color: colors.gray.dark,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  tripDetailHeader: {
    padding: spacing.md,
    backgroundColor: colors.gray.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.medium,
  },
  tripDetailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tripDetailIcon: {
    fontSize: 56,
    marginRight: spacing.md,
  },
  tripDetailDestination: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  tripDetailType: {
    fontSize: typography.sizes.base,
    color: colors.gray.dark,
    marginTop: spacing.xs,
  },
  tripDetailDate: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  progressContainerLarge: {
    marginTop: spacing.sm,
  },
  progressTextLarge: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  itemsContainer: {
    flex: 1,
  },
  categorySection: {
    padding: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  categoryTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    flex: 1,
  },
  categoryCount: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    backgroundColor: colors.gray.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  itemPacked: {
    backgroundColor: colors.gray.light,
    borderLeftColor: colors.status.success,
    opacity: 0.6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxText: {
    color: colors.primary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  itemNamePacked: {
    textDecorationLine: 'line-through',
    color: colors.gray.dark,
  },
  itemQuantity: {
    fontSize: typography.sizes.sm,
    color: colors.gray.dark,
    marginTop: spacing.xs / 2,
  },
  itemActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  itemActionBtn: {
    padding: spacing.xs,
  },
  itemActionText: {
    fontSize: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray.dark,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.sizes.base,
    color: colors.gray.dark,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  modalClose: {
    fontSize: typography.sizes['2xl'],
    color: colors.gray.dark,
  },
  modalScroll: {
    padding: spacing.md,
  },
  label: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: typography.sizes.base,
    marginBottom: spacing.sm,
  },
  categorySelector: {
    maxHeight: 100,
    marginBottom: spacing.sm,
  },
  categoryOption: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.gray.light,
    marginRight: spacing.sm,
    minWidth: 80,
  },
  categoryOptionActive: {
    backgroundColor: colors.primary,
  },
  categoryOptionIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  categoryOptionText: {
    fontSize: typography.sizes.xs,
    color: colors.text,
  },
  categoryOptionTextActive: {
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
  helperText: {
    fontSize: typography.sizes.sm,
    color: colors.gray.dark,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.gray.light,
    borderRadius: 8,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  addButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
});
