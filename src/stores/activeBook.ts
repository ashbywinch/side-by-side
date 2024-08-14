import { defineStore } from 'pinia'


export const useActiveBook = defineStore('activeBook', {
    state: () => ({
      /** @type string */
      activeBook: '',
    }),
  })