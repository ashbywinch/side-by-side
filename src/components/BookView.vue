<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useCards } from '@/stores/cards.js'
import { useActiveBook } from '@/stores/activeBook';

const cardStore = useCards()
const { title, cards } = storeToRefs(cardStore)

const activeBookStore = useActiveBook()

activeBookStore.$subscribe((mutation) => {
  cardStore.setActiveBook(mutation.payload.activeBook)
})
const main = ref(null)

</script>
<template>
  <div class="book-view">
    <div id="main" ref="main" class="container my-5">
      <h1>{{title}}</h1>
      <template v-for="(card, index) in cards" :key="card.filename + ':' + card.index_in_file">
        <div class="row my-3 mx-0">
          <div class="col-md-6 col-sm-6">
              <div class="front border bg-light mx-2 p-3 fs-4 h-100">
              {{ card.current }}
              </div>
          </div>
          <div class="col-md-6 col-sm-6">
              <div class="back border bg-light mx-2 p-3 fs-4 h-100">
              <p :class="index >= showing ? 'masked' : ''">{{ card.translation }}</p>
              </div>
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
  computed: {
    store: () => useCards()
  }, 
  methods: {
    scrollToRow(index) {
      // eslint-disable-next-line no-undef
      const row = main.querySelectorAll('div')[index]
      row.scrollIntoView()
    },
    showMore()
    { 
      var move = this.showing < this.store.cards.length 
      if (move) {
        this.showing = this.showing + 1
        this.scrollToRow(this.showing)
      }
      return move
    },
    showLess()
    {
      var move = this.showing > 0
      if (move) {
        this.showing = this.showing - 1
        this.scrollToRow(this.showing)
      }
      return move
    },
    showNone()
    {
      this.showing = 0
    },
    showAll()
    {
      this.showing = this.store.cards.length
    },
    onEvent(event)
    {
      if(event.key === "ArrowDown"){       
        if(this.showMore())
          event.preventDefault();
      }
      else if(event.key === "ArrowUp"){       
        if(this.showLess())
          event.preventDefault();
      }
      else if(event.key==="Escape"){
        this.showNone()
        event.preventDefault();
      }
    }
  },
  mounted() {
    window.addEventListener('keydown', this.onEvent, true)
  }
};
</script>
<style scoped>
  .masked {
    filter: opacity(5%);
    filter: blur(5px);
  }
  .front, .back {
    height: fit-content;
  }
</style>
