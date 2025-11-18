import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, TextInput,
  Modal, ScrollView, Alert, Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography } from './theme';
import { AdBanner } from './components/AdBanner';
import { AdsManager } from './services/adsManager';

const STORAGE_KEY = '@Gift_Planner_Data';

interface GiftIdea {
  id: string;
  giftName: string;
  price: string;
  url: string;
  notes: string;
  purchased: boolean;
}

interface Person {
  id: string;
  name: string;
  occasion: string;
  date: string;
  budget: string;
  category: string;
  gifts: GiftIdea[];
  createdAt: string;
}

const CATEGORIES = ['Birthday', 'Anniversary', 'Wedding', 'Christmas', 'Graduation', 'Baby Shower', 'Other'];
const OCCASIONS_EMOJI: { [key: string]: string } = {
  Birthday: '🎂',
  Anniversary: '💑',
  Wedding: '💒',
  Christmas: '🎄',
  Graduation: '🎓',
  'Baby Shower': '👶',
  Other: '🎁',
};

export default function App() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [filteredPersons, setFilteredPersons] = useState<Person[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showStats, setShowStats] = useState(false);

  // Person form state
  const [name, setName] = useState('');
  const [occasion, setOccasion] = useState('Birthday');
  const [date, setDate] = useState('');
  const [budget, setBudget] = useState('');
  const [category, setCategory] = useState('Birthday');

  // Gift form state
  const [giftName, setGiftName] = useState('');
  const [price, setPrice] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [editingGift, setEditingGift] = useState<GiftIdea | null>(null);

  const [actionCount, setActionCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  useEffect(() => {
    filterPersons();
  }, [persons, searchQuery, selectedCategory]);

  const initializeAds = async () => {
    try {
      // Initialize ads
    } catch (error) {
      console.error('Ad initialization error:', error);
    }
  };

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPersons(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (data: Person[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const filterPersons = () => {
    let filtered = [...persons];

    if (searchQuery.trim()) {
      filtered = filtered.filter(person =>
        person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.occasion.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(person => person.category === selectedCategory);
    }

    // Sort by date (upcoming first)
    filtered.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    setFilteredPersons(filtered);
  };

  const addPerson = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    const newPerson: Person = {
      id: Date.now().toString(),
      name: name.trim(),
      occasion,
      date,
      budget,
      category,
      gifts: [],
      createdAt: new Date().toISOString(),
    };

    const updated = [...persons, newPerson];
    setPersons(updated);
    saveData(updated);
    resetPersonForm();
    setShowAddModal(false);

    incrementAction();
  };

  const updatePerson = (personId: string, updates: Partial<Person>) => {
    const updated = persons.map(p =>
      p.id === personId ? { ...p, ...updates } : p
    );
    setPersons(updated);
    saveData(updated);
  };

  const deletePerson = (personId: string) => {
    Alert.alert(
      'Delete Person',
      'Are you sure you want to delete this person and all their gift ideas?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updated = persons.filter(p => p.id !== personId);
            setPersons(updated);
            saveData(updated);
            setSelectedPerson(null);
            incrementAction();
          },
        },
      ]
    );
  };

  const addGift = () => {
    if (!selectedPerson || !giftName.trim()) {
      Alert.alert('Error', 'Please enter a gift name');
      return;
    }

    const newGift: GiftIdea = {
      id: Date.now().toString(),
      giftName: giftName.trim(),
      price,
      url,
      notes,
      purchased: false,
    };

    const updatedGifts = [...selectedPerson.gifts, newGift];
    updatePerson(selectedPerson.id, { gifts: updatedGifts });

    if (selectedPerson) {
      setSelectedPerson({ ...selectedPerson, gifts: updatedGifts });
    }

    resetGiftForm();
    setShowGiftModal(false);
    incrementAction();
  };

  const updateGift = () => {
    if (!selectedPerson || !editingGift || !giftName.trim()) {
      Alert.alert('Error', 'Please enter a gift name');
      return;
    }

    const updatedGifts = selectedPerson.gifts.map(g =>
      g.id === editingGift.id
        ? { ...g, giftName: giftName.trim(), price, url, notes }
        : g
    );

    updatePerson(selectedPerson.id, { gifts: updatedGifts });
    setSelectedPerson({ ...selectedPerson, gifts: updatedGifts });

    resetGiftForm();
    setShowGiftModal(false);
    incrementAction();
  };

  const deleteGift = (giftId: string) => {
    if (!selectedPerson) return;

    Alert.alert('Delete Gift', 'Are you sure you want to delete this gift idea?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updatedGifts = selectedPerson.gifts.filter(g => g.id !== giftId);
          updatePerson(selectedPerson.id, { gifts: updatedGifts });
          setSelectedPerson({ ...selectedPerson, gifts: updatedGifts });
          incrementAction();
        },
      },
    ]);
  };

  const togglePurchased = (giftId: string) => {
    if (!selectedPerson) return;

    const updatedGifts = selectedPerson.gifts.map(g =>
      g.id === giftId ? { ...g, purchased: !g.purchased } : g
    );

    updatePerson(selectedPerson.id, { gifts: updatedGifts });
    setSelectedPerson({ ...selectedPerson, gifts: updatedGifts });
  };

  const incrementAction = () => {
    const newCount = actionCount + 1;
    setActionCount(newCount);
    if (newCount % 5 === 0) {
      AdsManager.showInterstitialAd();
    }
  };

  const resetPersonForm = () => {
    setName('');
    setOccasion('Birthday');
    setDate('');
    setBudget('');
    setCategory('Birthday');
  };

  const resetGiftForm = () => {
    setGiftName('');
    setPrice('');
    setUrl('');
    setNotes('');
    setEditingGift(null);
  };

  const openEditGift = (gift: GiftIdea) => {
    setGiftName(gift.giftName);
    setPrice(gift.price);
    setUrl(gift.url);
    setNotes(gift.notes);
    setEditingGift(gift);
    setShowGiftModal(true);
  };

  const calculateStats = () => {
    const totalPersons = persons.length;
    const totalGifts = persons.reduce((sum, p) => sum + p.gifts.length, 0);
    const purchasedGifts = persons.reduce(
      (sum, p) => sum + p.gifts.filter(g => g.purchased).length,
      0
    );
    const totalBudget = persons.reduce((sum, p) => {
      const budget = parseFloat(p.budget) || 0;
      return sum + budget;
    }, 0);
    const totalSpent = persons.reduce((sum, p) => {
      const spent = p.gifts
        .filter(g => g.purchased)
        .reduce((s, g) => s + (parseFloat(g.price) || 0), 0);
      return sum + spent;
    }, 0);

    return { totalPersons, totalGifts, purchasedGifts, totalBudget, totalSpent };
  };

  const renderPersonItem = ({ item }: { item: Person }) => {
    const totalGifts = item.gifts.length;
    const purchasedGifts = item.gifts.filter(g => g.purchased).length;
    const totalSpent = item.gifts
      .filter(g => g.purchased)
      .reduce((sum, g) => sum + (parseFloat(g.price) || 0), 0);
    const budget = parseFloat(item.budget) || 0;

    return (
      <TouchableOpacity
        style={styles.personCard}
        onPress={() => setSelectedPerson(item)}
      >
        <View style={styles.personHeader}>
          <View style={styles.personInfo}>
            <Text style={styles.personEmoji}>
              {OCCASIONS_EMOJI[item.category] || '🎁'}
            </Text>
            <View style={styles.personDetails}>
              <Text style={styles.personName}>{item.name}</Text>
              <Text style={styles.personOccasion}>{item.occasion}</Text>
              {item.date && (
                <Text style={styles.personDate}>📅 {item.date}</Text>
              )}
            </View>
          </View>
          <Text style={styles.personCategory}>{item.category}</Text>
        </View>

        <View style={styles.personStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Ideas</Text>
            <Text style={styles.statValue}>{totalGifts}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Purchased</Text>
            <Text style={styles.statValue}>
              {purchasedGifts}/{totalGifts}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Budget</Text>
            <Text style={styles.statValue}>${budget.toFixed(0)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Spent</Text>
            <Text style={[
              styles.statValue,
              totalSpent > budget && styles.overBudget
            ]}>
              ${totalSpent.toFixed(0)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGiftItem = ({ item }: { item: GiftIdea }) => (
    <View style={[styles.giftCard, item.purchased && styles.giftPurchased]}>
      <View style={styles.giftHeader}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => togglePurchased(item.id)}
        >
          <Text style={styles.checkboxText}>{item.purchased ? '✓' : ''}</Text>
        </TouchableOpacity>
        <View style={styles.giftInfo}>
          <Text style={[styles.giftName, item.purchased && styles.giftNamePurchased]}>
            {item.giftName}
          </Text>
          {item.price && (
            <Text style={styles.giftPrice}>${parseFloat(item.price).toFixed(2)}</Text>
          )}
          {item.notes && (
            <Text style={styles.giftNotes} numberOfLines={2}>
              {item.notes}
            </Text>
          )}
          {item.url && (
            <Text style={styles.giftUrl} numberOfLines={1}>
              🔗 {item.url}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.giftActions}>
        <TouchableOpacity
          style={styles.giftActionBtn}
          onPress={() => openEditGift(item)}
        >
          <Text style={styles.giftActionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.giftActionBtn, styles.deleteBtn]}
          onPress={() => deleteGift(item.id)}
        >
          <Text style={[styles.giftActionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const stats = calculateStats();

  if (selectedPerson) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedPerson(null)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gift Ideas</Text>
          <TouchableOpacity onPress={() => deletePerson(selectedPerson.id)}>
            <Text style={styles.deleteButton}>Delete</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.personDetailHeader}>
          <View style={styles.personDetailInfo}>
            <Text style={styles.personDetailEmoji}>
              {OCCASIONS_EMOJI[selectedPerson.category] || '🎁'}
            </Text>
            <View>
              <Text style={styles.personDetailName}>{selectedPerson.name}</Text>
              <Text style={styles.personDetailOccasion}>{selectedPerson.occasion}</Text>
              {selectedPerson.date && (
                <Text style={styles.personDetailDate}>📅 {selectedPerson.date}</Text>
              )}
            </View>
          </View>

          <View style={styles.personDetailStats}>
            <Text style={styles.personDetailBudget}>
              Budget: ${parseFloat(selectedPerson.budget || '0').toFixed(0)}
            </Text>
            <Text style={styles.personDetailSpent}>
              Spent: $
              {selectedPerson.gifts
                .filter(g => g.purchased)
                .reduce((sum, g) => sum + (parseFloat(g.price) || 0), 0)
                .toFixed(2)}
            </Text>
          </View>
        </View>

        <AdBanner />

        <FlatList
          data={selectedPerson.gifts}
          renderItem={renderGiftItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.giftList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎁</Text>
              <Text style={styles.emptyText}>No gift ideas yet</Text>
              <Text style={styles.emptySubtext}>Tap the + button to add ideas</Text>
            </View>
          }
        />

        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            resetGiftForm();
            setShowGiftModal(true);
          }}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        {/* Add/Edit Gift Modal */}
        <Modal visible={showGiftModal} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingGift ? 'Edit Gift' : 'Add Gift Idea'}
                </Text>
                <TouchableOpacity onPress={() => {
                  setShowGiftModal(false);
                  resetGiftForm();
                }}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <Text style={styles.label}>Gift Name *</Text>
                <TextInput
                  style={styles.input}
                  value={giftName}
                  onChangeText={setGiftName}
                  placeholder="e.g., Wireless Headphones"
                />

                <Text style={styles.label}>Price</Text>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="e.g., 49.99"
                  keyboardType="decimal-pad"
                />

                <Text style={styles.label}>URL / Link</Text>
                <TextInput
                  style={styles.input}
                  value={url}
                  onChangeText={setUrl}
                  placeholder="https://..."
                  autoCapitalize="none"
                />

                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Additional notes..."
                  multiline
                  numberOfLines={3}
                />

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={editingGift ? updateGift : addGift}
                >
                  <Text style={styles.addButtonText}>
                    {editingGift ? 'Update Gift' : 'Add Gift'}
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
        <Text style={styles.headerTitle}>Gift Planner</Text>
        <TouchableOpacity onPress={() => setShowStats(!showStats)}>
          <Text style={styles.statsButton}>📊</Text>
        </TouchableOpacity>
      </View>

      {showStats && (
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>{stats.totalPersons}</Text>
              <Text style={styles.statBoxLabel}>People</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>{stats.totalGifts}</Text>
              <Text style={styles.statBoxLabel}>Gift Ideas</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>{stats.purchasedGifts}</Text>
              <Text style={styles.statBoxLabel}>Purchased</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>${stats.totalBudget.toFixed(0)}</Text>
              <Text style={styles.statBoxLabel}>Total Budget</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>${stats.totalSpent.toFixed(0)}</Text>
              <Text style={styles.statBoxLabel}>Total Spent</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search people or occasions..."
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === 'All' && styles.categoryChipActive,
          ]}
          onPress={() => setSelectedCategory('All')}
        >
          <Text
            style={[
              styles.categoryChipText,
              selectedCategory === 'All' && styles.categoryChipTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              selectedCategory === cat && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat && styles.categoryChipTextActive,
              ]}
            >
              {OCCASIONS_EMOJI[cat]} {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <AdBanner />

      <FlatList
        data={filteredPersons}
        renderItem={renderPersonItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎁</Text>
            <Text style={styles.emptyText}>No people added yet</Text>
            <Text style={styles.emptySubtext}>Start planning your gifts!</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          resetPersonForm();
          setShowAddModal(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Person Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Person</Text>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                resetPersonForm();
              }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Mom, John, Sarah..."
              />

              <Text style={styles.label}>Occasion *</Text>
              <TextInput
                style={styles.input}
                value={occasion}
                onChangeText={setOccasion}
                placeholder="e.g., Birthday, Christmas..."
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
                      category === cat && styles.categoryOptionActive,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={styles.categoryOptionEmoji}>
                      {OCCASIONS_EMOJI[cat]}
                    </Text>
                    <Text
                      style={[
                        styles.categoryOptionText,
                        category === cat && styles.categoryOptionTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
              />

              <Text style={styles.label}>Budget</Text>
              <TextInput
                style={styles.input}
                value={budget}
                onChangeText={setBudget}
                placeholder="e.g., 100"
                keyboardType="decimal-pad"
              />

              <TouchableOpacity style={styles.addButton} onPress={addPerson}>
                <Text style={styles.addButtonText}>Add Person</Text>
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
  statsButton: {
    fontSize: typography.sizes['2xl'],
  },
  statsContainer: {
    padding: spacing.md,
    backgroundColor: colors.gray.light,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    flex: 1,
    margin: spacing.xs,
  },
  statBoxValue: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  statBoxLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray.dark,
    marginTop: spacing.xs,
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
  categoriesContainer: {
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.gray.light,
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  categoryChipTextActive: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  list: {
    padding: spacing.md,
  },
  personCard: {
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
  personHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  personEmoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  personDetails: {
    flex: 1,
  },
  personName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  personOccasion: {
    fontSize: typography.sizes.sm,
    color: colors.gray.dark,
    marginTop: spacing.xs,
  },
  personDate: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  personCategory: {
    fontSize: typography.sizes.xs,
    color: colors.gray.dark,
    backgroundColor: colors.gray.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 8,
  },
  personStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.gray.light,
    paddingTop: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.gray.dark,
    marginBottom: spacing.xs / 2,
  },
  statValue: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  overBudget: {
    color: colors.status.error,
  },
  personDetailHeader: {
    padding: spacing.md,
    backgroundColor: colors.gray.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.medium,
  },
  personDetailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  personDetailEmoji: {
    fontSize: 48,
    marginRight: spacing.md,
  },
  personDetailName: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  personDetailOccasion: {
    fontSize: typography.sizes.base,
    color: colors.gray.dark,
    marginTop: spacing.xs,
  },
  personDetailDate: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  personDetailStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  personDetailBudget: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  personDetailSpent: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  giftList: {
    padding: spacing.md,
  },
  giftCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  giftPurchased: {
    backgroundColor: colors.gray.light,
    borderLeftColor: colors.status.success,
    opacity: 0.7,
  },
  giftHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  giftInfo: {
    flex: 1,
  },
  giftName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  giftNamePurchased: {
    textDecorationLine: 'line-through',
    color: colors.gray.dark,
  },
  giftPrice: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  giftNotes: {
    fontSize: typography.sizes.sm,
    color: colors.gray.dark,
    marginTop: spacing.xs,
  },
  giftUrl: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  giftActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray.light,
    paddingTop: spacing.sm,
  },
  giftActionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginLeft: spacing.sm,
  },
  giftActionText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  deleteBtn: {},
  deleteText: {
    color: colors.status.error,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categorySelector: {
    maxHeight: 80,
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
  categoryOptionEmoji: {
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
