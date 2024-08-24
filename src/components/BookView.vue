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
  <div class="book-view">
    <div id="main" ref="main" class="container my-5">
      <h1>{{ title }}</h1>
      <h2>{{ author}}</h2>
      <template
        v-for="(card, index) in cards"
        :key="card.index_in_file"
      >
        <div class="row my-3 mx-0">
          <div class="col-md-6 col-sm-6">
            <div class="front border bg-light mx-2 p-3 fs-4 h-100">
              {{ card.text }}
            </div>
          </div>
          <div class="col-md-6 col-sm-6">
            <div class="back border bg-light mx-2 p-3 fs-4 h-100">
              <p :class="index >= translations_showing ? 'masked' : ''">
                {{ card.translation }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
export default {
    methods: {
      
  },
};
</script>
<style scoped>
.masked {
  filter: opacity(5%);
  filter: blur(5px);
}
.front,
.back {
  height: fit-content;
}
</style>
