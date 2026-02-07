import { defineStore } from 'pinia';

export interface Material {
  name: string;
  qty: number;
  type: 'MAKE' | 'BUY' | null;
}

export const useMaterialsStore = defineStore('materials', {
  state: () => ({
    materials: [
      { name: 'BODY', qty: 1, type: 'MAKE' },
      { name: 'DISC', qty: 1, type: 'MAKE' },
      { name: 'SEAT', qty: 1, type: 'BUY' },
      { name: 'STEM', qty: 1, type: 'BUY' },
      { name: 'PACKING', qty: 1, type: 'BUY' },
      { name: 'OPERATOR', qty: 1, type: 'BUY' },
    ] as Material[],
  }),

  actions: {
    addMaterial(material: Material) {
      this.materials.push(material);
    },

    deleteMaterial(index: number) {
      this.materials.splice(index, 1);
    },
  },
});
