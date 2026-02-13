import { defineStore } from 'pinia';

export interface ProcessSourcing {
  processType: string;
  suppliers: string[];
}

export interface Material {
  id: string;
  name: string;
  qty: number;
  type: 'MAKE' | 'BUY' | null;
  sourcing: ProcessSourcing[];
  children?: Material[];
}

export const useMaterialsStore = defineStore('materials', {
  state: () => ({
    materials: [
      {
        id: crypto.randomUUID(),
        name: 'BODY',
        qty: 1,
        type: 'MAKE',
        sourcing: [
          {
            processType: 'SAND CAST',
            suppliers: ['IRONCORE CASTINGS PVT. LTD.'],
          },
          {
            processType: 'INVESTMENT CASTING',
            suppliers: ['PRIMECAST ENGINEERING'],
          },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: 'DISC',
        qty: 1,
        type: 'MAKE',
        sourcing: [
          {
            processType: 'SAND CAST',
            suppliers: ['STEELFLOW COMPONENTS'],
          },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: 'SEAT',
        qty: 1,
        type: 'BUY',
        sourcing: [
          {
            processType: 'BROUGHT OUT',
            suppliers: ['WAFERSEAL TECHNOLOGIES'],
          },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: 'STEM',
        qty: 1,
        type: 'BUY',
        sourcing: [
          {
            processType: 'BROUGHT OUT',
            suppliers: ['FLOWAXIS CONTROLS'],
          },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: 'COMPONENTS',
        qty: 1,
        type: 'BUY',
        sourcing: [
          {
            processType: 'BROUGHT OUT',
            suppliers: ['SLIMLINE VALVE SYSTEMS'],
          },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: 'PACKING',
        qty: 1,
        type: 'BUY',
        sourcing: [
          {
            processType: 'BROUGHT OUT',
            suppliers: ['THINBODY FLOW SOLUTIONS'],
          },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: 'OPERATOR',
        qty: 1,
        type: 'BUY',
        sourcing: [
          {
            processType: 'BROUGHT OUT',
            suppliers: ['GATELINE VALVES'],
          },
        ],
      },
    ] as Material[],
  }),

  actions: {
    addMaterial(material: Omit<Material, 'id' | 'sourcing'>) {
      this.materials.push({
        id: crypto.randomUUID(),
        ...material,
        sourcing: [],
      });
    },

    deleteMaterial(id: string) {
      this.materials = this.materials.filter((m) => m.id !== id);
    },

    addSupplierToProcess(materialId: string, processType: string, supplier: string) {
      const material = this.materials.find((m) => m.id === materialId);
      if (!material) return;

      let process = material.sourcing.find((p) => p.processType === processType);

      if (!process) {
        process = {
          processType,
          suppliers: [],
        };
        material.sourcing.push(process);
      }

      if (!process.suppliers.includes(supplier)) {
        process.suppliers.push(supplier);
      }
    },
  },
});
