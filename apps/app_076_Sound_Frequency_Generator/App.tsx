import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView,
  TextInput, Alert, Dimensions, Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Slider } from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography } from './theme';
import { AdBanner } from './components/AdBanner';
import { AdsManager } from './services/adsManager';

const STORAGE_KEY = '@Sound_Frequency_Data';
const { width } = Dimensions.get('window');

interface Preset {
  id: string;
  name: string;
  frequency: number;
  waveform: WaveformType;
  volume: number;
}

type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';

const WAVEFORM_EMOJIS = {
  sine: '〰️',
  square: '▢',
  sawtooth: '📐',
  triangle: '△',
};

const FREQUENCY_PRESETS = [
  { name: '432 Hz', value: 432, description: 'Healing frequency' },
  { name: '440 Hz', value: 440, description: 'Standard A' },
  { name: '528 Hz', value: 528, description: 'Love frequency' },
  { name: '639 Hz', value: 639, description: 'Connection' },
  { name: '741 Hz', value: 741, description: 'Awakening' },
  { name: '852 Hz', value: 852, description: 'Intuition' },
];

export default function App() {
  const [frequency, setFrequency] = useState(440);
  const [volume, setVolume] = useState(0.5);
  const [waveform, setWaveform] = useState<WaveformType>('sine');
  const [isPlaying, setIsPlaying] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  // Advanced settings
  const [duration, setDuration] = useState(0); // 0 = continuous
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPresets(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const savePresets = async (data: Preset[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopSound();
    } else {
      playSound();
    }
  };

  const playSound = () => {
    // In a real implementation, this would use expo-av or Web Audio API
    // For now, we'll simulate the functionality
    setIsPlaying(true);

    if (duration > 0) {
      setTimeout(() => {
        stopSound();
      }, duration * 1000);
    }
  };

  const stopSound = () => {
    setIsPlaying(false);
  };

  const savePreset = () => {
    if (!presetName.trim()) {
      Alert.alert('Error', 'Please enter a preset name');
      return;
    }

    const newPreset: Preset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      frequency,
      waveform,
      volume,
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    savePresets(updated);
    setPresetName('');
    setShowSavePreset(false);
    AdsManager.showInterstitialAd();
  };

  const loadPreset = (preset: Preset) => {
    setFrequency(preset.frequency);
    setWaveform(preset.waveform);
    setVolume(preset.volume);
  };

  const deletePreset = (id: string) => {
    Alert.alert('Delete Preset', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = presets.filter(p => p.id !== id);
          setPresets(updated);
          savePresets(updated);
        },
      },
    ]);
  };

  const getFrequencyNote = (freq: number): string => {
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    const halfSteps = Math.round(12 * Math.log2(freq / C0));
    const octave = Math.floor(halfSteps / 12);
    const note = noteNames[halfSteps % 12];

    return `${note}${octave}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Frequency Generator</Text>
        <TouchableOpacity onPress={() => setShowInfo(!showInfo)}>
          <Text style={styles.infoButton}>ℹ️</Text>
        </TouchableOpacity>
      </View>

      {showInfo && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Generate precise audio frequencies from 20 Hz to 20,000 Hz.
            Use for audio testing, tuning instruments, or sound therapy.
          </Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        <View style={styles.mainControl}>
          <View style={styles.frequencyDisplay}>
            <Text style={styles.frequencyValue}>{frequency.toFixed(1)}</Text>
            <Text style={styles.frequencyUnit}>Hz</Text>
          </View>
          <Text style={styles.frequencyNote}>{getFrequencyNote(frequency)}</Text>

          <View style={styles.playButton}>
            <TouchableOpacity
              style={[styles.playButtonInner, isPlaying && styles.playButtonActive]}
              onPress={togglePlayback}
            >
              <Text style={styles.playButtonText}>
                {isPlaying ? '⏸' : '▶'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <AdBanner />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequency</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>20 Hz</Text>
            <Slider
              style={styles.slider}
              minimumValue={20}
              maximumValue={20000}
              value={frequency}
              onValueChange={setFrequency}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.gray.medium}
              thumbTintColor={colors.primary}
            />
            <Text style={styles.sliderLabel}>20k Hz</Text>
          </View>

          <TextInput
            style={styles.input}
            value={frequency.toString()}
            onChangeText={(text) => {
              const num = parseFloat(text);
              if (!isNaN(num) && num >= 20 && num <= 20000) {
                setFrequency(num);
              }
            }}
            keyboardType="decimal-pad"
            placeholder="Enter frequency"
          />

          <View style={styles.presetButtons}>
            {FREQUENCY_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.name}
                style={[
                  styles.presetButton,
                  frequency === preset.value && styles.presetButtonActive,
                ]}
                onPress={() => setFrequency(preset.value)}
              >
                <Text style={[
                  styles.presetButtonText,
                  frequency === preset.value && styles.presetButtonTextActive,
                ]}>
                  {preset.name}
                </Text>
                <Text style={styles.presetButtonDesc}>{preset.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Waveform</Text>
          <View style={styles.waveformButtons}>
            {(['sine', 'square', 'sawtooth', 'triangle'] as WaveformType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.waveformButton,
                  waveform === type && styles.waveformButtonActive,
                ]}
                onPress={() => setWaveform(type)}
              >
                <Text style={styles.waveformEmoji}>{WAVEFORM_EMOJIS[type]}</Text>
                <Text style={[
                  styles.waveformText,
                  waveform === type && styles.waveformTextActive,
                ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Volume</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>🔇</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={volume}
              onValueChange={setVolume}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.gray.medium}
              thumbTintColor={colors.primary}
            />
            <Text style={styles.sliderLabel}>🔊</Text>
          </View>
          <Text style={styles.volumeValue}>{Math.round(volume * 100)}%</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced Settings</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Duration (seconds)</Text>
            <TextInput
              style={styles.settingInput}
              value={duration.toString()}
              onChangeText={(text) => setDuration(parseInt(text) || 0)}
              keyboardType="number-pad"
              placeholder="0 = continuous"
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Fade In</Text>
            <Switch
              value={fadeIn}
              onValueChange={setFadeIn}
              trackColor={{ false: colors.gray.medium, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Fade Out</Text>
            <Switch
              value={fadeOut}
              onValueChange={setFadeOut}
              trackColor={{ false: colors.gray.medium, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved Presets</Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => setShowSavePreset(true)}
            >
              <Text style={styles.saveButtonText}>+ Save Current</Text>
            </TouchableOpacity>
          </View>

          {presets.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No saved presets</Text>
              <Text style={styles.emptySubtext}>Save your favorite settings</Text>
            </View>
          ) : (
            presets.map((preset) => (
              <View key={preset.id} style={styles.presetCard}>
                <TouchableOpacity
                  style={styles.presetCardContent}
                  onPress={() => loadPreset(preset)}
                >
                  <View style={styles.presetCardLeft}>
                    <Text style={styles.presetCardName}>{preset.name}</Text>
                    <Text style={styles.presetCardInfo}>
                      {preset.frequency.toFixed(1)} Hz · {preset.waveform} · {Math.round(preset.volume * 100)}%
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deletePresetButton}
                    onPress={() => deletePreset(preset.id)}
                  >
                    <Text style={styles.deletePresetText}>×</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ⚠️ Use headphones for best results. Avoid prolonged exposure to high frequencies.
          </Text>
        </View>
      </ScrollView>

      {/* Save Preset Modal */}
      {showSavePreset && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Save Preset</Text>
            <TextInput
              style={styles.modalInput}
              value={presetName}
              onChangeText={setPresetName}
              placeholder="Enter preset name"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowSavePreset(false);
                  setPresetName('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={savePreset}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSave]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  headerTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  infoButton: {
    fontSize: 24,
  },
  infoBox: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 12,
  },
  infoText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    lineHeight: typography.lineHeights.relaxed * typography.sizes.sm,
  },
  content: {
    flex: 1,
  },
  mainControl: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.gray.light,
  },
  frequencyDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  frequencyValue: {
    fontSize: 64,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  frequencyUnit: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.semibold,
    color: colors.gray.dark,
    marginLeft: spacing.sm,
  },
  frequencyNote: {
    fontSize: typography.sizes.xl,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  playButton: {
    marginTop: spacing.md,
  },
  playButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonActive: {
    backgroundColor: colors.status.error,
  },
  playButtonText: {
    fontSize: 40,
    color: colors.white,
  },
  section: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  slider: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  sliderLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray.dark,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray.medium,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.sizes.base,
    textAlign: 'center',
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  presetButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: colors.primary,
  },
  presetButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  presetButtonTextActive: {
    color: colors.white,
  },
  presetButtonDesc: {
    fontSize: typography.sizes.xs,
    color: colors.gray.dark,
    marginTop: spacing.xs / 2,
  },
  waveformButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  waveformButton: {
    flex: 1,
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  waveformButtonActive: {
    backgroundColor: colors.primary,
  },
  waveformEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  waveformText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  waveformTextActive: {
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
  volumeValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  settingLabel: {
    fontSize: typography.sizes.base,
    color: colors.text,
  },
  settingInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray.medium,
    borderRadius: 8,
    padding: spacing.sm,
    width: 120,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  presetCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  presetCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  presetCardLeft: {
    flex: 1,
  },
  presetCardName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  presetCardInfo: {
    fontSize: typography.sizes.sm,
    color: colors.gray.dark,
    marginTop: spacing.xs / 2,
  },
  deletePresetButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletePresetText: {
    fontSize: 32,
    color: colors.status.error,
    lineHeight: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.gray.dark,
  },
  emptySubtext: {
    fontSize: typography.sizes.sm,
    color: colors.gray.dark,
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.status.warning + '20',
    marginHorizontal: spacing.md,
    marginVertical: spacing.lg,
    borderRadius: 8,
  },
  footerText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    width: width * 0.85,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.gray.light,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.sizes.base,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.gray.light,
  },
  modalButtonSave: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  modalButtonTextSave: {
    color: colors.white,
  },
});
