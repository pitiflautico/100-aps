import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Deck, Flashcard, StudySession } from '../types';
import { sampleDecks, sampleFlashcards } from '../data/sampleDecks';

const DECKS_KEY = '@flashcards_decks';
const CARDS_KEY = '@flashcards_cards';

export const useFlashcards = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedDecks, savedCards] = await Promise.all([
        AsyncStorage.getItem(DECKS_KEY),
        AsyncStorage.getItem(CARDS_KEY),
      ]);

      if (savedDecks && savedCards) {
        setDecks(JSON.parse(savedDecks));
        setCards(JSON.parse(savedCards));
      } else {
        setDecks(sampleDecks);
        setCards(sampleFlashcards);
        await saveData(sampleDecks, sampleFlashcards);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setDecks(sampleDecks);
      setCards(sampleFlashcards);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newDecks: Deck[], newCards: Flashcard[]) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(DECKS_KEY, JSON.stringify(newDecks)),
        AsyncStorage.setItem(CARDS_KEY, JSON.stringify(newCards)),
      ]);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const addDeck = async (name: string, description: string) => {
    const newDeck: Deck = {
      id: `deck-${Date.now()}`,
      name,
      description,
      created: Date.now(),
      cardCount: 0,
      color: '#4A6CF7',
    };
    const newDecks = [...decks, newDeck];
    setDecks(newDecks);
    await saveData(newDecks, cards);
  };

  const addCard = async (deckId: string, front: string, back: string) => {
    const newCard: Flashcard = {
      id: `card-${Date.now()}`,
      front,
      back,
      deckId,
      created: Date.now(),
      reviewCount: 0,
      correctCount: 0,
    };
    const newCards = [...cards, newCard];
    const newDecks = decks.map(d =>
      d.id === deckId ? { ...d, cardCount: d.cardCount + 1 } : d
    );
    setCards(newCards);
    setDecks(newDecks);
    await saveData(newDecks, newCards);
  };

  const getCardsForDeck = (deckId: string) => {
    return cards.filter(c => c.deckId === deckId);
  };

  return {
    decks,
    cards,
    loading,
    addDeck,
    addCard,
    getCardsForDeck,
  };
};
