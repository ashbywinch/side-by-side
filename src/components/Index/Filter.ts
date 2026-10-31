import { ref, Ref } from "vue";
import { normaliseLevel, normaliseLevelFilter } from "./levels";

export class Filter {
  constructor(level: string, size: string, author: string) {
    this.level = normaliseLevelFilter(level);
    this.size = size;
    this.author = author;
  }
  level: string = "";
  size: string = "";
  author: string = "";
}

export class FilterRefs {
  level: Ref<string> = ref("");
  size: Ref<string> = ref("");
  author: Ref<string> = ref("");
  matches(level: string, size: string, author: string): boolean {
    const wanted = normaliseLevelFilter(this.level.value);
    const bookLevel = normaliseLevel(level);
    const levelMatches =
      !wanted ||
      (wanted === "unrated" ? bookLevel === "" : bookLevel === wanted);

    return (
      levelMatches &&
      (!this.size.value || size == this.size.value) &&
      (!this.author.value || author == this.author.value)
    );
  }
}
