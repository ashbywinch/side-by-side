<template>
  <div class="book-view">
    <div id="main" class="container my-5">
      <h1>{{title}}</h1>
      <template v-for="card in cards" :key="card.filename + ':' + card.index_in_file">
        <div class="row my-3 mx-0">
          <div class="col-md-6 col-sm-6">
              <div class="front border bg-light mx-2 p-3 fs-4">
              {{ card.current }}
              </div>
          </div>
          <div class="col-md-6 col-sm-6">
              <div class="back border bg-light mx-2 p-3 fs-4">
              {{ card.translation }}
              </div>
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


</style>
