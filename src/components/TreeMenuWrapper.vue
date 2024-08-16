<script setup lang="ts">
import { useIndexStore } from "@/stores/indexStore";
import { storeToRefs } from "pinia";
const indexStore = useIndexStore()
indexStore.fetchIndex("ru", true)

const { error, index, isFetching } = storeToRefs(indexStore);
</script>

<template>
  <BAlert show="error" variant="danger">{{error}}</BAlert>
  <BOverlay :show="isFetching">
    <TreeMenu :show="index" :root="index" :depth="0"> </TreeMenu>  
  </BOverlay>
</template>

<script lang="ts"> 
import TreeMenu from "./TreeMenu.vue";
 
export default {
  name: "TreeMenuWrapper",
  components: { TreeMenu }
};
</script>
