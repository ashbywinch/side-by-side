import { ref, toValue, watchEffect } from "vue";

const page = ref(1);
const paginated_items = ref([]);
const numPages = ref(0);

export function setPage(newPage: number) {
  page.value = newPage;
}
export function usePagination(items: [], perPage: number) {
  function paginate() {
    paginated_items.value = toValue(items).slice(
      (page.value - 1) * toValue(perPage),
      page.value * toValue(perPage),
    );
  }
  numPages.value = Math.ceil(toValue(items).length / perPage);
  watchEffect(paginate);
}

export { page, paginated_items, numPages };