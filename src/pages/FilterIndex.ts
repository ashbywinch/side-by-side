import { ref, watchEffect } from "vue";
import { Filter, FilterRefs } from "./Filter";

const filter: FilterRefs = new FilterRefs();

const filtered_items = ref([]);

export function setFilter(newFilter: Filter) {
  filter.level.value = newFilter.level;
  filter.size.value = newFilter.size;
  filter.author.value = newFilter.author;
}
export function useFilter(index) {
  function filterIndex() {
    filtered_items.value = index.value
      ? index.value.filter((book) =>
          filter.matches(book["Vocab Level"], book.size, book.author),
        )
      : [];
  }
  watchEffect(filterIndex);
}

export { filtered_items, filter };
