<script setup lang="ts">
defineProps<{ title: string }>()
defineEmits<{ undo: [] }>()
</script>

<template>
  <div class="undo">
    <span class="undo__text">Removed &ldquo;{{ title }}&rdquo;</span>
    <button type="button" class="undo__action" @click.stop="$emit('undo')">
      Undo
    </button>
  </div>
</template>

<style scoped>
.undo {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.undo__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.undo__action {
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
.undo__action:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
</style>

<style>
/* The toast root is teleported to <body>, outside this component's scope. */
.shelf-undo-toast {
  width: calc(100% - 1.5rem);
  max-width: 34rem;
  padding: .75rem 1rem;
  border-radius: .5rem;
  box-shadow: 0 4px 16px rgb(0 0 0 / 25%);
}
</style>
