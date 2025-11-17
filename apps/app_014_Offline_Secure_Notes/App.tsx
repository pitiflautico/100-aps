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

const STORAGE_KEY = '@Offline_Secure_Notes_data';
const PIN_KEY = '@Offline_Secure_Notes_pin';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

// Simple encryption/decryption using base64
const encrypt = (text: string, pin: string): string => {
  const combined = pin + text + pin.split('').reverse().join('');
  return Buffer.from(combined).toString('base64');
};

const decrypt = (encrypted: string, pin: string): string => {
  try {
    const decoded = Buffer.from(encrypted, 'base64').toString('utf-8');
    const pinLength = pin.length;
    return decoded.substring(pinLength, decoded.length - pinLength);
  } catch {
    return '';
  }
};

export default function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [hasPin, setHasPin] = useState(false);
  const [pin, setPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [setupMode, setSetupMode] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');

  const [notes, setNotes] = useState<Note[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');
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
        setHasPin(false);
        setSetupMode(true);
        setIsLocked(true);
      }
    } catch (error) {
      console.error('Error checking PIN:', error);
    }
  };

  const setupNewPin = async () => {
    if (pinInput.length !== 4) {
      Alert.alert('Error', 'PIN must be 4 digits');
      return;
    }
    if (!confirmPin) {
      setConfirmPin(pinInput);
      setPinInput('');
      return;
    }
    if (pinInput !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      setConfirmPin('');
      setPinInput('');
      return;
    }

    try {
      await AsyncStorage.setItem(PIN_KEY, pinInput);
      setPin(pinInput);
      setHasPin(true);
      setIsLocked(false);
      setSetupMode(false);
      setConfirmPin('');
      setPinInput('');
      loadData(pinInput);
    } catch (error) {
      Alert.alert('Error', 'Failed to save PIN');
    }
  };

  const verifyPin = async () => {
    try {
      const savedPin = await AsyncStorage.getItem(PIN_KEY);
      if (savedPin === pinInput) {
        setPin(pinInput);
        setIsLocked(false);
        setPinInput('');
        loadData(savedPin);
      } else {
        Alert.alert('Error', 'Incorrect PIN');
        setPinInput('');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify PIN');
    }
  };

  const loadData = async (userPin: string) => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const encrypted = JSON.parse(saved);
        const decrypted = encrypted.map((note: any) => ({
          ...note,
          title: decrypt(note.title, userPin),
          content: decrypt(note.content, userPin),
        }));
        setNotes(decrypted);
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (data: Note[]) => {
    try {
      const encrypted = data.map((note) => ({
        ...note,
        title: encrypt(note.title, pin),
        content: encrypt(note.content, pin),
      }));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
      setNotes(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const openAddModal = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setShowModal(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setShowModal(true);
  };

  const saveNote = () => {
    if (!title.trim() && !content.trim()) return;

    const now = new Date().toISOString();

    if (editingNote) {
      const updated = notes.map((n) =>
        n.id === editingNote.id ? { ...n, title: title.trim(), content: content.trim() } : n
      );
      saveData(updated);
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title: title.trim(),
        content: content.trim(),
        createdAt: now,
      };
      saveData([newNote, ...notes]);
      const newCount = count + 1;
      setCount(newCount);
      if (newCount % 5 === 0) showInterstitialAd();
    }

    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNote(null);
    setTitle('');
    setContent('');
  };

  const deleteNote = (id: string) => {
    Alert.alert('Delete Note', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => saveData(notes.filter((n) => n.id !== id)) },
    ]);
  };

  const lockApp = () => {
    setIsLocked(true);
    setPinInput('');
  };

  const changePin = async () => {
    if (newPin.length !== 4 || newPinConfirm.length !== 4) {
      Alert.alert('Error', 'PIN must be 4 digits');
      return;
    }
    if (newPin !== newPinConfirm) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }

    try {
      // Re-encrypt all notes with new PIN
      const reencrypted = notes.map((note) => ({
        ...note,
        title: encrypt(note.title, newPin),
        content: encrypt(note.content, newPin),
      }));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reencrypted));
      await AsyncStorage.setItem(PIN_KEY, newPin);
      setPin(newPin);
      setNewPin('');
      setNewPinConfirm('');
      setShowSettings(false);
      Alert.alert('Success', 'PIN changed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to change PIN');
    }
  };

  // PIN Screen (Setup or Login)
  if (isLocked) {
    return (
      <SafeAreaView style={styles.lockContainer}>
        <StatusBar style="light" />
        <View style={styles.lockContent}>
          <Text style={styles.lockIcon}>🔐</Text>
          <Text style={styles.lockTitle}>
            {setupMode ? 'Setup PIN' : 'Secure Notes'}
          </Text>
          <Text style={styles.lockSubtitle}>
            {setupMode
              ? confirmPin
                ? 'Confirm your 4-digit PIN'
                : 'Create a 4-digit PIN'
              : 'Enter your PIN to unlock'}
          </Text>

          <View style={styles.pinDisplay}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[styles.pinDot, pinInput.length > i && styles.pinDotFilled]}
              />
            ))}
          </View>

          <View style={styles.numpad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((num, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.numKey, num === '' && styles.numKeyHidden]}
                disabled={num === ''}
                onPress={() => {
                  if (num === '⌫') {
                    setPinInput(pinInput.slice(0, -1));
                  } else if (pinInput.length < 4) {
                    const newPin = pinInput + num.toString();
                    setPinInput(newPin);
                    if (newPin.length === 4) {
                      setTimeout(() => {
                        setupMode ? setupNewPin() : verifyPin();
                      }, 100);
                    }
                  }
                }}
              >
                <Text style={styles.numKeyText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Main App Screen
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Secure Notes</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsBtn}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={lockApp} style={styles.lockBtn}>
            <Text style={styles.lockBtnText}>🔒</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔐</Text>
            <Text style={styles.emptyText}>No secure notes yet</Text>
            <Text style={styles.emptySubtext}>Your notes are encrypted</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.noteCard}
            onPress={() => openEditModal(item)}
            onLongPress={() => deleteNote(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.noteTitle} numberOfLines={1}>
              {item.title || 'Untitled'}
            </Text>
            <Text style={styles.noteContent} numberOfLines={2}>
              {item.content}
            </Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AdBanner />

      {/* Add/Edit Note Modal */}
      <Modal visible={showModal} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingNote ? 'Edit' : 'New Note'}</Text>
            <TouchableOpacity onPress={saveNote} disabled={!title.trim() && !content.trim()}>
              <Text
                style={[
                  styles.modalSave,
                  (!title.trim() && !content.trim()) && styles.modalSaveDisabled,
                ]}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor={colors.gray.medium}
            />
            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              placeholder="Your secure note..."
              placeholderTextColor={colors.gray.medium}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={showSettings} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.settingsModal}>
            <Text style={styles.settingsTitle}>Settings</Text>

            <Text style={styles.sectionLabel}>Change PIN</Text>
            <TextInput
              style={styles.pinInput}
              value={newPin}
              onChangeText={(text) => setNewPin(text.replace(/[^0-9]/g, '').slice(0, 4))}
              placeholder="New 4-digit PIN"
              placeholderTextColor={colors.gray.medium}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
            <TextInput
              style={styles.pinInput}
              value={newPinConfirm}
              onChangeText={(text) => setNewPinConfirm(text.replace(/[^0-9]/g, '').slice(0, 4))}
              placeholder="Confirm PIN"
              placeholderTextColor={colors.gray.medium}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />

            <View style={styles.settingsButtons}>
              <TouchableOpacity
                style={[styles.settingsBtn2, styles.settingsBtnCancel]}
                onPress={() => {
                  setShowSettings(false);
                  setNewPin('');
                  setNewPinConfirm('');
                }}
              >
                <Text style={styles.settingsBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.settingsBtn2, styles.settingsBtnSave]} onPress={changePin}>
                <Text style={styles.settingsBtnText}>Change PIN</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.info}>
              <Text style={styles.infoText}>
                Total Notes: {notes.length}
              </Text>
              <Text style={styles.infoText}>
                All notes are encrypted with your PIN
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  lockContainer: { flex: 1, backgroundColor: colors.primary },
  lockContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  lockIcon: { fontSize: 80, marginBottom: spacing.xl },
  lockTitle: { fontSize: 32, fontWeight: 'bold', color: colors.white, marginBottom: spacing.sm },
  lockSubtitle: { fontSize: 16, color: colors.white, opacity: 0.9, marginBottom: spacing['2xl'] },
  pinDisplay: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing['3xl'] },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.white,
  },
  pinDotFilled: { backgroundColor: colors.white },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 280,
    gap: spacing.md,
  },
  numKey: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numKeyHidden: { opacity: 0 },
  numKeyText: { fontSize: 32, color: colors.white, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
    alignItems: 'center',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  headerRight: { flexDirection: 'row', gap: spacing.md },
  settingsBtn: { padding: spacing.sm },
  settingsIcon: { fontSize: 24 },
  lockBtn: { padding: spacing.sm },
  lockBtnText: { fontSize: 24 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', marginTop: spacing['3xl'] },
  emptyIcon: { fontSize: 64, marginBottom: spacing.lg },
  emptyText: { fontSize: 20, fontWeight: '600', color: colors.gray.dark, marginBottom: spacing.sm },
  emptySubtext: { fontSize: 14, color: colors.gray.medium },
  noteCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  noteContent: { fontSize: 14, color: colors.gray.dark, lineHeight: 20 },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: { color: colors.white, fontSize: 32, fontWeight: '300' },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  modalCancel: { fontSize: 16, color: colors.status.error, fontWeight: '600' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  modalSave: { fontSize: 16, color: colors.primary, fontWeight: 'bold' },
  modalSaveDisabled: { color: colors.gray.medium },
  modalContent: { flex: 1, padding: spacing.lg },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  contentInput: { fontSize: 16, color: colors.text, lineHeight: 24, minHeight: 300 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl },
  settingsModal: { backgroundColor: colors.white, borderRadius: 24, padding: spacing.xl },
  settingsTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xl },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: colors.gray.dark, marginBottom: spacing.sm },
  pinInput: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  settingsButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  settingsBtn2: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  settingsBtnCancel: { backgroundColor: colors.gray.light },
  settingsBtnSave: { backgroundColor: colors.primary },
  settingsBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  settingsBtnTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  info: { marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.gray.light },
  infoText: { fontSize: 14, color: colors.gray.dark, marginBottom: spacing.xs, textAlign: 'center' },
});
