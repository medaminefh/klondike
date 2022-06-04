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

<script>
export default {
  name: "DecksComponent",
  props: {
    decks: Array,
    id: String,
    dragged: {
      type: Function,
    },
  },
  methods: {
    startDrag(evt, card) {
      evt.dataTransfer.dropEffect = "move";
      evt.dataTransfer.effectAllowed = "move";
      evt.dataTransfer.setData("card", JSON.stringify({ card, id: this.id }));
    },
    onDrop(evt) {
      const { card, id } = JSON.parse(evt.dataTransfer.getData("card"));
      this.dragged(card, this.decks, id, this.id);
    },
    // change the isDown property of the card
    toggle(e, card) {
      if (this.decks.at(-1) === card) return;
      return (card.isDown = !card.isDown);
    },
  },
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
