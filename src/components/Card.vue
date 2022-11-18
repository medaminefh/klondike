<template>
  <div
    class="m-5 card-container"
    @dragover.prevent
    @dragenter.prevent
    @drop="onDrop($event)"
  >
    <div
      v-if="!decks.length"
      class="flip-card rounded-sm overflow-hidden"
    ></div>
    <div
      v-else
      v-for="(card, index) in decks"
      :key="index"
      @click="toggle($event, card)"
      @dragstart="startDrag($event, card)"
      class="flip-card rounded-sm overflow-hidden"
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
</template>

<script setup lang="ts">
import type { DeckType } from "@/assets/utils";

interface Props {
  decks: DeckType[];
  id: string;
  dragged: any;
}

const props = withDefaults(defineProps<Props>(), {
  decks: undefined,
  id: undefined,
  dragged: undefined,
});

const startDrag = (evt: DragEvent, card: DeckType) => {
  if (evt && evt.dataTransfer) {
    evt.dataTransfer.dropEffect = "move";
    evt.dataTransfer.effectAllowed = "move";
    evt.dataTransfer.setData(
      "card",
      JSON.stringify({ card, id: props.id, from: "fromInitialDeck" })
    );
  }
};

const onDrop = (evt: DragEvent) => {
  if (evt && evt.dataTransfer) {
    const { card, id } = JSON.parse(evt.dataTransfer.getData("card"));
    if (!id) {
      return props.dragged(card, "", "", props.id, "leftDeck");
    }
    props.dragged(card, props.decks, id, props.id);
  }
};

// change the isDown property of the card
const toggle = (_: Event, card: DeckType) => {
  if (props.decks.at(-1) === card) return;
  return (card.isDown = !card.isDown);
};
</script>

<style scoped>
.card-container {
  max-width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
