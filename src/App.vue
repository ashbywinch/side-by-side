<template>
  <BookView title="Testing"/>
</template>

<script>
import BookView from './components/BookView.vue';

export default {
  name: 'App',
  components: {
    BookView
  },
  data() {
    return {};
  },
}
</script>

<style>
#app {
  font-family: PT Sans, calibri, arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>
