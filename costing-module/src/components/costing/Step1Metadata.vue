<script setup lang="ts">
import { ref, computed, watch } from 'vue';

// Define emits to pass data to parent
const emit = defineEmits<{
  (
    e: 'update:metadata',
    data: {
      product: string | null;
      productMake: string;
      productPortfolio: string;
      offerTemplate: string;
      series: string;
      lpFactor: number;
      selectedSizes: string[];
    },
  ): void;
}>();

// Form Data
const productMake = ref<string>('Delval');
const productPortfolio = ref<string>('VALVE');
const offerTemplate = ref<string>('Default Template');
const product = ref<string | null>('CENTRIC BUTTERFLY VALVE');
const series = ref<string>('50 BFV(LDO):-50');
const lpFactor = ref<number>(2.1);

const productMakeOptions: string[] = ['Delval', 'Other Make'];

const productPortfolioOptions: string[] = ['VALVE', 'ACTUATOR', 'ACCESSORIES'];

const offerTemplateOptions: string[] = ['Default Template', 'Custom Template'];

const productOptions: string[] = [
  'CENTRIC BUTTERFLY VALVE',
  'ECCENTRIC BUTTERFLY VALVE',
  'BALL VALVE',
  'GATE VALVE',
  'CHECK VALVE',
];

const seriesOptions: string[] = ['50 BFV(LDO):-50', '100 BFV(LDO):-100', '150 BFV(LDO):-150'];

// Available Sizes Array
const allSizes: string[] = [
  '2"',
  '2.5"',
  '3"',
  '4"',
  '5"',
  '6"',
  '8"',
  '10"',
  '12"',
  '14"',
  '16"',
  '18"',
  '20"',
  '24"',
  '50"',
  '65"',
  '80"',
  '100"',
  '125"',
  '150"',
  '200"',
  '250"',
  '300"',
];

const selectedSizes = ref<string[]>([
  '2"',
  '2.5"',
  '3"',
  '4"',
  '5"',
  '6"',
  '8"',
  '10"',
  '12"',
  '14"',
  '16"',
  '18"',
  '20"',
  '24"',
]);

const filteredProductMakeOptions = ref([...productMakeOptions]);
const filteredProductPortfolioOptions = ref([...productPortfolioOptions]);
const filteredOfferTemplateOptions = ref([...offerTemplateOptions]);
const filteredProductOptions = ref([...productOptions]);
const filteredSeriesOptions = ref([...seriesOptions]);

function applyFilter(val: string, source: string[]) {
  if (val === '') {
    return [...source];
  }
  const needle = val.toLowerCase();
  return source.filter((option) => option.toLowerCase().includes(needle));
}

function filterProductMake(val: string, update: (cb: () => void) => void) {
  update(() => {
    filteredProductMakeOptions.value = applyFilter(val, productMakeOptions);
  });
}

function filterProductPortfolio(val: string, update: (cb: () => void) => void) {
  update(() => {
    filteredProductPortfolioOptions.value = applyFilter(val, productPortfolioOptions);
  });
}

function filterOfferTemplate(val: string, update: (cb: () => void) => void) {
  update(() => {
    filteredOfferTemplateOptions.value = applyFilter(val, offerTemplateOptions);
  });
}

function filterProduct(val: string, update: (cb: () => void) => void) {
  update(() => {
    filteredProductOptions.value = applyFilter(val, productOptions);
  });
}

function filterSeries(val: string, update: (cb: () => void) => void) {
  update(() => {
    filteredSeriesOptions.value = applyFilter(val, seriesOptions);
  });
}

// Actions
function selectAll(): void {
  selectedSizes.value = [...allSizes];
}

function clearAll(): void {
  selectedSizes.value = [];
}

// Computed for checkbox grid - split into rows of 3
const sizeRows = computed((): string[][] => {
  const rows: string[][] = [];
  for (let i = 0; i < allSizes.length; i += 3) {
    rows.push(allSizes.slice(i, i + 3));
  }
  return rows;
});

// Watch for changes and emit to parent
function emitMetadata() {
  emit('update:metadata', {
    product: product.value,
    productMake: productMake.value,
    productPortfolio: productPortfolio.value,
    offerTemplate: offerTemplate.value,
    series: series.value,
    lpFactor: lpFactor.value,
    selectedSizes: selectedSizes.value,
  });
}

// Watch all relevant fields
watch(
  [product, productMake, productPortfolio, offerTemplate, series, lpFactor, selectedSizes],
  emitMetadata,
  { immediate: true, deep: true },
);
</script>

<template>
  <div class="step1-metadata">
    <!-- Header -->
    <div class="step-header q-mb-md">
      <h4 class="step-title">Step 1: Product Metadata Setup</h4>
      <p class="step-description">
        Define product name, series, available sizes, and pricing factors
      </p>
    </div>

    <!-- Basic Information Fieldset -->
    <fieldset class="usa-fieldset q-mb-md">
      <legend class="usa-legend">Basic Information</legend>

      <!-- Product Make -->
      <div class="q-mb-md">
        <label class="usa-label">Product Make</label>
        <q-select
          v-model="productMake"
          :options="filteredProductMakeOptions"
          outlined
          dense
          clearable
          class="full-width"
          use-input
          @filter="filterProductMake"
          input-debounce="200"
          rounded
        />
      </div>

      <!-- Product Portfolio & Offer Template Row -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-6">
          <label class="usa-label">Product Portfolio</label>
          <q-select
            v-model="productPortfolio"
            :options="filteredProductPortfolioOptions"
            outlined
            dense
            clearable
            use-input
            input-debounce="200"
            @filter="filterProductPortfolio"
            rounded
          />
        </div>
        <div class="col-12 col-md-6">
          <label class="usa-label">Offer template 1</label>
          <q-select
            v-model="offerTemplate"
            :options="filteredOfferTemplateOptions"
            outlined
            dense
            clearable
            use-input
            input-debounce="200"
            @filter="filterOfferTemplate"
            rounded
          />
        </div>
      </div>

      <!-- Product -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-6">
          <label class="usa-label"
            >Product <span class="text-negative required-star">*</span></label
          >
          <q-select
            v-model="product"
            :options="filteredProductOptions"
            outlined
            dense
            clearable
            use-input
            input-debounce="200"
            @filter="filterProduct"
            rounded
          />
        </div>
      </div>
    </fieldset>

    <!-- Series Type Fieldset -->
    <fieldset class="usa-fieldset q-mb-md">
      <legend class="usa-legend">Series Type</legend>

      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-6">
          <label class="usa-label">Series <span class="text-negative required-star">*</span></label>
          <q-select
            v-model="series"
            :options="filteredSeriesOptions"
            outlined
            dense
            clearable
            use-input
            input-debounce="200"
            @filter="filterSeries"
            rounded
          />
        </div>
      </div>
    </fieldset>

    <!-- Available Sizes Fieldset -->
    <fieldset class="usa-fieldset q-mb-md">
      <legend class="usa-legend">Available Sizes</legend>

      <div class="q-mb-md">
        <div
          v-for="(row, rowIndex) in sizeRows"
          :key="rowIndex"
          class="row q-col-gutter-md q-mb-sm"
        >
          <div v-for="size in row" :key="size" class="col-4">
            <q-checkbox
              v-model="selectedSizes"
              :val="size"
              :label="size"
              color="primary"
              dense
              class="q-ma-sm"
            />
          </div>
        </div>
      </div>

      <div class="row q-gutter-sm">
        <div class="row q-gutter-sm">
          <q-btn
            label="Select All"
            unelevated
            class="col min-btn usa-button--brand-secondary"
            @click="selectAll"
          />
          <q-btn label="Clear All" color="grey-7" outline class="col min-btn" @click="clearAll" />
        </div>
      </div>
    </fieldset>

    <!-- Pricing Factors Fieldset -->
    <fieldset class="usa-fieldset q-mb-md">
      <legend class="usa-legend">Pricing Factors</legend>

      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-6">
          <label class="usa-label"
            >LP Factor <span class="text-negative required-star">*</span></label
          >
          <q-input
            v-model.number="lpFactor"
            type="number"
            outlined
            dense
            rounded
            placeholder="e.g., 2.10"
            :rules="[(val) => val > 0 || 'LP Factor must be greater than 0']"
          />
        </div>
      </div>
    </fieldset>
  </div>
</template>

<style scoped>
/* Header - USWDS */

/* USWDS Fieldset */
.usa-fieldset {
  border: 1px solid #c9c9c9;
  border-radius: 4px;
  padding: 16px 24px;
  margin: 0;
  background: #ffffff;
}

.usa-legend {
  font-size: 0.875rem;
  font-weight: 400;
  color: #71767a;
  padding: 0 8px;
  background: #ffffff;
}

:deep(.q-checkbox__label) {
  font-size: 1rem;
  color: #1b1b1b;
}

.min-btn {
  min-width: 140px;
  text-transform: none !important;
}
</style>
