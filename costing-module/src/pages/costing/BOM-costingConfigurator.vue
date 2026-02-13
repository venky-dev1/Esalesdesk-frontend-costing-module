<script setup lang="ts">
import { ref, computed } from 'vue';
import Step1Metadata from '../../components/costing/Step1Metadata.vue';
import Step2BOM from '../../components/costing/Step2BOM.vue';
import SupplierRates from '../../components/costing/SupplierRates.vue';
import CostEngine from '../../components/costing/CostEngine.vue';

interface StepItem {
  name: number;
  title: string;
}

interface MetadataInfo {
  product: string | null;
  productMake: string;
  productPortfolio: string;
  offerTemplate: string;
  series: string;
  lpFactor: number;
  selectedSizes: string[];
}

const steps = ref<StepItem[]>([
  { name: 1, title: 'Metadata' },
  { name: 2, title: 'Master BOM' },
  { name: 3, title: 'Supplier Rates' },
  { name: 4, title: 'Cost Engine' },
]);

const step = ref(1);
const totalSteps = steps.value.length;

// Metadata from Step 1
const metadata = ref<MetadataInfo>({
  product: 'CENTRIC BUTTERFLY VALVE',
  productMake: 'Delval',
  productPortfolio: 'VALVE',
  series: '50 BFV(LDO):-50',
  offerTemplate: 'Default Template',
  lpFactor: 2.1,
  selectedSizes: [],
});

function handleMetadataUpdate(data: MetadataInfo) {
  metadata.value = data;
}

// Computed properties for display
const displayProduct = computed(() => {
  if (!metadata.value.product) return 'Not selected';
  return `${metadata.value.product} -- ${metadata.value.series || 'undefined'}`;
});

const displaySizes = computed(() => {
  if (metadata.value.selectedSizes.length === 0) return 'None selected';
  return metadata.value.selectedSizes.map((s) => s.replace('"', '')).join(', ');
});

const displayMaterials = computed(() => {
  const m = metadata.value;

  let count = 0;

  if (m.product) count++;
  if (m.productMake) count++;
  if (m.productPortfolio) count++;
  if (m.offerTemplate) count++;
  if (m.series) count++;
  if (m.lpFactor > 0) count++;
  if (m.selectedSizes.length > 0) count++;

  return `${count} Configured`;
});

function nextStep() {
  if (step.value < totalSteps) {
    step.value++;
  }
}

function prevStep() {
  if (step.value > 1) {
    step.value--;
  }
}

// Validation check
const isConfigurationValid = computed(() => {
  return (
    metadata.value.product !== null &&
    metadata.value.product !== '' &&
    metadata.value.lpFactor > 0 &&
    metadata.value.selectedSizes.length > 0
  );
});
</script>

<template>
  <div class="configurator-wrapper">
    <q-stepper v-model="step" flat alternative-labels animated keep-alive active-icon="edit">
      <!-- Step 1: Metadata -->
      <q-step :name="1" title="Metadata" :done="step > 1" done-color="green" icon="settings">
        <Step1Metadata @update:metadata="handleMetadataUpdate" />
      </q-step>

      <!-- Step 2: Master BOM -->
      <q-step :name="2" title="Master BOM" :done="step > 2" done-color="green" icon="list_alt">
        <div>
          <Step2BOM />
        </div>
      </q-step>

      <!-- Step 3: Supplier Rates -->
      <q-step :name="3" title="Supplier Rates" :done="step > 3" done-color="green" icon="paid">
        <div><SupplierRates /></div>
      </q-step>

      <!-- Step 4: Cost Engine -->
      <q-step :name="4" title="Cost Engine" :done="step > 4" done-color="green" icon="analytics">
        <div>
          <CostEngine />
        </div>
      </q-step>

      <!-- Navigation buttons -->
      <template #navigation>
        <!-- Configuration Validation Banner -->
        <div class="step-content-area">
          <!-- Configuration Validation Banner -->
          <div
            v-if="step === 1"
            class="validation-banner q-mb-md"
            :class="isConfigurationValid ? 'valid' : 'invalid'"
          >
            <div v-if="isConfigurationValid" class="banner-content">
              <q-icon name="check_circle" size="20px" color="positive" class="q-mr-sm" />
              <div>
                <div class="banner-title">Configuration Valid</div>
                <div class="banner-text">You can proceed to the next step.</div>
              </div>
            </div>

            <div v-else class="banner-content">
              <q-icon name="warning" size="20px" color="warning" class="q-mr-sm" />
              <div>
                <div class="banner-title">Incomplete Configuration</div>
                <div class="banner-text">Please fill all required fields marked with *</div>
              </div>
            </div>
          </div>

          <div class="row justify-start q-gutter-sm">
            <q-btn
              v-if="step > 1"
              label="Previous"
              flat
              class="usa-button--brand-secondary"
              @click="prevStep"
            />

            <q-btn
              v-if="step < totalSteps"
              :label="`Next: ${steps[step]?.title} →`"
              class="usa-button--brand"
              :disable="!isConfigurationValid"
              @click="nextStep"
            />
          </div>
        </div>
      </template>
    </q-stepper>

    <!-- Configuration Summary - Below Navigation -->
    <div class="config-summary">
      <h4 class="summary-title">Configuration Summary</h4>
      <div class="summary-content">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <div class="summary-item">
              <span class="item-label">Product:</span>
              <span class="item-value">{{ displayProduct }}</span>
            </div>
          </div>
          <div class="col-12 col-md-6">
            <div class="summary-item">
              <span class="item-label">Materials:</span>
              <span class="item-value">{{ displayMaterials }}</span>
            </div>
          </div>
          <div class="col-12 col-md-6">
            <div class="summary-item">
              <span class="item-label">Sizes:</span>
              <span class="item-value">{{ displaySizes }}</span>
            </div>
          </div>
          <div class="col-12 col-md-6">
            <div class="summary-item">
              <span class="item-label">LP Factor:</span>
              <span class="item-value">{{ metadata.lpFactor }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.configurator-wrapper {
  width: 100%;
}

:deep(.q-stepper__tab) {
  transition: all 0.2s ease;
}

:deep(.q-stepper__tab--active) {
  transform: scale(1.05);
}

/* Increase step dot size */
:deep(.q-stepper__dot) {
  width: 32px !important;
  height: 32px !important;
  font-size: 1rem !important;
}

:deep(.q-stepper__dot .q-icon) {
  font-size: 1.25rem !important;
}

/* Keep all step text black */
:deep(.q-stepper__tab .q-stepper__label) {
  color: #1b1b1b !important;
}

.step-content-area {
  margin-left: 22px;
  margin-right: 16px;
  margin-bottom: 16px;
}

/* Configuration Summary */
.config-summary {
  border: 1px solid #c9c9c9;
  border-radius: 4px;
  margin: 22px;
  padding: 16px 24px;
}

.summary-title {
  margin: 0 0 16px 0;
  font-size: 1.5rem;
  font-weight: 400;
  color: #1b1b1b;
}

.summary-content {
  padding-top: 8px;
}

.summary-item {
  display: flex;
  gap: 6px;
  font-size: 0.9375rem;
  margin-bottom: 8px;
}

.item-label {
  color: #1b1b1b;
  font-weight: 500;
  min-width: 60px;
}

.item-value {
  color: #71767a;
  font-size: 0.9rem;
}

/* Validation Banner */
.validation-banner {
  padding: 12px 16px;
  border-radius: 4px;
  border-left: 4px solid;
}

.validation-banner.valid {
  background-color: #ecf3ec;
  border-left-color: #2e8540;
}

.validation-banner.invalid {
  background-color: #fef0c7;
  border-left-color: #e5a000;
}

.banner-content {
  display: flex;
  align-items: flex-start;
}

.banner-title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1b1b1b;
}

.banner-text {
  font-size: 0.875rem;
  color: #71767a;
}
</style>
