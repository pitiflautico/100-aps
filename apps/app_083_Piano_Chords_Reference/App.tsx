import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, ScrollView, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Piano_Chords_Favorites';

interface PianoChord {
  id: string;
  name: string;
  fullName: string;
  type: ChordType;
  root: string;
  notes: string[];
  inversion: 'Root' | '1st' | '2nd';
  description: string;
}

type ChordType = 'Major' | 'Minor' | 'Diminished' | 'Augmented' | '7th' | 'Major7' | 'Minor7' | 'Diminished7' | 'Suspended';
type KeyNote = 'C' | 'C#' | 'D' | 'Eb' | 'E' | 'F' | 'F#' | 'G' | 'Ab' | 'A' | 'Bb' | 'B';

const KEYS: KeyNote[] = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const CHORD_TYPES: ChordType[] = ['Major', 'Minor', 'Diminished', 'Augmented', '7th', 'Major7', 'Minor7', 'Diminished7', 'Suspended'];

const PIANO_CHORDS: PianoChord[] = [
  { id: '1', name: 'C', fullName: 'C Major', type: 'Major', root: 'C', notes: ['C', 'E', 'G'], inversion: 'Root', description: 'Basic C major triad' },
  { id: '2', name: 'Cm', fullName: 'C Minor', type: 'Minor', root: 'C', notes: ['C', 'Eb', 'G'], inversion: 'Root', description: 'C minor triad' },
  { id: '3', name: 'Cdim', fullName: 'C Diminished', type: 'Diminished', root: 'C', notes: ['C', 'Eb', 'Gb'], inversion: 'Root', description: 'C diminished triad' },
  { id: '4', name: 'Caug', fullName: 'C Augmented', type: 'Augmented', root: 'C', notes: ['C', 'E', 'G#'], inversion: 'Root', description: 'C augmented triad' },
  { id: '5', name: 'C7', fullName: 'C Dominant 7th', type: '7th', root: 'C', notes: ['C', 'E', 'G', 'Bb'], inversion: 'Root', description: 'C dominant seventh' },
  { id: '6', name: 'Cmaj7', fullName: 'C Major 7th', type: 'Major7', root: 'C', notes: ['C', 'E', 'G', 'B'], inversion: 'Root', description: 'C major seventh' },
  { id: '7', name: 'Cm7', fullName: 'C Minor 7th', type: 'Minor7', root: 'C', notes: ['C', 'Eb', 'G', 'Bb'], inversion: 'Root', description: 'C minor seventh' },
  { id: '8', name: 'Cdim7', fullName: 'C Diminished 7th', type: 'Diminished7', root: 'C', notes: ['C', 'Eb', 'Gb', 'A'], inversion: 'Root', description: 'C diminished seventh' },
  { id: '9', name: 'Csus4', fullName: 'C Suspended 4th', type: 'Suspended', root: 'C', notes: ['C', 'F', 'G'], inversion: 'Root', description: 'C suspended 4th' },
  { id: '10', name: 'D', fullName: 'D Major', type: 'Major', root: 'D', notes: ['D', 'F#', 'A'], inversion: 'Root', description: 'D major triad' },
  { id: '11', name: 'Dm', fullName: 'D Minor', type: 'Minor', root: 'D', notes: ['D', 'F', 'A'], inversion: 'Root', description: 'D minor triad' },
  { id: '12', name: 'D7', fullName: 'D Dominant 7th', type: '7th', root: 'D', notes: ['D', 'F#', 'A', 'C'], inversion: 'Root', description: 'D dominant seventh' },
  { id: '13', name: 'Dmaj7', fullName: 'D Major 7th', type: 'Major7', root: 'D', notes: ['D', 'F#', 'A', 'C#'], inversion: 'Root', description: 'D major seventh' },
  { id: '14', name: 'E', fullName: 'E Major', type: 'Major', root: 'E', notes: ['E', 'G#', 'B'], inversion: 'Root', description: 'E major triad' },
  { id: '15', name: 'Em', fullName: 'E Minor', type: 'Minor', root: 'E', notes: ['E', 'G', 'B'], inversion: 'Root', description: 'E minor triad' },
  { id: '16', name: 'E7', fullName: 'E Dominant 7th', type: '7th', root: 'E', notes: ['E', 'G#', 'B', 'D'], inversion: 'Root', description: 'E dominant seventh' },
  { id: '17', name: 'F', fullName: 'F Major', type: 'Major', root: 'F', notes: ['F', 'A', 'C'], inversion: 'Root', description: 'F major triad' },
  { id: '18', name: 'Fm', fullName: 'F Minor', type: 'Minor', root: 'F', notes: ['F', 'Ab', 'C'], inversion: 'Root', description: 'F minor triad' },
  { id: '19', name: 'F7', fullName: 'F Dominant 7th', type: '7th', root: 'F', notes: ['F', 'A', 'C', 'Eb'], inversion: 'Root', description: 'F dominant seventh' },
  { id: '20', name: 'G', fullName: 'G Major', type: 'Major', root: 'G', notes: ['G', 'B', 'D'], inversion: 'Root', description: 'G major triad' },
  { id: '21', name: 'Gm', fullName: 'G Minor', type: 'Minor', root: 'G', notes: ['G', 'Bb', 'D'], inversion: 'Root', description: 'G minor triad' },
  { id: '22', name: 'G7', fullName: 'G Dominant 7th', type: '7th', root: 'G', notes: ['G', 'B', 'D', 'F'], inversion: 'Root', description: 'G dominant seventh' },
  { id: '23', name: 'Gmaj7', fullName: 'G Major 7th', type: 'Major7', root: 'G', notes: ['G', 'B', 'D', 'F#'], inversion: 'Root', description: 'G major seventh' },
  { id: '24', name: 'A', fullName: 'A Major', type: 'Major', root: 'A', notes: ['A', 'C#', 'E'], inversion: 'Root', description: 'A major triad' },
  { id: '25', name: 'Am', fullName: 'A Minor', type: 'Minor', root: 'A', notes: ['A', 'C', 'E'], inversion: 'Root', description: 'A minor triad' },
  { id: '26', name: 'A7', fullName: 'A Dominant 7th', type: '7th', root: 'A', notes: ['A', 'C#', 'E', 'G'], inversion: 'Root', description: 'A dominant seventh' },
  { id: '27', name: 'Amaj7', fullName: 'A Major 7th', type: 'Major7', root: 'A', notes: ['A', 'C#', 'E', 'G#'], inversion: 'Root', description: 'A major seventh' },
  { id: '28', name: 'Am7', fullName: 'A Minor 7th', type: 'Minor7', root: 'A', notes: ['A', 'C', 'E', 'G'], inversion: 'Root', description: 'A minor seventh' },
  { id: '29', name: 'B', fullName: 'B Major', type: 'Major', root: 'B', notes: ['B', 'D#', 'F#'], inversion: 'Root', description: 'B major triad' },
  { id: '30', name: 'Bm', fullName: 'B Minor', type: 'Minor', root: 'B', notes: ['B', 'D', 'F#'], inversion: 'Root', description: 'B minor triad' },
  { id: '31', name: 'B7', fullName: 'B Dominant 7th', type: '7th', root: 'B', notes: ['B', 'D#', 'F#', 'A'], inversion: 'Root', description: 'B dominant seventh' },
  { id: '32', name: 'Bb', fullName: 'Bb Major', type: 'Major', root: 'Bb', notes: ['Bb', 'D', 'F'], inversion: 'Root', description: 'Bb major triad' },
  { id: '33', name: 'Bbm', fullName: 'Bb Minor', type: 'Minor', root: 'Bb', notes: ['Bb', 'Db', 'F'], inversion: 'Root', description: 'Bb minor triad' },
  { id: '34', name: 'Bb7', fullName: 'Bb Dominant 7th', type: '7th', root: 'Bb', notes: ['Bb', 'D', 'F', 'Ab'], inversion: 'Root', description: 'Bb dominant seventh' },
  { id: '35', name: 'Eb', fullName: 'Eb Major', type: 'Major', root: 'Eb', notes: ['Eb', 'G', 'Bb'], inversion: 'Root', description: 'Eb major triad' },
  { id: '36', name: 'Ebm', fullName: 'Eb Minor', type: 'Minor', root: 'Eb', notes: ['Eb', 'Gb', 'Bb'], inversion: 'Root', description: 'Eb minor triad' },
];

const COMMON_PROGRESSIONS = [
  { id: '1', name: 'I-IV-V (C Major)', chords: ['C', 'F', 'G'], description: 'Classic major progression' },
  { id: '2', name: 'ii-V-I (Jazz)', chords: ['Dm7', 'G7', 'Cmaj7'], description: 'Common jazz turnaround' },
  { id: '3', name: 'I-vi-IV-V', chords: ['C', 'Am', 'F', 'G'], description: '50s progression' },
  { id: '4', name: 'I-V-vi-IV', chords: ['C', 'G', 'Am', 'F'], description: 'Modern pop progression' },
  { id: '5', name: 'Blues (I-IV-V)', chords: ['C7', 'F7', 'G7'], description: '12-bar blues in C' },
  { id: '6', name: 'Circle of 5ths', chords: ['C', 'F', 'Bb', 'Eb'], description: 'Descending fifths' },
];

export default function App() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<KeyNote>('C');
  const [selectedType, setSelectedType] = useState<ChordType>('Major');
  const [selectedChord, setSelectedChord] = useState<PianoChord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'chords' | 'progressions'>('chords');
  const [adCount, setAdCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setFavorites(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveFavorites = async (favs: string[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
      setFavorites(favs);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const toggleFavorite = (chordId: string) => {
    const newFavorites = favorites.includes(chordId) ? favorites.filter((id) => id !== chordId) : [...favorites, chordId];
    saveFavorites(newFavorites);
  };

  const openChordDetail = (chord: PianoChord) => {
    setSelectedChord(chord);
    setShowModal(true);
    const newCount = adCount + 1;
    setAdCount(newCount);
    if (newCount % 6 === 0) showInterstitialAd();
  };

  const renderPianoKeyboard = (chord: PianoChord, compact: boolean = false) => {
    const keyWidth = compact ? 20 : 40;
    const whiteKeyHeight = compact ? 60 : 120;
    const blackKeyHeight = compact ? 40 : 80;
    const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const blackKeys = ['C#', 'Eb', 'F#', 'Ab', 'Bb'];

    return (
      <View style={[styles.keyboard, compact && styles.keyboardCompact]}>
        <View style={styles.whiteKeys}>
          {whiteKeys.map((note, index) => {
            const isActive = chord.notes.includes(note);
            return (
              <View key={note} style={[styles.whiteKey, { width: keyWidth, height: whiteKeyHeight }, isActive && styles.activeWhiteKey]}>
                {!compact && <Text style={[styles.keyLabel, isActive && styles.activeKeyLabel]}>{note}</Text>}
              </View>
            );
          })}
        </View>
        <View style={styles.blackKeys}>
          {blackKeys.map((note, index) => {
            const isActive = chord.notes.includes(note);
            const positions = [keyWidth * 0.7, keyWidth * 1.7, keyWidth * 3.7, keyWidth * 4.7, keyWidth * 5.7];
            return (
              <View key={note} style={[styles.blackKey, { width: keyWidth * 0.6, height: blackKeyHeight, left: positions[index] }, isActive && styles.activeBlackKey]}>
                {!compact && <Text style={[styles.blackKeyLabel, isActive && styles.activeBlackKeyLabel]}>{note}</Text>}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const filteredChords = PIANO_CHORDS.filter((chord) => chord.root === selectedKey && chord.type === selectedType);
  const favoriteChords = PIANO_CHORDS.filter((chord) => favorites.includes(chord.id));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Piano Chords</Text>
        <Text style={styles.subtitle}>{PIANO_CHORDS.length} chords</Text>
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'chords' && styles.tabActive]} onPress={() => setActiveTab('chords')}>
          <Text style={[styles.tabText, activeTab === 'chords' && styles.tabTextActive]}>Chords</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'progressions' && styles.tabActive]} onPress={() => setActiveTab('progressions')}>
          <Text style={[styles.tabText, activeTab === 'progressions' && styles.tabTextActive]}>Progressions</Text>
        </TouchableOpacity>
      </View>
      {activeTab === 'chords' && (
        <View style={styles.contentContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <View style={styles.filters}>
              <Text style={styles.filterLabel}>Key:</Text>
              {KEYS.map((key) => (
                <TouchableOpacity key={key} style={[styles.filterChip, selectedKey === key && styles.filterChipActive]} onPress={() => setSelectedKey(key)}>
                  <Text style={[styles.filterChipText, selectedKey === key && styles.filterChipTextActive]}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <View style={styles.filters}>
              <Text style={styles.filterLabel}>Type:</Text>
              {CHORD_TYPES.map((type) => (
                <TouchableOpacity key={type} style={[styles.filterChip, selectedType === type && styles.filterChipActive]} onPress={() => setSelectedType(type)}>
                  <Text style={[styles.filterChipText, selectedType === type && styles.filterChipTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          {favoriteChords.length > 0 && (
            <View style={styles.favoritesSection}>
              <Text style={styles.sectionTitle}>Favorites</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {favoriteChords.map((chord) => (
                  <TouchableOpacity key={chord.id} style={styles.favoriteCard} onPress={() => openChordDetail(chord)}>
                    <Text style={styles.favoriteChordName}>{chord.name}</Text>
                    {renderPianoKeyboard(chord, true)}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          <FlatList
            data={filteredChords}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chordList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.chordCard} onPress={() => openChordDetail(item)}>
                <View style={styles.chordCardHeader}>
                  <View>
                    <Text style={styles.chordName}>{item.name}</Text>
                    <Text style={styles.chordFullName}>{item.fullName}</Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleFavorite(item.id)}><Text style={styles.favoriteStar}>{favorites.includes(item.id) ? '★' : '☆'}</Text></TouchableOpacity>
                </View>
                <Text style={styles.notesText}>Notes: {item.notes.join(' - ')}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No chords found for this combination</Text>}
          />
        </View>
      )}
      {activeTab === 'progressions' && (
        <ScrollView style={styles.contentContainer} contentContainerStyle={styles.progressionsList}>
          <Text style={styles.sectionTitle}>Common Progressions</Text>
          {COMMON_PROGRESSIONS.map((progression) => (
            <View key={progression.id} style={styles.progressionCard}>
              <Text style={styles.progressionName}>{progression.name}</Text>
              <Text style={styles.progressionDescription}>{progression.description}</Text>
              <View style={styles.progressionChords}>
                {progression.chords.map((chordName, index) => (
                  <View key={index} style={styles.progressionChordBadge}><Text style={styles.progressionChordText}>{chordName}</Text></View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
      <AdBanner />
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedChord && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalChordName}>{selectedChord.name}</Text>
                    <Text style={styles.modalChordFullName}>{selectedChord.fullName}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowModal(false)}><Text style={styles.closeButton}>✕</Text></TouchableOpacity>
                </View>
                <View style={styles.modalKeyboardContainer}>{renderPianoKeyboard(selectedChord, false)}</View>
                <View style={styles.notesInfo}>
                  <Text style={styles.notesTitle}>Notes:</Text>
                  <Text style={styles.notesDetail}>{selectedChord.notes.join(' - ')}</Text>
                </View>
                <Text style={styles.chordDescription}>{selectedChord.description}</Text>
                <TouchableOpacity style={styles.favoriteButtonLarge} onPress={() => toggleFavorite(selectedChord.id)}>
                  <Text style={styles.favoriteButtonText}>{favorites.includes(selectedChord.id) ? '★ Remove from Favorites' : '☆ Add to Favorites'}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  subtitle: { fontSize: 14, color: colors.gray.dark, marginTop: 4 },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 16, color: colors.gray.dark },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  contentContainer: { flex: 1 },
  filterScroll: { maxHeight: 50, marginBottom: spacing.sm },
  filters: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, gap: spacing.sm },
  filterLabel: { fontSize: 14, fontWeight: '600', color: colors.gray.dark, marginRight: spacing.sm },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.white, borderRadius: 20, borderWidth: 1, borderColor: colors.gray.light },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: 12, color: colors.gray.dark },
  filterChipTextActive: { color: colors.white, fontWeight: '600' },
  favoritesSection: { marginBottom: spacing.md, paddingLeft: spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.md },
  favoriteCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.md, marginRight: spacing.sm, alignItems: 'center', minWidth: 120 },
  favoriteChordName: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.sm },
  chordList: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  chordCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.md },
  chordCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  chordName: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  chordFullName: { fontSize: 14, color: colors.gray.dark },
  favoriteStar: { fontSize: 24, color: colors.status.warning },
  notesText: { fontSize: 14, color: colors.text, marginTop: spacing.sm },
  emptyText: { textAlign: 'center', marginTop: spacing.xl, color: colors.gray.medium, fontSize: 16 },
  keyboard: { width: 280, height: 120, position: 'relative', marginVertical: spacing.lg, alignSelf: 'center' },
  keyboardCompact: { width: 140, height: 60, marginVertical: spacing.sm },
  whiteKeys: { flexDirection: 'row', position: 'absolute', bottom: 0 },
  whiteKey: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray.dark, borderRadius: 4, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 8 },
  activeWhiteKey: { backgroundColor: colors.accent },
  keyLabel: { fontSize: 12, color: colors.text },
  activeKeyLabel: { color: colors.white, fontWeight: 'bold' },
  blackKeys: { position: 'absolute', top: 0, flexDirection: 'row' },
  blackKey: { backgroundColor: colors.text, borderRadius: 4, position: 'absolute', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 4 },
  activeBlackKey: { backgroundColor: colors.primary },
  blackKeyLabel: { fontSize: 10, color: colors.white },
  activeBlackKeyLabel: { fontWeight: 'bold' },
  progressionsList: { padding: spacing.lg, paddingBottom: 100 },
  progressionCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.md },
  progressionName: { fontSize: 18, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.sm },
  progressionDescription: { fontSize: 14, color: colors.gray.dark, marginBottom: spacing.md },
  progressionChords: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  progressionChordBadge: { backgroundColor: colors.accent, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8 },
  progressionChordText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  modalChordName: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  modalChordFullName: { fontSize: 16, color: colors.gray.dark },
  closeButton: { fontSize: 28, color: colors.gray.dark },
  modalKeyboardContainer: { alignItems: 'center', marginBottom: spacing.lg },
  notesInfo: { backgroundColor: colors.gray.light, borderRadius: 12, padding: spacing.md, marginBottom: spacing.lg },
  notesTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  notesDetail: { fontSize: 16, color: colors.primary },
  chordDescription: { fontSize: 14, color: colors.gray.dark, marginBottom: spacing.lg, fontStyle: 'italic' },
  favoriteButtonLarge: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  favoriteButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
