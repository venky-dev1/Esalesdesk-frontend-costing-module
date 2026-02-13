<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import jspreadsheet from 'jspreadsheet-ce';
import 'jspreadsheet-ce/dist/jspreadsheet.css';
import { SUB_MATERIALS_MAP } from '../../constants/dummyData';

const props = defineProps<{
  materialName: string;
  processType: string;
  supplierName: string;
  sizes: string[];
}>();

const spreadsheetRef = ref<HTMLDivElement | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let jexcelInstance: any = null;

// 1. Determine Unit based on Material (Make vs Buy)
const currentUnit = computed(() => {
  const buyItems = ['SEAT', 'STEM', 'PACKING', 'OPERATOR', 'COMPONENTS'];
  return buyItems.includes(props.materialName) ? 'per Unit' : 'per Kg';
});

// 2. Generate Columns dynamically based on Sizes
const getColumns = () => {
  return [
    { type: 'text' as const, title: 'Material', width: 150, readOnly: true },
    {
      type: 'dropdown' as const,
      title: 'Unit',
      width: 100,
      source: ['per Kg', 'per Unit'],
    },
    ...props.sizes.map((size) => ({
      type: 'numeric' as const,
      title: size,
      width: 80,
      decimal: ',',
    })),
  ];
};

// 3. Generate Data Rows (Pre-filled with sub-materials)
const getData = () => {
  const subMaterials = SUB_MATERIALS_MAP[props.materialName] || ['Standard'];

  return subMaterials.map((subMat) => {
    // Row format: [SubMaterial Name, Unit, ...Empty Prices]
    return [subMat, currentUnit.value, ...props.sizes.map(() => '')];
  });
};

// 4. Initialize or Update Sheet
const renderSheet = () => {
  if (!spreadsheetRef.value) return;

  // Destroy existing instance to prevent duplicates
  if (jexcelInstance) {
    jexcelInstance.destroy();
  }

  const options = {
    data: getData(),
    columns: getColumns(),
    tableWidth: '100%',
    loadingSpin: true,
  };

  jexcelInstance = jspreadsheet(spreadsheetRef.value, options);
};

onMounted(() => {
  renderSheet();
});

// Re-render when the user switches tabs (Material/Process/Supplier)
watch(
  () => [props.materialName, props.processType, props.supplierName],
  () => {
    renderSheet();
  },
);
</script>
<template>
  <div class="rate-sheet-container">
    <!-- Scroll container -->
    <div class="sheet-scroll-wrapper">
      <div ref="spreadsheetRef"></div>
    </div>
  </div>
</template>

<style scoped>
.rate-sheet-container {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 16px;
  background: white;
  margin-top: 16px;
}

.sheet-scroll-wrapper {
  overflow: auto;
}

/* Optional: smoother scrolling */
.sheet-scroll-wrapper {
  scrollbar-width: thin;
}

/* Universal Header Styling (Top Columns & Left Rows) */
:deep(.jexcel thead td),
:deep(.jexcel thead th),
:deep(.jexcel_index),
:deep(.jexcel td:first-child),
:deep(.jexcel_corner) {
  background-color: #f5f7fa !important;
  font-weight: 500 !important;
  text-align: center !important;
  color: #1b1b1b !important;
  height: 32px !important;
  border-bottom: 1px solid #dcdcdc !important;
  border-right: 1px solid #dcdcdc !important;
  padding: 4px 8px !important;
  vertical-align: middle !important;
}

/* Data Cell Styling */
:deep(.jexcel tbody td) {
  height: 32px !important;
  padding: 4px 8px !important;
  vertical-align: middle !important;
}

/* Material Column (First data column) Styling */
:deep(.jexcel tbody td[data-x='0']) {
  background-color: #f9f9f9 !important;
  font-weight: 500 !important;
  color: #1b1b1b !important;
  font-weight: 400 !important;
}
</style>
