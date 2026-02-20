<script setup lang="ts">
import { ref } from 'vue';
import SupplierRateSheetU from './SupplierRateSheetU.vue';
import type { IWorkbookData, ICellData } from '@univerjs/core';
import { LocaleType, BooleanNumber } from '@univerjs/core';
import { useProductConfigStore } from '../../stores/productConfig';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(['update:modelValue']);

const finalSheetActiveTab = ref('landed');
const companyOverhead = ref<number | null>(null);
const lpFactor = ref(2.1);

const intlCompanyOverhead = ref<number | null>(null);
const seaworthyPacking = ref(4);
const intlLpFactor = ref(2.5);
const usdExchangeRate = ref(91);

const euroCompanyOverhead = ref<number | null>(null);
const euroSeaworthyPacking = ref(4);
const euroCeAtexCert = ref(5);
const euroLpFactor = ref(2.5);
const euroExchangeRate = ref(109);
const euroUsdExchangeRate = ref(91);

const usaCompanyOverhead = ref<number | null>(null);
const usaTransferPriceFactor = ref(1.5);
const usaUsdExchangeRate = ref(91);

const configStore = useProductConfigStore();

function getEmptyWorkbook(tabName: string): IWorkbookData {
  const sizes = configStore.selectedSizes || [];
  let columns: string[] = [];
  
  
 if(tabName === 'DOMESTIC PRICE LIST') {
    columns = ['OH %','Body', 'Disc', 'Seat', 'Stem', 'Operator', ...sizes];
  }
  else  {
    columns = ['Body', 'Disc', 'Seat', 'Stem', 'Operator', ...sizes];
  }

  const headerRow: Record<string, ICellData> = {};
  if (columns.length > 0) {
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
    columns.forEach((title, index) => {
      headerRow[`${index}`] = { v: title, s: headerStyle };
    });
  }

  return {
    id: `final-${tabName}`,
    appVersion: '3.0.0',
    sheets: {
      'sheet-01': {
        id: 'sheet-01',
        name: tabName,
        cellData: Object.keys(headerRow).length > 0 ? { '0': headerRow } : {},
        rowCount: 100,
        columnCount: Math.max(columns.length, 20),
        columnHeader: {
          height: 20,
          hidden: BooleanNumber.TRUE,
        },
      },
    },
    
    locale: LocaleType.EN_US,
    name: tabName,
    sheetOrder: ['sheet-01'],
    styles: {},
  };
}

function onExportAll() {
  console.log('Exporting all sheets');
}

function handleClose() {
  emit('update:modelValue', false);
}
</script>

<template>
  <q-dialog
    :model-value="props.modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="bg-grey-1">
      <q-toolbar class="final-sheet-toolbar text-white q-py-sm">
        <q-btn flat round dense icon="close" size="md" @click="handleClose" />
        <q-toolbar-title class="toolbar-heading"> Price Sheets Configuration </q-toolbar-title>
        <q-btn flat label="Export All Sheets" icon="file_download" size="md" @click="onExportAll" />
      </q-toolbar>

      <!-- Main Content Area with Padding below heading -->
      <div class="q-pa-md">
        <div>
          <q-tabs
            v-model="finalSheetActiveTab"
            dense
            class="text-grey-7 tabs-container rounded-borders"
            active-color="accent"
            indicator-color="accent"
            align="left"
            narrow-indicator
          >
            <q-tab name="landed" icon="warehouse" label="LANDED COST" />
            <q-tab name="domestic" icon="currency_rupee" label="DOMESTIC PRICE LIST" />
            <q-tab name="international" icon="public" label="INTERNATIONAL PRICE LIST" />
            <q-tab name="europe" icon="euro" label="INTERNATIONAL - EUROPE" />
            <q-tab name="usa" icon="currency_exchange" label="DELVAL USA TRANSFER PRICE" />
          </q-tabs>

          <q-separator class="q-mt-md" />

          <q-tab-panels v-model="finalSheetActiveTab" animated class="bg-transparent">
            <q-tab-panel name="landed" class="q-pa-none q-pt-md">
              <q-banner
                inline-actions
                rounded
                class="q-mb-md bg-purple-1 flex items-center justify-center"
              >
                <template v-slot:avatar>
                  <q-icon name="info" size="md" color="purple-6" />
                </template>
                <p class="text-purple-6 q-ma-none">
                  <span class="text-weight-medium text-purple-7">Landed Cost:</span> Base Cost
                  (Material + Ops + Testing + Tooling + Node Overheads + Freight).
                </p>
              </q-banner>

              <q-separator class="q-mb-md" />

              <SupplierRateSheetU :initial-data="getEmptyWorkbook('LANDED COST')" />
            </q-tab-panel>

            <q-tab-panel name="domestic" class="q-pa-none q-pt-md">
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-12 col-md-3">
                  <q-input
                    v-model.number="companyOverhead"
                    outlined
                    dense
                    label="Company Overhead %"
                    color="accent"
                    bg-color="white"
                    suffix="%"
                    type="number"
                  />
                </div>
                <div class="col-12 col-md-3">
                  <q-input
                    v-model.number="lpFactor"
                    outlined
                    dense
                    label="LP Factor"
                    color="accent"
                    bg-color="white"
                    type="number"
                  />
                </div>
              </div>
              <SupplierRateSheetU :initial-data="getEmptyWorkbook('DOMESTIC PRICE LIST')" />
            </q-tab-panel>

            <q-tab-panel name="international" class="q-pa-none q-pt-md">
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-12 col-md-3">
                  <q-input
                    v-model.number="intlCompanyOverhead"
                    outlined
                    dense
                    label="Company Overhead %"
                    color="accent"
                    bg-color="white"
                    suffix="%"
                    type="number"
                  />
                </div>
                <div class="col-12 col-md-3">
                  <q-input
                    v-model.number="seaworthyPacking"
                    outlined
                    dense
                    label="Seaworthy Packing %"
                    color="accent"
                    bg-color="white"
                    suffix="%"
                    type="number"
                  />
                </div>
                <div class="col-12 col-md-3">
                  <q-input
                    v-model.number="intlLpFactor"
                    outlined
                    dense
                    label="LP Factor"
                    color="accent"
                    bg-color="white"
                    type="number"
                  />
                </div>
                <div class="col-12 col-md-3">
                  <q-input
                    v-model.number="usdExchangeRate"
                    outlined
                    dense
                    label="USD Exchange Rate"
                    color="accent"
                    bg-color="white"
                    prefix="$"
                    type="number"
                  />
                </div>
              </div>

              <SupplierRateSheetU :initial-data="getEmptyWorkbook('INTERNATIONAL PRICE LIST')" />
            </q-tab-panel>

            <q-tab-panel name="europe" class="q-pa-none q-pt-md">
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-12 col-md-2">
                  <q-input
                    v-model.number="euroCompanyOverhead"
                    outlined
                    dense
                    label="Company Overhead %"
                    color="accent"
                    bg-color="white"
                    suffix="%"
                    type="number"
                  />
                </div>
                <div class="col-12 col-md-2">
                  <q-input
                    v-model.number="euroSeaworthyPacking"
                    outlined
                    dense
                    label="Seaworthy Packing %"
                    color="accent"
                    bg-color="white"
                    suffix="%"
                    type="number"
                  />
                </div>
                <div class="col-12 col-md-2">
                  <q-input
                    v-model.number="euroCeAtexCert"
                    outlined
                    dense
                    label="CE/ATEX Cert %"
                    color="accent"
                    bg-color="white"
                    suffix="%"
                    type="number"
                  />
                </div>
                <div class="col-12 col-md-2">
                  <q-input
                    v-model.number="euroLpFactor"
                    outlined
                    dense
                    label="LP Factor"
                    color="accent"
                    bg-color="white"
                    type="number"
                  />
                </div>
                <div class="col-12 col-md-2">
                  <q-input
                    v-model.number="euroExchangeRate"
                    outlined
                    dense
                    label="Euro Exchange Rate"
                    color="accent"
                    bg-color="white"
                    prefix="€"
                    type="number"
                  />
                </div>
                <div class="col-12 col-md-2">
                  <q-input
                    v-model.number="euroUsdExchangeRate"
                    outlined
                    dense
                    label="USD Exchange Rate"
                    color="accent"
                    bg-color="white"
                    prefix="$"
                    type="number"
                  />
                </div>
              </div>

              <SupplierRateSheetU :initial-data="getEmptyWorkbook('INTERNATIONAL - EUROPE')" />
            </q-tab-panel>

            <q-tab-panel name="usa" class="q-pa-none q-pt-md">
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-12 col-md-3">
                  <q-input
                    v-model.number="usaCompanyOverhead"
                    outlined
                    dense
                    label="Company Overhead %"
                    color="accent"
                    bg-color="white"
                    suffix="%"
                    type="number"
                  />
                </div>
                <div class="col-12 col-md-3">
                  <q-input
                    v-model.number="usaTransferPriceFactor"
                    outlined
                    dense
                    label="Transfer Price Factor"
                    color="accent"
                    bg-color="white"
                    type="number"
                  />
                </div>
                <div class="col-12 col-md-3">
                  <q-input
                    v-model.number="usaUsdExchangeRate"
                    outlined
                    dense
                    label="USD Exchange Rate"
                    color="accent"
                    bg-color="white"
                    prefix="$"
                    type="number"
                  />
                </div>
              </div>

              <SupplierRateSheetU :initial-data="getEmptyWorkbook('DELVAL USA TRANSFER PRICE')" />
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.final-sheet-toolbar {
  background-color: #c026d3;
  opacity: 80%;
}
.toolbar-heading {
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: 0.0125em;
}
.tabs-container {
  background-color: #f5f7fa;
  padding: 8px;
  border: 1px solid #e0e0e0;
}
.info-banner {
  background-color: #f3e5f5;

  border-radius: 4px;
}
.sheet-placeholder {
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}
</style>
