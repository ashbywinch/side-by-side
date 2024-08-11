import { defineStore } from 'pinia'
import { useActiveBook } from './activeBook'

import jsonl from '@/assets/cards.jsonl'
var path = require('path');

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
      const store = useActiveBook()
      state.load()
      return state.allCards.filter((card)=> card.filename == store.activeBook);
    },
    /**
     * @returns string
     */
    title(state) {
      state.load()
      return state.activeBook ? path.parse(state.activeBook).name : "";
    },
  },
  actions: {
    load() {
      if(this.allCards.length == 0){
        this.allCards = jsonl.slice(1);
      }
    },
    setActiveBook(activeBook) {
      this.activeBook = activeBook
    }
  },
})