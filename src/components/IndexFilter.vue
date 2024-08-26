<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router'
import Multiselect from 'vue-multiselect'
import { all_sizes } from '@/components/sizes';

const props = defineProps({
  size: { type:String, default:null},
  level: { type: String, default: null},
  author: { type: String, default: null},
  books: { type:Array<Map<string, string>>, required:true}
})

const shadowAuthor = ref(props.author);
const shadowLevel = ref(props.level);
const shadowSize = ref(props.size);

// make a set and put all the index levels in it 
const levels = computed(() => Array.from(new Set(props.books.map(book => book["Vocab Level"]))))
const authors = computed(() => Array.from(new Set(props.books.map(book => book.author))))


const sizes = computed(() => 
  [...all_sizes].filter(size => !props.size ||
                              props.books.some(book => book.size > size[1].min && book.size <= size[1].max))
                .map(size => size[0])) // just the name

const route = useRoute()
const router = useRouter()

async function reload()
{
  router.push({name: route.name, 
                  params: route.params, 
                  query: {author:shadowAuthor.value, level:shadowLevel.value, size:shadowSize.value}})
}
watch(shadowAuthor, reload)
watch(shadowSize, reload)
watch(shadowLevel, reload)

</script>
<template>
  <nav class="options">
    <multiselect v-model="shadowLevel" :options="levels" placeholder="Any level" style="width:12rem"></multiselect>
    <multiselect v-model="shadowSize" :options="sizes" placeholder="Any size" style="width:14rem"></multiselect>
    <multiselect v-model="shadowAuthor" :options="authors" placeholder="Any author"  style="width:20rem"></multiselect>
  </nav>
</template>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>
<style scoped>
.multiselect {
  display:inline-block;
  margin: 0 1rem 1rem 0;
}
</style>