import { Ref, ref } from "vue";

export function useFetchJsonl(url: string) {
  const is_loading = ref(false);
  const items = ref([]);
  const error: Ref<string> = ref("");

  async function doFetch() {
    try {
      is_loading.value = true;
      const response = await fetch(url);
      const text = await response.text();
      const lines = text.split("\n");
      for (const line of lines) {
        if (line.length > 0) items.value.push(JSON.parse(line));
      }
    } catch (err) {
      error.value = err as string;
    } finally {
      is_loading.value = false;
    }
  }
  return { fetch: doFetch, items, error, is_loading };
}
