<template>
  <div class="univer-wrapper">
    <div ref="container" class="univer-container"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, shallowRef } from 'vue';

// 1. Core & Presets
import { createUniver, defaultTheme, LocaleType, mergeLocales } from '@univerjs/presets';
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core';
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US';
import '@univerjs/preset-sheets-core/lib/index.css';

// 2. Data Validation Preset
import { UniverSheetsDataValidationPreset } from '@univerjs/preset-sheets-data-validation';
import UniverPresetSheetsDataValidationEnUS from '@univerjs/preset-sheets-data-validation/locales/en-US';
import '@univerjs/preset-sheets-data-validation/lib/index.css';

// 3. Types
import { UniverInstanceType, type IWorkbookData, type Univer } from '@univerjs/core';

const props = defineProps<{
  initialData?: IWorkbookData;
}>();

const container = ref<HTMLElement | null>(null);
const univerInstance = shallowRef<Univer | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const workbook = shallowRef<any>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const univerAPIRef = shallowRef<any>(null);

onMounted(() => {
  if (!container.value) return;

  const { univer, univerAPI } = createUniver({
    locale: LocaleType.EN_US,
    locales: {
      [LocaleType.EN_US]: mergeLocales(
        UniverPresetSheetsCoreEnUS,
        UniverPresetSheetsDataValidationEnUS,
      ),
    },
    theme: defaultTheme,
    presets: [
      UniverSheetsCorePreset({
        container: container.value,
        header: false,
        footer: false,
      }),
      UniverSheetsDataValidationPreset({
        showSearchOnDropdown: false,
        showEditOnDropdown: false,
      }),
    ],
  });

  univerInstance.value = univer;
  univerAPIRef.value = univerAPI;

  workbook.value = univer.createUnit(UniverInstanceType.UNIVER_SHEET, props.initialData || {});

  const sheetId = Object.keys(props.initialData?.sheets || {})[0] || 'sheet-01';
  const sheetData = props.initialData?.sheets?.[sheetId];
  const cellData = sheetData?.cellData || {};

  const totalKeys = Object.keys(cellData).length;
  const materialCount = totalKeys > 0 ? totalKeys - 1 : 0;

  if (materialCount > 0) {
    const endRow = 1 + materialCount;
    // Build the range string for column B (Unit), e.g. "B2:B4"
    const rangeStr = `B2:B${endRow}`;

    const fWorkbook = univerAPI.getActiveWorkbook();
    if (fWorkbook) {
      const fWorksheet = fWorkbook.getActiveSheet();
      if (fWorksheet) {
        const fRange = fWorksheet.getRange(rangeStr);
        const rule = univerAPI
          .newDataValidation()
          .requireValueInList(['per Kg', 'per Unit'])
          .setOptions({
            showDropDown: true,
            showErrorMessage: true,
            error: 'Please select a valid unit',
          })
          .build();
        fRange.setDataValidation(rule);
      }
    }
  }
});

onBeforeUnmount(() => {
  if (univerInstance.value) {
    univerInstance.value.dispose();
  }
});

function setCellValue(range: string, value: number) {
  const univerAPI = univerAPIRef.value;
  if (!univerAPI) return;
  const fWorkbook = univerAPI.getActiveWorkbook();
  if (!fWorkbook) return;

  const fWorksheet = fWorkbook.getActiveSheet();
  if (!fWorksheet) return;

  fWorksheet.getRange(range).setValue(value);
}

defineExpose({
  setCellValue,
  getData: () => {
    return workbook.value?.save();
  },
});
</script>

<style scoped>
.univer-wrapper {
  width: 100%;
  height: 400px;
  border: 1px solid #e0e0e0;
}

.univer-container {
  width: 100%;
  height: 100%;
}
</style>
