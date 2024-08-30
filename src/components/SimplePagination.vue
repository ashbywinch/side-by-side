<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps({
  items: { type:Number, required:true },
  perPage: { type: Number, default: 24 },
  page: { type: Number, default: 1}
})
const shadowPage = ref(props.page)
const emit = defineEmits(["update-page-value"])

watch(shadowPage, () => emit('update-page-value', shadowPage.value))

</script>
<template>
    <nav v-if="props.items > props.perPage">
        <va-pagination
        v-if="props.items > 0"
        v-model.number="shadowPage"
        :pages="Math.ceil(props.items / props.perPage)"
        :visible-pages="1"
    ></va-pagination>
    </nav>
</template>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>
<style scoped>
nav {
  width:100%;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1em;
}
</style>