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
  scrollBehavior(to, _from, savedPosition) {
    // A book restores its own viewport from the stored position; only history
    // traversal (back/forward) gets the browser's remembered offset.
    if (to.name === "Book") return savedPosition ?? false;
    if (savedPosition) return savedPosition;
    return { top: 0 };
  },
});

export default router;
