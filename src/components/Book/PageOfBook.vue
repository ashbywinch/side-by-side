<script setup lang="ts">
import PageHeader from '@/components/Book/PageHeader.vue';
import TextSnippet from '@/components/Book/TextSnippet.vue';
import { onMounted, ref, Ref } from 'vue';

const props = defineProps({
  title: { type:String, required: true},
  author: { type:String, required: true},
  cards: { type:Array, required:true},
  page: {type:Number, required:true},
  numPages: {type:Number, required:true},
})

const translations_showing = ref(0) 

onMounted(() => {
  window.addEventListener("keydown", onEvent, true);
})

const main: Ref<Element> = ref(null);

function showMore() {
  var move = translations_showing.value < props.cards.length;
  if (move) {
    translations_showing.value = translations_showing.value + 1;
  }
  return move;
}
function showLess() {
  var move = translations_showing.value > 0;
  if (move) {
    translations_showing.value = translations_showing.value - 1;
  }
  return move;
}
function showNone() {
  translations_showing.value = 0;
}
//function showAll() {
//  translations_showing.value = cards.value.length;
//}
function onEvent(event: { key: string; ctrlKey: boolean; preventDefault: () => void }) {
  // if we've scrolled then prevent any further scrolling
  if (event.ctrlKey && event.key === "ArrowDown") {
    if (showMore()) event.preventDefault();
  } else if (event.ctrlKey && event.key === "ArrowUp") {
    if (showLess()) event.preventDefault();
  } else if (event.key === "Escape") {
    showNone();
    event.preventDefault();
  }
}

</script>
<template>
  <va-card ref="main" class="page">
    <PageHeader :title="title" :author="author" :is-title-page="page == 1"/>
    <div class="text">
      <template
        v-for="(card, index) in cards"
        :key="card.index_in_file">
          <TextSnippet 
            :text="card.text" 
            :translation="card.translation" 
            :showTranslation="index < translations_showing" 
            @translation-clicked="translations_showing = index + 1"/>
      </template>
    </div>
    <div v-if="numPages > 1" class="row justify-center">
      <div>{{page}} of {{numPages}}</div>
    </div>
  </va-card>
</template>

<style scoped>
.text {
  margin: 3rem 0;
}
.screen-xs .text {
  margin: 1em 0;
}
.va-card__content {
  padding: 0.3rem;
}
.masked {
  color: transparent;
  background-color: var(--va-shadow);
}
.front,
.back {
  height: fit-content;
  box-shadow: none;
  line-height: 1.3rem;
}
.back:hover {
  cursor: pointer;
}
.page {
  width: 40rem;
  padding: 2rem;
  margin: 2rem auto;
}
.screen-xs .page {
    margin: 0;
    padding: 1rem;
}
@include media-breakpoint-only(xs) { 
  .page {
    width: 100%;
    margin: 0;
    box-shadow: none;
  }
}
</style>
