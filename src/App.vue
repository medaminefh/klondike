<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import Card from "./components/Card.vue";
import {
	canMoveSequenceToTableau,
	canMoveToFoundation,
	canMoveToTableau,
	cloneState,
	createNewGameState,
	describeCard,
	getMoveSourceCard,
	getTopCard,
	isGameWon,
	isValidTableauSequence,
	revealTopCard,
	suits,
} from "./assets/utils";
import type {
	DeckType,
	DrawMode,
	GameState,
	MoveSource,
	Suit,
} from "./assets/utils";
import "./index.css";
import "./assets/base.css";

const game = ref<GameState>(createNewGameState());
const history = ref<GameState[]>([]);
const moves = ref(0);
const drawMode = ref<DrawMode>(1);
const elapsedSeconds = ref(0);
const selected = ref<MoveSource | null>(null);
const notice = ref("");
let timerId: number | undefined;

const wasteTop = computed(() => getTopCard(game.value.waste));
const stockTop = computed(() => getTopCard(game.value.stock));
const won = computed(() => isGameWon(game.value));
const twoDigits = (value: number): string =>
	value < 10 ? `0${value}` : `${value}`;
const formattedTime = computed(() => {
	const minutes = Math.floor(elapsedSeconds.value / 60);
	const seconds = elapsedSeconds.value % 60;
	return `${twoDigits(minutes)}:${twoDigits(seconds)}`;
});
const statusText = computed(() => {
	if (won.value) return `Won in ${moves.value} moves`;
	return notice.value || "Ready";
});

const startTimer = () => {
	stopTimer();
	timerId = window.setInterval(() => {
		elapsedSeconds.value += 1;
	}, 1000);
};

const stopTimer = () => {
	if (timerId !== undefined) {
		window.clearInterval(timerId);
		timerId = undefined;
	}
};

const newGame = () => {
	game.value = createNewGameState();
	history.value = [];
	moves.value = 0;
	elapsedSeconds.value = 0;
	selected.value = null;
	notice.value = "";
	startTimer();
};

const setDrawMode = (mode: DrawMode) => {
	if (drawMode.value === mode) return;
	drawMode.value = mode;
	newGame();
};

const commit = (nextGame: GameState, message = "") => {
	history.value = [...history.value, cloneState(game.value)].slice(-100);
	game.value = nextGame;
	moves.value += 1;
	selected.value = null;
	notice.value = message;

	if (isGameWon(nextGame)) {
		notice.value = `Won in ${moves.value} moves`;
		stopTimer();
	}
};

const undo = () => {
	const previousGame = history.value[history.value.length - 1];
	if (!previousGame) return;

	history.value = history.value.slice(0, -1);
	game.value = cloneState(previousGame);
	moves.value = Math.max(0, moves.value - 1);
	selected.value = null;
	notice.value = "Move undone";

	if (!won.value) startTimer();
};

const drawFromStock = () => {
	if (won.value) return;

	const nextGame = cloneState(game.value);

	if (nextGame.stock.length) {
		const drawnCards = nextGame.stock
			.splice(
				Math.max(0, nextGame.stock.length - drawMode.value),
				drawMode.value,
			)
			.map((card) => ({ ...card, faceUp: true }));

		nextGame.waste.push(...drawnCards);
		commit(nextGame, `Drew ${drawnCards.length}`);
		return;
	}

	if (nextGame.waste.length) {
		nextGame.stock = nextGame.waste
			.slice()
			.reverse()
			.map((card) => ({ ...card, faceUp: false }));
		nextGame.waste = [];
		commit(nextGame, "Waste recycled");
	}
};

const isSameSource = (
	first: MoveSource | null,
	second: MoveSource,
): boolean => {
	if (!first || first.from !== second.from) return false;
	if (first.from === "waste") return true;
	if (first.from === "foundation" && second.from === "foundation") {
		return first.suit === second.suit;
	}
	if (first.from === "tableau" && second.from === "tableau") {
		return (
			first.pileIndex === second.pileIndex &&
			first.cardIndex === second.cardIndex
		);
	}
	return false;
};

const canSelectSource = (source: MoveSource): boolean => {
	const card = getMoveSourceCard(game.value, source);
	if (!card?.faceUp) return false;

	if (source.from !== "tableau") return true;

	const movingCards = game.value.tableau[source.pileIndex].slice(
		source.cardIndex,
	);
	return isValidTableauSequence(movingCards);
};

const selectSource = (source: MoveSource) => {
	if (!canSelectSource(source)) return;

	if (isSameSource(selected.value, source)) {
		selected.value = null;
		notice.value = "";
		return;
	}

	selected.value = source;
	const card = getMoveSourceCard(game.value, source);
	notice.value = card ? `Selected ${describeCard(card)}` : "";
};

const moveSourceToTableau = (
	source: MoveSource,
	targetPileIndex: number,
	message = "Moved to tableau",
): boolean => {
	const nextGame = cloneState(game.value);
	const targetPile = nextGame.tableau[targetPileIndex];
	if (!targetPile) return false;

	let movingCards: DeckType[] = [];

	if (source.from === "tableau") {
		if (source.pileIndex === targetPileIndex) return false;

		const sourcePile = nextGame.tableau[source.pileIndex];
		movingCards = sourcePile.slice(source.cardIndex);
		if (!canMoveSequenceToTableau(movingCards, targetPile)) return false;

		sourcePile.splice(source.cardIndex);
		revealTopCard(sourcePile);
	}

	if (source.from === "waste") {
		const card = getTopCard(nextGame.waste);
		if (!card || !canMoveToTableau(card, targetPile)) return false;

		movingCards = [card];
		nextGame.waste.pop();
	}

	if (source.from === "foundation") {
		const card = getTopCard(nextGame.foundations[source.suit]);
		if (!card || !canMoveToTableau(card, targetPile)) return false;

		movingCards = [card];
		nextGame.foundations[source.suit].pop();
	}

	targetPile.push(...movingCards);
	commit(nextGame, message);
	return true;
};

const moveSourceToFoundation = (
	source: MoveSource,
	targetSuit: Suit,
	message = "Moved to foundation",
): boolean => {
	const nextGame = cloneState(game.value);
	const targetPile = nextGame.foundations[targetSuit];
	let card: DeckType | undefined;

	if (source.from === "tableau") {
		const sourcePile = nextGame.tableau[source.pileIndex];
		if (source.cardIndex !== sourcePile.length - 1) return false;

		card = getTopCard(sourcePile);
		if (!card || !canMoveToFoundation(card, targetSuit, targetPile))
			return false;

		sourcePile.pop();
		revealTopCard(sourcePile);
	}

	if (source.from === "waste") {
		card = getTopCard(nextGame.waste);
		if (!card || !canMoveToFoundation(card, targetSuit, targetPile))
			return false;

		nextGame.waste.pop();
	}

	if (source.from === "foundation") {
		return false;
	}

	if (!card) return false;

	targetPile.push(card);
	commit(nextGame, message);
	return true;
};

const tryMoveSelectedToTableau = (pileIndex: number) => {
	if (!selected.value) return false;
	const moved = moveSourceToTableau(selected.value, pileIndex);
	if (!moved) notice.value = "No legal move";
	return moved;
};

const tryMoveSelectedToFoundation = (targetSuit: Suit) => {
	if (!selected.value) return false;
	const moved = moveSourceToFoundation(selected.value, targetSuit);
	if (!moved) notice.value = "No legal move";
	return moved;
};

const onTableauCardClick = (pileIndex: number, cardIndex: number) => {
	if (selected.value && moveSourceToTableau(selected.value, pileIndex)) return;
	selectSource({ from: "tableau", pileIndex, cardIndex });
};

const onTableauPileClick = (pileIndex: number) => {
	if (!tryMoveSelectedToTableau(pileIndex)) {
		selected.value = null;
	}
};

const onWasteClick = () => {
	selectSource({ from: "waste" });
};

const onFoundationClick = (targetSuit: Suit) => {
	if (selected.value && tryMoveSelectedToFoundation(targetSuit)) return;
	selectSource({ from: "foundation", suit: targetSuit });
};

const canDragTableauCard = (pileIndex: number, cardIndex: number): boolean =>
	isValidTableauSequence(game.value.tableau[pileIndex].slice(cardIndex));

const canDragFoundation = (suit: Suit): boolean =>
	Boolean(getTopCard(game.value.foundations[suit]));

const setDragData = (event: DragEvent, source: MoveSource) => {
	if (!event.dataTransfer || !canSelectSource(source)) return;

	selected.value = source;
	event.dataTransfer.dropEffect = "move";
	event.dataTransfer.effectAllowed = "move";
	event.dataTransfer.setData("application/json", JSON.stringify(source));
};

const getDragData = (event: DragEvent): MoveSource | null => {
	const rawPayload = event.dataTransfer?.getData("application/json");
	if (!rawPayload) return selected.value;

	try {
		return JSON.parse(rawPayload) as MoveSource;
	} catch {
		return null;
	}
};

const onDropTableau = (event: DragEvent, pileIndex: number) => {
	const source = getDragData(event);
	if (!source) return;
	moveSourceToTableau(source, pileIndex);
};

const onDropFoundation = (event: DragEvent, targetSuit: Suit) => {
	const source = getDragData(event);
	if (!source) return;
	moveSourceToFoundation(source, targetSuit);
};

const foundationLabel = (suit: Suit): string => {
	if (suit === "heart") return "A H";
	if (suit === "diamond") return "A D";
	if (suit === "spades") return "A S";
	return "A C";
};

const tableauPileHeight = (pile: DeckType[]): string =>
	`${148 + Math.max(0, pile.length - 1) * 34}px`;

const showHint = () => {
	const state = game.value;
	const wasteCard = getTopCard(state.waste);

	if (wasteCard) {
		for (const suit of suits) {
			if (canMoveToFoundation(wasteCard, suit, state.foundations[suit])) {
				notice.value = `Move ${describeCard(wasteCard)} to foundation`;
				return;
			}
		}

		const tableauIndex = state.tableau.findIndex((pile) =>
			canMoveToTableau(wasteCard, pile),
		);
		if (tableauIndex >= 0) {
			notice.value = `Move ${describeCard(wasteCard)} to column ${
				tableauIndex + 1
			}`;
			return;
		}
	}

	for (let pileIndex = 0; pileIndex < state.tableau.length; pileIndex += 1) {
		const topCard = getTopCard(state.tableau[pileIndex]);
		if (!topCard) continue;

		for (const suit of suits) {
			if (canMoveToFoundation(topCard, suit, state.foundations[suit])) {
				notice.value = `Move ${describeCard(topCard)} to foundation`;
				return;
			}
		}
	}

	for (
		let sourceIndex = 0;
		sourceIndex < state.tableau.length;
		sourceIndex += 1
	) {
		const sourcePile = state.tableau[sourceIndex];

		for (let cardIndex = 0; cardIndex < sourcePile.length; cardIndex += 1) {
			const movingCards = sourcePile.slice(cardIndex);
			if (!isValidTableauSequence(movingCards)) continue;

			const targetIndex = state.tableau.findIndex(
				(targetPile, index) =>
					index !== sourceIndex &&
					canMoveSequenceToTableau(movingCards, targetPile),
			);

			if (targetIndex >= 0) {
				notice.value = `Move ${describeCard(movingCards[0])} to column ${
					targetIndex + 1
				}`;
				return;
			}
		}
	}

	if (state.stock.length) {
		notice.value = "Draw from stock";
		return;
	}

	if (state.waste.length) {
		notice.value = "Recycle waste";
		return;
	}

	notice.value = "No obvious moves";
};

const autoMove = () => {
	const wasteCard = getTopCard(game.value.waste);
	if (
		wasteCard &&
		moveSourceToFoundation({ from: "waste" }, wasteCard.suit, "Auto moved")
	) {
		return;
	}

	for (
		let pileIndex = 0;
		pileIndex < game.value.tableau.length;
		pileIndex += 1
	) {
		const sourcePile = game.value.tableau[pileIndex];
		const cardIndex = sourcePile.length - 1;
		const topCard = sourcePile[cardIndex];

		if (
			topCard &&
			moveSourceToFoundation(
				{ from: "tableau", pileIndex, cardIndex },
				topCard.suit,
				"Auto moved",
			)
		) {
			return;
		}
	}

	notice.value = "No auto move available";
};

onMounted(() => {
	startTimer();
});

onUnmounted(() => {
	stopTimer();
});
</script>

<template>
	<main class="game-shell">
		<header class="game-toolbar">
			<div class="game-title">
				<strong>Klondike</strong>
				<span>{{ formattedTime }}</span>
			</div>

			<div class="game-actions">
				<button type="button" @click="newGame">New</button>
				<button type="button" :disabled="!history.length" @click="undo">
					Undo
				</button>
				<button type="button" @click="showHint">Hint</button>
				<button type="button" @click="autoMove">Auto</button>
				<div class="segmented-control" aria-label="Draw mode">
					<button
						type="button"
						:class="{ active: drawMode === 1 }"
						@click="setDrawMode(1)"
					>
						Draw 1
					</button>
					<button
						type="button"
						:class="{ active: drawMode === 3 }"
						@click="setDrawMode(3)"
					>
						Draw 3
					</button>
				</div>
			</div>

			<div class="game-stats">
				<span>Moves {{ moves }}</span>
				<span>{{ statusText }}</span>
			</div>
		</header>

		<section class="game-board" :class="{ 'is-won': won }">
			<div class="top-row">
				<div class="stock-waste">
					<button
						type="button"
						class="pile-button"
						:aria-label="game.stock.length ? 'Draw card' : 'Recycle waste'"
						@click="drawFromStock"
					>
						<Card
							:card="stockTop || null"
							:label="game.waste.length ? 'Reset' : 'Stock'"
						/>
						<span v-if="game.stock.length" class="pile-count">
							{{ game.stock.length }}
						</span>
					</button>

					<div class="pile-slot" @dragover.prevent @dragenter.prevent>
						<Card
							:card="wasteTop || null"
							label="Waste"
							:selected="isSameSource(selected, { from: 'waste' })"
							:draggable="Boolean(wasteTop)"
							@click="onWasteClick"
							@dragstart="setDragData($event, { from: 'waste' })"
						/>
					</div>
				</div>

				<div class="foundations">
					<div
						v-for="suit in suits"
						:key="suit"
						class="pile-slot foundation-slot"
						@dragover.prevent
						@dragenter.prevent
						@drop="onDropFoundation($event, suit)"
					>
						<Card
							:card="getTopCard(game.foundations[suit]) || null"
							:label="foundationLabel(suit)"
							:selected="isSameSource(selected, { from: 'foundation', suit })"
							:draggable="canDragFoundation(suit)"
							@click="onFoundationClick(suit)"
							@dragstart="setDragData($event, { from: 'foundation', suit })"
						/>
					</div>
				</div>
			</div>

			<div class="tableau">
				<div
					v-for="(pile, pileIndex) in game.tableau"
					:key="pileIndex"
					class="tableau-pile"
					:style="{ minHeight: tableauPileHeight(pile) }"
					@dragover.prevent
					@dragenter.prevent
					@drop="onDropTableau($event, pileIndex)"
				>
					<Card
						v-if="!pile.length"
						label="K"
						class="empty-tableau-card"
						@click="onTableauPileClick(pileIndex)"
					/>
					<Card
						v-for="(card, cardIndex) in pile"
						:key="card.id"
						:card="card"
						class="tableau-card"
						:selected="
							isSameSource(selected, { from: 'tableau', pileIndex, cardIndex })
						"
						:draggable="canDragTableauCard(pileIndex, cardIndex)"
						:style="{
							transform: `translateY(${cardIndex * 34}px)`,
							zIndex: cardIndex + 1,
						}"
						@click.stop="onTableauCardClick(pileIndex, cardIndex)"
						@dragstart="
							setDragData($event, { from: 'tableau', pileIndex, cardIndex })
						"
					/>
				</div>
			</div>
		</section>
	</main>
</template>
