import { Filter } from "@/components/Index/Filter";
import { toValue } from "vue";
import type { RouteLocationNormalized, Router } from "vue-router";

export function useIndexRouting() {
  function getFilter(route: RouteLocationNormalized): Filter {
    const query = route.query;
    return new Filter(
      query.level as string,
      query.size as string,
      query.author as string,
    );
  }
  function getPage(route: RouteLocationNormalized): number {
    const query = route.query;
    return Number(query.page ?? 1);
  }

  // Remove all null items from this query
  function newQuery(filter: Filter, page: number) {
    const query: Record<string, string | number> = {};
    if (filter.level) query["level"] = toValue(filter.level);
    if (filter.size) query["size"] = toValue(filter.size);
    if (filter.author) query["author"] = toValue(filter.author);
    if (page) query["page"] = page;
    return query;
  }

  async function reload(
    router: Router,
    route: RouteLocationNormalized,
    filter: Filter,
    page: number,
  ) {
    const query = route.query;
    if (
      query.level == toValue(filter.level) &&
      query.size == toValue(filter.size) &&
      query.author == toValue(filter.author) &&
      Number(query.page) == page
    ) {
      return; // avoid redirect loops
    }
    router.push({
      name: route.name,
      params: route.params,
      query: newQuery(filter, page),
    });
  }
  return { getPage, getFilter, reload };
}
