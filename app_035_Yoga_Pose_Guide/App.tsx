import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

interface YogaPose {
  id: string;
  name: string;
  benefits: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'Standing' | 'Seated' | 'Balancing' | 'Backbends' | 'Twists';
  instructions: string;
}

interface Sequence {
  id: string;
  name: string;
  poseIds: string[];
}

const YOGA_POSES: YogaPose[] = [
  { id: '1', name: 'Mountain Pose (Tadasana)', category: 'Standing', difficulty: 'Beginner', benefits: 'Improves posture, balance, and calm', instructions: 'Stand with feet together, arms at sides' },
  { id: '2', name: 'Downward Dog (Adho Mukha Svanasana)', category: 'Standing', difficulty: 'Beginner', benefits: 'Strengthens arms, legs, stretches hamstrings', instructions: 'Form inverted V shape, hands and feet on ground' },
  { id: '3', name: 'Warrior I (Virabhadrasana I)', category: 'Standing', difficulty: 'Beginner', benefits: 'Strengthens legs, opens hips and chest', instructions: 'Lunge position, arms raised overhead' },
  { id: '4', name: 'Warrior II (Virabhadrasana II)', category: 'Standing', difficulty: 'Beginner', benefits: 'Strengthens legs, improves focus', instructions: 'Lunge with arms extended parallel to floor' },
  { id: '5', name: 'Triangle Pose (Trikonasana)', category: 'Standing', difficulty: 'Beginner', benefits: 'Stretches legs, strengthens thighs', instructions: 'Extended triangle shape, hand to ankle' },
  { id: '6', name: 'Tree Pose (Vrksasana)', category: 'Balancing', difficulty: 'Beginner', benefits: 'Improves balance and focus', instructions: 'Stand on one leg, foot on inner thigh' },
  { id: '7', name: 'Eagle Pose (Garudasana)', category: 'Balancing', difficulty: 'Intermediate', benefits: 'Improves balance, strengthens legs', instructions: 'Wrap one leg around other, arms entwined' },
  { id: '8', name: 'Warrior III (Virabhadrasana III)', category: 'Balancing', difficulty: 'Intermediate', benefits: 'Strengthens core and legs', instructions: 'Balance on one leg, body parallel to floor' },
  { id: '9', name: 'Half Moon Pose (Ardha Chandrasana)', category: 'Balancing', difficulty: 'Intermediate', benefits: 'Strengthens legs, improves balance', instructions: 'Balance on one leg, arm reaching up' },
  { id: '10', name: 'Child\'s Pose (Balasana)', category: 'Seated', difficulty: 'Beginner', benefits: 'Relieves stress, stretches back', instructions: 'Kneel and fold forward, arms extended' },
  { id: '11', name: 'Easy Pose (Sukhasana)', category: 'Seated', difficulty: 'Beginner', benefits: 'Opens hips, promotes calm', instructions: 'Cross-legged sitting position' },
  { id: '12', name: 'Seated Forward Bend (Paschimottanasana)', category: 'Seated', difficulty: 'Beginner', benefits: 'Stretches spine and hamstrings', instructions: 'Sit and fold forward over legs' },
  { id: '13', name: 'Lotus Pose (Padmasana)', category: 'Seated', difficulty: 'Advanced', benefits: 'Opens hips, calms mind', instructions: 'Cross-legged with feet on opposite thighs' },
  { id: '14', name: 'Cobra Pose (Bhujangasana)', category: 'Backbends', difficulty: 'Beginner', benefits: 'Strengthens spine, opens chest', instructions: 'Lie prone, lift chest with arms' },
  { id: '15', name: 'Upward Dog (Urdhva Mukha Svanasana)', category: 'Backbends', difficulty: 'Intermediate', benefits: 'Strengthens back, opens chest', instructions: 'Arch back, thighs off ground' },
  { id: '16', name: 'Camel Pose (Ustrasana)', category: 'Backbends', difficulty: 'Intermediate', benefits: 'Opens chest and hip flexors', instructions: 'Kneel and arch back, hands to heels' },
  { id: '17', name: 'Wheel Pose (Urdhva Dhanurasana)', category: 'Backbends', difficulty: 'Advanced', benefits: 'Strengthens entire body, increases flexibility', instructions: 'Full backbend, hands and feet on ground' },
  { id: '18', name: 'Seated Spinal Twist (Ardha Matsyendrasana)', category: 'Twists', difficulty: 'Beginner', benefits: 'Improves spine flexibility', instructions: 'Sit and twist torso to one side' },
  { id: '19', name: 'Revolved Triangle (Parivrtta Trikonasana)', category: 'Twists', difficulty: 'Intermediate', benefits: 'Strengthens legs, improves balance', instructions: 'Triangle pose with twist' },
  { id: '20', name: 'Lord of Fishes (Matsyendrasana)', category: 'Twists', difficulty: 'Intermediate', benefits: 'Detoxifies, improves digestion', instructions: 'Deep seated twist' },
  { id: '21', name: 'Plank Pose (Phalakasana)', category: 'Standing', difficulty: 'Beginner', benefits: 'Strengthens core and arms', instructions: 'Hold push-up position' },
  { id: '22', name: 'Side Plank (Vasisthasana)', category: 'Balancing', difficulty: 'Intermediate', benefits: 'Strengthens core, improves balance', instructions: 'Balance on one hand and side of foot' },
  { id: '23', name: 'Bridge Pose (Setu Bandhasana)', category: 'Backbends', difficulty: 'Beginner', benefits: 'Strengthens back, opens chest', instructions: 'Lie on back, lift hips' },
  { id: '24', name: 'Corpse Pose (Savasana)', category: 'Seated', difficulty: 'Beginner', benefits: 'Complete relaxation, reduces stress', instructions: 'Lie on back, completely relax' },
];

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [newSequence, setNewSequence] = useState({ name: '', poseIds: [] as string[] });
  const [activeTab, setActiveTab] = useState<'poses' | 'favorites' | 'sequences'>('poses');
  const [selectedPose, setSelectedPose] = useState<YogaPose | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('yoga_favorites');
      if (storedFavorites) setFavorites(JSON.parse(storedFavorites));

      const storedSequences = await AsyncStorage.getItem('yoga_sequences');
      if (storedSequences) setSequences(JSON.parse(storedSequences));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const toggleFavorite = async (poseId: string) => {
    const newFavorites = favorites.includes(poseId)
      ? favorites.filter(id => id !== poseId)
      : [...favorites, poseId];

    setFavorites(newFavorites);
    await AsyncStorage.setItem('yoga_favorites', JSON.stringify(newFavorites));
  };

  const saveSequence = async () => {
    if (!newSequence.name || newSequence.poseIds.length === 0) return;

    const sequence: Sequence = {
      id: Date.now().toString(),
      name: newSequence.name,
      poseIds: newSequence.poseIds,
    };

    const updated = [...sequences, sequence];
    setSequences(updated);
    await AsyncStorage.setItem('yoga_sequences', JSON.stringify(updated));

    setNewSequence({ name: '', poseIds: [] });
    setShowSequenceModal(false);
  };

  const addToSequence = (poseId: string) => {
    if (!newSequence.poseIds.includes(poseId)) {
      setNewSequence({ ...newSequence, poseIds: [...newSequence.poseIds, poseId] });
    }
  };

  const removeFromSequence = (poseId: string) => {
    setNewSequence({
      ...newSequence,
      poseIds: newSequence.poseIds.filter(id => id !== poseId)
    });
  };

  const deleteSequence = async (sequenceId: string) => {
    const updated = sequences.filter(s => s.id !== sequenceId);
    setSequences(updated);
    await AsyncStorage.setItem('yoga_sequences', JSON.stringify(updated));
  };

  const filteredPoses = YOGA_POSES.filter(pose => {
    const matchesSearch = pose.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || pose.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || pose.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const favoritePoses = YOGA_POSES.filter(pose => favorites.includes(pose.id));

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return '#10B981';
      case 'Intermediate': return '#F59E0B';
      case 'Advanced': return '#EF4444';
      default: return '#94A3B8';
    }
  };

  const renderPoseCard = (pose: YogaPose) => (
    <TouchableOpacity
      key={pose.id}
      style={styles.poseCard}
      onPress={() => setSelectedPose(pose)}
    >
      <View style={styles.poseHeader}>
        <Text style={styles.poseName}>{pose.name}</Text>
        <TouchableOpacity onPress={() => toggleFavorite(pose.id)}>
          <Text style={styles.favoriteIcon}>
            {favorites.includes(pose.id) ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.poseTags}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{pose.category}</Text>
        </View>
        <View style={[styles.tag, { backgroundColor: getDifficultyColor(pose.difficulty) + '20' }]}>
          <Text style={[styles.tagText, { color: getDifficultyColor(pose.difficulty) }]}>
            {pose.difficulty}
          </Text>
        </View>
      </View>
      <Text style={styles.poseBenefits}>{pose.benefits}</Text>
      {showSequenceModal && (
        <TouchableOpacity
          style={[
            styles.addToSequenceButton,
            newSequence.poseIds.includes(pose.id) && styles.addedToSequence
          ]}
          onPress={() =>
            newSequence.poseIds.includes(pose.id)
              ? removeFromSequence(pose.id)
              : addToSequence(pose.id)
          }
        >
          <Text style={styles.addToSequenceText}>
            {newSequence.poseIds.includes(pose.id) ? 'Remove' : 'Add to Sequence'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>Yoga Pose Guide</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'poses' && styles.tabActive]}
          onPress={() => setActiveTab('poses')}
        >
          <Text style={[styles.tabText, activeTab === 'poses' && styles.tabTextActive]}>
            All Poses ({YOGA_POSES.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
          onPress={() => setActiveTab('favorites')}
        >
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
            Favorites ({favorites.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sequences' && styles.tabActive]}
          onPress={() => setActiveTab('sequences')}
        >
          <Text style={[styles.tabText, activeTab === 'sequences' && styles.tabTextActive]}>
            Sequences ({sequences.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'poses' && (
        <>
          <View style={styles.searchSection}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search poses..."
              placeholderTextColor="#6B7280"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
            <TouchableOpacity
              style={[styles.filterButton, selectedCategory === 'All' && styles.filterButtonActive]}
              onPress={() => setSelectedCategory('All')}
            >
              <Text style={[styles.filterButtonText, selectedCategory === 'All' && styles.filterButtonTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {['Standing', 'Seated', 'Balancing', 'Backbends', 'Twists'].map(category => (
              <TouchableOpacity
                key={category}
                style={[styles.filterButton, selectedCategory === category && styles.filterButtonActive]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[styles.filterButtonText, selectedCategory === category && styles.filterButtonTextActive]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
            <TouchableOpacity
              style={[styles.filterButton, selectedDifficulty === 'All' && styles.filterButtonActive]}
              onPress={() => setSelectedDifficulty('All')}
            >
              <Text style={[styles.filterButtonText, selectedDifficulty === 'All' && styles.filterButtonTextActive]}>
                All Levels
              </Text>
            </TouchableOpacity>
            {['Beginner', 'Intermediate', 'Advanced'].map(difficulty => (
              <TouchableOpacity
                key={difficulty}
                style={[styles.filterButton, selectedDifficulty === difficulty && styles.filterButtonActive]}
                onPress={() => setSelectedDifficulty(difficulty)}
              >
                <Text style={[styles.filterButtonText, selectedDifficulty === difficulty && styles.filterButtonTextActive]}>
                  {difficulty}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'poses' && filteredPoses.map(renderPoseCard)}

        {activeTab === 'favorites' && (
          <>
            {favoritePoses.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No favorite poses yet</Text>
                <Text style={styles.emptyStateSubtext}>Tap the star icon to save your favorites</Text>
              </View>
            ) : (
              favoritePoses.map(renderPoseCard)
            )}
          </>
        )}

        {activeTab === 'sequences' && (
          <>
            <TouchableOpacity
              style={styles.createSequenceButton}
              onPress={() => setShowSequenceModal(true)}
            >
              <Text style={styles.createSequenceText}>+ Create New Sequence</Text>
            </TouchableOpacity>

            {sequences.map(sequence => (
              <View key={sequence.id} style={styles.sequenceCard}>
                <View style={styles.sequenceHeader}>
                  <Text style={styles.sequenceName}>{sequence.name}</Text>
                  <TouchableOpacity onPress={() => deleteSequence(sequence.id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.sequencePoseCount}>{sequence.poseIds.length} poses</Text>
                {sequence.poseIds.map(poseId => {
                  const pose = YOGA_POSES.find(p => p.id === poseId);
                  return pose ? (
                    <Text key={poseId} style={styles.sequencePoseItem}>• {pose.name}</Text>
                  ) : null;
                })}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={showSequenceModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Custom Sequence</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Sequence name"
              placeholderTextColor="#6B7280"
              value={newSequence.name}
              onChangeText={(text) => setNewSequence({ ...newSequence, name: text })}
            />

            <Text style={styles.modalSubtitle}>
              Selected: {newSequence.poseIds.length} poses
            </Text>

            <ScrollView style={styles.modalScroll}>
              {YOGA_POSES.map(renderPoseCard)}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowSequenceModal(false);
                  setNewSequence({ name: '', poseIds: [] });
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={saveSequence}
              >
                <Text style={styles.modalSaveText}>Save Sequence</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={selectedPose !== null} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.poseDetailModal}>
            {selectedPose && (
              <>
                <Text style={styles.poseDetailName}>{selectedPose.name}</Text>
                <View style={styles.poseTags}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{selectedPose.category}</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: getDifficultyColor(selectedPose.difficulty) + '20' }]}>
                    <Text style={[styles.tagText, { color: getDifficultyColor(selectedPose.difficulty) }]}>
                      {selectedPose.difficulty}
                    </Text>
                  </View>
                </View>
                <Text style={styles.poseDetailSection}>Benefits:</Text>
                <Text style={styles.poseDetailText}>{selectedPose.benefits}</Text>
                <Text style={styles.poseDetailSection}>Instructions:</Text>
                <Text style={styles.poseDetailText}>{selectedPose.instructions}</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedPose(null)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.adContainer}>
        <BannerAd unitId={TestIds.BANNER} size={BannerAdSize.BANNER} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 4,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#7C3AED',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filters: {
    maxHeight: 50,
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  filterButton: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  filterButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  poseCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  poseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  poseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  favoriteIcon: {
    fontSize: 24,
    color: '#F59E0B',
  },
  poseTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  tag: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  tagText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  poseBenefits: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  addToSequenceButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  addedToSequence: {
    backgroundColor: '#334155',
  },
  addToSequenceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: '#94A3B8',
    fontSize: 14,
  },
  createSequenceButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  createSequenceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sequenceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  sequenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sequenceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  deleteText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  sequencePoseCount: {
    color: '#7C3AED',
    fontSize: 14,
    marginBottom: 10,
  },
  sequencePoseItem: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalSubtitle: {
    color: '#7C3AED',
    fontSize: 16,
    marginBottom: 15,
    fontWeight: '600',
  },
  modalScroll: {
    maxHeight: 300,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  poseDetailModal: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 25,
  },
  poseDetailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  poseDetailSection: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginTop: 15,
    marginBottom: 8,
  },
  poseDetailText: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 5,
  },
});
