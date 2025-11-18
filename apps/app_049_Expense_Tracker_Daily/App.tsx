import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Expense_Tracker_data';
const CATEGORIES_KEY = '@Expense_Categories_data';

type PeriodType = 'daily' | 'weekly' | 'monthly';

interface Expense {
  id: string;
  amount: number;
  category: string;
  note: string;
  date: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  budget?: number;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Food', color: '#e74c3c', icon: '🍔', budget: 300 },
  { id: '2', name: 'Transport', color: '#3498db', icon: '🚗', budget: 150 },
  { id: '3', name: 'Shopping', color: '#9b59b6', icon: '🛍️', budget: 200 },
  { id: '4', name: 'Entertainment', color: '#f39c12', icon: '🎮', budget: 100 },
  { id: '5', name: 'Bills', color: '#e67e22', icon: '📄', budget: 400 },
  { id: '6', name: 'Other', color: '#95a5a6', icon: '💰', budget: 150 },
];

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [period, setPeriod] = useState<PeriodType>('daily');
  const [count, setCount] = useState(0);

  // Quick entry states
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [note, setNote] = useState('');

  // Category form
  const [categoryName, setCategoryName] = useState('');
  const [categoryBudget, setCategoryBudget] = useState('');
  const [categoryColor, setCategoryColor] = useState('#3498db');
  const [categoryIcon, setCategoryIcon] = useState('💰');

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedExpenses, savedCategories] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(CATEGORIES_KEY),
      ]);
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
      if (savedCategories) setCategories(JSON.parse(savedCategories));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveExpenses = async (data: Expense[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setExpenses(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const saveCategories = async (data: Category[]) => {
    try {
      await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(data));
      setCategories(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const quickAddExpense = (category: string, quickAmount?: number) => {
    const expenseAmount = quickAmount || parseFloat(amount);
    if (!expenseAmount || expenseAmount <= 0) return;

    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: expenseAmount,
      category,
      note,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    saveExpenses([newExpense, ...expenses]);
    setAmount('');
    setNote('');

    const newCount = count + 1;
    setCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const deleteExpense = (id: string) => {
    saveExpenses(expenses.filter((e) => e.id !== id));
  };

  const addCategory = () => {
    if (!categoryName.trim()) return;

    const newCategory: Category = {
      id: Date.now().toString(),
      name: categoryName,
      color: categoryColor,
      icon: categoryIcon,
      budget: categoryBudget ? parseFloat(categoryBudget) : undefined,
    };

    saveCategories([...categories, newCategory]);
    setShowCategoryModal(false);
    resetCategoryForm();
  };

  const resetCategoryForm = () => {
    setCategoryName('');
    setCategoryBudget('');
    setCategoryColor('#3498db');
    setCategoryIcon('💰');
  };

  const getDateRange = (type: PeriodType): { start: Date; end: Date } => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    let start = new Date(now);
    switch (type) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
    }
    return { start, end };
  };

  const getPeriodData = () => {
    const { start, end } = getDateRange(period);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const periodExpenses = expenses.filter(
      (e) => e.date >= startStr && e.date <= endStr
    );

    const total = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

    const categoryTotals = categories.map((cat) => {
      const categoryExpenses = periodExpenses.filter((e) => e.category === cat.name);
      const spent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      const percentage = total > 0 ? (spent / total) * 100 : 0;
      return {
        ...cat,
        spent,
        percentage,
        count: categoryExpenses.length,
      };
    }).sort((a, b) => b.spent - a.spent);

    return {
      total,
      expenses: periodExpenses,
      categoryTotals,
      average: periodExpenses.length > 0 ? total / periodExpenses.length : 0,
    };
  };

  const exportData = async () => {
    const data = getPeriodData();
    const periodName = period.charAt(0).toUpperCase() + period.slice(1);

    let csv = `Expense Tracker - ${periodName} Report\n\n`;
    csv += `Total Spent: $${data.total.toFixed(2)}\n`;
    csv += `Transactions: ${data.expenses.length}\n`;
    csv += `Average: $${data.average.toFixed(2)}\n\n`;

    csv += `Category Breakdown:\n`;
    csv += `Category,Amount,Percentage,Transactions\n`;
    data.categoryTotals.forEach((cat) => {
      if (cat.spent > 0) {
        csv += `${cat.name},$${cat.spent.toFixed(2)},${cat.percentage.toFixed(1)}%,${cat.count}\n`;
      }
    });

    csv += `\nDetailed Transactions:\n`;
    csv += `Date,Category,Amount,Note\n`;
    data.expenses.forEach((exp) => {
      csv += `${exp.date},${exp.category},$${exp.amount.toFixed(2)},"${exp.note}"\n`;
    });

    try {
      await Share.share({
        message: csv,
        title: `Expense Report - ${periodName}`,
      });
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const data = getPeriodData();

  const CategoryChart = ({ item }: { item: typeof data.categoryTotals[0] }) => {
    if (item.spent === 0) return null;

    return (
      <View style={styles.chartItem}>
        <View style={styles.chartLeft}>
          <Text style={styles.chartIcon}>{item.icon}</Text>
          <View style={styles.chartInfo}>
            <Text style={styles.chartName}>{item.name}</Text>
            <Text style={styles.chartCount}>{item.count} transactions</Text>
          </View>
        </View>
        <View style={styles.chartRight}>
          <Text style={styles.chartAmount}>${item.spent.toFixed(2)}</Text>
          <View style={styles.chartBarContainer}>
            <View
              style={[
                styles.chartBar,
                { width: `${item.percentage}%`, backgroundColor: item.color },
              ]}
            />
          </View>
          <Text style={styles.chartPercent}>{item.percentage.toFixed(1)}%</Text>
        </View>
      </View>
    );
  };

  const ExpenseItem = ({ item }: { item: Expense }) => {
    const category = categories.find((c) => c.name === item.category);

    return (
      <TouchableOpacity
        style={styles.expenseCard}
        onLongPress={() => {
          Alert.alert('Delete Expense', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(item.id) },
          ]);
        }}
      >
        <View style={styles.expenseLeft}>
          <View style={[styles.expenseIcon, { backgroundColor: category?.color || '#95a5a6' }]}>
            <Text style={styles.expenseEmoji}>{category?.icon || '💰'}</Text>
          </View>
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseCategory}>{item.category}</Text>
            {item.note && <Text style={styles.expenseNote}>{item.note}</Text>}
            <Text style={styles.expenseDate}>{item.date}</Text>
          </View>
        </View>
        <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
      </TouchableOpacity>
    );
  };

  const COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#95a5a6'];
  const ICONS = ['💰', '🍔', '🚗', '🎮', '🛍️', '📄', '💊', '🏠', '✈️', '📚', '☕', '🎬'];
  const QUICK_AMOUNTS = [5, 10, 20, 50];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Expense Tracker</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => setShowCategoryModal(true)} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>+Cat</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={exportData} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['daily', 'weekly', 'monthly'] as PeriodType[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            {period === 'daily' ? "Today's" : period === 'weekly' ? "This Week's" : "This Month's"} Total
          </Text>
          <Text style={styles.summaryTotal}>${data.total.toFixed(2)}</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Transactions</Text>
              <Text style={styles.summaryStatValue}>{data.expenses.length}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Average</Text>
              <Text style={styles.summaryStatValue}>${data.average.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Quick Entry */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.quickEntry}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="Amount"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.gray.medium}
            />
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Note (optional)"
              placeholderTextColor={colors.gray.medium}
            />
          </View>

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmounts}>
            {QUICK_AMOUNTS.map((amt) => (
              <TouchableOpacity
                key={amt}
                style={styles.quickAmountBtn}
                onPress={() => setAmount(amt.toString())}
              >
                <Text style={styles.quickAmountText}>${amt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Category Quick Buttons */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryButtons}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryBtn, { backgroundColor: cat.color }]}
                onPress={() => {
                  setSelectedCategory(cat.name);
                  quickAddExpense(cat.name);
                }}
              >
                <Text style={styles.categoryBtnIcon}>{cat.icon}</Text>
                <Text style={styles.categoryBtnText}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Category Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Breakdown by Category</Text>
          {data.categoryTotals.filter((c) => c.spent > 0).length === 0 ? (
            <Text style={styles.empty}>No expenses in this period</Text>
          ) : (
            data.categoryTotals.map((cat) => <CategoryChart key={cat.id} item={cat} />)
          )}
        </View>

        {/* Recent Expenses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Expenses ({data.expenses.length})</Text>
          {data.expenses.length === 0 ? (
            <Text style={styles.empty}>No expenses yet</Text>
          ) : (
            data.expenses.slice(0, 20).map((expense) => (
              <ExpenseItem key={expense.id} item={expense} />
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <AdBanner />

      {/* Add Category Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Category</Text>

            <Text style={styles.label}>Category Name</Text>
            <TextInput
              style={styles.input}
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder="e.g., Coffee"
              placeholderTextColor={colors.gray.medium}
            />

            <Text style={styles.label}>Monthly Budget (optional)</Text>
            <TextInput
              style={styles.input}
              value={categoryBudget}
              onChangeText={setCategoryBudget}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.gray.medium}
            />

            <Text style={styles.label}>Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
              {ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    categoryIcon === icon && styles.iconOptionActive,
                  ]}
                  onPress={() => setCategoryIcon(icon)}
                >
                  <Text style={styles.iconOptionText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    categoryColor === color && styles.colorOptionActive,
                  ]}
                  onPress={() => setCategoryColor(color)}
                />
              ))}
            </ScrollView>

            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => {
                  setShowCategoryModal(false);
                  resetCategoryForm();
                }}
              >
                <Text style={styles.btnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={addCategory}>
                <Text style={styles.btnText}>Add</Text>
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
  },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  headerButtons: { flexDirection: 'row', gap: spacing.sm },
  headerBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  headerBtnText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  periodSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  periodBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.gray.light,
    alignItems: 'center',
  },
  periodBtnActive: { backgroundColor: colors.primary },
  periodText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  periodTextActive: { color: colors.white },
  summaryCard: {
    backgroundColor: colors.primary,
    margin: spacing.lg,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  summaryTotal: { fontSize: 48, fontWeight: 'bold', color: colors.white, marginBottom: spacing.lg },
  summaryStats: { flexDirection: 'row', width: '100%' },
  summaryStatItem: { flex: 1, alignItems: 'center' },
  summaryStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  summaryStatValue: { fontSize: 18, fontWeight: 'bold', color: colors.white },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  quickEntry: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  amountInput: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  noteInput: {
    flex: 2,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 16,
    color: colors.text,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickAmountBtn: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.gray.light,
    alignItems: 'center',
  },
  quickAmountText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  categoryButtons: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  categoryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginRight: spacing.sm,
    alignItems: 'center',
    minWidth: 80,
  },
  categoryBtnIcon: { fontSize: 24, marginBottom: 4 },
  categoryBtnText: { fontSize: 12, color: colors.white, fontWeight: '600' },
  chartItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  chartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  chartIcon: { fontSize: 24, marginRight: spacing.sm },
  chartInfo: { flex: 1 },
  chartName: { fontSize: 16, fontWeight: '600', color: colors.text },
  chartCount: { fontSize: 12, color: colors.gray.dark, marginTop: 2 },
  chartRight: { alignItems: 'flex-end' },
  chartAmount: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  chartBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: colors.gray.light,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  chartBar: {
    height: '100%',
    borderRadius: 4,
  },
  chartPercent: { fontSize: 12, color: colors.gray.dark, fontWeight: '600' },
  expenseCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  expenseLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  expenseEmoji: { fontSize: 20 },
  expenseInfo: { flex: 1 },
  expenseCategory: { fontSize: 16, fontWeight: '600', color: colors.text },
  expenseNote: { fontSize: 12, color: colors.gray.dark, marginTop: 2 },
  expenseDate: { fontSize: 11, color: colors.gray.medium, marginTop: 2 },
  expenseAmount: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  empty: { textAlign: 'center', marginTop: spacing.xl, color: colors.gray.medium, fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  iconScroll: { marginBottom: spacing.md },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.gray.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  iconOptionActive: {
    borderWidth: 3,
    borderColor: colors.primary,
  },
  iconOptionText: { fontSize: 24 },
  colorScroll: { marginBottom: spacing.lg },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  colorOptionActive: {
    borderWidth: 4,
    borderColor: colors.text,
  },
  buttons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  btn: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  btnCancel: { backgroundColor: colors.gray.light },
  btnSave: { backgroundColor: colors.primary },
  btnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  btnTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
