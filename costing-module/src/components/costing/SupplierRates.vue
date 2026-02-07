<script setup lang="ts">
import { ref } from 'vue';

interface SelectOption {
  label: string;
  value: string;
}

const processTypeOptions: SelectOption[] = [
  { label: 'Sand Cast', value: 'SAND_CAST' },
  { label: 'Investment Casting', value: 'INVESTMENT_CASTING' },
  { label: 'Shell Casting', value: 'SHELL_CASTING' },
];

const supplierOptions: SelectOption[] = [
  { label: 'IronCore Castings Pvt. Ltd.', value: 'IRONCORE' },
  { label: 'PrimeCast Engineering', value: 'PRIMECAST' },
  { label: 'GreyRock Foundry', value: 'GREYROCK' },
];

const selectedProcessType = ref<string | null>(null);
const selectedSupplier = ref<string | null>(null);

function addSupplierProcess() {
  console.log('Process:', selectedProcessType.value);
  console.log('Supplier:', selectedSupplier.value);
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
            option-label="label"
            option-value="value"
            emit-value
            map-options
            outlined
            dense
            label="Process Type"
          />
        </div>

        <!-- Supplier -->
        <div class="col-12 col-md-4">
          <q-select
            v-model="selectedSupplier"
            :options="supplierOptions"
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
  font-size: 1rem;
  color: #1b1b1b;
}
</style>
