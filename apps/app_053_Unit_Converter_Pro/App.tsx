import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const FAVORITES_KEY = '@Unit_Converter_Favorites';
const RECENTS_KEY = '@Unit_Converter_Recents';

interface Unit {
  name: string;
  toBase: number;
  symbol: string;
}

interface Category {
  name: string;
  icon: string;
  units: Unit[];
}

interface FavoriteConversion {
  category: string;
  fromUnit: string;
  toUnit: string;
}

interface RecentConversion {
  id: string;
  category: string;
  fromUnit: string;
  toUnit: string;
  value: number;
  result: number;
  timestamp: string;
}

const CATEGORIES: Category[] = [
  {
    name: 'Length',
    icon: '📏',
    units: [
      { name: 'Millimeter', toBase: 0.001, symbol: 'mm' },
      { name: 'Centimeter', toBase: 0.01, symbol: 'cm' },
      { name: 'Meter', toBase: 1, symbol: 'm' },
      { name: 'Kilometer', toBase: 1000, symbol: 'km' },
      { name: 'Inch', toBase: 0.0254, symbol: 'in' },
      { name: 'Foot', toBase: 0.3048, symbol: 'ft' },
      { name: 'Yard', toBase: 0.9144, symbol: 'yd' },
      { name: 'Mile', toBase: 1609.344, symbol: 'mi' },
    ],
  },
  {
    name: 'Weight',
    icon: '⚖️',
    units: [
      { name: 'Milligram', toBase: 0.001, symbol: 'mg' },
      { name: 'Gram', toBase: 1, symbol: 'g' },
      { name: 'Kilogram', toBase: 1000, symbol: 'kg' },
      { name: 'Metric Ton', toBase: 1000000, symbol: 't' },
      { name: 'Ounce', toBase: 28.3495, symbol: 'oz' },
      { name: 'Pound', toBase: 453.592, symbol: 'lb' },
      { name: 'Stone', toBase: 6350.29, symbol: 'st' },
      { name: 'Ton (US)', toBase: 907185, symbol: 'ton' },
    ],
  },
  {
    name: 'Volume',
    icon: '🥤',
    units: [
      { name: 'Milliliter', toBase: 0.001, symbol: 'ml' },
      { name: 'Liter', toBase: 1, symbol: 'L' },
      { name: 'Cubic Meter', toBase: 1000, symbol: 'm³' },
      { name: 'Teaspoon', toBase: 0.00492892, symbol: 'tsp' },
      { name: 'Tablespoon', toBase: 0.0147868, symbol: 'tbsp' },
      { name: 'Fluid Ounce', toBase: 0.0295735, symbol: 'fl oz' },
      { name: 'Cup', toBase: 0.24, symbol: 'cup' },
      { name: 'Pint', toBase: 0.473176, symbol: 'pt' },
      { name: 'Quart', toBase: 0.946353, symbol: 'qt' },
      { name: 'Gallon', toBase: 3.78541, symbol: 'gal' },
    ],
  },
  {
    name: 'Temperature',
    icon: '🌡️',
    units: [
      { name: 'Celsius', toBase: 1, symbol: '°C' },
      { name: 'Fahrenheit', toBase: 1, symbol: '°F' },
      { name: 'Kelvin', toBase: 1, symbol: 'K' },
    ],
  },
  {
    name: 'Area',
    icon: '🟦',
    units: [
      { name: 'Square Millimeter', toBase: 0.000001, symbol: 'mm²' },
      { name: 'Square Centimeter', toBase: 0.0001, symbol: 'cm²' },
      { name: 'Square Meter', toBase: 1, symbol: 'm²' },
      { name: 'Hectare', toBase: 10000, symbol: 'ha' },
      { name: 'Square Kilometer', toBase: 1000000, symbol: 'km²' },
      { name: 'Square Inch', toBase: 0.00064516, symbol: 'in²' },
      { name: 'Square Foot', toBase: 0.092903, symbol: 'ft²' },
      { name: 'Square Yard', toBase: 0.836127, symbol: 'yd²' },
      { name: 'Acre', toBase: 4046.86, symbol: 'ac' },
      { name: 'Square Mile', toBase: 2589988, symbol: 'mi²' },
    ],
  },
  {
    name: 'Speed',
    icon: '🏃',
    units: [
      { name: 'Meters/second', toBase: 1, symbol: 'm/s' },
      { name: 'Kilometers/hour', toBase: 0.277778, symbol: 'km/h' },
      { name: 'Miles/hour', toBase: 0.44704, symbol: 'mph' },
      { name: 'Feet/second', toBase: 0.3048, symbol: 'ft/s' },
      { name: 'Knot', toBase: 0.514444, symbol: 'kn' },
    ],
  },
  {
    name: 'Time',
    icon: '⏱️',
    units: [
      { name: 'Millisecond', toBase: 0.001, symbol: 'ms' },
      { name: 'Second', toBase: 1, symbol: 's' },
      { name: 'Minute', toBase: 60, symbol: 'min' },
      { name: 'Hour', toBase: 3600, symbol: 'h' },
      { name: 'Day', toBase: 86400, symbol: 'd' },
      { name: 'Week', toBase: 604800, symbol: 'wk' },
      { name: 'Month', toBase: 2592000, symbol: 'mo' },
      { name: 'Year', toBase: 31536000, symbol: 'yr' },
    ],
  },
];

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [fromUnit, setFromUnit] = useState(selectedCategory.units[0]);
  const [toUnit, setToUnit] = useState(selectedCategory.units[1]);
  const [inputValue, setInputValue] = useState('');
  const [favorites, setFavorites] = useState<FavoriteConversion[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedFavorites = await AsyncStorage.getItem(FAVORITES_KEY);
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveFavorites = async (favs: FavoriteConversion[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
      setFavorites(favs);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const convertTemperature = (value: number, from: Unit, to: Unit): number => {
    // Convert to Celsius first
    let celsius = value;
    if (from.name === 'Fahrenheit') {
      celsius = (value - 32) * (5 / 9);
    } else if (from.name === 'Kelvin') {
      celsius = value - 273.15;
    }

    // Convert from Celsius to target
    if (to.name === 'Fahrenheit') {
      return celsius * (9 / 5) + 32;
    } else if (to.name === 'Kelvin') {
      return celsius + 273.15;
    }
    return celsius;
  };

  const convert = (): number => {
    const value = parseFloat(inputValue);
    if (isNaN(value)) return 0;

    if (selectedCategory.name === 'Temperature') {
      return convertTemperature(value, fromUnit, toUnit);
    }

    const baseValue = value * fromUnit.toBase;
    return baseValue / toUnit.toBase;
  };

  const result = convert();

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  const changeCategory = (category: Category) => {
    setSelectedCategory(category);
    setFromUnit(category.units[0]);
    setToUnit(category.units[1]);
    setInputValue('');

    const newCount = count + 1;
    setCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const toggleFavorite = () => {
    const fav: FavoriteConversion = {
      category: selectedCategory.name,
      fromUnit: fromUnit.name,
      toUnit: toUnit.name,
    };

    const exists = favorites.find(
      (f) =>
        f.category === fav.category &&
        f.fromUnit === fav.fromUnit &&
        f.toUnit === fav.toUnit
    );

    if (exists) {
      saveFavorites(favorites.filter((f) => f !== exists));
    } else {
      saveFavorites([...favorites, fav]);
    }
  };

  const isFavorite = favorites.some(
    (f) =>
      f.category === selectedCategory.name &&
      f.fromUnit === fromUnit.name &&
      f.toUnit === toUnit.name
  );

  const loadFavorite = (fav: FavoriteConversion) => {
    const category = CATEGORIES.find((c) => c.name === fav.category);
    if (category) {
      setSelectedCategory(category);
      const from = category.units.find((u) => u.name === fav.fromUnit);
      const to = category.units.find((u) => u.name === fav.toUnit);
      if (from) setFromUnit(from);
      if (to) setToUnit(to);
      setShowFavorites(false);
    }
  };

  const UnitPickerModal = ({
    visible,
    onClose,
    onSelect,
    currentUnit,
  }: {
    visible: boolean;
    onClose: () => void;
    onSelect: (unit: Unit) => void;
    currentUnit: Unit;
  }) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.pickerModal}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Unit</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {selectedCategory.units.map((unit) => (
              <TouchableOpacity
                key={unit.name}
                style={[
                  styles.unitOption,
                  unit.name === currentUnit.name && styles.unitOptionActive,
                ]}
                onPress={() => {
                  onSelect(unit);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.unitOptionText,
                    unit.name === currentUnit.name && styles.unitOptionTextActive,
                  ]}
                >
                  {unit.name} ({unit.symbol})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Unit Converter</Text>
        <TouchableOpacity
          style={styles.favoriteBtn}
          onPress={() => setShowFavorites(true)}
        >
          <Text style={styles.favoriteBtnText}>⭐ {favorites.length}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Categories */}
        <View style={styles.categoriesSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.name}
                style={[
                  styles.categoryCard,
                  selectedCategory.name === category.name && styles.categoryCardActive,
                ]}
                onPress={() => changeCategory(category)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text
                  style={[
                    styles.categoryName,
                    selectedCategory.name === category.name && styles.categoryNameActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* From Unit */}
        <View style={styles.section}>
          <Text style={styles.label}>From</Text>
          <TouchableOpacity
            style={styles.unitSelector}
            onPress={() => setShowFromPicker(true)}
          >
            <Text style={styles.unitSelectorText}>
              {fromUnit.name} ({fromUnit.symbol})
            </Text>
            <Text style={styles.unitSelectorArrow}>▼</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Enter value"
            keyboardType="decimal-pad"
            placeholderTextColor={colors.gray.medium}
          />
        </View>

        {/* Swap Button */}
        <View style={styles.swapContainer}>
          <TouchableOpacity style={styles.swapBtn} onPress={swapUnits}>
            <Text style={styles.swapText}>⇅</Text>
          </TouchableOpacity>
        </View>

        {/* To Unit */}
        <View style={styles.section}>
          <Text style={styles.label}>To</Text>
          <TouchableOpacity
            style={styles.unitSelector}
            onPress={() => setShowToPicker(true)}
          >
            <Text style={styles.unitSelectorText}>
              {toUnit.name} ({toUnit.symbol})
            </Text>
            <Text style={styles.unitSelectorArrow}>▼</Text>
          </TouchableOpacity>
          <View style={styles.resultBox}>
            <Text style={styles.resultValue}>
              {inputValue ? result.toFixed(6).replace(/\.?0+$/, '') : '0'}
            </Text>
            <Text style={styles.resultUnit}>{toUnit.symbol}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, isFavorite && styles.actionBtnActive]}
            onPress={toggleFavorite}
          >
            <Text style={[styles.actionBtnText, isFavorite && styles.actionBtnTextActive]}>
              {isFavorite ? '⭐ Favorited' : '☆ Add to Favorites'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Common Conversions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccess}>
            {selectedCategory.units.slice(0, 6).map((unit) => (
              <TouchableOpacity
                key={unit.name}
                style={styles.quickBtn}
                onPress={() => setToUnit(unit)}
              >
                <Text style={styles.quickBtnText}>{unit.symbol}</Text>
                <Text style={styles.quickBtnLabel}>{unit.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <AdBanner />

      {/* Unit Pickers */}
      <UnitPickerModal
        visible={showFromPicker}
        onClose={() => setShowFromPicker(false)}
        onSelect={setFromUnit}
        currentUnit={fromUnit}
      />

      <UnitPickerModal
        visible={showToPicker}
        onClose={() => setShowToPicker(false)}
        onSelect={setToUnit}
        currentUnit={toUnit}
      />

      {/* Favorites Modal */}
      <Modal visible={showFavorites} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Favorite Conversions</Text>
            <TouchableOpacity onPress={() => setShowFavorites(false)}>
              <Text style={styles.closeBtn}>Close</Text>
            </TouchableOpacity>
          </View>
          {favorites.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No favorites yet</Text>
              <Text style={styles.emptySubtext}>
                Add conversions to favorites for quick access
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.favoritesList}>
              {favorites.map((fav, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.favoriteCard}
                  onPress={() => loadFavorite(fav)}
                >
                  <View style={styles.favoriteHeader}>
                    <Text style={styles.favoriteCategory}>{fav.category}</Text>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        saveFavorites(favorites.filter((_, i) => i !== index));
                      }}
                    >
                      <Text style={styles.deleteText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.favoriteConversion}>
                    {fav.fromUnit} → {fav.toUnit}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  favoriteBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.secondary,
    borderRadius: 8,
  },
  favoriteBtnText: { fontSize: 14, color: colors.white, fontWeight: '600' },
  categoriesSection: {
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  categoryCard: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginLeft: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.gray.light,
    minWidth: 100,
  },
  categoryCardActive: {
    backgroundColor: colors.primary,
  },
  categoryIcon: { fontSize: 32, marginBottom: spacing.xs },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  categoryNameActive: {
    color: colors.white,
  },
  section: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginTop: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray.dark,
    marginBottom: spacing.sm,
  },
  unitSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  unitSelectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  unitSelectorArrow: {
    fontSize: 12,
    color: colors.gray.dark,
  },
  input: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    backgroundColor: colors.gray.light,
    padding: spacing.lg,
    borderRadius: 12,
    textAlign: 'right',
  },
  swapContainer: {
    alignItems: 'center',
    marginVertical: -spacing.md,
    zIndex: 10,
  },
  swapBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  swapText: {
    fontSize: 32,
    color: colors.white,
  },
  resultBox: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
  },
  resultUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    marginLeft: spacing.sm,
  },
  actionButtons: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  actionBtn: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnActive: {
    backgroundColor: colors.secondary,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  actionBtnTextActive: {
    color: colors.white,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  quickAccess: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickBtn: {
    width: '31%',
    padding: spacing.md,
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  quickBtnLabel: {
    fontSize: 10,
    color: colors.gray.dark,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  closeBtn: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  unitOption: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  unitOptionActive: {
    backgroundColor: colors.primary,
  },
  unitOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  unitOptionTextActive: {
    color: colors.white,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    color: colors.gray.dark,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray.medium,
    textAlign: 'center',
  },
  favoritesList: {
    padding: spacing.lg,
  },
  favoriteCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  favoriteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  favoriteCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  deleteText: {
    fontSize: 14,
    color: colors.status.error,
    fontWeight: '600',
  },
  favoriteConversion: {
    fontSize: 16,
    color: colors.text,
  },
});
