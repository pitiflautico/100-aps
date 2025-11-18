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

const STORAGE_KEY = '@Offline_Notes_App_data';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [count, setCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setNotes(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (data: Note[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
      // Update existing note
      const updated = notes.map((n) =>
        n.id === editingNote.id
          ? { ...n, title: title.trim(), content: content.trim(), updatedAt: now }
          : n
      );
      saveData(updated);
    } else {
      // Create new note
      const newNote: Note = {
        id: Date.now().toString(),
        title: title.trim(),
        content: content.trim(),
        createdAt: now,
        updatedAt: now,
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
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => saveData(notes.filter((n) => n.id !== id)),
      },
    ]);
  };

  const getFilteredNotes = () => {
    if (!searchQuery.trim()) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query)
    );
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredNotes = getFilteredNotes();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>My Notes</Text>
        <Text style={styles.count}>{notes.length} notes</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search notes..."
          placeholderTextColor={colors.gray.medium}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notes List */}
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : 'Tap + to create your first note'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.noteCard}
            onPress={() => openEditModal(item)}
            onLongPress={() => deleteNote(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.noteHeader}>
              <Text style={styles.noteTitle} numberOfLines={1}>
                {item.title || 'Untitled'}
              </Text>
              <Text style={styles.noteTime}>{formatTimestamp(item.updatedAt)}</Text>
            </View>
            <Text style={styles.noteContent} numberOfLines={3}>
              {item.content}
            </Text>
            <View style={styles.noteFooter}>
              <Text style={styles.noteDate}>
                Created: {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              {item.createdAt !== item.updatedAt && (
                <Text style={styles.noteEdited}>✏️ Edited</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* FAB */}
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
            <Text style={styles.modalTitle}>{editingNote ? 'Edit Note' : 'New Note'}</Text>
            <TouchableOpacity onPress={saveNote} disabled={!title.trim() && !content.trim()}>
              <Text style={[styles.modalSave, (!title.trim() && !content.trim()) && styles.modalSaveDisabled]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor={colors.gray.medium}
              autoFocus={!editingNote}
            />
            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              placeholder="Start typing your note..."
              placeholderTextColor={colors.gray.medium}
              multiline
              textAlignVertical="top"
            />
            {editingNote && (
              <View style={styles.timestamps}>
                <Text style={styles.timestampText}>
                  Created: {formatTimestamp(editingNote.createdAt)}
                </Text>
                <Text style={styles.timestampText}>
                  Updated: {formatTimestamp(editingNote.updatedAt)}
                </Text>
              </View>
            )}
          </ScrollView>
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
    padding: spacing.lg,
    alignItems: 'center',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  count: { fontSize: 16, color: colors.gray.dark, fontWeight: '600' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray.light,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
  },
  searchIcon: { fontSize: 18, marginRight: spacing.sm },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  clearIcon: { fontSize: 20, color: colors.gray.dark, padding: spacing.sm },
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
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginRight: spacing.md,
  },
  noteTime: { fontSize: 12, color: colors.gray.dark },
  noteContent: {
    fontSize: 14,
    color: colors.gray.dark,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray.light,
  },
  noteDate: { fontSize: 11, color: colors.gray.medium },
  noteEdited: { fontSize: 11, color: colors.status.info },
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
  contentInput: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    minHeight: 300,
  },
  timestamps: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.gray.light,
    borderRadius: 8,
  },
  timestampText: {
    fontSize: 12,
    color: colors.gray.dark,
    marginBottom: spacing.xs,
  },
});
