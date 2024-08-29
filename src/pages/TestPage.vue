
<script setup lang="ts">
import { ref } from 'vue';

const data = ref(
  new Array(2000).fill(null).map((_, index) => index + 1)
);
const page = ref(null) // the containing element from the DOM
const magicHeight = ref(window.innerHeight)  // where we keep the "real" height of the content
  
function resize() {
  if(page.value)
  {
    const bigList = page.value.$el.querySelectorAll("[role=list]")[0];
    magicHeight.value = bigList.getBoundingClientRect().height + 50;
    console.log("Setting container to ", magicHeight.value, "px high")
  }
}

</script>

<template>
  <VaVirtualScroller
    v-slot="{ item, index }"
    ref="page"
    :items="data"
    wrapper-size="auto"
  >     
  <div>
   item {{item}} with index {{index}}
   <br/>
   <br/>
  </div>
   </VaVirtualScroller>
</template>
