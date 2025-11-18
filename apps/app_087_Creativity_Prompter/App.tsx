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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Creativity_Prompter_data';
const FAVORITES_KEY = '@Creativity_Prompter_favorites';
const DAILY_KEY = '@Creativity_Prompter_daily';

interface Prompt {
  id: string;
  text: string;
  category: Category;
  isCustom?: boolean;
}

type Category = 'All' | 'Writing' | 'Art' | 'Music' | 'Design' | 'General';

const PRESET_PROMPTS: Omit<Prompt, 'id'>[] = [
  // Writing Prompts
  { text: 'Write a story that starts with "The last person on Earth sat alone in a room. There was a knock on the door..."', category: 'Writing' },
  { text: 'Describe a color to someone who has never seen before', category: 'Writing' },
  { text: 'Write a dialogue between you and your future self', category: 'Writing' },
  { text: 'Create a story where the protagonist\'s greatest strength becomes their biggest weakness', category: 'Writing' },
  { text: 'Write from the perspective of an inanimate object in your room', category: 'Writing' },
  { text: 'Imagine you can speak to animals for one day. What conversations do you have?', category: 'Writing' },
  { text: 'Write a letter to someone from 100 years in the past explaining today\'s world', category: 'Writing' },
  { text: 'Create a short story using only dialogue - no narration', category: 'Writing' },
  { text: 'Write about a world where emotions are visible as colors', category: 'Writing' },
  { text: 'Tell a story backwards, starting from the end', category: 'Writing' },
  { text: 'Write about discovering a hidden room in your house', category: 'Writing' },
  { text: 'Create a character who is you but from a parallel universe', category: 'Writing' },

  // Art Prompts
  { text: 'Draw your emotions as abstract shapes and colors', category: 'Art' },
  { text: 'Create artwork using only three colors', category: 'Art' },
  { text: 'Design a character based on your favorite song', category: 'Art' },
  { text: 'Illustrate a dream you remember', category: 'Art' },
  { text: 'Draw your day as a comic strip', category: 'Art' },
  { text: 'Create art inspired by a random word generator', category: 'Art' },
  { text: 'Design a poster for an imaginary concert or event', category: 'Art' },
  { text: 'Draw the same subject in 5 different art styles', category: 'Art' },
  { text: 'Create a visual representation of your favorite smell', category: 'Art' },
  { text: 'Design a character based on your zodiac sign', category: 'Art' },
  { text: 'Illustrate a scene from your favorite book', category: 'Art' },
  { text: 'Create artwork using unconventional materials', category: 'Art' },

  // Music Prompts
  { text: 'Compose a melody using only 4 notes', category: 'Music' },
  { text: 'Create a song inspired by a color', category: 'Music' },
  { text: 'Write lyrics about an everyday moment', category: 'Music' },
  { text: 'Make music using household objects', category: 'Music' },
  { text: 'Compose a theme song for your life', category: 'Music' },
  { text: 'Create a song that tells a story in reverse', category: 'Music' },
  { text: 'Write a song from the perspective of your pet', category: 'Music' },
  { text: 'Compose music inspired by a painting', category: 'Music' },
  { text: 'Create a melody that represents different times of day', category: 'Music' },
  { text: 'Write a song using only questions', category: 'Music' },

  // Design Prompts
  { text: 'Redesign a common everyday object', category: 'Design' },
  { text: 'Create a logo using only geometric shapes', category: 'Design' },
  { text: 'Design your dream workspace', category: 'Design' },
  { text: 'Create a color palette inspired by a season', category: 'Design' },
  { text: 'Design a book cover for your autobiography', category: 'Design' },
  { text: 'Redesign a famous brand logo in your style', category: 'Design' },
  { text: 'Create a pattern inspired by nature', category: 'Design' },
  { text: 'Design an app icon for an imaginary product', category: 'Design' },
  { text: 'Create a minimalist design using only lines', category: 'Design' },
  { text: 'Design packaging for your favorite product', category: 'Design' },

  // General Prompts
  { text: 'Create something inspired by the first thing you see', category: 'General' },
  { text: 'Combine two unrelated things into one creative work', category: 'General' },
  { text: 'Express gratitude through any creative medium', category: 'General' },
  { text: 'Create something without planning - just start and see where it goes', category: 'General' },
  { text: 'Make art out of mistakes or accidents', category: 'General' },
  { text: 'Create something inspired by a memory', category: 'General' },
  { text: 'Express your current mood without using words', category: 'General' },
  { text: 'Create something that makes you laugh', category: 'General' },
  { text: 'Make art inspired by your favorite quote', category: 'General' },
  { text: 'Create something in 5 minutes - set a timer', category: 'General' },
  { text: 'Express a complex feeling through simple forms', category: 'General' },
  { text: 'Create something inspired by the weather today', category: 'General' },
  { text: 'Make art using only your non-dominant hand', category: 'General' },
  { text: 'Create something that represents "home" to you', category: 'General' },
];

export default function App() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [customPrompts, setCustomPrompts] = useState<Prompt[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [dailyPrompt, setDailyPrompt] = useState<Prompt | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptCategory, setNewPromptCategory] = useState<Category>('General');
  const [adCount, setAdCount] = useState(0);

  useEffect(() => {
    initializeAds();
    initializePrompts();
    loadData();
  }, []);

  const initializePrompts = () => {
    const initializedPrompts: Prompt[] = PRESET_PROMPTS.map((p, index) => ({
      id: `preset_${index}`,
      ...p,
      isCustom: false,
    }));
    setPrompts(initializedPrompts);
  };

  const loadData = async () => {
    try {
      const [savedCustom, savedFavorites, savedDaily] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(FAVORITES_KEY),
        AsyncStorage.getItem(DAILY_KEY),
      ]);

      if (savedCustom) {
        const custom = JSON.parse(savedCustom);
        setCustomPrompts(custom);
      }

      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }

      if (savedDaily) {
        const { prompt, date } = JSON.parse(savedDaily);
        const today = new Date().toDateString();
        if (date === today) {
          setDailyPrompt(prompt);
        } else {
          generateDailyPrompt();
        }
      } else {
        generateDailyPrompt();
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveCustomPrompts = async (data: Prompt[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setCustomPrompts(data);
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

  const saveDailyPrompt = async (prompt: Prompt) => {
    try {
      const data = {
        prompt,
        date: new Date().toDateString(),
      };
      await AsyncStorage.setItem(DAILY_KEY, JSON.stringify(data));
      setDailyPrompt(prompt);
    } catch (error) {
      console.error('Save daily error:', error);
    }
  };

  const generateDailyPrompt = () => {
    const allPrompts = [...prompts, ...customPrompts];
    if (allPrompts.length > 0) {
      const randomPrompt = allPrompts[Math.floor(Math.random() * allPrompts.length)];
      saveDailyPrompt(randomPrompt);
    }
  };

  const getRandomPrompt = () => {
    const allPrompts = [...prompts, ...customPrompts];
    const filtered =
      selectedCategory === 'All'
        ? allPrompts
        : allPrompts.filter(p => p.category === selectedCategory);

    if (filtered.length === 0) {
      Alert.alert('No Prompts', 'No prompts available in this category');
      return;
    }

    const randomPrompt = filtered[Math.floor(Math.random() * filtered.length)];
    setCurrentPrompt(randomPrompt);

    const newCount = adCount + 1;
    setAdCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const toggleFavorite = (promptId: string) => {
    const newFavorites = favorites.includes(promptId)
      ? favorites.filter(id => id !== promptId)
      : [...favorites, promptId];
    saveFavorites(newFavorites);
  };

  const addCustomPrompt = () => {
    if (!newPromptText.trim()) {
      Alert.alert('Error', 'Please enter a prompt');
      return;
    }

    const newPrompt: Prompt = {
      id: `custom_${Date.now()}`,
      text: newPromptText.trim(),
      category: newPromptCategory,
      isCustom: true,
    };

    const newCustom = [...customPrompts, newPrompt];
    saveCustomPrompts(newCustom);
    setNewPromptText('');
    setNewPromptCategory('General');
    setShowAddModal(false);
  };

  const deleteCustomPrompt = (promptId: string) => {
    Alert.alert('Delete Prompt', 'Are you sure you want to delete this custom prompt?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = customPrompts.filter(p => p.id !== promptId);
          saveCustomPrompts(updated);
          if (favorites.includes(promptId)) {
            saveFavorites(favorites.filter(id => id !== promptId));
          }
        },
      },
    ]);
  };

  const getAllPrompts = () => [...prompts, ...customPrompts];

  const getFilteredPrompts = () => {
    const all = getAllPrompts();
    if (selectedCategory === 'All') return all;
    return all.filter(p => p.category === selectedCategory);
  };

  const getFavoritePrompts = () => {
    const all = getAllPrompts();
    return all.filter(p => favorites.includes(p.id));
  };

  const getCategoryCounts = () => {
    const all = getAllPrompts();
    const counts: { [key in Category]: number } = {
      All: all.length,
      Writing: 0,
      Art: 0,
      Music: 0,
      Design: 0,
      General: 0,
    };

    all.forEach(prompt => {
      if (counts[prompt.category] !== undefined) {
        counts[prompt.category]++;
      }
    });

    return counts;
  };

  const categories: Category[] = ['All', 'Writing', 'Art', 'Music', 'Design', 'General'];
  const categoryCounts = getCategoryCounts();
  const filteredPrompts = getFilteredPrompts();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Creativity Prompter</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {dailyPrompt && (
        <View style={styles.dailyCard}>
          <View style={styles.dailyHeader}>
            <Text style={styles.dailyLabel}>Today's Prompt</Text>
            <TouchableOpacity onPress={generateDailyPrompt}>
              <Text style={styles.refreshIcon}>🔄</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.dailyText}>{dailyPrompt.text}</Text>
          <View style={styles.dailyFooter}>
            <Text style={styles.dailyCategory}>{dailyPrompt.category}</Text>
            <TouchableOpacity onPress={() => toggleFavorite(dailyPrompt.id)}>
              <Text style={styles.favoriteIcon}>
                {favorites.includes(dailyPrompt.id) ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.randomSection}>
        <TouchableOpacity style={styles.randomButton} onPress={getRandomPrompt}>
          <Text style={styles.randomButtonIcon}>🎲</Text>
          <Text style={styles.randomButtonText}>Get Random Prompt</Text>
        </TouchableOpacity>
      </View>

      {currentPrompt && (
        <View style={styles.currentCard}>
          <Text style={styles.currentText}>{currentPrompt.text}</Text>
          <View style={styles.currentFooter}>
            <Text style={styles.currentCategory}>{currentPrompt.category}</Text>
            <TouchableOpacity onPress={() => toggleFavorite(currentPrompt.id)}>
              <Text style={styles.favoriteIcon}>
                {favorites.includes(currentPrompt.id) ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.actionsBar}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowFavoritesModal(true)}
        >
          <Text style={styles.actionButtonIcon}>❤️</Text>
          <Text style={styles.actionButtonText}>Favorites ({favorites.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category} ({categoryCounts[category]})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredPrompts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.promptCard}
            onPress={() => setCurrentPrompt(item)}
          >
            <View style={styles.promptContent}>
              <Text style={styles.promptText} numberOfLines={3}>
                {item.text}
              </Text>
              <View style={styles.promptMeta}>
                <Text style={styles.promptCategory}>{item.category}</Text>
                {item.isCustom && <Text style={styles.customBadge}>Custom</Text>}
              </View>
            </View>
            <View style={styles.promptActions}>
              <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                <Text style={styles.promptIcon}>
                  {favorites.includes(item.id) ? '❤️' : '🤍'}
                </Text>
              </TouchableOpacity>
              {item.isCustom && (
                <TouchableOpacity onPress={() => deleteCustomPrompt(item.id)}>
                  <Text style={styles.promptIcon}>🗑️</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>💡</Text>
            <Text style={styles.emptyText}>No prompts in this category</Text>
          </View>
        }
      />

      <AdBanner />

      {/* Add Custom Prompt Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Prompt</Text>

            <Text style={styles.label}>Prompt Text</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newPromptText}
              onChangeText={setNewPromptText}
              placeholder="Enter your creative prompt..."
              multiline
              numberOfLines={4}
              autoFocus
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
              {(['Writing', 'Art', 'Music', 'Design', 'General'] as Category[]).map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryOption,
                    newPromptCategory === cat && styles.categoryOptionActive,
                  ]}
                  onPress={() => setNewPromptCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      newPromptCategory === cat && styles.categoryOptionTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewPromptText('');
                  setNewPromptCategory('General');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={addCustomPrompt}
              >
                <Text style={styles.saveButtonText}>Add Prompt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Favorites Modal */}
      <Modal visible={showFavoritesModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Favorite Prompts</Text>

            <FlatList
              data={getFavoritePrompts()}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.favoritesList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.favoriteCard}
                  onPress={() => {
                    setCurrentPrompt(item);
                    setShowFavoritesModal(false);
                  }}
                >
                  <Text style={styles.favoriteText}>{item.text}</Text>
                  <View style={styles.favoriteMeta}>
                    <Text style={styles.favoriteCategory}>{item.category}</Text>
                    <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                      <Text style={styles.favoriteRemove}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyFavorites}>
                  <Text style={styles.emptyEmoji}>💔</Text>
                  <Text style={styles.emptyText}>No favorite prompts yet</Text>
                  <Text style={styles.emptySubtext}>Tap the heart on any prompt to save it</Text>
                </View>
              }
            />

            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={() => setShowFavoritesModal(false)}
            >
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
    backgroundColor: colors.primary + '15',
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
    color: colors.primary,
    textTransform: 'uppercase',
  },
  refreshIcon: {
    fontSize: 16,
  },
  dailyText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  dailyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dailyCategory: {
    fontSize: 12,
    color: colors.gray.dark,
    fontWeight: '500',
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
    fontSize: 18,
    color: colors.text,
    lineHeight: 28,
    marginBottom: spacing.lg,
  },
  currentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentCategory: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
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
    backgroundColor: colors.gray.light,
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray.dark,
  },
  categoryTextActive: {
    color: colors.white,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  promptCard: {
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
  promptContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  promptText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  promptMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  promptCategory: {
    fontSize: 12,
    color: colors.gray.dark,
    fontWeight: '500',
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
  promptActions: {
    gap: spacing.sm,
  },
  promptIcon: {
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
    height: 100,
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
    backgroundColor: colors.gray.light,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryOptionActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  categoryOptionText: {
    fontSize: 14,
    color: colors.gray.dark,
    fontWeight: '500',
  },
  categoryOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
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
  favoriteCategory: {
    fontSize: 12,
    color: colors.gray.dark,
    fontWeight: '500',
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
