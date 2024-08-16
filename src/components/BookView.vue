<script setup lang="ts">
import { Ref, ref } from "vue";
import { MutationType, storeToRefs, SubscriptionCallbackMutation } from "pinia";
import { useCardStore } from "@/stores/cardsStore";
import { useActiveBook } from "@/stores/activeBookStore";

const cardStore = useCardStore();
const { title, cards } = storeToRefs(cardStore);

const activeBookStore = useActiveBook();

activeBookStore.$subscribe((mutation: SubscriptionCallbackMutation<{activeBook: string}> ) => {
  if (mutation.type === MutationType.patchObject) {
    const payload = mutation.payload;
    cardStore.fetchCards(payload.activeBook, true);
  }
});
const main: Ref<Element> = ref(null);
</script>
<template>
  <div class="book-view">
    <div id="main" ref="main" class="container my-5">
      <h1>{{ title }}</h1>
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
