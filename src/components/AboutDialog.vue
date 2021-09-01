<template>
  <div id="backdrop" v-if="isVisible">
    <div id="content">
      <h3>{{ t("about_dialog.title") }}</h3>
      <p>Laurent Bernabé (2021)</p>
      <p>{{ t("about_dialog.application_icon") }}</p>
      <p>{{ t("about_dialog.chess_vectors") }}</p>
      <button @click="handleConfirm" class="validate">
        {{ t("dialogs_generalities.validate_button") }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import { useI18n } from "vue-i18n";

export default {
  setup() {
    const isVisible = ref(false);
    const okClicked = ref(false);

    const { t } = useI18n();

    function handleConfirm() {
      okClicked.value = true;
    }

    function show() {
      okClicked.value = false;
      return new Promise((resolve) => {
        let buttonClickcheckHandle;
        function checkClickOnCloseButtons() {
          if (okClicked.value) {
            isVisible.value = false;
            resolve();
            clearInterval(buttonClickcheckHandle);
          }
        }
        buttonClickcheckHandle = setInterval(checkClickOnCloseButtons, 700);
        isVisible.value = true;
      });
    }

    return {
      isVisible,
      show,
      handleConfirm,
      t,
    };
  },
};
</script>

<style scoped>
#backdrop {
  position: absolute;
  background-color: #cccccc7a;
  z-index: 10;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

#content {
  position: absolute;
  background-color: white;
  width: 80%;
  height: 80%;
  display: flex;
  justify-content: space-evenly;
  align-items: stretch;
  flex-direction: column;
  padding: 5rem;
}

h3 {
  font-size: 1.6rem;
  display: inline-block;
  margin: 0 auto;
}

p {
  font-size: 1.6rem;
  margin: 0 auto;
}

button {
  border-radius: 5px;
  color: white;
  margin: 0 auto;
  font-size: 1.6rem;
}

button.validate {
  background-color: yellowgreen;
}
</style>