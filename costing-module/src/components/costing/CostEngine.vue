<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMaterialsStore } from '../../stores/material';
import { useProductConfigStore } from '../../stores/productConfig';
import type { Material } from '../../stores/material';

const materialsStore = useMaterialsStore();
const configStore = useProductConfigStore();

const searchBom = ref('');
const activeTab = ref('ATTRIBUTES');
const selectedBomNode = ref<string | null>(null);
const expanded = ref(['ROOT']);

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
</script>

<template>
  <div>
    <div class="row items-start justify-between q-mb-lg">
      <div class="step-header">
        <h4 class="step-title q-ma-none">Cost Engine Configurator</h4>
        <p class="step-description q-ma-none text-grey-7">
          Configure materials, processes, testing, tooling & overheads for each BoM line
        </p>
      </div>
      <q-btn class="usa-button--brand-info" label="RUN COST & SAVE" icon="check_circle" />
    </div>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-3">
        <q-card flat bordered class="bom-card">
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
                />
              </template>
            </q-input>
          </q-card-section>
          <q-separator />
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
                <div class="row items-center justify-between full-width">
                  <!-- LEFT SIDE -->
                  <div class="row items-center">
                    <q-icon
                      :name="prop.node.key === 'ROOT' ? 'inventory_2' : 'category'"
                      size="25px"
                      class="q-mr-sm"
                    />
                    <div>
                      <div class="text-uppercase">{{ prop.node.label }}</div>
                      <div class="text-caption text-grey-7">qty: {{ prop.node.qty }}</div>
                    </div>
                  </div>

                  <!-- RIGHT SIDE -->
                  <q-btn flat round dense icon="more_vert" size="sm" color="grey-7" @click.stop>
                    <q-menu anchor="bottom right" self="top right">
                      <q-list dense style="min-width: 100px">
                        <q-item clickable v-close-popup @click="duplicateItem(prop.node)">
                          <q-item-section>Duplicate</q-item-section>
                        </q-item>
                        <q-item
                          clickable
                          v-close-popup
                          class="text-negative"
                          @click="deleteItem(prop.node.key)"
                        >
                          <q-item-section>Delete</q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                </div>
              </template>
            </q-tree>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-9">
        <q-card flat bordered class="config-card">
          <q-tabs
            v-model="activeTab"
            dense
            class="text-grey-7 bg-grey-2"
            active-color="info"
            indicator-color="info"
            align="left"
            narrow-indicator
          >
            <q-tab v-for="tab in categoryTabs" :key="tab.name" :name="tab.name">
              <div class="column items-center q-py-xs">
                <q-icon :name="tab.icon" size="sm" />
                <div class="tab-label">{{ tab.label }}</div>
              </div>
            </q-tab>
          </q-tabs>
          <q-separator />

          <div v-if="!isMaterialSelected" class="empty-state">
            <div class="column items-center justify-center q-pa-xl">
              <q-icon name="info" size="lg" color="grey-6" />
              <div class="text-grey-7 q-mt-md text-center">
                Select a BoM line from the left to configure {{ activeTabLabel }}
              </div>
            </div>
          </div>

          <div v-else>hii</div>
        </q-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bom-card,
.config-card {
  border-radius: 4px;
}
.bom-tree :deep(.q-tree__node-header) {
  padding: 6px;
  border-radius: 4px;
  font-weight: 500;
  color: #1b1b1b;
}

.tab-label {
  font-size: 0.9rem;
  font-weight: 500;
  text-transform: uppercase;
  margin-top: 4px;
}

.bom-tree :deep(.q-tree__node-header:focus) {
  outline: none !important;
  box-shadow: none !important;
}
:deep(.q-btn:focus) {
  outline: none !important;
  box-shadow: none !important;
}
.empty-state {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
