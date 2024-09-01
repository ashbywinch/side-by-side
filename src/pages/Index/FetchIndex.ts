import { all_sizes } from "@/components/sizes";
import { useFetchJsonl } from "@/components/FetchJsonl";
import { ref } from "vue";

export function useFetchIndexItems(lang: string) {
  const error = ref("");
  const is_loading = ref(true);

  const url = `/api/books/${lang}/index.jsonl`;
  const fetchJsonl = useFetchJsonl(url);

  async function doFetch() {
    try {
      is_loading.value = true;

      await fetchJsonl.fetch();
      for (const book of fetchJsonl.items.value) {
        book.size = [...all_sizes]
          .filter(
            (size) =>
              book["Word Count"] > size[1].min &&
              book["Word Count"] <= size[1].max,
          )
          .map((size) => size[0])[0]; // just the name
      }
    } catch (err) {
      error.value = Array([fetchJsonl.error.value, err as string]).join("\n");
    } finally {
      is_loading.value = false;
    }
  }
  return { fetch: doFetch, items: fetchJsonl.items, error, is_loading };
}
