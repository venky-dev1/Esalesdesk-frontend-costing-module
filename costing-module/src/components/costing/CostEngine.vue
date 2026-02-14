<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMaterialsStore } from '../../stores/material';
import { useProductConfigStore } from '../../stores/productConfig';
import type { Material } from '../../stores/material';
import SupplierRateSheetU from './SupplierRateSheetU.vue';
import type { IWorkbookData, ICellData } from '@univerjs/core';
import { LocaleType, BooleanNumber } from '@univerjs/core';

const materialsStore = useMaterialsStore();
const configStore = useProductConfigStore();

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
  { name: 'PREVIEW', icon: 'analytics', label: 'Analytics' },
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

  let columns: { title: string; width: number }[] = [];

  if (tab === 'ATTRIBUTES') {
    columns = [
      { title: 'Attribute Name', width: 150 },
      { title: 'Unit', width: 80 },
      { title: 'Base Material', width: 120 },
    ];
  } else if (tab === 'MATERIALS') {
    columns = [{ title: 'Material', width: 150 }];
  } else if (tab === 'OPERATIONS') {
    columns = [
      { title: 'Material', width: 120 },
      { title: 'Operation Name', width: 180 },
      { title: 'Unit', width: 80 },
    ];
  } else if (tab === 'TESTING') {
    columns = [
      { title: 'Test Name', width: 180 },
      { title: 'Unit', width: 80 },
    ];
  } else if (tab === 'TOOLING') {
    columns = [
      { title: 'Tooling Name', width: 180 },
      { title: 'Unit', width: 80 },
      { title: 'Life Cycles', width: 100 },
      { title: 'Start Date', width: 100 },
      { title: 'End Date', width: 100 },
      { title: 'Already Made', width: 100 },
    ];
  } else if (tab === 'PREVIEW') {
    columns = [
      { title: 'Material', width: 200 },
      { title: 'Unit', width: 80 },
    ];
  }

  if (columns.length > 0) {
    sizes.forEach((size) => {
      columns.push({ title: size, width: 100 });
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cellData: Record<string, any> = {};

  const headerRowData: Record<string, ICellData> = {};
  columns.forEach((col, index) => {
    headerRowData[`${index}`] = { v: col.title, s: headerStyle };
  });
  cellData['0'] = headerRowData;

  return {
    id: `${selectedBomNode.value}-${tab}`,
    appVersion: '3.0.0',
    sheets: {
      'sheet-01': {
        id: 'sheet-01',
        name: tab,
        cellData: cellData,
        rowCount: 50,
        columnCount: Math.max(1, columns.length),
        columnHeader: {
          height: 20,
          hidden: BooleanNumber.TRUE,
        },
        columnData: columns.reduce((acc, col, i) => ({ ...acc, [i]: { w: col.width } }), {}),
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
</script>

<template>
  <div class="cost-engine">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
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
    <div class="row q-col-gutter-md" style="min-height: 0">
      <!-- LEFT: BOM Tree Panel -->
      <div class="col-12 col-md-3">
        <q-card flat bordered class="bom-card">
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
          <q-scroll-area class="bom-scroll">
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
                  <div class="row items-center justify-between full-width bom-node">
                    <!-- LEFT SIDE -->
                    <div class="row items-center">
                      <q-icon
                        :name="prop.node.key === 'ROOT' ? 'inventory_2' : 'category'"
                        size="22px"
                        class="q-mr-sm"
                        :color="prop.node.key === 'ROOT' ? 'accent' : 'grey-7'"
                      />
                      <div>
                        <div class="bom-node-label">{{ prop.node.label }}</div>
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
          </q-scroll-area>
        </q-card>
      </div>

      <!-- RIGHT: Configuration Panel -->
      <div class="col-12 col-md-9">
        <q-card flat bordered class="config-card">
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
          <q-scroll-area class="config-scroll">
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
                />
              </div>
            </div>
          </q-scroll-area>
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
  height: calc(100vh - 180px);
  min-height: 300px;
}

/* ── Config panel scroll area ── */
.config-scroll {
  height: calc(100vh - 185px);
  min-height: 300px;
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
  background-color: #f3e5f5;
  border-left: 3px solid #9c27b0;
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

/* ── Focus reset ── */
.bom-tree :deep(.q-tree__node-header:focus) {
  outline: none !important;
  box-shadow: none !important;
}

:deep(.q-btn:focus) {
  outline: none !important;
  box-shadow: none !important;
}
</style>
