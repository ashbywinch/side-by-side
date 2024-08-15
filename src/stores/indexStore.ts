import { defineStore } from "pinia";
import indexjson from "@/assets/index.json";
import IndexTree from "./IndexTree.js";

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
  console.log(label);
  const fullpath = folderprefix == "" ? label : `${folderprefix}/${label}`;
  return {
    label: label,
    fullpath: fullpath,
    children:
      typeof child == "string"
        ? []
        : jsonChildrenToDom(fullpath, Object.values(child)[0]),
  };
}

export const useIndexStore = defineStore("index", {
  state: () => ({
    _index: IndexTree,
  }),
  getters: {
    index(state): IndexTree {
      if (this._index.length == 0) {
        // @ts-expect-error: Property 'prototype' is missing in type 'IndexTree' but required in type 'typeof IndexTree'.ts(2741)
        state._index = jsonChildToDom("", indexjson as JsonIndexTree);
      }
      // @ts-expect-error: Type 'typeof IndexTree' is missing the following properties from type 'IndexTree': label, fullpath, childrents(2739)
      return state._index;
    },
  },
});
