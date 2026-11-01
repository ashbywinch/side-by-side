import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

import BookPage from "./pages/Book/BookPage.vue";
import IndexPage from "./pages/Index/IndexPage.vue";
import ShelfPage from "./pages/Shelf/ShelfPage.vue";

const routes: RouteRecordRaw[] = [
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
    path: "/:lang/shelf",
    name: "Shelf",
    component: ShelfPage,
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

// The bookshelf-presentation comparison runs against a dev-only switch; it is
// removed once the walkthrough chooses a variant.
if (import.meta.env.DEV) {
  routes.push({
    path: "/:lang/lab/:variant",
    name: "Lab",
    component: () => import("./pages/Dev/LayoutLab.vue"),
    props: true,
  });
}

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

// A walk comparison must survive "leave the site and come back": the root and
// the index link stay inside the concept this session was given. Dev only.
if (import.meta.env.DEV) {
  router.beforeEach((to) => {
    const variant = window.sessionStorage.getItem("lab-variant");
    if (!variant) return;
    if (to.name === "Index") {
      return { name: "Lab", params: { lang: "ru", variant } };
    }
  });
}

export default router;
