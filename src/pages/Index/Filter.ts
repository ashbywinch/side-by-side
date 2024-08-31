import { ref, Ref } from "vue";

export class Filter {
  constructor(level: string, size: string, author: string) {
    this.level = level;
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
    return (
      (!this.level.value || level == this.level.value) &&
      (!this.size.value || size == this.size.value) &&
      (!this.author.value || author == this.author.value)
    );
  }
}
