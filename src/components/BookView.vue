<template>
  <div class="book-view">
    <h1>{{title}}</h1>
    <div id="main" class="grid-container">
      <template v-for="card in cards" :key="card.filename + ':' + card.index_in_file">
        <div class="front card">
            <div class="text">
            {{ card.current }}
            </div>
        </div>
        <div class="back card">
            <div class="text">
            {{ card.translation }}
            </div>
        </div>
      </template>
    </div>    
  </div>
</template>
 
<script>

import jsonl from '@/assets/cards.jsonl'
var path = require('path');
var title = path.parse(jsonl[1].filename).name;

var cards = jsonl.slice(1)
cards = cards.filter(card => card.filename == cards[0].filename)
export default {
  name: 'BookView',
  data() {
    return {
      title: title,
      cards: cards,
    };
  },
};
</script>


<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
body {
    max-width: 100%
}
.grid-container {
    max-width: 70rem;
    font-size: 30px;
    display: flex;
    align-items: stretch;
    flex-wrap: wrap;
}
.card {
  flex: 1 100%;
}
@media all and (min-width: 600px) {
  .card { flex: 0 1 50% }
}

:nth-child(4n + 1 of div.card), :nth-child(4n + 2 of div.card) {
  background-color: paleturquoise;
}

div.text {
  padding: 1rem;
}
</style>
