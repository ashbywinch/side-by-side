<script setup lang="ts">
import { usePagination, paginated_items, setPage, page } from "@/pages/Pagination";
import { useRoute, useRouter } from "vue-router";
import { onMounted, Ref, ref, watchEffect } from "vue";

import SimplePagination from '@/components/SimplePagination.vue';
import PageSurround from "@/components/PageSurround.vue";

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

const perPage = 24; 
const router = useRouter()
const route = useRoute()

usePagination(cards, perPage);
setPage(Number(route.query.page ?? 1));

function updatePageValue(newPage)
{
  setPage(newPage)
  router.push({
    name: route.name,
    params: route.params,
    query: {"page": newPage}
  });
}


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
      <div v-if="page == 1" class="p1head"> 
        <h1 class="va-h1">{{ title }}</h1>
        <h3 class="va-h3">{{ author}}</h3>
      </div>
      <div v-if="page != 1" class="pXhead row justify-space-between"> 
        <div class="item">{{ title }}</div>
        <div class="item">{{ author}}</div>
      </div>
      <template
        v-for="(card, index) in paginated_items"
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
    <SimplePagination :page="page" :items="cards.length" :per-page="perPage" @update-page-value="updatePageValue"/>
  </PageSurround>
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
