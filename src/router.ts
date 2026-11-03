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
 * Every route starts at the top unless it is a history traversal. A book that
 * has a stored reading position scrolls there itself, after it renders; the
 * window itself must never inherit the previous page's offset, or a book opens
 * part-way down and then scrolls back up.
 */
export function scrollBehavior(
  _to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  savedPosition: { left: number; top: number } | null,
) {
  return savedPosition ?? { top: 0 };
}

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior,
});

export default router;
