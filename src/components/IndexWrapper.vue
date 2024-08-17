<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  lang: { type:String, default:"ru"},
});
const url = computed(() => `/api/books/${props.lang}/index.jsonl`);
</script>

<template>
    <LoadingWrapper v-slot="slotProps" :url = url>
        <IndexPage :data="slotProps.data" :test="slotProps.test"/>        
    </LoadingWrapper>
</template>

<script lang="ts">
export default {
  name: "IndexWrapper",
}
</script>