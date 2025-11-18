import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
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
  SegmentedButtons,
  IconButton,
  Menu,
  Divider,
  Badge,
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
interface FridgeItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: 'dairy' | 'meat' | 'vegetables' | 'fruits' | 'beverages' | 'condiments' | 'leftovers' | 'other';
  location: 'main' | 'freezer' | 'door' | 'drawer';
  expiryDate: string;
  purchaseDate: string;
  notes: string;
  alertDays: number;
  createdAt: number;
}

interface Statistics {
  totalItems: number;
  expiringSoon: number;
  expired: number;
  byCategory: { [key: string]: number };
  byLocation: { [key: string]: number };
}

// AdMob Configuration
const bannerId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';
const interstitialId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';

const interstitial = InterstitialAd.createForAdRequest(interstitialId);

const STORAGE_KEY = '@fridge_inventory_items';

const CATEGORIES = [
  { label: 'Dairy', value: 'dairy', icon: 'cheese' },
  { label: 'Meat', value: 'meat', icon: 'food-steak' },
  { label: 'Vegetables', value: 'vegetables', icon: 'carrot' },
  { label: 'Fruits', value: 'fruits', icon: 'fruit-cherries' },
  { label: 'Beverages', value: 'beverages', icon: 'cup' },
  { label: 'Condiments', value: 'condiments', icon: 'bottle-wine' },
  { label: 'Leftovers', value: 'leftovers', icon: 'food' },
  { label: 'Other', value: 'other', icon: 'dots-horizontal' },
];

const LOCATIONS = [
  { label: 'Main', value: 'main', icon: 'fridge' },
  { label: 'Freezer', value: 'freezer', icon: 'snowflake' },
  { label: 'Door', value: 'door', icon: 'door' },
  { label: 'Drawer', value: 'drawer', icon: 'drawer' },
];

const UNITS = ['pcs', 'kg', 'g', 'L', 'mL', 'lbs', 'oz', 'pack', 'bottle', 'can'];

export default function App() {
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FridgeItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<FridgeItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'expiry' | 'added'>('expiry');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [menuVisible, setMenuVisible] = useState(false);
  const [statistics, setStatistics] = useState<Statistics>({
    totalItems: 0,
    expiringSoon: 0,
    expired: 0,
    byCategory: {},
    byLocation: {},
  });
  const [interstitialLoaded, setInterstitialLoaded] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    quantity: '1',
    unit: 'pcs',
    category: 'other' as FridgeItem['category'],
    location: 'main' as FridgeItem['location'],
    expiryDate: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
    alertDays: '3',
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

  // Load items from storage
  useEffect(() => {
    loadItems();
  }, []);

  // Filter and sort items
  useEffect(() => {
    let filtered = [...items];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(item => item.category === filterCategory);
    }

    // Location filter
    if (filterLocation !== 'all') {
      filtered = filtered.filter(item => item.location === filterLocation);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'expiry':
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        case 'added':
          return b.createdAt - a.createdAt;
        default:
          return 0;
      }
    });

    setFilteredItems(filtered);
  }, [items, searchQuery, filterCategory, filterLocation, sortBy]);

  // Calculate statistics
  useEffect(() => {
    const stats: Statistics = {
      totalItems: items.length,
      expiringSoon: 0,
      expired: 0,
      byCategory: {},
      byLocation: {},
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    items.forEach(item => {
      const expiryDate = new Date(item.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) {
        stats.expired++;
      } else if (daysUntilExpiry <= item.alertDays) {
        stats.expiringSoon++;
      }

      stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
      stats.byLocation[item.location] = (stats.byLocation[item.location] || 0) + 1;
    });

    setStatistics(stats);
  }, [items]);

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

  const saveItems = async (newItems: FridgeItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      setItems(newItems);
    } catch (error) {
      console.error('Error saving items:', error);
    }
  };

  const openModal = (item?: FridgeItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        quantity: item.quantity.toString(),
        unit: item.unit,
        category: item.category,
        location: item.location,
        expiryDate: item.expiryDate,
        purchaseDate: item.purchaseDate,
        notes: item.notes,
        alertDays: item.alertDays.toString(),
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        quantity: '1',
        unit: 'pcs',
        category: 'other',
        location: 'main',
        expiryDate: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: '',
        alertDays: '3',
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

    if (!formData.expiryDate) {
      Alert.alert('Error', 'Please enter expiry date');
      return;
    }

    const quantity = parseFloat(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter valid quantity');
      return;
    }

    const item: FridgeItem = {
      id: editingItem?.id || Date.now().toString(),
      name: formData.name.trim(),
      quantity,
      unit: formData.unit,
      category: formData.category,
      location: formData.location,
      expiryDate: formData.expiryDate,
      purchaseDate: formData.purchaseDate,
      notes: formData.notes.trim(),
      alertDays: parseInt(formData.alertDays) || 3,
      createdAt: editingItem?.createdAt || Date.now(),
    };

    let newItems: FridgeItem[];
    if (editingItem) {
      newItems = items.map(i => (i.id === editingItem.id ? item : i));
    } else {
      newItems = [...items, item];

      // Show interstitial ad every 5 new items
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
        const newQuantity = Math.max(0, item.quantity + delta);
        if (newQuantity === 0) {
          return null;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item !== null) as FridgeItem[];

    await saveItems(newItems);
  };

  const clearExpired = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredItems = items.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      return expiryDate < today;
    });

    if (expiredItems.length === 0) {
      Alert.alert('No Expired Items', 'There are no expired items to remove.');
      return;
    }

    Alert.alert(
      'Clear Expired Items',
      `Remove ${expiredItems.length} expired item(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const newItems = items.filter(item => {
              const expiryDate = new Date(item.expiryDate);
              expiryDate.setHours(0, 0, 0, 0);
              return expiryDate >= today;
            });
            await saveItems(newItems);
          },
        },
      ]
    );
  };

  const getExpiryStatus = (expiryDate: string, alertDays: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: '#d32f2f', text: `Expired ${Math.abs(daysUntilExpiry)} days ago` };
    } else if (daysUntilExpiry === 0) {
      return { status: 'today', color: '#f57c00', text: 'Expires today' };
    } else if (daysUntilExpiry <= alertDays) {
      return { status: 'soon', color: '#f57c00', text: `Expires in ${daysUntilExpiry} days` };
    } else {
      return { status: 'fresh', color: '#388e3c', text: `Expires in ${daysUntilExpiry} days` };
    }
  };

  const getCategoryIcon = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.icon || 'help';
  };

  const getLocationIcon = (location: string) => {
    return LOCATIONS.find(l => l.value === location)?.icon || 'help';
  };

  const renderItem = (item: FridgeItem) => {
    const expiryStatus = getExpiryStatus(item.expiryDate, item.alertDays);

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

          <View style={styles.itemDetails}>
            <Chip
              icon={getLocationIcon(item.location)}
              style={styles.locationChip}
              textStyle={styles.chipText}
            >
              {item.location}
            </Chip>
            <Chip
              style={[styles.expiryChip, { backgroundColor: expiryStatus.color + '20' }]}
              textStyle={[styles.chipText, { color: expiryStatus.color }]}
            >
              {expiryStatus.text}
            </Chip>
          </View>

          {item.notes ? (
            <Text variant="bodySmall" style={styles.itemNotes}>
              {item.notes}
            </Text>
          ) : null}

          <View style={styles.itemFooter}>
            <Text variant="bodySmall" style={styles.purchaseDate}>
              Purchased: {item.purchaseDate}
            </Text>
            <View style={styles.itemFooterActions}>
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

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="Fridge Inventory" />
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
                clearExpired();
              }}
              title="Clear Expired"
              leadingIcon="delete-sweep"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                setSortBy('name');
              }}
              title="Sort by Name"
              leadingIcon={sortBy === 'name' ? 'check' : 'sort-alphabetical-ascending'}
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                setSortBy('expiry');
              }}
              title="Sort by Expiry"
              leadingIcon={sortBy === 'expiry' ? 'check' : 'sort-calendar-ascending'}
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                setSortBy('added');
              }}
              title="Sort by Added"
              leadingIcon={sortBy === 'added' ? 'check' : 'sort-clock-descending'}
            />
          </Menu>
        </Appbar.Header>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text variant="headlineSmall" style={styles.statNumber}>
              {statistics.totalItems}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Total Items
            </Text>
          </View>
          <View style={[styles.statCard, styles.statCardWarning]}>
            <Text variant="headlineSmall" style={styles.statNumber}>
              {statistics.expiringSoon}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Expiring Soon
            </Text>
          </View>
          <View style={[styles.statCard, styles.statCardDanger]}>
            <Text variant="headlineSmall" style={styles.statNumber}>
              {statistics.expired}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Expired
            </Text>
          </View>
        </View>

        {/* Search and Filters */}
        <View style={styles.filtersContainer}>
          <Searchbar
            placeholder="Search items..."
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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
            <Chip
              selected={filterLocation === 'all'}
              onPress={() => setFilterLocation('all')}
              style={styles.filterChip}
            >
              All Locations
            </Chip>
            {LOCATIONS.map(loc => (
              <Chip
                key={loc.value}
                selected={filterLocation === loc.value}
                onPress={() => setFilterLocation(loc.value)}
                icon={loc.icon}
                style={styles.filterChip}
              >
                {loc.label}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Items List */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <IconButton icon="fridge-outline" size={64} iconColor="#ccc" />
              <Text variant="titleMedium" style={styles.emptyText}>
                {searchQuery || filterCategory !== 'all' || filterLocation !== 'all'
                  ? 'No items found'
                  : 'No items in fridge'}
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                {searchQuery || filterCategory !== 'all' || filterLocation !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first item to get started'}
              </Text>
            </View>
          ) : (
            filteredItems.map(renderItem)
          )}

          <View style={styles.adContainer}>
            <BannerAd unitId={bannerId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
          </View>
        </ScrollView>

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
                <Menu
                  visible={false}
                  onDismiss={() => {}}
                  anchor={
                    <TextInput
                      label="Unit *"
                      value={formData.unit}
                      style={[styles.input, styles.halfInput]}
                      mode="outlined"
                      editable={false}
                      right={
                        <TextInput.Icon
                          icon="chevron-down"
                          onPress={() => {}}
                        />
                      }
                    />
                  }
                >
                  {UNITS.map(unit => (
                    <Menu.Item
                      key={unit}
                      onPress={() => setFormData({ ...formData, unit })}
                      title={unit}
                    />
                  ))}
                </Menu>
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

              <Text variant="labelMedium" style={styles.label}>
                Location *
              </Text>
              <View style={styles.categoryGrid}>
                {LOCATIONS.map(loc => (
                  <Chip
                    key={loc.value}
                    selected={formData.location === loc.value}
                    onPress={() => setFormData({ ...formData, location: loc.value as any })}
                    icon={loc.icon}
                    style={styles.categoryChip}
                  >
                    {loc.label}
                  </Chip>
                ))}
              </View>

              <TextInput
                label="Expiry Date (YYYY-MM-DD) *"
                value={formData.expiryDate}
                onChangeText={text => setFormData({ ...formData, expiryDate: text })}
                style={styles.input}
                mode="outlined"
                placeholder="2024-12-31"
              />

              <TextInput
                label="Purchase Date (YYYY-MM-DD)"
                value={formData.purchaseDate}
                onChangeText={text => setFormData({ ...formData, purchaseDate: text })}
                style={styles.input}
                mode="outlined"
                placeholder="2024-01-01"
              />

              <TextInput
                label="Alert Days Before Expiry"
                value={formData.alertDays}
                onChangeText={text => setFormData({ ...formData, alertDays: text })}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />

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

        <FAB icon="plus" style={styles.fab} onPress={() => openModal()} />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
  },
  statCardWarning: {
    backgroundColor: '#fff3e0',
  },
  statCardDanger: {
    backgroundColor: '#ffebee',
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  statLabel: {
    color: '#666',
    marginTop: 4,
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
  itemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  locationChip: {
    backgroundColor: '#e3f2fd',
  },
  expiryChip: {
    backgroundColor: '#fff3e0',
  },
  chipText: {
    fontSize: 12,
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
  purchaseDate: {
    color: '#999',
  },
  itemFooterActions: {
    flexDirection: 'row',
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
