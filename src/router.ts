import { createRouter, createWebHistory } from "vue-router";

import BookView from "./components/BookView.vue";
import IndexWrapper from "./components/IndexWrapper.vue";

const routes = [
  { path: "/", redirect: "/ru" },
  { path: "/:lang", name: "Index", component: IndexWrapper },
  {
    path: "/books/:lang/:author/:title",
    name: "Book",
    component: BookView,
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
