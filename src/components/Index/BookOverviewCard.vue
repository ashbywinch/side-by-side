<script setup lang="ts">

defineProps({
  lang: { type:String, required:true},
  title: { type:String, required:true},
  author: { type:String, required:true},
  level: { type:String, required:true},
  size: { type:String, required:true},
  words: { type:Number, required:true},
})

const rainbow = {
1: "#817",
2: "#a35",
3: "#c66",
4: "#e94",
5: "#ed0",
6: "#9d5",
7: "#4d8",
8: "#2cb",
9: "#0bc",
10: "#09c",
11: "#36b",
12: "#639",
}
const levelColor = {
  "A1": rainbow[7],
  "A2": rainbow[6],
  "B1": rainbow[5],
  "B2": rainbow[4],
  "C1": rainbow[3],
  "C2": rainbow[2],
}
const sizeColor = {
  "small": rainbow[6],
  "medium": rainbow[4],
  "large": rainbow[2]
}
</script>
<template>
  <RouterLink :to="{name:'Book',params:{lang: lang, author:author, title:title}}">
  <va-card class="item">
    <va-card-title>{{ title }}</va-card-title>
    <va-card-content>
      {{ author }}
      <br/><br/><br/>
      <div class="row va-spacing-x-2">
        <va-badge :text="level" style="--va-badge-text-wrapper-border-radius: 1.5rem" :color="levelColor[level]"/>
        <va-badge :text="words + ' words'" style="--va-badge-text-wrapper-border-radius: 1.5rem;" :color="sizeColor[size]"/>
      </div>
    </va-card-content>
  </va-card>
  </RouterLink>
</template>
<style scoped>
.va-card-title {
  font-size:1.2rem !important;
  font-weight: 300 !important;
  text-transform: none !important;
  padding-bottom: .3rem !important;
}
.va-card-content {
  font-size: 1rem !important;
}
.va-badge * {
  font-size: 1rem !important;
  text-transform: none !important;
}
div.row a:focus .va-card {
  border: 1px solid var(--va-primary);
}
</style>