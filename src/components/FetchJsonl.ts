import { ref, type Ref } from "vue";

export function useFetchJsonl<T = Record<string, unknown>>(url: string) {
  const is_loading = ref(false);
  const items = ref<T[]>([]) as Ref<T[]>;
  const error: Ref<string> = ref("");

  async function doFetch() {
    try {
      is_loading.value = true;
      const response = await fetch(url);
      const text = await response.text();
      const lines = text.split("\n");
      for (const line of lines) {
        if (line.length > 0) items.value.push(JSON.parse(line) as T);
      }
    } catch (err) {
      error.value = err as string;
    } finally {
      is_loading.value = false;
    }
  }
  return { fetch: doFetch, items, error, is_loading };
}
