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
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Loan_Calculator_data';
const SAVED_LOANS_KEY = '@Saved_Loans_data';

interface LoanData {
  amount: number;
  rate: number;
  termMonths: number;
  monthlyPayment: number;
  totalInterest: number;
  totalAmount: number;
}

interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface SavedLoan {
  id: string;
  name: string;
  data: LoanData;
  createdAt: string;
}

export default function App() {
  const [loanAmount, setLoanAmount] = useState(10000);
  const [interestRate, setInterestRate] = useState(5);
  const [termYears, setTermYears] = useState(5);
  const [termMonths, setTermMonths] = useState(0);
  const [useYears, setUseYears] = useState(true);
  const [showAmortization, setShowAmortization] = useState(false);
  const [showSavedLoans, setShowSavedLoans] = useState(false);
  const [savedLoans, setSavedLoans] = useState<SavedLoan[]>([]);
  const [comparingLoans, setComparingLoans] = useState<LoanData[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [saveLoanName, setSaveLoanName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(SAVED_LOANS_KEY);
      if (saved) setSavedLoans(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveLoan = async () => {
    if (!saveLoanName.trim()) return;

    const currentLoan = calculateLoan();
    const newLoan: SavedLoan = {
      id: Date.now().toString(),
      name: saveLoanName,
      data: currentLoan,
      createdAt: new Date().toISOString(),
    };

    const updated = [newLoan, ...savedLoans];
    await AsyncStorage.setItem(SAVED_LOANS_KEY, JSON.stringify(updated));
    setSavedLoans(updated);
    setShowSaveModal(false);
    setSaveLoanName('');
  };

  const deleteSavedLoan = async (id: string) => {
    const updated = savedLoans.filter(l => l.id !== id);
    await AsyncStorage.setItem(SAVED_LOANS_KEY, JSON.stringify(updated));
    setSavedLoans(updated);
  };

  const getTotalTerm = (): number => {
    return useYears ? termYears * 12 : termMonths;
  };

  const calculateLoan = (): LoanData => {
    const P = loanAmount;
    const r = interestRate / 100 / 12;
    const n = getTotalTerm();

    if (P === 0 || r === 0 || n === 0) {
      return {
        amount: P,
        rate: interestRate,
        termMonths: n,
        monthlyPayment: 0,
        totalInterest: 0,
        totalAmount: 0,
      };
    }

    const monthlyPayment = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalAmount = monthlyPayment * n;
    const totalInterest = totalAmount - P;

    return {
      amount: P,
      rate: interestRate,
      termMonths: n,
      monthlyPayment,
      totalInterest,
      totalAmount,
    };
  };

  const generateAmortizationSchedule = (): AmortizationRow[] => {
    const loan = calculateLoan();
    const schedule: AmortizationRow[] = [];
    let balance = loan.amount;
    const r = loan.rate / 100 / 12;

    for (let month = 1; month <= loan.termMonths; month++) {
      const interestPayment = balance * r;
      const principalPayment = loan.monthlyPayment - interestPayment;
      balance -= principalPayment;

      schedule.push({
        month,
        payment: loan.monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance),
      });
    }

    return schedule;
  };

  const addToCompare = () => {
    if (comparingLoans.length >= 4) return;
    const loan = calculateLoan();
    setComparingLoans([...comparingLoans, loan]);

    const newCount = count + 1;
    setCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const removeFromCompare = (index: number) => {
    setComparingLoans(comparingLoans.filter((_, i) => i !== index));
  };

  const loan = calculateLoan();
  const amortization = generateAmortizationSchedule();

  const AmortizationRow = ({ item }: { item: AmortizationRow }) => (
    <View style={styles.amortRow}>
      <Text style={styles.amortMonth}>{item.month}</Text>
      <View style={styles.amortDetails}>
        <Text style={styles.amortLabel}>Payment: ${item.payment.toFixed(2)}</Text>
        <Text style={styles.amortLabel}>Principal: ${item.principal.toFixed(2)}</Text>
        <Text style={styles.amortLabel}>Interest: ${item.interest.toFixed(2)}</Text>
        <Text style={styles.amortBalance}>Balance: ${item.balance.toFixed(2)}</Text>
      </View>
    </View>
  );

  const CompareCard = ({ loan, index }: { loan: LoanData; index: number }) => (
    <View style={styles.compareCard}>
      <TouchableOpacity
        style={styles.removeCompare}
        onPress={() => removeFromCompare(index)}
      >
        <Text style={styles.removeText}>×</Text>
      </TouchableOpacity>
      <Text style={styles.compareTitle}>Loan {index + 1}</Text>
      <View style={styles.compareRow}>
        <Text style={styles.compareLabel}>Amount:</Text>
        <Text style={styles.compareValue}>${loan.amount.toLocaleString()}</Text>
      </View>
      <View style={styles.compareRow}>
        <Text style={styles.compareLabel}>Rate:</Text>
        <Text style={styles.compareValue}>{loan.rate.toFixed(2)}%</Text>
      </View>
      <View style={styles.compareRow}>
        <Text style={styles.compareLabel}>Term:</Text>
        <Text style={styles.compareValue}>{loan.termMonths} months</Text>
      </View>
      <View style={styles.compareDivider} />
      <View style={styles.compareRow}>
        <Text style={styles.compareLabel}>Monthly:</Text>
        <Text style={[styles.compareValue, styles.highlight]}>${loan.monthlyPayment.toFixed(2)}</Text>
      </View>
      <View style={styles.compareRow}>
        <Text style={styles.compareLabel}>Total Interest:</Text>
        <Text style={styles.compareValue}>${loan.totalInterest.toFixed(2)}</Text>
      </View>
      <View style={styles.compareRow}>
        <Text style={styles.compareLabel}>Total:</Text>
        <Text style={[styles.compareValue, styles.highlight]}>${loan.totalAmount.toFixed(2)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Loan Calculator</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowSavedLoans(true)}
          >
            <Text style={styles.headerBtnText}>Saved</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowCompare(true)}
          >
            <Text style={styles.headerBtnText}>Compare ({comparingLoans.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView>
        {/* Loan Amount */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Loan Amount</Text>
            <TextInput
              style={styles.valueInput}
              value={loanAmount.toString()}
              onChangeText={(text) => setLoanAmount(parseFloat(text) || 0)}
              keyboardType="decimal-pad"
              placeholderTextColor={colors.gray.medium}
            />
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1000}
            maximumValue={500000}
            step={1000}
            value={loanAmount}
            onValueChange={setLoanAmount}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.gray.light}
            thumbTintColor={colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>$1,000</Text>
            <Text style={styles.sliderLabel}>$500,000</Text>
          </View>
        </View>

        {/* Interest Rate */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Interest Rate (Annual)</Text>
            <TextInput
              style={styles.valueInput}
              value={interestRate.toFixed(2) + '%'}
              onChangeText={(text) => {
                const num = parseFloat(text.replace('%', ''));
                if (!isNaN(num)) setInterestRate(num);
              }}
              keyboardType="decimal-pad"
              placeholderTextColor={colors.gray.medium}
            />
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0.1}
            maximumValue={30}
            step={0.1}
            value={interestRate}
            onValueChange={setInterestRate}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.gray.light}
            thumbTintColor={colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>0.1%</Text>
            <Text style={styles.sliderLabel}>30%</Text>
          </View>
        </View>

        {/* Term Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>Loan Term</Text>
          <View style={styles.termToggle}>
            <TouchableOpacity
              style={[styles.termBtn, useYears && styles.termBtnActive]}
              onPress={() => setUseYears(true)}
            >
              <Text style={[styles.termBtnText, useYears && styles.termBtnTextActive]}>
                Years
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.termBtn, !useYears && styles.termBtnActive]}
              onPress={() => setUseYears(false)}
            >
              <Text style={[styles.termBtnText, !useYears && styles.termBtnTextActive]}>
                Months
              </Text>
            </TouchableOpacity>
          </View>

          {useYears ? (
            <>
              <View style={styles.labelRow}>
                <Text style={styles.sublabel}>Years</Text>
                <TextInput
                  style={styles.valueInput}
                  value={termYears.toString()}
                  onChangeText={(text) => setTermYears(parseInt(text) || 0)}
                  keyboardType="number-pad"
                  placeholderTextColor={colors.gray.medium}
                />
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={30}
                step={1}
                value={termYears}
                onValueChange={setTermYears}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.gray.light}
                thumbTintColor={colors.primary}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>1 year</Text>
                <Text style={styles.sliderLabel}>30 years</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.labelRow}>
                <Text style={styles.sublabel}>Months</Text>
                <TextInput
                  style={styles.valueInput}
                  value={termMonths.toString()}
                  onChangeText={(text) => setTermMonths(parseInt(text) || 0)}
                  keyboardType="number-pad"
                  placeholderTextColor={colors.gray.medium}
                />
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={360}
                step={1}
                value={termMonths}
                onValueChange={setTermMonths}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.gray.light}
                thumbTintColor={colors.primary}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>1 month</Text>
                <Text style={styles.sliderLabel}>360 months</Text>
              </View>
            </>
          )}
        </View>

        {/* Results */}
        <View style={styles.resultsCard}>
          <Text style={styles.resultsTitle}>Loan Summary</Text>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Loan Amount:</Text>
            <Text style={styles.resultValue}>${loan.amount.toLocaleString()}</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Interest Rate:</Text>
            <Text style={styles.resultValue}>{loan.rate.toFixed(2)}% per year</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Term:</Text>
            <Text style={styles.resultValue}>
              {loan.termMonths} months ({(loan.termMonths / 12).toFixed(1)} years)
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.resultRow}>
            <Text style={styles.resultLabelBig}>Monthly Payment:</Text>
            <Text style={styles.resultValueBig}>${loan.monthlyPayment.toFixed(2)}</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Total Interest:</Text>
            <Text style={[styles.resultValue, styles.interestText]}>
              ${loan.totalInterest.toFixed(2)}
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabelBig}>Total Amount to Repay:</Text>
            <Text style={styles.resultValueBig}>${loan.totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setShowAmortization(true)}
          >
            <Text style={styles.actionBtnText}>View Amortization Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            onPress={() => setShowSaveModal(true)}
          >
            <Text style={styles.actionBtnTextSecondary}>Save This Loan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            onPress={addToCompare}
            disabled={comparingLoans.length >= 4}
          >
            <Text style={styles.actionBtnTextSecondary}>
              Add to Compare {comparingLoans.length >= 4 && '(Max 4)'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <AdBanner />

      {/* Amortization Schedule Modal */}
      <Modal visible={showAmortization} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Amortization Schedule</Text>
            <TouchableOpacity onPress={() => setShowAmortization(false)}>
              <Text style={styles.closeBtn}>Close</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={amortization}
            keyExtractor={(item) => item.month.toString()}
            renderItem={({ item }) => <AmortizationRow item={item} />}
            contentContainerStyle={styles.amortList}
          />
        </SafeAreaView>
      </Modal>

      {/* Saved Loans Modal */}
      <Modal visible={showSavedLoans} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Saved Loans</Text>
            <TouchableOpacity onPress={() => setShowSavedLoans(false)}>
              <Text style={styles.closeBtn}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {savedLoans.length === 0 ? (
              <Text style={styles.emptyText}>No saved loans yet</Text>
            ) : (
              savedLoans.map((saved) => (
                <View key={saved.id} style={styles.savedLoanCard}>
                  <View style={styles.savedLoanHeader}>
                    <Text style={styles.savedLoanName}>{saved.name}</Text>
                    <TouchableOpacity onPress={() => deleteSavedLoan(saved.id)}>
                      <Text style={styles.deleteBtn}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.savedLoanDate}>
                    {new Date(saved.createdAt).toLocaleDateString()}
                  </Text>
                  <View style={styles.savedLoanDetails}>
                    <Text style={styles.savedLoanText}>
                      Amount: ${saved.data.amount.toLocaleString()}
                    </Text>
                    <Text style={styles.savedLoanText}>
                      Rate: {saved.data.rate.toFixed(2)}%
                    </Text>
                    <Text style={styles.savedLoanText}>
                      Term: {saved.data.termMonths} months
                    </Text>
                    <Text style={styles.savedLoanTextBold}>
                      Monthly: ${saved.data.monthlyPayment.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Compare Loans Modal */}
      <Modal visible={showCompare} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Compare Loans</Text>
            <TouchableOpacity onPress={() => setShowCompare(false)}>
              <Text style={styles.closeBtn}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal>
            <View style={styles.compareContainer}>
              {comparingLoans.length === 0 ? (
                <Text style={styles.emptyText}>No loans to compare</Text>
              ) : (
                comparingLoans.map((loan, index) => (
                  <CompareCard key={index} loan={loan} index={index} />
                ))
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Save Loan Modal */}
      <Modal visible={showSaveModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.saveModal}>
            <Text style={styles.saveModalTitle}>Save Loan</Text>
            <TextInput
              style={styles.saveInput}
              value={saveLoanName}
              onChangeText={setSaveLoanName}
              placeholder="Enter loan name..."
              placeholderTextColor={colors.gray.medium}
            />
            <View style={styles.saveButtons}>
              <TouchableOpacity
                style={[styles.saveBtn, styles.saveBtnCancel]}
                onPress={() => {
                  setShowSaveModal(false);
                  setSaveLoanName('');
                }}
              >
                <Text style={styles.saveBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, styles.saveBtnSave]}
                onPress={saveLoan}
              >
                <Text style={styles.saveBtnText}>Save</Text>
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
  headerButtons: { flexDirection: 'row', gap: spacing.sm },
  headerBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray.light,
    borderRadius: 8,
  },
  headerBtnText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  section: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: { fontSize: 16, fontWeight: '600', color: colors.text },
  sublabel: { fontSize: 14, fontWeight: '500', color: colors.text },
  valueInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    backgroundColor: colors.gray.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    minWidth: 120,
    textAlign: 'right',
  },
  slider: { width: '100%', height: 40 },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -spacing.sm,
  },
  sliderLabel: { fontSize: 12, color: colors.gray.dark },
  termToggle: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  termBtn: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.gray.light,
    borderRadius: 8,
    alignItems: 'center',
  },
  termBtnActive: { backgroundColor: colors.primary },
  termBtnText: { fontSize: 16, fontWeight: '600', color: colors.text },
  termBtnTextActive: { color: colors.white },
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
  resultLabel: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  resultValue: { fontSize: 14, color: colors.white, fontWeight: '600' },
  resultLabelBig: { fontSize: 16, fontWeight: '600', color: colors.white },
  resultValueBig: { fontSize: 20, fontWeight: 'bold', color: colors.secondary },
  interestText: { color: '#ff6b6b' },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: spacing.md,
  },
  actionButtons: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  actionBtn: {
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnSecondary: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  actionBtnTextSecondary: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
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
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  closeBtn: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  amortList: { padding: spacing.lg },
  amortRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  amortMonth: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginRight: spacing.md,
    minWidth: 40,
  },
  amortDetails: { flex: 1 },
  amortLabel: { fontSize: 12, color: colors.gray.dark, marginBottom: 2 },
  amortBalance: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacing.xl,
    fontSize: 16,
    color: colors.gray.medium,
  },
  savedLoanCard: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  savedLoanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  savedLoanName: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  deleteBtn: { fontSize: 14, color: colors.status.error, fontWeight: '600' },
  savedLoanDate: { fontSize: 12, color: colors.gray.dark, marginBottom: spacing.md },
  savedLoanDetails: { gap: spacing.xs },
  savedLoanText: { fontSize: 14, color: colors.gray.dark },
  savedLoanTextBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: spacing.sm,
  },
  compareContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  compareCard: {
    width: 280,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  removeCompare: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.status.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
  compareTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  compareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  compareLabel: { fontSize: 14, color: colors.gray.dark },
  compareValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  compareDivider: {
    height: 1,
    backgroundColor: colors.gray.light,
    marginVertical: spacing.md,
  },
  highlight: { color: colors.primary, fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveModal: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    width: '85%',
  },
  saveModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  saveInput: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  saveButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  saveBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnCancel: { backgroundColor: colors.gray.light },
  saveBtnSave: { backgroundColor: colors.primary },
  saveBtnText: { fontSize: 16, fontWeight: 'bold', color: colors.white },
  saveBtnTextCancel: { fontSize: 16, fontWeight: '600', color: colors.text },
});
