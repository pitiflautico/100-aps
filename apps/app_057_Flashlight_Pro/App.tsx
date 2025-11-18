import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds } from './services/adsManager';

const STORAGE_KEY = '@Flashlight_Settings';

type ColorType = 'white' | 'red' | 'blue' | 'green';

export default function App() {
  const [isOn, setIsOn] = useState(false);
  const [brightness, setBrightness] = useState(3);
  const [color, setColor] = useState<ColorType>('white');
  const [strobeMode, setStrobeMode] = useState(false);
  const [strobeFrequency, setStrobeFrequency] = useState(2);
  const [sosMode, setSosMode] = useState(false);
  const [blinkAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    initializeAds();
    loadSettings();
  }, []);

  useEffect(() => {
    if (strobeMode && isOn) {
      startStrobe();
    } else if (sosMode && isOn) {
      startSOS();
    } else {
      blinkAnim.setValue(1);
    }
  }, [strobeMode, sosMode, strobeFrequency, isOn]);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const settings = JSON.parse(saved);
        setBrightness(settings.brightness || 3);
        setColor(settings.color || 'white');
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveSettings = async (newBrightness: number, newColor: ColorType) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ brightness: newBrightness, color: newColor }));
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const toggleLight = () => {
    const newState = !isOn;
    setIsOn(newState);
    if (!newState) {
      setStrobeMode(false);
      setSosMode(false);
    }
  };

  const changeBrightness = (level: number) => {
    setBrightness(level);
    saveSettings(level, color);
  };

  const changeColor = (newColor: ColorType) => {
    setColor(newColor);
    saveSettings(brightness, newColor);
  };

  const toggleStrobe = () => {
    if (sosMode) setSosMode(false);
    setStrobeMode(!strobeMode);
  };

  const toggleSOS = () => {
    if (strobeMode) setStrobeMode(false);
    setSosMode(!sosMode);
  };

  const startStrobe = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.2, duration: 50, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.delay(1000 / strobeFrequency),
      ])
    ).start();
  };

  const startSOS = () => {
    const dot = 200;
    const dash = 600;
    const gap = 200;
    const letterGap = 600;

    const dotBlink = Animated.sequence([
      Animated.timing(blinkAnim, { toValue: 0.2, duration: dot, useNativeDriver: true }),
      Animated.timing(blinkAnim, { toValue: 1, duration: gap, useNativeDriver: true }),
    ]);

    const dashBlink = Animated.sequence([
      Animated.timing(blinkAnim, { toValue: 0.2, duration: dash, useNativeDriver: true }),
      Animated.timing(blinkAnim, { toValue: 1, duration: gap, useNativeDriver: true }),
    ]);

    Animated.loop(
      Animated.sequence([
        dotBlink, dotBlink, dotBlink,
        Animated.delay(letterGap),
        dashBlink, dashBlink, dashBlink,
        Animated.delay(letterGap),
        dotBlink, dotBlink, dotBlink,
        Animated.delay(letterGap * 2),
      ])
    ).start();
  };

  const getColorValue = (): string => {
    const colors = { white: '#FFFFFF', red: '#FF0000', blue: '#0066FF', green: '#00FF00' };
    return colors[color];
  };

  const getBrightnessOpacity = (): number => {
    return brightness / 3;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isOn ? "light" : "dark"} />

      <View style={styles.header}>
        <Text style={[styles.title, isOn && styles.titleLight]}>Flashlight Pro</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isOn && (
          <Animated.View
            style={[
              styles.lightScreen,
              {
                backgroundColor: getColorValue(),
                opacity: blinkAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, getBrightnessOpacity()],
                }),
              },
            ]}
          />
        )}

        <TouchableOpacity
          style={[styles.powerButton, isOn && styles.powerButtonOn]}
          onPress={toggleLight}
        >
          <Text style={styles.powerIcon}>{isOn ? '🔦' : '🔦'}</Text>
          <Text style={[styles.powerText, isOn && styles.powerTextOn]}>
            {isOn ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>

        {isOn && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, styles.titleLight]}>Brightness</Text>
              <View style={styles.brightnessRow}>
                {[1, 2, 3].map(level => (
                  <TouchableOpacity
                    key={level}
                    style={[styles.brightnessBtn, brightness === level && styles.brightnessBtnActive]}
                    onPress={() => changeBrightness(level)}
                  >
                    <Text style={[styles.brightnessText, brightness === level && styles.brightnessTextActive]}>
                      {level === 1 ? 'Low' : level === 2 ? 'Medium' : 'High'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, styles.titleLight]}>Color</Text>
              <View style={styles.colorRow}>
                {(['white', 'red', 'blue', 'green'] as ColorType[]).map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorBtn,
                      { backgroundColor: { white: '#FFF', red: '#F00', blue: '#00F', green: '#0F0' }[c] },
                      color === c && styles.colorBtnActive,
                    ]}
                    onPress={() => changeColor(c)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, styles.titleLight]}>Modes</Text>
              
              <TouchableOpacity
                style={[styles.modeBtn, strobeMode && styles.modeBtnActive]}
                onPress={toggleStrobe}
              >
                <Text style={[styles.modeText, strobeMode && styles.modeTextActive]}>
                  ⚡ Strobe Mode {strobeMode ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>

              {strobeMode && (
                <View style={styles.frequencyControl}>
                  <Text style={styles.titleLight}>Frequency: {strobeFrequency} Hz</Text>
                  <View style={styles.frequencyRow}>
                    {[1, 2, 3, 5, 10].map(freq => (
                      <TouchableOpacity
                        key={freq}
                        style={[
                          styles.freqBtn,
                          strobeFrequency === freq && styles.freqBtnActive,
                        ]}
                        onPress={() => setStrobeFrequency(freq)}
                      >
                        <Text style={[
                          styles.freqText,
                          strobeFrequency === freq && styles.freqTextActive,
                        ]}>
                          {freq}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.modeBtn, sosMode && styles.modeBtnActive]}
                onPress={toggleSOS}
              >
                <Text style={[styles.modeText, sosMode && styles.modeTextActive]}>
                  🆘 SOS Mode {sosMode ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray.dark },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.white },
  titleLight: { color: colors.white },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  lightScreen: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  powerButton: { width: 150, height: 150, borderRadius: 75, backgroundColor: colors.gray.dark, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xl, elevation: 8 },
  powerButtonOn: { backgroundColor: colors.primary },
  powerIcon: { fontSize: 48, marginBottom: spacing.sm },
  powerText: { fontSize: 24, fontWeight: 'bold', color: colors.white },
  powerTextOn: { color: colors.white },
  section: { width: '100%', marginTop: spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  brightnessRow: { flexDirection: 'row', gap: spacing.md },
  brightnessBtn: { flex: 1, padding: spacing.md, backgroundColor: colors.gray.dark, borderRadius: 8, alignItems: 'center' },
  brightnessBtnActive: { backgroundColor: colors.secondary },
  brightnessText: { fontSize: 14, fontWeight: '600', color: colors.white },
  brightnessTextActive: { color: colors.black },
  colorRow: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center' },
  colorBtn: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: 'transparent' },
  colorBtnActive: { borderColor: colors.secondary, borderWidth: 4 },
  modeBtn: { padding: spacing.lg, backgroundColor: colors.gray.dark, borderRadius: 12, alignItems: 'center', marginBottom: spacing.md },
  modeBtnActive: { backgroundColor: colors.primary },
  modeText: { fontSize: 16, fontWeight: 'bold', color: colors.white },
  modeTextActive: { color: colors.white },
  frequencyControl: { padding: spacing.md, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, marginBottom: spacing.md },
  frequencyRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  freqBtn: { flex: 1, padding: spacing.sm, backgroundColor: colors.gray.dark, borderRadius: 6, alignItems: 'center' },
  freqBtnActive: { backgroundColor: colors.secondary },
  freqText: { fontSize: 14, fontWeight: '600', color: colors.white },
  freqTextActive: { color: colors.black },
});
