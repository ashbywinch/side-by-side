import { createRouter, createWebHistory } from "vue-router";

import BookView from "./components/BookView.vue";
import IndexView from "./components/IndexView.vue";

const routes = [
  { path: "/", redirect: "/ru" },
  { path: "/:lang", name: "Index", component: IndexView, props: true },
  {
    path: "/:lang/:author/:title",
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
