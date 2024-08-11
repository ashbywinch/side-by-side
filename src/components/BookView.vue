<script setup>
import { storeToRefs } from 'pinia'
import { useCards } from '@/stores/cards.js'
import { useActiveBook } from '@/stores/activeBook';

const cardStore = useCards()
const { title, cards } = storeToRefs(cardStore)

const activeBookStore = useActiveBook()

activeBookStore.$subscribe((mutation) => {
  cardStore.setActiveBook(mutation.payload.activeBook)
})
</script>
<template>
  <div class="book-view">
    <div id="main" class="container my-5">
      <h1>{{title}}</h1>
      <input type="hidden" @keyup.down="showMore()" @keyup.up="showLess()" @keyup.esc="showAll()" />
      <template v-for="(card, index) in cards" :key="card.filename + ':' + card.index_in_file">
        <div class="row my-3 mx-0">
          <div class="col-md-6 col-sm-6">
              <div class="front border bg-light mx-2 p-3 fs-4">
              {{ card.current }}
              </div>
          </div>
          <div class="col-md-6 col-sm-6">
              <div class="back border bg-light mx-2 p-3 fs-4" :aria-hidden="index <= showing ? 'true' : null">
              {{ card.translation }}
              </div>
              <div class="mask" :show="index <= showing" style="background-color: hsla(0, 0%, 0%, 0.6)"></div>
            </div>
        </div>
      </template>
    </div>    
  </div>
</template>
 
<script>

export default {
  name: 'BookView',
  data() {
    return {
      showing: 2
    }
  },
  methods: {
    showMore()
    {
      if (this.showing < this.cards.length) this.showing = this.showing + 1
    },
    showLess()
    {
      if (this.showing > 0) this.showing = this.showing - 1
    },
    showNone()
    {
      this.showing = 0
    },
    showAll()
    {
      this.showing = this.cards.length
    }
  }
};
</script>
<style scoped>

</style>
