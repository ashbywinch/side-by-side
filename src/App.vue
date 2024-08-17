<template>
  <RouterView :key='$route.fullPath'/>
</template>

<script lang="ts">
import { RouterView } from "vue-router";

export default {
  name: "App",
  components: {
    RouterView,
  },
  data() {
    return {};
  },
};
</script>
