import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Color_Palette_Generator_palettes';

interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
  harmonyType: string;
  createdAt: string;
  isFavorite: boolean;
}

type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'monochromatic' | 'random';

const HARMONY_TYPES: { id: HarmonyType; name: string; description: string }[] = [
  { id: 'complementary', name: 'Complementary', description: 'Opposite colors' },
  { id: 'analogous', name: 'Analogous', description: 'Adjacent colors' },
  { id: 'triadic', name: 'Triadic', description: '3 evenly spaced' },
  { id: 'tetradic', name: 'Tetradic', description: '4 colors square' },
  { id: 'monochromatic', name: 'Monochromatic', description: 'Single hue variations' },
  { id: 'random', name: 'Random', description: 'Random colors' },
];

export default function App() {
  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [currentColors, setCurrentColors] = useState<string[]>([]);
  const [selectedHarmony, setSelectedHarmony] = useState<HarmonyType>('complementary');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerColorIndex, setPickerColorIndex] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [paletteName, setPaletteName] = useState('');
  const [showPalettes, setShowPalettes] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadPalettes();
    generatePalette('complementary');
  }, []);

  const loadPalettes = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setPalettes(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const savePalettes = async (data: ColorPalette[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setPalettes(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
  };

  const hexToHsl = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  };

  const generatePalette = (harmonyType: HarmonyType) => {
    const baseHue = Math.floor(Math.random() * 360);
    const baseSat = 60 + Math.random() * 30;
    const baseLum = 50 + Math.random() * 20;
    let newColors: string[] = [];

    switch (harmonyType) {
      case 'complementary':
        newColors = [
          hslToHex(baseHue, baseSat, baseLum),
          hslToHex((baseHue + 180) % 360, baseSat, baseLum),
          hslToHex(baseHue, baseSat * 0.5, baseLum * 1.2),
          hslToHex((baseHue + 180) % 360, baseSat * 0.5, baseLum * 0.8),
          hslToHex(baseHue, baseSat * 0.3, baseLum * 1.4),
        ];
        break;
      case 'analogous':
        newColors = [
          hslToHex(baseHue, baseSat, baseLum),
          hslToHex((baseHue + 30) % 360, baseSat, baseLum),
          hslToHex((baseHue + 60) % 360, baseSat, baseLum),
          hslToHex((baseHue - 30 + 360) % 360, baseSat * 0.7, baseLum * 1.1),
          hslToHex((baseHue + 15) % 360, baseSat * 0.5, baseLum * 1.3),
        ];
        break;
      case 'triadic':
        newColors = [
          hslToHex(baseHue, baseSat, baseLum),
          hslToHex((baseHue + 120) % 360, baseSat, baseLum),
          hslToHex((baseHue + 240) % 360, baseSat, baseLum),
          hslToHex(baseHue, baseSat * 0.5, baseLum * 1.2),
          hslToHex((baseHue + 120) % 360, baseSat * 0.5, baseLum * 0.8),
        ];
        break;
      case 'tetradic':
        newColors = [
          hslToHex(baseHue, baseSat, baseLum),
          hslToHex((baseHue + 90) % 360, baseSat, baseLum),
          hslToHex((baseHue + 180) % 360, baseSat, baseLum),
          hslToHex((baseHue + 270) % 360, baseSat, baseLum),
          hslToHex(baseHue, baseSat * 0.5, baseLum * 1.2),
        ];
        break;
      case 'monochromatic':
        newColors = [
          hslToHex(baseHue, baseSat, baseLum * 0.4),
          hslToHex(baseHue, baseSat, baseLum * 0.7),
          hslToHex(baseHue, baseSat, baseLum),
          hslToHex(baseHue, baseSat, baseLum * 1.2),
          hslToHex(baseHue, baseSat * 0.5, baseLum * 1.4),
        ];
        break;
      case 'random':
        newColors = Array.from({ length: 5 }, () =>
          hslToHex(Math.random() * 360, 60 + Math.random() * 30, 50 + Math.random() * 20)
        );
        break;
    }

    setCurrentColors(newColors);
    setSelectedHarmony(harmonyType);

    const newCount = usageCount + 1;
    setUsageCount(newCount);
    if (newCount % 4 === 0) showInterstitialAd();
  };

  const openColorPicker = (index: number) => {
    setPickerColorIndex(index);
    setShowPicker(true);
  };

  const updateColor = (newColor: string) => {
    const updated = [...currentColors];
    updated[pickerColorIndex] = newColor;
    setCurrentColors(updated);
  };

  const savePalette = () => {
    if (!paletteName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for your palette');
      return;
    }

    const newPalette: ColorPalette = {
      id: Date.now().toString(),
      name: paletteName,
      colors: currentColors,
      harmonyType: selectedHarmony,
      createdAt: new Date().toISOString(),
      isFavorite: false,
    };

    savePalettes([newPalette, ...palettes]);
    setPaletteName('');
    setShowSaveModal(false);
    Alert.alert('Saved!', 'Palette saved successfully');
  };

  const toggleFavorite = (id: string) => {
    savePalettes(palettes.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
  };

  const deletePalette = (id: string) => {
    Alert.alert('Delete Palette', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => savePalettes(palettes.filter(p => p.id !== id)) },
    ]);
  };

  const loadPalette = (palette: ColorPalette) => {
    setCurrentColors(palette.colors);
    setSelectedHarmony(palette.harmonyType as HarmonyType);
    setShowPalettes(false);
  };

  const copyToClipboard = (text: string) => {
    Alert.alert('Copied!', `${text} copied to clipboard`);
  };

  const hexToRgb = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Color Palette Creator</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowPalettes(true)}
          >
            <Text style={styles.headerBtnText}>Saved ({palettes.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.harmonySection}>
          <Text style={styles.sectionTitle}>Harmony Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.harmonyScroll}>
            {HARMONY_TYPES.map(harmony => (
              <TouchableOpacity
                key={harmony.id}
                style={[styles.harmonyBtn, selectedHarmony === harmony.id && styles.harmonyBtnActive]}
                onPress={() => generatePalette(harmony.id)}
              >
                <Text style={[styles.harmonyBtnName, selectedHarmony === harmony.id && styles.harmonyBtnNameActive]}>
                  {harmony.name}
                </Text>
                <Text style={styles.harmonyBtnDesc}>{harmony.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.palettePreview}>
          {currentColors.map((color, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.colorBlock, { backgroundColor: color }]}
              onPress={() => openColorPicker(index)}
              onLongPress={() => copyToClipboard(color)}
            >
              <View style={styles.colorInfo}>
                <Text style={[styles.colorHex, { color: hexToHsl(color)[2] > 50 ? '#000' : '#fff' }]}>
                  {color}
                </Text>
                <Text style={[styles.colorRgb, { color: hexToHsl(color)[2] > 50 ? '#333' : '#ddd' }]}>
                  {hexToRgb(color)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => generatePalette(selectedHarmony)}
          >
            <Text style={styles.actionBtnIcon}>🎲</Text>
            <Text style={styles.actionBtnText}>Generate New</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSave]}
            onPress={() => setShowSaveModal(true)}
          >
            <Text style={styles.actionBtnIcon}>💾</Text>
            <Text style={styles.actionBtnText}>Save Palette</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.colorDetails}>
          <Text style={styles.sectionTitle}>Color Details</Text>
          {currentColors.map((color, index) => {
            const [h, s, l] = hexToHsl(color);
            return (
              <View key={index} style={styles.detailRow}>
                <View style={[styles.detailSwatch, { backgroundColor: color }]} />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailHex}>{color}</Text>
                  <Text style={styles.detailValues}>
                    HSL({h}°, {s}%, {l}%)
                  </Text>
                  <Text style={styles.detailValues}>{hexToRgb(color)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.detailCopyBtn}
                  onPress={() => copyToClipboard(color)}
                >
                  <Text style={styles.detailCopyText}>Copy</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <AdBanner />

      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <Text style={styles.modalTitle}>Pick Color</Text>
            <View style={styles.pickerPreview} style={{ backgroundColor: currentColors[pickerColorIndex] }}>
              <Text style={styles.pickerPreviewText}>{currentColors[pickerColorIndex]}</Text>
            </View>
            <View style={styles.colorButtons}>
              {['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'].map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorBtn, { backgroundColor: color }]}
                  onPress={() => updateColor(color)}
                />
              ))}
            </View>
            <TextInput
              style={styles.hexInput}
              value={currentColors[pickerColorIndex]}
              onChangeText={(text) => {
                if (/^#[0-9A-F]{6}$/i.test(text)) {
                  updateColor(text.toUpperCase());
                }
              }}
              placeholder="#000000"
              maxLength={7}
            />
            <TouchableOpacity
              style={styles.pickerCloseBtn}
              onPress={() => setShowPicker(false)}
            >
              <Text style={styles.pickerCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showSaveModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Palette</Text>
            <TextInput
              style={styles.input}
              value={paletteName}
              onChangeText={setPaletteName}
              placeholder="Enter palette name..."
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setShowSaveModal(false);
                  setPaletteName('');
                }}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={savePalette}
              >
                <Text style={styles.modalBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPalettes} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.paletteListHeader}>
            <Text style={styles.paletteListTitle}>Saved Palettes</Text>
            <TouchableOpacity onPress={() => setShowPalettes(false)}>
              <Text style={styles.closeBtn}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={palettes.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0))}
            keyExtractor={p => p.id}
            contentContainerStyle={styles.paletteList}
            ListEmptyComponent={<Text style={styles.emptyText}>No saved palettes yet</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.paletteItem}
                onPress={() => loadPalette(item)}
              >
                <View style={styles.paletteItemHeader}>
                  <Text style={styles.paletteItemName}>{item.name}</Text>
                  <View style={styles.paletteItemActions}>
                    <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                      <Text style={styles.favoriteIcon}>{item.isFavorite ? '⭐' : '☆'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deletePalette(item.id)}>
                      <Text style={styles.deleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.paletteItemType}>{item.harmonyType}</Text>
                <View style={styles.paletteItemColors}>
                  {item.colors.map((color, idx) => (
                    <View key={idx} style={[styles.paletteItemColor, { backgroundColor: color }]} />
                  ))}
                </View>
              </TouchableOpacity>
            )}
          />
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
    backgroundColor: colors.white,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  headerButtons: { flexDirection: 'row', gap: spacing.sm },
  headerBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8 },
  headerBtnText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  content: { flex: 1 },
  harmonySection: { padding: spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  harmonyScroll: { marginHorizontal: -spacing.lg },
  harmonyBtn: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginLeft: spacing.lg,
    minWidth: 140,
    borderWidth: 2,
    borderColor: colors.gray.light,
  },
  harmonyBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  harmonyBtnName: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  harmonyBtnNameActive: { color: colors.white },
  harmonyBtnDesc: { fontSize: 11, color: colors.gray.dark, marginTop: 2 },
  palettePreview: { paddingHorizontal: spacing.lg, gap: spacing.md },
  colorBlock: {
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  colorInfo: { alignItems: 'center' },
  colorHex: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  colorRgb: { fontSize: 12 },
  actions: { flexDirection: 'row', padding: spacing.lg, gap: spacing.md },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray.light,
  },
  actionBtnSave: { borderColor: colors.primary, backgroundColor: colors.primary },
  actionBtnIcon: { fontSize: 24, marginBottom: spacing.sm },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },
  colorDetails: { padding: spacing.lg, paddingTop: 0 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  detailSwatch: { width: 40, height: 40, borderRadius: 8, marginRight: spacing.md },
  detailInfo: { flex: 1 },
  detailHex: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  detailValues: { fontSize: 11, color: colors.gray.dark, marginTop: 2 },
  detailCopyBtn: { backgroundColor: colors.gray.light, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8 },
  detailCopyText: { fontSize: 12, fontWeight: '600', color: colors.text },
  bottomSpacer: { height: 100 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  input: { backgroundColor: colors.gray.light, padding: spacing.lg, borderRadius: 12, fontSize: 16, marginBottom: spacing.lg },
  modalButtons: { flexDirection: 'row', gap: spacing.md },
  modalBtn: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: colors.gray.light },
  modalBtnConfirm: { backgroundColor: colors.primary },
  modalBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  modalBtnTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  pickerModal: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl },
  pickerPreview: {
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pickerPreviewText: { fontSize: 18, fontWeight: 'bold', color: colors.white, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  colorButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  colorBtn: { width: 50, height: 50, borderRadius: 25, elevation: 2 },
  hexInput: { backgroundColor: colors.gray.light, padding: spacing.lg, borderRadius: 12, fontSize: 16, marginBottom: spacing.lg, textAlign: 'center' },
  pickerCloseBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  pickerCloseBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  paletteListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  paletteListTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  closeBtn: { fontSize: 16, fontWeight: '600', color: colors.primary },
  paletteList: { padding: spacing.lg },
  emptyText: { textAlign: 'center', marginTop: spacing.xl, color: colors.gray.medium, fontSize: 16 },
  paletteItem: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.md, elevation: 1 },
  paletteItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  paletteItemName: { fontSize: 16, fontWeight: 'bold', color: colors.text, flex: 1 },
  paletteItemActions: { flexDirection: 'row', gap: spacing.md },
  favoriteIcon: { fontSize: 20 },
  deleteIcon: { fontSize: 18 },
  paletteItemType: { fontSize: 12, color: colors.gray.dark, marginBottom: spacing.md, textTransform: 'capitalize' },
  paletteItemColors: { flexDirection: 'row', gap: spacing.sm },
  paletteItemColor: { flex: 1, height: 40, borderRadius: 8 },
});
