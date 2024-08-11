import { defineStore } from 'pinia'
import index from '@/assets/index.json'


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


export const useIndex = defineStore('index', {
  state: () => ({
    /** @type {{ current: string, translation: string, filename: string }[]} */
    _index: [],
  }),
  getters: {
    /**
     * @returns {{ current: string, translation: string, filename: string }[]}
     */
    index(state) {
      this.load(state)
      return state._index;
    },
    load(state) {
      if(state.index.length == 0){
        state.index = dictToDom("", index)
      }
    }
  },
})