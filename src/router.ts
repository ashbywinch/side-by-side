import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
  type RouteRecordRaw,
} from "vue-router";

import BookPage from "./pages/Book/BookPage.vue";
import IndexPage from "./pages/Index/IndexPage.vue";

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
    path: "/:lang/book/:author/:title",
    name: "Book",
    component: BookPage,
    props: true,
  },
];

/**
 * Most routes start at the top. A book owns its own scroll instead: it has a
 * stored reading position to restore, and it resets the window itself when it
 * has none. Letting the router scroll a book would overwrite that restore,
 * because the router's scroll lands after the book has scrolled to its place.
 */
export function scrollBehavior(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  savedPosition: { left: number; top: number } | null,
) {
  if (savedPosition) return savedPosition;
  if (to.name === "Book") return false;
  return { top: 0 };
}

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior,
});

export default router;
