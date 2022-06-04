<script>
import { decks, shuffle, InitialDecks, processRank } from "./assets/utils";
import Card from "./components/Card.vue";
import "./index.css";
import "./assets/base.css";

export default {
  components: { Card },
  data() {
    return {
      decks: shuffle(decks()),
      initialDecks: {},
      leftDeck: [],
      rightDeck: [],
      foundation: ["", "", "", ""],
    };
  },
  methods: {
    dragged(cardDragged, droppedDeck, draggedDeckId, droppedDeckId) {
      // If the dragged card is dropped in the same Deck, don't do anything
      if (droppedDeckId === draggedDeckId) return;

      // If the Deck is Empty
      if (!droppedDeck.length) {
        this.initialDecks[draggedDeckId] = this.initialDecks[
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
        this.initialDecks[droppedDeckId] = [cardDragged];
      }

      if (
        processRank(this.initialDecks[droppedDeckId].at(-1).rank) -
          processRank(cardDragged.rank) ==
          1 &&
        this.initialDecks[droppedDeckId].at(-1).color !== cardDragged.color
      ) {
        // Deleting the dragged card from the deck #TODO
        this.initialDecks[draggedDeckId] = this.initialDecks[
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
        this.initialDecks[droppedDeckId] = [...droppedDeck, cardDragged];
      }
    },
  },

  mounted() {
    this.leftDeck = [...this.decks].slice(28);

    // When the Component is already mounted, Show every first card in the decks
    this.initialDecks = InitialDecks(this.decks);
    for (let i in this.initialDecks) {
      this.initialDecks[i].at(-1).isDown = false;
    }
  },
  updated() {
    // When there is an update, make sure to update the cards status
    for (let i in this.initialDecks) {
      if (this.initialDecks[i].length)
        this.initialDecks[i].at(-1).isDown = false;
    }
  },
};
</script>
<template>
  <div class="flex flex-col space-y-14">
    <div class="flex mt-4 w-screen mx-auto justify-around">
      <div class="flex w-1/6 justify-between">
        <div
          v-if="leftDeck"
          @dragover.prevent
          @dragenter.prevent
          class="card relative"
        >
          <div
            v-for="(card, index) in leftDeck"
            :key="index"
            @dragstart="startDrag($event, card)"
            class="flip-card rounded-sm overflow-hidden absolute inset-x-0 bottom-0"
            :draggable="!card.isDown ? true : false"
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
        <div @dragover.prevent @dragenter.prevent class="card"></div>
      </div>
      <div class="flex w-1/3 justify-between">
        <div
          @dragover.prevent
          @dragenter.prevent
          v-for="(_, index) in [1, 2, 3, 4]"
          :key="index"
          class="card"
        ></div>
      </div>
    </div>
    <div class="w-75 min-h-75 grid grid-rows-7 grid-flow-col mx-40">
      <Card
        v-for="(deck, index) in initialDecks"
        :key="index"
        :decks="deck"
        :id="index"
        :dragged="dragged"
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
