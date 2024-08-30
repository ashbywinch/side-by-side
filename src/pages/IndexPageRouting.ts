import { useRoute, useRouter } from "vue-router";
import { Filter } from "./Filter";
import { toValue } from "vue";

export function getFilter(route): Filter {
  const query = route.query;
  return new Filter(
    query.level as string,
    query.size as string,
    query.author as string,
  );
}
export function getPage(route) {
  const query = route.query;
  return query.page ? Number(query.page) : 1;
}

// Remove all null items from this query
function newQuery(filter: Filter, page: number) {
  let newQuery = {};
  if (filter.level) newQuery["level"] = toValue(filter.level);
  if (filter.size) newQuery["size"] = toValue(filter.size);
  if (filter.author) newQuery["author"] = toValue(filter.author);
  if (page) newQuery["page"] = page;
  return newQuery;
}

export async function reload(router, route, filter: Filter, page: number) {
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
