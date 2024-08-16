import { defineStore } from "pinia";
import { useFetch } from "@vueuse/core";
import IndexTree from "./IndexTree.js";
import { computed, ref } from "vue";

type JsonIndexChild = string | JsonIndexTree;
type JsonIndexTree = Map<string, JsonIndexChild[]>;

function jsonChildrenToDom(
  folderprefix: string,
  children: JsonIndexChild[],
): IndexTree[] {
  return (children as JsonIndexChild[]).map((c) =>
    jsonChildToDom(folderprefix, c),
  );
}

function jsonChildToDom(
  folderprefix: string,
  child: JsonIndexChild,
): IndexTree {
  const label = typeof child == "string" ? child : Object.keys(child)[0];
  const fullpath = folderprefix == "" ? label : `${folderprefix}/${label}`;
  return {
    label: label,
    fullpath: fullpath,
    children:
      typeof child == "string"
        ? null
        : jsonChildrenToDom(fullpath, Object.values(child)[0]),
  };
}

export const useIndexStore = defineStore("indexStore", () => {
  const lang = ref();

  const url = computed(() => `/api/books/${lang.value}/index.json`);
  const { data, isFetching, error, execute } = useFetch(url, {
    immediate: false,
    afterFetch(ctx) {
      ctx.data = jsonChildToDom("", ctx.data);
      return ctx;
    },
  })
    .get()
    .json();

  const index = computed(() => data.value);

  const fetchIndex = (_lang: string, throwOnError: boolean) => {
    lang.value = _lang;
    return execute(throwOnError);
  };

  return { index, isFetching, error, fetchIndex };
});
