// src/constants/dummyData.ts

export const SUB_MATERIALS_MAP: Record<string, string[]> = {
  // MAKE Items
  BODY: ['CI', 'DI', 'WCB', 'CF8', 'CF8M', 'LCB', 'CF3', 'CF3M', '4A', '5A', '6A'],
  DISC: [
    'NDI',
    'ADI',
    'WCB+NYLON COATED',
    'WCB+AROXY COATED',
    'CF8',
    'CF8M',
    'CF3M',
    'C95400',
    'DUPLEX 4A',
    'DUPLEX 5A',
    'DUPLEX 6A',
    'CF3',
    'LCB+NYLON COATED',
    'LCB+AROXY COATED',
  ],

  // BUY Items
  SEAT: [
    'EPDM Black',
    'BUNA Black',
    'VITON',
    'SILICONE',
    'WHITE EPDM',
    'WHITE NBR',
    'HNBR',
    'HYPALON',
  ],
  STEM: ['SS 410', 'SS316', '17-4PH', 'F51', 'F53', 'F55'],
  PACKING: ['Corrugated Box'],
  OPERATOR: ['BARE', 'LEVER', 'GEAR'],
  COMPONENTS: [
    'Bushing',
    'Double U Cup Seal',
    'Retainer Ring,Internal Circlip',
    'External Circlip',
    'Spacer',
    'Bottom Plate',
    'Name Plate',
    'Parallel Key',
    'Thrust Bearing',
    'CAUTION STICKER,PAPER',
    'HAMMER SCREW',
  ],
};

// Helper to determine the Unit column based on Material Type
export const getUnitForMaterial = (materialName: string): string => {
  const buyItems = ['SEAT', 'STEM', 'PACKING', 'OPERATOR', 'COMPONENTS'];
  return buyItems.includes(materialName) ? 'per Unit' : 'per Kg';
};
