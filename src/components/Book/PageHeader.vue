<script setup lang="ts">

defineProps({
  title: { type:String, required: true},
  author: { type:String, required: true},
  isTitlePage: {type:Boolean, default:false}
})

</script>
<template>
    <div v-if="isTitlePage" class="p1head"> 
        <h1 class="va-h1">{{ title }}</h1>
        <h3 class="va-h3">{{ author}}</h3>
    </div>
    <div v-if="!isTitlePage" class="pXhead row justify-space-between"> 
        <div class="item">{{ title }}</div>
        <div class="item">{{ author}}</div>
    </div>
</template>

<style scoped>
.p1head {
  margin: 2rem 0 2rem;
}
.pXhead {
  margin-bottom: 2em;
}
</style>
