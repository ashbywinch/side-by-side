<script setup lang="ts">
import { onMounted, ref, Ref } from 'vue';

const props = defineProps({
  title: { type:String, required: true},
  author: { type:String, required: true},
  cards: { type:Array, required:true},
  isTitlePage: {type:Boolean, default:false}
})

const translations_showing = ref(0) 

onMounted(() => {
  window.addEventListener("keydown", onEvent, true);
})

const main: Ref<Element> = ref(null);

function scrollToRow(index: number) {
  const row = main.value.$el.querySelectorAll("div.row")[index];
  if(row)
  {
    row.focus();
    row.scrollIntoView({block:"nearest"});
  }
}
function showMore() {
  var move = translations_showing.value < props.cards.length;
  if (move) {
    translations_showing.value = translations_showing.value + 1;
    scrollToRow(translations_showing.value);
  }
  return move;
}
function showLess() {
  var move = translations_showing.value > 0;
  if (move) {
    translations_showing.value = translations_showing.value - 1;
    scrollToRow(translations_showing.value);
  }
  return move;
}
function showNone() {
  translations_showing.value = 0;
}
//function showAll() {
//  translations_showing.value = cards.value.length;
//}
function onEvent(event: { key: string; preventDefault: () => void }) {
  // if we've scrolled then prevent any further scrolling
  if (event.key === "ArrowDown") {
    if (showMore()) event.preventDefault();
  } else if (event.key === "ArrowUp") {
    if (showLess()) event.preventDefault();
  } else if (event.key === "Escape") {
    showNone();
    event.preventDefault();
  }
}

</script>
<template>
    <va-card ref="main" class="page">
        <div v-if="isTitlePage" class="p1head"> 
            <h1 class="va-h1">{{ title }}</h1>
            <h3 class="va-h3">{{ author}}</h3>
        </div>
        <div v-if="!isTitlePage" class="pXhead row justify-space-between"> 
            <div class="item">{{ title }}</div>
            <div class="item">{{ author}}</div>
        </div>
        <template
        v-for="(card, index) in cards"
        :key="card.index_in_file"
        >
        <div class="row">
            <div class="flex flex-col md6">
            <va-card class="front item">
                <va-card-content>{{ card.text }}</va-card-content>
            </va-card>
            </div>
            <div class="flex flex-col md6">
            <va-card class="back item">
                <va-card-content :class="index >= translations_showing ? 'masked' : ''">
                {{ card.translation }}
                </va-card-content>
            </va-card>
            </div>
        </div>
        </template>
    </va-card>
</template>

<style scoped>
.p1head {
  margin: 2rem 0 3rem;
}
.pXhead {
  margin-bottom: 2em;
}
.va-card__content {
  padding: 0.3rem;
}
.masked {
  filter: opacity(5%);
  filter: blur(5px);
}
.front,
.back {
  height: fit-content;
  box-shadow: none;
  line-height: 1.3rem;
}
.page {
  width: 40rem;
  padding: 2rem;
  margin: 2em auto;
}
.va-screen-xs .page {
  width: 100%;
  margin: 0;
  box-shadow: none;
}

</style>
