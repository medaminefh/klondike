export const suits = ["heart", "diamond", "spades", "clubs"] as const;
export const ranks = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
] as const;

export type Suit = typeof suits[number];
export type Rank = typeof ranks[number];
export type CardColor = "red" | "black";
export type DrawMode = 1 | 3;

export type DeckType = {
  id: string;
  suit: Suit;
  rank: Rank;
  symbol: string;
  value: number;
  faceUp: boolean;
  color: CardColor;
};

export type Foundations = Record<Suit, DeckType[]>;

export type GameState = {
  tableau: DeckType[][];
  stock: DeckType[];
  waste: DeckType[];
  foundations: Foundations;
};

export type TableauMove = {
  from: "tableau";
  pileIndex: number;
  cardIndex: number;
};

export type WasteMove = {
  from: "waste";
};

export type FoundationMove = {
  from: "foundation";
  suit: Suit;
};

export type MoveSource = TableauMove | WasteMove | FoundationMove;

const symbols: Record<Suit, string> = {
  heart: "\u2665",
  diamond: "\u2666",
  spades: "\u2660",
  clubs: "\u2663",
};

const colors: Record<Suit, CardColor> = {
  heart: "red",
  diamond: "red",
  spades: "black",
  clubs: "black",
};

const rankValues: Record<Rank, number> = {
  A: 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
};

export const createDeck = (): DeckType[] => {
  const cards: DeckType[] = [];

  for (const rank of ranks) {
    for (const suit of suits) {
      cards.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        symbol: symbols[suit],
        value: rankValues[rank],
        faceUp: false,
        color: colors[suit],
      });
    }
  }

  return cards;
};

export const shuffle = (cards: DeckType[]): DeckType[] => {
  const shuffled = cards.map((card) => ({ ...card }));

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index];
    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = current;
  }

  return shuffled;
};

export const createEmptyFoundations = (): Foundations => ({
  heart: [],
  diamond: [],
  spades: [],
  clubs: [],
});

export const deal = (cards: DeckType[]): GameState => {
  const deck = cards.map((card) => ({ ...card, faceUp: false }));
  const tableau: DeckType[][] = [];
  let cursor = 0;

  for (let pileIndex = 0; pileIndex < 7; pileIndex += 1) {
    const pile = deck.slice(cursor, cursor + pileIndex + 1);
    cursor += pileIndex + 1;

    if (pile.length) {
      pile[pile.length - 1] = { ...pile[pile.length - 1], faceUp: true };
    }

    tableau.push(pile);
  }

  return {
    tableau,
    stock: deck.slice(cursor),
    waste: [],
    foundations: createEmptyFoundations(),
  };
};

export const createNewGameState = (): GameState => deal(shuffle(createDeck()));

export const cloneState = (state: GameState): GameState => ({
  tableau: state.tableau.map((pile) => pile.map((card) => ({ ...card }))),
  stock: state.stock.map((card) => ({ ...card })),
  waste: state.waste.map((card) => ({ ...card })),
  foundations: suits.reduce((foundations, suit) => {
    foundations[suit] = state.foundations[suit].map((card) => ({ ...card }));
    return foundations;
  }, createEmptyFoundations()),
});

export const getTopCard = (pile: DeckType[]): DeckType | undefined =>
  pile[pile.length - 1];

export const revealTopCard = (pile: DeckType[]) => {
  const topCard = getTopCard(pile);

  if (topCard && !topCard.faceUp) {
    topCard.faceUp = true;
  }
};

export const isValidTableauSequence = (cards: DeckType[]): boolean => {
  if (!cards.length || cards.some((card) => !card.faceUp)) return false;

  return cards.every((card, index) => {
    if (index === 0) return true;

    const previousCard = cards[index - 1];
    return (
      previousCard.value - card.value === 1 && previousCard.color !== card.color
    );
  });
};

export const canMoveToTableau = (
  movingCard: DeckType,
  targetPile: DeckType[]
): boolean => {
  if (!movingCard.faceUp) return false;

  const targetCard = getTopCard(targetPile);
  if (!targetCard) return movingCard.value === 13;
  if (!targetCard.faceUp) return false;

  return (
    targetCard.value - movingCard.value === 1 &&
    targetCard.color !== movingCard.color
  );
};

export const canMoveSequenceToTableau = (
  movingCards: DeckType[],
  targetPile: DeckType[]
): boolean =>
  isValidTableauSequence(movingCards) &&
  canMoveToTableau(movingCards[0], targetPile);

export const canMoveToFoundation = (
  movingCard: DeckType,
  targetSuit: Suit,
  targetPile: DeckType[]
): boolean => {
  if (!movingCard.faceUp || movingCard.suit !== targetSuit) return false;

  const targetCard = getTopCard(targetPile);
  if (!targetCard) return movingCard.value === 1;

  return (
    targetCard.suit === movingCard.suit &&
    movingCard.value - targetCard.value === 1
  );
};

export const isGameWon = (state: GameState): boolean =>
  suits.every((suit) => state.foundations[suit].length === 13);

export const getMoveSourceCard = (
  state: GameState,
  source: MoveSource
): DeckType | undefined => {
  if (source.from === "waste") return getTopCard(state.waste);
  if (source.from === "foundation")
    return getTopCard(state.foundations[source.suit]);

  return state.tableau[source.pileIndex]?.[source.cardIndex];
};

export const describeCard = (card: DeckType): string =>
  `${card.rank}${card.symbol}`;
