<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMaterialsStore } from '../../stores/material';

const materialsStore = useMaterialsStore();

const showAddDialog = ref(false);

// Table columns
const columns = [
  { name: 'name', label: 'Material Name', field: 'name', align: 'left' as const },
  { name: 'qty', label: 'Qty', field: 'qty', align: 'left' as const },
  { name: 'type', label: 'Type', field: 'type', align: 'left' as const },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'left' as const },
];

const materialsCount = computed(() => materialsStore.materials.length);

function deleteMaterial(index: number) {
  materialsStore.deleteMaterial(index);
}

type NewMaterial = {
  name: string;
  qty: number;
  type: 'MAKE' | 'BUY' | null;
};

const newMaterial = ref<NewMaterial>({
  name: '',
  qty: 1,
  type: null,
});

const typeOptions = [
  { label: '-- Select --', value: '', disable: true },
  { label: 'MAKE', value: 'MAKE' },
  { label: 'BUY', value: 'BUY' },
];

function openDialog() {
  newMaterial.value = { name: '', qty: 1, type: null };
  showAddDialog.value = true;
}

function addMaterial() {
  if (newMaterial.value.name.trim() && newMaterial.value.type) {
    materialsStore.addMaterial({
      name: newMaterial.value.name.toUpperCase(),
      qty: newMaterial.value.qty,
      type: newMaterial.value.type,
    });

    showAddDialog.value = false;
  }
}
</script>

<template>
  <div class="step2-bom">
    <!-- Header Row -->

    <div class="step-header q-mb-md">
      <h4 class="step-title">Step 2: Master BOM Definition</h4>
      <p class="step-description">Define material components with quantities</p>
    </div>

    <div class="header-row q-mb-md">
      <q-btn class="usa-button--brand" label="Add Material" icon="add" @click="openDialog" />
      <span class="materials-count">{{ materialsCount }} materials configured</span>
    </div>

    <!-- Add Material Dialog -->
    <q-dialog v-model="showAddDialog" persistent>
      <q-card class="add-dialog">
        <q-card-section class="dialog-header">
          <div class="dialog-title">Add New Material</div>
        </q-card-section>

        <q-card-section class="dialog-body">
          <!-- Material Name -->
          <div class="form-field q-mb-md">
            <label class="usa-label">Material Name <span class="required-star">*</span></label>
            <q-input v-model="newMaterial.name" outlined dense placeholder="e.g., Body" />
          </div>

          <!-- Quantity -->
          <div class="form-field q-mb-md">
            <label class="usa-label">Quantity <span class="required-star">*</span></label>
            <q-input
              v-model.number="newMaterial.qty"
              type="number"
              outlined
              dense
              placeholder="e.g., 1"
              :min="1"
            />
          </div>

          <!-- Type -->
          <div class="form-field">
            <label class="usa-label">Type <span class="required-star">*</span></label>
            <q-select
              v-model="newMaterial.type"
              :options="typeOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              outlined
              dense
              label="Select Type"
            />
          </div>
        </q-card-section>

        <q-card-actions class="dialog-actions">
          <q-btn
            class="usa-button--brand min-btn"
            label="Add Material"
            icon="check"
            :disable="!newMaterial.name.trim() || !newMaterial.type"
            @click="addMaterial"
          />
          <q-btn class="usa-button--brand-secondary min-btn" label="Cancel" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- BOM Table -->
    <q-table
      :rows="materialsStore.materials"
      :columns="columns"
      row-key="name"
      flat
      bordered
      class="bom-table"
      :rows-per-page-options="[0]"
      hide-pagination
    >
      <!-- Material Name Column -->
      <template #body-cell-name="props">
        <q-td :props="props">
          <span class="material-name">{{ props.row.name }}</span>
        </q-td>
      </template>

      <!-- Type Column with Badge -->
      <template #body-cell-type="props">
        <q-td :props="props">
          <q-badge
            :class="props.row.type === 'MAKE' ? 'type-badge-make' : 'type-badge-buy'"
            :label="props.row.type"
          />
        </q-td>
      </template>

      <!-- Actions Column -->
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            class="delete-btn usa-error--brand-button"
            label="Delete"
            dense
            @click="deleteMaterial(props.rowIndex)"
          />
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<style scoped>
/* Header Row */
.header-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.delete-btn {
  min-width: 100px;
}

.materials-count {
  font-size: 0.9375rem;
  color: #71767a;
}

/* Table Styles */
.bom-table {
  border: 1px solid #c9c9c9;
  border-radius: 4px;
}

:deep(.q-table thead th) {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1b1b1b;
  background-color: #f0f0f0;
  padding: 12px 16px;
  border-bottom: 1px solid #c9c9c9;
}

:deep(.q-table tbody td) {
  font-size: 0.9375rem;
  color: #1b1b1b;
  padding: 10px 16px;
  border-bottom: 1px solid #c9c9c9;
}

:deep(.q-table tbody tr:hover) {
  background-color: #f5f5f5;
}

.material-name {
  font-weight: 400;
  color: gray;
}

/* Type Badge - MAKE (Blue) */
.type-badge-make {
  background-color: #005ea2 !important;
  color: white !important;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 4px;
}

/* Type Badge - BUY (Green) */
.type-badge-buy {
  background-color: #2e8540 !important;
  color: white !important;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 4px;
}

/* Dialog Styles */
.add-dialog {
  min-width: 420px;
  border-radius: 4px;
}

.dialog-header {
  padding: 16px 20px;
  border-bottom: 1px solid #c9c9c9;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: #1b1b1b;
  margin: 0;
}

.dialog-body {
  padding: 5px 20px 20px 20px;
}

.form-field {
  width: 100%;
}

.min-btn {
  min-width: 140px !important;
  text-transform: none !important;
}

.min-btn :deep(.q-icon) {
  font-size: 18px;
}

.dialog-actions {
  padding: 16px 20px;
  display: flex;
  gap: 12px;
  border-top: 1px solid #c9c9c9;
}
</style>
