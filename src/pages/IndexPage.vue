<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router'
import { all_sizes } from '@/components/sizes';
import BookOverviewCards from '@/components/BookOverviewCards.vue';
import BookFilter from '@/components/BookFilter.vue';

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
  return (!level.value || book["Vocab Level"] == level.value)
      && (!size.value || book.size == size.value)
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
    for (var book of index.value)
    {
      book.size =  [...all_sizes].filter(size => book["Word Count"] > size[1].min && 
                                                 book["Word Count"] <= size[1].max)
                                .map(size => size[0]) // just the name
                                [0]
    }
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
  <Surround :error="error">
    <BookFilter class="nav" :books=index :author="author" :size="size" :level="level" @update-filter-value="updateFilterValue"/>
    <BookOverviewCards :books="paginated_index"/>
    <Pagination :page="page" :items="filtered_index.length" :per-page="perPage" @update-page-value="updatePageValue"/>
  </Surround>
</template>

<style scoped>
header {
  margin-bottom: 2rem !important;
}
header * {
  font-size: 1.2rem !important;
}
.nav {
  margin-bottom: 1rem;
}
.container {
  margin-left: 1rem
}
</style>