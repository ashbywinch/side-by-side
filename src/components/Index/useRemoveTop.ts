import { nextTick, onMounted, ref, watch, type Ref } from "vue";

import { removeTop } from "./removePosition";

/**
 * Where the remove overlay sits on a card, measured from the lowest author line
 * in the shelf. Titles wrap to different line counts, so measuring is what lets
 * every card in a row share one Y without growing the cards.
 */
export function useRemoveTop(
  stack: Ref<HTMLElement | null>,
  minWidth: Ref<number>,
  shownLength: () => number,
) {
  const offset = ref(0)

  function measure(): void {
    const element = stack.value
    if (!element) return
    const lines = Array.from(element.querySelectorAll<HTMLElement>(".item"))
      .map((card) => {
        const author = card.querySelector<HTMLElement>(".author")
        if (!author) return null
        const cardBox = card.getBoundingClientRect()
        const authorBox = author.getBoundingClientRect()
        return { top: cardBox.top, bottom: authorBox.bottom }
      })
      .filter((line): line is { top: number; bottom: number } => line !== null)
    offset.value = removeTop(lines)
  }

  onMounted(() => {
    void nextTick(measure)
    void document.fonts?.ready.then(() => nextTick(measure))
  })
  watch([shownLength, minWidth], () => {
    void nextTick(measure)
  })

  return offset
}
