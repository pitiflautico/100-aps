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

const STORAGE_KEY = '@Tattoo_Ideas_Gallery_ideas';

interface TattooIdea {
  id: string;
  title: string;
  category: string;
  placement: string;
  description: string;
  notes: string;
  isFavorite: boolean;
  createdAt: string;
}

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '🎨' },
  { id: 'minimalist', name: 'Minimalist', icon: '✨' },
  { id: 'traditional', name: 'Traditional', icon: '🌹' },
  { id: 'tribal', name: 'Tribal', icon: '🔱' },
  { id: 'geometric', name: 'Geometric', icon: '◇' },
  { id: 'nature', name: 'Nature', icon: '🌿' },
  { id: 'animal', name: 'Animal', icon: '🦁' },
  { id: 'text', name: 'Text/Quote', icon: '📝' },
  { id: 'abstract', name: 'Abstract', icon: '🎭' },
];

const BODY_PLACEMENTS = [
  { id: 'arm', name: 'Arm', icon: '💪' },
  { id: 'forearm', name: 'Forearm', icon: '🤚' },
  { id: 'wrist', name: 'Wrist', icon: '⌚' },
  { id: 'chest', name: 'Chest', icon: '🫀' },
  { id: 'back', name: 'Back', icon: '🔙' },
  { id: 'shoulder', name: 'Shoulder', icon: '👕' },
  { id: 'leg', name: 'Leg', icon: '🦵' },
  { id: 'ankle', name: 'Ankle', icon: '🦶' },
  { id: 'neck', name: 'Neck', icon: '👔' },
  { id: 'finger', name: 'Finger', icon: '👆' },
];

const SAMPLE_IDEAS: TattooIdea[] = [
  {
    id: '1',
    title: 'Minimalist Mountain',
    category: 'minimalist',
    placement: 'forearm',
    description: 'Simple line art of mountain peaks',
    notes: 'Black ink, small size',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Geometric Wolf',
    category: 'geometric',
    placement: 'chest',
    description: 'Wolf head made of geometric shapes',
    notes: 'Medium size, detailed',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Rose & Thorns',
    category: 'traditional',
    placement: 'arm',
    description: 'Classic rose with thorny stem',
    notes: 'Color: red and green',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Tribal Band',
    category: 'tribal',
    placement: 'arm',
    description: 'Traditional tribal armband pattern',
    notes: 'Solid black, 2-3 inches wide',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Quote: Carpe Diem',
    category: 'text',
    placement: 'wrist',
    description: 'Latin phrase in script font',
    notes: 'Elegant cursive',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'Cherry Blossom',
    category: 'nature',
    placement: 'shoulder',
    description: 'Delicate cherry blossom branch',
    notes: 'Pink petals, flowing design',
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
];

export default function App() {
  const [ideas, setIdeas] = useState<TattooIdea[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<TattooIdea[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<TattooIdea | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    category: 'minimalist',
    placement: 'arm',
    description: '',
    notes: '',
  });

  useEffect(() => {
    initializeAds();
    loadIdeas();
  }, []);

  useEffect(() => {
    filterIdeas();
  }, [ideas, selectedCategory, showFavoritesOnly]);

  const loadIdeas = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setIdeas(JSON.parse(saved));
      } else {
        // Load sample ideas on first run
        setIdeas(SAMPLE_IDEAS);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_IDEAS));
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveIdeas = async (data: TattooIdea[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setIdeas(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const filterIdeas = () => {
    let filtered = ideas;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((idea) => idea.category === selectedCategory);
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter((idea) => idea.isFavorite);
    }

    setFilteredIdeas(filtered);
  };

  const addIdea = () => {
    if (!formData.title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your tattoo idea');
      return;
    }

    const newIdea: TattooIdea = {
      id: Date.now().toString(),
      ...formData,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };

    saveIdeas([newIdea, ...ideas]);
    setFormData({
      title: '',
      category: 'minimalist',
      placement: 'arm',
      description: '',
      notes: '',
    });
    setShowAddModal(false);
    Alert.alert('Added!', 'Tattoo idea added successfully');

    const newCount = usageCount + 1;
    setUsageCount(newCount);
    if (newCount % 4 === 0) showInterstitialAd();
  };

  const toggleFavorite = (id: string) => {
    saveIdeas(ideas.map((idea) => (idea.id === id ? { ...idea, isFavorite: !idea.isFavorite } : idea)));
  };

  const deleteIdea = (id: string) => {
    Alert.alert('Delete Idea', 'Are you sure you want to delete this tattoo idea?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          saveIdeas(ideas.filter((idea) => idea.id !== id));
          setShowDetailModal(false);
        },
      },
    ]);
  };

  const updateNotes = (id: string, notes: string) => {
    saveIdeas(ideas.map((idea) => (idea.id === id ? { ...idea, notes } : idea)));
  };

  const openDetail = (idea: TattooIdea) => {
    setSelectedIdea(idea);
    setShowDetailModal(true);
  };

  const getCategoryIcon = (categoryId: string) => {
    return CATEGORIES.find((c) => c.id === categoryId)?.icon || '🎨';
  };

  const getPlacementIcon = (placementId: string) => {
    return BODY_PLACEMENTS.find((p) => p.id === placementId)?.icon || '💪';
  };

  const getPlacementName = (placementId: string) => {
    return BODY_PLACEMENTS.find((p) => p.id === placementId)?.name || placementId;
  };

  const favoriteCount = ideas.filter((i) => i.isFavorite).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tattoo Ideas</Text>
          <Text style={styles.subtitle}>
            {ideas.length} ideas • {favoriteCount} favorites
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerBtn, showFavoritesOnly && styles.headerBtnActive]}
            onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Text style={styles.headerBtnText}>{showFavoritesOnly ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowAddModal(true)}>
            <Text style={styles.headerBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryBtn, selectedCategory === cat.id && styles.categoryBtnActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text
              style={[
                styles.categoryName,
                selectedCategory === cat.id && styles.categoryNameActive,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredIdeas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💡</Text>
            <Text style={styles.emptyText}>
              {showFavoritesOnly ? 'No favorite ideas yet' : 'No tattoo ideas yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {showFavoritesOnly ? 'Mark ideas as favorites' : 'Tap + to add your first idea'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.ideaCard} onPress={() => openDetail(item)}>
            <View style={styles.ideaHeader}>
              <View style={styles.ideaIcons}>
                <Text style={styles.ideaIconText}>{getCategoryIcon(item.category)}</Text>
                <Text style={styles.ideaIconText}>{getPlacementIcon(item.placement)}</Text>
              </View>
              <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                <Text style={styles.favoriteBtn}>{item.isFavorite ? '⭐' : '☆'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.ideaTitle}>{item.title}</Text>
            <Text style={styles.ideaPlacement}>{getPlacementName(item.placement)}</Text>
            {item.description && (
              <Text style={styles.ideaDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            {item.notes && (
              <View style={styles.ideaNotes}>
                <Text style={styles.ideaNotesLabel}>Notes:</Text>
                <Text style={styles.ideaNotesText} numberOfLines={1}>
                  {item.notes}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      <AdBanner />

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Tattoo Idea</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="e.g., Minimalist Mountain"
              />

              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
                {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.optionBtn,
                      formData.category === cat.id && styles.optionBtnActive,
                    ]}
                    onPress={() => setFormData({ ...formData, category: cat.id })}
                  >
                    <Text style={styles.optionIcon}>{cat.icon}</Text>
                    <Text style={styles.optionName}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Body Placement</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
                {BODY_PLACEMENTS.map((place) => (
                  <TouchableOpacity
                    key={place.id}
                    style={[
                      styles.optionBtn,
                      formData.placement === place.id && styles.optionBtnActive,
                    ]}
                    onPress={() => setFormData({ ...formData, placement: place.id })}
                  >
                    <Text style={styles.optionIcon}>{place.icon}</Text>
                    <Text style={styles.optionName}>{place.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Describe your tattoo idea..."
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="Size, colors, artist preferences..."
                multiline
                numberOfLines={2}
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnConfirm]} onPress={addIdea}>
                <Text style={styles.modalBtnText}>Add Idea</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showDetailModal} animationType="slide">
        {selectedIdea && (
          <SafeAreaView style={styles.container}>
            <View style={styles.detailHeader}>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Text style={styles.backBtn}>← Back</Text>
              </TouchableOpacity>
              <View style={styles.detailActions}>
                <TouchableOpacity onPress={() => toggleFavorite(selectedIdea.id)}>
                  <Text style={styles.detailActionBtn}>
                    {selectedIdea.isFavorite ? '⭐' : '☆'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteIdea(selectedIdea.id)}>
                  <Text style={styles.detailActionBtn}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailCard}>
                <View style={styles.detailBadges}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeIcon}>{getCategoryIcon(selectedIdea.category)}</Text>
                    <Text style={styles.badgeText}>
                      {CATEGORIES.find((c) => c.id === selectedIdea.category)?.name}
                    </Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeIcon}>{getPlacementIcon(selectedIdea.placement)}</Text>
                    <Text style={styles.badgeText}>{getPlacementName(selectedIdea.placement)}</Text>
                  </View>
                </View>

                <Text style={styles.detailTitle}>{selectedIdea.title}</Text>

                {selectedIdea.description && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Description</Text>
                    <Text style={styles.detailSectionText}>{selectedIdea.description}</Text>
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={selectedIdea.notes}
                    onChangeText={(text) => {
                      updateNotes(selectedIdea.id, text);
                      setSelectedIdea({ ...selectedIdea, notes: text });
                    }}
                    placeholder="Add notes about size, colors, artist preferences..."
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Info</Text>
                  <Text style={styles.detailInfo}>
                    Created: {new Date(selectedIdea.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.tipsCard}>
                  <Text style={styles.tipsTitle}>💡 Tattoo Tips</Text>
                  <Text style={styles.tipText}>• Research your artist thoroughly</Text>
                  <Text style={styles.tipText}>• Consider placement & size carefully</Text>
                  <Text style={styles.tipText}>• Discuss healing & aftercare</Text>
                  <Text style={styles.tipText}>• Think about long-term aging</Text>
                  <Text style={styles.tipText}>• Get proper consultations first</Text>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
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
  title: { fontSize: 26, fontWeight: 'bold', color: colors.primary },
  subtitle: { fontSize: 12, color: colors.gray.dark, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  headerBtn: {
    backgroundColor: colors.gray.light,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtnActive: { backgroundColor: colors.primary },
  headerBtnText: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  categoryScroll: { maxHeight: 60, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray.light,
  },
  categoryBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  categoryIcon: { fontSize: 18, marginRight: 6 },
  categoryName: { fontSize: 13, fontWeight: '600', color: colors.gray.dark },
  categoryNameActive: { color: colors.primary, fontWeight: 'bold' },
  list: { padding: spacing.lg },
  emptyContainer: { alignItems: 'center', marginTop: spacing.xl * 2 },
  emptyIcon: { fontSize: 60, marginBottom: spacing.md },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  emptySubtext: { fontSize: 14, color: colors.gray.dark },
  ideaCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    elevation: 2,
  },
  ideaHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  ideaIcons: { flexDirection: 'row', gap: spacing.sm },
  ideaIconText: { fontSize: 24 },
  favoriteBtn: { fontSize: 24 },
  ideaTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  ideaPlacement: { fontSize: 13, color: colors.primary, fontWeight: '600', marginBottom: spacing.sm },
  ideaDescription: { fontSize: 14, color: colors.gray.dark, marginBottom: spacing.sm },
  ideaNotes: {
    backgroundColor: colors.gray.light,
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  ideaNotesLabel: { fontSize: 11, fontWeight: 'bold', color: colors.gray.dark, marginBottom: 2 },
  ideaNotesText: { fontSize: 12, color: colors.text },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    maxHeight: '90%',
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  input: { backgroundColor: colors.gray.light, padding: spacing.md, borderRadius: 12, fontSize: 15 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  optionScroll: { marginBottom: spacing.sm },
  optionBtn: {
    backgroundColor: colors.gray.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    marginRight: spacing.sm,
    alignItems: 'center',
    minWidth: 80,
  },
  optionBtnActive: { backgroundColor: colors.primary + '20', borderWidth: 2, borderColor: colors.primary },
  optionIcon: { fontSize: 20, marginBottom: 4 },
  optionName: { fontSize: 11, fontWeight: '600', color: colors.text },
  modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  modalBtn: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: colors.gray.light },
  modalBtnConfirm: { backgroundColor: colors.primary },
  modalBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  modalBtnTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  backBtn: { fontSize: 16, fontWeight: '600', color: colors.primary },
  detailActions: { flexDirection: 'row', gap: spacing.lg },
  detailActionBtn: { fontSize: 24 },
  detailContent: { flex: 1 },
  detailCard: { padding: spacing.lg },
  detailBadges: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  badgeIcon: { fontSize: 16, marginRight: 6 },
  badgeText: { fontSize: 12, fontWeight: '600', color: colors.text },
  detailTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: spacing.lg },
  detailSection: { marginBottom: spacing.lg },
  detailSectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  detailSectionText: { fontSize: 15, color: colors.gray.dark, lineHeight: 22 },
  detailInfo: { fontSize: 13, color: colors.gray.dark },
  tipsCard: {
    backgroundColor: colors.primary + '10',
    padding: spacing.lg,
    borderRadius: 16,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  tipsTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.md },
  tipText: { fontSize: 13, color: colors.text, marginBottom: spacing.sm },
});
