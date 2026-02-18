<script setup lang="ts">
import { ref, computed, watch } from 'vue';

import { useProductConfigStore } from '../../stores/productConfig';

const productConfigStore = useProductConfigStore();

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
  productConfigStore.setSizes(selectedSizes.value);
  productConfigStore.setLpFactor(lpFactor.value);
  productConfigStore.setProduct(product.value);
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
    <!-- ── Header ── -->
    <div class="step-header q-mb-md">
      <h4 class="step-title">Product Metadata Setup</h4>
      <p class="step-description">
        Define product name, series, available sizes, and pricing factors
      </p>
    </div>
    <q-separator class="q-mb-md" />

    <!-- ── Basic Information ── -->
    <q-card flat bordered class="section-card q-mb-md">
      <q-card-section class="section-header">
        <q-icon name="info_outline" size="20px" color="primary" class="q-mr-sm" />
        <span class="section-title">Basic Information</span>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <!-- Product Make (full width) -->
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
          />
        </div>

        <!-- Product Portfolio & Offer Template -->
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
            />
          </div>
          <div class="col-12 col-md-6">
            <label class="usa-label">Offer Template</label>
            <q-select
              v-model="offerTemplate"
              :options="filteredOfferTemplateOptions"
              outlined
              dense
              clearable
              use-input
              input-debounce="200"
              @filter="filterOfferTemplate"
            />
          </div>
        </div>

        <!-- Product -->
        <div class="row q-col-gutter-md">
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
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- ── Series Type ── -->
    <q-card flat bordered class="section-card q-mb-md">
      <q-card-section class="section-header">
        <q-icon name="category" size="20px" color="primary" class="q-mr-sm" />
        <span class="section-title">Series Type</span>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <label class="usa-label"
              >Series <span class="text-negative required-star">*</span></label
            >
            <q-select
              v-model="series"
              :options="filteredSeriesOptions"
              outlined
              dense
              clearable
              use-input
              input-debounce="200"
              @filter="filterSeries"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- ── Available Sizes ── -->
    <q-card flat bordered class="section-card q-mb-md">
      <q-card-section class="section-header">
        <q-icon name="straighten" size="20px" color="primary" class="q-mr-sm" />
        <span class="section-title">Available Sizes</span>
        <q-badge
          v-if="selectedSizes.length"
          color="primary"
          :label="`${selectedSizes.length} selected`"
          class="q-ml-sm"
        />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="size-grid q-mb-md">
          <div
            v-for="(row, rowIndex) in sizeRows"
            :key="rowIndex"
            class="row q-col-gutter-md q-mb-xs"
          >
            <div v-for="size in row" :key="size" class="col-4">
              <q-checkbox v-model="selectedSizes" :val="size" :label="size" color="primary" dense />
            </div>
          </div>
        </div>

        <div class="row q-gutter-sm">
          <q-btn
            label="Select All"
            unelevated
            class="action-btn usa-button--brand-secondary"
            @click="selectAll"
          />
          <q-btn label="Clear All" color="grey-7" outline class="action-btn" @click="clearAll" />
        </div>
      </q-card-section>
    </q-card>

    <!-- ── Pricing Factors ── -->
    <q-card flat bordered class="section-card q-mb-md">
      <q-card-section class="section-header">
        <q-icon name="payments" size="20px" color="primary" class="q-mr-sm" />
        <span class="section-title">Pricing Factors</span>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <label class="usa-label"
              >LP Factor <span class="text-negative required-star">*</span></label
            >
            <q-input
              v-model.number="lpFactor"
              type="number"
              outlined
              dense
              placeholder="e.g., 2.10"
              hint="Multiplier applied to the list price"
              :rules="[(val: number) => val > 0 || 'LP Factor must be greater than 0']"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<style scoped>
/* ── Section Cards ── */
.section-card {
  border-color: #dfe1e2;
  border-radius: 6px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #f9fafb;
}

.section-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1b1b1b;
}

/* ── Checkbox grid ── */
.size-grid :deep(.q-checkbox) {
  padding: 4px 0;
}

.size-grid :deep(.q-checkbox__label) {
  font-size: 0.9375rem;
  color: #1b1b1b;
}

/* ── Buttons ── */
.action-btn {
  min-width: 120px;
  text-transform: none !important;
  font-weight: 500;
}

/* ── Select overrides ── */
:deep(.q-field--outlined .q-field__control) {
  border-radius: 4px;
}
</style>
