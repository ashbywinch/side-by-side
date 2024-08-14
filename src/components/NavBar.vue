<template>
    <header>
        <nav class="navbar navbar-dark bg-dark">
            <div class="container-fluid">
                <a class="navbar-brand" href="#"></a>
                <BButton @click="toggleNav">
                  <span class="navbar-toggler-icon"></span>
                </BButton>
                <BOffcanvas v-model="show">
                    <div class="offcanvas-header">
                        <h5 class="offcanvas-title" id="offcanvasNavbarLabel">Texts</h5>
                        <BButton @click="toggleNav" type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></BButton>
                    </div>
                    <div class="offcanvas-body">
                        <div id="folder-tree">
                            <TreeMenuWrapper/>
                        </div>
                    </div>
                </BOffcanvas>
            </div>
        </nav>
    </header>

</template>
<script setup lang="ts">
import {ref} from 'vue'

const show = ref(false)

const toggleNav = () => {
  show.value = !show.value
}
</script>

<script lang="ts">
import TreeMenuWrapper from './TreeMenuWrapper.vue';

export default {
  name: 'NavBar',
  components: {
    TreeMenuWrapper,
  },
};


</script>
