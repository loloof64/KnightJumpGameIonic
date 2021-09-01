<template>
  <ion-page>
    <ion-content>
      <div id="root">
        <new-game-dialog ref="newGameDialog" />
        <game-rules ref="gameRulesDialog" />
        <about-dialog ref="aboutDialog" />
        <chess-board id="board" ref="board" :cellsSize="cellsSize" />
        <div id="controls">
          <span id="ennemies_count" v-if="opponentPiecesCount > 0">
            {{ opponentPiecesCount }} {{ t("main_page.opponent_pieces") }}
          </span>
          <div id="buttons_zone">
            <button @click="showNewGameDialog" class="new_game">
              {{ t("main_page.new_game_button") }}
            </button>
            <button @click="showGameRulesDialog" class="games_rules">
              {{ t("main_page.game_rules_button") }}
            </button>
          </div>
          <button @click="showAboutDialog" class="about_dlg">
            {{ t("main_page.about_button") }}
          </button>
          <div class="generation_zone" v-if="isGeneratingGame">
            <progress
              class="progressBar"
              min="0"
              :max="generationSteps"
              :value="generationStepProgress"
            ></progress>
            <button @click="cancelGameGeneration" class="cancel_generation">
              {{ t("main_page.cancel_generation") }}
            </button>
          </div>
          <div class="solution_controls" v-if="solutionControlsVisible">
            <div class="header">{{ t("main_page.possible_solution") }}</div>
            <div class="content">
              <button @click="goPreviousSolution">&lt;</button>
              <input
                ref="slider"
                type="range"
                class="slider"
                step="1"
                min="0"
                :max="solutionSteps"
                :value="answerIndex"
                @change="handleSliderChanged"
              />
              <button @click="goNextSolution">&gt;</button>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, watch, computed, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { useStore } from "vuex";
import { IonContent, IonPage } from "@ionic/vue";
import { ScreenOrientation } from "@ionic-native/screen-orientation";

import ChessBoard from "@/components/ChessBoard";
import NewGameDialog from "@/components/NewGameDialog";
import GameRules from "@/components/GameRules";
import AboutDialog from "@/components/AboutDialog";

export default {
  name: "MainPage",
  setup() {
    const cellsSize = ref(0);
    const rootFlexDirection = ref("row");
    const controlsWidth = ref(0);

    const newGameDialog = ref();
    const gameRulesDialog = ref();
    const aboutDialog = ref();
    const isGeneratingGame = ref(false);
    const slider = ref();
    const board = ref();
    const { t } = useI18n();
    const store = useStore();

    const opponentPiecesCount = ref(store.state.opponentPiecesCount);
    const answerIndex = ref(0);

    function adjustLayoutDirection() {
      const orientationType = ScreenOrientation.type;
      const isPortrait = orientationType.includes("portrait");
      rootFlexDirection.value = isPortrait ? "column" : "row";
      controlsWidth.value = isPortrait
        ? cellsSize.value * 8 + "px"
        : "calc(100% - " + cellsSize.value * 8 + "px)";
    }

    async function showNewGameDialog() {
      const opponentPiecesCount = await newGameDialog.value.show();
      if (opponentPiecesCount) {
        isGeneratingGame.value = true;
        await board.value.newGame(opponentPiecesCount);
        isGeneratingGame.value = false;
      }
    }

    async function showGameRulesDialog() {
      await gameRulesDialog.value.show();
    }

    async function showAboutDialog() {
      await aboutDialog.value.show();
    }

    function cancelGameGeneration() {
      store.dispatch("cancelGeneration");
    }

    const generationSteps = ref(store.state.generationStepsCount);
    const generationStepProgress = ref(store.state.generationStepProgress);
    const gameActive = ref(store.state.gameActive);
    const answerData = ref(store.state.answerData);

    const solutionSteps = ref(0);

    const solutionControlsVisible = computed(
      () => answerData.value && !gameActive.value
    );

    watch(answerIndex, () => board.value.updatePosition());

    store.subscribe((mutation, state) => {
      if (mutation.type === "setGenerationStepsCount") {
        generationSteps.value = state.generationStepsCount;
        generationStepProgress.value = state.generationStepProgress;
      } else if (mutation.type === "incrementGenerationStepProgress") {
        generationStepProgress.value = state.generationStepProgress;
      } else if (mutation.type === "setOpponentPiecesCount") {
        opponentPiecesCount.value = state.opponentPiecesCount;
      } else if (mutation.type === "setGameActive") {
        gameActive.value = state.gameActive;
      } else if (mutation.type === "setAnswerData") {
        answerData.value = state.answerData;
        solutionSteps.value = state.answerData.length - 1;
      } else if (mutation.type === "setAnswerIndex") {
        answerIndex.value = state.answerIndex;
      }
    });

    function goPreviousSolution() {
      if (gameActive.value) return;
      if (answerIndex.value === 0) return;

      store.dispatch("setAnswerIndex", answerIndex.value - 1);
    }

    function goNextSolution() {
      if (gameActive.value) return;
      if (answerIndex.value >= store.state.opponentPiecesCount) return;

      store.dispatch("setAnswerIndex", answerIndex.value + 1);
    }

    function handleSliderChanged() {
      store.dispatch("setAnswerIndex", parseInt(slider.value.value));
    }

    onMounted(() => {
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const minSize = Math.min(screenWidth, screenHeight) * 0.92;
      cellsSize.value = minSize / 8;

      adjustLayoutDirection();
    });

    window.addEventListener("orientationchange", adjustLayoutDirection);
    onBeforeUnmount(function () {
      window.removeEventListener("orientationchange", adjustLayoutDirection);
    });

    return {
      newGameDialog,
      gameRulesDialog,
      aboutDialog,
      showNewGameDialog,
      showGameRulesDialog,
      showAboutDialog,
      board,
      isGeneratingGame,
      cancelGameGeneration,
      generationSteps,
      generationStepProgress,
      opponentPiecesCount,
      gameActive,
      answerData,
      goPreviousSolution,
      goNextSolution,
      solutionControlsVisible,
      solutionSteps,
      answerIndex,
      handleSliderChanged,
      slider,
      cellsSize,
      controlsWidth,
      rootFlexDirection,
      t,
    };
  },
  components: {
    ChessBoard,
    NewGameDialog,
    AboutDialog,
    GameRules,
    IonPage,
    IonContent,
  },
};
</script>

<style scoped>
#root {
  display: flex;
  flex-direction: v-bind("rootFlexDirection");
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

body,
html {
  margin: 0;
}

button {
  border-radius: 0.4rem;
  color: white;
  font-size: 1.6rem;
}

button.new_game {
  background-color: olive;
}

button.games_rules {
  background-color: palevioletred;
}

button.cancel_generation {
  background-color: red;
}

button.about_dlg {
  background-color: orangered;
}

#controls {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  width: v-bind("controlsWidth");
}

#buttons_zone {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  align-items: center;
  width: 100%;
  margin: 0.8rem 0;
}

#ennemies_count {
  font-size: 1.6rem;
}

.generation_zone {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  margin: 0.8rem 0;
}

.progressBar,
.slider {
  font-size: 1.6rem;
}

.solution_controls {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin: 0.8rem 0;
}

.solution_controls button {
  background-color: greenyellow;
}

.solution_controls .header {
  font-size: 1.6rem;
}

.solution_controls .content {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}
</style>