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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

type Gender = 'male' | 'female';
type Method = 'navy' | '3-site' | '7-site';

interface Measurements {
  age: string;
  height: string;
  weight: string;
  neck: string;
  waist: string;
  hip: string;
  chest: string;
  abdomen: string;
  thigh: string;
  tricep: string;
  suprailiac: string;
  midaxillary: string;
}

interface BodyFatRecord {
  id: string;
  bodyFat: number;
  category: string;
  gender: Gender;
  age: number;
  method: Method;
  date: string;
}

export default function App() {
  const [gender, setGender] = useState<Gender>('male');
  const [method, setMethod] = useState<Method>('navy');
  const [measurements, setMeasurements] = useState<Measurements>({
    age: '',
    height: '',
    weight: '',
    neck: '',
    waist: '',
    hip: '',
    chest: '',
    abdomen: '',
    thigh: '',
    tricep: '',
    suprailiac: '',
    midaxillary: '',
  });
  const [bodyFat, setBodyFat] = useState<number | null>(null);
  const [category, setCategory] = useState<string>('');
  const [history, setHistory] = useState<BodyFatRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('bodyfat_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const saveToHistory = async (bfValue: number, categoryValue: string) => {
    try {
      const record: BodyFatRecord = {
        id: Date.now().toString(),
        bodyFat: bfValue,
        category: categoryValue,
        gender,
        age: parseFloat(measurements.age),
        method,
        date: new Date().toISOString(),
      };

      const newHistory = [record, ...history].slice(0, 50);
      setHistory(newHistory);
      await AsyncStorage.setItem('bodyfat_history', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const calculateNavy = (): number | null => {
    const height = parseFloat(measurements.height);
    const neck = parseFloat(measurements.neck);
    const waist = parseFloat(measurements.waist);
    const hip = parseFloat(measurements.hip);

    if (isNaN(height) || isNaN(neck) || isNaN(waist)) {
      return null;
    }

    if (gender === 'male') {
      return 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
    } else {
      if (isNaN(hip)) return null;
      return (
        495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.221 * Math.log10(height)) - 450
      );
    }
  };

  const calculate3Site = (): number | null => {
    const age = parseFloat(measurements.age);
    const chest = parseFloat(measurements.chest);
    const abdomen = parseFloat(measurements.abdomen);
    const thigh = parseFloat(measurements.thigh);
    const tricep = parseFloat(measurements.tricep);
    const suprailiac = parseFloat(measurements.suprailiac);

    if (gender === 'male') {
      if (isNaN(chest) || isNaN(abdomen) || isNaN(thigh)) return null;
      const sum = chest + abdomen + thigh;
      const density = 1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * age;
      return (495 / density - 450);
    } else {
      if (isNaN(tricep) || isNaN(suprailiac) || isNaN(thigh)) return null;
      const sum = tricep + suprailiac + thigh;
      const density = 1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * age;
      return (495 / density - 450);
    }
  };

  const calculate7Site = (): number | null => {
    const age = parseFloat(measurements.age);
    const chest = parseFloat(measurements.chest);
    const abdomen = parseFloat(measurements.abdomen);
    const thigh = parseFloat(measurements.thigh);
    const tricep = parseFloat(measurements.tricep);
    const suprailiac = parseFloat(measurements.suprailiac);
    const midaxillary = parseFloat(measurements.midaxillary);

    if (isNaN(chest) || isNaN(abdomen) || isNaN(thigh) || isNaN(tricep) || isNaN(suprailiac) || isNaN(midaxillary)) {
      return null;
    }

    const sum = chest + abdomen + thigh + tricep + suprailiac + midaxillary;

    if (gender === 'male') {
      const density = 1.112 - 0.00043499 * sum + 0.00000055 * sum * sum - 0.00028826 * age;
      return (495 / density - 450);
    } else {
      const density = 1.097 - 0.00046971 * sum + 0.00000056 * sum * sum - 0.00012828 * age;
      return (495 / density - 450);
    }
  };

  const calculateBodyFat = () => {
    let result: number | null = null;

    switch (method) {
      case 'navy':
        result = calculateNavy();
        break;
      case '3-site':
        result = calculate3Site();
        break;
      case '7-site':
        result = calculate7Site();
        break;
    }

    if (result === null) {
      Alert.alert('Invalid Input', 'Please enter all required measurements');
      return;
    }

    const cat = getBodyFatCategory(result, gender, parseFloat(measurements.age));
    setBodyFat(result);
    setCategory(cat);
    saveToHistory(result, cat);
  };

  const getBodyFatCategory = (bf: number, gen: Gender, age: number): string => {
    if (gen === 'male') {
      if (bf < 6) return 'Essential Fat';
      if (bf < 14) return 'Athletes';
      if (bf < 18) return 'Fitness';
      if (bf < 25) return 'Average';
      return 'Obese';
    } else {
      if (bf < 14) return 'Essential Fat';
      if (bf < 21) return 'Athletes';
      if (bf < 25) return 'Fitness';
      if (bf < 32) return 'Average';
      return 'Obese';
    }
  };

  const getCategoryColor = (cat: string): string => {
    switch (cat) {
      case 'Essential Fat':
        return '#3B82F6';
      case 'Athletes':
        return '#10B981';
      case 'Fitness':
        return '#22C55E';
      case 'Average':
        return '#F59E0B';
      case 'Obese':
        return '#EF4444';
      default:
        return '#9CA3AF';
    }
  };

  const resetCalculator = () => {
    setMeasurements({
      age: '',
      height: '',
      weight: '',
      neck: '',
      waist: '',
      hip: '',
      chest: '',
      abdomen: '',
      thigh: '',
      tricep: '',
      suprailiac: '',
      midaxillary: '',
    });
    setBodyFat(null);
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
          await AsyncStorage.removeItem('bodyfat_history');
        },
      },
    ]);
  };

  const renderMeasurementInput = (label: string, field: keyof Measurements, placeholder: string) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#6B7280"
        keyboardType="numeric"
        value={measurements[field]}
        onChangeText={(value) => setMeasurements({ ...measurements, [field]: value })}
      />
    </View>
  );

  const getRequiredFields = (): string[] => {
    const common = ['Age', 'Height (cm)', 'Weight (kg)'];

    switch (method) {
      case 'navy':
        return [...common, 'Neck (cm)', 'Waist (cm)', gender === 'female' ? 'Hip (cm)' : ''];
      case '3-site':
        return [
          ...common,
          gender === 'male' ? 'Chest (mm)' : 'Tricep (mm)',
          gender === 'male' ? 'Abdomen (mm)' : 'Suprailiac (mm)',
          'Thigh (mm)',
        ];
      case '7-site':
        return [...common, 'Chest (mm)', 'Abdomen (mm)', 'Thigh (mm)', 'Tricep (mm)', 'Suprailiac (mm)', 'Midaxillary (mm)'];
      default:
        return common;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Body Fat Calculator</Text>
          <Text style={styles.subtitle}>Calculate your body composition</Text>
        </View>

        {!showHistory ? (
          <>
            {/* Gender Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gender</Text>
              <View style={styles.genderToggle}>
                <TouchableOpacity
                  style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                  onPress={() => setGender('male')}
                >
                  <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextActive]}>
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                  onPress={() => setGender('female')}
                >
                  <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextActive]}>
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Method Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Calculation Method</Text>
              <View style={styles.methodButtons}>
                <TouchableOpacity
                  style={[styles.methodButton, method === 'navy' && styles.methodButtonActive]}
                  onPress={() => setMethod('navy')}
                >
                  <Text style={[styles.methodButtonText, method === 'navy' && styles.methodButtonTextActive]}>
                    Navy
                  </Text>
                  <Text style={styles.methodDescription}>Simplest</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodButton, method === '3-site' && styles.methodButtonActive]}
                  onPress={() => setMethod('3-site')}
                >
                  <Text style={[styles.methodButtonText, method === '3-site' && styles.methodButtonTextActive]}>
                    3-Site
                  </Text>
                  <Text style={styles.methodDescription}>Moderate</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodButton, method === '7-site' && styles.methodButtonActive]}
                  onPress={() => setMethod('7-site')}
                >
                  <Text style={[styles.methodButtonText, method === '7-site' && styles.methodButtonTextActive]}>
                    7-Site
                  </Text>
                  <Text style={styles.methodDescription}>Most Accurate</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Basic Measurements */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              {renderMeasurementInput('Age', 'age', 'Enter age')}
              {renderMeasurementInput('Height', 'height', 'Enter height in cm')}
              {renderMeasurementInput('Weight', 'weight', 'Enter weight in kg')}
            </View>

            {/* Method-specific Measurements */}
            {method === 'navy' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Body Measurements (cm)</Text>
                {renderMeasurementInput('Neck Circumference', 'neck', 'Measure at the narrowest point')}
                {renderMeasurementInput('Waist Circumference', 'waist', 'Measure at navel level')}
                {gender === 'female' &&
                  renderMeasurementInput('Hip Circumference', 'hip', 'Measure at widest point')}
              </View>
            )}

            {method === '3-site' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Skinfold Measurements (mm)</Text>
                {gender === 'male' ? (
                  <>
                    {renderMeasurementInput('Chest', 'chest', 'Diagonal fold')}
                    {renderMeasurementInput('Abdomen', 'abdomen', 'Vertical fold')}
                    {renderMeasurementInput('Thigh', 'thigh', 'Vertical fold')}
                  </>
                ) : (
                  <>
                    {renderMeasurementInput('Tricep', 'tricep', 'Vertical fold')}
                    {renderMeasurementInput('Suprailiac', 'suprailiac', 'Diagonal fold')}
                    {renderMeasurementInput('Thigh', 'thigh', 'Vertical fold')}
                  </>
                )}
              </View>
            )}

            {method === '7-site' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Skinfold Measurements (mm)</Text>
                {renderMeasurementInput('Chest', 'chest', 'Diagonal fold')}
                {renderMeasurementInput('Abdomen', 'abdomen', 'Vertical fold')}
                {renderMeasurementInput('Thigh', 'thigh', 'Vertical fold')}
                {renderMeasurementInput('Tricep', 'tricep', 'Vertical fold')}
                {renderMeasurementInput('Suprailiac', 'suprailiac', 'Diagonal fold')}
                {renderMeasurementInput('Midaxillary', 'midaxillary', 'Horizontal fold')}
              </View>
            )}

            {/* Calculate Button */}
            <TouchableOpacity style={styles.calculateButton} onPress={calculateBodyFat}>
              <Text style={styles.calculateButtonText}>Calculate Body Fat</Text>
            </TouchableOpacity>

            {/* Results */}
            {bodyFat !== null && (
              <View style={styles.resultContainer}>
                <View style={[styles.resultCircle, { borderColor: getCategoryColor(category) }]}>
                  <Text style={styles.resultValue}>{bodyFat.toFixed(1)}%</Text>
                  <Text style={styles.resultLabel}>Body Fat</Text>
                </View>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(category) }]}>
                  <Text style={styles.categoryText}>{category}</Text>
                </View>
                <Text style={styles.interpretation}>
                  {category === 'Essential Fat'
                    ? 'Very low body fat. Essential for basic physiological functions.'
                    : category === 'Athletes'
                    ? 'Athletic level body fat. Great for performance and appearance.'
                    : category === 'Fitness'
                    ? 'Fitness level. Healthy and fit appearance.'
                    : category === 'Average'
                    ? 'Average body fat percentage. Room for improvement.'
                    : 'High body fat. Consider a healthier diet and exercise program.'}
                </Text>
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
              <Text style={styles.historyTitle}>Calculation History</Text>
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
                  <Text style={styles.historyBodyFat}>Body Fat: {record.bodyFat.toFixed(1)}%</Text>
                  <Text style={styles.historyMeta}>
                    {record.gender === 'male' ? 'Male' : 'Female'} • Age {record.age} • {record.method.toUpperCase()}
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
  genderToggle: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 4,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  genderButtonActive: {
    backgroundColor: '#3B82F6',
  },
  genderButtonText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  methodButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  methodButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
  },
  methodButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#1E3A5F',
  },
  methodButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  methodButtonTextActive: {
    color: '#3B82F6',
  },
  methodDescription: {
    color: '#6B7280',
    fontSize: 11,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 6,
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
  resultCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#0F172A',
  },
  resultValue: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resultLabel: {
    fontSize: 14,
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
  interpretation: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  resetButton: {
    backgroundColor: '#334155',
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
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
  historyBodyFat: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyMeta: {
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
