<script setup lang="ts">
defineProps<{ title: string }>()
defineEmits<{ remove: [] }>()
</script>

<template>
  <button
    type="button"
    class="remove"
    :aria-label="`Remove ${title} from your shelf`"
    @click="$emit('remove')">
    <span class="remove__disc" aria-hidden="true">
      <va-icon name="close" size="18px" />
    </span>
  </button>
</template>

<style scoped>
/* A 48px target with a 36px disc: the finger gets the platform minimum, the
   card gets a quiet badge. `--remove-top` is measured below the lowest author
   line in the row, so every card keeps the control on one Y. It is an overlay,
   so it adds no height; it may cover the end of the word-count pill, which is
   the accepted trade-off until the pills move. */
.remove {
  position: absolute;
  top: var(--remove-top, 3rem);
  right: .75rem;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  cursor: pointer;
  touch-action: manipulation;
}
.remove__disc {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: var(--va-secondary);
  color: var(--va-text-inverted);
  box-shadow: 0 1px 3px rgb(0 0 0 / 30%);
}
.remove:hover .remove__disc {
  filter: brightness(.92);
}
.remove:focus-visible {
  outline: none;
}
.remove:focus-visible .remove__disc {
  outline: 2px solid var(--va-primary);
  outline-offset: 2px;
}
</style>
