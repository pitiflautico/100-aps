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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Personal_Finance_data';
const ACCOUNTS_KEY = '@Finance_Accounts_data';
const BUDGETS_KEY = '@Finance_Budgets_data';

type TransactionType = 'income' | 'expense' | 'transfer';
type ViewType = 'overview' | 'transactions' | 'accounts' | 'reports';

interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment';
  balance: number;
  color: string;
  icon: string;
}

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  accountId: string;
  toAccountId?: string;
  description: string;
  date: string;
  createdAt: string;
}

interface Budget {
  id: string;
  category: string;
  limit: number;
  period: 'monthly' | 'weekly';
}

const DEFAULT_ACCOUNTS: Account[] = [
  { id: '1', name: 'Main Checking', type: 'checking', balance: 5000, color: '#3498db', icon: '💳' },
  { id: '2', name: 'Savings', type: 'savings', balance: 10000, color: '#2ecc71', icon: '💰' },
  { id: '3', name: 'Cash', type: 'cash', balance: 200, color: '#f39c12', icon: '💵' },
];

const CATEGORIES = [
  'Salary', 'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment',
  'Health', 'Education', 'Investment', 'Other'
];

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [view, setView] = useState<ViewType>('overview');
  const [showModal, setShowModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [count, setCount] = useState(0);

  // Transaction form
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [accountId, setAccountId] = useState('1');
  const [toAccountId, setToAccountId] = useState('2');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Account form
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<Account['type']>('checking');
  const [initialBalance, setInitialBalance] = useState('');

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedAccounts, savedTransactions, savedBudgets] = await Promise.all([
        AsyncStorage.getItem(ACCOUNTS_KEY),
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(BUDGETS_KEY),
      ]);
      if (savedAccounts) setAccounts(JSON.parse(savedAccounts));
      if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
      if (savedBudgets) setBudgets(JSON.parse(savedBudgets));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveAccounts = async (data: Account[]) => {
    try {
      await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(data));
      setAccounts(data);
    } catch (error) {
      console.error('Save error:', error);
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

  const addTransaction = () => {
    const txAmount = parseFloat(amount);
    if (!txAmount || txAmount <= 0) return;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type,
      amount: txAmount,
      category,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      description,
      date,
      createdAt: new Date().toISOString(),
    };

    // Update account balances
    const updatedAccounts = accounts.map((acc) => {
      if (type === 'income' && acc.id === accountId) {
        return { ...acc, balance: acc.balance + txAmount };
      }
      if (type === 'expense' && acc.id === accountId) {
        return { ...acc, balance: acc.balance - txAmount };
      }
      if (type === 'transfer') {
        if (acc.id === accountId) {
          return { ...acc, balance: acc.balance - txAmount };
        }
        if (acc.id === toAccountId) {
          return { ...acc, balance: acc.balance + txAmount };
        }
      }
      return acc;
    });

    saveAccounts(updatedAccounts);
    saveTransactions([newTransaction, ...transactions]);
    setShowModal(false);
    resetForm();

    const newCount = count + 1;
    setCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    // Reverse the balance changes
    const updatedAccounts = accounts.map((acc) => {
      if (tx.type === 'income' && acc.id === tx.accountId) {
        return { ...acc, balance: acc.balance - tx.amount };
      }
      if (tx.type === 'expense' && acc.id === tx.accountId) {
        return { ...acc, balance: acc.balance + tx.amount };
      }
      if (tx.type === 'transfer') {
        if (acc.id === tx.accountId) {
          return { ...acc, balance: acc.balance + tx.amount };
        }
        if (acc.id === tx.toAccountId) {
          return { ...acc, balance: acc.balance - tx.amount };
        }
      }
      return acc;
    });

    saveAccounts(updatedAccounts);
    saveTransactions(transactions.filter((t) => t.id !== id));
  };

  const addAccount = () => {
    if (!accountName.trim()) return;

    const accountIcons = {
      checking: '💳',
      savings: '💰',
      credit: '💎',
      cash: '💵',
      investment: '📈',
    };

    const accountColors = {
      checking: '#3498db',
      savings: '#2ecc71',
      credit: '#e74c3c',
      cash: '#f39c12',
      investment: '#9b59b6',
    };

    const newAccount: Account = {
      id: Date.now().toString(),
      name: accountName,
      type: accountType,
      balance: parseFloat(initialBalance) || 0,
      color: accountColors[accountType],
      icon: accountIcons[accountType],
    };

    saveAccounts([...accounts, newAccount]);
    setShowAccountModal(false);
    resetAccountForm();
  };

  const resetForm = () => {
    setType('expense');
    setAmount('');
    setCategory('Food');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const resetAccountForm = () => {
    setAccountName('');
    setAccountType('checking');
    setInitialBalance('');
  };

  const getMonthlyData = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const monthTx = transactions.filter((t) => t.date >= monthStart && t.date <= monthEnd);

    const income = monthTx
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthTx
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryBreakdown = CATEGORIES.map((cat) => {
      const catExpenses = monthTx.filter((t) => t.type === 'expense' && t.category === cat);
      const total = catExpenses.reduce((sum, t) => sum + t.amount, 0);
      return { category: cat, total, count: catExpenses.length };
    })
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);

    return { income, expenses, balance: income - expenses, categoryBreakdown };
  };

  const getNetWorth = () => {
    const assets = accounts
      .filter((a) => a.type !== 'credit')
      .reduce((sum, a) => sum + a.balance, 0);

    const liabilities = accounts
      .filter((a) => a.type === 'credit')
      .reduce((sum, a) => sum + Math.abs(a.balance), 0);

    return assets - liabilities;
  };

  const monthData = getMonthlyData();
  const netWorth = getNetWorth();

  const renderOverview = () => (
    <ScrollView>
      {/* Net Worth Card */}
      <View style={styles.netWorthCard}>
        <Text style={styles.netWorthLabel}>Net Worth</Text>
        <Text style={styles.netWorthAmount}>${netWorth.toLocaleString()}</Text>
      </View>

      {/* Accounts Summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Accounts ({accounts.length})</Text>
          <TouchableOpacity onPress={() => setShowAccountModal(true)}>
            <Text style={styles.addBtn}>+ Add</Text>
          </TouchableOpacity>
        </View>
        {accounts.map((acc) => (
          <View key={acc.id} style={styles.accountCard}>
            <View style={styles.accountLeft}>
              <View style={[styles.accountIcon, { backgroundColor: acc.color }]}>
                <Text style={styles.accountEmoji}>{acc.icon}</Text>
              </View>
              <View>
                <Text style={styles.accountName}>{acc.name}</Text>
                <Text style={styles.accountType}>{acc.type}</Text>
              </View>
            </View>
            <Text
              style={[
                styles.accountBalance,
                acc.balance < 0 && styles.negativeBalance,
              ]}
            >
              ${acc.balance.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      {/* Monthly Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Month</Text>
        <View style={styles.monthlyCard}>
          <View style={styles.monthlyRow}>
            <View style={styles.monthlyItem}>
              <Text style={styles.monthlyLabel}>Income</Text>
              <Text style={[styles.monthlyAmount, styles.incomeText]}>
                +${monthData.income.toFixed(0)}
              </Text>
            </View>
            <View style={styles.monthlyDivider} />
            <View style={styles.monthlyItem}>
              <Text style={styles.monthlyLabel}>Expenses</Text>
              <Text style={[styles.monthlyAmount, styles.expenseText]}>
                -${monthData.expenses.toFixed(0)}
              </Text>
            </View>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text
              style={[
                styles.balanceAmount,
                monthData.balance >= 0 ? styles.incomeText : styles.expenseText,
              ]}
            >
              ${Math.abs(monthData.balance).toFixed(0)}
            </Text>
          </View>
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spending by Category</Text>
        {monthData.categoryBreakdown.slice(0, 5).map((cat, idx) => (
          <View key={cat.category} style={styles.categoryRow}>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{cat.category}</Text>
              <Text style={styles.categoryCount}>{cat.count} transactions</Text>
            </View>
            <Text style={styles.categoryAmount}>${cat.total.toFixed(0)}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderTransactions = () => (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>No transactions yet</Text>}
      renderItem={({ item }) => {
        const account = accounts.find((a) => a.id === item.accountId);
        const toAccount = item.toAccountId
          ? accounts.find((a) => a.id === item.toAccountId)
          : null;

        return (
          <TouchableOpacity
            style={styles.transactionCard}
            onLongPress={() => {
              Alert.alert('Delete Transaction', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deleteTransaction(item.id),
                },
              ]);
            }}
          >
            <View style={styles.txLeft}>
              <View
                style={[
                  styles.txIcon,
                  {
                    backgroundColor:
                      item.type === 'income'
                        ? '#2ecc71'
                        : item.type === 'expense'
                        ? '#e74c3c'
                        : '#3498db',
                  },
                ]}
              >
                <Text style={styles.txEmoji}>
                  {item.type === 'income'
                    ? '💰'
                    : item.type === 'expense'
                    ? '💸'
                    : '🔄'}
                </Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txCategory}>
                  {item.type === 'transfer'
                    ? `${account?.name} → ${toAccount?.name}`
                    : item.category}
                </Text>
                {item.description && (
                  <Text style={styles.txDesc}>{item.description}</Text>
                )}
                <Text style={styles.txDate}>
                  {item.date} • {account?.name}
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.txAmount,
                item.type === 'income' && styles.incomeText,
                item.type === 'expense' && styles.expenseText,
              ]}
            >
              {item.type === 'income' ? '+' : item.type === 'expense' ? '-' : ''}$
              {item.amount.toFixed(2)}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );

  const renderAccounts = () => (
    <ScrollView contentContainerStyle={styles.list}>
      <TouchableOpacity
        style={styles.addAccountCard}
        onPress={() => setShowAccountModal(true)}
      >
        <Text style={styles.addAccountText}>+ Add New Account</Text>
      </TouchableOpacity>

      {accounts.map((acc) => {
        const accTransactions = transactions.filter(
          (t) => t.accountId === acc.id || t.toAccountId === acc.id
        );

        return (
          <View key={acc.id} style={styles.accountDetailCard}>
            <View style={styles.accountDetailHeader}>
              <View style={styles.accountLeft}>
                <View style={[styles.accountIcon, { backgroundColor: acc.color }]}>
                  <Text style={styles.accountEmoji}>{acc.icon}</Text>
                </View>
                <View>
                  <Text style={styles.accountName}>{acc.name}</Text>
                  <Text style={styles.accountType}>{acc.type}</Text>
                </View>
              </View>
              <Text
                style={[
                  styles.accountDetailBalance,
                  acc.balance < 0 && styles.negativeBalance,
                ]}
              >
                ${acc.balance.toLocaleString()}
              </Text>
            </View>
            <Text style={styles.accountTxCount}>
              {accTransactions.length} transactions
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );

  const renderReports = () => (
    <ScrollView contentContainerStyle={styles.list}>
      {/* Monthly Chart */}
      <View style={styles.reportCard}>
        <Text style={styles.reportTitle}>Monthly Overview</Text>
        <View style={styles.chartRow}>
          <View style={styles.chartItem}>
            <Text style={styles.chartLabel}>Income</Text>
            <View style={styles.chartBar}>
              <View
                style={[
                  styles.chartFill,
                  { width: '100%', backgroundColor: '#2ecc71' },
                ]}
              />
            </View>
            <Text style={styles.chartValue}>${monthData.income.toFixed(0)}</Text>
          </View>
          <View style={styles.chartItem}>
            <Text style={styles.chartLabel}>Expenses</Text>
            <View style={styles.chartBar}>
              <View
                style={[
                  styles.chartFill,
                  {
                    width: `${
                      monthData.income > 0
                        ? (monthData.expenses / monthData.income) * 100
                        : 100
                    }%`,
                    backgroundColor: '#e74c3c',
                  },
                ]}
              />
            </View>
            <Text style={styles.chartValue}>${monthData.expenses.toFixed(0)}</Text>
          </View>
        </View>
      </View>

      {/* Category Report */}
      <View style={styles.reportCard}>
        <Text style={styles.reportTitle}>Top Categories</Text>
        {monthData.categoryBreakdown.map((cat) => {
          const percentage =
            monthData.expenses > 0 ? (cat.total / monthData.expenses) * 100 : 0;
          return (
            <View key={cat.category} style={styles.categoryReportRow}>
              <Text style={styles.categoryReportName}>{cat.category}</Text>
              <View style={styles.categoryReportBar}>
                <View
                  style={[
                    styles.categoryReportFill,
                    { width: `${percentage}%` },
                  ]}
                />
              </View>
              <Text style={styles.categoryReportAmount}>
                ${cat.total.toFixed(0)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Net Worth */}
      <View style={styles.reportCard}>
        <Text style={styles.reportTitle}>Net Worth Breakdown</Text>
        <View style={styles.netWorthRow}>
          <Text style={styles.netWorthRowLabel}>Assets</Text>
          <Text style={[styles.netWorthRowValue, styles.incomeText]}>
            $
            {accounts
              .filter((a) => a.type !== 'credit')
              .reduce((sum, a) => sum + a.balance, 0)
              .toFixed(0)}
          </Text>
        </View>
        <View style={styles.netWorthRow}>
          <Text style={styles.netWorthRowLabel}>Liabilities</Text>
          <Text style={[styles.netWorthRowValue, styles.expenseText]}>
            $
            {accounts
              .filter((a) => a.type === 'credit')
              .reduce((sum, a) => sum + Math.abs(a.balance), 0)
              .toFixed(0)}
          </Text>
        </View>
        <View style={[styles.netWorthRow, styles.netWorthTotal]}>
          <Text style={styles.netWorthTotalLabel}>Net Worth</Text>
          <Text style={styles.netWorthTotalValue}>${netWorth.toFixed(0)}</Text>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Finance Tracker</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['overview', 'transactions', 'accounts', 'reports'] as ViewType[]).map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.tab, view === v && styles.tabActive]}
            onPress={() => setView(v)}
          >
            <Text style={[styles.tabText, view === v && styles.tabTextActive]}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {view === 'overview' && renderOverview()}
      {view === 'transactions' && renderTransactions()}
      {view === 'accounts' && renderAccounts()}
      {view === 'reports' && renderReports()}

      {/* FAB */}
      {view !== 'accounts' && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      <AdBanner />

      {/* Add Transaction Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Transaction</Text>

            <View style={styles.typeSelector}>
              {(['income', 'expense', 'transfer'] as TransactionType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeText, type === t && styles.typeTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.gray.medium}
            />

            {type !== 'transfer' && (
              <>
                <Text style={styles.label}>Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                >
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        category === cat && styles.categoryChipActive,
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          category === cat && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={styles.label}>
              {type === 'transfer' ? 'From Account' : 'Account'}
            </Text>
            <View style={styles.accountSelector}>
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  style={[
                    styles.accountChip,
                    accountId === acc.id && styles.accountChipActive,
                  ]}
                  onPress={() => setAccountId(acc.id)}
                >
                  <Text style={styles.accountChipIcon}>{acc.icon}</Text>
                  <Text style={styles.accountChipText}>{acc.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {type === 'transfer' && (
              <>
                <Text style={styles.label}>To Account</Text>
                <View style={styles.accountSelector}>
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((acc) => (
                      <TouchableOpacity
                        key={acc.id}
                        style={[
                          styles.accountChip,
                          toAccountId === acc.id && styles.accountChipActive,
                        ]}
                        onPress={() => setToAccountId(acc.id)}
                      >
                        <Text style={styles.accountChipIcon}>{acc.icon}</Text>
                        <Text style={styles.accountChipText}>{acc.name}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </>
            )}

            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Add note..."
              placeholderTextColor={colors.gray.medium}
            />

            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.gray.medium}
            />

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
              <TouchableOpacity
                style={[styles.btn, styles.btnSave]}
                onPress={addTransaction}
              >
                <Text style={styles.btnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Account Modal */}
      <Modal visible={showAccountModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.accountModalContent}>
            <Text style={styles.modalTitle}>New Account</Text>

            <Text style={styles.label}>Account Name</Text>
            <TextInput
              style={styles.input}
              value={accountName}
              onChangeText={setAccountName}
              placeholder="e.g., My Checking"
              placeholderTextColor={colors.gray.medium}
            />

            <Text style={styles.label}>Account Type</Text>
            <View style={styles.accountTypeSelector}>
              {(['checking', 'savings', 'credit', 'cash', 'investment'] as Account['type'][]).map(
                (t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.accountTypeBtn,
                      accountType === t && styles.accountTypeBtnActive,
                    ]}
                    onPress={() => setAccountType(t)}
                  >
                    <Text
                      style={[
                        styles.accountTypeText,
                        accountType === t && styles.accountTypeTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            <Text style={styles.label}>Initial Balance</Text>
            <TextInput
              style={styles.input}
              value={initialBalance}
              onChangeText={setInitialBalance}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.gray.medium}
            />

            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => {
                  setShowAccountModal(false);
                  resetAccountForm();
                }}
              >
                <Text style={styles.btnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={addAccount}>
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
    padding: spacing.lg,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: { fontSize: 12, color: colors.gray.dark, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  netWorthCard: {
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
  netWorthLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  netWorthAmount: { fontSize: 48, fontWeight: 'bold', color: colors.white },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  addBtn: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  accountCard: {
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
  accountLeft: { flexDirection: 'row', alignItems: 'center' },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  accountEmoji: { fontSize: 20 },
  accountName: { fontSize: 16, fontWeight: '600', color: colors.text },
  accountType: { fontSize: 12, color: colors.gray.dark, marginTop: 2, textTransform: 'capitalize' },
  accountBalance: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  negativeBalance: { color: '#e74c3c' },
  monthlyCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  monthlyRow: { flexDirection: 'row', marginBottom: spacing.lg },
  monthlyItem: { flex: 1, alignItems: 'center' },
  monthlyLabel: { fontSize: 12, color: colors.gray.dark, marginBottom: 4 },
  monthlyAmount: { fontSize: 20, fontWeight: 'bold' },
  monthlyDivider: {
    width: 1,
    backgroundColor: colors.gray.light,
    marginHorizontal: spacing.md,
  },
  incomeText: { color: '#2ecc71' },
  expenseText: { color: '#e74c3c' },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray.light,
  },
  balanceLabel: { fontSize: 14, color: colors.gray.dark, fontWeight: '600' },
  balanceAmount: { fontSize: 20, fontWeight: 'bold' },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 14, fontWeight: '600', color: colors.text },
  categoryCount: { fontSize: 11, color: colors.gray.medium, marginTop: 2 },
  categoryAmount: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  empty: { textAlign: 'center', marginTop: spacing.xl * 2, color: colors.gray.medium, fontSize: 14 },
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
  txLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  txEmoji: { fontSize: 20 },
  txInfo: { flex: 1 },
  txCategory: { fontSize: 16, fontWeight: '600', color: colors.text },
  txDesc: { fontSize: 12, color: colors.gray.dark, marginTop: 2 },
  txDate: { fontSize: 11, color: colors.gray.medium, marginTop: 2 },
  txAmount: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  addAccountCard: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addAccountText: { fontSize: 16, color: colors.white, fontWeight: 'bold' },
  accountDetailCard: {
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
  accountDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  accountDetailBalance: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  accountTxCount: { fontSize: 12, color: colors.gray.dark },
  reportCard: {
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
  reportTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  chartRow: { gap: spacing.md },
  chartItem: { marginBottom: spacing.md },
  chartLabel: { fontSize: 12, color: colors.gray.dark, marginBottom: 4 },
  chartBar: {
    height: 24,
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
  },
  chartFill: { height: '100%', borderRadius: 12 },
  chartValue: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  categoryReportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryReportName: { width: 100, fontSize: 12, color: colors.text },
  categoryReportBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray.light,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  categoryReportFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  categoryReportAmount: { fontSize: 12, fontWeight: 'bold', color: colors.text, width: 60, textAlign: 'right' },
  netWorthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  netWorthRowLabel: { fontSize: 14, color: colors.gray.dark },
  netWorthRowValue: { fontSize: 16, fontWeight: '600' },
  netWorthTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.gray.light,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  netWorthTotalLabel: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  netWorthTotalValue: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
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
    maxHeight: '90%',
  },
  accountModalContent: {
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
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeBtn: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.gray.light,
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: colors.primary },
  typeText: { fontSize: 12, color: colors.text, fontWeight: '600', textTransform: 'capitalize' },
  typeTextActive: { color: colors.white },
  categoryScroll: { marginBottom: spacing.md },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.gray.light,
    marginRight: spacing.sm,
  },
  categoryChipActive: { backgroundColor: colors.primary },
  categoryChipText: { fontSize: 12, color: colors.text, fontWeight: '600' },
  categoryChipTextActive: { color: colors.white },
  accountSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.gray.light,
  },
  accountChipActive: {
    backgroundColor: colors.primary,
  },
  accountChipIcon: { fontSize: 16, marginRight: 4 },
  accountChipText: { fontSize: 12, color: colors.text, fontWeight: '600' },
  accountTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  accountTypeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.gray.light,
  },
  accountTypeBtnActive: { backgroundColor: colors.primary },
  accountTypeText: { fontSize: 12, color: colors.text, fontWeight: '600', textTransform: 'capitalize' },
  accountTypeTextActive: { color: colors.white },
  buttons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  btn: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  btnCancel: { backgroundColor: colors.gray.light },
  btnSave: { backgroundColor: colors.primary },
  btnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  btnTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
