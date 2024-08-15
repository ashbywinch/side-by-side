import { expect, test } from "vitest";
import { useIndexStore } from "@/stores/indexStore";
import { setActivePinia, createPinia } from "pinia";
import { createApp } from "vue";

const app = createApp({});
const pinia = createPinia();
app.use(pinia);
setActivePinia(pinia);

test("Index loading", () => {
  var indexStore = useIndexStore();
  expect(indexStore.index);
});
