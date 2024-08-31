import { all_sizes } from "@/components/sizes";
import {
  error,
  is_loading,
  items,
  useFetchJsonl,
} from "@/components/FetchJsonl";

async function useFetchIndexItems(lang: string) {
  try {
    const url = `/api/books/${lang}/index.jsonl`;
    await useFetchJsonl(url);
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
