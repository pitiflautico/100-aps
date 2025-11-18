import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Soundboard_data';
const CATEGORIES_KEY = '@Soundboard_categories';

interface SoundButton {
  id: string;
  name: string;
  category: string;
  color: string;
  emoji: string;
}

type Category = 'All' | 'Effects' | 'Music' | 'Voice' | 'Animals' | 'Custom';

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

const DEFAULT_SOUNDS: SoundButton[] = [
  { id: '1', name: 'Applause', category: 'Effects', color: '#ef4444', emoji: '👏' },
  { id: '2', name: 'Drumroll', category: 'Effects', color: '#f97316', emoji: '🥁' },
  { id: '3', name: 'Tada', category: 'Effects', color: '#f59e0b', emoji: '🎺' },
  { id: '4', name: 'Laugh', category: 'Voice', color: '#84cc16', emoji: '😂' },
  { id: '5', name: 'Oooh', category: 'Voice', color: '#22c55e', emoji: '😮' },
  { id: '6', name: 'Wow', category: 'Voice', color: '#10b981', emoji: '😲' },
  { id: '7', name: 'Fail', category: 'Effects', color: '#0ea5e9', emoji: '❌' },
  { id: '8', name: 'Win', category: 'Effects', color: '#6366f1', emoji: '✨' },
  { id: '9', name: 'Dog Bark', category: 'Animals', color: '#8b5cf6', emoji: '🐕' },
  { id: '10', name: 'Cat Meow', category: 'Animals', color: '#a855f7', emoji: '🐈' },
  { id: '11', name: 'Roar', category: 'Animals', color: '#d946ef', emoji: '🦁' },
  { id: '12', name: 'Crickets', category: 'Animals', color: '#ec4899', emoji: '🦗' },
];

export default function App() {
  const [sounds, setSounds] = useState<SoundButton[]>(DEFAULT_SOUNDS);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSound, setEditingSound] = useState<SoundButton | null>(null);
  const [newSoundName, setNewSoundName] = useState('');
  const [newSoundCategory, setNewSoundCategory] = useState<Category>('Custom');
  const [newSoundColor, setNewSoundColor] = useState(COLORS[0]);
  const [newSoundEmoji, setNewSoundEmoji] = useState('🔊');
  const [adCount, setAdCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const loadedSounds = JSON.parse(saved);
        setSounds(loadedSounds);
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (data: SoundButton[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSounds(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const playSound = (soundId: string) => {
    if (playingId === soundId) {
      setPlayingId(null);
      return;
    }

    setPlayingId(soundId);
    // Simulated playback
    setTimeout(() => {
      setPlayingId(null);
    }, 1500);
  };

  const addSound = () => {
    if (!newSoundName.trim()) {
      Alert.alert('Error', 'Please enter a sound name');
      return;
    }

    const newSound: SoundButton = {
      id: Date.now().toString(),
      name: newSoundName.trim(),
      category: newSoundCategory,
      color: newSoundColor,
      emoji: newSoundEmoji,
    };

    const newSounds = [...sounds, newSound];
    saveData(newSounds);
    resetAddForm();
    setShowAddModal(false);

    const newCount = adCount + 1;
    setAdCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const openEditModal = (sound: SoundButton) => {
    setEditingSound(sound);
    setNewSoundName(sound.name);
    setNewSoundCategory(sound.category as Category);
    setNewSoundColor(sound.color);
    setNewSoundEmoji(sound.emoji);
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!editingSound || !newSoundName.trim()) return;

    const updated = sounds.map(s =>
      s.id === editingSound.id
        ? {
            ...s,
            name: newSoundName.trim(),
            category: newSoundCategory,
            color: newSoundColor,
            emoji: newSoundEmoji,
          }
        : s
    );

    saveData(updated);
    resetAddForm();
    setShowEditModal(false);
    setEditingSound(null);
  };

  const deleteSound = (id: string) => {
    Alert.alert('Delete Sound', 'Are you sure you want to delete this sound?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => saveData(sounds.filter(s => s.id !== id)),
      },
    ]);
  };

  const resetAddForm = () => {
    setNewSoundName('');
    setNewSoundCategory('Custom');
    setNewSoundColor(COLORS[0]);
    setNewSoundEmoji('🔊');
  };

  const getFilteredSounds = () => {
    if (selectedCategory === 'All') return sounds;
    return sounds.filter(s => s.category === selectedCategory);
  };

  const getCategoryCounts = () => {
    const counts: { [key: string]: number } = {
      All: sounds.length,
      Effects: 0,
      Music: 0,
      Voice: 0,
      Animals: 0,
      Custom: 0,
    };

    sounds.forEach(sound => {
      if (counts[sound.category] !== undefined) {
        counts[sound.category]++;
      }
    });

    return counts;
  };

  const categoryCounts = getCategoryCounts();
  const filteredSounds = getFilteredSounds();
  const categories: Category[] = ['All', 'Effects', 'Music', 'Voice', 'Animals', 'Custom'];

  const renderSoundButton = (sound: SoundButton) => {
    const isPlaying = playingId === sound.id;

    return (
      <TouchableOpacity
        key={sound.id}
        style={[
          styles.soundButton,
          { backgroundColor: sound.color },
          isPlaying && styles.soundButtonPlaying,
        ]}
        onPress={() => playSound(sound.id)}
        onLongPress={() => openEditModal(sound)}
        activeOpacity={0.7}
      >
        <Text style={styles.soundEmoji}>{sound.emoji}</Text>
        <Text style={styles.soundName} numberOfLines={2}>
          {sound.name}
        </Text>
        {isPlaying && <Text style={styles.playingIndicator}>♪</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Soundboard</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category} ({categoryCounts[category]})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.soundGrid}
        contentContainerStyle={styles.soundGridContent}
      >
        <View style={styles.grid}>
          {filteredSounds.map(sound => renderSoundButton(sound))}
        </View>

        {filteredSounds.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔇</Text>
            <Text style={styles.emptyText}>No sounds in this category</Text>
            <Text style={styles.emptySubtext}>Add custom sounds to get started</Text>
          </View>
        )}
      </ScrollView>

      <AdBanner />

      {/* Add Sound Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Sound</Text>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.label}>Sound Name</Text>
              <TextInput
                style={styles.input}
                value={newSoundName}
                onChangeText={setNewSoundName}
                placeholder="Enter sound name"
                autoFocus
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {(['Effects', 'Music', 'Voice', 'Animals', 'Custom'] as Category[]).map(
                  cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryOption,
                        newSoundCategory === cat && styles.categoryOptionActive,
                      ]}
                      onPress={() => setNewSoundCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          newSoundCategory === cat && styles.categoryOptionTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              <Text style={styles.label}>Emoji</Text>
              <View style={styles.emojiGrid}>
                {['🔊', '📢', '🎵', '🎶', '🎸', '🎹', '🥁', '🎺', '🎤', '🔔', '⏰', '📣'].map(
                  emoji => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.emojiButton,
                        newSoundEmoji === emoji && styles.emojiButtonActive,
                      ]}
                      onPress={() => setNewSoundEmoji(emoji)}
                    >
                      <Text style={styles.emojiButtonText}>{emoji}</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              <Text style={styles.label}>Color</Text>
              <View style={styles.colorGrid}>
                {COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      newSoundColor === color && styles.colorButtonActive,
                    ]}
                    onPress={() => setNewSoundColor(color)}
                  />
                ))}
              </View>

              <View style={styles.previewSection}>
                <Text style={styles.label}>Preview</Text>
                <View style={[styles.previewButton, { backgroundColor: newSoundColor }]}>
                  <Text style={styles.previewEmoji}>{newSoundEmoji}</Text>
                  <Text style={styles.previewName}>{newSoundName || 'Sound Name'}</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  resetAddForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={addSound}
              >
                <Text style={styles.saveButtonText}>Add Sound</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Sound Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Sound</Text>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.label}>Sound Name</Text>
              <TextInput
                style={styles.input}
                value={newSoundName}
                onChangeText={setNewSoundName}
                placeholder="Enter sound name"
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {(['Effects', 'Music', 'Voice', 'Animals', 'Custom'] as Category[]).map(
                  cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryOption,
                        newSoundCategory === cat && styles.categoryOptionActive,
                      ]}
                      onPress={() => setNewSoundCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          newSoundCategory === cat && styles.categoryOptionTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              <Text style={styles.label}>Emoji</Text>
              <View style={styles.emojiGrid}>
                {['🔊', '📢', '🎵', '🎶', '🎸', '🎹', '🥁', '🎺', '🎤', '🔔', '⏰', '📣'].map(
                  emoji => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.emojiButton,
                        newSoundEmoji === emoji && styles.emojiButtonActive,
                      ]}
                      onPress={() => setNewSoundEmoji(emoji)}
                    >
                      <Text style={styles.emojiButtonText}>{emoji}</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              <Text style={styles.label}>Color</Text>
              <View style={styles.colorGrid}>
                {COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      newSoundColor === color && styles.colorButtonActive,
                    ]}
                    onPress={() => setNewSoundColor(color)}
                  />
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={() => {
                  if (editingSound) {
                    setShowEditModal(false);
                    setEditingSound(null);
                    resetAddForm();
                    deleteSound(editingSound.id);
                  }
                }}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveEdit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: colors.white,
    fontWeight: '300',
  },
  categoriesScroll: {
    maxHeight: 50,
    marginBottom: spacing.md,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.gray.light,
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray.dark,
  },
  categoryTextActive: {
    color: colors.white,
  },
  soundGrid: {
    flex: 1,
  },
  soundGridContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  soundButton: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
  },
  soundButtonPlaying: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  soundEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  soundName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },
  playingIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    fontSize: 16,
    color: colors.white,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray.dark,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray.medium,
  },
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
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  modalScroll: {
    maxHeight: '70%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.gray.light,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryOptionActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  categoryOptionText: {
    fontSize: 14,
    color: colors.gray.dark,
    fontWeight: '500',
  },
  categoryOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  emojiButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.gray.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  emojiButtonText: {
    fontSize: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  colorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: colors.text,
  },
  previewSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  previewButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    padding: spacing.sm,
  },
  previewEmoji: {
    fontSize: 40,
    marginBottom: spacing.xs,
  },
  previewName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray.light,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.status.error,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
