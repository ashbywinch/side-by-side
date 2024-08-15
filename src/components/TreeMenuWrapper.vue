<template>
    <TreeMenu
        :root="tree" 
        :depth="0"   >
    </TreeMenu>
</template>

<script lang="ts">

import index from '@/assets/index.json'
import TreeMenu from './TreeMenu.vue'
import IndexTree from './IndexTree'


type IndexJsonChild = IndexJsonTree|string
type IndexJsonTree = Map<string, IndexJsonChild[]>

function toDom(folderprefix:string, json:IndexJsonChild) : IndexTree {
    const label = typeof(json) == "string" ? json as string : Object.keys(json)[0]
    const fullpath = folderprefix == "" ? label : `${folderprefix}/${label}`
    return { 
        label: label, 
        fullpath: fullpath, 
        children: typeof(json) == "string" ? null : folderContentsToDom(fullpath, Object.values(json)[0])
    }
}

function folderContentsToDom(folderprefix:string, children:IndexJsonChild[]) {
    return children.map((c) => { return toDom(folderprefix, c) })
}

export default {
  name: 'TreeMenuWrapper',   
  components: { TreeMenu },
  data() {
    return {
      tree: toDom("", index),
    };
  },
  
};

</script>
