import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Slider } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

interface Sound { id: string; name: string; icon: string; volume: number; isPlaying: boolean; }
interface Favorite { id: string; name: string; sounds: {id: string, volume: number}[]; }

const SOUNDS: Sound[] = [
  { id: '1', name: 'Rain', icon: '🌧️', volume: 0.5, isPlaying: false },
  { id: '2', name: 'Ocean', icon: '🌊', volume: 0.5, isPlaying: false },
  { id: '3', name: 'White Noise', icon: '📻', volume: 0.5, isPlaying: false },
  { id: '4', name: 'Pink Noise', icon: '🔉', volume: 0.5, isPlaying: false },
  { id: '5', name: 'Forest', icon: '🌲', volume: 0.5, isPlaying: false },
  { id: '6', name: 'Fire', icon: '🔥', volume: 0.5, isPlaying: false },
  { id: '7', name: 'Fan', icon: '💨', volume: 0.5, isPlaying: false },
];

export default function App() {
  const [sounds, setSounds] = useState<Sound[]>(SOUNDS);
  const [sleepTimer, setSleepTimer] = useState<number|null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoriteName, setFavoriteName] = useState('');
  const [activeTab, setActiveTab] = useState<'sounds'|'favorites'>('sounds');

  useEffect(() => { loadFavorites(); }, []);
  useEffect(() => {
    if (sleepTimer !== null && sleepTimer > 0) {
      const interval = setInterval(() => setSleepTimer(t => t! - 1), 1000);
      return () => clearInterval(interval);
    } else if (sleepTimer === 0) {
      stopAllSounds();
      setSleepTimer(null);
    }
  }, [sleepTimer]);

  const loadFavorites = async () => {
    const stored = await AsyncStorage.getItem('sound_favorites');
    if (stored) setFavorites(JSON.parse(stored));
  };

  const toggleSound = (id: string) => {
    setSounds(sounds.map(s => s.id === id ? {...s, isPlaying: !s.isPlaying} : s));
  };

  const setVolume = (id: string, volume: number) => {
    setSounds(sounds.map(s => s.id === id ? {...s, volume} : s));
  };

  const stopAllSounds = () => {
    setSounds(sounds.map(s => ({...s, isPlaying: false})));
  };

  const saveFavorite = async () => {
    if (!favoriteName) return;
    const playing = sounds.filter(s => s.isPlaying).map(s => ({id: s.id, volume: s.volume}));
    if (playing.length === 0) return;
    const fav: Favorite = { id: Date.now().toString(), name: favoriteName, sounds: playing };
    const updated = [...favorites, fav];
    setFavorites(updated);
    await AsyncStorage.setItem('sound_favorites', JSON.stringify(updated));
    setFavoriteName('');
  };

  const loadFavorite = (fav: Favorite) => {
    setSounds(sounds.map(s => {
      const favSound = fav.sounds.find(fs => fs.id === s.id);
      return favSound ? {...s, isPlaying: true, volume: favSound.volume} : {...s, isPlaying: false};
    }));
    setActiveTab('sounds');
  };

  const deleteFavorite = async (id: string) => {
    const updated = favorites.filter(f => f.id !== id);
    setFavorites(updated);
    await AsyncStorage.setItem('sound_favorites', JSON.stringify(updated));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Sleep Sounds</Text>
        {sleepTimer !== null && (
          <Text style={styles.timerText}>Timer: {Math.floor(sleepTimer / 60)}:{(sleepTimer % 60).toString().padStart(2, '0')}</Text>
        )}
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'sounds' && styles.tabActive]} onPress={() => setActiveTab('sounds')}>
          <Text style={[styles.tabText, activeTab === 'sounds' && styles.tabTextActive]}>Sounds</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'favorites' && styles.tabActive]} onPress={() => setActiveTab('favorites')}>
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>Favorites</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'sounds' && (
          <>
            {sounds.map(sound => (
              <View key={sound.id} style={[styles.soundCard, sound.isPlaying && styles.soundCardActive]}>
                <TouchableOpacity style={styles.soundButton} onPress={() => toggleSound(sound.id)}>
                  <Text style={styles.soundIcon}>{sound.icon}</Text>
                  <Text style={styles.soundName}>{sound.name}</Text>
                </TouchableOpacity>
                {sound.isPlaying && (
                  <View style={styles.volumeControl}>
                    <Text style={styles.volumeLabel}>Volume</Text>
                    <Slider style={styles.slider} minimumValue={0} maximumValue={1} value={sound.volume} onValueChange={(value) => setVolume(sound.id, value)} minimumTrackTintColor="#6366F1" maximumTrackTintColor="#334155" />
                  </View>
                )}
              </View>
            ))}
            <View style={styles.timerSection}>
              <Text style={styles.sectionTitle}>Sleep Timer</Text>
              <View style={styles.timerButtons}>
                <TouchableOpacity style={styles.timerButton} onPress={() => setSleepTimer(15 * 60)}>
                  <Text style={styles.timerButtonText}>15 min</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.timerButton} onPress={() => setSleepTimer(30 * 60)}>
                  <Text style={styles.timerButtonText}>30 min</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.timerButton} onPress={() => setSleepTimer(60 * 60)}>
                  <Text style={styles.timerButtonText}>60 min</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.timerButton} onPress={() => setSleepTimer(null)}>
                  <Text style={styles.timerButtonText}>Off</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={saveFavorite}>
              <Text style={styles.saveButtonText}>Save as Favorite</Text>
            </TouchableOpacity>
          </>
        )}
        {activeTab === 'favorites' && (
          <>
            {favorites.map(fav => (
              <View key={fav.id} style={styles.favoriteCard}>
                <Text style={styles.favoriteName}>{fav.name}</Text>
                <Text style={styles.favoriteCount}>{fav.sounds.length} sounds</Text>
                <View style={styles.favoriteButtons}>
                  <TouchableOpacity style={styles.loadButton} onPress={() => loadFavorite(fav)}>
                    <Text style={styles.loadButtonText}>Load</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteFavorite(fav.id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
      <View style={styles.adContainer}>
        <BannerAd unitId={TestIds.BANNER} size={BannerAdSize.BANNER} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  timerText: { fontSize: 16, color: '#6366F1', marginTop: 5 },
  tabs: { flexDirection: 'row', backgroundColor: '#1E293B', paddingHorizontal: 5, paddingVertical: 5 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#6366F1', borderRadius: 8 },
  tabText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#FFFFFF' },
  scrollContent: { padding: 20, paddingBottom: 80 },
  soundCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12 },
  soundCardActive: { borderWidth: 2, borderColor: '#6366F1' },
  soundButton: { flexDirection: 'row', alignItems: 'center' },
  soundIcon: { fontSize: 32, marginRight: 15 },
  soundName: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  volumeControl: { marginTop: 15 },
  volumeLabel: { fontSize: 14, color: '#94A3B8', marginBottom: 5 },
  slider: { width: '100%', height: 40 },
  timerSection: { marginTop: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 15 },
  timerButtons: { flexDirection: 'row', gap: 10 },
  timerButton: { flex: 1, backgroundColor: '#334155', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  timerButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  saveButton: { backgroundColor: '#6366F1', borderRadius: 12, padding: 16, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  favoriteCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12 },
  favoriteName: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 6 },
  favoriteCount: { fontSize: 14, color: '#6366F1', marginBottom: 12 },
  favoriteButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  loadButton: { backgroundColor: '#6366F1', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 30 },
  loadButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  deleteText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
  adContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', backgroundColor: '#0F172A', paddingVertical: 5 },
});
