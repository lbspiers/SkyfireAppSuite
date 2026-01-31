// src/hooks/useBatteryForm.ts
// Specialized hook for battery equipment with coupling type support

import React, { useCallback, useMemo, useEffect } from 'react';
import { useEquipmentForm, SystemNumber } from './useEquipmentForm';
import { useSystemDetails } from './useSystemDetails';
import { getCachedSpecs } from '../services/equipmentService';

interface UseBatteryFormOptions {
  projectUuid: string;
  batteryNumber: 1 | 2;           // Battery 1 or Battery 2
  systemNumber?: SystemNumber;    // Default: 1
}

interface UseBatteryFormReturn {
  // Equipment form return (spread)
  make: string;
  model: string;
  quantity: number | null;
  isExisting: boolean;
  manufacturers: string[];
  models: string[];
  loading: boolean;
  loadingManufacturers: boolean;
  loadingModels: boolean;
  saving: boolean;
  error: string | null;
  setMake: (make: string) => Promise<void>;
  setModel: (model: string) => Promise<void>;
  setQuantity: (qty: number | null) => Promise<void>;
  setIsExisting: (existing: boolean) => Promise<void>;
  clearEquipment: () => Promise<void>;
  refresh: () => Promise<void>;

  // Battery-specific
  tieInLocation: string;
  setTieInLocation: (location: string) => Promise<void>;
  couplingType: string | null;     // From specs (AC/DC coupled)
  specs: Record<string, any> | null; // Full model specs
}

export function useBatteryForm(options: UseBatteryFormOptions): UseBatteryFormReturn {
  const { projectUuid, batteryNumber, systemNumber = 1 } = options;

  const category = batteryNumber === 1 ? 'battery_1' : 'battery_2';

  // Base equipment form
  const equipmentForm = useEquipmentForm({
    projectUuid,
    category,
    systemNumber,
  });

  // System details for additional fields
  const { data: systemData, updateField } = useSystemDetails({ projectUuid });

  // Build tie-in location field name
  const prefix = `sys${systemNumber}_`;
  const tieInFieldName = `${prefix}battery${batteryNumber}_tie_in_location`;

  // Tie-in location
  const tieInLocation = useMemo(() => {
    return systemData?.[tieInFieldName] || '';
  }, [systemData, tieInFieldName]);

  const setTieInLocation = useCallback(async (location: string) => {
    await updateField(tieInFieldName, location || null);
  }, [updateField, tieInFieldName]);

  // Fetch specs when make and model are available
  const [specs, setSpecs] = React.useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (equipmentForm.make && equipmentForm.model) {
      getCachedSpecs('Battery Storage', equipmentForm.make, equipmentForm.model)
        .then(specsData => setSpecs(specsData))
        .catch(err => {
          console.error('[useBatteryForm] Error loading specs:', err);
          setSpecs(null);
        });
    } else {
      setSpecs(null);
    }
  }, [equipmentForm.make, equipmentForm.model]);

  // Extract coupling type from specs
  const couplingType = useMemo(() => {
    if (!specs) return null;
    return specs.couple_type || specs.coupling_type || null;
  }, [specs]);

  return {
    ...equipmentForm,
    tieInLocation,
    setTieInLocation,
    couplingType,
    specs,
  };
}

export default useBatteryForm;
