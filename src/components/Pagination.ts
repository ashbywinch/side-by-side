import { ref, toValue, watchEffect } from "vue";

export function usePagination(items: [], perPage: number) {
  const page = ref(1);
  const paginatedItems = ref([]);
  const numPages = ref(0);

  function setPage(newPage: number) {
    page.value = newPage;
  }
  function paginate() {
    paginatedItems.value = toValue(items).slice(
      (page.value - 1) * toValue(perPage),
      page.value * toValue(perPage),
    );
    numPages.value = Math.ceil(toValue(items).length / perPage);
  }
  watchEffect(paginate);
  return { page: page, set: setPage, numPages, items: paginatedItems };
}
