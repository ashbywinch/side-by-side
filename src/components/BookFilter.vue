<script setup lang="ts">
import { all_sizes } from '@/components/sizes';
import { computed, ref } from 'vue';

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
  [...all_sizes].map(size => size[0])) // just the name

const emit = defineEmits(["update-filter-value"])
function doEmit()
{
  emit("update-filter-value", shadowLevel, shadowSize, shadowAuthor)
}

</script>
<template>
  <nav class="row">
    <va-select v-model="shadowLevel" :options="levels" label="Level" placeholder="Any level" clearable @update:modelValue="doEmit"></va-select>
    <va-select v-model="shadowSize" :options="sizes" label="Size" placeholder="Any size" clearable @update:modelValue="doEmit"></va-select>
    <va-select v-model="shadowAuthor" :options="authors" label="Author" placeholder="Any author" clearable autocomplete highlight-matched-text  @update:modelValue="doEmit"></va-select>
  </nav>
</template>

<style scoped>
.row {
  gap: 1rem;
}
</style>
