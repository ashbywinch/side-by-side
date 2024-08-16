import { defineStore } from "pinia";

import { computed, Ref, ref } from "vue";
import { useFetch } from "@vueuse/core";
import path from "path";

export const useCardStore = defineStore("cardStore", () => {
  const _activeBook: Ref<string | undefined> = ref();

  const url = computed(() =>
    _activeBook.value
      ? `/api/books/${path.format({
          ...path.parse(_activeBook.value as string),
          base: "",
          ext: ".jsonl",
        })}`
      : "",
  );

  function jsonlParse(code: string) {
    const result = [];
    for (const line of code.split("\n")) {
      if (line.length > 0) result.push(JSON.parse(line));
    }
    return result;
  }

  const { data, isFetching, error, execute } = useFetch(url, {
    immediate: false,
    afterFetch(ctx) {
      ctx.data = jsonlParse(ctx.data);
      return ctx;
    },
  }).get();

  const cards = computed(() => data.value);
  const title = computed(() =>
    _activeBook.value ? path.parse(_activeBook.value).name : "",
  );

  const fetchCards = (activeBook: string, throwOnError: boolean) => {
    _activeBook.value = activeBook;
    return execute(throwOnError);
  };

  return { cards, title, isFetching, error, fetchCards };
});
