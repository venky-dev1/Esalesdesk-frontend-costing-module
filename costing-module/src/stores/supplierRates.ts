import { defineStore } from 'pinia';
import { SUB_MATERIALS_MAP, DEMO_DATA, VALID_DEMO_COMBOS } from '../constants/dummyData';

/**
 * A single rate entry for a given material + subMaterial + size cell.
 */
export interface RateEntry {
  supplier: string;
  processType: string;
  rate: number;
}

/**
 * Nested structure:
 *   material → subMaterial → size → RateEntry[]
 *
 * Example:
 *   rates['BODY']['CI']['2'] = [
 *     { supplier: 'IRONCORE CASTINGS PVT. LTD.', processType: 'SAND CAST', rate: 104 },
 *     { supplier: 'PRIMECAST ENGINEERING', processType: 'INVESTMENT CASTING', rate: 156 },
 *   ]
 */
type SizeRates = Record<string, RateEntry[]>;
type SubMaterialRates = Record<string, SizeRates>;
type MaterialRates = Record<string, SubMaterialRates>;

/**
 * Build initial rates from DEMO_DATA + VALID_DEMO_COMBOS.
 * Runs once at import time so the store starts pre-filled.
 */
function buildInitialRates(): MaterialRates {
  const rates: MaterialRates = {};

  function addRate(
    material: string,
    subMat: string,
    size: string,
    processType: string,
    supplier: string,
    rate: number,
  ) {
    if (!rates[material]) rates[material] = {};
    if (!rates[material][subMat]) rates[material][subMat] = {};
    if (!rates[material][subMat][size]) rates[material][subMat][size] = [];
    rates[material][subMat][size].push({ supplier, processType, rate });
  }

  Object.entries(VALID_DEMO_COMBOS).forEach(([material, processes]) => {
    const subMaterials: string[] = SUB_MATERIALS_MAP[material] || [];

    Object.entries(processes).forEach(([processType, suppliers]) => {
      suppliers.forEach((supplier) => {
        subMaterials.forEach((subMat) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const basePriceData = (DEMO_DATA as any).BASE_PRICE?.[material]?.[subMat];
          if (!basePriceData) return;

          Object.entries(basePriceData).forEach(([size, baseRate]) => {
            let rate = baseRate as number;
            if (material === 'BODY' && processType === 'INVESTMENT CASTING') {
              rate = rate * 1.5;
            }
            addRate(material, subMat, String(size), processType, supplier, rate);
          });
        });
      });
    });
  });

  return rates;
}

export const useSupplierRatesStore = defineStore('supplierRates', {
  state: (): { rates: MaterialRates } => ({
    rates: buildInitialRates(),
  }),

  getters: {
    /** Get all rate entries for a cell (material + subMaterial + size). */
    getEntriesForCell:
      (state) =>
      (material: string, subMaterial: string, size: string): RateEntry[] => {
        return state.rates[material]?.[subMaterial]?.[size] || [];
      },

    /** Get a single rate for a specific process+supplier combo. */
    getRate:
      (state) =>
      (
        material: string,
        subMaterial: string,
        size: string,
        processType: string,
        supplier: string,
      ): number | undefined => {
        const entries = state.rates[material]?.[subMaterial]?.[size];
        if (!entries) return undefined;
        return entries.find((e) => e.processType === processType && e.supplier === supplier)?.rate;
      },

    /** Check if any rate data exists for a material + process + supplier combo. */
    hasRatesForCombo:
      (state) =>
      (material: string, processType: string, supplier: string): boolean => {
        const subMats = state.rates[material];
        if (!subMats) return false;
        for (const sizeRates of Object.values(subMats)) {
          for (const entries of Object.values(sizeRates)) {
            if (entries.some((e) => e.processType === processType && e.supplier === supplier)) {
              return true;
            }
          }
        }
        return false;
      },
  },

  actions: {
    /** Set (upsert) a single rate entry. */
    setRate(
      material: string,
      subMaterial: string,
      size: string,
      processType: string,
      supplier: string,
      rate: number,
    ) {
      if (!this.rates[material]) this.rates[material] = {};
      if (!this.rates[material][subMaterial]) this.rates[material][subMaterial] = {};
      if (!this.rates[material][subMaterial][size]) this.rates[material][subMaterial][size] = [];

      const entries = this.rates[material][subMaterial][size];
      const existing = entries.find(
        (e) => e.processType === processType && e.supplier === supplier,
      );

      if (existing) {
        existing.rate = rate;
      } else {
        entries.push({ supplier, processType, rate });
      }
    },
  },
});
