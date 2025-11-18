import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Provider as PaperProvider,
  Appbar,
  FAB,
  Card,
  Text,
  Portal,
  Modal,
  TextInput,
  Button,
  Chip,
  Searchbar,
  IconButton,
  Menu,
  ProgressBar,
  Divider,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';

// TypeScript Interfaces
interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: 'grains' | 'canned' | 'spices' | 'baking' | 'snacks' | 'beverages' | 'pasta' | 'other';
  shelf: string;
  minStock: number;
  maxStock: number;
  purchaseDate: string;
  expiryDate: string;
  barcode: string;
  price: number;
  notes: string;
  createdAt: number;
}

interface ShoppingListItem {
  itemId: string;
  name: string;
  quantity: number;
  checked: boolean;
}

// AdMob Configuration
const bannerId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';
const interstitialId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';

const interstitial = InterstitialAd.createForAdRequest(interstitialId);

const STORAGE_KEY = '@pantry_tracker_items';
const SHOPPING_LIST_KEY = '@pantry_shopping_list';

const CATEGORIES = [
  { label: 'Grains & Rice', value: 'grains', icon: 'rice' },
  { label: 'Canned Goods', value: 'canned', icon: 'can' },
  { label: 'Spices', value: 'spices', icon: 'shaker' },
  { label: 'Baking', value: 'baking', icon: 'cupcake' },
  { label: 'Snacks', value: 'snacks', icon: 'popcorn' },
  { label: 'Beverages', value: 'beverages', icon: 'cup' },
  { label: 'Pasta & Noodles', value: 'pasta', icon: 'noodles' },
  { label: 'Other', value: 'other', icon: 'food' },
];

const UNITS = ['pcs', 'kg', 'g', 'L', 'mL', 'lbs', 'oz', 'pack', 'box', 'jar', 'can'];

export default function App() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<PantryItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [shoppingModalVisible, setShoppingModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [currentView, setCurrentView] = useState<'inventory' | 'low-stock' | 'shopping'>('inventory');
  const [menuVisible, setMenuVisible] = useState(false);
  const [interstitialLoaded, setInterstitialLoaded] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    quantity: '1',
    unit: 'pcs',
    category: 'other' as PantryItem['category'],
    shelf: '',
    minStock: '5',
    maxStock: '20',
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    barcode: '',
    price: '',
    notes: '',
  });

  // AdMob Interstitial Setup
  useEffect(() => {
    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setInterstitialLoaded(true);
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setInterstitialLoaded(false);
      interstitial.load();
    });

    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
    };
  }, []);

  // Load data from storage
  useEffect(() => {
    loadItems();
    loadShoppingList();
  }, []);

  // Filter items
  useEffect(() => {
    let filtered = [...items];

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.shelf.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(item => item.category === filterCategory);
    }

    if (currentView === 'low-stock') {
      filtered = filtered.filter(item => item.quantity <= item.minStock);
    }

    filtered.sort((a, b) => a.name.localeCompare(b.name));
    setFilteredItems(filtered);
  }, [items, searchQuery, filterCategory, currentView]);

  const loadItems = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const loadShoppingList = async () => {
    try {
      const stored = await AsyncStorage.getItem(SHOPPING_LIST_KEY);
      if (stored) {
        setShoppingList(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading shopping list:', error);
    }
  };

  const saveItems = async (newItems: PantryItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      setItems(newItems);
    } catch (error) {
      console.error('Error saving items:', error);
    }
  };

  const saveShoppingList = async (list: ShoppingListItem[]) => {
    try {
      await AsyncStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(list));
      setShoppingList(list);
    } catch (error) {
      console.error('Error saving shopping list:', error);
    }
  };

  const openModal = (item?: PantryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        quantity: item.quantity.toString(),
        unit: item.unit,
        category: item.category,
        shelf: item.shelf,
        minStock: item.minStock.toString(),
        maxStock: item.maxStock.toString(),
        purchaseDate: item.purchaseDate,
        expiryDate: item.expiryDate,
        barcode: item.barcode,
        price: item.price.toString(),
        notes: item.notes,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        quantity: '1',
        unit: 'pcs',
        category: 'other',
        shelf: '',
        minStock: '5',
        maxStock: '20',
        purchaseDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        barcode: '',
        price: '',
        notes: '',
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingItem(null);
  };

  const saveItem = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter item name');
      return;
    }

    const quantity = parseFloat(formData.quantity);
    if (isNaN(quantity) || quantity < 0) {
      Alert.alert('Error', 'Please enter valid quantity');
      return;
    }

    const item: PantryItem = {
      id: editingItem?.id || Date.now().toString(),
      name: formData.name.trim(),
      quantity,
      unit: formData.unit,
      category: formData.category,
      shelf: formData.shelf.trim(),
      minStock: parseInt(formData.minStock) || 0,
      maxStock: parseInt(formData.maxStock) || 0,
      purchaseDate: formData.purchaseDate,
      expiryDate: formData.expiryDate,
      barcode: formData.barcode.trim(),
      price: parseFloat(formData.price) || 0,
      notes: formData.notes.trim(),
      createdAt: editingItem?.createdAt || Date.now(),
    };

    let newItems: PantryItem[];
    if (editingItem) {
      newItems = items.map(i => (i.id === editingItem.id ? item : i));
    } else {
      newItems = [...items, item];

      if (newItems.length % 5 === 0 && interstitialLoaded) {
        interstitial.show();
      }
    }

    await saveItems(newItems);
    closeModal();
  };

  const deleteItem = (id: string) => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const newItems = items.filter(item => item.id !== id);
          await saveItems(newItems);
        },
      },
    ]);
  };

  const updateQuantity = async (id: string, delta: number) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    });
    await saveItems(newItems);
  };

  const addToShoppingList = (item: PantryItem) => {
    const existingItem = shoppingList.find(si => si.itemId === item.id);
    if (existingItem) {
      Alert.alert('Already in List', 'This item is already in your shopping list.');
      return;
    }

    const neededQuantity = Math.max(1, item.maxStock - item.quantity);
    const newList = [
      ...shoppingList,
      {
        itemId: item.id,
        name: item.name,
        quantity: neededQuantity,
        checked: false,
      },
    ];
    saveShoppingList(newList);
  };

  const generateShoppingList = () => {
    const lowStockItems = items.filter(item => item.quantity <= item.minStock);
    if (lowStockItems.length === 0) {
      Alert.alert('No Low Stock Items', 'All items are well stocked!');
      return;
    }

    const newList: ShoppingListItem[] = [];
    lowStockItems.forEach(item => {
      if (!shoppingList.find(si => si.itemId === item.id)) {
        newList.push({
          itemId: item.id,
          name: item.name,
          quantity: Math.max(1, item.maxStock - item.quantity),
          checked: false,
        });
      }
    });

    if (newList.length === 0) {
      Alert.alert('Shopping List Up to Date', 'All low stock items are already in your shopping list.');
      return;
    }

    saveShoppingList([...shoppingList, ...newList]);
    Alert.alert('Success', `Added ${newList.length} items to shopping list`);
  };

  const toggleShoppingItem = (itemId: string) => {
    const newList = shoppingList.map(item =>
      item.itemId === itemId ? { ...item, checked: !item.checked } : item
    );
    saveShoppingList(newList);
  };

  const removeFromShoppingList = (itemId: string) => {
    const newList = shoppingList.filter(item => item.itemId !== itemId);
    saveShoppingList(newList);
  };

  const clearCheckedItems = () => {
    const checkedItems = shoppingList.filter(item => item.checked);
    if (checkedItems.length === 0) {
      Alert.alert('No Items', 'No checked items to clear.');
      return;
    }

    Alert.alert(
      'Clear Checked Items',
      `Remove ${checkedItems.length} checked item(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: () => {
            const newList = shoppingList.filter(item => !item.checked);
            saveShoppingList(newList);
          },
        },
      ]
    );
  };

  const getStockLevel = (item: PantryItem) => {
    if (item.quantity <= item.minStock) {
      return { level: 'low', color: '#d32f2f', text: 'Low Stock' };
    } else if (item.quantity >= item.maxStock) {
      return { level: 'full', color: '#388e3c', text: 'Full Stock' };
    } else {
      return { level: 'medium', color: '#f57c00', text: 'Medium Stock' };
    }
  };

  const getStockProgress = (item: PantryItem) => {
    if (item.maxStock === 0) return 0;
    return Math.min(1, item.quantity / item.maxStock);
  };

  const getCategoryIcon = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.icon || 'food';
  };

  const renderInventoryItem = (item: PantryItem) => {
    const stockLevel = getStockLevel(item);
    const stockProgress = getStockProgress(item);

    return (
      <Card key={item.id} style={styles.itemCard}>
        <Card.Content>
          <View style={styles.itemHeader}>
            <View style={styles.itemHeaderLeft}>
              <IconButton
                icon={getCategoryIcon(item.category)}
                size={24}
                iconColor="#6200ee"
              />
              <View style={styles.itemHeaderText}>
                <Text variant="titleMedium" style={styles.itemName}>
                  {item.name}
                </Text>
                <Text variant="bodySmall" style={styles.itemQuantity}>
                  {item.quantity} {item.unit}
                  {item.shelf ? ` • ${item.shelf}` : ''}
                </Text>
              </View>
            </View>
            <View style={styles.itemActions}>
              <IconButton
                icon="minus"
                size={20}
                onPress={() => updateQuantity(item.id, -1)}
              />
              <IconButton
                icon="plus"
                size={20}
                onPress={() => updateQuantity(item.id, 1)}
              />
            </View>
          </View>

          <View style={styles.stockContainer}>
            <View style={styles.stockInfo}>
              <Text variant="bodySmall" style={styles.stockLabel}>
                Stock: {item.quantity} / {item.maxStock}
              </Text>
              <Chip
                style={[styles.stockChip, { backgroundColor: stockLevel.color + '20' }]}
                textStyle={[styles.chipText, { color: stockLevel.color }]}
              >
                {stockLevel.text}
              </Chip>
            </View>
            <ProgressBar
              progress={stockProgress}
              color={stockLevel.color}
              style={styles.progressBar}
            />
          </View>

          {item.expiryDate ? (
            <Text variant="bodySmall" style={styles.expiryText}>
              Expires: {item.expiryDate}
            </Text>
          ) : null}

          {item.notes ? (
            <Text variant="bodySmall" style={styles.itemNotes}>
              {item.notes}
            </Text>
          ) : null}

          <View style={styles.itemFooter}>
            <View style={styles.itemFooterLeft}>
              {item.price > 0 && (
                <Text variant="bodySmall" style={styles.priceText}>
                  ${item.price.toFixed(2)}
                </Text>
              )}
            </View>
            <View style={styles.itemFooterActions}>
              <IconButton
                icon="cart-plus"
                size={20}
                onPress={() => addToShoppingList(item)}
              />
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => openModal(item)}
              />
              <IconButton
                icon="delete"
                size={20}
                iconColor="#d32f2f"
                onPress={() => deleteItem(item.id)}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderShoppingItem = (item: ShoppingListItem) => {
    return (
      <Card key={item.itemId} style={styles.shoppingCard}>
        <Card.Content>
          <View style={styles.shoppingItemRow}>
            <IconButton
              icon={item.checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              iconColor={item.checked ? '#388e3c' : '#666'}
              onPress={() => toggleShoppingItem(item.itemId)}
            />
            <View style={styles.shoppingItemContent}>
              <Text
                variant="bodyLarge"
                style={[
                  styles.shoppingItemName,
                  item.checked && styles.shoppingItemChecked,
                ]}
              >
                {item.name}
              </Text>
              <Text variant="bodySmall" style={styles.shoppingItemQuantity}>
                Quantity: {item.quantity}
              </Text>
            </View>
            <IconButton
              icon="close"
              size={20}
              onPress={() => removeFromShoppingList(item.itemId)}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="Pantry Tracker" />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Appbar.Action
                icon="dots-vertical"
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                generateShoppingList();
              }}
              title="Generate Shopping List"
              leadingIcon="cart-plus"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                clearCheckedItems();
              }}
              title="Clear Checked Items"
              leadingIcon="check-all"
            />
          </Menu>
        </Appbar.Header>

        {/* View Tabs */}
        <View style={styles.tabsContainer}>
          <Chip
            selected={currentView === 'inventory'}
            onPress={() => setCurrentView('inventory')}
            icon="package-variant"
            style={styles.tabChip}
          >
            Inventory ({items.length})
          </Chip>
          <Chip
            selected={currentView === 'low-stock'}
            onPress={() => setCurrentView('low-stock')}
            icon="alert"
            style={styles.tabChip}
          >
            Low Stock ({items.filter(i => i.quantity <= i.minStock).length})
          </Chip>
          <Chip
            selected={currentView === 'shopping'}
            onPress={() => setCurrentView('shopping')}
            icon="cart"
            style={styles.tabChip}
          >
            Shopping ({shoppingList.length})
          </Chip>
        </View>

        {currentView !== 'shopping' && (
          <>
            {/* Search and Filters */}
            <View style={styles.filtersContainer}>
              <Searchbar
                placeholder="Search pantry..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchbar}
              />

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                <Chip
                  selected={filterCategory === 'all'}
                  onPress={() => setFilterCategory('all')}
                  style={styles.filterChip}
                >
                  All
                </Chip>
                {CATEGORIES.map(cat => (
                  <Chip
                    key={cat.value}
                    selected={filterCategory === cat.value}
                    onPress={() => setFilterCategory(cat.value)}
                    icon={cat.icon}
                    style={styles.filterChip}
                  >
                    {cat.label}
                  </Chip>
                ))}
              </ScrollView>
            </View>

            {/* Items List */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
              {filteredItems.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconButton
                    icon={currentView === 'low-stock' ? 'alert' : 'package-variant-closed'}
                    size={64}
                    iconColor="#ccc"
                  />
                  <Text variant="titleMedium" style={styles.emptyText}>
                    {currentView === 'low-stock' ? 'No low stock items' : 'No items in pantry'}
                  </Text>
                  <Text variant="bodyMedium" style={styles.emptySubtext}>
                    {currentView === 'low-stock'
                      ? 'All items are well stocked!'
                      : 'Add your first item to get started'}
                  </Text>
                </View>
              ) : (
                filteredItems.map(renderInventoryItem)
              )}

              <View style={styles.adContainer}>
                <BannerAd unitId={bannerId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
              </View>
            </ScrollView>
          </>
        )}

        {currentView === 'shopping' && (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {shoppingList.length === 0 ? (
              <View style={styles.emptyState}>
                <IconButton icon="cart-outline" size={64} iconColor="#ccc" />
                <Text variant="titleMedium" style={styles.emptyText}>
                  Shopping list is empty
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  Add items or generate from low stock
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.shoppingStats}>
                  <Text variant="bodyMedium">
                    {shoppingList.filter(i => i.checked).length} / {shoppingList.length} items checked
                  </Text>
                </View>
                {shoppingList.map(renderShoppingItem)}
              </>
            )}

            <View style={styles.adContainer}>
              <BannerAd unitId={bannerId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
            </View>
          </ScrollView>
        )}

        {/* Add Item Modal */}
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={closeModal}
            contentContainerStyle={styles.modal}
          >
            <ScrollView>
              <Text variant="titleLarge" style={styles.modalTitle}>
                {editingItem ? 'Edit Item' : 'Add Item'}
              </Text>

              <TextInput
                label="Item Name *"
                value={formData.name}
                onChangeText={text => setFormData({ ...formData, name: text })}
                style={styles.input}
                mode="outlined"
              />

              <View style={styles.row}>
                <TextInput
                  label="Quantity *"
                  value={formData.quantity}
                  onChangeText={text => setFormData({ ...formData, quantity: text })}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  keyboardType="numeric"
                />
                <TextInput
                  label="Unit *"
                  value={formData.unit}
                  onChangeText={text => setFormData({ ...formData, unit: text })}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                />
              </View>

              <Text variant="labelMedium" style={styles.label}>
                Category *
              </Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(cat => (
                  <Chip
                    key={cat.value}
                    selected={formData.category === cat.value}
                    onPress={() => setFormData({ ...formData, category: cat.value as any })}
                    icon={cat.icon}
                    style={styles.categoryChip}
                  >
                    {cat.label}
                  </Chip>
                ))}
              </View>

              <TextInput
                label="Shelf/Location"
                value={formData.shelf}
                onChangeText={text => setFormData({ ...formData, shelf: text })}
                style={styles.input}
                mode="outlined"
                placeholder="e.g., Top shelf, Drawer 2"
              />

              <View style={styles.row}>
                <TextInput
                  label="Min Stock"
                  value={formData.minStock}
                  onChangeText={text => setFormData({ ...formData, minStock: text })}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  keyboardType="numeric"
                />
                <TextInput
                  label="Max Stock"
                  value={formData.maxStock}
                  onChangeText={text => setFormData({ ...formData, maxStock: text })}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.row}>
                <TextInput
                  label="Purchase Date"
                  value={formData.purchaseDate}
                  onChangeText={text => setFormData({ ...formData, purchaseDate: text })}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  placeholder="YYYY-MM-DD"
                />
                <TextInput
                  label="Expiry Date"
                  value={formData.expiryDate}
                  onChangeText={text => setFormData({ ...formData, expiryDate: text })}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.row}>
                <TextInput
                  label="Barcode"
                  value={formData.barcode}
                  onChangeText={text => setFormData({ ...formData, barcode: text })}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                />
                <TextInput
                  label="Price"
                  value={formData.price}
                  onChangeText={text => setFormData({ ...formData, price: text })}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  keyboardType="decimal-pad"
                  left={<TextInput.Affix text="$" />}
                />
              </View>

              <TextInput
                label="Notes"
                value={formData.notes}
                onChangeText={text => setFormData({ ...formData, notes: text })}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>
                <Button mode="outlined" onPress={closeModal} style={styles.modalButton}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={saveItem} style={styles.modalButton}>
                  {editingItem ? 'Update' : 'Add'}
                </Button>
              </View>
            </ScrollView>
          </Modal>
        </Portal>

        {currentView !== 'shopping' && (
          <FAB icon="plus" style={styles.fab} onPress={() => openModal()} />
        )}
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    elevation: 2,
  },
  tabChip: {
    flex: 1,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 8,
    elevation: 2,
  },
  searchbar: {
    marginBottom: 8,
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  filterChips: {
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  itemCard: {
    marginBottom: 12,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemHeaderText: {
    flex: 1,
  },
  itemName: {
    fontWeight: 'bold',
  },
  itemQuantity: {
    color: '#666',
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
  },
  stockContainer: {
    marginBottom: 8,
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stockLabel: {
    color: '#666',
  },
  stockChip: {
    height: 24,
  },
  chipText: {
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  expiryText: {
    color: '#666',
    marginBottom: 4,
  },
  itemNotes: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  itemFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    color: '#388e3c',
    fontWeight: 'bold',
  },
  itemFooterActions: {
    flexDirection: 'row',
  },
  shoppingStats: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
  },
  shoppingCard: {
    marginBottom: 8,
    elevation: 2,
  },
  shoppingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shoppingItemContent: {
    flex: 1,
  },
  shoppingItemName: {
    fontWeight: '500',
  },
  shoppingItemChecked: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  shoppingItemQuantity: {
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
  },
  emptySubtext: {
    marginTop: 8,
    color: '#999',
  },
  adContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '90%',
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    marginTop: 8,
    marginBottom: 8,
    color: '#666',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#6200ee',
  },
});
