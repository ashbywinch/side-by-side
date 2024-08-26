<script setup lang="ts">
defineProps({
  books: { type:Array<Map<string, string>>, required:true}
})

</script>
<template>
<div class="card-deck">
  <template v-for="book in books" :key="book.author + book.title">
    <div class="card">
      <h2 class="card-header">{{ book.title }}</h2>
      <div class="card-body d-flex flex-column ">
        
        <h3 class="card-text">{{ book.author }}</h3>
      </div>
      <div class="card-footer clearfix">
        <div class="float-start h-100 d-flex">
          <span class="badge rounded-pill bg-secondary align-bottom mt-auto">{{book["Vocab Level"]}}</span>
          <span class="badge rounded-pill bg-secondary align-bottom mt-auto">{{book["Word Count"]}} words</span>
        </div>
        <div class="float-end">
          <RouterLink class="btn btn-primary stretched-link" :to="{name:'Book',params:{lang: book.lang, author:book.author, title:book.title}}">Go</RouterLink>
        </div>
      </div>
    </div>
  </template>
</div>
</template>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>
<style scoped>
a {
  text-decoration: none;
}
a.btn {
  box-shadow: 0px 0px 3px 0px #2988c8;
}
.card {
  min-width: 18em;
  border:none;
  box-shadow: 0px 1px 1px 1px lightgrey;
}
.card-footer {
  background-color: transparent;
  border: none
}
h2 {
  font-size:1.7rem;
  font-weight: normal;
}
h3 {
  font-size:1.3rem;
  font-weight: normal;
}
.badge {
  padding: .5rem;
  margin-right: .5rem;
}

</style>