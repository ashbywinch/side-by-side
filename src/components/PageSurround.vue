<script setup lang="ts">
defineProps({
  error: { type:String, required:true},
})
</script>

<template>
  <div>
    <va-navbar color="primary" class="mb-3">
      <va-navbar-item class="logo">Public Domain Books: Side by Side translations</va-navbar-item>
    </va-navbar>
    <va-alert 
    v-if="error"
        color="danger"
    >
        {{ error }}
    </va-alert>
    <div class="container">
        <slot/>
    </div>
  </div>
</template>

<style scoped>
.container {
  margin: 2rem 1rem 1rem 1rem;
}
.va-screen-xs .container {
  margin: 0;
}
header * {
  font-size: 1.2rem !important;
}
header {
  box-shadow: var(--va-card-box-shadow, var(--va-block-box-shadow));
}
.va-alert {
    margin-bottom:2rem;
}
</style>