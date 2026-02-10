import { defineStore } from 'pinia';

export interface ProcessSourcing {
  processType: string;
  suppliers: string[];
}

export interface Material {
  name: string;
  qty: number;
  type: 'MAKE' | 'BUY' | null;
  sourcing: ProcessSourcing[];
}

export const useMaterialsStore = defineStore('materials', {
  state: () => ({
    materials: [
      {
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
    addMaterial(material: Omit<Material, 'sourcing'>) {
      this.materials.push({
        ...material,
        sourcing: [],
      });
    },
    deleteMaterial(index: number) {
      this.materials.splice(index, 1);
    },

    addSupplierToProcess(materialName: string, processType: string, supplier: string) {
      const material = this.materials.find((m) => m.name === materialName);
      if (!material) return;

      // Find existing process
      let process = material.sourcing.find((p) => p.processType === processType);

      // If process does not exist, create it
      if (!process) {
        process = {
          processType,
          suppliers: [],
        };
        material.sourcing.push(process);
      }

      // Prevent duplicate suppliers
      if (!process.suppliers.includes(supplier)) {
        process.suppliers.push(supplier);
      }
    },
  },
});
