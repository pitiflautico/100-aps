/**
 * Sample flashcard decks for initial use
 */

import { Deck, Flashcard } from '../types';

export const sampleDecks: Deck[] = [
  {
    id: 'deck-1',
    name: 'Spanish Basics',
    description: 'Common Spanish words and phrases',
    created: Date.now(),
    cardCount: 10,
    color: '#4A6CF7',
  },
  {
    id: 'deck-2',
    name: 'Math Formulas',
    description: 'Essential math formulas',
    created: Date.now(),
    cardCount: 8,
    color: '#F7C948',
  },
];

export const sampleFlashcards: Flashcard[] = [
  // Spanish Basics
  { id: 'card-1', front: 'Hello', back: 'Hola', deckId: 'deck-1', created: Date.now(), reviewCount: 0, correctCount: 0 },
  { id: 'card-2', front: 'Goodbye', back: 'Adiós', deckId: 'deck-1', created: Date.now(), reviewCount: 0, correctCount: 0 },
  { id: 'card-3', front: 'Please', back: 'Por favor', deckId: 'deck-1', created: Date.now(), reviewCount: 0, correctCount: 0 },
  { id: 'card-4', front: 'Thank you', back: 'Gracias', deckId: 'deck-1', created: Date.now(), reviewCount: 0, correctCount: 0 },
  { id: 'card-5', front: 'Yes', back: 'Sí', deckId: 'deck-1', created: Date.now(), reviewCount: 0, correctCount: 0 },
  { id: 'card-6', front: 'No', back: 'No', deckId: 'deck-1', created: Date.now(), reviewCount: 0, correctCount: 0 },
  { id: 'card-7', front: 'Water', back: 'Agua', deckId: 'deck-1', created: Date.now(), reviewCount: 0, correctCount: 0 },
  { id: 'card-8', front: 'Food', back: 'Comida', deckId: 'deck-1', created: Date.now(), reviewCount: 0, correctCount: 0 },
  { id: 'card-9', front: 'House', back: 'Casa', deckId: 'deck-1', created: Date.now(), reviewCount: 0, correctCount: 0 },
  { id: 'card-10', front: 'Friend', back: 'Amigo/Amiga', deckId: 'deck-1', created: Date.now(), reviewCount: 0, correctCount: 0 },

  // Math Formulas
  { id: 'card-11', front: 'Area of Circle', back: 'πr²', deckId: 'deck-2', created: Date.now(), reviewCount: 0, correctCount: 0 },
  { id: 'card-12', front: 'Pythagorean Theorem', back: 'a² + b² = c²', deckId: 'deck-2', created: Date.now(), reviewCount: 0, correctCount: 0 },
  { id: 'card-13', front: 'Quadratic Formula', back: 'x = (-b ± √(b²-4ac)) / 2a', deckId: 'deck-2', created: Date.now(), reviewCount: 0, correctCount: 0 },
  { id: 'card-14', front: 'Area of Triangle', back: '½ × base × height', deckId: 'deck-2', created: Date.now(), reviewCount: 0, correctCount: 0 },
  { id: 'card-15', front: 'Volume of Sphere', back: '(4/3)πr³', deckId: 'deck-2', created: Date.now(), reviewCount: 0, correctCount: 0 },
  { id: 'card-16', front: 'Distance Formula', back: 'd = √((x₂-x₁)² + (y₂-y₁)²)', deckId: 'deck-2', created: Date.now(), reviewCount: 0, correctCount: 0 },
  { id: 'card-17', front: 'Slope Formula', back: 'm = (y₂-y₁)/(x₂-x₁)', deckId: 'deck-2', created: Date.now(), reviewCount: 0, correctCount: 0 },
  { id: 'card-18', front: 'Perimeter of Rectangle', back: '2(l + w)', deckId: 'deck-2', created: Date.now(), reviewCount: 0, correctCount: 0 },
];
