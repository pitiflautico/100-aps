import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  FlatList,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Tip_Calculator_data';
const HISTORY_KEY = '@Tip_History_data';

interface TipPreset {
  percentage: number;
  label: string;
}

interface CalculationHistory {
  id: string;
  billAmount: number;
  tipPercentage: number;
  tipAmount: number;
  total: number;
  numPeople: number;
  perPerson: number;
  timestamp: string;
}

const DEFAULT_PRESETS: TipPreset[] = [
  { percentage: 10, label: '10%' },
  { percentage: 15, label: '15%' },
  { percentage: 18, label: '18%' },
  { percentage: 20, label: '20%' },
  { percentage: 25, label: '25%' },
];

export default function App() {
  const [billAmount, setBillAmount] = useState('');
  const [tipPercentage, setTipPercentage] = useState(15);
  const [customTip, setCustomTip] = useState('');
  const [numPeople, setNumPeople] = useState(1);
  const [roundUp, setRoundUp] = useState(false);
  const [favoriteTip, setFavoriteTip] = useState(15);
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showCustomTip, setShowCustomTip] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedFav, savedHistory] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(HISTORY_KEY),
      ]);
      if (savedFav) setFavoriteTip(JSON.parse(savedFav));
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveFavoriteTip = async (tip: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tip));
      setFavoriteTip(tip);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const saveToHistory = async (calculation: Omit<CalculationHistory, 'id' | 'timestamp'>) => {
    const newEntry: CalculationHistory = {
      ...calculation,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    const updated = [newEntry, ...history].slice(0, 50); // Keep last 50
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  const clearHistory = async () => {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([]));
    setHistory([]);
  };

  const calculate = () => {
    const bill = parseFloat(billAmount) || 0;
    if (bill <= 0) return null;

    const tipPercent = tipPercentage;
    let tipAmount = bill * (tipPercent / 100);
    let total = bill + tipAmount;

    if (roundUp) {
      total = Math.ceil(total);
      tipAmount = total - bill;
    }

    const perPerson = total / numPeople;

    return {
      billAmount: bill,
      tipPercentage: tipPercent,
      tipAmount,
      total,
      perPerson,
      numPeople,
    };
  };

  const result = calculate();

  const handleSaveCalculation = () => {
    if (result) {
      saveToHistory(result);
      const newCount = count + 1;
      setCount(newCount);
      if (newCount % 5 === 0) showInterstitialAd();
    }
  };

  const applyCustomTip = () => {
    const custom = parseFloat(customTip);
    if (!isNaN(custom) && custom >= 0 && custom <= 100) {
      setTipPercentage(custom);
      setShowCustomTip(false);
      setCustomTip('');
    }
  };

  const PresetButton = ({ preset }: { preset: TipPreset }) => (
    <TouchableOpacity
      style={[
        styles.presetBtn,
        tipPercentage === preset.percentage && styles.presetBtnActive,
      ]}
      onPress={() => setTipPercentage(preset.percentage)}
    >
      <Text
        style={[
          styles.presetText,
          tipPercentage === preset.percentage && styles.presetTextActive,
        ]}
      >
        {preset.label}
      </Text>
    </TouchableOpacity>
  );

  const HistoryItem = ({ item }: { item: CalculationHistory }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyDate}>
          {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.historyTotal}>${item.total.toFixed(2)}</Text>
      </View>
      <View style={styles.historyDetails}>
        <Text style={styles.historyText}>Bill: ${item.billAmount.toFixed(2)}</Text>
        <Text style={styles.historyText}>Tip: {item.tipPercentage}% (${item.tipAmount.toFixed(2)})</Text>
        {item.numPeople > 1 && (
          <Text style={styles.historyText}>
            Split {item.numPeople} ways: ${item.perPerson.toFixed(2)} each
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Tip Calculator</Text>
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => setShowHistory(true)}
        >
          <Text style={styles.historyBtnText}>History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Bill Amount */}
        <View style={styles.section}>
          <Text style={styles.label}>Bill Amount</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.billInput}
              value={billAmount}
              onChangeText={setBillAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.gray.medium}
            />
          </View>
        </View>

        {/* Tip Percentage */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Tip Percentage</Text>
            <TouchableOpacity
              onPress={() => saveFavoriteTip(tipPercentage)}
            >
              <Text style={styles.favoriteText}>
                {tipPercentage === favoriteTip ? '⭐ Favorite' : 'Set as Favorite'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Presets */}
          <View style={styles.presetsRow}>
            {DEFAULT_PRESETS.map((preset) => (
              <PresetButton key={preset.percentage} preset={preset} />
            ))}
          </View>

          {/* Custom & Favorite */}
          <View style={styles.customRow}>
            <TouchableOpacity
              style={styles.customBtn}
              onPress={() => setShowCustomTip(true)}
            >
              <Text style={styles.customBtnText}>Custom</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.customBtn,
                tipPercentage === favoriteTip && styles.customBtnActive,
              ]}
              onPress={() => setTipPercentage(favoriteTip)}
            >
              <Text
                style={[
                  styles.customBtnText,
                  tipPercentage === favoriteTip && styles.customBtnTextActive,
                ]}
              >
                Favorite: {favoriteTip}%
              </Text>
            </TouchableOpacity>
          </View>

          {/* Current Selection */}
          <View style={styles.currentTip}>
            <Text style={styles.currentTipText}>Selected: {tipPercentage}%</Text>
          </View>
        </View>

        {/* Number of People */}
        <View style={styles.section}>
          <Text style={styles.label}>Split Bill</Text>
          <View style={styles.peopleRow}>
            <TouchableOpacity
              style={styles.peopleBtn}
              onPress={() => setNumPeople(Math.max(1, numPeople - 1))}
            >
              <Text style={styles.peopleBtnText}>-</Text>
            </TouchableOpacity>
            <View style={styles.peopleDisplay}>
              <Text style={styles.peopleNumber}>{numPeople}</Text>
              <Text style={styles.peopleLabel}>
                {numPeople === 1 ? 'person' : 'people'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.peopleBtn}
              onPress={() => setNumPeople(Math.min(99, numPeople + 1))}
            >
              <Text style={styles.peopleBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Round Up Option */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.roundUpRow}
            onPress={() => setRoundUp(!roundUp)}
          >
            <View>
              <Text style={styles.label}>Round Up Total</Text>
              <Text style={styles.roundUpDesc}>
                Round total to nearest dollar
              </Text>
            </View>
            <View style={[styles.checkbox, roundUp && styles.checkboxActive]}>
              {roundUp && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
        </View>

        {/* Results */}
        {result && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>Calculation</Text>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Bill Amount:</Text>
              <Text style={styles.resultValue}>${result.billAmount.toFixed(2)}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Tip ({result.tipPercentage}%):</Text>
              <Text style={[styles.resultValue, styles.tipValue]}>
                ${result.tipAmount.toFixed(2)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.resultRow}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalValue}>${result.total.toFixed(2)}</Text>
            </View>

            {numPeople > 1 && (
              <>
                <View style={styles.divider} />
                <View style={styles.resultRow}>
                  <Text style={styles.totalLabel}>Per Person:</Text>
                  <Text style={styles.totalValue}>${result.perPerson.toFixed(2)}</Text>
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveCalculation}
            >
              <Text style={styles.saveBtnText}>Save to History</Text>
            </TouchableOpacity>
          </View>
        )}

        {!result && billAmount && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Enter a valid bill amount</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <AdBanner />

      {/* Custom Tip Modal */}
      <Modal visible={showCustomTip} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.customModal}>
            <Text style={styles.customModalTitle}>Custom Tip %</Text>
            <TextInput
              style={styles.customInput}
              value={customTip}
              onChangeText={setCustomTip}
              placeholder="Enter percentage (0-100)"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.gray.medium}
            />
            <View style={styles.customButtons}>
              <TouchableOpacity
                style={[styles.customModalBtn, styles.customModalBtnCancel]}
                onPress={() => {
                  setShowCustomTip(false);
                  setCustomTip('');
                }}
              >
                <Text style={styles.customModalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.customModalBtn, styles.customModalBtnSave]}
                onPress={applyCustomTip}
              >
                <Text style={styles.customModalBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal visible={showHistory} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Calculation History</Text>
            <View style={styles.modalHeaderButtons}>
              {history.length > 0 && (
                <TouchableOpacity onPress={clearHistory}>
                  <Text style={styles.clearBtn}>Clear All</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Text style={styles.closeBtn}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>

          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No calculations yet</Text>
              <Text style={styles.emptySubtext}>
                Your tip calculations will appear here
              </Text>
            </View>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <HistoryItem item={item} />}
              contentContainerStyle={styles.historyList}
            />
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
  historyBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  historyBtnText: { fontSize: 14, color: colors.white, fontWeight: '600' },
  section: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  label: { fontSize: 16, fontWeight: '600', color: colors.text },
  favoriteText: { fontSize: 14, color: colors.secondary, fontWeight: '600' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  dollarSign: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginRight: spacing.sm,
  },
  billInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    paddingVertical: spacing.lg,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetBtn: {
    flex: 1,
    minWidth: '30%',
    padding: spacing.md,
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    alignItems: 'center',
  },
  presetBtnActive: {
    backgroundColor: colors.primary,
  },
  presetText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  presetTextActive: {
    color: colors.white,
  },
  customRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  customBtn: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    alignItems: 'center',
  },
  customBtnActive: {
    backgroundColor: colors.secondary,
  },
  customBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  customBtnTextActive: {
    color: colors.white,
  },
  currentTip: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: 8,
    alignItems: 'center',
  },
  currentTipText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  peopleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  peopleBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  peopleBtnText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
  },
  peopleDisplay: {
    alignItems: 'center',
    minWidth: 100,
  },
  peopleNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
  },
  peopleLabel: {
    fontSize: 14,
    color: colors.gray.dark,
    marginTop: spacing.xs,
  },
  roundUpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roundUpDesc: {
    fontSize: 12,
    color: colors.gray.dark,
    marginTop: spacing.xs,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.gray.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  resultsCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.md,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  resultLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  tipValue: {
    color: colors.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: spacing.md,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  saveBtn: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray.medium,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray.dark,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customModal: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    width: '85%',
  },
  customModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  customInput: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  customButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  customModalBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  customModalBtnCancel: {
    backgroundColor: colors.gray.light,
  },
  customModalBtnSave: {
    backgroundColor: colors.primary,
  },
  customModalBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  customModalBtnTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
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
  modalHeaderButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  clearBtn: {
    fontSize: 14,
    color: colors.status.error,
    fontWeight: '600',
  },
  closeBtn: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  historyList: {
    padding: spacing.lg,
  },
  historyCard: {
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
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  historyDate: {
    fontSize: 12,
    color: colors.gray.dark,
  },
  historyTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  historyDetails: {
    gap: spacing.xs,
  },
  historyText: {
    fontSize: 14,
    color: colors.text,
  },
});
