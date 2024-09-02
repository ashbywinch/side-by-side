<script setup lang="ts">

defineProps({
  text: { type:String, required: true},
  translation: { type:String, required: true},
  showTranslation: { type:Boolean, required:true},
})
const emit = defineEmits(["translation-clicked"])

</script>
<template>
  <div class="row">
    <div class="flex sm6">
      <va-card class="original item">
          <va-card-content>{{ text }}</va-card-content>
      </va-card>
    </div>
    <div class="flex sm6">
      <va-card class="translation item" @click="emit('translation-clicked')">
        <va-card-content>
          <span :class="showTranslation ? '' : 'masked'" aria-hidden="!showTranslation">
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
.translation:hover {
  cursor: pointer;
}

</style>
