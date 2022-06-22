<script>
import { decks, shuffle, InitialDecks, isDroppable } from "./assets/utils";
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
		change(e, card, left = true) {
			if (left && this.leftDeck.length !== 0) {
				this.leftDeck = this.leftDeck.filter((c) => c !== card);
				this.rightDeck.push({ ...card, isDown: false });
				return;
			} else if (!left && this.leftDeck.length !== 0) return;
			else {
				this.leftDeck = this.rightDeck.map((c) => ({ ...c, isDown: true }));
				this.rightDeck = [];
			}
		},
		onDrag(evt, card, from) {
			evt.dataTransfer.dropEffect = "move";
			evt.dataTransfer.effectAllowed = "move";
			evt.dataTransfer.setData("card", JSON.stringify({ card, from }));
		},
		onDrop(evt, cardIndex, to = "foundation") {
			const { card, from } = JSON.parse(evt.dataTransfer.getData("card"));

			if (from === "fromInitialDeck" && to === "foundation") {
				const { id } = JSON.parse(evt.dataTransfer.getData("card"));
				const droppedTarget = this.foundation[cardIndex] ?? "";
				if (isDroppable(true, card, droppedTarget)) {
					this.foundation[cardIndex] = card;

					this.initialDecks[id] = this.initialDecks[id].filter((c) => {
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
				if (isDroppable(true, card, this.foundation[cardIndex])) {
					this.foundation[cardIndex] = card;
					this.rightDeck = this.rightDeck.filter((c) => {
						if (
							c.color == card.color &&
							c.rank == card.rank &&
							c.symbol == card.symbol
						)
							return false;
						return true;
					});
				}
			} else if (from === "fromLeftDeck" && to === "initialDeck") {
				const { id } = JSON.parse(evt.dataTransfer.getData("card"));
				if (isDroppable(false, card, this.initialDecks[id])) {
					this.rightDeck = this.rightDeck.filter((c) => {
						if (
							c.color == card.color &&
							c.rank == card.rank &&
							c.symbol == card.symbol
						)
							return false;
						return true;
					});
					this.initialDecks[id] = [...this.initialDecks[id], card];
				}
			} else {
				return;
			}
		},
		dragged(
			cardDragged,
			droppedDeck = "",
			draggedDeckId = "",
			droppedDeckId = "",
			from = false
		) {
			if (from === "leftDeck") {
				if (
					isDroppable(
						false,
						cardDragged,
						this.initialDecks[droppedDeckId].at(-1)
					)
				) {
					this.rightDeck = this.rightDeck.filter((c) => {
						if (c.rank === cardDragged.rank && c.suit === cardDragged.suit)
							return false;
						return true;
					});

					this.initialDecks[droppedDeckId] = [
						...this.initialDecks[droppedDeckId],
						cardDragged,
					];
				}
			} else if (from === "fromInitialDeck" && droppedDeck.length) {
				if (isDroppable(true, cardDragged, this.foundation[droppedDeckId])) {
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
					this.foundation[droppedDeckId] = cardDragged;
				}
			} else if ((!from, droppedDeck.length)) {
				if (
					isDroppable(
						false,
						cardDragged,
						this.initialDecks[droppedDeckId].at(-1)
					)
				) {
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
					this.initialDecks[droppedDeckId] = [
						...this.initialDecks[droppedDeckId],
						cardDragged,
					];
				}
			} else {
				// If the dragged card is dropped in the same Deck, don't do anything
				if (droppedDeckId === draggedDeckId) return;

				// If the Deck is Empty
				if (!droppedDeck.length) {
					if (isDroppable(true, cardDragged, "")) {
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
				} else {
					if (
						isDroppable(
							false,
							cardDragged,
							this.initialDecks[droppedDeckId].at(-1)
						)
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
				}
			}
		},
	},

	watch: {
		foundation(array) {
			const ranks = array.map((el) => el.rank);
			if (ranks == ["K", "K", "K", "K"]) {
				alert("Congrats, You win");
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
						@dragstart="onDrag($event, card, 'fromLeftDeck')"
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
			<div class="flex w-1/3 justify-between">
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
		<div class="w-75 min-h-75 grid grid-rows-7 grid-flow-col mx-40">
			<Card
				v-for="(deck, index) in initialDecks"
				:key="index"
				:decks="deck"
				:id="index"
				:drop="onDrop"
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
