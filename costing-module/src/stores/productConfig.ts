import { defineStore } from 'pinia';

export const useProductConfigStore = defineStore('productConfig', {
  state: () => ({
    selectedSizes: [] as string[],
    lpFactor: 1,
    product: null as string | null,
  }),

  actions: {
    setProduct(name: string | null) {
      this.product = name;
    },
    setSizes(sizes: string[]) {
      this.selectedSizes = sizes;
    },
    setLpFactor(val: number) {
      this.lpFactor = val;
    },
  },
});
