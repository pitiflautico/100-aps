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
interface MealPlan {
  id: string;
  weekStartDate: string;
  meals: { [key: string]: DayMeals };
  createdAt: number;
}

interface DayMeals {
  breakfast: Meal | null;
  lunch: Meal | null;
  dinner: Meal | null;
  snacks: Meal[];
}

interface Meal {
  id: string;
  name: string;
  recipe?: string;
  servings: number;
  prepTime: number;
  calories: number;
  notes: string;
  ingredients: string[];
}

interface ShoppingListItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
}

// AdMob Configuration
const bannerId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';
const interstitialId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';

const interstitial = InterstitialAd.createForAdRequest(interstitialId);

const STORAGE_KEY = '@meal_planner_plans';
const RECIPES_KEY = '@meal_planner_recipes';
const SHOPPING_LIST_KEY = '@meal_planner_shopping';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function App() {
  const [currentPlan, setCurrentPlan] = useState<MealPlan | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Meal[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [modalVisible, setModalVisible] = useState(false);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [shoppingModalVisible, setShoppingModalVisible] = useState(false);
  const [currentView, setCurrentView] = useState<'planner' | 'shopping' | 'recipes'>('planner');
  const [menuVisible, setMenuVisible] = useState(false);
  const [interstitialLoaded, setInterstitialLoaded] = useState(false);

  // Form state
  const [mealForm, setMealForm] = useState({
    name: '',
    recipe: '',
    servings: '4',
    prepTime: '30',
    calories: '',
    notes: '',
    ingredients: '',
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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansData, recipesData, shoppingData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(RECIPES_KEY),
        AsyncStorage.getItem(SHOPPING_LIST_KEY),
      ]);

      if (plansData) {
        const plans = JSON.parse(plansData);
        if (plans.length > 0) {
          setCurrentPlan(plans[0]);
        } else {
          createNewWeekPlan();
        }
      } else {
        createNewWeekPlan();
      }

      if (recipesData) {
        setSavedRecipes(JSON.parse(recipesData));
      }

      if (shoppingData) {
        setShoppingList(JSON.parse(shoppingData));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      createNewWeekPlan();
    }
  };

  const createNewWeekPlan = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

    const emptyDayMeals: DayMeals = {
      breakfast: null,
      lunch: null,
      dinner: null,
      snacks: [],
    };

    const meals: { [key: string]: DayMeals } = {};
    DAYS_OF_WEEK.forEach(day => {
      meals[day] = { ...emptyDayMeals, snacks: [] };
    });

    const newPlan: MealPlan = {
      id: Date.now().toString(),
      weekStartDate: monday.toISOString().split('T')[0],
      meals,
      createdAt: Date.now(),
    };

    setCurrentPlan(newPlan);
    savePlan(newPlan);
  };

  const savePlan = async (plan: MealPlan) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([plan]));
      setCurrentPlan(plan);
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };

  const saveRecipes = async (recipes: Meal[]) => {
    try {
      await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
      setSavedRecipes(recipes);
    } catch (error) {
      console.error('Error saving recipes:', error);
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

  const openMealModal = (day: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    setSelectedDay(day);
    setSelectedMealType(mealType);
    setMealForm({
      name: '',
      recipe: '',
      servings: '4',
      prepTime: '30',
      calories: '',
      notes: '',
      ingredients: '',
    });
    setModalVisible(true);
  };

  const addMealToPlan = async () => {
    if (!currentPlan || !mealForm.name.trim()) {
      Alert.alert('Error', 'Please enter meal name');
      return;
    }

    const meal: Meal = {
      id: Date.now().toString(),
      name: mealForm.name.trim(),
      recipe: mealForm.recipe.trim(),
      servings: parseInt(mealForm.servings) || 4,
      prepTime: parseInt(mealForm.prepTime) || 0,
      calories: parseInt(mealForm.calories) || 0,
      notes: mealForm.notes.trim(),
      ingredients: mealForm.ingredients
        .split('\n')
        .map(i => i.trim())
        .filter(i => i.length > 0),
    };

    const updatedPlan = { ...currentPlan };
    if (selectedMealType === 'snack') {
      updatedPlan.meals[selectedDay].snacks.push(meal);
    } else {
      updatedPlan.meals[selectedDay][selectedMealType] = meal;
    }

    await savePlan(updatedPlan);
    setModalVisible(false);

    if (interstitialLoaded && Math.random() > 0.7) {
      interstitial.show();
    }
  };

  const removeMealFromPlan = async (day: string, mealType: 'breakfast' | 'lunch' | 'dinner', snackIndex?: number) => {
    if (!currentPlan) return;

    Alert.alert('Remove Meal', 'Are you sure you want to remove this meal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const updatedPlan = { ...currentPlan };
          if (mealType === 'breakfast' || mealType === 'lunch' || mealType === 'dinner') {
            updatedPlan.meals[day][mealType] = null;
          } else if (snackIndex !== undefined) {
            updatedPlan.meals[day].snacks.splice(snackIndex, 1);
          }
          await savePlan(updatedPlan);
        },
      },
    ]);
  };

  const saveRecipe = async () => {
    if (!mealForm.name.trim()) {
      Alert.alert('Error', 'Please enter recipe name');
      return;
    }

    const recipe: Meal = {
      id: Date.now().toString(),
      name: mealForm.name.trim(),
      recipe: mealForm.recipe.trim(),
      servings: parseInt(mealForm.servings) || 4,
      prepTime: parseInt(mealForm.prepTime) || 0,
      calories: parseInt(mealForm.calories) || 0,
      notes: mealForm.notes.trim(),
      ingredients: mealForm.ingredients
        .split('\n')
        .map(i => i.trim())
        .filter(i => i.length > 0),
    };

    const newRecipes = [...savedRecipes, recipe];
    await saveRecipes(newRecipes);
    setRecipeModalVisible(false);

    setMealForm({
      name: '',
      recipe: '',
      servings: '4',
      prepTime: '30',
      calories: '',
      notes: '',
      ingredients: '',
    });
  };

  const deleteRecipe = async (id: string) => {
    Alert.alert('Delete Recipe', 'Are you sure you want to delete this recipe?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const newRecipes = savedRecipes.filter(r => r.id !== id);
          await saveRecipes(newRecipes);
        },
      },
    ]);
  };

  const addRecipeToMeal = async (recipe: Meal, day: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    if (!currentPlan) return;

    const updatedPlan = { ...currentPlan };
    if (mealType === 'snack') {
      updatedPlan.meals[day].snacks.push({ ...recipe, id: Date.now().toString() });
    } else {
      updatedPlan.meals[day][mealType] = { ...recipe, id: Date.now().toString() };
    }

    await savePlan(updatedPlan);
  };

  const generateShoppingList = () => {
    if (!currentPlan) return;

    const allIngredients: { [key: string]: number } = {};

    DAYS_OF_WEEK.forEach(day => {
      const dayMeals = currentPlan.meals[day];
      [dayMeals.breakfast, dayMeals.lunch, dayMeals.dinner, ...dayMeals.snacks].forEach(meal => {
        if (meal && meal.ingredients) {
          meal.ingredients.forEach(ingredient => {
            allIngredients[ingredient] = (allIngredients[ingredient] || 0) + 1;
          });
        }
      });
    });

    const newList: ShoppingListItem[] = Object.entries(allIngredients).map(([name, count]) => ({
      id: Date.now().toString() + Math.random(),
      name,
      quantity: count > 1 ? `${count}x` : '1x',
      category: 'Groceries',
      checked: false,
    }));

    saveShoppingList(newList);
    setCurrentView('shopping');
    Alert.alert('Success', `Generated shopping list with ${newList.length} items`);
  };

  const toggleShoppingItem = async (id: string) => {
    const newList = shoppingList.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    await saveShoppingList(newList);
  };

  const clearCheckedItems = () => {
    const checkedCount = shoppingList.filter(item => item.checked).length;
    if (checkedCount === 0) {
      Alert.alert('No Items', 'No checked items to clear.');
      return;
    }

    Alert.alert('Clear Checked Items', `Remove ${checkedCount} checked item(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        onPress: async () => {
          const newList = shoppingList.filter(item => !item.checked);
          await saveShoppingList(newList);
        },
      },
    ]);
  };

  const renderMealCard = (meal: Meal | null, day: string, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    if (!meal) {
      return (
        <Card style={styles.emptyMealCard} onPress={() => openMealModal(day, mealType)}>
          <Card.Content style={styles.emptyMealContent}>
            <IconButton icon="plus" size={24} iconColor="#999" />
            <Text variant="bodyMedium" style={styles.emptyMealText}>
              Add {mealType}
            </Text>
          </Card.Content>
        </Card>
      );
    }

    return (
      <Card style={styles.mealCard}>
        <Card.Content>
          <View style={styles.mealHeader}>
            <Text variant="titleMedium" style={styles.mealName}>
              {meal.name}
            </Text>
            <IconButton
              icon="close"
              size={20}
              onPress={() => removeMealFromPlan(day, mealType)}
            />
          </View>

          <View style={styles.mealDetails}>
            {meal.servings > 0 && (
              <Chip icon="account-multiple" style={styles.mealChip}>
                {meal.servings} servings
              </Chip>
            )}
            {meal.prepTime > 0 && (
              <Chip icon="clock" style={styles.mealChip}>
                {meal.prepTime} min
              </Chip>
            )}
            {meal.calories > 0 && (
              <Chip icon="fire" style={styles.mealChip}>
                {meal.calories} cal
              </Chip>
            )}
          </View>

          {meal.notes && (
            <Text variant="bodySmall" style={styles.mealNotes}>
              {meal.notes}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="Meal Planner" />
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
                createNewWeekPlan();
              }}
              title="New Week Plan"
              leadingIcon="calendar-refresh"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                generateShoppingList();
              }}
              title="Generate Shopping List"
              leadingIcon="cart-plus"
            />
            {currentView === 'shopping' && (
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  clearCheckedItems();
                }}
                title="Clear Checked Items"
                leadingIcon="check-all"
              />
            )}
          </Menu>
        </Appbar.Header>

        {/* View Tabs */}
        <SegmentedButtons
          value={currentView}
          onValueChange={value => setCurrentView(value as any)}
          buttons={[
            { value: 'planner', label: 'Planner', icon: 'calendar-month' },
            { value: 'recipes', label: `Recipes (${savedRecipes.length})`, icon: 'book-open' },
            { value: 'shopping', label: `Shopping (${shoppingList.length})`, icon: 'cart' },
          ]}
          style={styles.segmentedButtons}
        />

        {currentView === 'planner' && currentPlan && (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <Card style={styles.weekCard}>
              <Card.Content>
                <Text variant="titleMedium">
                  Week of {new Date(currentPlan.weekStartDate).toLocaleDateString()}
                </Text>
              </Card.Content>
            </Card>

            {DAYS_OF_WEEK.map(day => (
              <Card key={day} style={styles.dayCard}>
                <Card.Content>
                  <Text variant="titleLarge" style={styles.dayTitle}>
                    {day}
                  </Text>

                  <Text variant="labelMedium" style={styles.mealTypeLabel}>
                    Breakfast
                  </Text>
                  {renderMealCard(currentPlan.meals[day].breakfast, day, 'breakfast')}

                  <Text variant="labelMedium" style={styles.mealTypeLabel}>
                    Lunch
                  </Text>
                  {renderMealCard(currentPlan.meals[day].lunch, day, 'lunch')}

                  <Text variant="labelMedium" style={styles.mealTypeLabel}>
                    Dinner
                  </Text>
                  {renderMealCard(currentPlan.meals[day].dinner, day, 'dinner')}

                  {currentPlan.meals[day].snacks.length > 0 && (
                    <>
                      <Text variant="labelMedium" style={styles.mealTypeLabel}>
                        Snacks
                      </Text>
                      {currentPlan.meals[day].snacks.map((snack, index) => (
                        <Card key={snack.id} style={styles.mealCard}>
                          <Card.Content>
                            <View style={styles.mealHeader}>
                              <Text variant="titleSmall">{snack.name}</Text>
                              <IconButton
                                icon="close"
                                size={20}
                                onPress={() => {
                                  const updatedPlan = { ...currentPlan };
                                  updatedPlan.meals[day].snacks.splice(index, 1);
                                  savePlan(updatedPlan);
                                }}
                              />
                            </View>
                          </Card.Content>
                        </Card>
                      ))}
                    </>
                  )}

                  <Button
                    mode="outlined"
                    onPress={() => openMealModal(day, 'snack')}
                    style={styles.addSnackButton}
                    icon="plus"
                  >
                    Add Snack
                  </Button>
                </Card.Content>
              </Card>
            ))}

            <View style={styles.adContainer}>
              <BannerAd unitId={bannerId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
            </View>
          </ScrollView>
        )}

        {currentView === 'recipes' && (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <Button
              mode="contained"
              onPress={() => setRecipeModalVisible(true)}
              style={styles.addButton}
              icon="plus"
            >
              Add Recipe
            </Button>

            {savedRecipes.length === 0 ? (
              <View style={styles.emptyState}>
                <IconButton icon="book-open-outline" size={64} iconColor="#ccc" />
                <Text variant="titleMedium" style={styles.emptyText}>
                  No saved recipes
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  Add your favorite recipes to reuse them in your meal plans
                </Text>
              </View>
            ) : (
              savedRecipes.map(recipe => (
                <Card key={recipe.id} style={styles.recipeCard}>
                  <Card.Content>
                    <View style={styles.recipeHeader}>
                      <Text variant="titleMedium" style={styles.recipeName}>
                        {recipe.name}
                      </Text>
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#d32f2f"
                        onPress={() => deleteRecipe(recipe.id)}
                      />
                    </View>

                    <View style={styles.recipeDetails}>
                      {recipe.servings > 0 && (
                        <Chip icon="account-multiple" style={styles.recipeChip}>
                          {recipe.servings} servings
                        </Chip>
                      )}
                      {recipe.prepTime > 0 && (
                        <Chip icon="clock" style={styles.recipeChip}>
                          {recipe.prepTime} min
                        </Chip>
                      )}
                      {recipe.calories > 0 && (
                        <Chip icon="fire" style={styles.recipeChip}>
                          {recipe.calories} cal
                        </Chip>
                      )}
                    </View>

                    {recipe.ingredients.length > 0 && (
                      <View style={styles.ingredientsSection}>
                        <Text variant="labelMedium" style={styles.ingredientsLabel}>
                          Ingredients ({recipe.ingredients.length}):
                        </Text>
                        {recipe.ingredients.slice(0, 3).map((ing, index) => (
                          <Text key={index} variant="bodySmall" style={styles.ingredientItem}>
                            • {ing}
                          </Text>
                        ))}
                        {recipe.ingredients.length > 3 && (
                          <Text variant="bodySmall" style={styles.moreIngredients}>
                            +{recipe.ingredients.length - 3} more...
                          </Text>
                        )}
                      </View>
                    )}

                    {recipe.recipe && (
                      <Text variant="bodySmall" style={styles.recipeInstructions} numberOfLines={2}>
                        {recipe.recipe}
                      </Text>
                    )}
                  </Card.Content>
                </Card>
              ))
            )}

            <View style={styles.adContainer}>
              <BannerAd unitId={bannerId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
            </View>
          </ScrollView>
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
                  Generate a shopping list from your meal plan
                </Text>
                <Button
                  mode="contained"
                  onPress={generateShoppingList}
                  style={styles.generateButton}
                  icon="cart-plus"
                >
                  Generate List
                </Button>
              </View>
            ) : (
              <>
                <Card style={styles.shoppingStatsCard}>
                  <Card.Content>
                    <Text variant="bodyLarge">
                      {shoppingList.filter(i => i.checked).length} / {shoppingList.length} items checked
                    </Text>
                  </Card.Content>
                </Card>

                {shoppingList.map(item => (
                  <Card key={item.id} style={styles.shoppingCard}>
                    <Card.Content>
                      <View style={styles.shoppingItemRow}>
                        <IconButton
                          icon={item.checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                          size={24}
                          iconColor={item.checked ? '#388e3c' : '#666'}
                          onPress={() => toggleShoppingItem(item.id)}
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
                            {item.quantity}
                          </Text>
                        </View>
                        <IconButton
                          icon="close"
                          size={20}
                          onPress={() => {
                            const newList = shoppingList.filter(i => i.id !== item.id);
                            saveShoppingList(newList);
                          }}
                        />
                      </View>
                    </Card.Content>
                  </Card>
                ))}

                <View style={styles.adContainer}>
                  <BannerAd unitId={bannerId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
                </View>
              </>
            )}
          </ScrollView>
        )}

        {/* Add Meal Modal */}
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={() => setModalVisible(false)}
            contentContainerStyle={styles.modal}
          >
            <ScrollView>
              <Text variant="titleLarge" style={styles.modalTitle}>
                Add {selectedMealType} for {selectedDay}
              </Text>

              <TextInput
                label="Meal Name *"
                value={mealForm.name}
                onChangeText={text => setMealForm({ ...mealForm, name: text })}
                style={styles.input}
                mode="outlined"
              />

              <View style={styles.row}>
                <TextInput
                  label="Servings"
                  value={mealForm.servings}
                  onChangeText={text => setMealForm({ ...mealForm, servings: text })}
                  style={[styles.input, styles.thirdInput]}
                  mode="outlined"
                  keyboardType="numeric"
                />
                <TextInput
                  label="Prep Time (min)"
                  value={mealForm.prepTime}
                  onChangeText={text => setMealForm({ ...mealForm, prepTime: text })}
                  style={[styles.input, styles.thirdInput]}
                  mode="outlined"
                  keyboardType="numeric"
                />
                <TextInput
                  label="Calories"
                  value={mealForm.calories}
                  onChangeText={text => setMealForm({ ...mealForm, calories: text })}
                  style={[styles.input, styles.thirdInput]}
                  mode="outlined"
                  keyboardType="numeric"
                />
              </View>

              <TextInput
                label="Ingredients (one per line)"
                value={mealForm.ingredients}
                onChangeText={text => setMealForm({ ...mealForm, ingredients: text })}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={5}
                placeholder="e.g.,&#10;2 cups rice&#10;1 lb chicken&#10;1 onion"
              />

              <TextInput
                label="Recipe/Instructions"
                value={mealForm.recipe}
                onChangeText={text => setMealForm({ ...mealForm, recipe: text })}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={4}
              />

              <TextInput
                label="Notes"
                value={mealForm.notes}
                onChangeText={text => setMealForm({ ...mealForm, notes: text })}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={2}
              />

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setModalVisible(false)}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button mode="contained" onPress={addMealToPlan} style={styles.modalButton}>
                  Add Meal
                </Button>
              </View>
            </ScrollView>
          </Modal>

          {/* Recipe Modal */}
          <Modal
            visible={recipeModalVisible}
            onDismiss={() => setRecipeModalVisible(false)}
            contentContainerStyle={styles.modal}
          >
            <ScrollView>
              <Text variant="titleLarge" style={styles.modalTitle}>
                Save Recipe
              </Text>

              <TextInput
                label="Recipe Name *"
                value={mealForm.name}
                onChangeText={text => setMealForm({ ...mealForm, name: text })}
                style={styles.input}
                mode="outlined"
              />

              <View style={styles.row}>
                <TextInput
                  label="Servings"
                  value={mealForm.servings}
                  onChangeText={text => setMealForm({ ...mealForm, servings: text })}
                  style={[styles.input, styles.thirdInput]}
                  mode="outlined"
                  keyboardType="numeric"
                />
                <TextInput
                  label="Prep Time (min)"
                  value={mealForm.prepTime}
                  onChangeText={text => setMealForm({ ...mealForm, prepTime: text })}
                  style={[styles.input, styles.thirdInput]}
                  mode="outlined"
                  keyboardType="numeric"
                />
                <TextInput
                  label="Calories"
                  value={mealForm.calories}
                  onChangeText={text => setMealForm({ ...mealForm, calories: text })}
                  style={[styles.input, styles.thirdInput]}
                  mode="outlined"
                  keyboardType="numeric"
                />
              </View>

              <TextInput
                label="Ingredients (one per line)"
                value={mealForm.ingredients}
                onChangeText={text => setMealForm({ ...mealForm, ingredients: text })}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={5}
              />

              <TextInput
                label="Recipe/Instructions"
                value={mealForm.recipe}
                onChangeText={text => setMealForm({ ...mealForm, recipe: text })}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={6}
              />

              <TextInput
                label="Notes"
                value={mealForm.notes}
                onChangeText={text => setMealForm({ ...mealForm, notes: text })}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={2}
              />

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setRecipeModalVisible(false)}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button mode="contained" onPress={saveRecipe} style={styles.modalButton}>
                  Save Recipe
                </Button>
              </View>
            </ScrollView>
          </Modal>
        </Portal>

        {currentView === 'planner' && (
          <FAB icon="calendar-plus" style={styles.fab} onPress={() => {}} />
        )}
        {currentView === 'recipes' && (
          <FAB icon="plus" style={styles.fab} onPress={() => setRecipeModalVisible(true)} />
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
  segmentedButtons: {
    margin: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  weekCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#6200ee',
  },
  dayCard: {
    marginBottom: 16,
    elevation: 2,
  },
  dayTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#6200ee',
  },
  mealTypeLabel: {
    marginTop: 12,
    marginBottom: 8,
    color: '#666',
    textTransform: 'uppercase',
  },
  emptyMealCard: {
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  emptyMealContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  emptyMealText: {
    color: '#999',
  },
  mealCard: {
    marginBottom: 8,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealName: {
    fontWeight: 'bold',
    flex: 1,
  },
  mealDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  mealChip: {
    backgroundColor: '#e3f2fd',
    height: 28,
  },
  mealNotes: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  addSnackButton: {
    marginTop: 12,
  },
  addButton: {
    marginBottom: 16,
  },
  recipeCard: {
    marginBottom: 12,
    elevation: 2,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipeName: {
    fontWeight: 'bold',
    flex: 1,
  },
  recipeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  recipeChip: {
    backgroundColor: '#e3f2fd',
    height: 28,
  },
  ingredientsSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  ingredientsLabel: {
    marginBottom: 4,
    color: '#666',
  },
  ingredientItem: {
    color: '#666',
    marginLeft: 8,
  },
  moreIngredients: {
    color: '#999',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  recipeInstructions: {
    color: '#666',
    marginTop: 8,
  },
  shoppingStatsCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#e8f5e9',
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
    textAlign: 'center',
  },
  generateButton: {
    marginTop: 24,
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
