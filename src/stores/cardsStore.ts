import { defineStore } from "pinia";

import { computed, Ref, ref } from "vue";
import { useFetch } from "@vueuse/core";

export const useCardStore = defineStore("cardStore", () => {
  const _lang: Ref<string | undefined> = ref();
  const _author: Ref<string | undefined> = ref();
  const _title: Ref<string | undefined> = ref();

  const url = computed(
    () => `/api/books/${_lang.value}/${_author.value}/${_title.value}.jsonl`,
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

  const fetchCards = (lang: string, author: string, title: string) => {
    _lang.value = lang;
    _author.value = author;
    _title.value = title;
    return execute(true);
  };

  return { cards, isFetching, error, fetchCards };
});
