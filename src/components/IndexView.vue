<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue';
import { useRouter } from 'vue-router'

const props = defineProps({
  lang: { type:String, required:true},
  page: { type: Number, default: 1}
})

const shadowPage = ref(props.page);
const perPage = 24;

const router = useRouter();
watch(
  shadowPage,
  async () => {
    if(shadowPage.value != props.page)
      router.push({name:"Index", params:{lang:props.lang, page:shadowPage.value}})
  }
)

const is_loading = ref(false);
const index = ref([]);
const error = ref("");

const filtered_index = computed(() => index.value.slice((props.page - 1) * perPage, props.page * perPage))

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
  <div>
    <h1>Books</h1>
    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    <div class="card-deck">
      <template v-for="book in filtered_index" :key="book.author + book.title">
        <div class="card">
          <div class="card-body d-flex flex-column ">
            <h2 class="card-title">{{ book.title }}</h2>
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
    <nav class="footer">
      <b-pagination
      v-if="index.length > 0"
      v-model="shadowPage"
      :total-rows="index.length"
      :per-page="perPage"
      align="center"
    ></b-pagination>
    </nav>
  </div>
</template>

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
  box-shadow: 0px 0px 5px 0px lightgrey;
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
</style>