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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Budget_Manager_data';
const CATEGORIES_KEY = '@Budget_Categories_data';

type TransactionType = 'expense' | 'income';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

interface BudgetCategory {
  id: string;
  name: string;
  limit: number;
  color: string;
  icon: string;
}

const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { id: '1', name: 'Food', limit: 500, color: '#e74c3c', icon: '🍔' },
  { id: '2', name: 'Transport', limit: 200, color: '#3498db', icon: '🚗' },
  { id: '3', name: 'Entertainment', limit: 150, color: '#9b59b6', icon: '🎮' },
  { id: '4', name: 'Shopping', limit: 300, color: '#f39c12', icon: '🛍️' },
  { id: '5', name: 'Bills', limit: 600, color: '#e67e22', icon: '📄' },
  { id: '6', name: 'Health', limit: 200, color: '#1abc9c', icon: '💊' },
];

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>(DEFAULT_CATEGORIES);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [count, setCount] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));

  // Form states
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Category form
  const [categoryName, setCategoryName] = useState('');
  const [categoryLimit, setCategoryLimit] = useState('');
  const [categoryColor, setCategoryColor] = useState('#3498db');
  const [categoryIcon, setCategoryIcon] = useState('💰');

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedTransactions, savedCategories] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(CATEGORIES_KEY),
      ]);
      if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
      if (savedCategories) setCategories(JSON.parse(savedCategories));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveTransactions = async (data: Transaction[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setTransactions(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const saveCategories = async (data: BudgetCategory[]) => {
    try {
      await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(data));
      setCategories(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const addTransaction = () => {
    if (!amount || parseFloat(amount) <= 0) return;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type,
      amount: parseFloat(amount),
      category: selectedCategory,
      description,
      date,
      createdAt: new Date().toISOString(),
    };

    saveTransactions([newTransaction, ...transactions]);
    setShowModal(false);
    resetForm();

    const newCount = count + 1;
    setCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const deleteTransaction = (id: string) => {
    saveTransactions(transactions.filter((t) => t.id !== id));
  };

  const resetForm = () => {
    setType('expense');
    setAmount('');
    setSelectedCategory('Food');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const addCategory = () => {
    if (!categoryName.trim() || !categoryLimit) return;

    const newCategory: BudgetCategory = {
      id: Date.now().toString(),
      name: categoryName,
      limit: parseFloat(categoryLimit),
      color: categoryColor,
      icon: categoryIcon,
    };

    saveCategories([...categories, newCategory]);
    setShowCategoryModal(false);
    resetCategoryForm();
  };

  const resetCategoryForm = () => {
    setCategoryName('');
    setCategoryLimit('');
    setCategoryColor('#3498db');
    setCategoryIcon('💰');
  };

  const getMonthlyData = () => {
    const monthTransactions = transactions.filter((t) => t.date.startsWith(currentMonth));
    const totalIncome = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpenses;

    const categorySpending = categories.map((cat) => {
      const spent = monthTransactions
        .filter((t) => t.type === 'expense' && t.category === cat.name)
        .reduce((sum, t) => sum + t.amount, 0);
      const percentage = cat.limit > 0 ? (spent / cat.limit) * 100 : 0;
      return { ...cat, spent, percentage };
    });

    return {
      totalIncome,
      totalExpenses,
      balance,
      categorySpending,
      transactions: monthTransactions,
    };
  };

  const changeMonth = (direction: number) => {
    const date = new Date(currentMonth + '-01');
    date.setMonth(date.getMonth() + direction);
    setCurrentMonth(date.toISOString().slice(0, 7));
  };

  const monthData = getMonthlyData();

  const ProgressBar = ({ spent, limit, color }: { spent: number; limit: number; color: string }) => {
    const percentage = Math.min((spent / limit) * 100, 100);
    const isOverBudget = spent > limit;

    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${percentage}%`,
                backgroundColor: isOverBudget ? '#e74c3c' : color,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, isOverBudget && styles.overBudget]}>
          ${spent.toFixed(0)} / ${limit.toFixed(0)}
        </Text>
      </View>
    );
  };

  const CategoryCard = ({ item }: { item: typeof monthData.categorySpending[0] }) => (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryLeft}>
          <Text style={styles.categoryIcon}>{item.icon}</Text>
          <View>
            <Text style={styles.categoryName}>{item.name}</Text>
            <Text style={styles.categoryPercent}>
              {item.percentage.toFixed(0)}% of budget
            </Text>
          </View>
        </View>
      </View>
      <ProgressBar spent={item.spent} limit={item.limit} color={item.color} />
    </View>
  );

  const TransactionItem = ({ item }: { item: Transaction }) => {
    const category = categories.find((c) => c.name === item.category);
    const isIncome = item.type === 'income';

    return (
      <TouchableOpacity
        style={styles.transactionCard}
        onLongPress={() => deleteTransaction(item.id)}
      >
        <View style={styles.transactionLeft}>
          <View style={[styles.transactionIcon, { backgroundColor: category?.color || '#95a5a6' }]}>
            <Text style={styles.transactionEmoji}>{category?.icon || '💰'}</Text>
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionCategory}>{item.category}</Text>
            {item.description && (
              <Text style={styles.transactionDesc}>{item.description}</Text>
            )}
            <Text style={styles.transactionDate}>{item.date}</Text>
          </View>
        </View>
        <Text style={[styles.transactionAmount, isIncome ? styles.income : styles.expense]}>
          {isIncome ? '+' : '-'}${item.amount.toFixed(2)}
        </Text>
      </TouchableOpacity>
    );
  };

  const COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];
  const ICONS = ['💰', '🍔', '🚗', '🎮', '🛍️', '📄', '💊', '🏠', '✈️', '📚'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Budget Manager</Text>
        <TouchableOpacity onPress={() => setShowCategoryModal(true)}>
          <Text style={styles.addCategoryBtn}>+ Category</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthBtn}>
            <Text style={styles.monthBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {new Date(currentMonth + '-01').toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthBtn}>
            <Text style={styles.monthBtnText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Overview */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Income</Text>
              <Text style={[styles.balanceAmount, styles.income]}>
                ${monthData.totalIncome.toFixed(2)}
              </Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Expenses</Text>
              <Text style={[styles.balanceAmount, styles.expense]}>
                ${monthData.totalExpenses.toFixed(2)}
              </Text>
            </View>
          </View>
          <View style={styles.totalBalance}>
            <Text style={styles.totalLabel}>Balance</Text>
            <Text
              style={[
                styles.totalAmount,
                monthData.balance >= 0 ? styles.income : styles.expense,
              ]}
            >
              ${Math.abs(monthData.balance).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Budget Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Categories</Text>
          {monthData.categorySpending.map((cat) => (
            <CategoryCard key={cat.id} item={cat} />
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Transactions ({monthData.transactions.length})
          </Text>
          {monthData.transactions.length === 0 ? (
            <Text style={styles.empty}>No transactions this month</Text>
          ) : (
            monthData.transactions.map((transaction) => (
              <TransactionItem key={transaction.id} item={transaction} />
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AdBanner />

      {/* Add Transaction Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Transaction</Text>

            {/* Type Selector */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}
                onPress={() => setType('expense')}
              >
                <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'income' && styles.typeBtnActive]}
                onPress={() => setType('income')}
              >
                <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.gray.medium}
            />

            {/* Category */}
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: cat.color },
                    selectedCategory === cat.name && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.name)}
                >
                  <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
                  <Text style={styles.categoryChipText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Description */}
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Add note..."
              placeholderTextColor={colors.gray.medium}
            />

            {/* Date */}
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.gray.medium}
            />

            {/* Buttons */}
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.btnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={addTransaction}>
                <Text style={styles.btnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Category Modal */}
      <Modal visible={showCategoryModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.categoryModalContent}>
            <Text style={styles.modalTitle}>New Budget Category</Text>

            <Text style={styles.label}>Category Name</Text>
            <TextInput
              style={styles.input}
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder="e.g., Groceries"
              placeholderTextColor={colors.gray.medium}
            />

            <Text style={styles.label}>Monthly Budget Limit</Text>
            <TextInput
              style={styles.input}
              value={categoryLimit}
              onChangeText={setCategoryLimit}
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
  addCategoryBtn: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  monthBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthBtnText: { fontSize: 20, color: colors.text },
  monthText: { fontSize: 18, fontWeight: '600', color: colors.text },
  balanceCard: {
    backgroundColor: colors.primary,
    margin: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  balanceItem: { flex: 1, alignItems: 'center' },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  balanceAmount: { fontSize: 20, fontWeight: 'bold' },
  balanceDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: spacing.md,
  },
  totalBalance: {
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  totalLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  totalAmount: { fontSize: 32, fontWeight: 'bold' },
  income: { color: '#2ecc71' },
  expense: { color: '#e74c3c' },
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
  categoryCard: {
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
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryLeft: { flexDirection: 'row', alignItems: 'center' },
  categoryIcon: { fontSize: 28, marginRight: spacing.md },
  categoryName: { fontSize: 16, fontWeight: '600', color: colors.text },
  categoryPercent: { fontSize: 12, color: colors.gray.dark, marginTop: 2 },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: { fontSize: 12, color: colors.gray.dark, fontWeight: '600', minWidth: 100 },
  overBudget: { color: '#e74c3c', fontWeight: 'bold' },
  transactionCard: {
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
  transactionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  transactionEmoji: { fontSize: 20 },
  transactionInfo: { flex: 1 },
  transactionCategory: { fontSize: 16, fontWeight: '600', color: colors.text },
  transactionDesc: { fontSize: 12, color: colors.gray.dark, marginTop: 2 },
  transactionDate: { fontSize: 11, color: colors.gray.medium, marginTop: 2 },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: spacing.xl, color: colors.gray.medium, fontSize: 14 },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: { color: colors.white, fontSize: 32, fontWeight: '300' },
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
  categoryModalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    margin: spacing.xl,
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
  typeSelector: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  typeBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.gray.light,
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: colors.primary },
  typeText: { fontSize: 16, color: colors.text, fontWeight: '600' },
  typeTextActive: { color: colors.white },
  categoryScroll: { marginBottom: spacing.md },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    borderWidth: 3,
    borderColor: colors.text,
  },
  categoryChipIcon: { fontSize: 18, marginRight: 4 },
  categoryChipText: { fontSize: 14, color: colors.white, fontWeight: '600' },
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
