<script setup lang="ts">
import { onMounted, Ref, ref, watchEffect } from "vue";

const props = defineProps({
  lang: { type:String, required:true},
  author: { type:String, required:true},
  title: { type:String, required:true},
})

const main: Ref<Element> = ref(null);
const is_loading = ref(false)
const cards = ref([])
const error = ref("")
const translations_showing = ref(0) 

async function fetchCards() {
  try {
    is_loading.value = true
    const url = `/api/books/${props.lang}/${props.author}/${props.title}.jsonl`
    await fetch(url)
            .then(response => response.text())
            .then(text => text.split("\n")
              .filter(line => line.length > 0)
              .forEach(line => cards.value.push(JSON.parse(line)))) // incremental loading
  } catch(err) {
    error.value = err
  }
  finally {
    is_loading.value = false
  }
}

watchEffect(() => { fetchCards() });

onMounted(() => {
    window.addEventListener("keydown", onEvent, true);
})

function scrollToRow(index: number) {
  const row = main.value.querySelectorAll("div.row")[index];
  row.focus();
  row.scrollIntoView({block:"nearest"});
}
function showMore() {
  var move = translations_showing.value < cards.value.length;
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
  <PageSurround :error="error">
    <va-card class="page">
      <div class="head"> 
        <h1 class="va-h1">{{ title }}</h1>
        <h3 class="va-h3">{{ author}}</h3>
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
  </PageSurround>
</template>

<style scoped>
.head {
  margin-bottom: 2rem;
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
