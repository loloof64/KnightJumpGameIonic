<template>
  <div ref="rootElt" class="grid">
    <div
      class="grid_row"
      v-for="row in [0, 1, 2, 3, 4, 5, 6, 7]"
      :key="'row_' + row"
    >
      <div
        :class="classForCell(row, col)"
        v-for="col in [0, 1, 2, 3, 4, 5, 6, 7]"
        :key="'cell_' + row + col"
      ></div>
    </div>
    <div class="pieces_layer">
      <img
        id="player_knight"
        :src="playerImage"
        :style="{
          left: playerKnightLeft,
          top: playerKnightTop,
        }"
        width="50"
        height="50"
      />
      <img
        class="opponent_piece"
        v-for="(piece, index) in opponentPieces"
        :key="index"
        :src="opponentImageForValue(piece.value)"
        :style="{
          left: getXForCol(piece.col),
          top: getYForRow(piece.row),
        }"
        width="50"
        height="50"
      />
    </div>
  </div>
</template>

<script>
import { createGesture } from "@ionic/vue";
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useStore } from "vuex";

import { generatePosition } from "@/services/PositionGenerator";

export default {
  props: {
    cellsSize: {
      type: Number,
      required: true,
    }
  },
  setup(props) {

    const cellsSizePx = computed(() => props.cellsSize);
    const boardSizePx = computed(() => props.cellsSize * 8);

    const rootElt = ref();
    const dndData = ref();

    const { t } = useI18n();

    const store = useStore();
    const gameActive = ref(false);

    const playerIsWhite = ref(true);

    const playerKnightPos = ref({
      col: -1000,
      row: -1000,
    });

    const opponentPieces = ref([]);

    function classForCell(row, col) {
      const standardBg =  (row + col) % 2 == 0
        ? { white_cell: true }
        : { black_cell: true };

      const startCellBg = { dnd_start_cell : true};
      const targetCellBg = {dnd_target_cell: true};
      const crossCellBg = {dnd_cross_indicator_cell: true};

      let background = standardBg;

      if (dndIsActive.value) {
        const isStartCell = row === dndData.value.startRow && col === dndData.value.startCol;
        const isTargetCell = row === dndData.value.targetRow && col === dndData.value.targetCol;
        const isDndCrossCell = row === dndData.value.targetRow || col === dndData.value.targetCol;

        if (isStartCell) background = startCellBg;
        if (isDndCrossCell) background = crossCellBg;
        if (isTargetCell) background = targetCellBg;
      }

      return background;
    }

    function isPlayerKnightPos(row, col) {
      return (
        row === playerKnightPos.value.row && col === playerKnightPos.value.col
      );
    }

    function checkGameFailure() {
      const directions = [
        { x: -1, y: -2 },
        { x: -1, y: +2 },
        { x: +1, y: -2 },
        { x: +1, y: +2 },
        { x: -2, y: -1 },
        { x: -2, y: +1 },
        { x: +2, y: -1 },
        { x: +2, y: +1 },
      ];

      let possibilities = directions.map((item) => {
        return {
          x: item.x + playerKnightPos.value.col,
          y: item.y + playerKnightPos.value.row,
        };
      });

      possibilities = possibilities.filter(
        (item) => item.x >= 0 && item.x <= 7 && item.y >= 0 && item.y <= 7
      );
      possibilities = possibilities.filter((item) =>
        opponentPieces.value.find(
          (opponent) => opponent.col === item.x && opponent.row === item.y
        )
      );
      return possibilities.length === 0;
    }

    function handleDragStart(event) {
      if (!gameActive.value) return;
      const { currentX, currentY } = event;
      const rootElementRect = rootElt.value.getBoundingClientRect();
      const rootEltX = rootElementRect.left;
      const rootEltY = rootElementRect.top;
      const evtX = currentX - rootEltX;
      const evtY = currentY - rootEltY;

      const evtCol = parseInt(Math.floor(evtX / cellsSizePx.value));
      const evtRow = parseInt(Math.floor(evtY / cellsSizePx.value));

      const isPlayerKnightCell =
        evtCol === playerKnightPos.value.col &&
        evtRow === playerKnightPos.value.row;

      if (!isPlayerKnightCell) return;
      dndData.value = {
        left: evtCol * cellsSizePx.value,
        top: evtRow * cellsSizePx.value,
        startCol: evtCol,
        startRow: evtRow,
      };
    }

    function handleDrag(event) {
      if (!gameActive.value) return;
      if (!dndData.value) return;

      const { currentX, currentY } = event;
      const rootElementRect = rootElt.value.getBoundingClientRect();
      const rootEltX = rootElementRect.left;
      const rootEltY = rootElementRect.top;
      const evtX = currentX - rootEltX;
      const evtY = currentY - rootEltY;

      const evtCol = parseInt(Math.floor(evtX / cellsSizePx.value));
      const evtRow = parseInt(Math.floor(evtY / cellsSizePx.value));

      dndData.value = {
        ...dndData.value,
        left: evtX,
        top: evtY,
        targetCol: evtCol,
        targetRow: evtRow,
      };
    }

    function handleValidMove(eventCol, eventRow) {
      const pieceOnSquare = opponentPieces.value.find(
        (item) => item.col === eventCol && item.row === eventRow
      );
      if (pieceOnSquare) {
        opponentPieces.value = opponentPieces.value.filter(
          (item) => item !== pieceOnSquare
        );
        playerKnightPos.value = {
          col: eventCol,
          row: eventRow,
        };
        const gameSuccess = opponentPieces.value.length === 0;
        if (gameSuccess) {
          store.dispatch("setGameActive", false);
          store.dispatch("setAnswerIndex", 0);
          setTimeout(() => alert(t("game_messages.congratulation_alert")), 200);
        } else {
          const failure = checkGameFailure();
          if (failure) {
            store.dispatch("setGameActive", false);
            store.dispatch("setAnswerIndex", 0);
            setTimeout(() => alert(t("game_messages.game_lost_alert")), 200);
          }
        }
      } else {
        dndData.value = undefined;
      }
    }

    function handleDragEnd(event) {
      if (!gameActive.value) return;
      if (!dndData.value) return;

      const { currentX, currentY } = event;
      const rootElementRect = rootElt.value.getBoundingClientRect();
      const rootEltX = rootElementRect.left;
      const rootEltY = rootElementRect.top;
      const evtX = currentX - rootEltX;
      const evtY = currentY - rootEltY;

      const evtCol = parseInt(Math.floor(evtX / cellsSizePx.value));
      const evtRow = parseInt(Math.floor(evtY / cellsSizePx.value));

      const colInBounds = evtCol >= 0 && evtCol <= 7;
      const rowInBounds = evtRow >= 0 && evtRow <= 7;

      if (colInBounds && rowInBounds) {
        const absDeltaCol = Math.abs(playerKnightPos.value.col - evtCol);
        const absDeltaRow = Math.abs(playerKnightPos.value.row - evtRow);

        const validMove =
          absDeltaCol > 0 && absDeltaRow > 0 && absDeltaRow + absDeltaCol === 3;
        if (validMove) {
          handleValidMove(evtCol, evtRow);
        }
      }

      dndData.value = undefined;
    }

    const dndIsActive = computed(() => !!dndData.value);

    const playerKnightLeft = computed(() => {
      const newValue = dndData.value
        ? dndData.value.left
        : playerKnightPos.value.col * cellsSizePx.value;
      return newValue + "px";
    });
    const playerKnightTop = computed(() => {
      const newValue = dndData.value
        ? dndData.value.top
        : playerKnightPos.value.row * cellsSizePx.value;
      return newValue + "px";
    });

    function opponentImageForValue(value) {
      switch (value.toLowerCase()) {
        case "k":
          return playerIsWhite.value
            ? "/assets/chess_vectors/Chess_kdt45.svg"
            : "/assets/chess_vectors/Chess_klt45.svg";
        case "q":
          return playerIsWhite.value
            ? "/assets/chess_vectors/Chess_qdt45.svg"
            : "/assets/chess_vectors/Chess_qlt45.svg";
        case "r":
          return playerIsWhite.value
            ? "/assets/chess_vectors/Chess_rdt45.svg"
            : "/assets/chess_vectors/Chess_rlt45.svg";
        case "b":
          return playerIsWhite.value
            ? "/assets/chess_vectors/Chess_bdt45.svg"
            : "/assets/chess_vectors/Chess_blt45.svg";
        case "n":
          return playerIsWhite.value
            ? "/assets/chess_vectors/Chess_ndt45.svg"
            : "/assets/chess_vectors/Chess_nlt45.svg";
        case "p":
          return playerIsWhite.value
            ? "/assets/chess_vectors/Chess_pdt45.svg"
            : "/assets/chess_vectors/Chess_plt45.svg";
        default:
          return;
      }
    }

    function getXForCol(col) {
      return col * cellsSizePx.value + "px";
    }

    function getYForRow(row) {
      return row * cellsSizePx.value + "px";
    }

    async function newGame(opponentsCount) {
      try {
        playerIsWhite.value = parseInt(Math.random() * 2) > 0;
        const position = await generatePosition(opponentsCount);
        playerKnightPos.value = position.playerKnight;
        opponentPieces.value = position.opponentPieces;
        store.dispatch("setGameActive", true);
      } catch (err) {
        if (err === "timeout") {
          alert(t("game_messages.generation_failure"));
        }
      }
    }

    function updatePosition() {
      const index = store.state.answerIndex;
      const answerData = store.state.answerData;

      const currentAnswerData = answerData[index]

      const { playerKnight: playerPos, opponentPieces: opponents } =
        currentAnswerData;

      playerKnightPos.value = playerPos;
      opponentPieces.value = opponents;
    }

    const playerImage = computed(() =>
      playerIsWhite.value
        ? "/assets/chess_vectors/Chess_nlt45.svg"
        : "/assets/chess_vectors/Chess_ndt45.svg"
    );

    store.subscribe((mutation, state) => {
      if (mutation.type === "setAnswerIndex") {
        if (gameActive.value) return;
        updatePosition();
      } else if (mutation.type === "setGameActive") {
        gameActive.value = state.gameActive;
      }
    });

    onMounted(() => {
      const gesture = createGesture({
        el: rootElt.value,
        threshold: 0,
        onStart: handleDragStart,
        onEnd: handleDragEnd,
        onMove: handleDrag,
      });

      gesture.enable();
    });

    return {
      rootElt,
      isPlayerKnightPos,
      classForCell,
      dndIsActive,
      dndData,
      playerKnightLeft,
      playerKnightTop,
      opponentPieces,
      opponentImageForValue,
      getXForCol,
      getYForRow,
      newGame,
      playerImage,
      gameActive,
      updatePosition,
      cellsSizePx,
      boardSizePx,
    };
  },
};
</script>

<style scoped>
.grid {
  position: relative;
  width: calc(v-bind('boardSizePx') * 1px);
  height: calc(v-bind('boardSizePx') * 1px);
  display: grid;
  grid-template: repeat(8, 1fr) / auto;
}

.grid_row {
  display: grid;
  grid-template: auto / repeat(8, 1fr);
}

.white_cell {
  background-color: navajowhite;
}

.black_cell {
  background-color: peru;
}

.dnd_start_cell {
  background-color: red;
}

.dnd_target_cell {
  background-color: green;
}

.dnd_cross_indicator_cell {
  background-color: indigo;
}

.pieces_layer {
  position: absolute;
  width: calc(v-bind('boardSizePx') * 1px);
  height: calc(v-bind('boardSizePx') * 1px);
}

#player_knight {
  position: absolute;
  width: calc(v-bind('cellsSizePx') * 1px);
  height: calc(v-bind('cellsSizePx') * 1px);
}

.opponent_piece {
  position: absolute;
  width: calc(v-bind('cellsSizePx') * 1px);
  height: calc(v-bind('cellsSizePx') * 1px);
}
</style>