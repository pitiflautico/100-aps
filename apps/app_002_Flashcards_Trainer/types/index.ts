/**
 * Type definitions for Flashcards Trainer
 */

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  deckId: string;
  created: number;
  lastReviewed?: number;
  reviewCount: number;
  correctCount: number;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  created: number;
  cardCount: number;
  color: string;
}

export interface StudySession {
  deckId: string;
  cards: Flashcard[];
  currentIndex: number;
  correctAnswers: number;
  incorrectAnswers: number;
  startTime: number;
}
