<script setup lang="ts">
import { useActiveBook } from '@/stores/activeBook'

defineProps<{ root: IndexTree, depth: number }>()

</script>
<template>
    <div class="tree-menu">
        <div class="label-wrapper" @click="click()">
          
            <div :style="indent">
              <FontAwesomeIcon v-if="showChildren && root.children" icon="fa-solid fa-folder-open"></FontAwesomeIcon>
              <FontAwesomeIcon v-if="!showChildren && root.children" icon="fa-solid fa-folder-closed"></FontAwesomeIcon>
              {{ root.label }}
            </div>
             
        </div>
        <div v-if="showChildren" >
          <tree-menu 
          v-for="node in root.children"
          v-bind:key="node.fullpath" 
          :root="node" 
          :depth="depth + 1"   
          >
          </tree-menu>
        </div>
            
    </div>

</template>

<script lang="ts">
/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'

/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

/* import specific icons */
import { faFolderClosed, faFolderOpen } from '@fortawesome/free-solid-svg-icons'
import IndexTree from './IndexTree'

/* add icons to the library */
library.add(faFolderClosed, faFolderOpen )

export default {
  name: 'TreeMenu',   
  data() {
    return {
      showChildren: false
    }
  },
  components: { FontAwesomeIcon},
  computed: {
    indent() {
      return { transform: `translate(${this.depth * 1.5}rem)` }
    }
  },
  methods: {
    click() {
      if(this.root.children)
        this.showChildren = !this.showChildren;
      else
        useActiveBook().$patch({activeBook: this.root.fullpath })
    }
  }
}
</script>
<style scoped>
.tree-menu {
  .label-wrapper {
      cursor: pointer;
      padding-bottom: .5rem;
  }
}
svg {
  margin-right: .5rem;
}
</style>