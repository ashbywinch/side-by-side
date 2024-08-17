import { expect, test } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { createApp } from "vue";

const app = createApp({});
const pinia = createPinia();
app.use(pinia);
setActivePinia(pinia);

test("Stub", () => {
  expect(2);
});
