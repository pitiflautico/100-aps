import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const { width } = Dimensions.get('window');

interface BMIRecord {
  id: string;
  bmi: number;
  weight: number;
  height: number;
  category: string;
  date: string;
  weightUnit: 'kg' | 'lbs';
  heightUnit: 'cm' | 'ft';
}

type BMICategory = {
  name: string;
  color: string;
  min: number;
  max: number;
};

const BMI_CATEGORIES: BMICategory[] = [
  { name: 'Underweight', color: '#3B82F6', min: 0, max: 18.5 },
  { name: 'Normal', color: '#10B981', min: 18.5, max: 24.9 },
  { name: 'Overweight', color: '#F59E0B', min: 25, max: 29.9 },
  { name: 'Obese', color: '#EF4444', min: 30, max: 100 },
];

export default function App() {
  const [heightCm, setHeightCm] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState<string>('');
  const [history, setHistory] = useState<BMIRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('bmi_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const saveToHistory = async (bmiValue: number, categoryValue: string) => {
    try {
      const record: BMIRecord = {
        id: Date.now().toString(),
        bmi: bmiValue,
        weight: weightUnit === 'kg' ? parseFloat(weightKg) : parseFloat(weightKg) * 0.453592,
        height: getHeightInCm(),
        category: categoryValue,
        date: new Date().toISOString(),
        weightUnit,
        heightUnit,
      };

      const newHistory = [record, ...history].slice(0, 50);
      setHistory(newHistory);
      await AsyncStorage.setItem('bmi_history', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const getHeightInCm = (): number => {
    if (heightUnit === 'cm') {
      return parseFloat(heightCm);
    } else {
      const feet = parseFloat(heightFeet) || 0;
      const inches = parseFloat(heightInches) || 0;
      return (feet * 12 + inches) * 2.54;
    }
  };

  const getWeightInKg = (): number => {
    if (weightUnit === 'kg') {
      return parseFloat(weightKg);
    } else {
      return parseFloat(weightKg) * 0.453592;
    }
  };

  const calculateBMI = () => {
    const heightInCm = getHeightInCm();
    const weightInKg = getWeightInKg();

    if (isNaN(heightInCm) || isNaN(weightInKg) || heightInCm <= 0 || weightInKg <= 0) {
      Alert.alert('Invalid Input', 'Please enter valid height and weight values');
      return;
    }

    const heightInM = heightInCm / 100;
    const bmiValue = weightInKg / (heightInM * heightInM);
    const bmiCategory = getBMICategory(bmiValue);

    setBmi(bmiValue);
    setCategory(bmiCategory);
    saveToHistory(bmiValue, bmiCategory);
  };

  const getBMICategory = (bmiValue: number): string => {
    for (const cat of BMI_CATEGORIES) {
      if (bmiValue >= cat.min && bmiValue < cat.max) {
        return cat.name;
      }
    }
    return 'Obese';
  };

  const getCategoryColor = (categoryName: string): string => {
    const cat = BMI_CATEGORIES.find((c) => c.name === categoryName);
    return cat ? cat.color : '#9CA3AF';
  };

  const resetCalculator = () => {
    setHeightCm('');
    setHeightFeet('');
    setHeightInches('');
    setWeightKg('');
    setBmi(null);
    setCategory('');
  };

  const deleteHistory = async () => {
    Alert.alert('Delete History', 'Are you sure you want to delete all history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setHistory([]);
          await AsyncStorage.removeItem('bmi_history');
        },
      },
    ]);
  };

  const renderBMIChart = () => {
    if (bmi === null) return null;

    const chartWidth = width - 60;
    const minBMI = 15;
    const maxBMI = 40;
    const bmiRange = maxBMI - minBMI;
    const position = ((Math.min(Math.max(bmi, minBMI), maxBMI) - minBMI) / bmiRange) * chartWidth;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>BMI Chart</Text>
        <View style={styles.chart}>
          {BMI_CATEGORIES.map((cat, index) => {
            const startPos = ((cat.min - minBMI) / bmiRange) * chartWidth;
            const endPos = ((Math.min(cat.max, maxBMI) - minBMI) / bmiRange) * chartWidth;
            const sectionWidth = endPos - startPos;

            return (
              <View
                key={index}
                style={[
                  styles.chartSection,
                  { width: sectionWidth, backgroundColor: cat.color },
                ]}
              >
                <Text style={styles.chartLabel}>{cat.name}</Text>
              </View>
            );
          })}
        </View>
        <View style={[styles.indicator, { left: position - 5 }]}>
          <View style={styles.indicatorTriangle} />
          <Text style={styles.indicatorText}>{bmi.toFixed(1)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>BMI Calculator</Text>
          <Text style={styles.subtitle}>Track your Body Mass Index</Text>
        </View>

        {!showHistory ? (
          <>
            {/* Height Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Height</Text>
              <View style={styles.unitToggle}>
                <TouchableOpacity
                  style={[styles.unitButton, heightUnit === 'cm' && styles.unitButtonActive]}
                  onPress={() => setHeightUnit('cm')}
                >
                  <Text
                    style={[styles.unitButtonText, heightUnit === 'cm' && styles.unitButtonTextActive]}
                  >
                    cm
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitButton, heightUnit === 'ft' && styles.unitButtonActive]}
                  onPress={() => setHeightUnit('ft')}
                >
                  <Text
                    style={[styles.unitButtonText, heightUnit === 'ft' && styles.unitButtonTextActive]}
                  >
                    ft / in
                  </Text>
                </TouchableOpacity>
              </View>

              {heightUnit === 'cm' ? (
                <TextInput
                  style={styles.input}
                  placeholder="Enter height in cm"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  value={heightCm}
                  onChangeText={setHeightCm}
                />
              ) : (
                <View style={styles.feetInchesContainer}>
                  <TextInput
                    style={[styles.input, styles.feetInput]}
                    placeholder="Feet"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    value={heightFeet}
                    onChangeText={setHeightFeet}
                  />
                  <TextInput
                    style={[styles.input, styles.inchesInput]}
                    placeholder="Inches"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    value={heightInches}
                    onChangeText={setHeightInches}
                  />
                </View>
              )}
            </View>

            {/* Weight Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weight</Text>
              <View style={styles.unitToggle}>
                <TouchableOpacity
                  style={[styles.unitButton, weightUnit === 'kg' && styles.unitButtonActive]}
                  onPress={() => setWeightUnit('kg')}
                >
                  <Text
                    style={[styles.unitButtonText, weightUnit === 'kg' && styles.unitButtonTextActive]}
                  >
                    kg
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitButton, weightUnit === 'lbs' && styles.unitButtonActive]}
                  onPress={() => setWeightUnit('lbs')}
                >
                  <Text
                    style={[styles.unitButtonText, weightUnit === 'lbs' && styles.unitButtonTextActive]}
                  >
                    lbs
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder={`Enter weight in ${weightUnit}`}
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                value={weightKg}
                onChangeText={setWeightKg}
              />
            </View>

            {/* Calculate Button */}
            <TouchableOpacity style={styles.calculateButton} onPress={calculateBMI}>
              <Text style={styles.calculateButtonText}>Calculate BMI</Text>
            </TouchableOpacity>

            {/* Results */}
            {bmi !== null && (
              <View style={styles.resultContainer}>
                <View style={[styles.bmiCircle, { borderColor: getCategoryColor(category) }]}>
                  <Text style={styles.bmiValue}>{bmi.toFixed(1)}</Text>
                  <Text style={styles.bmiLabel}>BMI</Text>
                </View>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(category) }]}>
                  <Text style={styles.categoryText}>{category}</Text>
                </View>
                <Text style={styles.categoryDescription}>
                  {category === 'Normal'
                    ? 'You have a healthy weight!'
                    : category === 'Underweight'
                    ? 'You may be underweight. Consult a healthcare professional.'
                    : category === 'Overweight'
                    ? 'You may be overweight. Consider a healthy diet and exercise.'
                    : 'You may be in the obese range. Please consult a healthcare professional.'}
                </Text>
                {renderBMIChart()}
                <TouchableOpacity style={styles.resetButton} onPress={resetCalculator}>
                  <Text style={styles.resetButtonText}>Calculate Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* History Toggle */}
            {history.length > 0 && (
              <TouchableOpacity style={styles.historyButton} onPress={() => setShowHistory(true)}>
                <Text style={styles.historyButtonText}>View History ({history.length})</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            {/* History View */}
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>BMI History</Text>
              <View style={styles.historyActions}>
                <TouchableOpacity style={styles.deleteButton} onPress={deleteHistory}>
                  <Text style={styles.deleteButtonText}>Delete All</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.backButton} onPress={() => setShowHistory(false)}>
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              </View>
            </View>

            {history.map((record) => (
              <View key={record.id} style={styles.historyItem}>
                <View style={styles.historyItemHeader}>
                  <Text style={styles.historyDate}>
                    {new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString()}
                  </Text>
                  <View
                    style={[
                      styles.historyBadge,
                      { backgroundColor: getCategoryColor(record.category) },
                    ]}
                  >
                    <Text style={styles.historyBadgeText}>{record.category}</Text>
                  </View>
                </View>
                <View style={styles.historyDetails}>
                  <Text style={styles.historyBMI}>BMI: {record.bmi.toFixed(1)}</Text>
                  <Text style={styles.historyMeasurement}>
                    Height: {record.height.toFixed(1)} cm
                  </Text>
                  <Text style={styles.historyMeasurement}>
                    Weight: {record.weight.toFixed(1)} kg
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* AdMob Banner */}
      <View style={styles.adContainer}>
        <BannerAd unitId={TestIds.BANNER} size={BannerAdSize.BANNER} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  unitToggle: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 4,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  unitButtonActive: {
    backgroundColor: '#3B82F6',
  },
  unitButtonText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  unitButtonTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#334155',
  },
  feetInchesContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  feetInput: {
    flex: 1,
  },
  inchesInput: {
    flex: 1,
  },
  calculateButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  calculateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  bmiCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#0F172A',
  },
  bmiValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bmiLabel: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 4,
  },
  categoryBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 15,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoryDescription: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  chartContainer: {
    width: '100%',
    marginTop: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  chart: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
  },
  chartSection: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    bottom: -25,
    alignItems: 'center',
  },
  indicatorTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
  },
  indicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  resetButton: {
    backgroundColor: '#334155',
    borderRadius: 10,
    padding: 14,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  historyButton: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  historyButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  historyHeader: {
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  historyActions: {
    flexDirection: 'row',
    gap: 10,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  historyItem: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDate: {
    color: '#94A3B8',
    fontSize: 12,
  },
  historyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  historyDetails: {
    gap: 6,
  },
  historyBMI: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyMeasurement: {
    color: '#94A3B8',
    fontSize: 14,
  },
  adContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 5,
  },
});
