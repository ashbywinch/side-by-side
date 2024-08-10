<template>
    <TreeMenu
        :root="tree" 
        :depth="0"   >
    </TreeMenu>
</template>

<script>

import index from '@/assets/index.json'
import TreeMenu from './TreeMenu.vue'

function bookToDom(folderprefix, book) {
    var fullpath = folderprefix == "" ? book : `${folderprefix}/${book}`
    return { label: book, fullpath: fullpath}
}

function folderContentsToDom(folderprefix, contents) {
    return Object.values(contents).map((item) => {
        if (typeof item === "string")
            return bookToDom(folderprefix, item)
        else
            return dictToDom(folderprefix, item)
    })
}

function dictToDom(folderprefix, dict) {
    var item = Object.keys(dict)[0]
    var fullpath = folderprefix == "" ? item : `${folderprefix}/${item}`
    return {
        label: item,
        fullpath: fullpath,
        children:folderContentsToDom(fullpath, dict[item])
    }
}
   
export default {
  name: 'TreeMenuWrapper',   
  components: { TreeMenu },
  data() {
    return {
      tree: dictToDom("", index),
    };
  },
  
};


</script>
