<script setup lang="ts">
import { usePreferredColorScheme } from '@vueuse/core'
import { RouterLink } from 'vue-router';
import { useColors } from "vuestic-ui";

defineProps({
  error: { type:String, required:true},
})

const preferredColor = usePreferredColorScheme()

const { applyPreset } = useColors();
applyPreset(preferredColor.value)

</script>

<template>
  <div>
    <va-navbar color="primary" class="mb-3">
      <RouterLink :to="{name:'Index'}">
        <va-navbar-item class="logo">
          <va-icon
            class="mr-2"
            name="home"
            size="3rem"
          />
          <span>Public Domain Books: Side by Side translations</span>
        </va-navbar-item>
      </RouterLink>
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
header span {
  font-size: 1.2rem !important;
}
header {
  box-shadow: var(--va-card-box-shadow, var(--va-block-box-shadow));
  padding-top: .5rem;
  padding-bottom: .5rem;
}
.va-alert {
    margin-bottom:2rem;
}
</style>