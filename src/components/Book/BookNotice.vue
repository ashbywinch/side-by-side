<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: "inline" | "floating";
  }>(),
  { variant: "inline" },
)
</script>

<template>
  <div :class="['book-notice', `book-notice--${variant}`]">
    <span class="book-notice__text" role="status">
      <slot name="text" />
    </span>
    <span class="book-notice__actions">
      <slot />
    </span>
  </div>
</template>

<style scoped>
.book-notice {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: .25rem .75rem;
  font-size: .9rem;
  line-height: 1.35rem;
}

.book-notice__text {
  color: var(--va-text-secondary, inherit);
}

.book-notice__text strong {
  font-weight: 600;
  color: var(--va-text-primary, inherit);
}

.book-notice__actions {
  display: flex;
  align-items: center;
  gap: .25rem;
  margin-left: auto;
}

.book-notice__actions :deep(.va-button) {
  min-height: 2.25rem;
}

.book-notice--inline {
  justify-content: center;
  max-width: 50rem;
  margin: 0 auto 1rem;
}

.book-notice--inline .book-notice__actions {
  margin-left: 0;
}

/* A resting bookmark strip: chrome over the page, never part of it. */
.book-notice--floating {
  position: fixed;
  left: 50%;
  bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  z-index: 10;
  width: min(100% - 1.5rem, 50rem);
  padding: .4rem .5rem .4rem .9rem;
  border: 1px solid var(--va-divider, rgb(128 128 128 / 25%));
  border-radius: .75rem;
  background: var(--va-background-primary, #fff);
  box-shadow: var(--va-card-box-shadow, 0 2px 10px rgb(0 0 0 / 12%));
}

@media (width <= 640px) {
  .book-notice--floating .book-notice__actions {
    margin-left: auto;
  }
}
</style>
