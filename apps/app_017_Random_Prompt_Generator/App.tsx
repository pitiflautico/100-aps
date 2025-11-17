import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Share } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Random_Prompt_Generator_data';

type Category = 'writing' | 'art' | 'creative';

const PROMPTS: Record<Category, string[]> = {
  writing: [
    'Write about a character who discovers they can read minds, but only when people are lying.',
    'A time traveler accidentally prevents their own birth. What happens next?',
    'Describe a world where emotions are visible as colored auras around people.',
    'Write a story that begins with: "The last person on Earth sat alone in a room. There was a knock on the door."',
    'A detective must solve a crime that hasn\'t happened yet.',
    'Write from the perspective of a house that has witnessed generations of families.',
    'Two strangers wake up handcuffed together with no memory of how they got there.',
    'A love letter written by someone who speaks only in metaphors.',
    'The main character receives a message from their future self. It says only: "Don\'t trust them."',
    'Write about a society where lying is physically impossible.',
  ],
  art: [
    'Create a landscape where gravity works sideways.',
    'Design a creature that lives in the clouds and feeds on lightning.',
    'Illustrate the concept of "nostalgia" without using any recognizable objects.',
    'Draw a portrait using only geometric shapes and three colors.',
    'Create an underwater city inhabited by beings made of light.',
    'Design a map of an imaginary country where emotions determine geography.',
    'Illustrate what music would look like if it were a physical substance.',
    'Create a scene showing the moment between sleeping and waking.',
    'Design architectural structures inspired by natural disasters.',
    'Illustrate a garden where flowers bloom with memories instead of petals.',
  ],
  creative: [
    'Invent a new color and describe what it represents.',
    'Create a recipe for cooking time itself.',
    'Design a language spoken entirely through dance.',
    'Imagine a sport played in zero gravity using only thought.',
    'Invent a musical instrument that plays emotions instead of notes.',
    'Create a holiday celebrated by a civilization living underground.',
    'Design a currency based on forgotten memories.',
    'Invent a form of transportation powered by dreams.',
    'Create a board game where the rules change every turn.',
    'Imagine a library where books write themselves based on reader emotions.',
  ],
};

export default function App() {
  const [category, setCategory] = useState<Category>('writing');
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadData();
    generatePrompt();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setFavorites(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (data: string[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setFavorites(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const generatePrompt = (cat: Category = category) => {
    const prompts = PROMPTS[cat];
    const random = prompts[Math.floor(Math.random() * prompts.length)];
    setCurrentPrompt(random);
    const newCount = count + 1;
    setCount(newCount);
    if (newCount % 10 === 0) showInterstitialAd();
  };

  const toggleFavorite = () => {
    if (!currentPrompt) return;
    if (favorites.includes(currentPrompt)) {
      saveData(favorites.filter((f) => f !== currentPrompt));
    } else {
      saveData([...favorites, currentPrompt]);
    }
  };

  const sharePrompt = async () => {
    try {
      await Share.share({ message: currentPrompt });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const changeCategory = (cat: Category) => {
    setCategory(cat);
    generatePrompt(cat);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Prompt Generator</Text>
        <Text style={styles.favCount}>⭐ {favorites.length}</Text>
      </View>

      <View style={styles.tabs}>
        {(['writing', 'art', 'creative'] as Category[]).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.tab, category === cat && styles.tabActive]}
            onPress={() => changeCategory(cat)}
          >
            <Text style={[styles.tabText, category === cat && styles.tabTextActive]}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <View style={styles.promptCard}>
          <Text style={styles.promptText}>{currentPrompt || 'Tap "Generate" to start'}</Text>
        </View>

        <TouchableOpacity style={styles.btnGenerate} onPress={() => generatePrompt()}>
          <Text style={styles.btnGenerateText}>🎲 Generate Random</Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, favorites.includes(currentPrompt) && styles.actionBtnFav]}
            onPress={toggleFavorite}
          >
            <Text style={styles.actionBtnText}>
              {favorites.includes(currentPrompt) ? '⭐ Favorited' : '☆ Favorite'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={sharePrompt}>
            <Text style={styles.actionBtnText}>📤 Share</Text>
          </TouchableOpacity>
        </View>

        {favorites.length > 0 && (
          <View style={styles.favoritesSection}>
            <Text style={styles.sectionTitle}>Your Favorites</Text>
            {favorites.map((fav, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.favoriteCard}
                onPress={() => setCurrentPrompt(fav)}
              >
                <Text style={styles.favoriteText} numberOfLines={2}>
                  {fav}
                </Text>
                <TouchableOpacity onPress={() => saveData(favorites.filter((f) => f !== fav))}>
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  favCount: { fontSize: 18, color: colors.text },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.md, borderRadius: 20, backgroundColor: colors.gray.light, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.text },
  tabTextActive: { color: colors.white },
  content: { flex: 1 },
  contentInner: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  promptCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    minHeight: 200,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  promptText: { fontSize: 18, color: colors.text, lineHeight: 28, textAlign: 'center' },
  btnGenerate: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  btnGenerateText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  actionBtn: { flex: 1, backgroundColor: colors.gray.light, paddingVertical: spacing.md, borderRadius: 12, alignItems: 'center' },
  actionBtnFav: { backgroundColor: colors.status.warning },
  actionBtnText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  favoritesSection: { marginTop: spacing.xl },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  favoriteCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteText: { flex: 1, fontSize: 14, color: colors.text, marginRight: spacing.md },
  deleteBtn: { fontSize: 20, color: colors.status.error, padding: spacing.sm },
});
