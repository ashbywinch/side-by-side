<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { useRoute } from 'vue-router'
import IndexDetailsView from './IndexDetailsView.vue';
import { all_sizes } from '@/components/sizes';

const props = defineProps({
  lang: { type:String, required:true},
})

const perPage = ref(24)
const route = useRoute();
const query = route.query;
const page = Number(query.page ? query.page : 1)

const is_loading = ref(false);
const index = ref([]);
const error = ref("");

const filtered_index = computed(() => {
  if(!index.value)
  {
    return [] 
  }
  
  var reduced_index = index.value;
  if(query.level)
  {
     reduced_index = reduced_index.filter(book => book["Vocab Level"] == query.level)
  }
  if(query.size)
  {
    const range = all_sizes.get(query.size);
    reduced_index = reduced_index.filter(book => book["Word Count"] > range.min && book["Word Count"] <= range.max);
  }
  if(query.author)
  {
    reduced_index = reduced_index.filter(book => book.author == query.author);
  }
  return reduced_index;
})
const paginated_index = computed(() => 
  filtered_index.value.slice((page - 1) * perPage.value, page * perPage.value))


async function fetchIndex() {
  try {
    is_loading.value = true;
    const url = `/api/books/${props.lang}/index.jsonl`;
    const response = await fetch(url);
    const text = await response.text()
    const lines = text.split('\n')
    for (const line of lines)
        if(line.length > 0)
          index.value.push(JSON.parse(line))
  } catch(err) {
    error.value = err
  }
  finally {
    is_loading.value = false;
  }
}

watchEffect(() => { fetchIndex() });

</script>
<template>
  <div class="m-sm-4">
    <h1>Books</h1>
    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    <IndexFilter :books=index :author="query.author" :size="query.size" :level="query.level"/>
    <IndexDetailsView :books="paginated_index"/>
    <IndexPagination :books="filtered_index" :per-page="perPage"/>
  </div>
</template>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>
<style scoped>
.footer {
  margin: 2rem;
}
</style>