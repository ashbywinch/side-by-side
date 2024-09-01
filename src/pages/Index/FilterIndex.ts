import { ref, watchEffect } from "vue";
import { Filter, FilterRefs } from "./Filter";

export function useFilter(index) {
  const filter: FilterRefs = new FilterRefs();
  const filtered_items = ref([]);

  function setFilter(newFilter: Filter) {
    filter.level.value = newFilter.level;
    filter.size.value = newFilter.size;
    filter.author.value = newFilter.author;
  }

  function filterIndex() {
    filtered_items.value = index.value
      ? index.value.filter((book) =>
          filter.matches(book["Vocab Level"], book.size, book.author),
        )
      : [];
  }

  watchEffect(filterIndex);
  return { filter, set: setFilter, items: filtered_items };
}
