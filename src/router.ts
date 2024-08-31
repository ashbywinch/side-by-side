import { createRouter, createWebHistory } from "vue-router";

import BookPage from "./pages/Book/BookPage.vue";
import IndexPage from "./pages/Index/IndexPage.vue";

const routes = [
  { path: "/", redirect: "/ru/books" },
  {
    path: "/:lang/books",
    name: "Index",
    component: IndexPage,
    props: (route: { params: { lang: string } }) => ({
      lang: route.params.lang,
    }),
  },
  {
    path: "/:lang/book/:author/:title",
    name: "Book",
    component: BookPage,
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
