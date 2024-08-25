import { createRouter, createWebHistory } from "vue-router";

import BookView from "./components/BookView.vue";
import IndexView from "./components/IndexView.vue";

const routes = [
  { path: "/", redirect: "/ru/1" },
  { path: "/:lang", name: "Index", component: IndexView, props: true },
  {
    path: "/:lang/:page",
    name: "Index",
    component: IndexView,
    props: (route: { params: { lang: string; page: string } }) => ({
      lang: route.params.lang,
      page: Number.parseInt(route.params.page, 10) || undefined,
    }),
  },
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
