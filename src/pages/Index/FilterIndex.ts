import { ref, watchEffect, type Ref } from "vue";
import { Filter, FilterRefs } from "@/components/Index/Filter";
import { normaliseLevel } from "@/components/Index/levels";
import type { BookIndexEntry } from "@/types/corpus";

export function useFilter(index: Ref<BookIndexEntry[]>) {
  const filter: FilterRefs = new FilterRefs();
  const filtered_items = ref<BookIndexEntry[]>([]);

  function setFilter(newFilter: Filter) {
    filter.level.value = newFilter.level;
    filter.size.value = newFilter.size;
    filter.author.value = newFilter.author;
  }

  function filterIndex() {
    filtered_items.value = index.value
      ? index.value.filter((book: BookIndexEntry) =>
          filter.matches(
            normaliseLevel(book["Vocab Level"]),
            book.size ?? "",
            book.author,
          ),
        )
      : [];
  }

  watchEffect(filterIndex);
  return { filter, set: setFilter, items: filtered_items };
}
