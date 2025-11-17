export interface Card {
  id: string;
  question: string;
  answer: string;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  color: string;
  cardCount: number;
}
