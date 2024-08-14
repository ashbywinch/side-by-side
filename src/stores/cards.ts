import { defineStore } from 'pinia'
import { useActiveBook } from './activeBook'

import path from 'path';

const require = async fileName => {
  try {
    const files = import.meta.glob("@/assets/**/*.jsonl", { eager: true })
    return files[fileName]?.default || {}
  }
  catch (e) {
    console.warn(`The file "{fileName}" could not be loaded.`)
    return {}
  }
}

export const useCards = defineStore('cards', {
  
  state: () => ({
    /** @type {{ filename: string, index_in_file: Number, current: string, translation: string  }[]} */
    allCards: [],
    /** @type string */
    activeBook: '',
  }),
  getters: {
    /**
     * @returns {{ filename: string, index_in_file: Number, current: string, translation: string }[]}
     */
    cards(state) {
      return state.allCards;
    },
    /**
     * @returns string
     */
    title(state) {
      return state.activeBook ? path.parse(state.activeBook).name : "";
    },
  },
  actions: {
    
    load() {
      var jsonfilename = "/src/assets/" + path.format({ ...path.parse(this.activeBook), base: '', ext: '.jsonl' })
      require(jsonfilename).then((jsonl) => {
        this.allCards = jsonl
      })
    },
    setActiveBook(activeBook) {
      this.activeBook = activeBook
      this.load()
    }
  }
})