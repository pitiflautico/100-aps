import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Voice_Recorder_data';

interface Recording {
  id: string;
  name: string;
  duration: number;
  date: string;
  quality: AudioQuality;
  size: number;
}

type AudioQuality = 'Low' | 'Medium' | 'High';

interface QualitySettings {
  [key: string]: {
    bitRate: number;
    sampleRate: number;
    label: string;
    description: string;
  };
}

const QUALITY_SETTINGS: QualitySettings = {
  Low: {
    bitRate: 64000,
    sampleRate: 22050,
    label: 'Low',
    description: '64kbps - Small files',
  },
  Medium: {
    bitRate: 128000,
    sampleRate: 44100,
    label: 'Medium',
    description: '128kbps - Balanced',
  },
  High: {
    bitRate: 192000,
    sampleRate: 48000,
    label: 'High',
    description: '192kbps - Best quality',
  },
};

export default function App() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [selectedQuality, setSelectedQuality] = useState<AudioQuality>('Medium');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameRecording, setRenameRecording] = useState<Recording | null>(null);
  const [newName, setNewName] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [adCount, setAdCount] = useState(0);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeAds();
    loadData();
    setupAudio();

    return () => {
      cleanupAudio();
    };
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Audio setup error:', error);
    }
  };

  const cleanupAudio = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {}
    }
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (e) {}
    }
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
  };

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setRecordings(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (data: Recording[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setRecordings(data);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const startRecording = async () => {
    try {
      await stopPlayback();

      const settings = QUALITY_SETTINGS[selectedQuality];
      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: settings.sampleRate,
          numberOfChannels: 1,
          bitRate: settings.bitRate,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: settings.sampleRate,
          numberOfChannels: 1,
          bitRate: settings.bitRate,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      });

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      durationInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
      console.error('Recording error:', error);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }

      await recordingRef.current.stopAndUnloadAsync();
      const status = await recordingRef.current.getStatusAsync();

      const duration = status.durationMillis || 0;
      const newRecording: Recording = {
        id: Date.now().toString(),
        name: `Recording ${recordings.length + 1}`,
        duration: Math.floor(duration / 1000),
        date: new Date().toISOString(),
        quality: selectedQuality,
        size: estimateFileSize(duration / 1000, selectedQuality),
      };

      const newRecordings = [newRecording, ...recordings];
      saveData(newRecordings);
      recordingRef.current = null;
      setRecordingDuration(0);

      const newCount = adCount + 1;
      setAdCount(newCount);
      if (newCount % 5 === 0) showInterstitialAd();
    } catch (error) {
      Alert.alert('Error', 'Failed to save recording');
      console.error('Stop recording error:', error);
    }
  };

  const playRecording = async (recording: Recording) => {
    try {
      if (playingId === recording.id) {
        await stopPlayback();
        return;
      }

      await stopPlayback();

      // Simulated playback
      setPlayingId(recording.id);
      setPlaybackPosition(0);

      const interval = setInterval(() => {
        setPlaybackPosition(prev => {
          if (prev >= recording.duration) {
            clearInterval(interval);
            setPlayingId(null);
            setPlaybackPosition(0);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Playback error:', error);
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const stopPlayback = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (e) {}
    }
    setPlayingId(null);
    setPlaybackPosition(0);
  };

  const deleteRecording = (id: string) => {
    Alert.alert('Delete Recording', 'Are you sure you want to delete this recording?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (playingId === id) stopPlayback();
          saveData(recordings.filter(r => r.id !== id));
        },
      },
    ]);
  };

  const openRenameModal = (recording: Recording) => {
    setRenameRecording(recording);
    setNewName(recording.name);
    setShowRenameModal(true);
  };

  const renameRecordingAction = () => {
    if (!renameRecording || !newName.trim()) return;

    const updated = recordings.map(r =>
      r.id === renameRecording.id ? { ...r, name: newName.trim() } : r
    );
    saveData(updated);
    setShowRenameModal(false);
    setRenameRecording(null);
    setNewName('');
  };

  const estimateFileSize = (durationSeconds: number, quality: AudioQuality): number => {
    const bitRate = QUALITY_SETTINGS[quality].bitRate;
    return Math.floor((bitRate / 8) * durationSeconds);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTotalSize = (): number => {
    return recordings.reduce((sum, r) => sum + r.size, 0);
  };

  const getTotalDuration = (): number => {
    return recordings.reduce((sum, r) => sum + r.duration, 0);
  };

  const renderRecordingItem = ({ item }: { item: Recording }) => {
    const isPlaying = playingId === item.id;
    const progress = isPlaying ? (playbackPosition / item.duration) * 100 : 0;

    return (
      <View style={styles.recordingCard}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => playRecording(item)}
        >
          <Text style={styles.playButtonText}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        <View style={styles.recordingInfo}>
          <Text style={styles.recordingName}>{item.name}</Text>
          <View style={styles.recordingMeta}>
            <Text style={styles.metaText}>{formatDuration(item.duration)}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{item.quality}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{formatSize(item.size)}</Text>
          </View>
          <Text style={styles.recordingDate}>{formatDate(item.date)}</Text>

          {isPlaying && (
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          )}
        </View>

        <View style={styles.recordingActions}>
          <TouchableOpacity
            style={styles.actionIcon}
            onPress={() => openRenameModal(item)}
          >
            <Text style={styles.actionIconText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionIcon}
            onPress={() => deleteRecording(item.id)}
          >
            <Text style={styles.actionIconText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Voice Recorder</Text>
        <TouchableOpacity onPress={() => setShowSettingsModal(true)}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{recordings.length}</Text>
          <Text style={styles.statLabel}>Recordings</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatDuration(getTotalDuration())}</Text>
          <Text style={styles.statLabel}>Total Time</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatSize(getTotalSize())}</Text>
          <Text style={styles.statLabel}>Storage</Text>
        </View>
      </View>

      <View style={styles.recordingSection}>
        <View style={styles.recordingDisplay}>
          {isRecording ? (
            <>
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>Recording...</Text>
              </View>
              <Text style={styles.recordingTime}>{formatDuration(recordingDuration)}</Text>
            </>
          ) : (
            <>
              <Text style={styles.readyText}>Ready to Record</Text>
              <Text style={styles.qualityText}>Quality: {selectedQuality}</Text>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordButtonActive]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <View style={[styles.recordButtonInner, isRecording && styles.recordButtonInnerStop]} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={recordings}
        keyExtractor={item => item.id}
        renderItem={renderRecordingItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🎙️</Text>
            <Text style={styles.emptyText}>No recordings yet</Text>
            <Text style={styles.emptySubtext}>Tap the button above to start</Text>
          </View>
        }
      />

      <AdBanner />

      {/* Rename Modal */}
      <Modal visible={showRenameModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename Recording</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter new name"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowRenameModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={renameRecordingAction}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={showSettingsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Recording Quality</Text>

            <ScrollView style={styles.qualityList}>
              {(Object.keys(QUALITY_SETTINGS) as AudioQuality[]).map(quality => {
                const settings = QUALITY_SETTINGS[quality];
                const isSelected = selectedQuality === quality;

                return (
                  <TouchableOpacity
                    key={quality}
                    style={[styles.qualityOption, isSelected && styles.qualityOptionActive]}
                    onPress={() => setSelectedQuality(quality)}
                  >
                    <View style={styles.qualityInfo}>
                      <Text style={[styles.qualityLabel, isSelected && styles.qualityLabelActive]}>
                        {settings.label}
                      </Text>
                      <Text style={styles.qualityDescription}>{settings.description}</Text>
                    </View>
                    <View style={[styles.radio, isSelected && styles.radioActive]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.storageInfo}>
              <Text style={styles.storageTitle}>Storage Info</Text>
              <View style={styles.storageRow}>
                <Text style={styles.storageLabel}>Total Recordings:</Text>
                <Text style={styles.storageValue}>{recordings.length}</Text>
              </View>
              <View style={styles.storageRow}>
                <Text style={styles.storageLabel}>Total Size:</Text>
                <Text style={styles.storageValue}>{formatSize(getTotalSize())}</Text>
              </View>
              <View style={styles.storageRow}>
                <Text style={styles.storageLabel}>Total Duration:</Text>
                <Text style={styles.storageValue}>{formatDuration(getTotalDuration())}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={() => setShowSettingsModal(false)}
            >
              <Text style={styles.saveButtonText}>Done</Text>
            </TouchableOpacity>
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
  settingsIcon: {
    fontSize: 24,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray.dark,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.gray.light,
    marginHorizontal: spacing.sm,
  },
  recordingSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  recordingDisplay: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.status.error,
    marginRight: spacing.sm,
  },
  recordingText: {
    fontSize: 16,
    color: colors.status.error,
    fontWeight: '600',
  },
  recordingTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  readyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  qualityText: {
    fontSize: 14,
    color: colors.gray.dark,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.status.error,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  recordButtonActive: {
    backgroundColor: colors.status.error + '20',
  },
  recordButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.status.error,
  },
  recordButtonInnerStop: {
    borderRadius: 8,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  recordingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  playButtonText: {
    fontSize: 20,
    color: colors.white,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  recordingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  metaText: {
    fontSize: 12,
    color: colors.gray.dark,
  },
  metaDot: {
    fontSize: 12,
    color: colors.gray.medium,
    marginHorizontal: spacing.xs,
  },
  recordingDate: {
    fontSize: 11,
    color: colors.gray.medium,
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.gray.light,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  recordingActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionIcon: {
    padding: spacing.sm,
  },
  actionIconText: {
    fontSize: 18,
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
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
  qualityList: {
    marginBottom: spacing.lg,
  },
  qualityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  qualityOptionActive: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  qualityInfo: {
    flex: 1,
  },
  qualityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  qualityLabelActive: {
    color: colors.primary,
  },
  qualityDescription: {
    fontSize: 14,
    color: colors.gray.dark,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  storageInfo: {
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  storageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  storageLabel: {
    fontSize: 14,
    color: colors.gray.dark,
  },
  storageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
