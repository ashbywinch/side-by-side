<template>
  <NavBar/>
  <BookView/>
</template>

<script lang="ts">
import BookView from '@/components/BookView.vue';
import NavBar from '@/components/NavBar.vue';

export default {
  name: 'App',
  components: {
    NavBar,
    BookView
  },
  data() {
    return {};
  },
}
</script>
