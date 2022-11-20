<script setup lang="ts">
import { decks, shuffle, InitialDecks, isDroppable } from "./assets/utils";
import Card from "./components/Card.vue";
import type { DeckType, OutType } from "./assets/utils";
import "./index.css";
import "./assets/base.css";
import { onMounted, onUpdated, ref, watch } from "vue";

const Decks = ref<DeckType[]>(shuffle(decks()));
const initialDecks = ref<OutType>({});
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
const foundation = ref<DeckType[]>(["", "", "", ""]);
const leftDeck = ref<DeckType[]>([]);
const rightDeck = ref<DeckType[]>([]);

const change = (_: Event, card: DeckType, left = true) => {
  if (left && leftDeck.value.length !== 0) {
    const filteredLeftDeck = leftDeck.value.filter((c) => c !== card);
    leftDeck.value = filteredLeftDeck;
    rightDeck.value = [...rightDeck.value, { ...card, isDown: false }];
    return;
  } else if (!left && leftDeck.value.length !== 0) return;
  else {
    leftDeck.value = [...rightDeck.value]
      .reverse()
      .map((c) => ({ ...c, isDown: true }));
    rightDeck.value = [];
  }
};

const onDrag = (evt: DragEvent, card: DeckType, from: string) => {
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = "move";
    evt.dataTransfer.effectAllowed = "move";
    evt.dataTransfer.setData("card", JSON.stringify({ card, from }));
  }
};

const onDrop = (evt: DragEvent, cardIndex: number, to = "foundation") => {
  if (evt.dataTransfer) {
    const { card, from } = JSON.parse(evt.dataTransfer.getData("card"));

    if (from === "fromInitialDeck" && to === "foundation") {
      const { id } = JSON.parse(evt.dataTransfer.getData("card"));
      const droppedTarget = foundation.value[cardIndex] ?? "";
      if (isDroppable(true, card, droppedTarget)) {
        foundation.value[cardIndex] = card;

        initialDecks.value[id] = initialDecks.value[id].filter((c) => {
          if (
            c.color == card.color &&
            c.rank == card.rank &&
            c.symbol == card.symbol
          )
            return false;
          return true;
        });
      }
    } else if (from === "fromLeftDeck" && to === "foundation") {
      if (isDroppable(true, card, foundation.value[cardIndex])) {
        foundation.value[cardIndex] = card;
        rightDeck.value = rightDeck.value.filter((c) => {
          if (
            c.color == card.color &&
            c.rank == card.rank &&
            c.symbol == card.symbol
          )
            return false;
          return true;
        });
      }
    }
  } else return;
};

const dragged = (
  cardDragged: DeckType,
  droppedDeck: DeckType[],
  draggedDeckId = 0,
  droppedDeckId = 0,
  from: boolean | string = false
) => {
  if (from === "leftDeck") {
    if (
      isDroppable(
        false,
        cardDragged,
        initialDecks.value[droppedDeckId][
          initialDecks.value[droppedDeckId].length - 1
        ]
      )
    ) {
      rightDeck.value = rightDeck.value.filter((c) => {
        if (c.rank === cardDragged.rank && c.suit === cardDragged.suit)
          return false;
        return true;
      });

      initialDecks.value[droppedDeckId] = [
        ...initialDecks.value[droppedDeckId],
        cardDragged,
      ];
    }
  } else if (from === "fromInitialDeck" && droppedDeck.length) {
    if (isDroppable(true, cardDragged, foundation.value[droppedDeckId])) {
      initialDecks.value[draggedDeckId] = initialDecks.value[
        draggedDeckId
      ].filter((card) => {
        if (
          card.color == cardDragged.color &&
          card.rank == cardDragged.rank &&
          card.symbol == cardDragged.symbol
        )
          return false;
        return true;
      });

      // Adding the Card to the Dropped Deck
      foundation.value[droppedDeckId] = cardDragged;
    }
  } else if (!from && droppedDeck.length) {
    if (
      isDroppable(
        false,
        cardDragged,
        initialDecks.value[droppedDeckId][
          initialDecks.value[droppedDeckId].length - 1
        ]
      )
    ) {
      initialDecks.value[draggedDeckId] = initialDecks.value[
        draggedDeckId
      ].filter((card) => {
        if (
          card.color == cardDragged.color &&
          card.rank == cardDragged.rank &&
          card.symbol == cardDragged.symbol
        )
          return false;
        return true;
      });

      // Adding the Card to the Dropped Deck
      initialDecks.value[droppedDeckId] = [
        ...initialDecks.value[droppedDeckId],
        cardDragged,
      ];
    }
  } else {
    // If the dragged card is dropped in the same Deck, don't do anything
    if (droppedDeckId === draggedDeckId) return;

    // If the Deck is Empty
    if (!droppedDeck.length) {
      if (isDroppable(true, cardDragged, null)) {
        initialDecks.value[draggedDeckId] = initialDecks.value[
          draggedDeckId
        ].filter((card) => {
          if (
            card.color == cardDragged.color &&
            card.rank == cardDragged.rank &&
            card.symbol == cardDragged.symbol
          )
            return false;
          return true;
        });

        // Adding the Card to the Dropped Deck
        initialDecks.value[droppedDeckId] = [cardDragged];
      }
    } else {
      if (
        isDroppable(
          false,
          cardDragged,
          initialDecks.value[droppedDeckId][
            initialDecks.value[droppedDeckId].length
          ]
        )
      ) {
        // Deleting the dragged card from the deck #TODO
        const updatedDeck = initialDecks.value[draggedDeckId].filter((card) => {
          if (
            card.color == cardDragged.color &&
            card.rank == cardDragged.rank &&
            card.symbol == cardDragged.symbol
          )
            return false;
          return true;
        });

        initialDecks.value[draggedDeckId] = updatedDeck;

        // Adding the Card to the Dropped Deck
        initialDecks.value[droppedDeckId] = [...droppedDeck, cardDragged];
      }
    }
  }
};

watch(foundation.value, (newValue) => {
  const ranks = newValue.map((el) => el.rank);

  if (ranks.every((rank) => rank === "K")) {
    alert("Congrats, You win");
  }
});

onMounted(() => {
  leftDeck.value = [...Decks.value].slice(28);
  // When the Component is already mounted, Show every first card in the decks
  initialDecks.value = InitialDecks(Decks.value);
  for (let i in initialDecks.value) {
    initialDecks.value[i][initialDecks.value[i].length - 1].isDown = false;
  }
});

onUpdated(() => {
  // When there is an update, make sure to update the cards status
  for (let i in initialDecks.value) {
    if (initialDecks.value[i].length)
      initialDecks.value[i][initialDecks.value[i].length - 1].isDown = false;
  }
});
</script>

<template>
  <div class="flex flex-col h-screen justify-center gap-y-20">
    <div class="flex w-screen gap-x-6 justify-around">
      <div class="flex gap-x-4 justify-between">
        <div
          v-if="leftDeck"
          @dragover.prevent
          @dragenter.prevent
          class="card relative"
        >
          <div
            v-for="(card, index) in leftDeck"
            :key="index"
            @click="change($event, card)"
            class="flip-card rounded-sm overflow-hidden absolute inset-x-0 bottom-0"
            draggable="false"
          >
            <div class="flip-card-inner">
              <div
                v-if="!card.isDown"
                class="flip-card-front card"
                :class="[card.suit]"
              >
                {{ card.rank }} {{ card.symbol }}
              </div>
              <div v-else class="flip-card-back"></div>
            </div>
          </div>
        </div>
        <div v-if="rightDeck" class="card relative">
          <div
            v-for="(card, index) in rightDeck"
            @dragstart="onDrag($event, card, 'fromLeftDeck')"
            @click="change($event, card, false)"
            :key="index"
            class="flip-card rounded-sm overflow-hidden absolute inset-x-0 bottom-0"
            draggable="true"
          >
            <div class="flip-card-inner">
              <div class="flip-card-front card" :class="[card.suit]">
                {{ card.rank }} {{ card.symbol }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex gap-x-4 justify-between">
        <div
          @dragover.prevent
          @dragenter.prevent
          v-for="(card, index) in foundation"
          :key="index"
          class="card"
          @drop="onDrop($event, index, 'foundation')"
        >
          <div
            class="flip-card rounded-sm overflow-hidden absolute inset-x-0 bottom-0"
            draggable="false"
          >
            <div class="flip-card-inner">
              <div class="flip-card-front card" :class="[card.suit]">
                {{ card.rank }} {{ card.symbol }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="grid grid-rows-7 grid-flow-col mx-auto gap-x-4 w-max">
      <Card
        v-for="(deck, index) in initialDecks"
        :key="index"
        :decks="deck"
        :id="index"
        @dragged="dragged"
      />
    </div>
  </div>
</template>

<style scoped>
.card::before {
  content: "+";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgba(2, 2, 2, 0.5);
  font-size: 60px;
  text-align: center;
}
</style>
