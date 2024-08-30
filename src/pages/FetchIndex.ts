import { Ref, ref } from "vue";
import { all_sizes } from "../components/sizes";

const is_loading = ref(false);
const items = ref([]);
const error: Ref<string> = ref("");

async function useFetchIndexItems(lang: string) {
  try {
    is_loading.value = true;
    const url = `/api/books/${lang}/index.jsonl`;
    const response = await fetch(url);
    const text = await response.text();
    const lines = text.split("\n");
    for (const line of lines)
      if (line.length > 0) items.value.push(JSON.parse(line));
    for (const book of items.value) {
      book.size = [...all_sizes]
        .filter(
          (size) =>
            book["Word Count"] > size[1].min &&
            book["Word Count"] <= size[1].max,
        )
        .map((size) => size[0])[0]; // just the name
    }
  } catch (err) {
    error.value = err as string;
  } finally {
    is_loading.value = false;
  }
}

export { useFetchIndexItems, items, error, is_loading };
