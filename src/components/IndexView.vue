<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue';
import { useRouter, useRoute } from 'vue-router'
import Multiselect from 'vue-multiselect'

const props = defineProps({
  lang: { type:String, required:true},
  page: { type: Number, default: 1}
})

const shadowPage = ref(props.page);
const perPage = 24;

const router = useRouter();
const route = useRoute();
const query = route.query;

const shadowAuthor = ref(route.query.author);
const shadowLevel = ref(route.query.level);
const shadowSize = ref(route.query.size);
async function reload()
{
  router.push({name:"Index", 
                  params:{lang:props.lang, page:shadowPage.value}, 
                  query: {author:shadowAuthor.value, level:shadowLevel.value, size:shadowSize.value}})
}
watch(shadowAuthor, reload);
watch(shadowLevel, reload);
watch(shadowSize, reload);
watch(shadowPage, reload);

const is_loading = ref(false);
const index = ref([]);
const error = ref("");

// make a set and put all the index levels in it 
const levels = computed(() => Array.from(new Set(index.value.map(book => book["Vocab Level"]))))
const authors = computed(() => Array.from(new Set(index.value.map(book => book.author))))

const all_sizes = new Map([
  ["small", {min: 0, max: 1000}],
  ["medium", {min:1000, max:5000}],
  ["large", {min:5000, max:99999999999}]
])
const sizes = computed(() => 
  [...all_sizes].filter(size => !route.query["Size"] ||
                              index.value.some(book => book.size > size[1].min && book.size <= size[1].max))
                .map(size => size[0])) // just the name

const filtered_index = computed(() => {
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
  filtered_index.value.slice((props.page - 1) * perPage, props.page * perPage))


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
    <nav class="options">
      <multiselect v-model="shadowLevel" :options="levels" placeholder="Any level" style="width:12rem"></multiselect>
      <multiselect v-model="shadowSize" :options="sizes" placeholder="Any size" style="width:14rem"></multiselect>
      <multiselect v-model="shadowAuthor" :options="authors" placeholder="Any author"  style="width:20rem"></multiselect>
    </nav>
    <div class="card-deck">
      <template v-for="book in paginated_index" :key="book.author + book.title">
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
    <nav v-if="filtered_index.length > perPage" class="footer">
      <b-pagination
      v-if="filtered_index.length > 0"
      v-model="shadowPage"
      :total-rows="filtered_index.length"
      :per-page="perPage"
      align="center"
    ></b-pagination>
    </nav>
  </div>
</template>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>
<style scoped>

#footer {
  width:100%;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1em;
}

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
.footer {
  margin: 2rem;
}
.multiselect {
  display:inline-block;
  margin: 0 1rem 1rem 0;
}
.ph-card-header {
    color: white !important;
    background-color: navy !important;
}
</style>