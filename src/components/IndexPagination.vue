<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router'

const props = defineProps({
  books: { type:Array<Map<string, string>>, required:true},
  perPage: { type: Number, default: 24 }
})

const route = useRoute()
const router = useRouter();

const shadowPage = ref(Number(route.query.page ? route.query.page : 1));

async function reload()
{
  router.push({name: route.name, 
                  params: route.params, 
                  query: {...route.query, page: String(shadowPage.value)}
                })              
}

watch(shadowPage, reload);
</script>
<template>
    <nav v-if="books.length > props.perPage">
        <b-pagination
        v-if="books.length > 0"
        v-model="shadowPage"
        :total-rows="books.length"
        :per-page="props.perPage"
        align="center"
    ></b-pagination>
    </nav>
</template>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>
<style scoped>
nav {
  margin: 2rem;
}
</style>