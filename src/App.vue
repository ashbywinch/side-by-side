<template>
  <NavBar/>
  <BookView/>
</template>

<script>

import BookView from './components/BookView.vue';
import NavBar from './components/NavBar.vue';

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

<style>
#app {
  font-family: PT Sans, calibri, arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
* {
  margin: 0;
  padding: 0;
}
</style>
