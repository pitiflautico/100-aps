import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
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
  Divider,
  SegmentedButtons,
  List,
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
interface Recipe {
  id: string;
  title: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'dessert' | 'snack' | 'beverage' | 'appetizer' | 'other';
  cuisine: string;
  difficulty: 'easy' | 'medium' | 'hard';
  servings: number;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  calories: number;
  ingredients: Ingredient[];
  instructions: string[];
  notes: string;
  tags: string[];
  rating: number;
  favorite: boolean;
  source: string;
  createdAt: number;
  lastModified: number;
}

interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  recipeIds: string[];
  color: string;
}

// AdMob Configuration
const bannerId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';
const interstitialId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';

const interstitial = InterstitialAd.createForAdRequest(interstitialId);

const STORAGE_KEY = '@recipe_notes_recipes';
const COLLECTIONS_KEY = '@recipe_notes_collections';

const CATEGORIES = [
  { label: 'Breakfast', value: 'breakfast', icon: 'coffee', color: '#FF9800' },
  { label: 'Lunch', value: 'lunch', icon: 'food-fork-drink', color: '#4CAF50' },
  { label: 'Dinner', value: 'dinner', icon: 'food-turkey', color: '#2196F3' },
  { label: 'Dessert', value: 'dessert', icon: 'cake-variant', color: '#E91E63' },
  { label: 'Snack', value: 'snack', icon: 'food-apple', color: '#FFC107' },
  { label: 'Beverage', value: 'beverage', icon: 'cup', color: '#00BCD4' },
  { label: 'Appetizer', value: 'appetizer', icon: 'food-croissant', color: '#9C27B0' },
  { label: 'Other', value: 'other', icon: 'silverware', color: '#607D8B' },
];

const DIFFICULTIES = [
  { label: 'Easy', value: 'easy', color: '#4CAF50' },
  { label: 'Medium', value: 'medium', color: '#FF9800' },
  { label: 'Hard', value: 'hard', color: '#F44336' },
];

export default function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'date' | 'rating'>('date');
  const [currentView, setCurrentView] = useState<'all' | 'favorites'>('all');
  const [menuVisible, setMenuVisible] = useState(false);
  const [interstitialLoaded, setInterstitialLoaded] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'other' as Recipe['category'],
    cuisine: '',
    difficulty: 'medium' as Recipe['difficulty'],
    servings: '4',
    prepTime: '15',
    cookTime: '30',
    calories: '',
    ingredients: [{ id: '1', name: '', amount: '', unit: '' }],
    instructions: [''],
    notes: '',
    tags: '',
    source: '',
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
    loadRecipes();
    loadCollections();
  }, []);

  // Filter and sort recipes
  useEffect(() => {
    let filtered = [...recipes];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        recipe.ingredients.some(ing => ing.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(recipe => recipe.category === filterCategory);
    }

    // Difficulty filter
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(recipe => recipe.difficulty === filterDifficulty);
    }

    // Favorites filter
    if (currentView === 'favorites') {
      filtered = filtered.filter(recipe => recipe.favorite);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'rating':
          return b.rating - a.rating;
        case 'date':
        default:
          return b.createdAt - a.createdAt;
      }
    });

    setFilteredRecipes(filtered);
  }, [recipes, searchQuery, filterCategory, filterDifficulty, sortBy, currentView]);

  const loadRecipes = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecipes(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const loadCollections = async () => {
    try {
      const stored = await AsyncStorage.getItem(COLLECTIONS_KEY);
      if (stored) {
        setCollections(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  };

  const saveRecipes = async (newRecipes: Recipe[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newRecipes));
      setRecipes(newRecipes);
    } catch (error) {
      console.error('Error saving recipes:', error);
    }
  };

  const openModal = (recipe?: Recipe) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setFormData({
        title: recipe.title,
        category: recipe.category,
        cuisine: recipe.cuisine,
        difficulty: recipe.difficulty,
        servings: recipe.servings.toString(),
        prepTime: recipe.prepTime.toString(),
        cookTime: recipe.cookTime.toString(),
        calories: recipe.calories.toString(),
        ingredients: recipe.ingredients.length > 0 ? recipe.ingredients : [{ id: '1', name: '', amount: '', unit: '' }],
        instructions: recipe.instructions.length > 0 ? recipe.instructions : [''],
        notes: recipe.notes,
        tags: recipe.tags.join(', '),
        source: recipe.source,
      });
    } else {
      setEditingRecipe(null);
      setFormData({
        title: '',
        category: 'other',
        cuisine: '',
        difficulty: 'medium',
        servings: '4',
        prepTime: '15',
        cookTime: '30',
        calories: '',
        ingredients: [{ id: '1', name: '', amount: '', unit: '' }],
        instructions: [''],
        notes: '',
        tags: '',
        source: '',
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingRecipe(null);
  };

  const saveRecipe = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter recipe title');
      return;
    }

    const prepTime = parseInt(formData.prepTime) || 0;
    const cookTime = parseInt(formData.cookTime) || 0;

    const recipe: Recipe = {
      id: editingRecipe?.id || Date.now().toString(),
      title: formData.title.trim(),
      category: formData.category,
      cuisine: formData.cuisine.trim(),
      difficulty: formData.difficulty,
      servings: parseInt(formData.servings) || 1,
      prepTime,
      cookTime,
      totalTime: prepTime + cookTime,
      calories: parseInt(formData.calories) || 0,
      ingredients: formData.ingredients.filter(ing => ing.name.trim()),
      instructions: formData.instructions.filter(inst => inst.trim()),
      notes: formData.notes.trim(),
      tags: formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0),
      rating: editingRecipe?.rating || 0,
      favorite: editingRecipe?.favorite || false,
      source: formData.source.trim(),
      createdAt: editingRecipe?.createdAt || Date.now(),
      lastModified: Date.now(),
    };

    let newRecipes: Recipe[];
    if (editingRecipe) {
      newRecipes = recipes.map(r => (r.id === editingRecipe.id ? recipe : r));
    } else {
      newRecipes = [...recipes, recipe];

      if (newRecipes.length % 5 === 0 && interstitialLoaded) {
        interstitial.show();
      }
    }

    await saveRecipes(newRecipes);
    closeModal();
  };

  const deleteRecipe = (id: string) => {
    Alert.alert('Delete Recipe', 'Are you sure you want to delete this recipe?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const newRecipes = recipes.filter(recipe => recipe.id !== id);
          await saveRecipes(newRecipes);
          if (selectedRecipe?.id === id) {
            setViewModalVisible(false);
          }
        },
      },
    ]);
  };

  const toggleFavorite = async (id: string) => {
    const newRecipes = recipes.map(recipe =>
      recipe.id === id ? { ...recipe, favorite: !recipe.favorite } : recipe
    );
    await saveRecipes(newRecipes);

    if (selectedRecipe?.id === id) {
      setSelectedRecipe({ ...selectedRecipe, favorite: !selectedRecipe.favorite });
    }
  };

  const rateRecipe = async (id: string, rating: number) => {
    const newRecipes = recipes.map(recipe =>
      recipe.id === id ? { ...recipe, rating } : recipe
    );
    await saveRecipes(newRecipes);

    if (selectedRecipe?.id === id) {
      setSelectedRecipe({ ...selectedRecipe, rating });
    }
  };

  const viewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setViewModalVisible(true);
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { id: Date.now().toString(), name: '', amount: '', unit: '' }],
    });
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const removeIngredient = (index: number) => {
    const newIngredients = formData.ingredients.filter((_, i) => i !== index);
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const addInstruction = () => {
    setFormData({
      ...formData,
      instructions: [...formData.instructions, ''],
    });
  };

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData({ ...formData, instructions: newInstructions });
  };

  const removeInstruction = (index: number) => {
    const newInstructions = formData.instructions.filter((_, i) => i !== index);
    setFormData({ ...formData, instructions: newInstructions });
  };

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[CATEGORIES.length - 1];
  };

  const getDifficultyInfo = (difficulty: string) => {
    return DIFFICULTIES.find(d => d.value === difficulty) || DIFFICULTIES[1];
  };

  const renderRecipeCard = (recipe: Recipe) => {
    const categoryInfo = getCategoryInfo(recipe.category);
    const difficultyInfo = getDifficultyInfo(recipe.difficulty);

    return (
      <Card key={recipe.id} style={styles.recipeCard} onPress={() => viewRecipe(recipe)}>
        <Card.Content>
          <View style={styles.recipeHeader}>
            <View style={styles.recipeHeaderLeft}>
              <IconButton
                icon={categoryInfo.icon}
                size={24}
                iconColor={categoryInfo.color}
              />
              <View style={styles.recipeHeaderText}>
                <Text variant="titleMedium" style={styles.recipeTitle}>
                  {recipe.title}
                </Text>
                {recipe.cuisine && (
                  <Text variant="bodySmall" style={styles.recipeCuisine}>
                    {recipe.cuisine}
                  </Text>
                )}
              </View>
            </View>
            <IconButton
              icon={recipe.favorite ? 'heart' : 'heart-outline'}
              size={24}
              iconColor={recipe.favorite ? '#E91E63' : '#999'}
              onPress={() => toggleFavorite(recipe.id)}
            />
          </View>

          <View style={styles.recipeDetails}>
            <Chip
              style={[styles.difficultyChip, { backgroundColor: difficultyInfo.color + '20' }]}
              textStyle={[styles.chipText, { color: difficultyInfo.color }]}
            >
              {difficultyInfo.label}
            </Chip>
            <Chip icon="clock" style={styles.detailChip} textStyle={styles.chipText}>
              {recipe.totalTime} min
            </Chip>
            <Chip icon="account-multiple" style={styles.detailChip} textStyle={styles.chipText}>
              {recipe.servings} servings
            </Chip>
            {recipe.rating > 0 && (
              <Chip icon="star" style={styles.ratingChip} textStyle={styles.chipText}>
                {recipe.rating}/5
              </Chip>
            )}
          </View>

          {recipe.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {recipe.tags.slice(0, 3).map((tag, index) => (
                <Chip key={index} style={styles.tagChip} textStyle={styles.tagText}>
                  {tag}
                </Chip>
              ))}
              {recipe.tags.length > 3 && (
                <Text variant="bodySmall" style={styles.moreTags}>
                  +{recipe.tags.length - 3}
                </Text>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="Recipe Notes" />
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
                setSortBy('title');
              }}
              title="Sort by Title"
              leadingIcon={sortBy === 'title' ? 'check' : 'sort-alphabetical-ascending'}
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                setSortBy('date');
              }}
              title="Sort by Date"
              leadingIcon={sortBy === 'date' ? 'check' : 'sort-calendar-descending'}
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                setSortBy('rating');
              }}
              title="Sort by Rating"
              leadingIcon={sortBy === 'rating' ? 'check' : 'star'}
            />
            <Divider />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                setFilterCategory('all');
                setFilterDifficulty('all');
                setSearchQuery('');
              }}
              title="Clear Filters"
              leadingIcon="filter-off"
            />
          </Menu>
        </Appbar.Header>

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <SegmentedButtons
            value={currentView}
            onValueChange={value => setCurrentView(value as any)}
            buttons={[
              {
                value: 'all',
                label: `All (${recipes.length})`,
                icon: 'silverware-fork-knife',
              },
              {
                value: 'favorites',
                label: `Favorites (${recipes.filter(r => r.favorite).length})`,
                icon: 'heart',
              },
            ]}
          />
        </View>

        {/* Search and Filters */}
        <View style={styles.filtersContainer}>
          <Searchbar
            placeholder="Search recipes..."
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
              selected={filterDifficulty === 'all'}
              onPress={() => setFilterDifficulty('all')}
              style={styles.filterChip}
            >
              All Levels
            </Chip>
            {DIFFICULTIES.map(diff => (
              <Chip
                key={diff.value}
                selected={filterDifficulty === diff.value}
                onPress={() => setFilterDifficulty(diff.value)}
                style={styles.filterChip}
              >
                {diff.label}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Recipes List */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {filteredRecipes.length === 0 ? (
            <View style={styles.emptyState}>
              <IconButton
                icon={currentView === 'favorites' ? 'heart-outline' : 'book-open-outline'}
                size={64}
                iconColor="#ccc"
              />
              <Text variant="titleMedium" style={styles.emptyText}>
                {currentView === 'favorites' ? 'No favorite recipes' : 'No recipes found'}
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                {searchQuery || filterCategory !== 'all' || filterDifficulty !== 'all'
                  ? 'Try adjusting your filters'
                  : currentView === 'favorites'
                  ? 'Mark recipes as favorites to see them here'
                  : 'Add your first recipe to get started'}
              </Text>
            </View>
          ) : (
            filteredRecipes.map(renderRecipeCard)
          )}

          <View style={styles.adContainer}>
            <BannerAd unitId={bannerId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
          </View>
        </ScrollView>

        {/* Add/Edit Recipe Modal */}
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={closeModal}
            contentContainerStyle={styles.modal}
          >
            <ScrollView>
              <Text variant="titleLarge" style={styles.modalTitle}>
                {editingRecipe ? 'Edit Recipe' : 'Add Recipe'}
              </Text>

              <TextInput
                label="Recipe Title *"
                value={formData.title}
                onChangeText={text => setFormData({ ...formData, title: text })}
                style={styles.input}
                mode="outlined"
              />

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
                label="Cuisine Type"
                value={formData.cuisine}
                onChangeText={text => setFormData({ ...formData, cuisine: text })}
                style={styles.input}
                mode="outlined"
                placeholder="e.g., Italian, Mexican, Asian"
              />

              <Text variant="labelMedium" style={styles.label}>
                Difficulty
              </Text>
              <SegmentedButtons
                value={formData.difficulty}
                onValueChange={value => setFormData({ ...formData, difficulty: value as any })}
                buttons={DIFFICULTIES.map(d => ({ value: d.value, label: d.label }))}
                style={styles.difficultyButtons}
              />

              <View style={styles.row}>
                <TextInput
                  label="Servings"
                  value={formData.servings}
                  onChangeText={text => setFormData({ ...formData, servings: text })}
                  style={[styles.input, styles.thirdInput]}
                  mode="outlined"
                  keyboardType="numeric"
                />
                <TextInput
                  label="Prep (min)"
                  value={formData.prepTime}
                  onChangeText={text => setFormData({ ...formData, prepTime: text })}
                  style={[styles.input, styles.thirdInput]}
                  mode="outlined"
                  keyboardType="numeric"
                />
                <TextInput
                  label="Cook (min)"
                  value={formData.cookTime}
                  onChangeText={text => setFormData({ ...formData, cookTime: text })}
                  style={[styles.input, styles.thirdInput]}
                  mode="outlined"
                  keyboardType="numeric"
                />
              </View>

              <TextInput
                label="Calories (per serving)"
                value={formData.calories}
                onChangeText={text => setFormData({ ...formData, calories: text })}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />

              <Divider style={styles.divider} />
              <View style={styles.sectionHeader}>
                <Text variant="titleMedium">Ingredients</Text>
                <Button mode="outlined" onPress={addIngredient} icon="plus">
                  Add
                </Button>
              </View>

              {formData.ingredients.map((ingredient, index) => (
                <View key={ingredient.id} style={styles.ingredientRow}>
                  <TextInput
                    label="Ingredient"
                    value={ingredient.name}
                    onChangeText={text => updateIngredient(index, 'name', text)}
                    style={[styles.input, styles.ingredientName]}
                    mode="outlined"
                    dense
                  />
                  <TextInput
                    label="Amount"
                    value={ingredient.amount}
                    onChangeText={text => updateIngredient(index, 'amount', text)}
                    style={[styles.input, styles.ingredientAmount]}
                    mode="outlined"
                    dense
                  />
                  <TextInput
                    label="Unit"
                    value={ingredient.unit}
                    onChangeText={text => updateIngredient(index, 'unit', text)}
                    style={[styles.input, styles.ingredientUnit]}
                    mode="outlined"
                    dense
                  />
                  <IconButton
                    icon="close"
                    size={20}
                    onPress={() => removeIngredient(index)}
                  />
                </View>
              ))}

              <Divider style={styles.divider} />
              <View style={styles.sectionHeader}>
                <Text variant="titleMedium">Instructions</Text>
                <Button mode="outlined" onPress={addInstruction} icon="plus">
                  Add
                </Button>
              </View>

              {formData.instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionRow}>
                  <Text variant="bodyMedium" style={styles.instructionNumber}>
                    {index + 1}.
                  </Text>
                  <TextInput
                    label={`Step ${index + 1}`}
                    value={instruction}
                    onChangeText={text => updateInstruction(index, text)}
                    style={[styles.input, styles.instructionInput]}
                    mode="outlined"
                    multiline
                    numberOfLines={2}
                  />
                  <IconButton
                    icon="close"
                    size={20}
                    onPress={() => removeInstruction(index)}
                  />
                </View>
              ))}

              <Divider style={styles.divider} />

              <TextInput
                label="Tags (comma-separated)"
                value={formData.tags}
                onChangeText={text => setFormData({ ...formData, tags: text })}
                style={styles.input}
                mode="outlined"
                placeholder="e.g., vegetarian, quick, healthy"
              />

              <TextInput
                label="Source"
                value={formData.source}
                onChangeText={text => setFormData({ ...formData, source: text })}
                style={styles.input}
                mode="outlined"
                placeholder="e.g., Grandma's cookbook, YouTube"
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
                <Button mode="contained" onPress={saveRecipe} style={styles.modalButton}>
                  {editingRecipe ? 'Update' : 'Add'}
                </Button>
              </View>
            </ScrollView>
          </Modal>

          {/* View Recipe Modal */}
          <Modal
            visible={viewModalVisible}
            onDismiss={() => setViewModalVisible(false)}
            contentContainerStyle={styles.modal}
          >
            {selectedRecipe && (
              <ScrollView>
                <View style={styles.viewHeader}>
                  <View style={styles.viewHeaderLeft}>
                    <IconButton
                      icon={getCategoryInfo(selectedRecipe.category).icon}
                      size={32}
                      iconColor={getCategoryInfo(selectedRecipe.category).color}
                    />
                    <Text variant="headlineSmall" style={styles.viewTitle}>
                      {selectedRecipe.title}
                    </Text>
                  </View>
                  <View style={styles.viewActions}>
                    <IconButton
                      icon={selectedRecipe.favorite ? 'heart' : 'heart-outline'}
                      size={28}
                      iconColor={selectedRecipe.favorite ? '#E91E63' : '#999'}
                      onPress={() => toggleFavorite(selectedRecipe.id)}
                    />
                    <IconButton
                      icon="pencil"
                      size={24}
                      onPress={() => {
                        setViewModalVisible(false);
                        openModal(selectedRecipe);
                      }}
                    />
                    <IconButton
                      icon="delete"
                      size={24}
                      iconColor="#d32f2f"
                      onPress={() => deleteRecipe(selectedRecipe.id)}
                    />
                  </View>
                </View>

                {selectedRecipe.cuisine && (
                  <Text variant="titleMedium" style={styles.viewCuisine}>
                    {selectedRecipe.cuisine}
                  </Text>
                )}

                <View style={styles.viewDetails}>
                  <Chip
                    style={[
                      styles.viewDifficultyChip,
                      { backgroundColor: getDifficultyInfo(selectedRecipe.difficulty).color + '20' },
                    ]}
                  >
                    {getDifficultyInfo(selectedRecipe.difficulty).label}
                  </Chip>
                  <Chip icon="account-multiple">{selectedRecipe.servings} servings</Chip>
                  <Chip icon="clock-outline">Prep: {selectedRecipe.prepTime}min</Chip>
                  <Chip icon="clock">Cook: {selectedRecipe.cookTime}min</Chip>
                  <Chip icon="clock-fast">Total: {selectedRecipe.totalTime}min</Chip>
                  {selectedRecipe.calories > 0 && (
                    <Chip icon="fire">{selectedRecipe.calories} cal/serving</Chip>
                  )}
                </View>

                {/* Rating */}
                <View style={styles.ratingSection}>
                  <Text variant="labelMedium" style={styles.sectionLabel}>
                    Your Rating:
                  </Text>
                  <View style={styles.ratingStars}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <IconButton
                        key={star}
                        icon={star <= selectedRecipe.rating ? 'star' : 'star-outline'}
                        size={28}
                        iconColor="#FFC107"
                        onPress={() => rateRecipe(selectedRecipe.id, star)}
                      />
                    ))}
                  </View>
                </View>

                <Divider style={styles.divider} />

                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Ingredients
                </Text>
                {selectedRecipe.ingredients.map((ingredient, index) => (
                  <View key={ingredient.id} style={styles.viewIngredient}>
                    <IconButton icon="checkbox-blank-circle" size={8} iconColor="#6200ee" />
                    <Text variant="bodyMedium">
                      {ingredient.amount} {ingredient.unit} {ingredient.name}
                    </Text>
                  </View>
                ))}

                <Divider style={styles.divider} />

                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Instructions
                </Text>
                {selectedRecipe.instructions.map((instruction, index) => (
                  <View key={index} style={styles.viewInstruction}>
                    <Text variant="bodyLarge" style={styles.viewInstructionNumber}>
                      {index + 1}.
                    </Text>
                    <Text variant="bodyMedium" style={styles.viewInstructionText}>
                      {instruction}
                    </Text>
                  </View>
                ))}

                {selectedRecipe.notes && (
                  <>
                    <Divider style={styles.divider} />
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Notes
                    </Text>
                    <Text variant="bodyMedium">{selectedRecipe.notes}</Text>
                  </>
                )}

                {selectedRecipe.tags.length > 0 && (
                  <>
                    <Divider style={styles.divider} />
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Tags
                    </Text>
                    <View style={styles.viewTags}>
                      {selectedRecipe.tags.map((tag, index) => (
                        <Chip key={index} style={styles.viewTagChip}>
                          {tag}
                        </Chip>
                      ))}
                    </View>
                  </>
                )}

                {selectedRecipe.source && (
                  <>
                    <Divider style={styles.divider} />
                    <Text variant="labelMedium" style={styles.sourceLabel}>
                      Source: {selectedRecipe.source}
                    </Text>
                  </>
                )}

                <Button
                  mode="contained"
                  onPress={() => setViewModalVisible(false)}
                  style={styles.closeButton}
                >
                  Close
                </Button>
              </ScrollView>
            )}
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
  viewToggle: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
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
  recipeCard: {
    marginBottom: 12,
    elevation: 2,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recipeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recipeHeaderText: {
    flex: 1,
  },
  recipeTitle: {
    fontWeight: 'bold',
  },
  recipeCuisine: {
    color: '#666',
    marginTop: 2,
  },
  recipeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  difficultyChip: {
    height: 28,
  },
  detailChip: {
    backgroundColor: '#e3f2fd',
    height: 28,
  },
  ratingChip: {
    backgroundColor: '#fff3e0',
    height: 28,
  },
  chipText: {
    fontSize: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  tagChip: {
    backgroundColor: '#f3e5f5',
    height: 24,
  },
  tagText: {
    fontSize: 11,
  },
  moreTags: {
    color: '#999',
    fontSize: 11,
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
    textAlign: 'center',
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
    gap: 8,
  },
  thirdInput: {
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
  difficultyButtons: {
    marginBottom: 12,
  },
  divider: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ingredientName: {
    flex: 3,
  },
  ingredientAmount: {
    flex: 1,
  },
  ingredientUnit: {
    flex: 1,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  instructionNumber: {
    marginTop: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  instructionInput: {
    flex: 1,
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
  viewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  viewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  viewTitle: {
    fontWeight: 'bold',
    flex: 1,
  },
  viewActions: {
    flexDirection: 'row',
  },
  viewCuisine: {
    color: '#666',
    marginBottom: 12,
  },
  viewDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  viewDifficultyChip: {
    height: 32,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLabel: {
    marginRight: 8,
  },
  ratingStars: {
    flexDirection: 'row',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  viewIngredient: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: 8,
  },
  viewInstruction: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  viewInstructionNumber: {
    fontWeight: 'bold',
    color: '#6200ee',
    marginRight: 12,
    minWidth: 24,
  },
  viewInstructionText: {
    flex: 1,
  },
  viewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  viewTagChip: {
    backgroundColor: '#f3e5f5',
  },
  sourceLabel: {
    color: '#999',
    fontStyle: 'italic',
  },
  closeButton: {
    marginTop: 24,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#6200ee',
  },
});
