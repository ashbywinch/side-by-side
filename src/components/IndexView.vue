<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router'
import IndexDetailsView from './IndexDetailsView.vue';
import { all_sizes } from '@/components/sizes';

const props = defineProps({
  lang: { type:String, required:true},
})

const perPage = ref(24)
const route = useRoute();
const query = route.query;

var page= ref(Number(query.page ? query.page : 1))
var author= ref(query.author)
var level= ref(query.level)
var size= ref(query.size)

const is_loading = ref(false);
const index = ref([]);
const error = ref("");

const router = useRouter();
function updatePageValue(newPage)
{
  page.value = newPage
  reload()
}
function updateFilterValue(newLevel, newSize, newAuthor)
{
  level.value = newLevel.value
  size.value = newSize.value
  author.value = newAuthor.value
  page.value = 1
  reload()
}

// Remove all null items from this query
function newQuery(level, size, author, page)
{
  let newQuery = {}
  if(level) newQuery["level"] = level
  if(size)  newQuery["size"] = size
  if(author)  newQuery["author"] = author
  if(page) newQuery["page"] = page
  return newQuery
}
async function reload()
{
  if(query.level == level.value && query.size == size.value && query.author == author.value && Number(query.page) == page.value)
  {
    return
  }
  router.push({name: route.name, 
                  params: route.params, 
                  query: newQuery(level.value, size.value, author.value, page.value)
                })              
}

function isVisible(book)
{
  const range = size.value ? all_sizes.get(size.value) : null;
  return (!level.value || book["Vocab Level"] == level.value)
      && (!size.value || book["Word Count"] > range.min && book["Word Count"] <= range.max)
      && (!author.value || book["author"] == author.value)
}

const filtered_index = computed(() => {
  return index.value ? index.value.filter(book => isVisible(book)) : []
})
const paginated_index = computed(() => 
  filtered_index.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))


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
    <IndexFilter :books=index :author="author" :size="size" :level="level" @update-filter-value="updateFilterValue"/>
    <IndexDetailsView :books="paginated_index"/>
    <IndexPagination :page="page" :books="filtered_index" :per-page="perPage" @update-page-value="updatePageValue"/>
  </div>
</template>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>
<style scoped>
.footer {
  margin: 2rem;
}
</style>