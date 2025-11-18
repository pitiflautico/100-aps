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
} from 'react-native-google-mobile-ads';

// TypeScript Interfaces
interface Cocktail {
  id: string;
  name: string;
  category: 'classic' | 'tropical' | 'creamy' | 'martini' | 'shot' | 'other';
  glassType: 'martini' | 'highball' | 'rocks' | 'shot' | 'coupe' | 'hurricane' | 'other';
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: CocktailIngredient[];
  instructions: string[];
  garnish: string;
  favorite: boolean;
}

interface CocktailIngredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
}

// AdMob Configuration
const bannerId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';

const STORAGE_KEY = '@cocktail_recipes_data';

const CATEGORIES = [
  { label: 'All', value: 'all', icon: 'glass-cocktail', color: '#6200ee' },
  { label: 'Classic', value: 'classic', icon: 'glass-wine', color: '#2196F3' },
  { label: 'Tropical', value: 'tropical', icon: 'palm-tree', color: '#4CAF50' },
  { label: 'Creamy', value: 'creamy', icon: 'glass-mug-variant', color: '#FF9800' },
  { label: 'Martini', value: 'martini', icon: 'glass-cocktail', color: '#9C27B0' },
  { label: 'Shot', value: 'shot', icon: 'cup', color: '#F44336' },
  { label: 'Other', value: 'other', icon: 'dots-horizontal', color: '#607D8B' },
];

const GLASS_TYPES = [
  { label: 'Martini', value: 'martini', icon: 'glass-cocktail' },
  { label: 'Highball', value: 'highball', icon: 'glass-tulip' },
  { label: 'Rocks', value: 'rocks', icon: 'glass-pint-outline' },
  { label: 'Shot', value: 'shot', icon: 'cup' },
  { label: 'Coupe', value: 'coupe', icon: 'glass-wine' },
  { label: 'Hurricane', value: 'hurricane', icon: 'glass-flute' },
  { label: 'Other', value: 'other', icon: 'glass-mug' },
];

const DIFFICULTIES = [
  { label: 'Easy', value: 'easy', color: '#4CAF50' },
  { label: 'Medium', value: 'medium', color: '#FF9800' },
  { label: 'Hard', value: 'hard', color: '#F44336' },
];

// Predefined Cocktails Database (30+ recipes)
const PREDEFINED_COCKTAILS: Cocktail[] = [
  {
    id: 'cocktail-1',
    name: 'Mojito',
    category: 'classic',
    glassType: 'highball',
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'White Rum', amount: '2', unit: 'oz' },
      { id: '2', name: 'Fresh Lime Juice', amount: '1', unit: 'oz' },
      { id: '3', name: 'Sugar', amount: '2', unit: 'tsp' },
      { id: '4', name: 'Mint Leaves', amount: '6-8', unit: 'leaves' },
      { id: '5', name: 'Soda Water', amount: 'Top', unit: '' },
    ],
    instructions: [
      'Muddle mint leaves and sugar in glass',
      'Add lime juice and rum',
      'Fill glass with ice',
      'Top with soda water',
      'Stir gently',
    ],
    garnish: 'Mint sprig and lime wheel',
    favorite: false,
  },
  {
    id: 'cocktail-2',
    name: 'Margarita',
    category: 'classic',
    glassType: 'rocks',
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'Tequila', amount: '2', unit: 'oz' },
      { id: '2', name: 'Triple Sec', amount: '1', unit: 'oz' },
      { id: '3', name: 'Fresh Lime Juice', amount: '1', unit: 'oz' },
      { id: '4', name: 'Salt', amount: 'For rim', unit: '' },
    ],
    instructions: [
      'Rim glass with salt',
      'Add all ingredients to shaker with ice',
      'Shake well',
      'Strain into glass over fresh ice',
    ],
    garnish: 'Lime wheel',
    favorite: false,
  },
  {
    id: 'cocktail-3',
    name: 'Pina Colada',
    category: 'tropical',
    glassType: 'hurricane',
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'White Rum', amount: '2', unit: 'oz' },
      { id: '2', name: 'Coconut Cream', amount: '1.5', unit: 'oz' },
      { id: '3', name: 'Pineapple Juice', amount: '3', unit: 'oz' },
      { id: '4', name: 'Ice', amount: '1', unit: 'cup' },
    ],
    instructions: [
      'Add all ingredients to blender',
      'Blend until smooth',
      'Pour into glass',
    ],
    garnish: 'Pineapple wedge and cherry',
    favorite: false,
  },
  {
    id: 'cocktail-4',
    name: 'Old Fashioned',
    category: 'classic',
    glassType: 'rocks',
    difficulty: 'medium',
    ingredients: [
      { id: '1', name: 'Bourbon', amount: '2', unit: 'oz' },
      { id: '2', name: 'Sugar Cube', amount: '1', unit: '' },
      { id: '3', name: 'Angostura Bitters', amount: '2', unit: 'dashes' },
      { id: '4', name: 'Water', amount: '1', unit: 'tsp' },
    ],
    instructions: [
      'Muddle sugar cube with water and bitters',
      'Add bourbon',
      'Add large ice cube',
      'Stir gently',
    ],
    garnish: 'Orange peel and cherry',
    favorite: false,
  },
  {
    id: 'cocktail-5',
    name: 'Cosmopolitan',
    category: 'martini',
    glassType: 'martini',
    difficulty: 'medium',
    ingredients: [
      { id: '1', name: 'Vodka', amount: '1.5', unit: 'oz' },
      { id: '2', name: 'Cointreau', amount: '1', unit: 'oz' },
      { id: '3', name: 'Cranberry Juice', amount: '0.5', unit: 'oz' },
      { id: '4', name: 'Fresh Lime Juice', amount: '0.5', unit: 'oz' },
    ],
    instructions: [
      'Add all ingredients to shaker with ice',
      'Shake vigorously',
      'Strain into chilled martini glass',
    ],
    garnish: 'Lime wheel or twist',
    favorite: false,
  },
  {
    id: 'cocktail-6',
    name: 'Mai Tai',
    category: 'tropical',
    glassType: 'rocks',
    difficulty: 'medium',
    ingredients: [
      { id: '1', name: 'White Rum', amount: '1', unit: 'oz' },
      { id: '2', name: 'Dark Rum', amount: '1', unit: 'oz' },
      { id: '3', name: 'Orange Curacao', amount: '0.5', unit: 'oz' },
      { id: '4', name: 'Orgeat Syrup', amount: '0.5', unit: 'oz' },
      { id: '5', name: 'Fresh Lime Juice', amount: '1', unit: 'oz' },
    ],
    instructions: [
      'Add all ingredients except dark rum to shaker with ice',
      'Shake well',
      'Strain into glass filled with ice',
      'Float dark rum on top',
    ],
    garnish: 'Mint sprig and lime wheel',
    favorite: false,
  },
  {
    id: 'cocktail-7',
    name: 'White Russian',
    category: 'creamy',
    glassType: 'rocks',
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'Vodka', amount: '2', unit: 'oz' },
      { id: '2', name: 'Coffee Liqueur', amount: '1', unit: 'oz' },
      { id: '3', name: 'Heavy Cream', amount: '1', unit: 'oz' },
    ],
    instructions: [
      'Fill glass with ice',
      'Add vodka and coffee liqueur',
      'Float cream on top',
      'Stir gently before drinking',
    ],
    garnish: 'None',
    favorite: false,
  },
  {
    id: 'cocktail-8',
    name: 'Manhattan',
    category: 'classic',
    glassType: 'martini',
    difficulty: 'medium',
    ingredients: [
      { id: '1', name: 'Rye Whiskey', amount: '2', unit: 'oz' },
      { id: '2', name: 'Sweet Vermouth', amount: '1', unit: 'oz' },
      { id: '3', name: 'Angostura Bitters', amount: '2', unit: 'dashes' },
    ],
    instructions: [
      'Add all ingredients to mixing glass with ice',
      'Stir for 30 seconds',
      'Strain into chilled martini glass',
    ],
    garnish: 'Maraschino cherry',
    favorite: false,
  },
  {
    id: 'cocktail-9',
    name: 'Daiquiri',
    category: 'classic',
    glassType: 'coupe',
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'White Rum', amount: '2', unit: 'oz' },
      { id: '2', name: 'Fresh Lime Juice', amount: '1', unit: 'oz' },
      { id: '3', name: 'Simple Syrup', amount: '0.5', unit: 'oz' },
    ],
    instructions: [
      'Add all ingredients to shaker with ice',
      'Shake vigorously',
      'Strain into chilled coupe glass',
    ],
    garnish: 'Lime wheel',
    favorite: false,
  },
  {
    id: 'cocktail-10',
    name: 'Espresso Martini',
    category: 'martini',
    glassType: 'martini',
    difficulty: 'medium',
    ingredients: [
      { id: '1', name: 'Vodka', amount: '2', unit: 'oz' },
      { id: '2', name: 'Coffee Liqueur', amount: '0.5', unit: 'oz' },
      { id: '3', name: 'Espresso', amount: '1', unit: 'oz' },
      { id: '4', name: 'Simple Syrup', amount: '0.5', unit: 'oz' },
    ],
    instructions: [
      'Brew fresh espresso and let cool slightly',
      'Add all ingredients to shaker with ice',
      'Shake vigorously for 15 seconds',
      'Strain into chilled martini glass',
    ],
    garnish: 'Coffee beans',
    favorite: false,
  },
  {
    id: 'cocktail-11',
    name: 'Tequila Sunrise',
    category: 'tropical',
    glassType: 'highball',
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'Tequila', amount: '2', unit: 'oz' },
      { id: '2', name: 'Orange Juice', amount: '4', unit: 'oz' },
      { id: '3', name: 'Grenadine', amount: '0.5', unit: 'oz' },
    ],
    instructions: [
      'Fill glass with ice',
      'Add tequila and orange juice',
      'Stir gently',
      'Slowly pour grenadine down side of glass',
    ],
    garnish: 'Orange slice and cherry',
    favorite: false,
  },
  {
    id: 'cocktail-12',
    name: 'Bloody Mary',
    category: 'other',
    glassType: 'highball',
    difficulty: 'medium',
    ingredients: [
      { id: '1', name: 'Vodka', amount: '2', unit: 'oz' },
      { id: '2', name: 'Tomato Juice', amount: '4', unit: 'oz' },
      { id: '3', name: 'Lemon Juice', amount: '0.5', unit: 'oz' },
      { id: '4', name: 'Worcestershire Sauce', amount: '2', unit: 'dashes' },
      { id: '5', name: 'Hot Sauce', amount: '2', unit: 'dashes' },
      { id: '6', name: 'Salt and Pepper', amount: 'To taste', unit: '' },
    ],
    instructions: [
      'Fill glass with ice',
      'Add all ingredients',
      'Stir well',
      'Adjust seasoning to taste',
    ],
    garnish: 'Celery stalk, lemon wedge, olives',
    favorite: false,
  },
  {
    id: 'cocktail-13',
    name: 'Long Island Iced Tea',
    category: 'other',
    glassType: 'highball',
    difficulty: 'hard',
    ingredients: [
      { id: '1', name: 'Vodka', amount: '0.5', unit: 'oz' },
      { id: '2', name: 'Tequila', amount: '0.5', unit: 'oz' },
      { id: '3', name: 'Rum', amount: '0.5', unit: 'oz' },
      { id: '4', name: 'Gin', amount: '0.5', unit: 'oz' },
      { id: '5', name: 'Triple Sec', amount: '0.5', unit: 'oz' },
      { id: '6', name: 'Lemon Juice', amount: '1', unit: 'oz' },
      { id: '7', name: 'Simple Syrup', amount: '0.5', unit: 'oz' },
      { id: '8', name: 'Cola', amount: 'Splash', unit: '' },
    ],
    instructions: [
      'Add all ingredients except cola to shaker with ice',
      'Shake well',
      'Strain into glass filled with ice',
      'Top with splash of cola',
    ],
    garnish: 'Lemon wedge',
    favorite: false,
  },
  {
    id: 'cocktail-14',
    name: 'Whiskey Sour',
    category: 'classic',
    glassType: 'rocks',
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'Bourbon', amount: '2', unit: 'oz' },
      { id: '2', name: 'Fresh Lemon Juice', amount: '1', unit: 'oz' },
      { id: '3', name: 'Simple Syrup', amount: '0.75', unit: 'oz' },
      { id: '4', name: 'Egg White', amount: '1', unit: 'optional' },
    ],
    instructions: [
      'Add all ingredients to shaker',
      'Dry shake (without ice) if using egg white',
      'Add ice and shake vigorously',
      'Strain into glass with fresh ice',
    ],
    garnish: 'Cherry and orange slice',
    favorite: false,
  },
  {
    id: 'cocktail-15',
    name: 'Negroni',
    category: 'classic',
    glassType: 'rocks',
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'Gin', amount: '1', unit: 'oz' },
      { id: '2', name: 'Campari', amount: '1', unit: 'oz' },
      { id: '3', name: 'Sweet Vermouth', amount: '1', unit: 'oz' },
    ],
    instructions: [
      'Add all ingredients to glass with ice',
      'Stir well',
    ],
    garnish: 'Orange peel',
    favorite: false,
  },
  {
    id: 'cocktail-16',
    name: 'Moscow Mule',
    category: 'classic',
    glassType: 'highball',
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'Vodka', amount: '2', unit: 'oz' },
      { id: '2', name: 'Fresh Lime Juice', amount: '0.5', unit: 'oz' },
      { id: '3', name: 'Ginger Beer', amount: '4', unit: 'oz' },
    ],
    instructions: [
      'Fill glass with ice',
      'Add vodka and lime juice',
      'Top with ginger beer',
      'Stir gently',
    ],
    garnish: 'Lime wedge and mint',
    favorite: false,
  },
  {
    id: 'cocktail-17',
    name: 'Caipirinha',
    category: 'tropical',
    glassType: 'rocks',
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'Cachaça', amount: '2', unit: 'oz' },
      { id: '2', name: 'Lime', amount: '1', unit: 'whole' },
      { id: '3', name: 'Sugar', amount: '2', unit: 'tsp' },
    ],
    instructions: [
      'Cut lime into wedges',
      'Muddle lime and sugar in glass',
      'Fill with crushed ice',
      'Add cachaça',
      'Stir well',
    ],
    garnish: 'None',
    favorite: false,
  },
  {
    id: 'cocktail-18',
    name: 'Aperol Spritz',
    category: 'other',
    glassType: 'highball',
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'Aperol', amount: '3', unit: 'oz' },
      { id: '2', name: 'Prosecco', amount: '2', unit: 'oz' },
      { id: '3', name: 'Soda Water', amount: '1', unit: 'oz' },
    ],
    instructions: [
      'Fill glass with ice',
      'Add Aperol',
      'Add Prosecco',
      'Top with soda water',
      'Stir gently',
    ],
    garnish: 'Orange slice',
    favorite: false,
  },
  {
    id: 'cocktail-19',
    name: 'Irish Coffee',
    category: 'creamy',
    glassType: 'other',
    difficulty: 'medium',
    ingredients: [
      { id: '1', name: 'Irish Whiskey', amount: '1.5', unit: 'oz' },
      { id: '2', name: 'Hot Coffee', amount: '6', unit: 'oz' },
      { id: '3', name: 'Brown Sugar', amount: '1', unit: 'tbsp' },
      { id: '4', name: 'Heavy Cream', amount: '1', unit: 'oz' },
    ],
    instructions: [
      'Add sugar to glass',
      'Pour in hot coffee and stir',
      'Add Irish whiskey',
      'Float cream on top',
    ],
    garnish: 'None',
    favorite: false,
  },
  {
    id: 'cocktail-20',
    name: 'Tom Collins',
    category: 'classic',
    glassType: 'highball',
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'Gin', amount: '2', unit: 'oz' },
      { id: '2', name: 'Fresh Lemon Juice', amount: '1', unit: 'oz' },
      { id: '3', name: 'Simple Syrup', amount: '0.5', unit: 'oz' },
      { id: '4', name: 'Soda Water', amount: 'Top', unit: '' },
    ],
    instructions: [
      'Add gin, lemon juice, and syrup to shaker with ice',
      'Shake well',
      'Strain into glass filled with ice',
      'Top with soda water',
    ],
    garnish: 'Lemon wheel and cherry',
    favorite: false,
  },
  {
    id: 'cocktail-21',
    name: 'Mint Julep',
    category: 'classic',
    glassType: 'rocks',
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'Bourbon', amount: '2.5', unit: 'oz' },
      { id: '2', name: 'Mint Leaves', amount: '8', unit: 'leaves' },
      { id: '3', name: 'Simple Syrup', amount: '0.5', unit: 'oz' },
    ],
    instructions: [
      'Muddle mint leaves with syrup',
      'Fill glass with crushed ice',
      'Add bourbon',
      'Stir until glass is frosted',
    ],
    garnish: 'Mint sprig',
    favorite: false,
  },
  {
    id: 'cocktail-22',
    name: 'Piña Colada (Frozen)',
    category: 'tropical',
    glassType: 'hurricane',
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'White Rum', amount: '2', unit: 'oz' },
      { id: '2', name: 'Coconut Cream', amount: '2', unit: 'oz' },
      { id: '3', name: 'Pineapple Juice', amount: '3', unit: 'oz' },
      { id: '4', name: 'Ice', amount: '1.5', unit: 'cups' },
    ],
    instructions: [
      'Add all ingredients to blender',
      'Blend until smooth and thick',
      'Pour into glass',
    ],
    garnish: 'Pineapple wedge and umbrella',
    favorite: false,
  },
  {
    id: 'cocktail-23',
    name: 'B-52 Shot',
    category: 'shot',
    glassType: 'shot',
    difficulty: 'medium',
    ingredients: [
      { id: '1', name: 'Coffee Liqueur', amount: '0.5', unit: 'oz' },
      { id: '2', name: 'Baileys Irish Cream', amount: '0.5', unit: 'oz' },
      { id: '3', name: 'Grand Marnier', amount: '0.5', unit: 'oz' },
    ],
    instructions: [
      'Pour coffee liqueur into shot glass',
      'Layer Baileys over back of spoon',
      'Layer Grand Marnier over back of spoon',
    ],
    garnish: 'None',
    favorite: false,
  },
  {
    id: 'cocktail-24',
    name: 'Kamikaze Shot',
    category: 'shot',
    glassType: 'shot',
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'Vodka', amount: '1', unit: 'oz' },
      { id: '2', name: 'Triple Sec', amount: '0.5', unit: 'oz' },
      { id: '3', name: 'Lime Juice', amount: '0.5', unit: 'oz' },
    ],
    instructions: [
      'Add all ingredients to shaker with ice',
      'Shake well',
      'Strain into shot glass',
    ],
    garnish: 'None',
    favorite: false,
  },
  {
    id: 'cocktail-25',
    name: 'Mudslide',
    category: 'creamy',
    glassType: 'rocks',
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'Vodka', amount: '1', unit: 'oz' },
      { id: '2', name: 'Coffee Liqueur', amount: '1', unit: 'oz' },
      { id: '3', name: 'Baileys Irish Cream', amount: '1', unit: 'oz' },
    ],
    instructions: [
      'Add all ingredients to shaker with ice',
      'Shake well',
      'Strain into glass with ice',
    ],
    garnish: 'Chocolate syrup drizzle',
    favorite: false,
  },
  {
    id: 'cocktail-26',
    name: 'Blue Lagoon',
    category: 'tropical',
    glassType: 'highball',
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'Vodka', amount: '1', unit: 'oz' },
      { id: '2', name: 'Blue Curaçao', amount: '1', unit: 'oz' },
      { id: '3', name: 'Lemonade', amount: '4', unit: 'oz' },
    ],
    instructions: [
      'Fill glass with ice',
      'Add vodka and blue curaçao',
      'Top with lemonade',
      'Stir gently',
    ],
    garnish: 'Lemon slice and cherry',
    favorite: false,
  },
  {
    id: 'cocktail-27',
    name: 'French 75',
    category: 'classic',
    glassType: 'coupe',
    difficulty: 'medium',
    ingredients: [
      { id: '1', name: 'Gin', amount: '1', unit: 'oz' },
      { id: '2', name: 'Fresh Lemon Juice', amount: '0.5', unit: 'oz' },
      { id: '3', name: 'Simple Syrup', amount: '0.5', unit: 'oz' },
      { id: '4', name: 'Champagne', amount: 'Top', unit: '' },
    ],
    instructions: [
      'Add gin, lemon juice, and syrup to shaker with ice',
      'Shake well',
      'Strain into chilled coupe',
      'Top with champagne',
    ],
    garnish: 'Lemon twist',
    favorite: false,
  },
  {
    id: 'cocktail-28',
    name: 'Pornstar Martini',
    category: 'martini',
    glassType: 'martini',
    difficulty: 'medium',
    ingredients: [
      { id: '1', name: 'Vanilla Vodka', amount: '2', unit: 'oz' },
      { id: '2', name: 'Passion Fruit Liqueur', amount: '1', unit: 'oz' },
      { id: '3', name: 'Passion Fruit Puree', amount: '0.5', unit: 'oz' },
      { id: '4', name: 'Lime Juice', amount: '0.5', unit: 'oz' },
      { id: '5', name: 'Vanilla Syrup', amount: '0.25', unit: 'oz' },
    ],
    instructions: [
      'Add all ingredients to shaker with ice',
      'Shake vigorously',
      'Strain into chilled martini glass',
      'Serve with shot of Prosecco on side',
    ],
    garnish: 'Half passion fruit',
    favorite: false,
  },
  {
    id: 'cocktail-29',
    name: 'Sex on the Beach',
    category: 'tropical',
    glassType: 'highball',
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'Vodka', amount: '1.5', unit: 'oz' },
      { id: '2', name: 'Peach Schnapps', amount: '0.5', unit: 'oz' },
      { id: '3', name: 'Orange Juice', amount: '2', unit: 'oz' },
      { id: '4', name: 'Cranberry Juice', amount: '2', unit: 'oz' },
    ],
    instructions: [
      'Fill glass with ice',
      'Add vodka and peach schnapps',
      'Add orange juice and cranberry juice',
      'Stir well',
    ],
    garnish: 'Orange slice and cherry',
    favorite: false,
  },
  {
    id: 'cocktail-30',
    name: 'Dark and Stormy',
    category: 'classic',
    glassType: 'highball',
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'Dark Rum', amount: '2', unit: 'oz' },
      { id: '2', name: 'Ginger Beer', amount: '4', unit: 'oz' },
      { id: '3', name: 'Lime Juice', amount: '0.5', unit: 'oz' },
    ],
    instructions: [
      'Fill glass with ice',
      'Add lime juice and ginger beer',
      'Float dark rum on top',
    ],
    garnish: 'Lime wedge',
    favorite: false,
  },
  {
    id: 'cocktail-31',
    name: 'Amaretto Sour',
    category: 'other',
    glassType: 'rocks',
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'Amaretto', amount: '1.5', unit: 'oz' },
      { id: '2', name: 'Bourbon', amount: '0.75', unit: 'oz' },
      { id: '3', name: 'Fresh Lemon Juice', amount: '1', unit: 'oz' },
      { id: '4', name: 'Simple Syrup', amount: '0.5', unit: 'oz' },
    ],
    instructions: [
      'Add all ingredients to shaker with ice',
      'Shake well',
      'Strain into glass with fresh ice',
    ],
    garnish: 'Cherry and orange slice',
    favorite: false,
  },
];

export default function App() {
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);
  const [filteredCocktails, setFilteredCocktails] = useState<Cocktail[]>([]);
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [currentView, setCurrentView] = useState<'all' | 'favorites'>('all');
  const [menuVisible, setMenuVisible] = useState(false);

  // Load data from storage
  useEffect(() => {
    loadCocktails();
  }, []);

  // Filter cocktails
  useEffect(() => {
    let filtered = [...cocktails];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(cocktail =>
        cocktail.name.toLowerCase().includes(query) ||
        cocktail.ingredients.some(ing => ing.name.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(cocktail => cocktail.category === filterCategory);
    }

    // Difficulty filter
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(cocktail => cocktail.difficulty === filterDifficulty);
    }

    // Favorites filter
    if (currentView === 'favorites') {
      filtered = filtered.filter(cocktail => cocktail.favorite);
    }

    setFilteredCocktails(filtered);
  }, [cocktails, searchQuery, filterCategory, filterDifficulty, currentView]);

  const loadCocktails = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCocktails(JSON.parse(stored));
      } else {
        // Initialize with predefined cocktails
        setCocktails(PREDEFINED_COCKTAILS);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(PREDEFINED_COCKTAILS));
      }
    } catch (error) {
      console.error('Error loading cocktails:', error);
    }
  };

  const saveCocktails = async (newCocktails: Cocktail[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newCocktails));
      setCocktails(newCocktails);
    } catch (error) {
      console.error('Error saving cocktails:', error);
    }
  };

  const toggleFavorite = async (id: string) => {
    const newCocktails = cocktails.map(cocktail =>
      cocktail.id === id ? { ...cocktail, favorite: !cocktail.favorite } : cocktail
    );
    await saveCocktails(newCocktails);

    if (selectedCocktail?.id === id) {
      setSelectedCocktail({ ...selectedCocktail, favorite: !selectedCocktail.favorite });
    }
  };

  const viewCocktail = (cocktail: Cocktail) => {
    setSelectedCocktail(cocktail);
    setViewModalVisible(true);
  };

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[CATEGORIES.length - 1];
  };

  const getGlassInfo = (glassType: string) => {
    return GLASS_TYPES.find(g => g.value === glassType) || GLASS_TYPES[GLASS_TYPES.length - 1];
  };

  const getDifficultyInfo = (difficulty: string) => {
    return DIFFICULTIES.find(d => d.value === difficulty) || DIFFICULTIES[1];
  };

  const renderCocktailCard = (cocktail: Cocktail) => {
    const categoryInfo = getCategoryInfo(cocktail.category);
    const difficultyInfo = getDifficultyInfo(cocktail.difficulty);
    const glassInfo = getGlassInfo(cocktail.glassType);

    return (
      <Card key={cocktail.id} style={styles.cocktailCard} onPress={() => viewCocktail(cocktail)}>
        <Card.Content>
          <View style={styles.cocktailHeader}>
            <View style={styles.cocktailHeaderLeft}>
              <IconButton
                icon={categoryInfo.icon}
                size={28}
                iconColor={categoryInfo.color}
              />
              <Text variant="titleLarge" style={styles.cocktailName}>
                {cocktail.name}
              </Text>
            </View>
            <IconButton
              icon={cocktail.favorite ? 'heart' : 'heart-outline'}
              size={24}
              iconColor={cocktail.favorite ? '#E91E63' : '#999'}
              onPress={() => toggleFavorite(cocktail.id)}
            />
          </View>

          <View style={styles.cocktailDetails}>
            <Chip
              icon={glassInfo.icon}
              style={styles.detailChip}
              textStyle={styles.chipText}
            >
              {glassInfo.label}
            </Chip>
            <Chip
              style={[styles.difficultyChip, { backgroundColor: difficultyInfo.color + '20' }]}
              textStyle={[styles.chipText, { color: difficultyInfo.color }]}
            >
              {difficultyInfo.label}
            </Chip>
            <Chip icon="beaker" style={styles.detailChip} textStyle={styles.chipText}>
              {cocktail.ingredients.length} ingredients
            </Chip>
          </View>

          <Text variant="bodySmall" style={styles.ingredientsPreview} numberOfLines={2}>
            {cocktail.ingredients.map(ing => ing.name).join(', ')}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="Cocktail Recipes" />
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
                label: `All (${cocktails.length})`,
                icon: 'glass-cocktail',
              },
              {
                value: 'favorites',
                label: `Favorites (${cocktails.filter(c => c.favorite).length})`,
                icon: 'heart',
              },
            ]}
          />
        </View>

        {/* Search and Filters */}
        <View style={styles.filtersContainer}>
          <Searchbar
            placeholder="Search by name or ingredient..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
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

        {/* Cocktails List */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {filteredCocktails.length === 0 ? (
            <View style={styles.emptyState}>
              <IconButton
                icon={currentView === 'favorites' ? 'heart-outline' : 'glass-cocktail'}
                size={64}
                iconColor="#ccc"
              />
              <Text variant="titleMedium" style={styles.emptyText}>
                {currentView === 'favorites' ? 'No favorite cocktails' : 'No cocktails found'}
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                {searchQuery || filterCategory !== 'all' || filterDifficulty !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Mark cocktails as favorites to see them here'}
              </Text>
            </View>
          ) : (
            filteredCocktails.map(renderCocktailCard)
          )}

          <View style={styles.adContainer}>
            <BannerAd unitId={bannerId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
          </View>
        </ScrollView>

        {/* View Cocktail Modal */}
        <Portal>
          <Modal
            visible={viewModalVisible}
            onDismiss={() => setViewModalVisible(false)}
            contentContainerStyle={styles.modal}
          >
            {selectedCocktail && (
              <ScrollView>
                <View style={styles.viewHeader}>
                  <View style={styles.viewHeaderLeft}>
                    <IconButton
                      icon={getCategoryInfo(selectedCocktail.category).icon}
                      size={40}
                      iconColor={getCategoryInfo(selectedCocktail.category).color}
                    />
                    <Text variant="headlineMedium" style={styles.viewTitle}>
                      {selectedCocktail.name}
                    </Text>
                  </View>
                  <IconButton
                    icon={selectedCocktail.favorite ? 'heart' : 'heart-outline'}
                    size={32}
                    iconColor={selectedCocktail.favorite ? '#E91E63' : '#999'}
                    onPress={() => toggleFavorite(selectedCocktail.id)}
                  />
                </View>

                <View style={styles.viewDetails}>
                  <Chip
                    icon={getGlassInfo(selectedCocktail.glassType).icon}
                    style={styles.viewDetailChip}
                  >
                    {getGlassInfo(selectedCocktail.glassType).label} Glass
                  </Chip>
                  <Chip
                    style={[
                      styles.viewDifficultyChip,
                      { backgroundColor: getDifficultyInfo(selectedCocktail.difficulty).color + '20' },
                    ]}
                    textStyle={{ color: getDifficultyInfo(selectedCocktail.difficulty).color }}
                  >
                    {getDifficultyInfo(selectedCocktail.difficulty).label}
                  </Chip>
                  <Chip style={styles.viewDetailChip}>
                    {getCategoryInfo(selectedCocktail.category).label}
                  </Chip>
                </View>

                <Divider style={styles.divider} />

                <Text variant="titleLarge" style={styles.sectionTitle}>
                  Ingredients
                </Text>
                {selectedCocktail.ingredients.map((ingredient, index) => (
                  <View key={ingredient.id} style={styles.viewIngredient}>
                    <IconButton icon="checkbox-blank-circle" size={8} iconColor="#6200ee" />
                    <Text variant="bodyLarge">
                      {ingredient.amount} {ingredient.unit} {ingredient.name}
                    </Text>
                  </View>
                ))}

                <Divider style={styles.divider} />

                <Text variant="titleLarge" style={styles.sectionTitle}>
                  Instructions
                </Text>
                {selectedCocktail.instructions.map((instruction, index) => (
                  <View key={index} style={styles.viewInstruction}>
                    <Text variant="bodyLarge" style={styles.viewInstructionNumber}>
                      {index + 1}.
                    </Text>
                    <Text variant="bodyLarge" style={styles.viewInstructionText}>
                      {instruction}
                    </Text>
                  </View>
                ))}

                <Divider style={styles.divider} />

                <View style={styles.garnishSection}>
                  <IconButton icon="flower" size={24} iconColor="#4CAF50" />
                  <View style={styles.garnishContent}>
                    <Text variant="labelLarge" style={styles.garnishLabel}>
                      Garnish
                    </Text>
                    <Text variant="bodyLarge">{selectedCocktail.garnish}</Text>
                  </View>
                </View>

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
  cocktailCard: {
    marginBottom: 12,
    elevation: 2,
  },
  cocktailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cocktailHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cocktailName: {
    fontWeight: 'bold',
    flex: 1,
  },
  cocktailDetails: {
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
  chipText: {
    fontSize: 12,
  },
  ingredientsPreview: {
    color: '#666',
    fontStyle: 'italic',
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
  viewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  viewDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  viewDetailChip: {
    backgroundColor: '#e3f2fd',
  },
  viewDifficultyChip: {
    height: 32,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#6200ee',
  },
  viewIngredient: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: 8,
  },
  viewInstruction: {
    flexDirection: 'row',
    marginBottom: 14,
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
  garnishSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f0',
    padding: 12,
    borderRadius: 8,
  },
  garnishContent: {
    flex: 1,
  },
  garnishLabel: {
    color: '#4CAF50',
    marginBottom: 4,
  },
  closeButton: {
    marginTop: 24,
  },
});
