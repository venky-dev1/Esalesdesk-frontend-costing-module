<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useMaterialsStore } from '../../stores/material';

import { useProductConfigStore } from '../../stores/productConfig';
import { SUB_MATERIALS_MAP } from '../../constants/dummyData';

import SupplierRateSheetU from './SupplierRateSheetU.vue';

import { LocaleType, DataValidationType, DataValidationRenderMode } from '@univerjs/core';
import type { IWorkbookData } from '@univerjs/core';

// --- 1. DEFINE A DEFAULT EMPTY WORKBOOK (Fixes TS Error) ---
const DEFAULT_WORKBOOK_DATA: IWorkbookData = {
  id: 'workbook-empty',
  appVersion: '3.0.0',
  sheets: {},
  locale: LocaleType.EN_US,
  name: 'Empty Sheet',
  sheetOrder: [],
  styles: {},
};

const productConfigStore = useProductConfigStore();

const selectedSizes = computed(() => productConfigStore.selectedSizes);

console.log(selectedSizes);

const materialsStore = useMaterialsStore();

const selectedMaterial = ref(materialsStore.materials[0]?.name || '');

const currentMaterial = computed(() =>
  materialsStore.materials.find((m) => m.name === selectedMaterial.value),
);

const selectedProcessType = ref<string | null>(null);
const selectedSupplier = ref<string | null>(null);

// Display tabs for sourcing section
const displayProcessTab = ref<string | null>(null);
const displaySupplierTab = ref<string | null>(null);

// Computed: get suppliers for the selected display process tab
const displaySuppliersForProcess = computed(() => {
  if (!currentMaterial.value || !displayProcessTab.value) return [];
  const process = currentMaterial.value.sourcing.find(
    (s) => s.processType === displayProcessTab.value,
  );
  return process?.suppliers || [];
});

interface SelectOption {
  label: string;
  value: string;
}

const processTypeOptions: SelectOption[] = [
  { label: 'Sand Cast', value: 'SAND_CAST' },
  { label: 'Investment Casting', value: 'INVESTMENT_CASTING' },
  { label: 'Shell Casting', value: 'SHELL_CASTING' },
];

const makeSupplierOptions: SelectOption[] = [
  { label: 'IronCore Castings Pvt. Ltd.', value: 'IRONCORE' },
  { label: 'PrimeCast Engineering', value: 'PRIMECAST' },
];

const buySupplierMap: Record<string, SelectOption[]> = {
  SEAT: [
    { label: 'Seat Traders', value: 'SEAT_TRADERS' },
    { label: 'Universal Seals', value: 'UNIVERSAL_SEALS' },
  ],
  STEM: [{ label: 'Stem Supplies Ltd.', value: 'STEM_SUPPLIES' }],
  PACKING: [{ label: 'Packing World', value: 'PACKING_WORLD' }],
  OPERATOR: [{ label: 'Operator Equipments', value: 'OP_EQUIP' }],
};

const activeSupplierOptions = computed(() => {
  if (!currentMaterial.value) return [];

  if (currentMaterial.value.type === 'MAKE') {
    return makeSupplierOptions;
  }

  // BUY material → material-specific suppliers
  return buySupplierMap[currentMaterial.value.name] || [];
});

const showEmptyState = computed(() => {
  return !!currentMaterial.value && currentMaterial.value.sourcing.length === 0;
});

watch(
  () => selectedMaterial.value,
  () => {
    // Reset supplier ALWAYS when material changes
    selectedSupplier.value = null;

    // Handle process based on material type
    if (currentMaterial.value?.type === 'BUY') {
      selectedProcessType.value = 'BROUGHT';
    } else {
      selectedProcessType.value = null;
    }

    // Reset display tabs and set first process as default
    if (currentMaterial.value?.sourcing?.length) {
      displayProcessTab.value = currentMaterial.value.sourcing[0]?.processType ?? null;
      displaySupplierTab.value = currentMaterial.value.sourcing[0]?.suppliers?.[0] ?? null;
    } else {
      displayProcessTab.value = null;
      displaySupplierTab.value = null;
    }
  },
  { immediate: true },
);

// Watch displayProcessTab to reset supplier tab when process changes
watch(
  () => displayProcessTab.value,
  () => {
    if (displaySuppliersForProcess.value.length) {
      displaySupplierTab.value = displaySuppliersForProcess.value[0] ?? null;
    } else {
      displaySupplierTab.value = null;
    }
  },
);

function addSupplierProcess() {
  if (!currentMaterial.value || !selectedSupplier.value) return;

  const processType = currentMaterial.value.type === 'BUY' ? 'BROUGHT' : selectedProcessType.value;

  if (!processType) return;

  materialsStore.addSupplierToProcess(
    currentMaterial.value.name,
    processType,
    selectedSupplier.value,
  );

  // Reset UI state
  selectedSupplier.value = null;
  if (currentMaterial.value.type === 'MAKE') {
    selectedProcessType.value = null;
  }
}

const univerData = computed((): IWorkbookData => {
  if (!selectedMaterial.value) return DEFAULT_WORKBOOK_DATA;

  const sizes = selectedSizes.value || ['2', '4', '6'];
  const subMaterials = SUB_MATERIALS_MAP[selectedMaterial.value] || ['Standard'];

  // A. Determine Default Unit based on Type
  const defaultUnit = currentMaterial.value?.type === 'BUY' ? 'per Unit' : 'per Kg';

  const headerStyle = {
    bl: 1,
    fs: 10,
    ff: 'Arial',
    cl: { rgb: '#1b1b1b' },
    bg: { rgb: '#f5f7fa' },
    ht: 2,
    vt: 2,
    bd: {
      b: { s: 1, cl: { rgb: '#dcdcdc' } },
      r: { s: 1, cl: { rgb: '#dcdcdc' } },
      l: { s: 1, cl: { rgb: '#dcdcdc' } },
      t: { s: 1, cl: { rgb: '#dcdcdc' } },
    },
  };
  const wrapStyle = {
    ht: 2,
    vt: 2,
    tb: 3,
    fs: 10,
  };
  const centerStyle = { ht: 2, vt: 2 };

  // B. Header Row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const headerRow: Record<string, any> = {
    '0': { v: 'Material', s: headerStyle },
    '1': { v: 'Unit', s: headerStyle },
  };

  sizes.forEach((size, index) => {
    headerRow[`${index + 2}`] = {
      v: `${size}`,
      s: headerStyle,
    };
  });

  // C. Data Rows
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cellData: Record<string, any> = { '0': headerRow };

  subMaterials.forEach((subMat, rowIndex) => {
    const rowNum = `${rowIndex + 1}`;
    cellData[rowNum] = {
      '0': { v: subMat, s: wrapStyle },
      '1': { v: defaultUnit, s: centerStyle }, // <--- Use Dynamic Default Here
    };
    sizes.forEach((_, colIndex) => {
      cellData[rowNum][`${colIndex + 2}`] = { v: '' };
    });
  });

  // D. Create Workbook with Data Validation
  return {
    id: 'workbook-01',
    appVersion: '3.0.0',
    sheets: {
      'sheet-01': {
        id: 'sheet-01',
        name: 'Rates',
        cellData: cellData,
        columnCount: sizes.length + 10,
        rowCount: subMaterials.length + 10,
        defaultColumnWidth: 120,

        columnData: {
          '0': { w: 150 }, // Column 0 is "Material". 220px gives plenty of room.
        },

        rowData: Object.fromEntries(
          Array.from({ length: subMaterials.length + 1 }, (_, i) => [
            i.toString(),
            { h: 35 }, // Height in pixels (40 is usually good for 2 lines)
          ]),
        ),

        // --- E. DATA VALIDATION (The Dropdown Logic) ---
        dataValidation: [
          {
            uid: 'unit-dropdown-rule',
            type: DataValidationType.LIST,
            formula1: 'per Kg,per Unit', // The Options
            showErrorMessage: true,
            showDropDown: true,
            renderMode: DataValidationRenderMode.ARROW,
            ranges: [
              {
                startRow: 1, // Start after header
                endRow: subMaterials.length, // Apply to all data rows
                startColumn: 1, // Column B (Index 1)
                endColumn: 1, // Column B (Index 1)
              },
            ],
          },
        ],
      },
    },
    locale: LocaleType.EN_US,
    name: 'Costing Sheet',
    sheetOrder: ['sheet-01'],
    styles: {},
  } as IWorkbookData;
});
</script>

<template>
  <div>
    <!-- Header -->
    <div class="step-header q-mb-md">
      <h4 class="step-title">Step 3: Supplier Rates Configuration</h4>
      <p class="step-description">Define supplier rates per material and size</p>
    </div>

    <!-- Top Controls -->
    <div class="top-controls q-pa-md q-mb-md">
      <div class="row q-col-gutter-md items-center justify-center">
        <!-- Process Type -->
        <div class="col-12 col-md-3">
          <q-select
            v-model="selectedProcessType"
            :options="processTypeOptions"
            outlined
            dense
            label="Process Type"
            :disable="currentMaterial?.type === 'BUY'"
            emit-value
          />
        </div>

        <!-- Supplier -->
        <div class="col-12 col-md-4">
          <q-select
            v-model="selectedSupplier"
            :options="activeSupplierOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            outlined
            dense
            label="Supplier"
          />
        </div>

        <!-- Add Button -->
        <div class="col-12 col-md-5">
          <q-btn
            color="info"
            class="full-width"
            label="+ ADD SUPPLIER & PROCESS"
            :disable="!selectedProcessType || !selectedSupplier"
            @click="addSupplierProcess"
          />
        </div>
      </div>
    </div>

    <div class="top-controls q-pa-md">
      <h5 class="step-matrix-title">Supplier Rate Matrix</h5>

      <!-- Material selection -->
      <div class="q-mb-md">
        <q-tabs
          class="material-section"
          v-model="selectedMaterial"
          dense
          active-color="pink-7"
          indicator-color="pink-7"
          align="left"
        >
          <q-tab
            v-for="material in materialsStore.materials"
            :key="material.name"
            :name="material.name"
            :label="material.name"
          />
        </q-tabs>

        <!-- EMPTY STATE -->
        <q-banner v-if="showEmptyState" class="bg-info text-white q-mt-md" rounded>
          <template #avatar>
            <q-icon name="info" />
          </template>

          No supplier rates added yet. Select a <b>Process Type</b> and <b>Supplier</b>, then click
          <b>“Add Supplier & Process”</b>.
        </q-banner>

        <!-- Process Type Tabs -->
        <div v-if="currentMaterial && currentMaterial.sourcing.length" class="q-mt-md">
          <q-tabs
            v-model="displayProcessTab"
            dense
            class="process-display-tabs"
            align="left"
            indicator-color="primary"
          >
            <q-tab
              v-for="process in currentMaterial.sourcing"
              :key="process.processType"
              :name="process.processType"
              :label="process.processType.replace('_', ' ')"
            />
          </q-tabs>

          <!-- Supplier Tabs -->
          <div v-if="displaySuppliersForProcess.length" class="q-mt-md">
            <q-tabs
              v-model="displaySupplierTab"
              dense
              class="supplier-display-tabs"
              active-color="pink-7"
              indicator-color="pink-7"
              align="left"
            >
              <q-tab
                v-for="supplier in displaySuppliersForProcess"
                :key="supplier"
                :name="supplier"
                :label="supplier"
              />
            </q-tabs>

            <div v-if="displaySupplierTab && displayProcessTab" class="q-mt-sm">
              <SupplierRateSheetU
                :key="`${selectedMaterial}-${displayProcessTab}-${displaySupplierTab}`"
                :initial-data="univerData"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.top-controls {
  border: 1px solid #c9c9c9;
  border-radius: 6px;
  background: #ffffff;
}

.step-matrix-title {
  font-size: 1.3rem;
  color: #1b1b1b;
  margin: 0 0 8px 0;
}

.material-section {
  background: #31ccec;
  color: #ffffff;
  opacity: 100%;
}

/* Process Display Tabs */
.process-display-tabs {
  border-bottom: 1px solid #e0e0e0;
  background: gray;
}

.process-display-tabs :deep(.q-tab) {
  text-transform: uppercase;
  font-weight: 500;
  font-size: 0.8rem;
  color: #ffffff;
}

.process-display-tabs :deep(.q-tab--active) {
  color: #ffffff;
}

/* Supplier Display Tabs */
.supplier-display-tabs {
  background: lightgrey;
}

.supplier-display-tabs :deep(.q-tab) {
  text-transform: uppercase;
  font-weight: 600;
  font-size: 0.75rem;

  border-radius: 4px;
  margin-right: 8px;
}

.supplier-display-tabs :deep(.q-tabs__content) {
  gap: 8px;
}
</style>
