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
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const HISTORY_KEY = '@Currency_Converter_History';
const RATES_KEY = '@Currency_Rates';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rate: number;
}

interface ConversionHistory {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  result: number;
  timestamp: string;
}

const DEFAULT_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', rate: 1.0 },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', rate: 0.92 },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', rate: 0.79 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', rate: 149.50 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', rate: 7.24 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$', flag: '🇨🇦', rate: 1.36 },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$', flag: '🇦🇺', rate: 1.54 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭', rate: 0.88 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', rate: 83.12 },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽', rate: 17.05 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', rate: 4.97 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', rate: 18.75 },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺', rate: 92.50 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', rate: 1320.50 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: '$', flag: '🇸🇬', rate: 1.35 },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: '$', flag: '🇭🇰', rate: 7.82 },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', rate: 10.85 },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', rate: 10.95 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: '$', flag: '🇳🇿', rate: 1.67 },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', rate: 28.75 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', rate: 3.67 },
];

export default function App() {
  const [currencies, setCurrencies] = useState<Currency[]>(DEFAULT_CURRENCIES);
  const [fromCurrency, setFromCurrency] = useState(currencies[0]);
  const [toCurrency, setToCurrency] = useState(currencies[1]);
  const [amount, setAmount] = useState('');
  const [history, setHistory] = useState<ConversionHistory[]>([]);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showRateUpdate, setShowRateUpdate] = useState(false);
  const [editingRate, setEditingRate] = useState<Currency | null>(null);
  const [newRate, setNewRate] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());
  const [count, setCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedHistory, savedRates, savedDate] = await Promise.all([
        AsyncStorage.getItem(HISTORY_KEY),
        AsyncStorage.getItem(RATES_KEY),
        AsyncStorage.getItem(RATES_KEY + '_date'),
      ]);
      
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      if (savedRates) {
        const rates = JSON.parse(savedRates);
        setCurrencies(rates);
        setFromCurrency(rates[0]);
        setToCurrency(rates[1]);
      }
      if (savedDate) setLastUpdated(savedDate);
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveRates = async (rates: Currency[]) => {
    try {
      const now = new Date().toISOString();
      await AsyncStorage.setItem(RATES_KEY, JSON.stringify(rates));
      await AsyncStorage.setItem(RATES_KEY + '_date', now);
      setCurrencies(rates);
      setLastUpdated(now);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const saveToHistory = async (conversion: Omit<ConversionHistory, 'id' | 'timestamp'>) => {
    const entry: ConversionHistory = {
      ...conversion,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    
    const updated = [entry, ...history].slice(0, 100);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  const convert = (): number => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) return 0;

    const fromRate = fromCurrency.rate;
    const toRate = toCurrency.rate;
    
    const usdAmount = value / fromRate;
    return usdAmount * toRate;
  };

  const result = convert();

  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const handleConvert = () => {
    if (result > 0) {
      saveToHistory({
        fromCurrency: fromCurrency.code,
        toCurrency: toCurrency.code,
        amount: parseFloat(amount),
        result,
      });

      const newCount = count + 1;
      setCount(newCount);
      if (newCount % 5 === 0) showInterstitialAd();
    }
  };

  const updateRate = () => {
    if (!editingRate || !newRate) return;

    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate <= 0) return;

    const updated = currencies.map(c =>
      c.code === editingRate.code ? { ...c, rate } : c
    );

    saveRates(updated);
    setShowRateUpdate(false);
    setEditingRate(null);
    setNewRate('');
  };

  const POPULAR = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD'];

  const CurrencyPicker = ({
    visible,
    onClose,
    onSelect,
    current,
  }: {
    visible: boolean;
    onClose: () => void;
    onSelect: (currency: Currency) => void;
    current: Currency;
  }) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.pickerModal}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Currency</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.popularSection}>
            <Text style={styles.popularTitle}>Popular</Text>
            <View style={styles.popularGrid}>
              {currencies.filter(c => POPULAR.includes(c.code)).map(currency => (
                <TouchableOpacity
                  key={currency.code}
                  style={styles.popularBtn}
                  onPress={() => {
                    onSelect(currency);
                    onClose();
                  }}
                >
                  <Text style={styles.popularFlag}>{currency.flag}</Text>
                  <Text style={styles.popularCode}>{currency.code}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <ScrollView>
            {currencies.map(currency => (
              <TouchableOpacity
                key={currency.code}
                style={[
                  styles.currencyOption,
                  currency.code === current.code && styles.currencyOptionActive,
                ]}
                onPress={() => {
                  onSelect(currency);
                  onClose();
                }}
              >
                <View style={styles.currencyLeft}>
                  <Text style={styles.currencyFlag}>{currency.flag}</Text>
                  <View>
                    <Text style={[
                      styles.currencyCode,
                      currency.code === current.code && styles.currencyTextActive,
                    ]}>
                      {currency.code}
                    </Text>
                    <Text style={styles.currencyName}>{currency.name}</Text>
                  </View>
                </View>
                <Text style={[
                  styles.currencyRate,
                  currency.code === current.code && styles.currencyTextActive,
                ]}>
                  {currency.rate.toFixed(4)}
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
        <Text style={styles.title}>Currency Converter</Text>
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => setShowHistory(true)}
        >
          <Text style={styles.historyBtnText}>History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Last Updated */}
        <View style={styles.updateInfo}>
          <Text style={styles.updateText}>
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </Text>
          <TouchableOpacity onPress={() => setShowRateUpdate(true)}>
            <Text style={styles.updateBtn}>Update Rates</Text>
          </TouchableOpacity>
        </View>

        {/* From Currency */}
        <View style={styles.section}>
          <Text style={styles.label}>From</Text>
          <TouchableOpacity
            style={styles.currencySelector}
            onPress={() => setShowFromPicker(true)}
          >
            <View style={styles.currencySelectorLeft}>
              <Text style={styles.selectorFlag}>{fromCurrency.flag}</Text>
              <View>
                <Text style={styles.selectorCode}>{fromCurrency.code}</Text>
                <Text style={styles.selectorName}>{fromCurrency.name}</Text>
              </View>
            </View>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            placeholderTextColor={colors.gray.medium}
          />
        </View>

        {/* Swap Button */}
        <View style={styles.swapContainer}>
          <TouchableOpacity style={styles.swapBtn} onPress={swapCurrencies}>
            <Text style={styles.swapText}>⇅</Text>
          </TouchableOpacity>
        </View>

        {/* To Currency */}
        <View style={styles.section}>
          <Text style={styles.label}>To</Text>
          <TouchableOpacity
            style={styles.currencySelector}
            onPress={() => setShowToPicker(true)}
          >
            <View style={styles.currencySelectorLeft}>
              <Text style={styles.selectorFlag}>{toCurrency.flag}</Text>
              <View>
                <Text style={styles.selectorCode}>{toCurrency.code}</Text>
                <Text style={styles.selectorName}>{toCurrency.name}</Text>
              </View>
            </View>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>

          <View style={styles.resultBox}>
            <Text style={styles.resultValue}>
              {result.toFixed(2)}
            </Text>
            <Text style={styles.resultCurrency}>{toCurrency.code}</Text>
          </View>
        </View>

        {/* Exchange Rate */}
        {amount && parseFloat(amount) > 0 && (
          <View style={styles.rateInfo}>
            <Text style={styles.rateText}>
              1 {fromCurrency.code} = {(toCurrency.rate / fromCurrency.rate).toFixed(4)} {toCurrency.code}
            </Text>
            <Text style={styles.rateText}>
              1 {toCurrency.code} = {(fromCurrency.rate / toCurrency.rate).toFixed(4)} {fromCurrency.code}
            </Text>
          </View>
        )}

        {/* Convert Button */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.convertBtn}
            onPress={handleConvert}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            <Text style={styles.convertBtnText}>Save to History</Text>
          </TouchableOpacity>
        </View>

        {/* Popular Conversions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickGrid}>
            {POPULAR.map(code => {
              const currency = currencies.find(c => c.code === code);
              if (!currency) return null;
              return (
                <TouchableOpacity
                  key={code}
                  style={styles.quickCard}
                  onPress={() => setToCurrency(currency)}
                >
                  <Text style={styles.quickFlag}>{currency.flag}</Text>
                  <Text style={styles.quickCode}>{currency.code}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <AdBanner />

      {/* Currency Pickers */}
      <CurrencyPicker
        visible={showFromPicker}
        onClose={() => setShowFromPicker(false)}
        onSelect={setFromCurrency}
        current={fromCurrency}
      />

      <CurrencyPicker
        visible={showToPicker}
        onClose={() => setShowToPicker(false)}
        onSelect={setToCurrency}
        current={toCurrency}
      />

      {/* History Modal */}
      <Modal visible={showHistory} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Conversion History</Text>
            <TouchableOpacity onPress={() => setShowHistory(false)}>
              <Text style={styles.closeBtn}>Close</Text>
            </TouchableOpacity>
          </View>

          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No conversions yet</Text>
            </View>
          ) : (
            <FlatList
              data={history}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>
                      {new Date(item.timestamp).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.historyDetails}>
                    <Text style={styles.historyAmount}>
                      {item.amount.toFixed(2)} {item.fromCurrency}
                    </Text>
                    <Text style={styles.historyArrow}>→</Text>
                    <Text style={styles.historyResult}>
                      {item.result.toFixed(2)} {item.toCurrency}
                    </Text>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.historyList}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Rate Update Modal */}
      <Modal visible={showRateUpdate} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Exchange Rates</Text>
            <TouchableOpacity onPress={() => setShowRateUpdate(false)}>
              <Text style={styles.closeBtn}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.ratesList}>
            {currencies.map(currency => (
              <View key={currency.code} style={styles.rateCard}>
                <View style={styles.rateCardLeft}>
                  <Text style={styles.rateFlag}>{currency.flag}</Text>
                  <View>
                    <Text style={styles.rateCode}>{currency.code}</Text>
                    <Text style={styles.rateName}>{currency.name}</Text>
                  </View>
                </View>
                <View style={styles.rateCardRight}>
                  <Text style={styles.currentRate}>{currency.rate.toFixed(4)}</Text>
                  <TouchableOpacity
                    style={styles.editRateBtn}
                    onPress={() => {
                      setEditingRate(currency);
                      setNewRate(currency.rate.toString());
                    }}
                  >
                    <Text style={styles.editRateBtnText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Rate Modal */}
      <Modal visible={!!editingRate} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <Text style={styles.editModalTitle}>
              Update {editingRate?.code} Rate
            </Text>
            <Text style={styles.editModalSubtitle}>
              Enter rate relative to 1 USD
            </Text>
            <TextInput
              style={styles.editInput}
              value={newRate}
              onChangeText={setNewRate}
              placeholder="0.0000"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.gray.medium}
            />
            <View style={styles.editButtons}>
              <TouchableOpacity
                style={[styles.editBtn, styles.editBtnCancel]}
                onPress={() => {
                  setEditingRate(null);
                  setNewRate('');
                }}
              >
                <Text style={styles.editBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBtn, styles.editBtnSave]}
                onPress={updateRate}
              >
                <Text style={styles.editBtnText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  updateInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray.light,
  },
  updateText: { fontSize: 12, color: colors.gray.dark },
  updateBtn: { fontSize: 12, color: colors.primary, fontWeight: '600' },
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
  currencySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  currencySelectorLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  selectorFlag: { fontSize: 32 },
  selectorCode: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  selectorName: { fontSize: 12, color: colors.gray.dark },
  selectorArrow: { fontSize: 16, color: colors.gray.dark },
  input: {
    fontSize: 32,
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
  swapText: { fontSize: 32, color: colors.white },
  resultBox: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
  },
  resultCurrency: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
  },
  rateInfo: {
    padding: spacing.lg,
    backgroundColor: colors.accent,
    marginHorizontal: spacing.lg,
    borderRadius: 12,
    gap: spacing.xs,
  },
  rateText: {
    fontSize: 14,
    color: colors.white,
    textAlign: 'center',
  },
  actionButtons: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  convertBtn: {
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  convertBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickCard: {
    width: '31%',
    padding: spacing.md,
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickFlag: { fontSize: 32, marginBottom: spacing.xs },
  quickCode: { fontSize: 14, fontWeight: '600', color: colors.text },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  pickerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  closeBtn: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  popularSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  popularTitle: { fontSize: 14, fontWeight: '600', color: colors.gray.dark, marginBottom: spacing.md },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  popularBtn: {
    padding: spacing.md,
    backgroundColor: colors.gray.light,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 70,
  },
  popularFlag: { fontSize: 24, marginBottom: spacing.xs },
  popularCode: { fontSize: 12, fontWeight: '600', color: colors.text },
  currencyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  currencyOptionActive: { backgroundColor: colors.primary },
  currencyLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  currencyFlag: { fontSize: 28 },
  currencyCode: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  currencyName: { fontSize: 12, color: colors.gray.dark, marginTop: 2 },
  currencyRate: { fontSize: 14, fontWeight: '600', color: colors.gray.dark },
  currencyTextActive: { color: colors.white },
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
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: { fontSize: 16, color: colors.gray.medium },
  historyList: { padding: spacing.lg },
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
  historyHeader: { marginBottom: spacing.sm },
  historyDate: { fontSize: 12, color: colors.gray.dark },
  historyDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  historyAmount: { fontSize: 16, fontWeight: '600', color: colors.text },
  historyArrow: { fontSize: 20, color: colors.primary },
  historyResult: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  ratesList: { padding: spacing.lg },
  rateCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  rateCardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rateFlag: { fontSize: 28 },
  rateCode: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  rateName: { fontSize: 12, color: colors.gray.dark },
  rateCardRight: { alignItems: 'flex-end', gap: spacing.xs },
  currentRate: { fontSize: 16, fontWeight: '600', color: colors.primary },
  editRateBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.gray.light,
    borderRadius: 6,
  },
  editRateBtnText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  editModal: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    margin: spacing.xl,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  editModalSubtitle: {
    fontSize: 14,
    color: colors.gray.dark,
    marginBottom: spacing.lg,
  },
  editInput: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  editButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  editBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  editBtnCancel: { backgroundColor: colors.gray.light },
  editBtnSave: { backgroundColor: colors.primary },
  editBtnText: { fontSize: 16, fontWeight: 'bold', color: colors.white },
  editBtnTextCancel: { fontSize: 16, fontWeight: '600', color: colors.text },
});
