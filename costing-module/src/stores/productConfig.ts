import { defineStore } from 'pinia';

export const useProductConfigStore = defineStore('productConfig', {
  state: () => ({
    selectedSizes: [] as string[],
    lpFactor: 1,
  }),

  actions: {
    setSizes(sizes: string[]) {
      this.selectedSizes = sizes;
    },
    setLpFactor(val: number) {
      this.lpFactor = val;
    },
  },
});
