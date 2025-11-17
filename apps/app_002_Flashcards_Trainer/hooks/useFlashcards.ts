import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, Deck } from '../types';

const STORAGE_KEY = '@flashcards_progress';

// Pre-loaded deck data
const DECKS: Deck[] = [
  {
    id: 'spanish-basics',
    name: 'Spanish Basics',
    description: 'Common Spanish words and phrases',
    color: '#F7C948',
    cardCount: 10,
  },
  {
    id: 'capitals',
    name: 'World Capitals',
    description: 'Capital cities around the world',
    color: '#4A6CF7',
    cardCount: 10,
  },
  {
    id: 'science',
    name: 'Science Facts',
    description: 'Interesting science concepts',
    color: '#36CFC9',
    cardCount: 8,
  },
];

const CARDS: Record<string, Card[]> = {
  'spanish-basics': [
    { id: '1', question: 'Hello', answer: 'Hola' },
    { id: '2', question: 'Goodbye', answer: 'Adiós' },
    { id: '3', question: 'Please', answer: 'Por favor' },
    { id: '4', question: 'Thank you', answer: 'Gracias' },
    { id: '5', question: 'Yes', answer: 'Sí' },
    { id: '6', question: 'No', answer: 'No' },
    { id: '7', question: 'Water', answer: 'Agua' },
    { id: '8', question: 'Food', answer: 'Comida' },
    { id: '9', question: 'Friend', answer: 'Amigo' },
    { id: '10', question: 'House', answer: 'Casa' },
  ],
  'capitals': [
    { id: '1', question: 'France', answer: 'Paris' },
    { id: '2', question: 'Spain', answer: 'Madrid' },
    { id: '3', question: 'Italy', answer: 'Rome' },
    { id: '4', question: 'Germany', answer: 'Berlin' },
    { id: '5', question: 'Japan', answer: 'Tokyo' },
    { id: '6', question: 'China', answer: 'Beijing' },
    { id: '7', question: 'Brazil', answer: 'Brasília' },
    { id: '8', question: 'Canada', answer: 'Ottawa' },
    { id: '9', question: 'Australia', answer: 'Canberra' },
    { id: '10', question: 'Egypt', answer: 'Cairo' },
  ],
  'science': [
    { id: '1', question: 'What is H2O?', answer: 'Water' },
    { id: '2', question: 'Speed of light in vacuum?', answer: '299,792,458 m/s' },
    { id: '3', question: 'Closest planet to the Sun?', answer: 'Mercury' },
    { id: '4', question: 'Largest planet in our solar system?', answer: 'Jupiter' },
    { id: '5', question: 'Chemical symbol for gold?', answer: 'Au' },
    { id: '6', question: 'Powerhouse of the cell?', answer: 'Mitochondria' },
    { id: '7', question: 'How many bones in human body?', answer: '206' },
    { id: '8', question: 'Force that pulls objects to Earth?', answer: 'Gravity' },
  ],
};

interface Progress {
  [deckId: string]: {
    totalSessions: number;
    totalCorrect: number;
    totalIncorrect: number;
    lastStudied: string;
  };
}

export const useFlashcards = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Progress>({});

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProgress(JSON.parse(stored));
      }
      setDecks(DECKS);
      setLoading(false);
    } catch (error) {
      console.error('Error loading progress:', error);
      setDecks(DECKS);
      setLoading(false);
    }
  };

  const saveSessionProgress = async (deckId: string, correct: number, incorrect: number) => {
    try {
      const newProgress = {
        ...progress,
        [deckId]: {
          totalSessions: (progress[deckId]?.totalSessions || 0) + 1,
          totalCorrect: (progress[deckId]?.totalCorrect || 0) + correct,
          totalIncorrect: (progress[deckId]?.totalIncorrect || 0) + incorrect,
          lastStudied: new Date().toISOString(),
        },
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
      setProgress(newProgress);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const getCardsForDeck = (deckId: string): Card[] => {
    return CARDS[deckId] || [];
  };

  const getDeckProgress = (deckId: string) => {
    return progress[deckId];
  };

  return {
    decks,
    getCardsForDeck,
    getDeckProgress,
    saveSessionProgress,
    loading,
  };
};
