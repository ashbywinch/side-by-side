<template>
  <FolderTree/>
  <BookView title="Testing"/>
</template>

<script>
import BookView from './components/BookView.vue';
import FolderTree from './components/FolderTree.vue';

export default {
  name: 'App',
  components: {
    FolderTree,
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
