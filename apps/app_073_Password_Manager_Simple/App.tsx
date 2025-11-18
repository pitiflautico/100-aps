import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, TextInput,
  Modal, ScrollView, Alert, Clipboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const PIN_KEY = '@Password_Manager_PIN';
const PASSWORDS_KEY = '@Password_Manager_Data';

interface PasswordEntry {
  id: string;
  site: string;
  username: string;
  password: string;
  category: string;
  notes: string;
  createdAt: string;
}

const CATEGORIES = ['Social', 'Email', 'Banking', 'Shopping', 'Work', 'Other'];

const CATEGORY_EMOJIS: { [key: string]: string } = {
  Social: '👥',
  Email: '📧',
  Banking: '🏦',
  Shopping: '🛒',
  Work: '💼',
  Other: '📝',
};

// Simple encryption/decryption using Base64
const encrypt = (text: string): string => {
  return btoa(text);
};

const decrypt = (encrypted: string): string => {
  try {
    return atob(encrypted);
  } catch {
    return '';
  }
};

export default function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [hasPin, setHasPin] = useState(false);
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showSetupPin, setShowSetupPin] = useState(false);

  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState<PasswordEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [site, setSite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('Social');
  const [notes, setNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [genLength, setGenLength] = useState('12');
  const [genUppercase, setGenUppercase] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const [count, setCount] = useState(0);

  useEffect(() => {
    initializeAds();
    checkPin();
  }, []);

  const checkPin = async () => {
    try {
      const savedPin = await AsyncStorage.getItem(PIN_KEY);
      if (savedPin) {
        setHasPin(true);
        setIsLocked(true);
      } else {
        setShowSetupPin(true);
      }
    } catch (error) {
      console.error('Check PIN error:', error);
    }
  };

  const setupPin = async () => {
    if (newPin.length < 4 || newPin.length > 6) {
      Alert.alert('Error', 'PIN must be 4-6 digits');
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }

    try {
      const encryptedPin = encrypt(newPin);
      await AsyncStorage.setItem(PIN_KEY, encryptedPin);
      setHasPin(true);
      setShowSetupPin(false);
      setIsLocked(false);
      loadPasswords();
      Alert.alert('Success', 'PIN created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save PIN');
    }
  };

  const unlockApp = async () => {
    try {
      const savedPin = await AsyncStorage.getItem(PIN_KEY);
      if (savedPin) {
        const decryptedPin = decrypt(savedPin);
        if (pin === decryptedPin) {
          setIsLocked(false);
          setPin('');
          loadPasswords();
        } else {
          Alert.alert('Error', 'Incorrect PIN');
          setPin('');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to unlock');
    }
  };

  const lockApp = () => {
    setIsLocked(true);
    setPin('');
    setSearchQuery('');
    setSelectedPassword(null);
  };

  const loadPasswords = async () => {
    try {
      const saved = await AsyncStorage.getItem(PASSWORDS_KEY);
      if (saved) {
        const decrypted = decrypt(saved);
        setPasswords(JSON.parse(decrypted));
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const savePasswords = async (data: PasswordEntry[]) => {
    try {
      const encrypted = encrypt(JSON.stringify(data));
      await AsyncStorage.setItem(PASSWORDS_KEY, encrypted);
      setPasswords(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const addPassword = () => {
    if (!site.trim() || !username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const newEntry: PasswordEntry = {
      id: Date.now().toString(),
      site,
      username,
      password,
      category,
      notes,
      createdAt: new Date().toISOString(),
    };

    const updated = [newEntry, ...passwords];
    savePasswords(updated);
    resetForm();
    setShowAddModal(false);

    const newCount = count + 1;
    setCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const deletePassword = (id: string) => {
    Alert.alert('Delete Password', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = passwords.filter(p => p.id !== id);
          savePasswords(updated);
          setSelectedPassword(null);
        },
      },
    ]);
  };

  const resetForm = () => {
    setSite('');
    setUsername('');
    setPassword('');
    setCategory('Social');
    setNotes('');
    setShowPassword(false);
  };

  const generatePassword = () => {
    const length = parseInt(genLength) || 12;
    let charset = 'abcdefghijklmnopqrstuvwxyz';
    if (genUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (genNumbers) charset += '0123456789';
    if (genSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    setGeneratedPassword(result);
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const useGeneratedPassword = () => {
    setPassword(generatedPassword);
    setShowGeneratorModal(false);
  };

  const getFilteredPasswords = () => {
    let filtered = passwords;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.site.toLowerCase().includes(query) ||
          p.username.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredPasswords = getFilteredPasswords();

  if (showSetupPin) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.lockScreen}>
          <Text style={styles.lockEmoji}>🔐</Text>
          <Text style={styles.lockTitle}>Create Master PIN</Text>
          <Text style={styles.lockSubtitle}>Enter a 4-6 digit PIN</Text>

          <TextInput
            style={styles.pinInput}
            value={newPin}
            onChangeText={setNewPin}
            placeholder="Enter PIN"
            placeholderTextColor={colors.gray.dark}
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry
          />

          <TextInput
            style={styles.pinInput}
            value={confirmPin}
            onChangeText={setConfirmPin}
            placeholder="Confirm PIN"
            placeholderTextColor={colors.gray.dark}
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry
          />

          <TouchableOpacity style={styles.unlockBtn} onPress={setupPin}>
            <Text style={styles.unlockBtnText}>Create PIN</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLocked) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.lockScreen}>
          <Text style={styles.lockEmoji}>🔒</Text>
          <Text style={styles.lockTitle}>Password Manager</Text>
          <Text style={styles.lockSubtitle}>Enter your PIN to unlock</Text>

          <TextInput
            style={styles.pinInput}
            value={pin}
            onChangeText={setPin}
            placeholder="Enter PIN"
            placeholderTextColor={colors.gray.dark}
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry
          />

          <TouchableOpacity style={styles.unlockBtn} onPress={unlockApp}>
            <Text style={styles.unlockBtnText}>Unlock</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Passwords</Text>
        <TouchableOpacity style={styles.lockIconBtn} onPress={lockApp}>
          <Text style={styles.lockIcon}>🔒</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search passwords..."
          placeholderTextColor={colors.gray.dark}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        <TouchableOpacity
          style={[styles.categoryChip, selectedCategory === 'All' && styles.categoryChipActive]}
          onPress={() => setSelectedCategory('All')}
        >
          <Text style={[styles.categoryChipText, selectedCategory === 'All' && styles.categoryChipTextActive]}>
            All ({passwords.length})
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={styles.categoryEmoji}>{CATEGORY_EMOJIS[cat]}</Text>
            <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredPasswords}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔑</Text>
            <Text style={styles.emptyText}>No passwords saved</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => setSelectedPassword(item)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.categoryEmojiLarge}>{CATEGORY_EMOJIS[item.category]}</Text>
              <View style={styles.cardInfo}>
                <Text style={styles.cardSite}>{item.site}</Text>
                <Text style={styles.cardUsername}>{item.username}</Text>
                <Text style={styles.cardCategory}>{item.category}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AdBanner />

      <Modal visible={showAddModal} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Password</Text>
            <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Site/Service *</Text>
            <TextInput
              style={styles.input}
              value={site}
              onChangeText={setSite}
              placeholder="e.g., Facebook, Gmail"
              placeholderTextColor={colors.gray.dark}
            />

            <Text style={styles.label}>Username/Email *</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="username or email"
              placeholderTextColor={colors.gray.dark}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="password"
                placeholderTextColor={colors.gray.dark}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.generateBtn}
              onPress={() => setShowGeneratorModal(true)}
            >
              <Text style={styles.generateBtnText}>🎲 Generate Password</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={styles.categoryEmoji}>{CATEGORY_EMOJIS[cat]}</Text>
                  <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              placeholderTextColor={colors.gray.dark}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={addPassword}>
              <Text style={styles.saveBtnText}>Save Password</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={selectedPassword !== null} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          {selectedPassword && (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedPassword.site}</Text>
                <TouchableOpacity onPress={() => setSelectedPassword(null)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Username/Email</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailValue}>{selectedPassword.username}</Text>
                    <TouchableOpacity onPress={() => copyToClipboard(selectedPassword.username, 'Username')}>
                      <Text style={styles.copyBtn}>📋</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Password</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailValue}>{'•'.repeat(selectedPassword.password.length)}</Text>
                    <TouchableOpacity onPress={() => copyToClipboard(selectedPassword.password, 'Password')}>
                      <Text style={styles.copyBtn}>📋</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.categoryEmoji}>{CATEGORY_EMOJIS[selectedPassword.category]}</Text>
                    <Text style={styles.detailValue}>{selectedPassword.category}</Text>
                  </View>
                </View>

                {selectedPassword.notes && (
                  <View style={styles.detailCard}>
                    <Text style={styles.detailLabel}>Notes</Text>
                    <Text style={styles.detailValue}>{selectedPassword.notes}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deletePassword(selectedPassword.id)}
                >
                  <Text style={styles.deleteBtnText}>Delete Password</Text>
                </TouchableOpacity>
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>

      <Modal visible={showGeneratorModal} animationType="slide" transparent>
        <View style={styles.generatorOverlay}>
          <View style={styles.generatorModal}>
            <Text style={styles.generatorTitle}>Password Generator</Text>

            <Text style={styles.label}>Length: {genLength}</Text>
            <TextInput
              style={styles.input}
              value={genLength}
              onChangeText={setGenLength}
              keyboardType="number-pad"
              maxLength={2}
            />

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setGenUppercase(!genUppercase)}
            >
              <Text style={styles.checkbox}>{genUppercase ? '☑️' : '⬜'}</Text>
              <Text style={styles.optionText}>Include Uppercase (A-Z)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setGenNumbers(!genNumbers)}
            >
              <Text style={styles.checkbox}>{genNumbers ? '☑️' : '⬜'}</Text>
              <Text style={styles.optionText}>Include Numbers (0-9)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setGenSymbols(!genSymbols)}
            >
              <Text style={styles.checkbox}>{genSymbols ? '☑️' : '⬜'}</Text>
              <Text style={styles.optionText}>Include Symbols (!@#$...)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.generatePasswordBtn} onPress={generatePassword}>
              <Text style={styles.generatePasswordBtnText}>Generate</Text>
            </TouchableOpacity>

            {generatedPassword && (
              <View style={styles.generatedPasswordCard}>
                <Text style={styles.generatedPassword}>{generatedPassword}</Text>
                <TouchableOpacity onPress={() => copyToClipboard(generatedPassword, 'Password')}>
                  <Text style={styles.copyBtn}>📋</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.generatorButtons}>
              <TouchableOpacity
                style={styles.generatorBtnCancel}
                onPress={() => setShowGeneratorModal(false)}
              >
                <Text style={styles.generatorBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              {generatedPassword && (
                <TouchableOpacity
                  style={styles.generatorBtnUse}
                  onPress={useGeneratedPassword}
                >
                  <Text style={styles.generatorBtnUseText}>Use Password</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  lockScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  lockEmoji: { fontSize: 80, marginBottom: spacing.lg },
  lockTitle: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.sm },
  lockSubtitle: { fontSize: 16, color: colors.gray.dark, marginBottom: spacing.xl },
  pinInput: { width: '100%', backgroundColor: colors.white, padding: spacing.lg, borderRadius: 12, fontSize: 24, textAlign: 'center', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.gray.light, fontVariant: ['tabular-nums'] },
  unlockBtn: { width: '100%', backgroundColor: colors.primary, padding: spacing.lg, borderRadius: 12, alignItems: 'center', marginTop: spacing.md },
  unlockBtnText: { fontSize: 18, fontWeight: 'bold', color: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray.light },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  lockIconBtn: { padding: spacing.sm },
  lockIcon: { fontSize: 24 },
  searchContainer: { padding: spacing.lg, paddingBottom: spacing.md },
  searchInput: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: colors.gray.light },
  categoryScroll: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.gray.light, borderRadius: 20, marginRight: spacing.sm, gap: spacing.xs },
  categoryChipActive: { backgroundColor: colors.primary },
  categoryChipText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  categoryChipTextActive: { color: colors.white },
  categoryEmoji: { fontSize: 16 },
  list: { padding: spacing.lg, paddingBottom: 100 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl * 3 },
  emptyEmoji: { fontSize: 64, marginBottom: spacing.md },
  emptyText: { fontSize: 18, color: colors.gray.dark },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.md, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  categoryEmojiLarge: { fontSize: 32, marginRight: spacing.md },
  cardInfo: { flex: 1 },
  cardSite: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: spacing.xs },
  cardUsername: { fontSize: 14, color: colors.gray.dark, marginBottom: spacing.xs },
  cardCategory: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  fab: { position: 'absolute', right: spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  fabText: { fontSize: 32, fontWeight: '300', color: colors.white },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray.light },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  closeBtn: { fontSize: 32, color: colors.gray.dark, fontWeight: '300' },
  modalContent: { flex: 1, padding: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  input: { backgroundColor: colors.gray.light, padding: spacing.md, borderRadius: 12, fontSize: 16, color: colors.text },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  passwordInput: { flex: 1 },
  eyeBtn: { padding: spacing.sm },
  eyeIcon: { fontSize: 24 },
  generateBtn: { backgroundColor: colors.secondary, padding: spacing.md, borderRadius: 12, alignItems: 'center', marginTop: spacing.md },
  generateBtnText: { fontSize: 14, fontWeight: '600', color: colors.white },
  textArea: { height: 80, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: 12, alignItems: 'center', marginTop: spacing.xl },
  saveBtnText: { fontSize: 16, fontWeight: 'bold', color: colors.white },
  detailCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.md },
  detailLabel: { fontSize: 12, fontWeight: '600', color: colors.gray.dark, marginBottom: spacing.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailValue: { fontSize: 16, color: colors.text, flex: 1 },
  copyBtn: { fontSize: 24, padding: spacing.sm },
  deleteBtn: { backgroundColor: colors.status.error, padding: spacing.lg, borderRadius: 12, alignItems: 'center', marginTop: spacing.md },
  deleteBtnText: { fontSize: 16, fontWeight: 'bold', color: colors.white },
  generatorOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  generatorModal: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.xl },
  generatorTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  checkbox: { fontSize: 24, marginRight: spacing.md },
  optionText: { fontSize: 16, color: colors.text },
  generatePasswordBtn: { backgroundColor: colors.secondary, padding: spacing.lg, borderRadius: 12, alignItems: 'center', marginTop: spacing.md },
  generatePasswordBtnText: { fontSize: 16, fontWeight: 'bold', color: colors.white },
  generatedPasswordCard: { backgroundColor: colors.gray.light, padding: spacing.lg, borderRadius: 12, marginTop: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  generatedPassword: { fontSize: 16, fontWeight: 'bold', color: colors.text, flex: 1 },
  generatorButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  generatorBtnCancel: { flex: 1, backgroundColor: colors.gray.light, padding: spacing.md, borderRadius: 12, alignItems: 'center' },
  generatorBtnCancelText: { fontSize: 14, fontWeight: '600', color: colors.text },
  generatorBtnUse: { flex: 1, backgroundColor: colors.primary, padding: spacing.md, borderRadius: 12, alignItems: 'center' },
  generatorBtnUseText: { fontSize: 14, fontWeight: 'bold', color: colors.white },
});
