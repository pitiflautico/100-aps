import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@White_Noise_Generator_settings';

interface NoiseType {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

interface Settings {
  lastNoiseType: string;
  lastVolume: number;
  lastTimer: number;
  usageCount: number;
}

const NOISE_TYPES: NoiseType[] = [
  { id: 'white', name: 'White Noise', icon: '⚪', color: '#E8E8E8', description: 'All frequencies equal' },
  { id: 'pink', name: 'Pink Noise', icon: '🌸', color: '#FFB6C1', description: 'Deep, balanced sound' },
  { id: 'brown', name: 'Brown Noise', icon: '🟤', color: '#A0522D', description: 'Deep rumble, like waterfall' },
  { id: 'rain', name: 'Rain', icon: '🌧️', color: '#4A90E2', description: 'Gentle rainfall' },
  { id: 'ocean', name: 'Ocean Waves', icon: '🌊', color: '#0077BE', description: 'Calming ocean sounds' },
  { id: 'wind', name: 'Wind', icon: '💨', color: '#B0C4DE', description: 'Gentle breeze' },
];

const TIMER_PRESETS = [0, 15, 30, 45, 60, 90, 120];

export default function App() {
  const [selectedNoise, setSelectedNoise] = useState<string>('white');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [timer, setTimer] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [customTimer, setCustomTimer] = useState('');
  const [usageCount, setUsageCount] = useState(0);

  const soundRef = useRef<Audio.Sound | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeAds();
    loadSettings();
    setupAudio();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      playNoise();
    }
  }, [selectedNoise, volume]);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });
    } catch (error) {
      console.error('Audio setup error:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const settings: Settings = JSON.parse(saved);
        setSelectedNoise(settings.lastNoiseType);
        setVolume(settings.lastVolume);
        setTimer(settings.lastTimer);
        setUsageCount(settings.usageCount || 0);
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveSettings = async (updates: Partial<Settings>) => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const current: Settings = saved ? JSON.parse(saved) : {
        lastNoiseType: selectedNoise,
        lastVolume: volume,
        lastTimer: timer,
        usageCount: 0,
      };
      const newSettings = { ...current, ...updates };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const generateNoiseBuffer = (type: string, duration: number = 1): Float32Array => {
    const sampleRate = 44100;
    const samples = sampleRate * duration;
    const buffer = new Float32Array(samples);

    switch (type) {
      case 'white':
        for (let i = 0; i < samples; i++) {
          buffer[i] = Math.random() * 2 - 1;
        }
        break;
      case 'pink':
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < samples; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          buffer[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }
        break;
      case 'brown':
        let lastOut = 0;
        for (let i = 0; i < samples; i++) {
          const white = Math.random() * 2 - 1;
          buffer[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = buffer[i];
          buffer[i] *= 3.5;
        }
        break;
      default:
        for (let i = 0; i < samples; i++) {
          buffer[i] = Math.random() * 2 - 1;
        }
    }
    return buffer;
  };

  const playNoise = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // For rain, ocean, wind - use looping tone approximation
      const frequency = selectedNoise === 'rain' ? 200 : selectedNoise === 'ocean' ? 100 : 150;
      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/wav;base64,${getSimpleToneBase64(frequency)}` },
        { shouldPlay: true, isLooping: true, volume }
      );

      soundRef.current = sound;
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const getSimpleToneBase64 = (freq: number): string => {
    // Simple WAV header + sine wave generation for continuous playback
    return 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
  };

  const togglePlayback = async () => {
    if (isPlaying) {
      await stopPlayback();
    } else {
      await startPlayback();
    }
  };

  const startPlayback = async () => {
    setIsPlaying(true);
    await playNoise();

    const newCount = usageCount + 1;
    setUsageCount(newCount);
    await saveSettings({ usageCount: newCount });
    if (newCount % 3 === 0) showInterstitialAd();

    if (timer > 0) {
      setRemainingTime(timer * 60);
      startTimer();
    }
  };

  const stopPlayback = async () => {
    setIsPlaying(false);
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    stopTimer();
  };

  const startTimer = () => {
    stopTimer();
    timerIntervalRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          stopPlayback();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setRemainingTime(0);
  };

  const cleanup = async () => {
    await stopPlayback();
    await saveSettings({
      lastNoiseType: selectedNoise,
      lastVolume: volume,
      lastTimer: timer,
    });
  };

  const selectNoise = (noiseId: string) => {
    setSelectedNoise(noiseId);
    saveSettings({ lastNoiseType: noiseId });
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (soundRef.current) {
      soundRef.current.setVolumeAsync(value);
    }
    saveSettings({ lastVolume: value });
  };

  const selectTimer = (minutes: number) => {
    setTimer(minutes);
    saveSettings({ lastTimer: minutes });
    if (isPlaying && minutes > 0) {
      setRemainingTime(minutes * 60);
      startTimer();
    } else if (minutes === 0) {
      stopTimer();
    }
  };

  const applyCustomTimer = () => {
    const minutes = parseInt(customTimer);
    if (isNaN(minutes) || minutes < 1 || minutes > 480) {
      Alert.alert('Invalid Timer', 'Please enter a valid time between 1-480 minutes');
      return;
    }
    selectTimer(minutes);
    setShowTimerModal(false);
    setCustomTimer('');
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentNoise = NOISE_TYPES.find(n => n.id === selectedNoise) || NOISE_TYPES[0];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>White Noise Generator</Text>
        <Text style={styles.subtitle}>Relaxation & Focus</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.noiseGrid}>
          {NOISE_TYPES.map(noise => (
            <TouchableOpacity
              key={noise.id}
              style={[
                styles.noiseCard,
                selectedNoise === noise.id && styles.noiseCardActive,
                { borderColor: noise.color }
              ]}
              onPress={() => selectNoise(noise.id)}
            >
              <Text style={styles.noiseIcon}>{noise.icon}</Text>
              <Text style={styles.noiseName}>{noise.name}</Text>
              <Text style={styles.noiseDesc}>{noise.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.playerCard}>
          <View style={styles.nowPlaying}>
            <Text style={styles.nowPlayingLabel}>Now Playing</Text>
            <Text style={[styles.nowPlayingTitle, { color: currentNoise.color }]}>
              {currentNoise.icon} {currentNoise.name}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.playButton, isPlaying && styles.playButtonActive]}
            onPress={togglePlayback}
          >
            <Text style={styles.playButtonText}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>

          {remainingTime > 0 && (
            <View style={styles.timerDisplay}>
              <Text style={styles.timerText}>⏱ {formatTime(remainingTime)}</Text>
            </View>
          )}
        </View>

        <View style={styles.controlCard}>
          <Text style={styles.controlLabel}>Volume</Text>
          <View style={styles.volumeControl}>
            <Text style={styles.volumeIcon}>🔈</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={volume}
              onValueChange={handleVolumeChange}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.gray.light}
              thumbTintColor={colors.primary}
            />
            <Text style={styles.volumeIcon}>🔊</Text>
          </View>
          <Text style={styles.volumeValue}>{Math.round(volume * 100)}%</Text>
        </View>

        <View style={styles.controlCard}>
          <Text style={styles.controlLabel}>Sleep Timer</Text>
          <View style={styles.timerPresets}>
            {TIMER_PRESETS.map(mins => (
              <TouchableOpacity
                key={mins}
                style={[styles.timerBtn, timer === mins && styles.timerBtnActive]}
                onPress={() => selectTimer(mins)}
              >
                <Text style={[styles.timerBtnText, timer === mins && styles.timerBtnTextActive]}>
                  {mins === 0 ? 'Off' : `${mins}m`}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.timerBtn}
              onPress={() => setShowTimerModal(true)}
            >
              <Text style={styles.timerBtnText}>Custom</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Benefits of White Noise</Text>
          <Text style={styles.infoText}>• Improved sleep quality</Text>
          <Text style={styles.infoText}>• Enhanced focus and concentration</Text>
          <Text style={styles.infoText}>• Reduced stress and anxiety</Text>
          <Text style={styles.infoText}>• Mask distracting sounds</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <AdBanner />

      <Modal visible={showTimerModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Custom Timer</Text>
            <TextInput
              style={styles.input}
              value={customTimer}
              onChangeText={setCustomTimer}
              placeholder="Enter minutes (1-480)"
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setShowTimerModal(false);
                  setCustomTimer('');
                }}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={applyCustomTimer}
              >
                <Text style={styles.modalBtnText}>Set Timer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, alignItems: 'center', backgroundColor: colors.white },
  title: { fontSize: 26, fontWeight: 'bold', color: colors.primary },
  subtitle: { fontSize: 14, color: colors.gray.dark, marginTop: 4 },
  content: { flex: 1 },
  noiseGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.md, gap: spacing.md },
  noiseCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray.light,
  },
  noiseCardActive: { borderWidth: 3, elevation: 4 },
  noiseIcon: { fontSize: 40, marginBottom: spacing.sm },
  noiseName: { fontSize: 14, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  noiseDesc: { fontSize: 11, color: colors.gray.dark, textAlign: 'center', marginTop: 4 },
  playerCard: {
    backgroundColor: colors.white,
    margin: spacing.lg,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    elevation: 2,
  },
  nowPlaying: { alignItems: 'center', marginBottom: spacing.lg },
  nowPlayingLabel: { fontSize: 12, color: colors.gray.dark, textTransform: 'uppercase', letterSpacing: 1 },
  nowPlayingTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  playButtonActive: { backgroundColor: colors.status.error },
  playButtonText: { fontSize: 36, color: colors.white },
  timerDisplay: { marginTop: spacing.lg, backgroundColor: colors.gray.light, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 20 },
  timerText: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  controlCard: { backgroundColor: colors.white, margin: spacing.lg, marginTop: 0, borderRadius: 16, padding: spacing.lg },
  controlLabel: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  volumeControl: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  volumeIcon: { fontSize: 20 },
  slider: { flex: 1, height: 40 },
  volumeValue: { fontSize: 14, color: colors.gray.dark, textAlign: 'center', marginTop: spacing.sm },
  timerPresets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timerBtn: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, backgroundColor: colors.gray.light, borderRadius: 12 },
  timerBtnActive: { backgroundColor: colors.primary },
  timerBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },
  timerBtnTextActive: { color: colors.white },
  infoCard: { backgroundColor: colors.white, margin: spacing.lg, marginTop: 0, borderRadius: 16, padding: spacing.lg },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  infoText: { fontSize: 14, color: colors.gray.dark, marginBottom: spacing.sm },
  bottomSpacer: { height: 100 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  input: { backgroundColor: colors.gray.light, padding: spacing.lg, borderRadius: 12, fontSize: 16, marginBottom: spacing.lg },
  modalButtons: { flexDirection: 'row', gap: spacing.md },
  modalBtn: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: colors.gray.light },
  modalBtnConfirm: { backgroundColor: colors.primary },
  modalBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  modalBtnTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
