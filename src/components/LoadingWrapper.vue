<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps({
  url: { type:String, required:true},
})

const loading = ref(false)
const response = ref(null)
const data = ref(null)
const error = ref(null)

// watch the URL to fetch the data
watch(() => props.url, fetchData, { immediate: true })

const test = ref("test")

function jsonlParse(code: string) {
    const result = [];
    for (const line of code.split("\n")) {
      if (line.length > 0) result.push(JSON.parse(line));
    }
    return result;
  }

async function fetchData(url) {
  error.value = response.value = null
  loading.value = true
  
  try {
    response.value = await fetch(url)
    data.value = jsonlParse(await response.value.text())
  } catch (err) {
    error.value = err.toString()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <BAlert show="error.value" variant="danger">{{error}}</BAlert>
  <BOverlay :show="loading">
    <slot :data = data :test="test"/>  
  </BOverlay>
</template>

<script lang="ts"> 
export default {
  name: "LoadingWrapper",
};
</script>
