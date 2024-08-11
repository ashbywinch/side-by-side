import { expect, test } from 'vitest'
import { useIndex } from '@/stores/index.js'
import { setActivePinia, createPinia } from 'pinia'
import { createApp } from 'vue'

const app = createApp({})
const pinia = createPinia()
app.use(pinia)
setActivePinia(pinia)

test('Index loading', () => {
    var indexStore = useIndex()
    expect(indexStore.index)
})