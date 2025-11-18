import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView,
  TextInput, Modal, FlatList, Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Barcode from 'react-native-barcode-builder';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Barcode_Library_data';

interface SavedBarcode {
  id: string;
  productName: string;
  number: string;
  format: 'EAN13' | 'UPC' | 'CODE128';
  createdAt: string;
}

export default function App() {
  const [format, setFormat] = useState<'EAN13' | 'UPC' | 'CODE128'>('EAN13');
  const [barcodeNumber, setBarcodeNumber] = useState('');
  const [savedBarcodes, setSavedBarcodes] = useState<SavedBarcode[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [productName, setProductName] = useState('');
  const [count, setCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setSavedBarcodes(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveBarcode = async () => {
    if (!productName.trim() || !barcodeNumber) return;

    const newBarcode: SavedBarcode = {
      id: Date.now().toString(),
      productName,
      number: barcodeNumber,
      format,
      createdAt: new Date().toISOString(),
    };

    const updated = [newBarcode, ...savedBarcodes];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSavedBarcodes(updated);
    setShowSaveModal(false);
    setProductName('');

    const newCount = count + 1;
    setCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const deleteBarcode = async (id: string) => {
    const updated = savedBarcodes.filter(b => b.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSavedBarcodes(updated);
  };

  const validateBarcode = (): boolean => {
    if (!barcodeNumber) return false;
    
    if (format === 'EAN13' && barcodeNumber.length !== 13) return false;
    if (format === 'UPC' && barcodeNumber.length !== 12) return false;
    
    return /^\d+$/.test(barcodeNumber);
  };

  const isValid = validateBarcode();

  const generateRandom = () => {
    let length = format === 'EAN13' ? 13 : format === 'UPC' ? 12 : 10;
    let num = '';
    for (let i = 0; i < length; i++) {
      num += Math.floor(Math.random() * 10);
    }
    setBarcodeNumber(num);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Barcode Generator</Text>
        <TouchableOpacity style={styles.libraryBtn} onPress={() => setShowLibrary(true)}>
          <Text style={styles.libraryBtnText}>Library ({savedBarcodes.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.label}>Format</Text>
          <View style={styles.formatRow}>
            {(['EAN13', 'UPC', 'CODE128'] as const).map(fmt => (
              <TouchableOpacity
                key={fmt}
                style={[styles.formatBtn, format === fmt && styles.formatBtnActive]}
                onPress={() => setFormat(fmt)}
              >
                <Text style={[styles.formatText, format === fmt && styles.formatTextActive]}>
                  {fmt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Barcode Number</Text>
          <TextInput
            style={styles.input}
            value={barcodeNumber}
            onChangeText={setBarcodeNumber}
            placeholder={format === 'EAN13' ? '13 digits' : format === 'UPC' ? '12 digits' : 'Any digits'}
            keyboardType="number-pad"
            placeholderTextColor={colors.gray.medium}
          />
          <TouchableOpacity style={styles.randomBtn} onPress={generateRandom}>
            <Text style={styles.randomBtnText}>Generate Random</Text>
          </TouchableOpacity>
        </View>

        {isValid && (
          <View style={styles.barcodeDisplay}>
            <Text style={styles.barcodeTitle}>Generated Barcode</Text>
            <View style={styles.barcodeBox}>
              <Barcode
                value={barcodeNumber}
                format={format}
                width={2}
                height={100}
                text={barcodeNumber}
              />
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowSaveModal(true)}>
                <Text style={styles.actionBtnText}>Save to Library</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSecondary]}
                onPress={() => Share.share({ message: barcodeNumber })}
              >
                <Text style={styles.actionBtnTextSecondary}>Share Number</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <AdBanner />

      <Modal visible={showSaveModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.saveModal}>
            <Text style={styles.saveModalTitle}>Save Barcode</Text>
            <TextInput
              style={styles.saveInput}
              value={productName}
              onChangeText={setProductName}
              placeholder="Product name..."
              placeholderTextColor={colors.gray.medium}
            />
            <View style={styles.saveButtons}>
              <TouchableOpacity
                style={[styles.saveBtn, styles.saveBtnCancel]}
                onPress={() => { setShowSaveModal(false); setProductName(''); }}
              >
                <Text style={styles.saveBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, styles.saveBtnSave]} onPress={saveBarcode}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showLibrary} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Barcode Library</Text>
            <TouchableOpacity onPress={() => setShowLibrary(false)}>
              <Text style={styles.closeBtn}>Close</Text>
            </TouchableOpacity>
          </View>

          {savedBarcodes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No saved barcodes</Text>
            </View>
          ) : (
            <FlatList
              data={savedBarcodes}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.barcodeCard}>
                  <View style={styles.barcodeCardHeader}>
                    <View>
                      <Text style={styles.barcodeProductName}>{item.productName}</Text>
                      <Text style={styles.barcodeDate}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteBarcode(item.id)}>
                      <Text style={styles.deleteBtnText}>×</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.barcodePreview}>
                    <Barcode value={item.number} format={item.format} width={1.5} height={60} />
                  </View>
                  <Text style={styles.barcodeFormat}>{item.format}</Text>
                </View>
              )}
              contentContainerStyle={styles.libraryList}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray.light },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  libraryBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.primary, borderRadius: 8 },
  libraryBtnText: { fontSize: 14, color: colors.white, fontWeight: '600' },
  section: { padding: spacing.lg, backgroundColor: colors.white, marginTop: spacing.sm },
  label: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  formatRow: { flexDirection: 'row', gap: spacing.sm },
  formatBtn: { flex: 1, padding: spacing.md, backgroundColor: colors.gray.light, borderRadius: 8, alignItems: 'center' },
  formatBtnActive: { backgroundColor: colors.primary },
  formatText: { fontSize: 14, fontWeight: '600', color: colors.text },
  formatTextActive: { color: colors.white },
  input: { backgroundColor: colors.gray.light, padding: spacing.md, borderRadius: 12, fontSize: 20, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  randomBtn: { marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.secondary, borderRadius: 8, alignItems: 'center' },
  randomBtnText: { fontSize: 14, fontWeight: 'bold', color: colors.white },
  barcodeDisplay: { margin: spacing.lg, padding: spacing.lg, backgroundColor: colors.white, borderRadius: 16, alignItems: 'center', elevation: 4 },
  barcodeTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  barcodeBox: { padding: spacing.lg, backgroundColor: colors.white, borderRadius: 12, marginBottom: spacing.lg },
  actionButtons: { width: '100%', gap: spacing.md },
  actionBtn: { padding: spacing.md, backgroundColor: colors.primary, borderRadius: 12, alignItems: 'center' },
  actionBtnSecondary: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.primary },
  actionBtnText: { fontSize: 16, fontWeight: 'bold', color: colors.white },
  actionBtnTextSecondary: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  saveModal: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.xl, width: '85%' },
  saveModalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  saveInput: { backgroundColor: colors.gray.light, padding: spacing.md, borderRadius: 12, fontSize: 16, color: colors.text, marginBottom: spacing.lg },
  saveButtons: { flexDirection: 'row', gap: spacing.md },
  saveBtn: { flex: 1, padding: spacing.md, borderRadius: 12, alignItems: 'center' },
  saveBtnCancel: { backgroundColor: colors.gray.light },
  saveBtnSave: { backgroundColor: colors.primary },
  saveBtnText: { fontSize: 16, fontWeight: 'bold', color: colors.white },
  saveBtnTextCancel: { fontSize: 16, fontWeight: '600', color: colors.text },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray.light },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  closeBtn: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyText: { fontSize: 18, color: colors.gray.dark },
  libraryList: { padding: spacing.lg },
  barcodeCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.md, elevation: 2 },
  barcodeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  barcodeProductName: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  barcodeDate: { fontSize: 12, color: colors.gray.dark, marginTop: spacing.xs },
  deleteBtn: { width: 32, height: 32, backgroundColor: colors.status.error, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  deleteBtnText: { fontSize: 20, fontWeight: 'bold', color: colors.white },
  barcodePreview: { alignItems: 'center', marginVertical: spacing.md },
  barcodeFormat: { fontSize: 12, fontWeight: '600', color: colors.gray.dark, textAlign: 'center' },
});
