<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  text: { type:String, required: true},
  translation: { type:String, required: true},
  showTranslation: { type:Boolean, required:true},
})
const emit = defineEmits(["translation-clicked"])

const hasText = computed(() => props.text.trim().length > 0);
const hasTranslation = computed(() => props.translation.trim().length > 0);
// An orphaned translation has no source to reveal, so show it immediately.
const revealed = computed(() => props.showTranslation || !hasText.value);

function reveal() {
  if (!revealed.value) emit("translation-clicked");
}

</script>
<template>
  <div v-if="hasText || hasTranslation" class="row">
    <div v-if="hasText" class="flex sm6">
      <va-card class="original item">
          <va-card-content>{{ text }}</va-card-content>
      </va-card>
    </div>
    <div class="flex" :class="hasText ? 'sm6' : 'sm12'">
      <va-card
        class="translation item"
        :class="{ clickable: !revealed }"
        :role="revealed ? undefined : 'button'"
        :tabindex="revealed ? undefined : 0"
        :aria-label="revealed ? undefined : 'Show the translation of this passage'"
        @click="reveal"
        @keydown.enter.prevent="reveal"
        @keydown.space.prevent="reveal"
      >
        <va-card-content>
          <span :class="revealed ? '' : 'masked'" :aria-hidden="!revealed">
              {{ translation }}
          </span>
        </va-card-content>
      </va-card>
    </div>
  </div>
</template>

<style scoped>
.screen-xs .row {
  flex-direction: column;
}
.va-card__content {
  padding: 0.3rem;
}
.masked {
  color: transparent;
  background-color: var(--va-shadow);
}
.original,
.translation {
  height: fit-content;
  box-shadow: none;
  line-height: 1.3rem;
}
.translation.clickable {
  cursor: pointer;
}
.translation.clickable:focus-visible {
  outline: 2px solid var(--va-primary);
  outline-offset: 2px;
}

</style>
