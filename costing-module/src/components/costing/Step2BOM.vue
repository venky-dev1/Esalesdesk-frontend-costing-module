<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMaterialsStore } from '../../stores/material';
import type { NewMaterial } from '../../types/types';

const materialsStore = useMaterialsStore();

const showAddDialog = ref(false);

const pagination = ref({
  page: 1,
  rowsPerPage: 6,
});

// Table columns
const columns = [
  { name: 'name', label: 'Material Name', field: 'name', align: 'left' as const },
  { name: 'qty', label: 'Qty', field: 'qty', align: 'left' as const },
  { name: 'type', label: 'Type', field: 'type', align: 'left' as const },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'left' as const },
];

const materialsCount = computed(() => materialsStore.materials.length);

function deleteMaterial(id: string) {
  materialsStore.deleteMaterial(id);
}



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
    <!-- ── Header ── -->
    <div class="step-header q-mb-md">
      <h4 class="step-title">Master BOM Definition</h4>
      <p class="step-description">Define material components with quantities</p>
    </div>
    <q-separator class="q-mb-md" />

    <!-- ── Materials Table Card ── -->
    <q-card flat bordered class="section-card q-mb-md">
      <q-card-section class="section-header">
        <q-icon name="list_alt" size="20px" color="primary" class="q-mr-sm" />
        <span class="section-title">Bill of Materials</span>
        <q-badge
          v-if="materialsCount"
          color="primary"
          :label="`${materialsCount} materials`"
          class="q-ml-sm"
        />
        <q-space />
        <q-btn
          class="usa-button--brand action-btn"
          label="Add Material"
          icon="add"
          unelevated
          @click="openDialog"
        />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-none">
        <q-table
          :rows="materialsStore.materials"
          :columns="columns"
          v-model:pagination="pagination"
          row-key="id"
          flat
          class="bom-table"
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
                @click="deleteMaterial(props.row.id)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- ── Add Material Dialog ── -->
    <q-dialog v-model="showAddDialog" persistent>
      <q-card class="add-dialog">
        <q-card-section class="dialog-header">
          <q-icon name="add_circle_outline" size="22px" color="primary" class="q-mr-sm" />
          <span class="dialog-title">Add New Material</span>
        </q-card-section>

        <q-separator />

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

        <q-separator />

        <q-card-actions class="dialog-actions">
          <q-btn
            class="usa-button--brand action-btn"
            label="Add Material"
            icon="check"
            unelevated
            :disable="!newMaterial.name.trim() || !newMaterial.type"
            @click="addMaterial"
          />
          <q-btn class="usa-button--brand-secondary action-btn" label="Cancel" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
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

/* ── Table ── */
.bom-table {
  border: none;
}

:deep(.q-table thead th) {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1b1b1b;
  background-color: #f0f0f0;
  padding: 12px 16px;
  border-bottom: 1px solid #dfe1e2;
}

:deep(.q-table tbody td) {
  font-size: 0.9375rem;
  color: #1b1b1b;
  padding: 10px 16px;
  border-bottom: 1px solid #dfe1e2;
}

:deep(.q-table tbody tr:hover) {
  background-color: #f9fafb;
}

.material-name {
  font-weight: 400;
  color: #71767a;
}

.delete-btn {
  min-width: 80px;
}

/* ── Type Badges ── */
.type-badge-make {
  background-color: #005ea2 !important;
  color: white !important;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 4px;
}

.type-badge-buy {
  background-color: #2e8540 !important;
  color: white !important;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 4px;
}

/* ── Buttons ── */
.action-btn {
  min-width: 120px !important;
  text-transform: none !important;
  font-weight: 500;
}

/* ── Dialog ── */
.add-dialog {
  min-width: 420px;
  border-radius: 6px;
}

.dialog-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: #f9fafb;
}

.dialog-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1b1b1b;
  margin: 0;
}

.dialog-body {
  padding: 20px;
  padding-top: 0px;
}

.form-field {
  width: 100%;
}

.dialog-actions {
  padding: 12px 20px;
  display: flex;
  gap: 12px;
}

/* ── Select / Input overrides ── */
:deep(.q-field--outlined .q-field__control) {
  border-radius: 4px;
}
</style>
