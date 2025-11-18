import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Daily_Affirmations_data';
const FAVORITES_KEY = '@Daily_Affirmations_favorites';
const DAILY_KEY = '@Daily_Affirmations_daily';

interface Affirmation {
  id: string;
  text: string;
  category: Category;
  isCustom?: boolean;
}

type Category = 'All' | 'Confidence' | 'Health' | 'Success' | 'Love' | 'Abundance' | 'Peace';

const CATEGORY_COLORS: Record<Category, string> = {
  All: colors.primary,
  Confidence: '#f59e0b',
  Health: '#10b981',
  Success: '#3b82f6',
  Love: '#ec4899',
  Abundance: '#8b5cf6',
  Peace: '#14b8a6',
};

const PRESET_AFFIRMATIONS: Omit<Affirmation, 'id'>[] = [
  // Confidence (20)
  { text: 'I am confident and capable in everything I do', category: 'Confidence' },
  { text: 'I believe in myself and my abilities', category: 'Confidence' },
  { text: 'I am worthy of all the good things in my life', category: 'Confidence' },
  { text: 'I trust myself to make the right decisions', category: 'Confidence' },
  { text: 'I am strong, brave, and fearless', category: 'Confidence' },
  { text: 'I embrace my uniqueness and value', category: 'Confidence' },
  { text: 'I am proud of how far I have come', category: 'Confidence' },
  { text: 'I radiate confidence and self-respect', category: 'Confidence' },
  { text: 'I am comfortable being myself', category: 'Confidence' },
  { text: 'I trust in my journey and timing', category: 'Confidence' },
  { text: 'I am enough exactly as I am', category: 'Confidence' },
  { text: 'I embrace challenges as opportunities to grow', category: 'Confidence' },
  { text: 'I am deserving of respect and love', category: 'Confidence' },
  { text: 'I stand tall in my own power', category: 'Confidence' },
  { text: 'I am confident in my unique gifts', category: 'Confidence' },
  { text: 'I trust my intuition and inner wisdom', category: 'Confidence' },
  { text: 'I am capable of achieving my dreams', category: 'Confidence' },
  { text: 'I choose courage over fear', category: 'Confidence' },
  { text: 'I am worthy of taking up space', category: 'Confidence' },
  { text: 'I celebrate my wins big and small', category: 'Confidence' },

  // Health (18)
  { text: 'I am grateful for my healthy body', category: 'Health' },
  { text: 'Every cell in my body is vibrating with energy and health', category: 'Health' },
  { text: 'I choose to nourish my body with healthy food and thoughts', category: 'Health' },
  { text: 'I am becoming healthier and stronger each day', category: 'Health' },
  { text: 'My body deserves love and care', category: 'Health' },
  { text: 'I listen to what my body needs', category: 'Health' },
  { text: 'I am filled with vitality and energy', category: 'Health' },
  { text: 'I treat my body with kindness and respect', category: 'Health' },
  { text: 'I sleep peacefully and wake up refreshed', category: 'Health' },
  { text: 'I am in perfect health, mentally and physically', category: 'Health' },
  { text: 'My body heals quickly and easily', category: 'Health' },
  { text: 'I choose exercise that makes me feel good', category: 'Health' },
  { text: 'I am grateful for the breath in my lungs', category: 'Health' },
  { text: 'My mind is calm and my body is relaxed', category: 'Health' },
  { text: 'I honor my body\'s need for rest', category: 'Health' },
  { text: 'I make healthy choices that support my wellbeing', category: 'Health' },
  { text: 'I am connected to my body and its wisdom', category: 'Health' },
  { text: 'Every breath I take fills me with peace', category: 'Health' },

  // Success (20)
  { text: 'I am successful in everything I do', category: 'Success' },
  { text: 'Opportunities for success are everywhere around me', category: 'Success' },
  { text: 'I am open to new adventures and possibilities', category: 'Success' },
  { text: 'Success flows to me easily and effortlessly', category: 'Success' },
  { text: 'I am dedicated to achieving my goals', category: 'Success' },
  { text: 'Every day I am getting closer to my dreams', category: 'Success' },
  { text: 'I attract success and prosperity', category: 'Success' },
  { text: 'I am focused on my goals and my success', category: 'Success' },
  { text: 'I have everything I need to succeed', category: 'Success' },
  { text: 'My potential is limitless', category: 'Success' },
  { text: 'I create my own success story', category: 'Success' },
  { text: 'I am persistent and will never give up', category: 'Success' },
  { text: 'Success is my natural state', category: 'Success' },
  { text: 'I am worthy of my dreams coming true', category: 'Success' },
  { text: 'I take action towards my goals every day', category: 'Success' },
  { text: 'I am a magnet for success and good fortune', category: 'Success' },
  { text: 'My hard work is paying off', category: 'Success' },
  { text: 'I celebrate my achievements', category: 'Success' },
  { text: 'I turn setbacks into comebacks', category: 'Success' },
  { text: 'I am exactly where I need to be', category: 'Success' },

  // Love (17)
  { text: 'I am worthy of deep and meaningful love', category: 'Love' },
  { text: 'I give and receive love freely', category: 'Love' },
  { text: 'Love flows to me from all directions', category: 'Love' },
  { text: 'I am surrounded by people who love and support me', category: 'Love' },
  { text: 'I attract loving and positive relationships', category: 'Love' },
  { text: 'I am loved and appreciated', category: 'Love' },
  { text: 'I radiate love and kindness', category: 'Love' },
  { text: 'I choose to see the good in everyone', category: 'Love' },
  { text: 'My heart is open to giving and receiving love', category: 'Love' },
  { text: 'I am deserving of healthy, loving relationships', category: 'Love' },
  { text: 'I love myself unconditionally', category: 'Love' },
  { text: 'I attract people who cherish me', category: 'Love' },
  { text: 'Love is my natural state of being', category: 'Love' },
  { text: 'I forgive and release with love', category: 'Love' },
  { text: 'I am compassionate towards myself and others', category: 'Love' },
  { text: 'I am grateful for the love in my life', category: 'Love' },
  { text: 'I choose love over fear', category: 'Love' },

  // Abundance (15)
  { text: 'I am a magnet for abundance and prosperity', category: 'Abundance' },
  { text: 'Money flows to me easily and effortlessly', category: 'Abundance' },
  { text: 'I am open to receiving unlimited abundance', category: 'Abundance' },
  { text: 'Abundance is my birthright', category: 'Abundance' },
  { text: 'I am grateful for the abundance in my life', category: 'Abundance' },
  { text: 'I deserve financial freedom and security', category: 'Abundance' },
  { text: 'Wealth and prosperity are attracted to me', category: 'Abundance' },
  { text: 'I am worthy of financial abundance', category: 'Abundance' },
  { text: 'I have a positive relationship with money', category: 'Abundance' },
  { text: 'Opportunities for abundance surround me', category: 'Abundance' },
  { text: 'I welcome prosperity into my life', category: 'Abundance' },
  { text: 'I am abundant in all areas of my life', category: 'Abundance' },
  { text: 'I attract success and prosperity naturally', category: 'Abundance' },
  { text: 'The universe provides for all my needs', category: 'Abundance' },
  { text: 'I am grateful for my abundance', category: 'Abundance' },

  // Peace (15)
  { text: 'I am calm and at peace', category: 'Peace' },
  { text: 'Inner peace is my natural state', category: 'Peace' },
  { text: 'I let go of what I cannot control', category: 'Peace' },
  { text: 'I choose peace over worry', category: 'Peace' },
  { text: 'I am centered and grounded', category: 'Peace' },
  { text: 'Serenity fills my mind and body', category: 'Peace' },
  { text: 'I release all tension and stress', category: 'Peace' },
  { text: 'I am present in this moment', category: 'Peace' },
  { text: 'Peace begins with me', category: 'Peace' },
  { text: 'I embrace tranquility in my life', category: 'Peace' },
  { text: 'I am at peace with my past', category: 'Peace' },
  { text: 'I trust the journey of my life', category: 'Peace' },
  { text: 'I find peace in stillness', category: 'Peace' },
  { text: 'I am surrounded by peaceful energy', category: 'Peace' },
  { text: 'I breathe in peace and exhale stress', category: 'Peace' },
];

export default function App() {
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [customAffirmations, setCustomAffirmations] = useState<Affirmation[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [dailyAffirmation, setDailyAffirmation] = useState<Affirmation | null>(null);
  const [currentAffirmation, setCurrentAffirmation] = useState<Affirmation | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [newAffirmationText, setNewAffirmationText] = useState('');
  const [newAffirmationCategory, setNewAffirmationCategory] = useState<Category>('Confidence');
  const [adCount, setAdCount] = useState(0);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    initializeAds();
    initializeAffirmations();
    loadData();
  }, []);

  const initializeAffirmations = () => {
    const initialized: Affirmation[] = PRESET_AFFIRMATIONS.map((a, index) => ({
      id: `preset_${index}`,
      ...a,
      isCustom: false,
    }));
    setAffirmations(initialized);
  };

  const loadData = async () => {
    try {
      const [savedCustom, savedFavorites, savedDaily] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(FAVORITES_KEY),
        AsyncStorage.getItem(DAILY_KEY),
      ]);

      if (savedCustom) {
        setCustomAffirmations(JSON.parse(savedCustom));
      }

      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }

      if (savedDaily) {
        const { affirmation, date } = JSON.parse(savedDaily);
        const today = new Date().toDateString();
        if (date === today) {
          setDailyAffirmation(affirmation);
        } else {
          generateDailyAffirmation();
        }
      } else {
        generateDailyAffirmation();
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveCustomAffirmations = async (data: Affirmation[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setCustomAffirmations(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const saveFavorites = async (data: string[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(data));
      setFavorites(data);
    } catch (error) {
      console.error('Save favorites error:', error);
    }
  };

  const saveDailyAffirmation = async (affirmation: Affirmation) => {
    try {
      const data = {
        affirmation,
        date: new Date().toDateString(),
      };
      await AsyncStorage.setItem(DAILY_KEY, JSON.stringify(data));
      setDailyAffirmation(affirmation);
    } catch (error) {
      console.error('Save daily error:', error);
    }
  };

  const generateDailyAffirmation = () => {
    const all = [...affirmations, ...customAffirmations];
    if (all.length > 0) {
      const random = all[Math.floor(Math.random() * all.length)];
      saveDailyAffirmation(random);
    }
  };

  const getRandomAffirmation = () => {
    const all = [...affirmations, ...customAffirmations];
    const filtered = selectedCategory === 'All'
      ? all
      : all.filter(a => a.category === selectedCategory);

    if (filtered.length === 0) {
      Alert.alert('No Affirmations', 'No affirmations in this category');
      return;
    }

    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      const random = filtered[Math.floor(Math.random() * filtered.length)];
      setCurrentAffirmation(random);

      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });

    const newCount = adCount + 1;
    setAdCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const toggleFavorite = (affirmationId: string) => {
    const newFavorites = favorites.includes(affirmationId)
      ? favorites.filter(id => id !== affirmationId)
      : [...favorites, affirmationId];
    saveFavorites(newFavorites);
  };

  const addCustomAffirmation = () => {
    if (!newAffirmationText.trim()) {
      Alert.alert('Error', 'Please enter an affirmation');
      return;
    }

    const newAffirmation: Affirmation = {
      id: `custom_${Date.now()}`,
      text: newAffirmationText.trim(),
      category: newAffirmationCategory,
      isCustom: true,
    };

    const newCustom = [...customAffirmations, newAffirmation];
    saveCustomAffirmations(newCustom);
    setNewAffirmationText('');
    setNewAffirmationCategory('Confidence');
    setShowAddModal(false);
  };

  const deleteCustomAffirmation = (affirmationId: string) => {
    Alert.alert('Delete Affirmation', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = customAffirmations.filter(a => a.id !== affirmationId);
          saveCustomAffirmations(updated);
          if (favorites.includes(affirmationId)) {
            saveFavorites(favorites.filter(id => id !== affirmationId));
          }
        },
      },
    ]);
  };

  const getAllAffirmations = () => [...affirmations, ...customAffirmations];

  const getFilteredAffirmations = () => {
    const all = getAllAffirmations();
    if (selectedCategory === 'All') return all;
    return all.filter(a => a.category === selectedCategory);
  };

  const getFavoriteAffirmations = () => {
    const all = getAllAffirmations();
    return all.filter(a => favorites.includes(a.id));
  };

  const getCategoryCounts = () => {
    const all = getAllAffirmations();
    const counts: { [key in Category]: number } = {
      All: all.length,
      Confidence: 0,
      Health: 0,
      Success: 0,
      Love: 0,
      Abundance: 0,
      Peace: 0,
    };

    all.forEach(affirmation => {
      if (counts[affirmation.category] !== undefined) {
        counts[affirmation.category]++;
      }
    });

    return counts;
  };

  const categories: Category[] = ['All', 'Confidence', 'Health', 'Success', 'Love', 'Abundance', 'Peace'];
  const categoryCounts = getCategoryCounts();
  const filteredAffirmations = getFilteredAffirmations();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Daily Affirmations</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {dailyAffirmation && (
        <View style={[styles.dailyCard, { backgroundColor: CATEGORY_COLORS[dailyAffirmation.category] + '15' }]}>
          <View style={styles.dailyHeader}>
            <Text style={[styles.dailyLabel, { color: CATEGORY_COLORS[dailyAffirmation.category] }]}>
              Today's Affirmation
            </Text>
            <TouchableOpacity onPress={generateDailyAffirmation}>
              <Text style={styles.refreshIcon}>🔄</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.dailyText}>{dailyAffirmation.text}</Text>
          <View style={styles.dailyFooter}>
            <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[dailyAffirmation.category] }]}>
              <Text style={styles.categoryBadgeText}>{dailyAffirmation.category}</Text>
            </View>
            <TouchableOpacity onPress={() => toggleFavorite(dailyAffirmation.id)}>
              <Text style={styles.favoriteIcon}>
                {favorites.includes(dailyAffirmation.id) ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.randomSection}>
        <TouchableOpacity style={styles.randomButton} onPress={getRandomAffirmation}>
          <Text style={styles.randomButtonIcon}>🎲</Text>
          <Text style={styles.randomButtonText}>Random Affirmation</Text>
        </TouchableOpacity>
      </View>

      {currentAffirmation && (
        <Animated.View style={[styles.currentCard, { opacity: fadeAnim }]}>
          <Text style={styles.currentText}>{currentAffirmation.text}</Text>
          <View style={styles.currentFooter}>
            <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[currentAffirmation.category] }]}>
              <Text style={styles.categoryBadgeText}>{currentAffirmation.category}</Text>
            </View>
            <TouchableOpacity onPress={() => toggleFavorite(currentAffirmation.id)}>
              <Text style={styles.favoriteIcon}>
                {favorites.includes(currentAffirmation.id) ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <View style={styles.actionsBar}>
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowFavoritesModal(true)}>
          <Text style={styles.actionButtonIcon}>❤️</Text>
          <Text style={styles.actionButtonText}>Favorites ({favorites.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll} contentContainerStyle={styles.categoriesContainer}>
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              { backgroundColor: selectedCategory === category ? CATEGORY_COLORS[category] : colors.gray.light }
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[styles.categoryText, { color: selectedCategory === category ? colors.white : colors.gray.dark }]}>
              {category} ({categoryCounts[category]})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredAffirmations}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.affirmationCard}
            onPress={() => setCurrentAffirmation(item)}
          >
            <View style={styles.affirmationContent}>
              <Text style={styles.affirmationText} numberOfLines={2}>
                {item.text}
              </Text>
              <View style={styles.affirmationMeta}>
                <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[item.category] }]}>
                  <Text style={styles.categoryBadgeText}>{item.category}</Text>
                </View>
                {item.isCustom && <Text style={styles.customBadge}>Custom</Text>}
              </View>
            </View>
            <View style={styles.affirmationActions}>
              <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                <Text style={styles.affirmationIcon}>
                  {favorites.includes(item.id) ? '❤️' : '🤍'}
                </Text>
              </TouchableOpacity>
              {item.isCustom && (
                <TouchableOpacity onPress={() => deleteCustomAffirmation(item.id)}>
                  <Text style={styles.affirmationIcon}>🗑️</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyText}>No affirmations in this category</Text>
          </View>
        }
      />

      <AdBanner />

      {/* Add Custom Affirmation Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Affirmation</Text>

            <Text style={styles.label}>Affirmation Text</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newAffirmationText}
              onChangeText={setNewAffirmationText}
              placeholder="I am..."
              multiline
              numberOfLines={3}
              autoFocus
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
              {(['Confidence', 'Health', 'Success', 'Love', 'Abundance', 'Peace'] as Category[]).map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryOption,
                    { backgroundColor: newAffirmationCategory === cat ? CATEGORY_COLORS[cat] : colors.gray.light }
                  ]}
                  onPress={() => setNewAffirmationCategory(cat)}
                >
                  <Text style={[styles.categoryOptionText, { color: newAffirmationCategory === cat ? colors.white : colors.gray.dark }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => {
                setShowAddModal(false);
                setNewAffirmationText('');
                setNewAffirmationCategory('Confidence');
              }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={addCustomAffirmation}>
                <Text style={styles.saveButtonText}>Add Affirmation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Favorites Modal */}
      <Modal visible={showFavoritesModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Favorite Affirmations</Text>

            <FlatList
              data={getFavoriteAffirmations()}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.favoritesList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.favoriteCard}
                  onPress={() => {
                    setCurrentAffirmation(item);
                    setShowFavoritesModal(false);
                  }}
                >
                  <Text style={styles.favoriteText}>{item.text}</Text>
                  <View style={styles.favoriteMeta}>
                    <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[item.category] }]}>
                      <Text style={styles.categoryBadgeText}>{item.category}</Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                      <Text style={styles.favoriteRemove}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyFavorites}>
                  <Text style={styles.emptyEmoji}>💔</Text>
                  <Text style={styles.emptyText}>No favorite affirmations yet</Text>
                  <Text style={styles.emptySubtext}>Tap the heart to save affirmations</Text>
                </View>
              }
            />

            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={() => setShowFavoritesModal(false)}>
              <Text style={styles.saveButtonText}>Close</Text>
            </TouchableOpacity>
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
    padding: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: colors.white,
    fontWeight: '300',
  },
  dailyCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 16,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  dailyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dailyLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  refreshIcon: {
    fontSize: 16,
  },
  dailyText: {
    fontSize: 18,
    color: colors.text,
    lineHeight: 28,
    marginBottom: spacing.md,
    fontWeight: '500',
  },
  dailyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: colors.white,
    fontWeight: '600',
  },
  favoriteIcon: {
    fontSize: 20,
  },
  randomSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  randomButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  randomButtonIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  randomButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  currentCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 16,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  currentText: {
    fontSize: 20,
    color: colors.text,
    lineHeight: 32,
    marginBottom: spacing.lg,
    fontWeight: '500',
    textAlign: 'center',
  },
  currentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionsBar: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  actionButton: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  categoriesScroll: {
    maxHeight: 50,
    marginBottom: spacing.md,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  affirmationCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  affirmationContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  affirmationText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  affirmationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  customBadge: {
    fontSize: 10,
    color: colors.accent,
    fontWeight: '600',
    backgroundColor: colors.accent + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  affirmationActions: {
    gap: spacing.sm,
  },
  affirmationIcon: {
    fontSize: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray.dark,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray.medium,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray.light,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  favoritesList: {
    paddingBottom: spacing.lg,
  },
  favoriteCard: {
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  favoriteText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  favoriteMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoriteRemove: {
    fontSize: 12,
    color: colors.status.error,
    fontWeight: '600',
  },
  emptyFavorites: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
});
