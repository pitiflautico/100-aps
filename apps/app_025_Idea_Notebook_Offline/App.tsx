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
  Share,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Idea_Notebook_Offline_data';

type Category = 'Business' | 'Creative' | 'Tech' | 'Random';

interface Idea {
  id: string;
  title: string;
  content: string;
  category: Category;
  tags: string[];
  favorite: boolean;
  createdAt: string;
}

const CATEGORY_COLORS = {
  Business: '#8B5CF6',
  Creative: '#EC4899',
  Tech: '#3B82F6',
  Random: '#10B981',
};

const CATEGORY_ICONS = {
  Business: '💼',
  Creative: '🎨',
  Tech: '💻',
  Random: '🎲',
};

export default function App() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<Idea[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Category>('Random');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  useEffect(() => {
    filterIdeas();
  }, [ideas, searchQuery, filterCategory, showFavoritesOnly]);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setIdeas(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (data: Idea[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setIdeas(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const filterIdeas = () => {
    let filtered = [...ideas];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (idea) =>
          idea.title.toLowerCase().includes(query) ||
          idea.content.toLowerCase().includes(query) ||
          idea.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (filterCategory !== 'All') {
      filtered = filtered.filter((idea) => idea.category === filterCategory);
    }

    // Filter by favorites
    if (showFavoritesOnly) {
      filtered = filtered.filter((idea) => idea.favorite);
    }

    setFilteredIdeas(filtered);
  };

  const addIdea = () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in title and content');
      return;
    }

    const newIdea: Idea = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      category,
      tags: tags.filter((t) => t.trim()),
      favorite: false,
      createdAt: new Date().toISOString(),
    };

    saveData([newIdea, ...ideas]);
    resetForm();
    setShowAddModal(false);
    showInterstitialAd();
  };

  const toggleFavorite = (id: string) => {
    const updated = ideas.map((idea) =>
      idea.id === id ? { ...idea, favorite: !idea.favorite } : idea
    );
    saveData(updated);
    if (selectedIdea?.id === id) {
      setSelectedIdea(updated.find((i) => i.id === id) || null);
    }
  };

  const deleteIdea = (id: string) => {
    Alert.alert('Delete Idea', 'Are you sure you want to delete this idea?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          saveData(ideas.filter((i) => i.id !== id));
          if (selectedIdea?.id === id) setShowDetailModal(false);
        },
      },
    ]);
  };

  const exportIdea = async (idea: Idea) => {
    const text = `${idea.title}\n\nCategory: ${idea.category}\nTags: ${idea.tags.join(', ')}\n\n${idea.content}\n\nCreated: ${new Date(idea.createdAt).toLocaleDateString()}`;
    try {
      await Share.share({ message: text });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const exportAllIdeas = async () => {
    if (ideas.length === 0) {
      Alert.alert('No Ideas', 'You have no ideas to export');
      return;
    }

    const text = ideas
      .map(
        (idea) =>
          `${idea.title}\nCategory: ${idea.category}\nTags: ${idea.tags.join(', ')}\n${idea.content}\n`
      )
      .join('\n---\n\n');

    try {
      await Share.share({ message: `My Ideas\n\n${text}` });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('Random');
    setTags([]);
    setTagInput('');
  };

  const renderIdea = ({ item }: { item: Idea }) => {
    const color = CATEGORY_COLORS[item.category];
    const icon = CATEGORY_ICONS[item.category];

    return (
      <TouchableOpacity
        style={[styles.ideaCard, { borderLeftColor: color }]}
        onPress={() => {
          setSelectedIdea(item);
          setShowDetailModal(true);
        }}
      >
        <View style={styles.ideaHeader}>
          <View style={styles.ideaTitleRow}>
            <Text style={styles.categoryIcon}>{icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.ideaTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.ideaCategory}>{item.category}</Text>
            </View>
            <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
              <Text style={styles.favoriteIcon}>{item.favorite ? '⭐' : '☆'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.ideaContent} numberOfLines={2}>
          {item.content}
        </Text>

        {item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, idx) => (
              <View key={idx} style={styles.tagBadge}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
            )}
          </View>
        )}

        <Text style={styles.ideaDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Idea Notebook</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={exportAllIdeas}>
            <Text style={styles.exportBtn}>📤</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}>
            <Text style={styles.favoriteFilterBtn}>
              {showFavoritesOnly ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search ideas, tags..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilter}
        contentContainerStyle={styles.categoryFilterContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryFilterBtn,
            filterCategory === 'All' && styles.categoryFilterBtnActive,
          ]}
          onPress={() => setFilterCategory('All')}
        >
          <Text
            style={[
              styles.categoryFilterText,
              filterCategory === 'All' && styles.categoryFilterTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {(Object.keys(CATEGORY_ICONS) as Category[]).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryFilterBtn,
              filterCategory === cat && styles.categoryFilterBtnActive,
              filterCategory === cat && { backgroundColor: CATEGORY_COLORS[cat] },
            ]}
            onPress={() => setFilterCategory(cat)}
          >
            <Text style={styles.categoryFilterIcon}>{CATEGORY_ICONS[cat]}</Text>
            <Text
              style={[
                styles.categoryFilterText,
                filterCategory === cat && styles.categoryFilterTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Ideas List */}
      <FlatList
        data={filteredIdeas}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💡</Text>
            <Text style={styles.emptyText}>
              {searchQuery || filterCategory !== 'All' || showFavoritesOnly
                ? 'No ideas found'
                : 'No ideas yet. Start creating!'}
            </Text>
          </View>
        }
        renderItem={renderIdea}
      />

      {/* Add Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AdBanner />

      {/* Add Idea Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>New Idea</Text>

              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter idea title"
                autoFocus
              />

              <Text style={styles.label}>Content</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={content}
                onChangeText={setContent}
                placeholder="Describe your idea..."
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryRow}>
                {(Object.keys(CATEGORY_ICONS) as Category[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryBtn,
                      category === cat && {
                        backgroundColor: CATEGORY_COLORS[cat],
                        borderColor: CATEGORY_COLORS[cat],
                      },
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={styles.categoryBtnIcon}>{CATEGORY_ICONS[cat]}</Text>
                    <Text
                      style={[
                        styles.categoryBtnText,
                        category === cat && styles.categoryBtnTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Tags</Text>
              <View style={styles.tagInputRow}>
                <TextInput
                  style={[styles.input, styles.tagInput]}
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder="Add tag"
                  onSubmitEditing={addTag}
                />
                <TouchableOpacity style={styles.addTagBtn} onPress={addTag}>
                  <Text style={styles.addTagBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              {tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {tags.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={styles.tagBadgeEditable}
                      onPress={() => removeTag(tag)}
                    >
                      <Text style={styles.tagText}>#{tag}</Text>
                      <Text style={styles.removeTagText}> ×</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnCancel]}
                  onPress={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.btnTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnAdd]} onPress={addIdea}>
                  <Text style={styles.btnText}>Save Idea</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Idea Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedIdea && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailHeader}>
                  <Text style={styles.modalTitle}>{selectedIdea.title}</Text>
                  <TouchableOpacity onPress={() => toggleFavorite(selectedIdea.id)}>
                    <Text style={styles.favoriteLargeIcon}>
                      {selectedIdea.favorite ? '⭐' : '☆'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: CATEGORY_COLORS[selectedIdea.category] },
                  ]}
                >
                  <Text style={styles.categoryBadgeText}>
                    {CATEGORY_ICONS[selectedIdea.category]} {selectedIdea.category}
                  </Text>
                </View>

                <Text style={styles.detailContent}>{selectedIdea.content}</Text>

                {selectedIdea.tags.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Tags</Text>
                    <View style={styles.tagsContainer}>
                      {selectedIdea.tags.map((tag, idx) => (
                        <View key={idx} style={styles.tagBadge}>
                          <Text style={styles.tagText}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                <Text style={styles.createdDate}>
                  Created: {new Date(selectedIdea.createdAt).toLocaleString()}
                </Text>

                <View style={styles.buttons}>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnExport]}
                    onPress={() => exportIdea(selectedIdea)}
                  >
                    <Text style={styles.btnText}>📤 Export</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnDelete]}
                    onPress={() => deleteIdea(selectedIdea.id)}
                  >
                    <Text style={styles.btnText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.btn, styles.btnClose]}
                  onPress={() => setShowDetailModal(false)}
                >
                  <Text style={styles.btnTextCancel}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
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
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  headerActions: { flexDirection: 'row', gap: spacing.md },
  exportBtn: { fontSize: 24 },
  favoriteFilterBtn: { fontSize: 24 },
  searchSection: { padding: spacing.lg, paddingBottom: spacing.sm },
  searchInput: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.gray.light,
  },
  categoryFilter: { maxHeight: 50 },
  categoryFilterContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  categoryFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: spacing.xs,
  },
  categoryFilterBtnActive: { backgroundColor: colors.primary },
  categoryFilterIcon: { fontSize: 16 },
  categoryFilterText: { fontSize: 14, fontWeight: '600', color: colors.text },
  categoryFilterTextActive: { color: colors.white },
  list: { padding: spacing.lg, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: spacing.xl * 2 },
  emptyIcon: { fontSize: 64, marginBottom: spacing.lg },
  emptyText: { fontSize: 16, color: colors.gray.dark, textAlign: 'center' },
  ideaCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    elevation: 2,
    borderLeftWidth: 4,
  },
  ideaHeader: { marginBottom: spacing.sm },
  ideaTitleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  categoryIcon: { fontSize: 24, marginRight: spacing.sm },
  ideaTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, flex: 1 },
  ideaCategory: { fontSize: 12, color: colors.gray.dark, marginTop: spacing.xs },
  favoriteIcon: { fontSize: 24, marginLeft: spacing.sm },
  ideaContent: { fontSize: 14, color: colors.gray.dark, marginBottom: spacing.md },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  tagBadge: {
    backgroundColor: colors.gray.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagBadgeEditable: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: { fontSize: 12, fontWeight: '600', color: colors.white },
  removeTagText: { fontSize: 16, color: colors.white, marginLeft: 4 },
  moreTagsText: { fontSize: 12, color: colors.gray.dark, alignSelf: 'center' },
  ideaDate: { fontSize: 12, color: colors.gray.medium, textAlign: 'right' },
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
  },
  fabText: { color: colors.white, fontSize: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    maxHeight: '90%',
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  categoryBtn: {
    width: '48%',
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryBtnIcon: { fontSize: 28, marginBottom: spacing.xs },
  categoryBtnText: { fontSize: 13, fontWeight: '600', color: colors.text },
  categoryBtnTextActive: { color: colors.white },
  tagInputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  tagInput: { flex: 1, marginBottom: 0 },
  addTagBtn: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagBtnText: { color: colors.white, fontSize: 24, fontWeight: 'bold' },
  buttons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  btn: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  btnCancel: { backgroundColor: colors.gray.light },
  btnAdd: { backgroundColor: colors.primary },
  btnExport: { backgroundColor: '#10B981' },
  btnDelete: { backgroundColor: colors.status.error },
  btnClose: { backgroundColor: colors.gray.light, marginTop: spacing.md },
  btnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  btnTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  favoriteLargeIcon: { fontSize: 32 },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginBottom: spacing.lg,
  },
  categoryBadgeText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  detailContent: { fontSize: 16, color: colors.text, lineHeight: 24, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: spacing.md, color: colors.text },
  createdDate: {
    fontSize: 13,
    color: colors.gray.dark,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
});
