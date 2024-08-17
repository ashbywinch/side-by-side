<script setup lang="ts">
import { Ref, ref, watchEffect } from "vue";
import { useCardStore } from "@/stores/cardsStore";
import { storeToRefs } from "pinia";

const cardStore = useCardStore();
const { cards } = storeToRefs(cardStore);

const main: Ref<Element> = ref(null);

const props = defineProps({
  lang: { type:String, required:true},
  author: { type:String, required:true},
  title: { type:String, required:true},
})

watchEffect(() => {
  cardStore.fetchCards(props.lang, props.author, props.title)
});

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
              <p :class="index >= showing ? 'masked' : ''">
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
  name: "BookView",
  data() {
    return {
      showing: 0,
    };
  },
  computed: {
    store: () => useCardStore(),
  },
  mounted() {
    window.addEventListener("keydown", this.onEvent, true);
  },
  methods: {
    scrollToRow(index: number) {
      // eslint-disable-next-line no-undef
      const row = main.querySelectorAll("div")[index];
      row.focus();
      row.scrollIntoView();
    },
    showMore() {
      var move = this.showing < this.store.cards.length;
      if (move) {
        this.showing = this.showing + 1;
        this.scrollToRow(this.showing);
      }
      return move;
    },
    showLess() {
      var move = this.showing > 0;
      if (move) {
        this.showing = this.showing - 1;
        this.scrollToRow(this.showing);
      }
      return move;
    },
    showNone() {
      this.showing = 0;
    },
    showAll() {
      this.showing = this.store.cards.length;
    },
    onEvent(event: { key: string; preventDefault: () => void }) {
      if (event.key === "ArrowDown") {
        if (this.showMore()) event.preventDefault();
      } else if (event.key === "ArrowUp") {
        if (this.showLess()) event.preventDefault();
      } else if (event.key === "Escape") {
        this.showNone();
        event.preventDefault();
      }
    },
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
