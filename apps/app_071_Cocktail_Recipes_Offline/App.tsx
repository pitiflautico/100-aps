import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, TextInput,
  Modal, ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const FAVORITES_KEY = '@Cocktail_Favorites';

interface Cocktail {
  id: string;
  name: string;
  emoji: string;
  category: string;
  difficulty: string;
  glassType: string;
  ingredients: string[];
  instructions: string[];
  garnish?: string;
}

const COCKTAILS_DATABASE: Cocktail[] = [
  {
    id: '1',
    name: 'Margarita',
    emoji: '🍹',
    category: 'Classic',
    difficulty: 'Easy',
    glassType: 'Margarita Glass',
    ingredients: ['2 oz Tequila', '1 oz Lime Juice', '1 oz Triple Sec', 'Salt for rim', 'Ice'],
    instructions: [
      'Rub lime wedge around rim and dip in salt',
      'Add tequila, lime juice, and triple sec to shaker',
      'Fill with ice and shake for 15 seconds',
      'Strain into prepared glass over fresh ice',
    ],
    garnish: 'Lime wheel',
  },
  {
    id: '2',
    name: 'Mojito',
    emoji: '🍃',
    category: 'Tropical',
    difficulty: 'Easy',
    glassType: 'Highball',
    ingredients: ['2 oz White Rum', '1 oz Lime Juice', '2 tsp Sugar', '6 Mint Leaves', 'Soda Water', 'Ice'],
    instructions: [
      'Muddle mint leaves with sugar and lime juice',
      'Add rum and stir',
      'Fill glass with ice',
      'Top with soda water',
      'Stir gently to combine',
    ],
    garnish: 'Mint sprig and lime wheel',
  },
  {
    id: '3',
    name: 'Old Fashioned',
    emoji: '🥃',
    category: 'Classic',
    difficulty: 'Medium',
    glassType: 'Rocks Glass',
    ingredients: ['2 oz Bourbon', '1 Sugar Cube', '2 dashes Angostura Bitters', 'Orange Peel', 'Ice'],
    instructions: [
      'Place sugar cube in glass',
      'Add bitters and muddle',
      'Add bourbon and stir',
      'Add large ice cube',
      'Express orange peel over drink',
    ],
    garnish: 'Orange peel and cherry',
  },
  {
    id: '4',
    name: 'Martini',
    emoji: '🍸',
    category: 'Classic',
    difficulty: 'Medium',
    glassType: 'Martini Glass',
    ingredients: ['2.5 oz Gin', '0.5 oz Dry Vermouth', 'Ice'],
    instructions: [
      'Chill martini glass with ice',
      'Add gin and vermouth to mixing glass',
      'Fill with ice and stir for 30 seconds',
      'Discard ice from martini glass',
      'Strain cocktail into chilled glass',
    ],
    garnish: 'Lemon twist or olive',
  },
  {
    id: '5',
    name: 'Piña Colada',
    emoji: '🥥',
    category: 'Tropical',
    difficulty: 'Easy',
    glassType: 'Hurricane Glass',
    ingredients: ['2 oz White Rum', '1.5 oz Coconut Cream', '1.5 oz Pineapple Juice', '1 cup Ice'],
    instructions: [
      'Add all ingredients to blender',
      'Blend until smooth',
      'Pour into hurricane glass',
      'Serve immediately',
    ],
    garnish: 'Pineapple wedge and cherry',
  },
  {
    id: '6',
    name: 'Cosmopolitan',
    emoji: '💗',
    category: 'Modern',
    difficulty: 'Easy',
    glassType: 'Martini Glass',
    ingredients: ['1.5 oz Vodka', '1 oz Cointreau', '0.5 oz Lime Juice', '1 oz Cranberry Juice', 'Ice'],
    instructions: [
      'Add all ingredients to shaker',
      'Fill with ice',
      'Shake vigorously for 15 seconds',
      'Strain into chilled martini glass',
    ],
    garnish: 'Lime wheel',
  },
  {
    id: '7',
    name: 'Daiquiri',
    emoji: '🍋',
    category: 'Classic',
    difficulty: 'Easy',
    glassType: 'Coupe Glass',
    ingredients: ['2 oz White Rum', '1 oz Lime Juice', '0.75 oz Simple Syrup', 'Ice'],
    instructions: [
      'Add rum, lime juice, and syrup to shaker',
      'Fill with ice',
      'Shake for 15 seconds',
      'Strain into chilled coupe glass',
    ],
    garnish: 'Lime wheel',
  },
  {
    id: '8',
    name: 'Manhattan',
    emoji: '🍷',
    category: 'Classic',
    difficulty: 'Medium',
    glassType: 'Coupe Glass',
    ingredients: ['2 oz Rye Whiskey', '1 oz Sweet Vermouth', '2 dashes Angostura Bitters', 'Ice'],
    instructions: [
      'Add whiskey, vermouth, and bitters to mixing glass',
      'Fill with ice',
      'Stir for 30 seconds',
      'Strain into chilled coupe glass',
    ],
    garnish: 'Cherry',
  },
  {
    id: '9',
    name: 'Moscow Mule',
    emoji: '🫚',
    category: 'Modern',
    difficulty: 'Easy',
    glassType: 'Copper Mug',
    ingredients: ['2 oz Vodka', '0.5 oz Lime Juice', '4 oz Ginger Beer', 'Ice'],
    instructions: [
      'Fill copper mug with ice',
      'Add vodka and lime juice',
      'Top with ginger beer',
      'Stir gently',
    ],
    garnish: 'Lime wedge and mint',
  },
  {
    id: '10',
    name: 'Negroni',
    emoji: '🔴',
    category: 'Classic',
    difficulty: 'Easy',
    glassType: 'Rocks Glass',
    ingredients: ['1 oz Gin', '1 oz Campari', '1 oz Sweet Vermouth', 'Ice'],
    instructions: [
      'Add all ingredients to rocks glass',
      'Fill with ice',
      'Stir for 15 seconds',
      'Express orange peel over drink',
    ],
    garnish: 'Orange peel',
  },
  {
    id: '11',
    name: 'Whiskey Sour',
    emoji: '🥃',
    category: 'Classic',
    difficulty: 'Medium',
    glassType: 'Rocks Glass',
    ingredients: ['2 oz Bourbon', '0.75 oz Lemon Juice', '0.5 oz Simple Syrup', '1 Egg White', 'Ice'],
    instructions: [
      'Add all ingredients to shaker without ice',
      'Dry shake for 10 seconds',
      'Add ice and shake vigorously',
      'Strain into rocks glass over ice',
    ],
    garnish: 'Cherry and lemon wheel',
  },
  {
    id: '12',
    name: 'Mai Tai',
    emoji: '🏝️',
    category: 'Tropical',
    difficulty: 'Medium',
    glassType: 'Rocks Glass',
    ingredients: ['1.5 oz White Rum', '0.5 oz Dark Rum', '1 oz Lime Juice', '0.5 oz Orange Curaçao', '0.5 oz Orgeat', 'Ice'],
    instructions: [
      'Add white rum, lime juice, curaçao, and orgeat to shaker',
      'Fill with ice and shake',
      'Strain into rocks glass over crushed ice',
      'Float dark rum on top',
    ],
    garnish: 'Mint and lime wheel',
  },
  {
    id: '13',
    name: 'Aperol Spritz',
    emoji: '🍊',
    category: 'Modern',
    difficulty: 'Easy',
    glassType: 'Wine Glass',
    ingredients: ['3 oz Prosecco', '2 oz Aperol', '1 oz Soda Water', 'Ice'],
    instructions: [
      'Fill wine glass with ice',
      'Add Aperol',
      'Add Prosecco',
      'Top with soda water',
      'Stir gently',
    ],
    garnish: 'Orange slice',
  },
  {
    id: '14',
    name: 'Bloody Mary',
    emoji: '🍅',
    category: 'Modern',
    difficulty: 'Easy',
    glassType: 'Highball',
    ingredients: ['2 oz Vodka', '4 oz Tomato Juice', '0.5 oz Lemon Juice', 'Worcestershire Sauce', 'Hot Sauce', 'Salt', 'Pepper', 'Ice'],
    instructions: [
      'Add all ingredients to highball glass',
      'Fill with ice',
      'Stir well',
      'Taste and adjust seasonings',
    ],
    garnish: 'Celery, lemon, olive',
  },
  {
    id: '15',
    name: 'Caipirinha',
    emoji: '🇧🇷',
    category: 'Tropical',
    difficulty: 'Easy',
    glassType: 'Rocks Glass',
    ingredients: ['2 oz Cachaça', '1 Lime (quartered)', '2 tsp Sugar', 'Ice'],
    instructions: [
      'Add lime quarters and sugar to glass',
      'Muddle thoroughly',
      'Fill glass with crushed ice',
      'Add cachaça and stir',
    ],
    garnish: 'Lime wheel',
  },
  {
    id: '16',
    name: 'Espresso Martini',
    emoji: '☕',
    category: 'Modern',
    difficulty: 'Medium',
    glassType: 'Martini Glass',
    ingredients: ['2 oz Vodka', '1 oz Coffee Liqueur', '1 oz Fresh Espresso', '0.5 oz Simple Syrup', 'Ice'],
    instructions: [
      'Brew fresh espresso and let cool slightly',
      'Add all ingredients to shaker',
      'Fill with ice',
      'Shake vigorously until frothy',
      'Strain into chilled martini glass',
    ],
    garnish: '3 coffee beans',
  },
  {
    id: '17',
    name: 'Paloma',
    emoji: '🍋',
    category: 'Tropical',
    difficulty: 'Easy',
    glassType: 'Highball',
    ingredients: ['2 oz Tequila', '0.5 oz Lime Juice', '4 oz Grapefruit Soda', 'Salt for rim', 'Ice'],
    instructions: [
      'Rim glass with salt',
      'Fill with ice',
      'Add tequila and lime juice',
      'Top with grapefruit soda',
      'Stir gently',
    ],
    garnish: 'Grapefruit wedge',
  },
  {
    id: '18',
    name: 'Long Island Iced Tea',
    emoji: '🍹',
    category: 'Modern',
    difficulty: 'Hard',
    glassType: 'Highball',
    ingredients: ['0.5 oz Vodka', '0.5 oz Rum', '0.5 oz Gin', '0.5 oz Tequila', '0.5 oz Triple Sec', '1 oz Lemon Juice', '0.5 oz Simple Syrup', 'Cola', 'Ice'],
    instructions: [
      'Add all spirits, lemon juice, and syrup to shaker',
      'Fill with ice and shake',
      'Strain into highball glass over ice',
      'Top with splash of cola',
      'Stir gently',
    ],
    garnish: 'Lemon wedge',
  },
  {
    id: '19',
    name: 'French 75',
    emoji: '🥂',
    category: 'Classic',
    difficulty: 'Medium',
    glassType: 'Champagne Flute',
    ingredients: ['1 oz Gin', '0.5 oz Lemon Juice', '0.5 oz Simple Syrup', 'Champagne', 'Ice'],
    instructions: [
      'Add gin, lemon juice, and syrup to shaker',
      'Fill with ice and shake',
      'Strain into champagne flute',
      'Top with champagne',
    ],
    garnish: 'Lemon twist',
  },
  {
    id: '20',
    name: 'Dark n Stormy',
    emoji: '⛈️',
    category: 'Tropical',
    difficulty: 'Easy',
    glassType: 'Highball',
    ingredients: ['2 oz Dark Rum', '0.5 oz Lime Juice', '4 oz Ginger Beer', 'Ice'],
    instructions: [
      'Fill highball glass with ice',
      'Add lime juice',
      'Add ginger beer',
      'Float dark rum on top',
      'Stir gently before drinking',
    ],
    garnish: 'Lime wedge',
  },
  {
    id: '21',
    name: 'Sazerac',
    emoji: '🎭',
    category: 'Classic',
    difficulty: 'Hard',
    glassType: 'Rocks Glass',
    ingredients: ['2 oz Rye Whiskey', '0.25 oz Simple Syrup', '3 dashes Peychauds Bitters', 'Absinthe', 'Lemon Peel', 'Ice'],
    instructions: [
      'Rinse rocks glass with absinthe and discard',
      'Add whiskey, syrup, and bitters to mixing glass',
      'Fill with ice and stir for 30 seconds',
      'Strain into prepared glass (no ice)',
      'Express lemon peel over drink',
    ],
    garnish: 'Lemon peel',
  },
  {
    id: '22',
    name: 'Amaretto Sour',
    emoji: '🍑',
    category: 'Modern',
    difficulty: 'Easy',
    glassType: 'Rocks Glass',
    ingredients: ['1.5 oz Amaretto', '0.75 oz Bourbon', '1 oz Lemon Juice', '0.5 oz Simple Syrup', '1 Egg White', 'Ice'],
    instructions: [
      'Add all ingredients to shaker without ice',
      'Dry shake for 10 seconds',
      'Add ice and shake vigorously',
      'Strain into rocks glass over ice',
    ],
    garnish: 'Cherry and orange slice',
  },
  {
    id: '23',
    name: 'Gin Fizz',
    emoji: '💨',
    category: 'Classic',
    difficulty: 'Medium',
    glassType: 'Highball',
    ingredients: ['2 oz Gin', '1 oz Lemon Juice', '0.75 oz Simple Syrup', '1 Egg White', 'Soda Water', 'Ice'],
    instructions: [
      'Add gin, lemon juice, syrup, and egg white to shaker',
      'Dry shake without ice for 15 seconds',
      'Add ice and shake vigorously',
      'Strain into highball glass without ice',
      'Top with soda water',
    ],
    garnish: 'Lemon wheel',
  },
  {
    id: '24',
    name: 'Mint Julep',
    emoji: '🌿',
    category: 'Classic',
    difficulty: 'Easy',
    glassType: 'Julep Cup',
    ingredients: ['2.5 oz Bourbon', '0.5 oz Simple Syrup', '8 Mint Leaves', 'Crushed Ice'],
    instructions: [
      'Muddle mint leaves with syrup in julep cup',
      'Add bourbon',
      'Fill cup with crushed ice',
      'Stir until cup is frosted',
      'Add more ice if needed',
    ],
    garnish: 'Mint bouquet',
  },
  {
    id: '25',
    name: 'Tom Collins',
    emoji: '🍋',
    category: 'Classic',
    difficulty: 'Easy',
    glassType: 'Collins Glass',
    ingredients: ['2 oz Gin', '1 oz Lemon Juice', '0.5 oz Simple Syrup', 'Soda Water', 'Ice'],
    instructions: [
      'Add gin, lemon juice, and syrup to glass',
      'Fill with ice',
      'Top with soda water',
      'Stir gently',
    ],
    garnish: 'Lemon wheel and cherry',
  },
  {
    id: '26',
    name: 'Bramble',
    emoji: '🫐',
    category: 'Modern',
    difficulty: 'Easy',
    glassType: 'Rocks Glass',
    ingredients: ['2 oz Gin', '1 oz Lemon Juice', '0.5 oz Simple Syrup', '0.5 oz Crème de Mûre', 'Crushed Ice'],
    instructions: [
      'Add gin, lemon juice, and syrup to shaker',
      'Shake with ice',
      'Strain into rocks glass over crushed ice',
      'Drizzle crème de mûre over top',
    ],
    garnish: 'Blackberry and lemon slice',
  },
  {
    id: '27',
    name: 'Tequila Sunrise',
    emoji: '🌅',
    category: 'Tropical',
    difficulty: 'Easy',
    glassType: 'Highball',
    ingredients: ['2 oz Tequila', '4 oz Orange Juice', '0.5 oz Grenadine', 'Ice'],
    instructions: [
      'Fill highball glass with ice',
      'Add tequila',
      'Add orange juice and stir',
      'Slowly pour grenadine down side of glass',
      'Let settle to create sunrise effect',
    ],
    garnish: 'Orange slice and cherry',
  },
  {
    id: '28',
    name: 'Boulevardier',
    emoji: '🎩',
    category: 'Classic',
    difficulty: 'Medium',
    glassType: 'Coupe Glass',
    ingredients: ['1.5 oz Bourbon', '1 oz Campari', '1 oz Sweet Vermouth', 'Ice'],
    instructions: [
      'Add all ingredients to mixing glass',
      'Fill with ice',
      'Stir for 30 seconds',
      'Strain into chilled coupe glass',
    ],
    garnish: 'Orange peel',
  },
  {
    id: '29',
    name: 'Aviation',
    emoji: '✈️',
    category: 'Classic',
    difficulty: 'Medium',
    glassType: 'Coupe Glass',
    ingredients: ['2 oz Gin', '0.5 oz Maraschino Liqueur', '0.25 oz Crème de Violette', '0.75 oz Lemon Juice', 'Ice'],
    instructions: [
      'Add all ingredients to shaker',
      'Fill with ice',
      'Shake vigorously',
      'Strain into chilled coupe glass',
    ],
    garnish: 'Cherry',
  },
  {
    id: '30',
    name: 'White Russian',
    emoji: '🥛',
    category: 'Modern',
    difficulty: 'Easy',
    glassType: 'Rocks Glass',
    ingredients: ['2 oz Vodka', '1 oz Coffee Liqueur', '1 oz Heavy Cream', 'Ice'],
    instructions: [
      'Fill rocks glass with ice',
      'Add vodka',
      'Add coffee liqueur',
      'Float cream on top',
      'Stir before drinking',
    ],
    garnish: 'None',
  },
  {
    id: '31',
    name: 'Sidecar',
    emoji: '🏍️',
    category: 'Classic',
    difficulty: 'Medium',
    glassType: 'Coupe Glass',
    ingredients: ['2 oz Cognac', '1 oz Cointreau', '0.75 oz Lemon Juice', 'Sugar for rim', 'Ice'],
    instructions: [
      'Rim coupe glass with sugar',
      'Add all ingredients to shaker',
      'Fill with ice and shake',
      'Strain into prepared glass',
    ],
    garnish: 'Orange twist',
  },
  {
    id: '32',
    name: 'Clover Club',
    emoji: '🍓',
    category: 'Classic',
    difficulty: 'Hard',
    glassType: 'Coupe Glass',
    ingredients: ['1.5 oz Gin', '0.5 oz Dry Vermouth', '0.75 oz Lemon Juice', '0.5 oz Raspberry Syrup', '1 Egg White', 'Ice'],
    instructions: [
      'Add all ingredients to shaker without ice',
      'Dry shake for 15 seconds',
      'Add ice and shake vigorously',
      'Double strain into chilled coupe glass',
    ],
    garnish: 'Fresh raspberries',
  },
];

const CATEGORIES = ['All', 'Classic', 'Modern', 'Tropical'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

export default function App() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const saved = await AsyncStorage.getItem(FAVORITES_KEY);
      if (saved) setFavorites(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const toggleFavorite = async (id: string) => {
    const updated = favorites.includes(id)
      ? favorites.filter(f => f !== id)
      : [...favorites, id];
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    setFavorites(updated);
  };

  const getFilteredCocktails = () => {
    let filtered = COCKTAILS_DATABASE;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    if (selectedDifficulty !== 'All') {
      filtered = filtered.filter(c => c.difficulty === selectedDifficulty);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          c.ingredients.some(i => i.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const openCocktail = (cocktail: Cocktail) => {
    setSelectedCocktail(cocktail);
    const newCount = count + 1;
    setCount(newCount);
    if (newCount % 7 === 0) showInterstitialAd();
  };

  const filteredCocktails = getFilteredCocktails();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Cocktail Recipes</Text>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterBtnText}>Filters</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name or ingredient..."
          placeholderTextColor={colors.gray.dark}
        />
      </View>

      {showFilters && (
        <View style={styles.filtersPanel}>
          <Text style={styles.filterLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterLabel}>Difficulty</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {DIFFICULTIES.map(diff => (
              <TouchableOpacity
                key={diff}
                style={[styles.filterChip, selectedDifficulty === diff && styles.filterChipActive]}
                onPress={() => setSelectedDifficulty(diff)}
              >
                <Text style={[styles.filterChipText, selectedDifficulty === diff && styles.filterChipTextActive]}>
                  {diff}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={filteredCocktails}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No cocktails found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openCocktail(item)}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTop}>
                <Text style={styles.emoji}>{item.emoji}</Text>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardCategory}>{item.category}</Text>
                    <Text style={styles.cardDot}>•</Text>
                    <Text style={styles.cardDifficulty}>{item.difficulty}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                <Text style={styles.star}>{favorites.includes(item.id) ? '⭐' : '☆'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.glassType}>Glass: {item.glassType}</Text>
            <Text style={styles.ingredientCount}>{item.ingredients.length} ingredients</Text>
          </TouchableOpacity>
        )}
      />

      <AdBanner />

      <Modal visible={selectedCocktail !== null} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          {selectedCocktail && (
            <>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{selectedCocktail.name}</Text>
                  <Text style={styles.modalEmoji}>{selectedCocktail.emoji}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedCocktail(null)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Category</Text>
                    <Text style={styles.metaValue}>{selectedCocktail.category}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Difficulty</Text>
                    <Text style={styles.metaValue}>{selectedCocktail.difficulty}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Glass</Text>
                    <Text style={styles.metaValue}>{selectedCocktail.glassType}</Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Ingredients</Text>
                  {selectedCocktail.ingredients.map((ingredient, index) => (
                    <View key={index} style={styles.ingredientRow}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.ingredientText}>{ingredient}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Instructions</Text>
                  {selectedCocktail.instructions.map((step, index) => (
                    <View key={index} style={styles.stepRow}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                </View>

                {selectedCocktail.garnish && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Garnish</Text>
                    <Text style={styles.garnishText}>{selectedCocktail.garnish}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.favoriteBtn}
                  onPress={() => toggleFavorite(selectedCocktail.id)}
                >
                  <Text style={styles.favoriteBtnText}>
                    {favorites.includes(selectedCocktail.id) ? '⭐ Remove from Favorites' : '☆ Add to Favorites'}
                  </Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  filterBtnText: { fontSize: 14, color: colors.white, fontWeight: '600' },
  searchContainer: { padding: spacing.lg, paddingBottom: spacing.md },
  searchInput: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.gray.light,
  },
  filtersPanel: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    paddingTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  filterScroll: { marginBottom: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray.light,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  filterChipActive: { backgroundColor: colors.primary },
  filterChipText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  filterChipTextActive: { color: colors.white },
  list: { padding: spacing.lg, paddingBottom: 100 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: { fontSize: 16, color: colors.gray.dark },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  cardTop: { flexDirection: 'row', flex: 1 },
  emoji: { fontSize: 40, marginRight: spacing.md },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: spacing.xs },
  cardMeta: { flexDirection: 'row', alignItems: 'center' },
  cardCategory: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  cardDot: { fontSize: 12, color: colors.gray.dark, marginHorizontal: spacing.xs },
  cardDifficulty: { fontSize: 12, color: colors.gray.dark },
  star: { fontSize: 24 },
  glassType: { fontSize: 13, color: colors.gray.dark, marginBottom: spacing.xs },
  ingredientCount: { fontSize: 13, color: colors.secondary, fontWeight: '600' },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xs },
  modalEmoji: { fontSize: 32 },
  closeBtn: { fontSize: 32, color: colors.gray.dark, fontWeight: '300' },
  modalContent: { flex: 1, padding: spacing.lg },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  metaItem: { alignItems: 'center', flex: 1 },
  metaLabel: { fontSize: 12, color: colors.gray.dark, marginBottom: spacing.xs },
  metaValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  bullet: { fontSize: 16, color: colors.primary, marginRight: spacing.sm, fontWeight: 'bold' },
  ingredientText: { fontSize: 15, color: colors.text, flex: 1 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: { fontSize: 14, fontWeight: 'bold', color: colors.white },
  stepText: { fontSize: 15, color: colors.text, flex: 1, lineHeight: 22 },
  garnishText: { fontSize: 15, color: colors.text, fontStyle: 'italic' },
  favoriteBtn: {
    backgroundColor: colors.secondary,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  favoriteBtnText: { fontSize: 16, fontWeight: 'bold', color: colors.white },
});
