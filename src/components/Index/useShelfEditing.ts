import { h, nextTick, onUnmounted, ref, type Ref } from "vue";
import { useToast, type ToastOptions } from "vuestic-ui";

import ShelfUndoToast from "./ShelfUndoToast.vue";
import type { ShelfBook, ShelfCard } from "./shelfCards";
import type { BookIndexEntry } from "@/types/corpus";

export interface ShelfEditingOptions {
  cards: Ref<ShelfCard[]>;
  shown: Ref<ShelfCard[]>;
  section: Ref<HTMLElement | null>;
  editToggle: Ref<HTMLButtonElement | null>;
  reveal: (index: number) => void;
  onRemove: (book: ShelfBook) => void;
  onRestore: (book: ShelfBook) => void;
}

/**
 * Edit mode and its undo stack.
 *
 * The parent owns the store: this composable reports remove/restore through the
 * callbacks. The toast is created on the first removal and its render function
 * reads the stack, so each removal updates the bar in place instead of closing
 * and reopening it. Undo pops the stack; the bar follows, and closes when the
 * stack is empty.
 */
export function useShelfEditing({
  cards,
  shown,
  section,
  editToggle,
  reveal,
  onRemove,
  onRestore,
}: ShelfEditingOptions) {
  const editing = ref(false)
  const removed = ref<ShelfBook[]>([])

  const toast = useToast()
  let toastId: string | null = null

  function toastContent() {
    const title = removed.value[removed.value.length - 1]?.title ?? ""
    return h(ShelfUndoToast, { title, onUndo: undo })
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

  function remove(book: BookIndexEntry, index: number): void {
    const identity: ShelfBook = {
      lang: book.lang,
      author: book.author,
      title: book.title,
    }
    removed.value.push(identity)
    onRemove(identity)
    showToast()
    // After the parent removes the card, the same index is the next book.
    void nextTick(() => focusRemove(index))
  }

  function undo(): void {
    const last = removed.value.pop()
    if (!last) {
      closeToast()
      return
    }
    onRestore(last)
    if (!removed.value.length) closeToast()
    // The restored book's position is not the removal index: find it by identity.
    void nextTick(() => focusBook(last))
  }

  function matches(card: { book: ShelfBook }, book: ShelfBook): boolean {
    return (
      card.book.lang === book.lang &&
      card.book.author === book.author &&
      card.book.title === book.title
    )
  }

  function focusBook(book: ShelfBook): void {
    const index = cards.value.findIndex((card) => matches(card, book))
    if (index < 0) {
      editToggle.value?.focus()
      return
    }

    const visible = shown.value.findIndex((card) => matches(card, book))
    if (visible >= 0) {
      focusRemove(visible)
      return
    }

    // Undo can restore a book beyond the collapsed preview: expand enough to
    // show it, then focus its control once the DOM has caught up.
    reveal(index)
    void nextTick(() => {
      const restored = shown.value.findIndex((card) => matches(card, book))
      if (restored >= 0) {
        focusRemove(restored)
        return
      }
      editToggle.value?.focus()
    })
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

  return {
    editing,
    removed,
    toggleEditing,
    remove,
  }
}
