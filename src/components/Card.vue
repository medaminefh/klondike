<script setup lang="ts">
import { computed } from "vue";
import type { DeckType } from "@/assets/utils";

const props = withDefaults(
  defineProps<{
    card?: DeckType | null;
    label?: string;
    selected?: boolean;
    compact?: boolean;
  }>(),
  {
    card: null,
    label: "",
    selected: false,
    compact: false,
  }
);

const ariaLabel = computed(() =>
  props.card
    ? props.card.faceUp
      ? `${props.card.rank} of ${props.card.suit}`
      : "Face-down card"
    : props.label || "Empty pile"
);
</script>

<template>
  <div
    class="playing-card"
    :class="[
      card ? `is-${card.suit}` : 'is-empty',
      card && !card.faceUp ? 'is-back' : '',
      selected ? 'is-selected' : '',
      compact ? 'is-compact' : '',
    ]"
    :aria-label="ariaLabel"
  >
    <template v-if="card && card.faceUp">
      <span class="card-corner">
        <strong>{{ card.rank }}</strong>
        <span>{{ card.symbol }}</span>
      </span>
      <span class="card-symbol">{{ card.symbol }}</span>
      <span class="card-corner card-corner-bottom">
        <strong>{{ card.rank }}</strong>
        <span>{{ card.symbol }}</span>
      </span>
    </template>
    <span v-else-if="!card" class="empty-label">{{ label }}</span>
  </div>
</template>
