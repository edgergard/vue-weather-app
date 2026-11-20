import { ref } from 'vue'
import { defineStore } from 'pinia'
import { DEFAULT_SKY, type Sky } from '../lib/sky'

/** The sky currently painted behind the whole app. Pages decide which place it reflects. */
export const useSkyStore = defineStore('sky', () => {
  const sky = ref<Sky>(DEFAULT_SKY)
  const set = (next: Sky | null | undefined) => {
    sky.value = next ?? DEFAULT_SKY
  }
  return { sky, set }
})
