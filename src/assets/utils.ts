import { suits, symbols, ranks } from "./gameInfo.json";

// Types
type DeckType = {
  suit: string;
  rank: string;
  symbol: string;
  isDown: boolean;
  color: string;
};

interface OutType {
  [key: number]: DeckType[];
}

// creating the 52 cards
export const decks = () => {
  const arr: Array<DeckType> = [];
  ranks.map((rank) => {
    suits.map((suit) => {
      arr.push({
        suit,
        rank,
        symbol: symbols[suit as keyof typeof symbols],
        isDown: true,
        color: suit == "spades" || suit == "clubs" ? "red" : "black",
      });
    });
  });
  return arr;
};

// shuffle the 52 cards
export const shuffle = (array: DeckType[]) => {
  return array.slice().sort(() => Math.random() - 0.5);
};

// creating decks containing cards from 1 to 7
export const InitialDecks = (d: DeckType[]) => {
  let i = 0;
  const output: OutType = {};
  while (i < 7) {
    switch (i) {
      case 0:
        output[i] = d.slice(0, 1);
        break;
      case 1:
        output[i] = d.slice(1, 3);
        break;
      case 2:
        output[i] = d.slice(3, 6);
        break;
      case 3:
        output[i] = d.slice(6, 10);
        break;
      case 4:
        output[i] = d.slice(10, 15);
        break;
      case 5:
        output[i] = d.slice(15, 21);
        break;
      case 6:
        output[i] = d.slice(21, 28);
        break;
      default:
        return;
    }

    i++;
  }
  return output;
};

export const processRank = (rank: string) => {
  if (rank == "K" || rank == "Q" || rank == "J" || rank == "A") {
    switch (rank) {
      case "K":
        return 13;
      case "Q":
        return 12;
      case "J":
        return 11;
      case "A":
        return 1;
    }
  } else {
    return parseInt(rank);
  }
};

export const isDroppable = (
  sameSuit = false,
  cardDragged: DeckType,
  dropTarget: DeckType | null = null
) => {
  if (!sameSuit && dropTarget) {
    if (
      processRank(dropTarget.rank) - processRank(cardDragged.rank) === 1 &&
      cardDragged.color !== dropTarget.color
    ) {
      return true;
    }
    return false;
  } else if (sameSuit && !dropTarget) {
    return processRank(cardDragged.rank) === 1;
  } else if (sameSuit && dropTarget) {
    return (
      processRank(cardDragged.rank) - processRank(dropTarget.rank) === 1 &&
      cardDragged.suit === dropTarget.suit
    );
  } else {
    if (
      processRank(dropTarget?.rank) - processRank(cardDragged.rank) === 1 &&
      cardDragged.color !== dropTarget?.color &&
      cardDragged.suit !== dropTarget?.suit
    ) {
      return true;
    }
    return false;
  }
};
