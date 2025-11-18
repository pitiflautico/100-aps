import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  PanResponder,
  Alert,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, G } from 'react-native-svg';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const { width, height } = Dimensions.get('window');
const CANVAS_HEIGHT = height - 250;
const STORAGE_KEY = '@Drawing_Pad_Simple_drawings';

interface PathData {
  id: string;
  path: string;
  color: string;
  strokeWidth: number;
}

interface Drawing {
  id: string;
  name: string;
  paths: PathData[];
  createdAt: string;
  thumbnail: string;
}

const COLORS = [
  '#000000', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#FFFFFF',
];

const BRUSH_SIZES = [2, 4, 8, 12, 20];

export default function App() {
  const [paths, setPaths] = useState<PathData[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [showDrawings, setShowDrawings] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(`M${locationX},${locationY}`);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath((prev) => `${prev} L${locationX},${locationY}`);
      },
      onPanResponderRelease: () => {
        if (currentPath) {
          const newPath: PathData = {
            id: Date.now().toString(),
            path: currentPath,
            color: isEraser ? '#FFFFFF' : selectedColor,
            strokeWidth: isEraser ? 20 : brushSize,
          };
          setPaths([...paths, newPath]);
          setCurrentPath('');
        }
      },
    })
  ).current;

  useEffect(() => {
    initializeAds();
    loadDrawings();
  }, []);

  const loadDrawings = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setDrawings(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveDrawings = async (data: Drawing[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setDrawings(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const clearCanvas = () => {
    Alert.alert('Clear Canvas', 'Are you sure you want to clear everything?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setPaths([]);
          setCurrentPath('');
        },
      },
    ]);
  };

  const undo = () => {
    if (paths.length > 0) {
      setPaths(paths.slice(0, -1));
    }
  };

  const saveDrawing = () => {
    if (paths.length === 0) {
      Alert.alert('Empty Canvas', 'Draw something first!');
      return;
    }

    Alert.prompt(
      'Save Drawing',
      'Enter a name for your drawing',
      (name) => {
        if (name && name.trim()) {
          const newDrawing: Drawing = {
            id: Date.now().toString(),
            name: name.trim(),
            paths: paths,
            createdAt: new Date().toISOString(),
            thumbnail: paths[0]?.path || '',
          };
          saveDrawings([newDrawing, ...drawings]);
          Alert.alert('Saved!', 'Drawing saved successfully');

          const newCount = usageCount + 1;
          setUsageCount(newCount);
          if (newCount % 3 === 0) showInterstitialAd();
        }
      },
      'plain-text',
      '',
      'default'
    );
  };

  const loadDrawing = (drawing: Drawing) => {
    setPaths(drawing.paths);
    setShowDrawings(false);
    Alert.alert('Loaded', `"${drawing.name}" loaded`);
  };

  const deleteDrawing = (id: string) => {
    Alert.alert('Delete Drawing', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => saveDrawings(drawings.filter((d) => d.id !== id)),
      },
    ]);
  };

  const toggleEraser = () => {
    setIsEraser(!isEraser);
  };

  const selectColor = (color: string) => {
    setSelectedColor(color);
    setIsEraser(false);
    setShowColorPicker(false);
  };

  const selectBrushSize = (size: number) => {
    setBrushSize(size);
    setShowSizeSelector(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Drawing Pad</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowDrawings(true)}
          >
            <Text style={styles.headerBtnText}>📁 {drawings.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={saveDrawing}>
            <Text style={styles.headerBtnText}>💾</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.canvas} {...panResponder.panHandlers}>
        <Svg width={width} height={CANVAS_HEIGHT} style={styles.svg}>
          <G>
            {paths.map((p) => (
              <Path
                key={p.id}
                d={p.path}
                stroke={p.color}
                strokeWidth={p.strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {currentPath && (
              <Path
                d={currentPath}
                stroke={isEraser ? '#FFFFFF' : selectedColor}
                strokeWidth={isEraser ? 20 : brushSize}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </G>
        </Svg>
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.tool, isEraser && styles.toolActive]}
          onPress={toggleEraser}
        >
          <Text style={styles.toolIcon}>🧹</Text>
          <Text style={styles.toolLabel}>Eraser</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tool}
          onPress={() => setShowColorPicker(true)}
        >
          <View
            style={[
              styles.colorPreview,
              { backgroundColor: selectedColor, borderColor: selectedColor === '#FFFFFF' ? '#ddd' : selectedColor },
            ]}
          />
          <Text style={styles.toolLabel}>Color</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tool}
          onPress={() => setShowSizeSelector(true)}
        >
          <View style={styles.brushPreview}>
            <View
              style={{
                width: Math.min(brushSize * 2, 24),
                height: Math.min(brushSize * 2, 24),
                borderRadius: Math.min(brushSize * 2, 24) / 2,
                backgroundColor: '#000',
              }}
            />
          </View>
          <Text style={styles.toolLabel}>Size</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tool, paths.length === 0 && styles.toolDisabled]}
          onPress={undo}
          disabled={paths.length === 0}
        >
          <Text style={styles.toolIcon}>↶</Text>
          <Text style={styles.toolLabel}>Undo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tool} onPress={clearCanvas}>
          <Text style={styles.toolIcon}>🗑️</Text>
          <Text style={styles.toolLabel}>Clear</Text>
        </TouchableOpacity>
      </View>

      <AdBanner />

      <Modal visible={showColorPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <Text style={styles.modalTitle}>Select Color</Text>
            <View style={styles.colorGrid}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    color === '#FFFFFF' && styles.whiteColor,
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => selectColor(color)}
                >
                  {selectedColor === color && (
                    <Text style={[styles.checkmark, { color: color === '#FFFFFF' ? '#000' : '#fff' }]}>
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowColorPicker(false)}
            >
              <Text style={styles.modalCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showSizeSelector} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <Text style={styles.modalTitle}>Select Brush Size</Text>
            <View style={styles.sizeOptions}>
              {BRUSH_SIZES.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeOption,
                    brushSize === size && styles.sizeOptionSelected,
                  ]}
                  onPress={() => selectBrushSize(size)}
                >
                  <View
                    style={{
                      width: size * 3,
                      height: size * 3,
                      borderRadius: (size * 3) / 2,
                      backgroundColor: '#000',
                    }}
                  />
                  <Text style={styles.sizeLabel}>{size}px</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowSizeSelector(false)}
            >
              <Text style={styles.modalCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showDrawings} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.drawingsHeader}>
            <Text style={styles.drawingsTitle}>Saved Drawings</Text>
            <TouchableOpacity onPress={() => setShowDrawings(false)}>
              <Text style={styles.closeBtn}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={drawings}
            keyExtractor={(d) => d.id}
            numColumns={2}
            contentContainerStyle={styles.drawingsList}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No saved drawings yet</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.drawingItem}>
                <TouchableOpacity
                  style={styles.drawingPreview}
                  onPress={() => loadDrawing(item)}
                >
                  <Svg
                    width={150}
                    height={150}
                    viewBox={`0 0 ${width} ${CANVAS_HEIGHT}`}
                  >
                    <G>
                      {item.paths.map((p) => (
                        <Path
                          key={p.id}
                          d={p.path}
                          stroke={p.color}
                          strokeWidth={p.strokeWidth}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      ))}
                    </G>
                  </Svg>
                </TouchableOpacity>
                <View style={styles.drawingInfo}>
                  <Text style={styles.drawingName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.drawingDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteDrawing(item.id)}
                >
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
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
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  headerBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  headerBtnText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  canvas: {
    flex: 1,
    backgroundColor: colors.white,
    margin: spacing.lg,
    borderRadius: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  svg: { backgroundColor: colors.white },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray.light,
  },
  tool: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  toolActive: { backgroundColor: colors.gray.light },
  toolDisabled: { opacity: 0.3 },
  toolIcon: { fontSize: 24, marginBottom: 4 },
  toolLabel: { fontSize: 10, color: colors.gray.dark, fontWeight: '600' },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 4,
  },
  brushPreview: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  colorOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  whiteColor: { borderWidth: 1, borderColor: colors.gray.light },
  colorOptionSelected: { borderWidth: 4, borderColor: colors.primary },
  checkmark: { fontSize: 24, fontWeight: 'bold' },
  sizeOptions: { marginBottom: spacing.lg },
  sizeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  sizeOptionSelected: {
    backgroundColor: colors.primary + '20',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  sizeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.lg,
  },
  modalCloseBtn: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  drawingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  drawingsTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  closeBtn: { fontSize: 16, fontWeight: '600', color: colors.primary },
  drawingsList: { padding: spacing.md },
  emptyText: {
    textAlign: 'center',
    marginTop: spacing.xl,
    color: colors.gray.medium,
    fontSize: 16,
  },
  drawingItem: {
    width: '48%',
    margin: '1%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.sm,
    elevation: 1,
  },
  drawingPreview: {
    width: '100%',
    height: 150,
    backgroundColor: colors.gray.light,
    borderRadius: 8,
    overflow: 'hidden',
  },
  drawingInfo: { marginTop: spacing.sm },
  drawingName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  drawingDate: {
    fontSize: 11,
    color: colors.gray.dark,
    marginTop: 2,
  },
  deleteBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.white,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  deleteBtnText: { fontSize: 16 },
});
