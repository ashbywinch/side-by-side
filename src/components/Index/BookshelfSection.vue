<script setup lang="ts">
import { computed, h, nextTick, onUnmounted, ref, watch } from "vue";
import { useToast, type ToastOptions } from "vuestic-ui";

import BookOverviewCard from "./BookOverviewCard.vue";
import { levelLabel } from "./levels";
import { shelfCards } from "./shelfCards";
import { progressFraction } from "@/components/Bookshelf/bookshelf";
import { useCardMinWidth } from "./useCardMinWidth";
import type { PropType } from "vue";
import type { BookIndexEntry } from "@/types/corpus";
import type { Book, BookshelfEntry } from "@/types/bookshelf";

const VISIBLE = 3;
const STEP = 12;

type ShelfBook = Pick<Book, "lang" | "author" | "title">;

const props = defineProps({
  books: { type: Array as PropType<BookIndexEntry[]>, required: true },
  entries: { type: Array as PropType<BookshelfEntry[]>, default: () => [] },
})

const emit = defineEmits<{
  remove: [book: ShelfBook]
  restore: [book: ShelfBook]
}>()

const cards = computed(() => shelfCards(props.books, props.entries))
const limit = ref(VISIBLE)
const shown = computed(() => cards.value.slice(0, limit.value))
const expanded = computed(
  () => cards.value.length > VISIBLE && limit.value > VISIBLE,
)
const remaining = computed(() =>
  Math.max(cards.value.length - shown.value.length, 0),
)
const nextStep = computed(() => Math.min(STEP, remaining.value))

// If removals shrink the shelf below the preview size, forget the expansion;
// restoring a book must not silently re-expand a shelf the reader collapsed.
watch(
  () => cards.value.length,
  (count) => {
    if (count <= VISIBLE) limit.value = VISIBLE
  },
)

const stack = ref<HTMLElement | null>(null)
const section = ref<HTMLElement | null>(null)
const headerToggle = ref<HTMLButtonElement | null>(null)
const bottomCollapse = ref<HTMLButtonElement | null>(null)
const editToggle = ref<HTMLButtonElement | null>(null)

const minWidth = useCardMinWidth(stack)

const editing = ref(false)
const removed = ref<Array<{ book: ShelfBook; index: number }>>([])

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
}

function scrollToShelf(): void {
  section.value?.scrollIntoView?.({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  })
}

function toggle(): void {
  if (expanded.value) {
    collapse()
    return
  }
  limit.value = Math.min(cards.value.length, STEP)
  void nextTick(scrollToShelf)
}

function showMore(): void {
  const atEnd = limit.value + STEP >= cards.value.length
  limit.value = Math.min(cards.value.length, limit.value + STEP)
  if (atEnd) {
    // The control is removed once the last book is shown; keep the keyboard
    // user on a control that still exists.
    void nextTick(() => bottomCollapse.value?.focus())
  }
}

function collapse(): void {
  limit.value = VISIBLE
  void nextTick(() => {
    headerToggle.value?.focus()
    scrollToShelf()
  })
}

/*
 * Removal and undo.
 *
 * The toast is created on the first removal and its render function reads the
 * stack, so each removal updates the bar in place instead of closing and
 * reopening it. Undo pops the stack; the bar follows, and closes when the stack
 * is empty. The parent owns the store: it sees `remove` and `restore` and
 * writes the tombstone through `useBookshelf`.
 */
const toast = useToast()
let toastId: string | null = null

function toastContent() {
  const title = removed.value[removed.value.length - 1]?.book.title ?? ""
  return h("div", { class: "undo" }, [
    h("span", { class: "undo__text" }, `Removed \u201c${title}\u201d`),
    h(
      "button",
      {
        class: "undo__action",
        type: "button",
        onClick: (event: MouseEvent) => {
          event.stopPropagation()
          undo()
        },
      },
      "Undo",
    ),
  ])
}

function showToast(): void {
  if (toastId) return
  toastId = toast.notify({
    render: toastContent,
    duration: 0,
    position: "bottom-center",
    closeable: false,
    role: "status",
    color: "secondary",
    customClass: "shelf-undo-toast",
    offsetY: 24,
  } as ToastOptions & { role: "status" })
  // Vuestic's own `role` attribute resolves to `alertdialog`; the prop still
  // gives the bar an `aria-live="polite"` region, which is what announces the
  // removal. The outer role is a known mismatch in the library.
}

function closeToast(): void {
  if (!toastId) return
  toast.close(toastId)
  toastId = null
}

function toggleEditing(): void {
  if (!editing.value) {
    editing.value = true
    return
  }
  editing.value = false
  removed.value = []
  closeToast()
}

function onRemove(book: BookIndexEntry, index: number): void {
  const identity: ShelfBook = {
    lang: book.lang,
    author: book.author,
    title: book.title,
  }
  removed.value.push({ book: identity, index })
  emit("remove", identity)
  showToast()
  void nextTick(() => focusRemove(index))
}

function undo(): void {
  const last = removed.value.pop()
  if (!last) {
    closeToast()
    return
  }
  emit("restore", last.book)
  if (!removed.value.length) closeToast()
  void nextTick(() => focusRemove(last.index))
}

function focusRemove(index: number): void {
  const buttons = section.value?.querySelectorAll<HTMLButtonElement>(".remove")
  if (buttons?.length) {
    buttons[Math.min(Math.max(index, 0), buttons.length - 1)]?.focus()
    return
  }
  editToggle.value?.focus()
}

onUnmounted(closeToast)
</script>

<template>
  <section
    v-if="cards.length || editing"
    ref="section"
    class="shelf"
    :class="{ 'shelf--undo': removed.length }"
    aria-labelledby="shelf-title">
    <div class="shelf__head">
      <h2 id="shelf-title" class="shelf__title">You&rsquo;re reading&hellip;</h2>
      <div class="shelf__actions">
        <button
          v-if="cards.length > VISIBLE"
          ref="headerToggle"
          type="button"
          class="text-action shelf__toggle"
          :aria-expanded="expanded"
          aria-controls="shelf-grid"
          @click="toggle">
          {{ expanded ? "Show less" : `See all ${cards.length} books` }}
        </button>
        <button
          v-if="cards.length > 0 || editing"
          ref="editToggle"
          type="button"
          class="text-action shelf__edit"
          @click="toggleEditing">
          {{ editing ? "Done" : "Edit" }}
        </button>
      </div>
    </div>

    <p v-if="!cards.length" class="shelf__empty">Your shelf is empty.</p>
    <div
      v-else
      id="shelf-grid"
      ref="stack"
      class="stack"
      :style="minWidth ? { '--card-min': `${minWidth}px` } : undefined">
      <BookOverviewCard
        v-for="({ book, entry }, index) in shown"
        :key="book.author + ': ' + book.title"
        :lang="book.lang"
        :title="book.title"
        :author="book.author"
        :level="levelLabel(book['Vocab Level'])"
        :words="book['Word Count']"
        :size="book.size ?? ''"
        :progress="progressFraction(entry)"
        :editing="editing"
        @remove="onRemove(book, index)" />
    </div>

    <div v-if="expanded" class="shelf__foot">
      <button
        v-if="remaining > 0"
        type="button"
        class="text-action shelf__more"
        @click="showMore">
        Show {{ nextStep }} more
      </button>
      <button
        ref="bottomCollapse"
        type="button"
        class="text-action shelf__collapse"
        @click="collapse">
        Show less
      </button>
    </div>
  </section>
</template>

<style scoped>
.shelf {
  margin: .75rem 0 1rem;
  scroll-margin-top: 1rem;
}
/* The undo bar is fixed to the viewport; leave room under the last row and the
   collapse controls so it never covers them. */
.shelf--undo {
  padding-bottom: 5rem;
}
.shelf__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: .25rem .75rem;
  margin-bottom: .5rem;
}
.shelf__title {
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
}
.shelf__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: .25rem .75rem;
  margin-left: auto;
}
.shelf__empty {
  margin: 0 0 .5rem;
  color: var(--va-text-secondary);
}
.text-action {
  min-height: 2.75rem;
  padding: .25rem 0;
  border: 0;
  background: none;
  color: var(--va-primary);
  font: inherit;
  font-size: .85rem;
  font-weight: 400;
  cursor: pointer;
}
.text-action:hover {
  text-decoration: underline;
}
.text-action:focus-visible {
  outline: 2px solid var(--va-primary);
  outline-offset: 2px;
}
.shelf__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: .25rem 1.5rem;
  margin-top: .75rem;
}
.stack {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 1rem;
}
.stack > * {
  flex: 0 0 auto;
  min-width: 0;
}
/* A pointer does not need the phone-sized hit area; keep the header quiet on a
   desktop while leaving the 44px target on touch. */
@media (pointer: fine) {
  .text-action {
    min-height: auto;
    padding-block: .1rem;
  }
}
</style>

<style>
/* The toast is teleported to <body>, outside this component's scope. */
.shelf-undo-toast {
  width: calc(100% - 1.5rem);
  max-width: 34rem;
  padding: .75rem 1rem;
  border-radius: .5rem;
  box-shadow: 0 4px 16px rgb(0 0 0 / 25%);
}
.shelf-undo-toast .undo {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.shelf-undo-toast .undo__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.shelf-undo-toast .undo__action {
  flex: 0 0 auto;
  min-height: 2.75rem;
  padding: 0 .5rem;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}
.shelf-undo-toast .undo__action:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
</style>
