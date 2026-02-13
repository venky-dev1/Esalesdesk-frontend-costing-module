<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useMaterialsStore } from '../../stores/material';

import { useProductConfigStore } from '../../stores/productConfig';
import { SUB_MATERIALS_MAP, DEMO_DATA } from '../../constants/dummyData';

import SupplierRateSheetU from './SupplierRateSheetU.vue';

import { LocaleType } from '@univerjs/core';
import type { IWorkbookData } from '@univerjs/core';
import { BooleanNumber } from '@univerjs/core';

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

const univerData = computed((): IWorkbookData => {
  if (!selectedMaterial.value || !displayProcessTab.value || !displaySupplierTab.value)
    return DEFAULT_WORKBOOK_DATA;

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
    cl: { rgb: '#71767a' },
  };
  const centerStyle = { ht: 2, vt: 2, cl: { rgb: '#71767a' } };

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
    sizes.forEach((size, colIndex) => {
      let cellValue: number | string = '';
      const cleanSize = size.replace(/"/g, '');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const basePriceData = (DEMO_DATA as any).BASE_PRICE?.[selectedMaterial.value];
      if (basePriceData) {
        const materialRates = basePriceData[subMat];
        if (materialRates) {
          // Check exact match or number match
          let rate = materialRates[cleanSize] || materialRates[parseFloat(cleanSize)];

          if (rate !== undefined) {
            const isBodyCategory = selectedMaterial.value === 'BODY';
            const isInvestment = displayProcessTab.value === 'INVESTMENT CASTING';
            if (isBodyCategory && isInvestment) {
              rate = rate * 1.5;
            }
            cellValue = rate;
          }
        }
      }
      cellData[rowNum][`${colIndex + 2}`] = {
        v: cellValue,
        s: { vt: 2, ht: 2, cl: { rgb: '#71767a' } },
      };
    });
  });

  const workbookId = `${selectedMaterial.value}_${displayProcessTab.value}_${displaySupplierTab.value}`;

  // D. Create Workbook with Data Validation
  return {
    id: workbookId,
    appVersion: '3.0.0',
    sheets: {
      'sheet-01': {
        id: 'sheet-01',
        name: 'Rates',
        cellData: cellData,
        columnCount: sizes.length + 2,
        rowCount: subMaterials.length + 2,
        defaultColumnWidth: 120,
        columnHeader: {
          height: 20,
          hidden: BooleanNumber.TRUE,
        },

        columnData: {
          '0': { w: 150 },
        },

        rowData: Object.fromEntries(
          Array.from({ length: subMaterials.length + 1 }, (_, i) => [
            i.toString(),
            { h: 35 }, // Height in pixels (40 is usually good for 2 lines)
          ]),
        ),
      },
    },
    locale: LocaleType.EN_US,
    name: 'Costing Sheet',
    sheetOrder: ['sheet-01'],
    styles: {},
  } as IWorkbookData;
});

interface BulkRule {
  material: string;
  rate: number;
  fromSize: string;
  toSize: string;
}

const showBulkDialog = ref(false);

const bulkForm = ref({
  material: '',
  rate: null as number | null,
  fromSize: '',
  toSize: '',
});

const rules = ref<BulkRule[]>([]);

type SupplierSheetExposed = {
  setCellValue: (range: string, value: number) => void;
};

const sheetRef = ref<SupplierSheetExposed | null>(null);

type SupplierDocument = {
  id: number;
  name: string;
  tag: string;
  file: File;
};

const showDocumentDialog = ref(false);

const documents = ref<SupplierDocument[]>([]);

function addRule() {
  const { material, rate, fromSize, toSize } = bulkForm.value;
  if (!material || !rate || !fromSize || !toSize) {
    return;
  }
  const newRule: BulkRule = {
    material,
    rate,
    fromSize,
    toSize,
  };
  rules.value.push(newRule);
  bulkForm.value.material = '';
  bulkForm.value.rate = null;
  bulkForm.value.fromSize = '';
  bulkForm.value.toSize = '';
}

function removeRule(index: number) {
  rules.value.splice(index, 1);
}

function applyBulkRates() {
  if (!sheetRef.value) return;

  const sizes = selectedSizes.value || [];

  rules.value.forEach((rule) => {
    const fromIndex = sizes.indexOf(rule.fromSize);
    const toIndex = sizes.indexOf(rule.toSize);

    if (fromIndex === -1 || toIndex === -1) return;

    const startCol = fromIndex + 3; // Column C starts at index 2
    const endCol = toIndex + 3;

    // Find row index based on material
    const subMaterials = SUB_MATERIALS_MAP[selectedMaterial.value] || [];
    const rowIndex = subMaterials.indexOf(rule.material);

    if (rowIndex === -1) return;

    const excelRow = rowIndex + 2; // because row 1 is header

    for (let col = startCol; col <= endCol; col++) {
      const columnLetter = String.fromCharCode(64 + col);
      const range = `${columnLetter}${excelRow}`;
      sheetRef.value?.setCellValue(range, rule.rate);
    }
  });

  showBulkDialog.value = false;
}

const searchText = ref('');
const selectedTag = ref<string | null>(null);
const uploadedFile = ref<File | null>(null);
const showUploadDialog = ref(false);
const uploadNote = ref('');
const uploadTags = ref<string | null>(null);
const uploadFiles = ref<File[]>([]);

const tagOptions = ['Quotation', 'Invoice', 'Specification', 'Drawing'];

function removeDocument(id: number) {
  documents.value = documents.value.filter((d) => d.id !== id);
}

const filteredDocuments = computed(() => {
  return documents.value.filter((doc) => {
    const matchesSearch =
      !searchText.value || doc.name.toLowerCase().includes(searchText.value.toLowerCase());

    const matchesTag = !selectedTag.value || doc.tag === selectedTag.value;

    return matchesSearch && matchesTag;
  });
});
function startUpload() {
  uploadFiles.value.forEach((file) => {
    documents.value.push({
      id: Date.now() + Math.random(),
      name: file.name,
      tag: uploadTags.value || 'General',
      file,
    });
  });

  uploadFiles.value = [];
  uploadTags.value = null;
  uploadNote.value = '';

  showUploadDialog.value = false;
}

const showNotesDialog = ref(false);
const noteText = ref('');

function addNote() {
  if (!noteText.value) return;

  console.log('Note added:', noteText.value);

  noteText.value = '';
  showNotesDialog.value = false;
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
              <div class="row q-col-gutter-md items-center">
                <div class="col-auto">
                  <q-btn
                    icon="tune"
                    label="Bulk Rate Fill"
                    size="md"
                    class="q-mr-md usa-button--brand-teal"
                    @click="showBulkDialog = true"
                  />

                  <q-dialog v-model="showBulkDialog" persistent>
                    <q-card class="bulk-dialog">
                      <!-- Header -->
                      <div class="bulk-header">
                        <div class="text-h6">Bulk Rate Fill</div>
                        <div class="text-subtitle2">
                          Apply rates to size ranges for specific materials
                        </div>
                      </div>

                      <!-- Body -->
                      <q-card-section>
                        <!-- First Row -->
                        <div class="row q-col-gutter-md q-mb-md">
                          <div class="col-4">
                            <q-select
                              v-model="bulkForm.material"
                              :options="SUB_MATERIALS_MAP[selectedMaterial] || []"
                              label="Material"
                              outlined
                              dense
                              color="teal"
                            />
                          </div>

                          <div class="col-4">
                            <q-input
                              v-model.number="bulkForm.rate"
                              type="number"
                              label="Rate"
                              outlined
                              dense
                              color="teal"
                            />
                          </div>

                          <div class="col-4 flex flex-center">
                            <q-btn
                              outline
                              color="teal"
                              icon="add"
                              label="ADD RULE"
                              @click="addRule"
                            />
                          </div>
                        </div>

                        <!-- Second Row -->
                        <div class="row q-col-gutter-md q-mb-md">
                          <div class="col-6">
                            <q-select
                              v-model="bulkForm.fromSize"
                              :options="selectedSizes"
                              label="From Size"
                              outlined
                              dense
                              color="teal"
                            />
                          </div>

                          <div class="col-6">
                            <q-select
                              v-model="bulkForm.toSize"
                              :options="selectedSizes"
                              label="To Size"
                              outlined
                              dense
                            />
                          </div>
                        </div>

                        <q-separator class="q-my-md" />

                        <!-- Rules Section -->
                        <div class="text-subtitle2 q-mb-sm">Rules to Apply:</div>

                        <div v-if="!rules.length" class="empty-rule-box">No rules added yet.</div>

                        <div v-else>
                          <div v-for="(rule, index) in rules" :key="index" class="rule-item">
                            <!-- Left Content -->
                            <div class="rule-left">
                              <div class="rule-material">
                                {{ rule.material }}
                              </div>
                              <div class="rule-size">
                                Size {{ rule.fromSize }} to {{ rule.toSize }}
                              </div>
                            </div>

                            <!-- Right Content -->
                            <div class="rule-right">
                              <q-chip dense color="teal" text-color="white" class="q-mr-md">
                                ₹{{ rule.rate }}
                              </q-chip>

                              <q-btn
                                flat
                                round
                                dense
                                icon="delete"
                                color="red"
                                @click="removeRule(index)"
                              />
                            </div>
                          </div>
                        </div>
                      </q-card-section>

                      <!-- Footer -->
                      <q-card-actions align="right" class="q-pa-md">
                        <q-btn flat label="CANCEL" color="teal" v-close-popup />
                        <q-btn
                          class="usa-button--brand-teal"
                          label="APPLY RATES"
                          @click="applyBulkRates"
                        />
                      </q-card-actions>
                    </q-card>
                  </q-dialog>
                </div>
                <q-space />
                <!-- 2 q-btn to show dialog for add document, notes -->
                <div>
                  <q-btn
                    color="info"
                    class="q-mr-md"
                    label="ADD DOCUMENT"
                    @click="showDocumentDialog = true"
                  />

                  <q-dialog v-model="showDocumentDialog" persistent>
                    <q-card class="document-dialog">
                      <!-- Header -->
                      <q-card-section>
                        <div class="text-h6">Add Document</div>
                      </q-card-section>

                      <!-- Body -->
                      <q-card-section>
                        <!-- Top Row -->
                        <div class="row q-col-gutter-md items-center q-mb-md">
                          <div class="col-5">
                            <div class="text-subtitle2">List of Documents</div>
                          </div>

                          <div class="col-4">
                            <q-input
                              dense
                              outlined
                              placeholder="Search by name, tag..."
                              v-model="searchText"
                            >
                              <template #prepend>
                                <q-icon name="search" />
                              </template>
                            </q-input>
                          </div>

                          <div class="col-3">
                            <q-select
                              v-model="selectedTag"
                              :options="tagOptions"
                              use-input
                              dense
                              outlined
                              label="Tag"
                            />
                          </div>
                        </div>

                        <!-- Upload Button -->
                        <div class="q-mb-md">
                          <q-file
                            v-model="uploadedFile"
                            dense
                            outlined
                            label="Upload File"
                            accept=".pdf,.doc,.docx,.xls,.xlsx"
                          >
                            <template #append>
                              <q-btn
                                class="usa-button--brand-info"
                                label="UPLOAD"
                                @click="showUploadDialog = true"
                              />
                            </template>
                          </q-file>
                        </div>

                        <q-separator class="q-my-md" />

                        <!-- Document List -->
                        <div v-if="!documents.length" class="empty-doc-box">
                          No documents yet. Click <b>Upload</b> to add files.
                        </div>

                        <div v-else>
                          <div v-for="doc in filteredDocuments" :key="doc.id" class="doc-item">
                            <div>
                              <div class="doc-name">{{ doc.name }}</div>
                              <div class="doc-tag">{{ doc.tag }}</div>
                            </div>

                            <q-btn
                              flat
                              round
                              dense
                              icon="delete"
                              color="red"
                              @click="removeDocument(doc.id)"
                            />
                          </div>
                        </div>
                      </q-card-section>

                      <!-- Footer -->
                      <q-card-actions align="right">
                        <q-btn flat label="CLOSE" v-close-popup />
                      </q-card-actions>
                    </q-card>
                  </q-dialog>

                  <q-dialog v-model="showUploadDialog" persistent>
                    <q-card class="upload-dialog">
                      <!-- Header -->
                      <div class="upload-header">
                        <div class="row items-center justify-between">
                          <div class="text-h6">
                            <q-icon name="upload_file" class="q-mr-sm" />
                            Upload documents
                          </div>

                          <q-btn flat round dense icon="close" @click="showUploadDialog = false" />
                        </div>
                      </div>

                      <q-card-section>
                        <!-- Note -->
                        <q-input
                          v-model="uploadNote"
                          outlined
                          dense
                          label="Note (optional)"
                          class="q-mb-md"
                        />

                        <!-- Tags -->
                        <q-select
                          v-model="uploadTags"
                          :options="tagOptions"
                          outlined
                          dense
                          label="Tags (optional)"
                          class="q-mb-md"
                        />

                        <!-- File Drop Area -->
                        <q-file
                          v-model="uploadFiles"
                          multiple
                          outlined
                          use-chips
                          counter
                          max-file-size="52428800"
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                          class="q-mb-sm"
                        >
                          <template #prepend>
                            <q-icon name="cloud_upload" />
                          </template>
                        </q-file>

                        <div class="text-caption text-grey-7 q-mt-sm">
                          Tip: Max 50 MB per file. You can add tags now; they'll be saved with every
                          file in this batch.
                        </div>
                      </q-card-section>

                      <!-- Footer -->
                      <q-card-actions align="right">
                        <q-btn flat label="CANCEL" @click="showUploadDialog = false" />
                        <q-btn
                          class="usa-button--brand-info"
                          label="START UPLOAD"
                          :disable="!uploadFiles.length"
                          @click="startUpload"
                        />
                      </q-card-actions>
                    </q-card>
                  </q-dialog>

                  <q-btn color="info" label="ADD NOTES" @click="showNotesDialog = true" />
                  <q-dialog v-model="showNotesDialog" persistent>
                    <q-card class="simple-notes-dialog">
                      <!-- Header -->
                      <q-card-section>
                        <div class="text-h6">Add Notes</div>
                      </q-card-section>

                      <!-- Body -->
                      <q-card-section>
                        <q-input
                          v-model="noteText"
                          type="textarea"
                          autogrow
                          borderless
                          placeholder="Add Note"
                          class="simple-note-input"
                        />
                      </q-card-section>

                      <!-- Footer -->
                      <q-card-actions align="right">
                        <q-btn flat label="CANCEL" v-close-popup color="info" />
                        <q-btn flat label="ADD" color="info" @click="addNote" />
                      </q-card-actions>
                    </q-card>
                  </q-dialog>
                </div>
              </div>
              <SupplierRateSheetU
                ref="sheetRef"
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

.bulk-dialog {
  min-width: 600px;
  max-width: 650px;
  border-radius: 8px;
  overflow: hidden;
}

/* Header Section */
.bulk-header {
  background: #147c80;
  color: #ffffff;
  padding: 15px;
}

.bulk-header .text-h6 {
  font-weight: 400;
  font-size: 1.1rem;
}

.bulk-header .text-subtitle2 {
  font-size: 0.8rem;
  margin-top: 4px;
  font-weight: 400;
}

/* Rules empty box */
.empty-rule-box {
  padding: 10px;
  border-radius: 6px;
  text-align: center;
  color: #8c8c8c;
  font-size: 0.9rem;
}

.rule-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f7f7f7;
  padding: 8px;
  border-radius: 6px;
  margin-bottom: 10px;
  border: 1px solid #e0e0e0;
}

.rule-left {
  display: flex;
  flex-direction: column;
}

.rule-material {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.rule-size {
  font-size: 13px;
  color: #777;
  margin-top: 4px;
}

.rule-right {
  display: flex;
  align-items: center;
}

/* Footer buttons spacing */
.bulk-dialog .q-card__actions {
  border-top: 1px solid #e0e0e0;
}

.document-dialog {
  min-width: 600px;
  max-width: 650px;
}

.empty-doc-box {
  background: #f5f5f5;
  padding: 20px;
  text-align: center;
  border-radius: 6px;
  color: #777;
}

.doc-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #fafafa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 8px;
}

.doc-name {
  font-weight: 600;
}

.doc-tag {
  font-size: 12px;
  color: #888;
}

.upload-dialog {
  min-width: 600px;
  max-width: 650px;
  border-radius: 8px;
  overflow: hidden;
}

.upload-header {
  background: #31ccec;
  color: white;
  padding: 10px;
}

.simple-notes-dialog {
  min-width: 450px;
  border-radius: 6px;
}

.simple-note-input {
  border-bottom: 2px solid #31ccec;
}
</style>
