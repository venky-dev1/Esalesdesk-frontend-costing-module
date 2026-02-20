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
import {
  UniverInstanceType,
  type IWorkbookData,
  type Univer,
  type IDisposable,
} from '@univerjs/core';
import { SetRangeValuesMutation } from '@univerjs/sheets';
import type { ISetRangeValuesMutationParams } from '@univerjs/sheets';
import type { DropdownConfig } from '../../types/types';

// 4. Cell-edit operations (used to block manual editing when protectSheet is true)
import {
  SetCellEditVisibleOperation,
  SetCellEditVisibleWithF2Operation,
  SetCellEditVisibleArrowOperation,
  SetActivateCellEditOperation,
} from '@univerjs/sheets-ui';

const props = defineProps<{
  initialData?: IWorkbookData;
  dropdownConfigs?: DropdownConfig[] | undefined;
  protectSheet?: boolean;
}>();

const emit = defineEmits<{
  (e: 'cellEdited', payload: { row: number; col: number; value: string | number | null }): void;
}>();

const container = ref<HTMLElement | null>(null);
const univerInstance = shallowRef<Univer | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const workbook = shallowRef<any>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const univerAPIRef = shallowRef<any>(null);

let commandDisposable: IDisposable | null = null;
let editBlockDisposable: IDisposable | null = null;

const handleRejection = (event: PromiseRejectionEvent) => {
  if (event.reason?.message === 'Edit blocked: select from dropdown') {
    event.preventDefault();
  }
};

function applyDropdownValidation(range: string, values: string[], strict = false) {
  const univerAPI = univerAPIRef.value;
  if (!univerAPI) return;
  const fWorkbook = univerAPI.getActiveWorkbook();
  if (!fWorkbook) return;
  const fWorksheet = fWorkbook.getActiveSheet();
  if (!fWorksheet) return;

  const fRange = fWorksheet.getRange(range);
  let builder = univerAPI.newDataValidation().requireValueInList(values);
  if (strict) {
    builder = builder.setOptions({
      allowBlank: false,
      showErrorMessage: true,
      error: 'Please select a value from the dropdown',
    });
  }
  const rule = builder.build();
  fRange.setDataValidation(rule);
}

// Command IDs that open the cell editor (typing / double-click / F2 / arrow keys)
const CELL_EDIT_COMMAND_IDS = new Set([
  SetCellEditVisibleOperation.id,
  SetCellEditVisibleWithF2Operation.id,
  SetCellEditVisibleArrowOperation.id,
  SetActivateCellEditOperation.id,
]);

onMounted(() => {
  if (!container.value) return;

  window.addEventListener('unhandledrejection', handleRejection);

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
        // showSearchOnDropdown: false,
        showEditOnDropdown: false,
      }),
    ],
  });

  univerInstance.value = univer;
  univerAPIRef.value = univerAPI;

  workbook.value = univer.createUnit(UniverInstanceType.UNIVER_SHEET, props.initialData || {});

  // Apply dropdown data validation for each config
  if (props.dropdownConfigs) {
    props.dropdownConfigs.forEach((cfg) => {
      applyDropdownValidation(cfg.range, cfg.values, cfg.strict);
    });
  }

  // Block cell editor from opening (prevents typing) while dropdowns still work
  if (props.protectSheet) {
    editBlockDisposable = univerAPI.onBeforeCommandExecute(
      (commandInfo: { id: string; params?: unknown }) => {
        if (CELL_EDIT_COMMAND_IDS.has(commandInfo.id)) {
          throw new Error('Edit blocked: select from dropdown');
        }
      },
    );
  }

  // Listen for cell value changes and emit cellEdited events
  commandDisposable = univerAPI.onCommandExecuted(
    (commandInfo: { id: string; params?: unknown }) => {
      if (commandInfo.id !== SetRangeValuesMutation.id) return;
      const params = commandInfo.params as ISetRangeValuesMutationParams;
      if (!params?.cellValue) return;

      // cellValue is Record<rowIndex, Record<colIndex, ICellData>>
      for (const [rowStr, cols] of Object.entries(params.cellValue)) {
        const row = Number(rowStr);
        if (!cols || typeof cols !== 'object') continue;
        for (const [colStr, cellData] of Object.entries(cols as Record<string, { v?: unknown }>)) {
          const col = Number(colStr);
          const value = cellData?.v ?? null;
          emit('cellEdited', { row, col, value: value as string | number | null });
        }
      }
    },
  );
});

onBeforeUnmount(() => {
  window.removeEventListener('unhandledrejection', handleRejection);
  if (editBlockDisposable) {
    editBlockDisposable.dispose();
    editBlockDisposable = null;
  }
  if (commandDisposable) {
    commandDisposable.dispose();
    commandDisposable = null;
  }
  if (univerInstance.value) {
    univerInstance.value.dispose();
    univerInstance.value = null;
  }
  container.value = null;
  workbook.value = null;
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
  applyDropdownValidation,
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

<!-- Non-scoped: Univer dropdown popup renders outside this component's scope -->
<style>
/* Smaller font + text wrapping for dropdown list items */
.univer-truncate {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: unset !important;
  font-size: 0.5rem !important;
  line-height: 0.5rem !important;
}
</style>
