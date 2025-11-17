/**
 * useMetronome Hook
 * Handles all metronome logic including timing, audio, and state
 */

import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

export type TimeSignature = '2/4' | '3/4' | '4/4' | '5/4' | '6/8';

interface UseMetronomeReturn {
  bpm: number;
  isPlaying: boolean;
  currentBeat: number;
  timeSignature: TimeSignature;
  setBpm: (bpm: number) => void;
  setTimeSignature: (ts: TimeSignature) => void;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  increaseBpm: () => void;
  decreaseBpm: () => void;
}

const MIN_BPM = 40;
const MAX_BPM = 240;
const BPM_STEP = 1;

/**
 * Get beats per measure from time signature
 */
const getBeatsPerMeasure = (ts: TimeSignature): number => {
  const beatsMap: Record<TimeSignature, number> = {
    '2/4': 2,
    '3/4': 3,
    '4/4': 4,
    '5/4': 5,
    '6/8': 6,
  };
  return beatsMap[ts];
};

export const useMetronome = (): UseMetronomeReturn => {
  const [bpm, setBpmState] = useState<number>(120);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [timeSignature, setTimeSignature] = useState<TimeSignature>('4/4');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const accentSoundRef = useRef<Audio.Sound | null>(null);

  /**
   * Initialize audio sounds
   */
  useEffect(() => {
    let isMounted = true;

    const initializeAudio = async () => {
      try {
        // Set audio mode
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        // Load click sound files
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/click.wav')
        );
        const { sound: accentSound } = await Audio.Sound.createAsync(
          require('../assets/sounds/accent.wav')
        );

        if (isMounted) {
          soundRef.current = sound;
          accentSoundRef.current = accentSound;
        }
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };

    initializeAudio();

    return () => {
      isMounted = false;
      // Clean up sounds
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (accentSoundRef.current) {
        accentSoundRef.current.unloadAsync();
      }
    };
  }, []);

  /**
   * Play click sound
   */
  const playClick = async (isAccent: boolean = false) => {
    try {
      const sound = isAccent ? accentSoundRef.current : soundRef.current;
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.error('Error playing click:', error);
    }
  };

  /**
   * Start metronome
   */
  const start = () => {
    if (isPlaying) return;

    setIsPlaying(true);
    setCurrentBeat(0);

    const interval = 60000 / bpm; // milliseconds per beat
    const beatsPerMeasure = getBeatsPerMeasure(timeSignature);

    let beat = 0;

    // Play first beat immediately
    playClick(true);
    setCurrentBeat(1);
    beat = 1;

    intervalRef.current = setInterval(() => {
      // Play click
      const isAccent = beat === 0;
      playClick(isAccent);

      // Update beat
      beat = (beat + 1) % beatsPerMeasure;
      setCurrentBeat(beat === 0 ? beatsPerMeasure : beat);
    }, interval);
  };

  /**
   * Stop metronome
   */
  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
    setCurrentBeat(0);
  };

  /**
   * Toggle play/pause
   */
  const toggle = () => {
    if (isPlaying) {
      stop();
    } else {
      start();
    }
  };

  /**
   * Set BPM with validation
   */
  const setBpm = (newBpm: number) => {
    const validBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, newBpm));
    setBpmState(validBpm);

    // If playing, restart with new BPM
    if (isPlaying) {
      stop();
      setTimeout(() => start(), 50);
    }
  };

  /**
   * Increase BPM
   */
  const increaseBpm = () => {
    setBpm(bpm + BPM_STEP);
  };

  /**
   * Decrease BPM
   */
  const decreaseBpm = () => {
    setBpm(bpm - BPM_STEP);
  };

  /**
   * Clean up on unmount
   */
  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  return {
    bpm,
    isPlaying,
    currentBeat,
    timeSignature,
    setBpm,
    setTimeSignature,
    start,
    stop,
    toggle,
    increaseBpm,
    decreaseBpm,
  };
};
