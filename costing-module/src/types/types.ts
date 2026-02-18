// ─── Material & Sourcing ───────────────────────────────────────────
export interface ProcessSourcing {
    processType: string;
    suppliers: string[];
}

export interface Material {
    id: string;
    name: string;
    qty: number;
    type: 'MAKE' | 'BUY' | null;
    sourcing: ProcessSourcing[];
    children?: Material[];
}

// ─── Supplier Rates ────────────────────────────────────────────────
export interface RateEntry {
    supplier: string;
    processType: string;
    rate: number;
}

export type SizeRates = Record<string, RateEntry[]>;
export type SubMaterialRates = Record<string, SizeRates>;
export type MaterialRates = Record<string, SubMaterialRates>;

// ─── Spreadsheet / Univer ──────────────────────────────────────────
export interface DropdownConfig {
    range: string; // e.g. "B2:B10"
    values: string[]; // e.g. ["per Kg", "per Unit"]
}

// ─── BOM Tree ──────────────────────────────────────────────────────
export interface BomNode {
    label: string;
    key: string;
    qty: number;
    children?: BomNode[];
}

// ─── Step 2 – BOM ──────────────────────────────────────────────────
export type NewMaterial = {
    name: string;
    qty: number;
    type: 'MAKE' | 'BUY' | null;
};

// ─── Supplier Rates UI ─────────────────────────────────────────────
export interface SelectOption {
    label: string;
    value: string;
}

export interface BulkRule {
    material: string;
    rate: number;
    fromSize: string;
    toSize: string;
}

export type SupplierSheetExposed = {
    setCellValue: (range: string, value: number) => void;
};

export type SupplierDocument = {
    id: number;
    name: string;
    tag: string;
    file: File;
};
