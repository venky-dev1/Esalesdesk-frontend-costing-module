<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMaterialsStore } from '../../stores/material';
import { useProductConfigStore } from '../../stores/productConfig';
import type { Material } from '../../stores/material';
import SupplierRateSheetU from './SupplierRateSheetU.vue';
import type { DropdownConfig } from './types';
import type { IWorkbookData, ICellData } from '@univerjs/core';
import { LocaleType, BooleanNumber } from '@univerjs/core';
import { SUB_MATERIALS_MAP, CAST_WEIGHT_DATA, OperationCostData } from 'src/constants/dummyData';
import { useSupplierRatesStore } from '../../stores/supplierRates';

const materialsStore = useMaterialsStore();
const configStore = useProductConfigStore();
const supplierRatesStore = useSupplierRatesStore();

const searchBom = ref('');
const activeTab = ref('ATTRIBUTES');
const selectedBomNode = ref<string | null>(null);
const expanded = ref(['ROOT']);

const landedCost = ref({
  overhead: 8,
  freight: 2,
  sga: 5,
});

const categoryTabs = [
  { name: 'ATTRIBUTES', icon: 'tune', label: 'Attributes' },
  { name: 'MATERIALS', icon: 'science', label: 'Materials' },
  { name: 'OPERATIONS', icon: 'precision_manufacturing', label: 'Operations' },
  { name: 'TESTING', icon: 'rule', label: 'Testing' },
  { name: 'TOOLING', icon: 'construction', label: 'Tooling' },
  { name: 'LANDED COST', icon: 'receipt_long', label: 'Landed Cost' },
  { name: 'PREVIEW', icon: 'analytics', label: 'Preview' },
];
interface BomNode {
  label: string;
  key: string;
  qty: number;
  children?: BomNode[];
}

const buildTree = (materials: Material[]): BomNode[] => {
  return materials.map((m) => ({
    label: m.name,
    key: m.id,
    qty: m.qty,
    children: m.children ? buildTree(m.children) : [],
  }));
};

const bomTree = computed<BomNode[]>(() => {
  const rootLabel = configStore.product || 'UNSPECIFIED PRODUCT';

  return [
    {
      label: rootLabel,
      key: 'ROOT',
      qty: 1,
      children: buildTree(materialsStore.materials),
    },
  ];
});

const duplicateItem = (node: BomNode) => {
  if (node.key === 'ROOT') return;

  const material = materialsStore.materials.find((m) => m.id === node.key);

  if (!material) return;

  materialsStore.addMaterial({
    name: material.name,
    qty: material.qty,
    type: material.type,
  });
};

const deleteItem = (id: string) => {
  if (id === 'ROOT') return;
  materialsStore.deleteMaterial(id);
};

const addChildMaterial = () => {
  if (!selectedBomNode.value || selectedBomNode.value === 'ROOT') return;

  const addChildRecursively = (materials: Material[]): boolean => {
    for (const mat of materials) {
      if (mat.id === selectedBomNode.value) {
        if (!mat.children) mat.children = [];

        mat.children.push({
          id: crypto.randomUUID(),
          name: 'NEW MATERIAL',
          qty: 1,
          type: 'MAKE',
          sourcing: [],
          children: [],
        });

        expanded.value.push(mat.id);
        return true;
      }

      if (mat.children && addChildRecursively(mat.children)) {
        return true;
      }
    }
    return false;
  };

  addChildRecursively(materialsStore.materials);
};

const isMaterialSelected = computed(() => {
  return selectedBomNode.value && selectedBomNode.value !== 'ROOT';
});
const activeTabLabel = computed(() => {
  const tab = categoryTabs.find((t) => t.name === activeTab.value);
  return tab ? tab.label.toLowerCase() : '';
});

const findNode = (nodes: Material[], id: string): Material | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

const getEmptyWorkbook = (): IWorkbookData => ({
  id: 'empty',
  appVersion: '3.0.0',
  sheets: {},
  locale: LocaleType.EN_US,
  name: '',
  sheetOrder: [],
  styles: {},
});

const getAttributesColumns = (): { title: string; width: number }[] => [
  { title: 'Attribute Name', width: 150 },
  { title: 'Unit', width: 100 },
  { title: 'Base Material', width: 150 },
];

const getMaterialsColumns = (): { title: string; width: number }[] => [
  { title: 'Material', width: 150 },
];

const getOperationsColumns = (): { title: string; width: number }[] => [
  { title: 'Material', width: 150 },
  { title: 'Operation Name', width: 180 },
  { title: 'Unit', width: 150 },
];

const getTestingColumns = (): { title: string; width: number }[] => [
  { title: 'Test Name', width: 180 },
  { title: 'Unit', width: 150 },
];

const getToolingColumns = (): { title: string; width: number }[] => [
  { title: 'Tooling Name', width: 180 },
  { title: 'Unit', width: 150 },
  { title: 'Life Cycles', width: 100 },
  { title: 'Start Date', width: 100 },
  { title: 'End Date', width: 100 },
  { title: 'Already Made', width: 100 },
];

const getPreviewColumns = (): { title: string; width: number }[] => [
  { title: 'Material', width: 200 },
  { title: 'Unit', width: 150 },
];

const getColumnsForTab = (tabName: string): { title: string; width: number }[] => {
  switch (tabName) {
    case 'ATTRIBUTES':
      return getAttributesColumns();
    case 'MATERIALS':
      return getMaterialsColumns();
    case 'OPERATIONS':
      return getOperationsColumns();
    case 'TESTING':
      return getTestingColumns();
    case 'TOOLING':
      return getToolingColumns();
    case 'PREVIEW':
      return getPreviewColumns();
    default:
      return [];
  }
};

let dataRowCount = 0;
const currentWorkbookData = computed((): IWorkbookData => {
  if (!selectedBomNode.value || selectedBomNode.value === 'ROOT') return getEmptyWorkbook();

  const selectedNode = findNode(materialsStore.materials, selectedBomNode.value);
  if (!selectedNode) return getEmptyWorkbook();

  const sizes = configStore.selectedSizes;
  const tab = activeTab.value;

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

  const wrapStyle = { ht: 2, vt: 2, tb: 3, fs: 10, cl: { rgb: '#71767a' } };

  const columns = getColumnsForTab(tab);

  if (columns.length > 0) {
    sizes.forEach((size) => {
      const colWidth = tab === 'MATERIALS' ? 290 : 120;

      columns.push({ title: size, width: colWidth });
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cellData: Record<string, any> = {};

  const headerRowData: Record<string, ICellData> = {};
  columns.forEach((col, index) => {
    headerRowData[`${index}`] = { v: col.title, s: headerStyle };
  });
  cellData['0'] = headerRowData;

  if (tab === 'ATTRIBUTES') {
    const parentLabel = selectedNode.name;

    const subMaterials = SUB_MATERIALS_MAP[parentLabel] || [selectedNode.name];

    subMaterials.forEach((subMat, rowIndex) => {
      const actualRowIndex = rowIndex + 1;

      const rowCells: Record<string, ICellData> = {};

      rowCells['0'] = { v: 'Cast Weight', s: wrapStyle };

      rowCells['1'] = { v: 'Weight(kg)', s: { ...wrapStyle } };

      rowCells['2'] = { v: subMat, s: { ...wrapStyle } };

      const castWeightForMaterial = CAST_WEIGHT_DATA[parentLabel];
      const castWeightForSubMat = castWeightForMaterial?.[subMat];
      sizes.forEach((size, colIndex) => {
        const cleanSize = size.replace(/"/g, '');
        const weight =
          castWeightForSubMat?.[cleanSize] ?? castWeightForSubMat?.[parseFloat(cleanSize)] ?? '';
        rowCells[`${colIndex + 3}`] = {
          v: weight,
          s: { vt: 2, ht: 2, cl: { rgb: '#71767a' } },
        };
      });

      cellData[`${actualRowIndex}`] = rowCells;
    });

    // Surface Area rows after all Cast Weight rows
    const saStartRow = subMaterials.length + 1;

    const saInternalCells: Record<string, ICellData> = {};
    saInternalCells['0'] = { v: 'Surface Area Internal', s: wrapStyle };
    saInternalCells['1'] = { v: 'SurfaceArea(m2)', s: { ...wrapStyle } };
    cellData[`${saStartRow}`] = saInternalCells;

    const saExternalCells: Record<string, ICellData> = {};
    saExternalCells['0'] = { v: 'Surface Area External', s: wrapStyle };
    saExternalCells['1'] = { v: 'SurfaceArea(m2)', s: { ...wrapStyle } };
    cellData[`${saStartRow + 1}`] = saExternalCells;

    dataRowCount = subMaterials.length + 2; // cast weight rows + 2 surface area rows
  } else if (tab === 'MATERIALS') {
    const parentLabel = selectedNode.name;
    const matList = SUB_MATERIALS_MAP[parentLabel] || [selectedNode.name];

    matList.forEach((subMat, rowIndex) => {
      const actualRowIndex = rowIndex + 1;

      const rowCells: Record<string, ICellData> = {
        '0': { v: subMat, s: wrapStyle },
      };

      // Populate each size column with the best available rate from the store
      sizes.forEach((size, colIndex) => {
        const cleanSize = size.replace(/"/g, '');
        const entries = supplierRatesStore.getEntriesForCell(parentLabel, subMat, cleanSize);

        // Show the first entry as "processType | supplier | ₹rate" if available
        const entry = entries.length > 0 ? entries[0]! : null;
        const cellValue = entry ? `${entry.processType} | ${entry.supplier} | ₹${entry.rate}` : '';
        rowCells[`${colIndex + 1}`] = {
          v: cellValue,
          s: { vt: 2, ht: 2, cl: { rgb: '#71767a' }, tb: 3, fs: 8 },
        };
      });

      cellData[`${actualRowIndex}`] = rowCells;
    });

    dataRowCount = matList.length;
  } else if (tab === 'OPERATIONS') {
    const parentLabel = selectedNode.name;
    const matList = SUB_MATERIALS_MAP[parentLabel] || [selectedNode.name];

    let currentRow = 1;

    matList.forEach((subMat, rowIndex) => {
      const componentOps = OperationCostData[parentLabel];
      const materialOps = componentOps ? componentOps[subMat] : null;

      if (!materialOps) {
        cellData[`${rowIndex + 1}`] = {
          '0': { v: subMat, s: wrapStyle },
          '1': { v: 'No Ops Data', s: { ...wrapStyle, fs: 9, cl: { rgb: '#999999' } } },
        };
        currentRow++;
        return;
      }
      Object.entries(materialOps).forEach(([opName, sizeCosts]) => {
        const rowCells: Record<string, ICellData> = {};
        rowCells['0'] = {
          v: subMat,
          s: { ...wrapStyle },
        };
        rowCells['1'] = { v: opName.replace(/_/g, ' '), s: wrapStyle };
        rowCells['2'] = { v: 'Per Unit', s: { ...wrapStyle, ht: 2 } };
        sizes.forEach((size, colIndex) => {
          const cleanSize = size.replace(/"/g, '');

          const cost = sizeCosts[cleanSize] || sizeCosts[parseFloat(cleanSize)] || 0;

          rowCells[`${colIndex + 3}`] = {
            v: cost ? `${cost}` : '-',
            s: { vt: 2, ht: 2, cl: { rgb: '#71767a' }, fs: 10 },
          };
        });
        cellData[`${currentRow}`] = rowCells;
        currentRow++;
      });
    });
    dataRowCount = currentRow - 1;
  }

  return {
    id: `${selectedBomNode.value}-${tab}`,
    appVersion: '3.0.0',
    sheets: {
      'sheet-01': {
        id: 'sheet-01',
        name: tab,
        cellData: cellData,
        rowCount: 1 + dataRowCount + 1, // header + data + 1 buffer
        columnCount: Math.max(1, columns.length),
        columnHeader: {
          height: 20,
          hidden: BooleanNumber.TRUE,
        },
        columnData: columns.reduce((acc, col, i) => ({ ...acc, [i]: { w: col.width } }), {}),
        defaultRowHeight: 35,
      },
    },
    locale: LocaleType.EN_US,
    name: tab,
    sheetOrder: ['sheet-01'],
    styles: {},
  };
});

const tabInfoMap: Record<string, { title: string; desc?: string }> = {
  ATTRIBUTES: {
    title: 'Attributes by Size',
    desc: 'Fill in attributes (kg, surface area) for each size.',
  },
  MATERIALS: {
    title: 'Material Suppliers by Size',
  },
  OPERATIONS: {
    title: 'Operations Cost by Size',
  },
  TESTING: {
    title: 'Testing Cost by Size',
  },
  TOOLING: {
    title: 'Tooling Amortization',
  },
  PREVIEW: {
    title: 'Total Cost Overview (Material + Ops + Testing)',
  },
};

const currentTabInfo = computed(() => {
  return tabInfoMap[activeTab.value] || { title: '', desc: '' };
});

const selectedNodeData = computed(() => {
  if (!selectedBomNode.value || selectedBomNode.value === 'ROOT') return null;
  return findNode(materialsStore.materials, selectedBomNode.value);
});

const overheadLabel = computed(() => {
  return selectedNodeData.value ? `${selectedNodeData.value.name} Overhead %` : 'Company Overhead';
});

// Map tab name to the index of the "Unit" column (0-based), or -1 if no Unit column
const unitColumnIndexMap: Record<string, number> = {
  ATTRIBUTES: 1,
  OPERATIONS: 2,
};

// "Base Material" column index per tab (0-based), only ATTRIBUTES has one
const baseMaterialColumnIndexMap: Record<string, number> = {
  ATTRIBUTES: 2,
};

function getAttributesDataRowCount(): number {
  if (!selectedBomNode.value || selectedBomNode.value === 'ROOT') return 0;
  const selectedNode = findNode(materialsStore.materials, selectedBomNode.value);
  if (!selectedNode) return 0;
  const subMaterials = SUB_MATERIALS_MAP[selectedNode.name] || [selectedNode.name];
  return subMaterials.length + 2; // cast weight rows + 2 surface area rows
}

const unitOptionsByTab: Record<string, string[]> = {
  ATTRIBUTES: ['Weight(kg)', 'SurfaceArea(m2)', 'Per Unit'],
  OPERATIONS: ['Per Kg', 'Per m2', 'Per Unit'],
};

const costEngineDropdownConfigs = computed((): DropdownConfig[] | undefined => {
  const tab = activeTab.value;

  if (!selectedBomNode.value || selectedBomNode.value === 'ROOT') return undefined;

  const configs: DropdownConfig[] = [];

  // 1. Unit column dropdown
  const unitColIndex = unitColumnIndexMap[tab];

  if (unitColIndex !== undefined && unitColIndex >= 0) {
    const colLetter = String.fromCharCode(65 + unitColIndex);

    let lastRow = 5;

    if (tab === 'ATTRIBUTES') {
      lastRow = getAttributesDataRowCount() + 1;
    } else if (tab === 'OPERATIONS') {
      lastRow = dataRowCount + 1;
    }

    configs.push({
      range: `${colLetter}2:${colLetter}${lastRow}`,
      values: unitOptionsByTab[tab] || [],
    });
  }

  // 2. Base Material column dropdown (filled with sub-materials)
  const baseMatColIndex = baseMaterialColumnIndexMap[tab];
  if (baseMatColIndex !== undefined && baseMatColIndex >= 0) {
    const selectedNode = findNode(materialsStore.materials, selectedBomNode.value);
    if (selectedNode) {
      const subMaterials = SUB_MATERIALS_MAP[selectedNode.name] || [selectedNode.name];
      if (subMaterials.length > 0) {
        const colLetter = String.fromCharCode(65 + baseMatColIndex);
        const lastRow = subMaterials.length + 1; // only cast weight rows have base material
        configs.push({
          range: `${colLetter}2:${colLetter}${lastRow}`,
          values: subMaterials,
        });
      }
    }
  }

  // 3. MATERIALS tab dynamic supplier dropdowns
  if (tab === 'MATERIALS') {
    const selectedNode = findNode(materialsStore.materials, selectedBomNode.value);
    if (selectedNode) {
      const subMaterials = SUB_MATERIALS_MAP[selectedNode.name] || [selectedNode.name];
      const sizes = configStore.selectedSizes || ['2', '4', '6'];

      subMaterials.forEach((subMat, rowIdx) => {
        sizes.forEach((size, colIdx) => {
          const cleanSize = size.replace(/"/g, '');
          const entries = supplierRatesStore.getEntriesForCell(
            selectedNode.name,
            subMat,
            cleanSize,
          );

          const options = entries.map((e) => `${e.processType} | ${e.supplier} | ₹${e.rate}`);

          if (options.length > 0) {
            const colLetter = String.fromCharCode(64 + colIdx + 2);
            const rowNum = rowIdx + 2;
            configs.push({
              range: `${colLetter}${rowNum}`,
              values: options,
            });
          }
        });
      });
    }
  }

  return configs.length > 0 ? configs : undefined;
});
</script>

<template>
  <div class="cost-engine">
    <!-- Header -->
    <div class="row items-center justify-between">
      <div class="step-header q-mb-none">
        <h4 class="step-title q-ma-none">Cost Engine Configurator</h4>
        <p class="step-description q-ma-none">
          Configure materials, processes, testing, tooling & overheads for each BoM line
        </p>
      </div>
      <q-btn
        class="usa-button--brand-accent"
        label="RUN COST & SAVE"
        icon="check_circle"
        unelevated
      />
    </div>
    <q-separator class="q-mb-md" />

    <!-- Main layout -->
    <div class="row q-col-gutter-md cost-engine-body">
      <!-- LEFT: BOM Tree Panel -->
      <div class="col-12 col-md-3" style="display: flex; flex-direction: column">
        <q-card
          flat
          bordered
          class="bom-card"
          style="flex: 1; display: flex; flex-direction: column; min-height: 0"
        >
          <!-- Search bar -->
          <q-card-section class="q-pa-sm">
            <q-input v-model="searchBom" dense outlined placeholder="Search BoM..." color="info">
              <template #prepend>
                <q-icon name="search" />
              </template>
              <template #after>
                <q-btn
                  round
                  flat
                  icon="add"
                  color="grey-7"
                  size="md"
                  :disable="!selectedBomNode || selectedBomNode === 'ROOT'"
                  @click="addChildMaterial"
                >
                  <q-tooltip>Add child material</q-tooltip>
                </q-btn>
              </template>
            </q-input>
          </q-card-section>
          <q-separator />

          <!-- Scrollable tree -->
          <div class="bom-scroll">
            <q-card-section class="q-pa-none">
              <q-tree
                :nodes="bomTree"
                node-key="key"
                v-model:selected="selectedBomNode"
                v-model:expanded="expanded"
                :filter="searchBom"
                default-expand-all
                class="bom-tree"
              >
                <template #default-header="prop">
                  <div
                    class="row items-center justify-between full-width bom-node"
                    :class="{ 'bom-node--active': prop.node.key === selectedBomNode }"
                  >
                    <!-- LEFT SIDE -->
                    <div class="row items-center">
                      <q-icon
                        :name="prop.node.key === 'ROOT' ? 'inventory_2' : 'category'"
                        size="22px"
                        class="q-mr-sm"
                        :color="
                          prop.node.key === selectedBomNode
                            ? 'accent'
                            : prop.node.key === 'ROOT'
                              ? 'accent'
                              : 'grey-7'
                        "
                      />
                      <div>
                        <div
                          class="bom-node-label"
                          :class="{ 'bom-node-label--active': prop.node.key === selectedBomNode }"
                        >
                          {{ prop.node.label }}
                        </div>
                        <div class="text-caption text-grey-6" style="font-size: 0.7rem">
                          QTY: {{ prop.node.qty }}
                        </div>
                      </div>
                    </div>

                    <!-- RIGHT SIDE -->
                    <q-btn flat round dense icon="more_vert" size="sm" color="grey-7" @click.stop>
                      <q-menu anchor="bottom right" self="top right">
                        <q-list dense style="min-width: 120px">
                          <q-item clickable v-close-popup @click="duplicateItem(prop.node)">
                            <q-item-section avatar>
                              <q-icon name="content_copy" size="xs" />
                            </q-item-section>
                            <q-item-section>Duplicate</q-item-section>
                          </q-item>
                          <q-separator />
                          <q-item
                            clickable
                            v-close-popup
                            class="text-negative"
                            @click="deleteItem(prop.node.key)"
                          >
                            <q-item-section avatar>
                              <q-icon name="delete_outline" size="xs" />
                            </q-item-section>
                            <q-item-section>Delete</q-item-section>
                          </q-item>
                        </q-list>
                      </q-menu>
                    </q-btn>
                  </div>
                </template>
              </q-tree>
            </q-card-section>
          </div>
        </q-card>
      </div>

      <!-- RIGHT: Configuration Panel -->
      <div class="col-12 col-md-9" style="display: flex; flex-direction: column">
        <q-card
          flat
          bordered
          class="config-card"
          style="flex: 1; display: flex; flex-direction: column; min-height: 0"
        >
          <!-- Tabs -->
          <q-tabs
            v-model="activeTab"
            dense
            class="config-tabs"
            active-color="accent"
            indicator-color="accent"
            align="left"
            narrow-indicator
          >
            <q-tab v-for="tab in categoryTabs" :key="tab.name" :name="tab.name">
              <div class="column items-center q-py-xs">
                <q-icon :name="tab.icon" size="25px" />
                <div class="tab-label">{{ tab.label }}</div>
              </div>
            </q-tab>
          </q-tabs>
          <q-separator />

          <!-- Scrollable content area -->

          <!-- Empty state -->
          <div v-if="!isMaterialSelected" class="empty-state">
            <div class="column items-center justify-center">
              <q-icon name="account_tree" size="56px" color="grey-4" />
              <div class="text-h6 text-grey-5 q-mt-md">No BoM Node Selected</div>
              <div class="text-body2 text-grey-6 q-mt-xs text-center" style="max-width: 300px">
                Select a BoM line from the tree on the left to configure
                {{ activeTabLabel }}
              </div>
            </div>
          </div>

          <!-- Landed Cost panel -->
          <div v-else-if="activeTab === 'LANDED COST'" class="q-pa-md">
            <fieldset class="usa-fieldset">
              <legend class="usa-legend">Landed Cost Configuration</legend>
              <div class="row q-col-gutter-lg">
                <div class="col-12 col-md-4">
                  <label class="usa-label"
                    >{{ overheadLabel }} <span class="text-negative required-star">*</span></label
                  >
                  <q-input
                    v-model.number="landedCost.overhead"
                    outlined
                    dense
                    type="number"
                    suffix="%"
                    hint="Applied to total cost"
                    color="accent"
                  />
                </div>
                <div class="col-12 col-md-4">
                  <label class="usa-label"
                    >Freight <span class="text-negative required-star">*</span></label
                  >
                  <q-input
                    v-model.number="landedCost.freight"
                    outlined
                    dense
                    type="number"
                    suffix="%"
                    hint="Logistics markup"
                    color="accent"
                  />
                </div>
                <div class="col-12 col-md-4">
                  <label class="usa-label"
                    >SG&A <span class="text-negative required-star">*</span></label
                  >
                  <q-input
                    v-model.number="landedCost.sga"
                    outlined
                    dense
                    type="number"
                    suffix="%"
                    hint="Selling, General & Admin"
                    color="accent"
                  />
                </div>
              </div>
            </fieldset>
          </div>

          <!-- Sheet / Spreadsheet content -->
          <div v-else class="sheet-wrapper q-pa-md column">
            <div class="sheet-header q-mb-md">
              <div class="text-subtitle1" style="font-weight: 600; color: #1b1b1b">
                {{ currentTabInfo.title }}
              </div>
              <div class="text-caption text-grey-7">{{ currentTabInfo.desc }}</div>
            </div>

            <div class="col relative-position">
              <SupplierRateSheetU
                :key="`${selectedBomNode}-${activeTab}`"
                :initial-data="currentWorkbookData"
                :dropdown-configs="costEngineDropdownConfigs"
              />
            </div>
          </div>
        </q-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Card containers ── */
.bom-card,
.config-card {
  border-radius: 4px;
  border-color: #c9c9c9;
}

/* ── BOM tree scroll area ── */
.bom-scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.cost-engine-body {
  min-height: 400px;
}

/* ── BOM tree node styles ── */
.bom-tree :deep(.q-tree__node-header) {
  padding: 6px 8px;
  border-radius: 4px;
  font-weight: 500;
  color: #1b1b1b;
  transition: background-color 0.15s ease;
}

.bom-tree :deep(.q-tree__node-header:hover) {
  background-color: #f5f7fa;
}

.bom-tree :deep(.q-tree__node--selected > .q-tree__node-header) {
  background-color: #ede7f6;
  border-left: 3px solid #7b1fa2;
  box-shadow: inset 0 0 0 1px rgba(123, 31, 162, 0.12);
}

.bom-node--active .bom-node-label {
  color: #7b1fa2 !important;
}

.bom-node-label--active {
  color: #7b1fa2 !important;
  font-weight: 700;
}

.bom-node-label {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #1b1b1b;
  line-height: 1.3;
}

/* ── Tab bar ── */
.config-tabs {
  background-color: #f5f7fa;
  color: #71767a;
}

.tab-label {
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  margin-top: 2px;
  letter-spacing: 0.02em;
}

/* ── Empty state ── */
.empty-state {
  min-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafbfc;
}

/* ── USWDS Fieldset (matches Step1) ── */
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

/* ── Sheet area ── */
.sheet-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.sheet-wrapper .col {
  flex: 1;
  overflow: hidden;
}

/* ── Focus reset & scroll-jump prevention ── */
.bom-tree :deep(.q-tree__node-header:focus),
.bom-tree :deep(.q-tree__node-header:focus-visible) {
  outline: none !important;
  box-shadow: none !important;
}

/* Prevent scroll anchoring on tree nodes */
.bom-tree :deep(.q-tree__node) {
  overflow-anchor: none;
}

:deep(.q-btn:focus) {
  outline: none !important;
  box-shadow: none !important;
}

/* Prevent tab focus from triggering scroll */
.config-tabs :deep(.q-tab) {
  scroll-margin: 0;
}

.config-tabs :deep(.q-tab:focus),
.config-tabs :deep(.q-tab:focus-visible) {
  outline: none !important;
  box-shadow: none !important;
}
</style>
