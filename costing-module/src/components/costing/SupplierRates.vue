<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useMaterialsStore } from '../../stores/material';

import { useProductConfigStore } from '../../stores/productConfig';

import SupplierRateSheet from './SupplierRateSheet.vue';

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
              <SupplierRateSheet
                :material-name="selectedMaterial"
                :process-type="displayProcessTab"
                :supplier-name="displaySupplierTab"
                :sizes="selectedSizes"
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
