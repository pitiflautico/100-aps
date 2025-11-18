import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Guitar_Chords_Favorites';

interface ChordDiagram {
  id: string;
  name: string;
  fullName: string;
  type: ChordType;
  category: ChordCategory;
  fingers: (number | 'x' | 0)[];
  frets: number[];
  description: string;
}

type ChordType = 'Major' | 'Minor' | '7th' | 'Major7' | 'Minor7' | 'Suspended' | 'Diminished' | 'Augmented' | 'Add9' | 'Power';
type ChordCategory = 'Open' | 'Barre' | 'Power';

const CHORD_TYPES: ChordType[] = ['Major', 'Minor', '7th', 'Major7', 'Minor7', 'Suspended', 'Diminished', 'Augmented', 'Add9', 'Power'];

const CHORD_LIBRARY: ChordDiagram[] = [
  { id: '1', name: 'C', fullName: 'C Major', type: 'Major', category: 'Open', fingers: ['x', 3, 2, 0, 1, 0], frets: [0, 3, 2, 0, 1, 0], description: 'Basic C major open chord' },
  { id: '2', name: 'D', fullName: 'D Major', type: 'Major', category: 'Open', fingers: ['x', 'x', 0, 1, 3, 2], frets: [0, 0, 0, 2, 3, 2], description: 'Basic D major open chord' },
  { id: '3', name: 'E', fullName: 'E Major', type: 'Major', category: 'Open', fingers: [0, 2, 2, 1, 0, 0], frets: [0, 2, 2, 1, 0, 0], description: 'Basic E major open chord' },
  { id: '4', name: 'G', fullName: 'G Major', type: 'Major', category: 'Open', fingers: [3, 2, 0, 0, 0, 3], frets: [3, 2, 0, 0, 0, 3], description: 'Basic G major open chord' },
  { id: '5', name: 'A', fullName: 'A Major', type: 'Major', category: 'Open', fingers: ['x', 0, 2, 2, 2, 0], frets: [0, 0, 2, 2, 2, 0], description: 'Basic A major open chord' },
  { id: '6', name: 'Am', fullName: 'A Minor', type: 'Minor', category: 'Open', fingers: ['x', 0, 2, 2, 1, 0], frets: [0, 0, 2, 2, 1, 0], description: 'Basic A minor open chord' },
  { id: '7', name: 'Em', fullName: 'E Minor', type: 'Minor', category: 'Open', fingers: [0, 2, 2, 0, 0, 0], frets: [0, 2, 2, 0, 0, 0], description: 'Basic E minor open chord' },
  { id: '8', name: 'Dm', fullName: 'D Minor', type: 'Minor', category: 'Open', fingers: ['x', 'x', 0, 2, 3, 1], frets: [0, 0, 0, 2, 3, 1], description: 'Basic D minor open chord' },
  { id: '9', name: 'C7', fullName: 'C Dominant 7th', type: '7th', category: 'Open', fingers: ['x', 3, 2, 3, 1, 0], frets: [0, 3, 2, 3, 1, 0], description: 'C dominant 7th' },
  { id: '10', name: 'D7', fullName: 'D Dominant 7th', type: '7th', category: 'Open', fingers: ['x', 'x', 0, 2, 1, 2], frets: [0, 0, 0, 2, 1, 2], description: 'D dominant 7th' },
  { id: '11', name: 'E7', fullName: 'E Dominant 7th', type: '7th', category: 'Open', fingers: [0, 2, 0, 1, 0, 0], frets: [0, 2, 0, 1, 0, 0], description: 'E dominant 7th' },
  { id: '12', name: 'G7', fullName: 'G Dominant 7th', type: '7th', category: 'Open', fingers: [3, 2, 0, 0, 0, 1], frets: [3, 2, 0, 0, 0, 1], description: 'G dominant 7th' },
  { id: '13', name: 'A7', fullName: 'A Dominant 7th', type: '7th', category: 'Open', fingers: ['x', 0, 2, 0, 2, 0], frets: [0, 0, 2, 0, 2, 0], description: 'A dominant 7th' },
  { id: '14', name: 'Cmaj7', fullName: 'C Major 7th', type: 'Major7', category: 'Open', fingers: ['x', 3, 2, 0, 0, 0], frets: [0, 3, 2, 0, 0, 0], description: 'C major 7th' },
  { id: '15', name: 'Dmaj7', fullName: 'D Major 7th', type: 'Major7', category: 'Open', fingers: ['x', 'x', 0, 2, 2, 2], frets: [0, 0, 0, 2, 2, 2], description: 'D major 7th' },
  { id: '16', name: 'Emaj7', fullName: 'E Major 7th', type: 'Major7', category: 'Open', fingers: [0, 2, 1, 1, 0, 0], frets: [0, 2, 1, 1, 0, 0], description: 'E major 7th' },
  { id: '17', name: 'Gmaj7', fullName: 'G Major 7th', type: 'Major7', category: 'Open', fingers: [3, 2, 0, 0, 0, 2], frets: [3, 2, 0, 0, 0, 2], description: 'G major 7th' },
  { id: '18', name: 'Amaj7', fullName: 'A Major 7th', type: 'Major7', category: 'Open', fingers: ['x', 0, 2, 1, 2, 0], frets: [0, 0, 2, 1, 2, 0], description: 'A major 7th' },
  { id: '19', name: 'Am7', fullName: 'A Minor 7th', type: 'Minor7', category: 'Open', fingers: ['x', 0, 2, 0, 1, 0], frets: [0, 0, 2, 0, 1, 0], description: 'A minor 7th' },
  { id: '20', name: 'Em7', fullName: 'E Minor 7th', type: 'Minor7', category: 'Open', fingers: [0, 2, 0, 0, 0, 0], frets: [0, 2, 0, 0, 0, 0], description: 'E minor 7th' },
  { id: '21', name: 'Dm7', fullName: 'D Minor 7th', type: 'Minor7', category: 'Open', fingers: ['x', 'x', 0, 2, 1, 1], frets: [0, 0, 0, 2, 1, 1], description: 'D minor 7th' },
  { id: '22', name: 'Csus2', fullName: 'C Suspended 2nd', type: 'Suspended', category: 'Open', fingers: ['x', 3, 0, 0, 1, 0], frets: [0, 3, 0, 0, 1, 0], description: 'C suspended 2nd' },
  { id: '23', name: 'Csus4', fullName: 'C Suspended 4th', type: 'Suspended', category: 'Open', fingers: ['x', 3, 3, 0, 1, 1], frets: [0, 3, 3, 0, 1, 1], description: 'C suspended 4th' },
  { id: '24', name: 'Dsus2', fullName: 'D Suspended 2nd', type: 'Suspended', category: 'Open', fingers: ['x', 'x', 0, 2, 3, 0], frets: [0, 0, 0, 2, 3, 0], description: 'D suspended 2nd' },
  { id: '25', name: 'Dsus4', fullName: 'D Suspended 4th', type: 'Suspended', category: 'Open', fingers: ['x', 'x', 0, 2, 3, 3], frets: [0, 0, 0, 2, 3, 3], description: 'D suspended 4th' },
  { id: '26', name: 'F', fullName: 'F Major', type: 'Major', category: 'Barre', fingers: [1, 3, 3, 2, 1, 1], frets: [1, 3, 3, 2, 1, 1], description: 'F major barre chord (E shape)' },
  { id: '27', name: 'Fm', fullName: 'F Minor', type: 'Minor', category: 'Barre', fingers: [1, 3, 3, 1, 1, 1], frets: [1, 3, 3, 1, 1, 1], description: 'F minor barre chord' },
  { id: '28', name: 'Bb', fullName: 'B-flat Major', type: 'Major', category: 'Barre', fingers: ['x', 1, 3, 3, 3, 1], frets: [0, 1, 3, 3, 3, 1], description: 'Bb major barre chord (A shape)' },
  { id: '29', name: 'E5', fullName: 'E Power Chord', type: 'Power', category: 'Power', fingers: [0, 2, 2, 'x', 'x', 'x'], frets: [0, 2, 2, 0, 0, 0], description: 'E power chord' },
  { id: '30', name: 'A5', fullName: 'A Power Chord', type: 'Power', category: 'Power', fingers: ['x', 0, 2, 2, 'x', 'x'], frets: [0, 0, 2, 2, 0, 0], description: 'A power chord' },
  { id: '31', name: 'D5', fullName: 'D Power Chord', type: 'Power', category: 'Power', fingers: ['x', 'x', 0, 2, 3, 'x'], frets: [0, 0, 0, 2, 3, 0], description: 'D power chord' },
  { id: '32', name: 'G5', fullName: 'G Power Chord', type: 'Power', category: 'Power', fingers: [3, 5, 5, 'x', 'x', 'x'], frets: [3, 5, 5, 0, 0, 0], description: 'G power chord' },
  { id: '33', name: 'Cdim', fullName: 'C Diminished', type: 'Diminished', category: 'Open', fingers: ['x', 3, 1, 2, 1, 'x'], frets: [0, 3, 1, 2, 1, 0], description: 'C diminished' },
  { id: '34', name: 'Caug', fullName: 'C Augmented', type: 'Augmented', category: 'Open', fingers: ['x', 3, 2, 1, 1, 0], frets: [0, 3, 2, 1, 1, 0], description: 'C augmented' },
  { id: '35', name: 'Cadd9', fullName: 'C Add 9', type: 'Add9', category: 'Open', fingers: ['x', 3, 2, 0, 3, 0], frets: [0, 3, 2, 0, 3, 0], description: 'C add 9' },
  { id: '36', name: 'Dadd9', fullName: 'D Add 9', type: 'Add9', category: 'Open', fingers: ['x', 'x', 0, 2, 3, 0], frets: [0, 0, 0, 2, 3, 0], description: 'D add 9' },
];

const COMMON_PROGRESSIONS = [
  { id: '1', name: 'Classic Rock (I-IV-V)', chords: ['G', 'C', 'D'], description: 'The most common progression in rock' },
  { id: '2', name: 'Pop Ballad (vi-IV-I-V)', chords: ['Am', 'F', 'C', 'G'], description: 'Used in countless pop songs' },
  { id: '3', name: 'Blues (I-IV-I-V)', chords: ['E', 'A', 'E', 'G'], description: '12-bar blues foundation' },
  { id: '4', name: 'Jazz Standard (ii-V-I)', chords: ['Dm7', 'G7', 'Cmaj7'], description: 'Common jazz progression' },
  { id: '5', name: 'Folk (I-V-vi-IV)', chords: ['C', 'G', 'Am', 'F'], description: 'Folk and indie favorite' },
  { id: '6', name: '50s Progression', chords: ['C', 'Am', 'F', 'G'], description: 'Classic 1950s sound' },
  { id: '7', name: 'Andalusian', chords: ['Am', 'G', 'F', 'E'], description: 'Spanish/flamenco progression' },
  { id: '8', name: 'Canon in D', chords: ['D', 'A', 'G', 'D'], description: 'Pachelbel progression' },
];

export default function App() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ChordType | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<ChordCategory | 'All'>('All');
  const [selectedChord, setSelectedChord] = useState<ChordDiagram | null>(null);
  const [showChordModal, setShowChordModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'chords' | 'progressions' | 'practice'>('chords');
  const [practiceChords, setPracticeChords] = useState<string[]>([]);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
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
    const newFavorites = favorites.includes(chordId)
      ? favorites.filter((id) => id !== chordId)
      : [...favorites, chordId];
    saveFavorites(newFavorites);
  };

  const openChordDetail = (chord: ChordDiagram) => {
    setSelectedChord(chord);
    setShowChordModal(true);
    const newCount = adCount + 1;
    setAdCount(newCount);
    if (newCount % 8 === 0) showInterstitialAd();
  };

  const startPracticeMode = (chords: string[]) => {
    setPracticeChords(chords);
    setCurrentPracticeIndex(0);
    setActiveTab('practice');
  };

  const nextChord = () => {
    setCurrentPracticeIndex((prev) => (prev + 1) % practiceChords.length);
  };

  const prevChord = () => {
    setCurrentPracticeIndex((prev) => (prev - 1 + practiceChords.length) % practiceChords.length);
  };

  const filteredChords = CHORD_LIBRARY.filter((chord) => {
    const matchesSearch = chord.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chord.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All' || chord.type === selectedType;
    const matchesCategory = selectedCategory === 'All' || chord.category === selectedCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const favoriteChords = CHORD_LIBRARY.filter((chord) => favorites.includes(chord.id));

  const renderChordDiagram = (chord: ChordDiagram, compact: boolean = false) => {
    const size = compact ? 60 : 120;
    const stringSpacing = size / 6;
    const fretSpacing = size / 5;

    return (
      <View style={[styles.chordDiagram, compact && styles.chordDiagramCompact]}>
        {[0, 1, 2, 3, 4, 5].map((string) => (
          <View key={`string-${string}`} style={[styles.string, { left: string * stringSpacing }, compact && styles.stringCompact]} />
        ))}
        {[0, 1, 2, 3, 4].map((fret) => (
          <View key={`fret-${fret}`} style={[styles.fret, { top: fret * fretSpacing }, compact && styles.fretCompact, fret === 0 && styles.fretNut]} />
        ))}
        {chord.fingers.map((finger, index) => {
          if (finger === 'x') {
            return <Text key={`finger-${index}`} style={[styles.muted, { left: index * stringSpacing - (compact ? 4 : 8) }, compact && styles.mutedCompact]}>×</Text>;
          }
          if (finger === 0) {
            return <View key={`finger-${index}`} style={[styles.openString, { left: index * stringSpacing - (compact ? 4 : 8) }, compact && styles.openStringCompact]} />;
          }
          const fretNum = typeof finger === 'number' ? finger : 0;
          if (fretNum > 0) {
            return (
              <View key={`finger-${index}`} style={[styles.fingerDot, { left: index * stringSpacing - (compact ? 6 : 12), top: (fretNum - 0.5) * fretSpacing + (compact ? 8 : 16) }, compact && styles.fingerDotCompact]}>
                {!compact && <Text style={styles.fingerNumber}>{finger}</Text>}
              </View>
            );
          }
          return null;
        })}
      </View>
    );
  };

  const renderChordCard = ({ item }: { item: ChordDiagram }) => {
    const isFavorite = favorites.includes(item.id);
    return (
      <TouchableOpacity style={styles.chordCard} onPress={() => openChordDetail(item)}>
        <View style={styles.chordCardHeader}>
          <View>
            <Text style={styles.chordName}>{item.name}</Text>
            <Text style={styles.chordFullName}>{item.fullName}</Text>
          </View>
          <TouchableOpacity onPress={() => toggleFavorite(item.id)} style={styles.favoriteButton}>
            <Text style={styles.favoriteStar}>{isFavorite ? '★' : '☆'}</Text>
          </TouchableOpacity>
        </View>
        {renderChordDiagram(item, true)}
        <View style={styles.chordTags}>
          <View style={[styles.tag, styles.tagType]}><Text style={styles.tagText}>{item.type}</Text></View>
          <View style={[styles.tag, styles.tagCategory]}><Text style={styles.tagText}>{item.category}</Text></View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderChordsView = () => (
    <View style={styles.contentContainer}>
      <View style={styles.searchContainer}>
        <TextInput style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} placeholder="Search chords..." placeholderTextColor={colors.gray.medium} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filters}>
          <Text style={styles.filterLabel}>Type:</Text>
          <TouchableOpacity style={[styles.filterChip, selectedType === 'All' && styles.filterChipActive]} onPress={() => setSelectedType('All')}>
            <Text style={[styles.filterChipText, selectedType === 'All' && styles.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
          {CHORD_TYPES.map((type) => (
            <TouchableOpacity key={type} style={[styles.filterChip, selectedType === type && styles.filterChipActive]} onPress={() => setSelectedType(type)}>
              <Text style={[styles.filterChipText, selectedType === type && styles.filterChipTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filters}>
          <Text style={styles.filterLabel}>Category:</Text>
          {(['All', 'Open', 'Barre', 'Power'] as const).map((cat) => (
            <TouchableOpacity key={cat} style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]} onPress={() => setSelectedCategory(cat)}>
              <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {favoriteChords.length > 0 && (
        <View style={styles.favoritesSection}>
          <Text style={styles.sectionTitle}>Favorites</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {favoriteChords.map((chord) => (
              <TouchableOpacity key={chord.id} style={styles.favoriteChordCard} onPress={() => openChordDetail(chord)}>
                <Text style={styles.favoriteChordName}>{chord.name}</Text>
                {renderChordDiagram(chord, true)}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      <FlatList data={filteredChords} keyExtractor={(item) => item.id} renderItem={renderChordCard} numColumns={2} columnWrapperStyle={styles.chordRow} contentContainerStyle={styles.chordList} ListEmptyComponent={<Text style={styles.emptyText}>No chords found</Text>} />
    </View>
  );

  const renderProgressionsView = () => (
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
          <TouchableOpacity style={styles.practiceButton} onPress={() => startPracticeMode(progression.chords)}>
            <Text style={styles.practiceButtonText}>Practice This</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  const renderPracticeView = () => {
    if (practiceChords.length === 0) {
      return (
        <View style={styles.emptyPractice}>
          <Text style={styles.emptyPracticeText}>No progression selected. Go to Progressions tab!</Text>
        </View>
      );
    }
    const currentChordName = practiceChords[currentPracticeIndex];
    const currentChord = CHORD_LIBRARY.find((c) => c.name === currentChordName);
    if (!currentChord) return null;
    return (
      <View style={styles.practiceContainer}>
        <Text style={styles.practiceTitle}>Practice Mode</Text>
        <Text style={styles.practiceProgression}>{practiceChords.join(' → ')}</Text>
        <View style={styles.practiceChordDisplay}>
          <Text style={styles.practiceChordName}>{currentChord.name}</Text>
          <Text style={styles.practiceChordFullName}>{currentChord.fullName}</Text>
          {renderChordDiagram(currentChord, false)}
          <Text style={styles.practiceDescription}>{currentChord.description}</Text>
        </View>
        <View style={styles.practiceControls}>
          <TouchableOpacity style={styles.practiceNavButton} onPress={prevChord}><Text style={styles.practiceNavText}>← Previous</Text></TouchableOpacity>
          <Text style={styles.practiceCounter}>{currentPracticeIndex + 1} / {practiceChords.length}</Text>
          <TouchableOpacity style={styles.practiceNavButton} onPress={nextChord}><Text style={styles.practiceNavText}>Next →</Text></TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Guitar Chords</Text>
        <Text style={styles.subtitle}>{CHORD_LIBRARY.length} chords</Text>
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'chords' && styles.tabActive]} onPress={() => setActiveTab('chords')}>
          <Text style={[styles.tabText, activeTab === 'chords' && styles.tabTextActive]}>Chords</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'progressions' && styles.tabActive]} onPress={() => setActiveTab('progressions')}>
          <Text style={[styles.tabText, activeTab === 'progressions' && styles.tabTextActive]}>Progressions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'practice' && styles.tabActive]} onPress={() => setActiveTab('practice')}>
          <Text style={[styles.tabText, activeTab === 'practice' && styles.tabTextActive]}>Practice</Text>
        </TouchableOpacity>
      </View>
      {activeTab === 'chords' && renderChordsView()}
      {activeTab === 'progressions' && renderProgressionsView()}
      {activeTab === 'practice' && renderPracticeView()}
      <AdBanner />
      <Modal visible={showChordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedChord && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalChordName}>{selectedChord.name}</Text>
                    <Text style={styles.modalChordFullName}>{selectedChord.fullName}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowChordModal(false)}><Text style={styles.closeButton}>✕</Text></TouchableOpacity>
                </View>
                <View style={styles.modalDiagramContainer}>{renderChordDiagram(selectedChord, false)}</View>
                <View style={styles.fingeringInfo}>
                  <Text style={styles.fingeringTitle}>Finger Positions:</Text>
                  <View style={styles.fingeringList}>
                    {selectedChord.fingers.map((finger, index) => {
                      const strings = ['E', 'A', 'D', 'G', 'B', 'e'];
                      let status = '';
                      if (finger === 'x') status = 'Muted';
                      else if (finger === 0) status = 'Open';
                      else status = `Finger ${finger}`;
                      return (
                        <View key={index} style={styles.fingeringRow}>
                          <Text style={styles.fingeringString}>{strings[index]}</Text>
                          <Text style={styles.fingeringStatus}>{status}</Text>
                        </View>
                      );
                    })}
                  </View>
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
  searchContainer: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  searchInput: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.md, fontSize: 16, color: colors.text },
  filterScroll: { maxHeight: 50, marginBottom: spacing.sm },
  filters: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, gap: spacing.sm },
  filterLabel: { fontSize: 14, fontWeight: '600', color: colors.gray.dark, marginRight: spacing.sm },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.white, borderRadius: 20, borderWidth: 1, borderColor: colors.gray.light },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: 12, color: colors.gray.dark },
  filterChipTextActive: { color: colors.white, fontWeight: '600' },
  favoritesSection: { marginBottom: spacing.md, paddingLeft: spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.md },
  favoriteChordCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.md, marginRight: spacing.sm, alignItems: 'center', minWidth: 100 },
  favoriteChordName: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.sm },
  chordList: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  chordRow: { justifyContent: 'space-between', marginBottom: spacing.md },
  chordCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.md, width: '48%' },
  chordCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  chordName: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  chordFullName: { fontSize: 12, color: colors.gray.dark },
  favoriteButton: { padding: 4 },
  favoriteStar: { fontSize: 20, color: colors.status.warning },
  chordDiagram: { width: 120, height: 120, position: 'relative', marginVertical: spacing.md, alignSelf: 'center' },
  chordDiagramCompact: { width: 60, height: 60 },
  string: { position: 'absolute', width: 1, height: '100%', backgroundColor: colors.gray.dark, top: 16 },
  stringCompact: { top: 8 },
  fret: { position: 'absolute', width: '100%', height: 1, backgroundColor: colors.gray.dark },
  fretCompact: { height: 1 },
  fretNut: { height: 3, backgroundColor: colors.text },
  fingerDot: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  fingerDotCompact: { width: 12, height: 12, borderRadius: 6 },
  fingerNumber: { color: colors.white, fontSize: 12, fontWeight: 'bold' },
  muted: { position: 'absolute', top: 0, fontSize: 16, color: colors.status.error, fontWeight: 'bold' },
  mutedCompact: { fontSize: 12, top: -2 },
  openString: { position: 'absolute', top: 2, width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.status.success },
  openStringCompact: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, top: 0 },
  chordTags: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 6 },
  tagType: { backgroundColor: colors.accent + '20' },
  tagCategory: { backgroundColor: colors.primary + '20' },
  tagText: { fontSize: 10, color: colors.text, fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: spacing.xl, color: colors.gray.medium, fontSize: 16 },
  progressionsList: { padding: spacing.lg, paddingBottom: 100 },
  progressionCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.md },
  progressionName: { fontSize: 18, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.sm },
  progressionDescription: { fontSize: 14, color: colors.gray.dark, marginBottom: spacing.md },
  progressionChords: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  progressionChordBadge: { backgroundColor: colors.accent, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8 },
  progressionChordText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  practiceButton: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: 8, alignItems: 'center' },
  practiceButtonText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  practiceContainer: { flex: 1, padding: spacing.lg, alignItems: 'center' },
  practiceTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.sm },
  practiceProgression: { fontSize: 16, color: colors.gray.dark, marginBottom: spacing.xl },
  practiceChordDisplay: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.xl, alignItems: 'center', width: '100%', marginBottom: spacing.xl },
  practiceChordName: { fontSize: 32, fontWeight: 'bold', color: colors.primary },
  practiceChordFullName: { fontSize: 16, color: colors.gray.dark, marginBottom: spacing.lg },
  practiceDescription: { fontSize: 14, color: colors.gray.dark, textAlign: 'center', marginTop: spacing.lg },
  practiceControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  practiceNavButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: 8 },
  practiceNavText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  practiceCounter: { fontSize: 16, fontWeight: 'bold', color: colors.gray.dark },
  emptyPractice: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyPracticeText: { fontSize: 16, color: colors.gray.medium, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  modalChordName: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  modalChordFullName: { fontSize: 16, color: colors.gray.dark },
  closeButton: { fontSize: 28, color: colors.gray.dark },
  modalDiagramContainer: { alignItems: 'center', marginBottom: spacing.lg },
  fingeringInfo: { backgroundColor: colors.gray.light, borderRadius: 12, padding: spacing.md, marginBottom: spacing.lg },
  fingeringTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  fingeringList: { gap: 4 },
  fingeringRow: { flexDirection: 'row', justifyContent: 'space-between' },
  fingeringString: { fontSize: 14, fontWeight: '600', color: colors.primary },
  fingeringStatus: { fontSize: 14, color: colors.gray.dark },
  chordDescription: { fontSize: 14, color: colors.gray.dark, marginBottom: spacing.lg, fontStyle: 'italic' },
  favoriteButtonLarge: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  favoriteButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
