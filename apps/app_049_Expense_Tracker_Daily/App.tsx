import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [expenses, setExpenses] = useState([{ id: '1', item: 'Lunch', amount: 15 }]);
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');

  const addExpense = () => {
    if (item && amount) {
      setExpenses([...expenses, { id: Date.now().toString(), item, amount: parseFloat(amount) }]);
      setItem(''); setAmount('');
    }
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Daily Expenses</Text>
      <View style={styles.inputRow}>
        <TextInput style={styles.input} value={item} onChangeText={setItem} placeholder="Item" />
        <TextInput style={styles.inputSmall} value={amount} onChangeText={setAmount} placeholder="$" keyboardType="numeric" />
        <TouchableOpacity style={styles.btn} onPress={addExpense}><Text style={styles.btnText}>+</Text></TouchableOpacity>
      </View>
      <FlatList data={expenses} keyExtractor={i => i.id} renderItem={({item}) => (
        <View style={styles.item}><Text>{item.item}</Text><Text>$${item.amount}</Text></View>
      )} />
      <Text style={styles.total}>Total: $${total.toFixed(2)}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  inputRow: { flexDirection: 'row', marginBottom: spacing.lg, gap: spacing.sm },
  input: { flex: 1, backgroundColor: colors.white, padding: spacing.md, borderRadius: 8 },
  inputSmall: { width: 80, backgroundColor: colors.white, padding: spacing.md, borderRadius: 8 },
  btn: { backgroundColor: colors.primary, width: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  btnText: { color: colors.white, fontSize: 24 },
  item: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.white, padding: spacing.md, borderRadius: 8, marginBottom: spacing.sm },
  total: { fontSize: 24, fontWeight: 'bold', marginTop: spacing.lg, color: colors.primary },
});