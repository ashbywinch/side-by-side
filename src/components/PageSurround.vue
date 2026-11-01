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
  <div :class="($matches && $matches.xs.only) ? 'screen-xs' : ''">
    <va-navbar color="primary" class="mb-3">
      <RouterLink :to="{name:'Index'}" class="brand">
        <va-navbar-item class="logo">
          <va-icon
            class="mr-2"
            name="home"
            size="3rem"
          />
          <span class="brand__name">Public Domain Books: Side by Side translations</span>
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
  margin: 1rem;
}
.screen-xs .container {
  margin: 0 .75rem;
}

header span {
  font-size: 1.2rem !important;
}
/* The brand is a link inside a primary-coloured bar: it takes the bar's text
   colour, not the page link colour, or the site's own name is unreadable. */
.brand {
  color: inherit;
  text-decoration: none;
}
.brand__name {
  display: inline-block;
  max-width: 22ch;
  line-height: 1.25 !important;
}
.screen-xs .brand__name {
  font-size: 1rem !important;
  max-width: 18ch;
}
header {
  box-shadow: var(--va-card-box-shadow, var(--va-block-box-shadow));
  padding-top: .5rem;
  padding-bottom: .5rem;
  margin-bottom: 0 !important;
}

.va-alert {
    margin-bottom:2rem;
}
.screen-xs .va-alert {
    margin-bottom:0;
}
</style>