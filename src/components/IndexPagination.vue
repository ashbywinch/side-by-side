<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps({
  books: { type:Array<Map<string, string>>, required:true},
  perPage: { type: Number, default: 24 },
  page: { type: Number, default: 1}
})
const shadowPage = ref(props.page)
const emit = defineEmits(["update-page-value"])

watch(shadowPage, () => emit('update-page-value', shadowPage.value))

</script>
<template>
    <nav v-if="books.length > props.perPage">
        <b-pagination
        v-if="books.length > 0"
        v-model.number="shadowPage"
        :total-rows="books.length"
        :per-page="perPage"
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