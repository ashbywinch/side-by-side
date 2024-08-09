<script setup>
import { ref } from 'vue';
const isOpen = ref(false)

</script>

<template>
    <link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
    <header>
        <nav>
            <!-- "Hamburger menu" / "Bar icon" to toggle the navigation links -->
            <button class="icon" @click="isOpen = !isOpen">
                <div></div>
                <div></div>
                <div></div>
            </button>
            <div class="icontext">MENU</div>
            <!-- Navigation links (hidden by default) -->
            <div v-if="isOpen" id="links" class="w3-animate-left">
                <a href="#news">News</a>
                <a href="#contact">Contact</a>
                <a href="#about">About</a>
            </div>
        </nav>
    </header>

</template>

<script>

import index from '@/assets/index.json'

export default {
  name: 'FolderTree',   
  data() {
    return {
      index: index
    };
  },
};
</script>

<style scoped>
nav {
  background-color: rgb(109, 165, 230);
  position: relative;
}

/* Style navigation menu links */
nav a {
  color: white;
  text-decoration: none;
  font-size: 1.5rem;
  display: block;
  width: fit-content;
}
nav #links {
    width: fit-content;
    position:absolute;
    background-color: rgb(109, 165, 230);
    padding: 1rem;
}

/* Style the hamburger menu */
nav button.icon {
  display: inline-block;
  background-color: transparent;
  border-width: 0;
  vertical-align: middle;
  margin: 0 .5rem;
}

nav button.icon div {
  width: 1.5rem;
  height: .2rem;
  background-color: white;
  margin: .3rem 0;
}

nav .icontext {
    color: white;
    font-size: 2rem;
    display:inline-block;
    vertical-align: middle;
}

/* Add a grey background color on mouse-over */
nav a:hover {
  background-color: #ddd;
  color: black;
}

</style>