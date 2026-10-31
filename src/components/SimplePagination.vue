<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps({
  pages: { type: Number, required: true },
  page: { type: Number, default: 1},
  visiblePages: { type: Number, default: 5}
})
const shadowPage = ref(props.page)
const emit = defineEmits(["update-page-value"])

watch(() => props.page, (value) => {
  shadowPage.value = value
})

watch(shadowPage, () => emit('update-page-value', shadowPage.value))

</script>
<template>
    <nav v-if="props.pages > 1">
        <va-pagination
        v-model.number="shadowPage"
        :pages="props.pages"
        :visible-pages="visiblePages"
    ></va-pagination>
    </nav>
</template>

<style scoped>
nav {
  width:100%;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1em;
}
</style>
