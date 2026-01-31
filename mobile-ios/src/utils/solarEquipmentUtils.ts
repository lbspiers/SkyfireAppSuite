// src/utils/solarEquipmentUtils.ts
// Utility functions for solar equipment data handling and validation

import {
  SolarPanel,
  Inverter,
  SolarPanelFormData,
  InverterFormData,
  SolarEquipmentFormErrors,
  SolarPanelCreateRequest,
  InverterCreateRequest
} from '../types/solarEquipment';

// Form validation functions following existing patterns
export const validateSolarPanelForm = (data: SolarPanelFormData): SolarEquipmentFormErrors => {
  const errors: SolarEquipmentFormErrors = {};

  // Required fields
  if (!data.manufacturerModel?.trim()) {
    errors.manufacturerModel = 'Manufacturer model is required';
  }

  if (!data.manufacturer?.trim()) {
    errors.manufacturer = 'Manufacturer is required';
  }

  if (!data.modelNumber?.trim()) {
    errors.modelNumber = 'Model number is required';
  }

  // Numeric validations
  if (data.nameplatePmax) {
    const pmax = parseFloat(data.nameplatePmax);
    if (isNaN(pmax) || pmax <= 0) {
      errors.nameplatePmax = 'Nameplate Pmax must be a positive number';
    }
  }

  if (data.ptc) {
    const ptc = parseFloat(data.ptc);
    if (isNaN(ptc) || ptc <= 0) {
      errors.ptc = 'PTC must be a positive number';
    }
  }

  if (data.nameplateVpmax) {
    const vpmax = parseFloat(data.nameplateVpmax);
    if (isNaN(vpmax) || vpmax <= 0) {
      errors.nameplateVpmax = 'Nameplate Vpmax must be a positive number';
    }
  }

  if (data.nameplateIpmax) {
    const ipmax = parseFloat(data.nameplateIpmax);
    if (isNaN(ipmax) || ipmax <= 0) {
      errors.nameplateIpmax = 'Nameplate Ipmax must be a positive number';
    }
  }

  if (data.nameplateVoc) {
    const voc = parseFloat(data.nameplateVoc);
    if (isNaN(voc) || voc <= 0) {
      errors.nameplateVoc = 'Nameplate Voc must be a positive number';
    }
  }

  if (data.nameplateIsc) {
    const isc = parseFloat(data.nameplateIsc);
    if (isNaN(isc) || isc <= 0) {
      errors.nameplateIsc = 'Nameplate Isc must be a positive number';
    }
  }

  if (data.averageNoct) {
    const noct = parseFloat(data.averageNoct);
    if (isNaN(noct) || noct <= 0) {
      errors.averageNoct = 'Average NOCT must be a positive number';
    }
  }

  if (data.nS) {
    const ns = parseInt(data.nS);
    if (isNaN(ns) || ns <= 0) {
      errors.nS = 'Number of cells must be a positive integer';
    }
  }

  if (data.shortFt) {
    const shortFt = parseFloat(data.shortFt);
    if (isNaN(shortFt) || shortFt <= 0) {
      errors.shortFt = 'Short dimension must be a positive number';
    }
  }

  if (data.longFt) {
    const longFt = parseFloat(data.longFt);
    if (isNaN(longFt) || longFt <= 0) {
      errors.longFt = 'Long dimension must be a positive number';
    }
  }

  if (data.weightLbs) {
    const weight = parseFloat(data.weightLbs);
    if (isNaN(weight) || weight <= 0) {
      errors.weightLbs = 'Weight must be a positive number';
    }
  }

  return errors;
};

export const validateInverterForm = (data: InverterFormData): SolarEquipmentFormErrors => {
  const errors: SolarEquipmentFormErrors = {};

  // Required fields
  if (!data.makeModel?.trim()) {
    errors.makeModel = 'Make model is required';
  }

  if (!data.manufacturerName?.trim()) {
    errors.manufacturerName = 'Manufacturer name is required';
  }

  if (!data.modelNumber?.trim()) {
    errors.modelNumber = 'Model number is required';
  }

  // Numeric validations
  if (data.maxContinuousOutputPowerKw) {
    const power = parseFloat(data.maxContinuousOutputPowerKw);
    if (isNaN(power) || power <= 0) {
      errors.maxContinuousOutputPowerKw = 'Max continuous output power must be a positive number';
    }
  }

  if (data.nominalVoltageVac) {
    const voltage = parseInt(data.nominalVoltageVac);
    if (isNaN(voltage) || voltage <= 0) {
      errors.nominalVoltageVac = 'Nominal voltage must be a positive integer';
    }
  }

  if (data.weightedEfficiencyPercent) {
    const efficiency = parseFloat(data.weightedEfficiencyPercent);
    if (isNaN(efficiency) || efficiency <= 0 || efficiency > 100) {
      errors.weightedEfficiencyPercent = 'Weighted efficiency must be between 0 and 100';
    }
  }

  if (data.cecEfficiency) {
    const cecEff = parseFloat(data.cecEfficiency);
    if (isNaN(cecEff) || cecEff <= 0 || cecEff > 100) {
      errors.cecEfficiency = 'CEC efficiency must be between 0 and 100';
    }
  }

  if (data.voltageMinimum) {
    const vMin = parseFloat(data.voltageMinimum);
    if (isNaN(vMin) || vMin < 0) {
      errors.voltageMinimum = 'Minimum voltage must be a non-negative number';
    }
  }

  if (data.voltageNominal) {
    const vNom = parseFloat(data.voltageNominal);
    if (isNaN(vNom) || vNom <= 0) {
      errors.voltageNominal = 'Nominal voltage must be a positive number';
    }
  }

  if (data.voltageMaximum) {
    const vMax = parseFloat(data.voltageMaximum);
    if (isNaN(vMax) || vMax <= 0) {
      errors.voltageMaximum = 'Maximum voltage must be a positive number';
    }

    // Validate voltage range logic
    const vMin = parseFloat(data.voltageMinimum || '0');
    const vNom = parseFloat(data.voltageNominal || '0');
    if (!isNaN(vMin) && !isNaN(vNom) && !isNaN(vMax)) {
      if (vMin >= vNom) {
        errors.voltageMinimum = 'Minimum voltage must be less than nominal voltage';
      }
      if (vNom >= vMax) {
        errors.voltageNominal = 'Nominal voltage must be less than maximum voltage';
      }
    }
  }

  if (data.maxStringsBranches) {
    const maxStrings = parseInt(data.maxStringsBranches);
    if (isNaN(maxStrings) || maxStrings <= 0) {
      errors.maxStringsBranches = 'Max strings/branches must be a positive integer';
    }
  }

  return errors;
};

// Data transformation functions following existing patterns
export const transformSolarPanelFormToRequest = (formData: SolarPanelFormData): SolarPanelCreateRequest => {
  return {
    manufacturerModel: formData.manufacturerModel.trim(),
    manufacturer: formData.manufacturer?.trim() || undefined,
    modelNumber: formData.modelNumber?.trim() || undefined,
    description: formData.description?.trim() || undefined,
    nameplatePmax: formData.nameplatePmax ? parseFloat(formData.nameplatePmax) : undefined,
    ptc: formData.ptc ? parseFloat(formData.ptc) : undefined,
    nameplateVpmax: formData.nameplateVpmax ? parseFloat(formData.nameplateVpmax) : undefined,
    nameplateIpmax: formData.nameplateIpmax ? parseFloat(formData.nameplateIpmax) : undefined,
    nameplateVoc: formData.nameplateVoc ? parseFloat(formData.nameplateVoc) : undefined,
    nameplateIsc: formData.nameplateIsc ? parseFloat(formData.nameplateIsc) : undefined,
    averageNoct: formData.averageNoct ? parseFloat(formData.averageNoct) : undefined,
    nS: formData.nS ? parseInt(formData.nS) : undefined,
    shortFt: formData.shortFt ? parseFloat(formData.shortFt) : undefined,
    longFt: formData.longFt ? parseFloat(formData.longFt) : undefined,
    weightLbs: formData.weightLbs ? parseFloat(formData.weightLbs) : undefined,
  };
};

export const transformInverterFormToRequest = (formData: InverterFormData): InverterCreateRequest => {
  return {
    makeModel: formData.makeModel.trim(),
    manufacturerName: formData.manufacturerName?.trim() || undefined,
    modelNumber: formData.modelNumber?.trim() || undefined,
    description: formData.description?.trim() || undefined,
    maxContinuousOutputPowerKw: formData.maxContinuousOutputPowerKw ? parseFloat(formData.maxContinuousOutputPowerKw) : undefined,
    nominalVoltageVac: formData.nominalVoltageVac ? parseInt(formData.nominalVoltageVac) : undefined,
    weightedEfficiencyPercent: formData.weightedEfficiencyPercent ? parseFloat(formData.weightedEfficiencyPercent) : undefined,
    builtInMeter: formData.builtInMeter,
    microinverter: formData.microinverter,
    powerOptimizer: formData.powerOptimizer,
    nightTareLoss: formData.nightTareLoss ? parseFloat(formData.nightTareLoss) : undefined,
    voltageMinimum: formData.voltageMinimum ? parseFloat(formData.voltageMinimum) : undefined,
    voltageNominal: formData.voltageNominal ? parseFloat(formData.voltageNominal) : undefined,
    voltageMaximum: formData.voltageMaximum ? parseFloat(formData.voltageMaximum) : undefined,
    cecEfficiency: formData.cecEfficiency ? parseFloat(formData.cecEfficiency) : undefined,
    maxContOutputAmps: formData.maxContOutputAmps ? parseFloat(formData.maxContOutputAmps) : undefined,
    maxInputIsc1: formData.maxInputIsc1 ? parseFloat(formData.maxInputIsc1) : undefined,
    maxInputIsc2: formData.maxInputIsc2 ? parseFloat(formData.maxInputIsc2) : undefined,
    maxInputIsc3: formData.maxInputIsc3 ? parseFloat(formData.maxInputIsc3) : undefined,
    maxInputIsc4: formData.maxInputIsc4 ? parseFloat(formData.maxInputIsc4) : undefined,
    maxInputIsc5: formData.maxInputIsc5 ? parseFloat(formData.maxInputIsc5) : undefined,
    maxInputIsc6: formData.maxInputIsc6 ? parseFloat(formData.maxInputIsc6) : undefined,
    maxInputIsc7: formData.maxInputIsc7 ? parseFloat(formData.maxInputIsc7) : undefined,
    maxInputIsc8: formData.maxInputIsc8 ? parseFloat(formData.maxInputIsc8) : undefined,
    maxInputIsc9: formData.maxInputIsc9 ? parseFloat(formData.maxInputIsc9) : undefined,
    maxInputIsc10: formData.maxInputIsc10 ? parseFloat(formData.maxInputIsc10) : undefined,
    maxInputIsc11: formData.maxInputIsc11 ? parseFloat(formData.maxInputIsc11) : undefined,
    maxInputIsc12: formData.maxInputIsc12 ? parseFloat(formData.maxInputIsc12) : undefined,
    solaredgeSeries: formData.solaredgeSeries?.trim() || undefined,
    hybrid: formData.hybrid?.trim() || undefined,
    equipmentType: formData.equipmentType?.trim() || undefined,
    maxStringsBranches: formData.maxStringsBranches ? parseInt(formData.maxStringsBranches) : undefined,
  };
};

// Convert API data to form data
export const transformSolarPanelToForm = (panel: SolarPanel): SolarPanelFormData => {
  return {
    manufacturerModel: panel.manufacturerModel || '',
    manufacturer: panel.manufacturer || '',
    modelNumber: panel.modelNumber || '',
    description: panel.description || '',
    nameplatePmax: panel.nameplatePmax?.toString() || '',
    ptc: panel.ptc?.toString() || '',
    nameplateVpmax: panel.nameplateVpmax?.toString() || '',
    nameplateIpmax: panel.nameplateIpmax?.toString() || '',
    nameplateVoc: panel.nameplateVoc?.toString() || '',
    nameplateIsc: panel.nameplateIsc?.toString() || '',
    averageNoct: panel.averageNoct?.toString() || '',
    nS: panel.nS?.toString() || '',
    shortFt: panel.shortFt?.toString() || '',
    longFt: panel.longFt?.toString() || '',
    weightLbs: panel.weightLbs?.toString() || '',
  };
};

export const transformInverterToForm = (inverter: Inverter): InverterFormData => {
  return {
    makeModel: inverter.makeModel || '',
    manufacturerName: inverter.manufacturerName || '',
    modelNumber: inverter.modelNumber || '',
    description: inverter.description || '',
    maxContinuousOutputPowerKw: inverter.maxContinuousOutputPowerKw?.toString() || '',
    nominalVoltageVac: inverter.nominalVoltageVac?.toString() || '',
    weightedEfficiencyPercent: inverter.weightedEfficiencyPercent?.toString() || '',
    builtInMeter: inverter.builtInMeter || false,
    microinverter: inverter.microinverter || false,
    powerOptimizer: inverter.powerOptimizer || false,
    nightTareLoss: inverter.nightTareLoss?.toString() || '',
    voltageMinimum: inverter.voltageMinimum?.toString() || '',
    voltageNominal: inverter.voltageNominal?.toString() || '',
    voltageMaximum: inverter.voltageMaximum?.toString() || '',
    cecEfficiency: inverter.cecEfficiency?.toString() || '',
    maxContOutputAmps: inverter.maxContOutputAmps?.toString() || '',
    maxInputIsc1: inverter.maxInputIsc1?.toString() || '',
    maxInputIsc2: inverter.maxInputIsc2?.toString() || '',
    maxInputIsc3: inverter.maxInputIsc3?.toString() || '',
    maxInputIsc4: inverter.maxInputIsc4?.toString() || '',
    maxInputIsc5: inverter.maxInputIsc5?.toString() || '',
    maxInputIsc6: inverter.maxInputIsc6?.toString() || '',
    maxInputIsc7: inverter.maxInputIsc7?.toString() || '',
    maxInputIsc8: inverter.maxInputIsc8?.toString() || '',
    maxInputIsc9: inverter.maxInputIsc9?.toString() || '',
    maxInputIsc10: inverter.maxInputIsc10?.toString() || '',
    maxInputIsc11: inverter.maxInputIsc11?.toString() || '',
    maxInputIsc12: inverter.maxInputIsc12?.toString() || '',
    solaredgeSeries: inverter.solaredgeSeries || '',
    hybrid: inverter.hybrid || '',
    equipmentType: inverter.equipmentType || '',
    maxStringsBranches: inverter.maxStringsBranches?.toString() || '',
  };
};

// Utility functions for calculations and data processing
export const calculateSolarPanelArea = (panel: SolarPanel): number | null => {
  if (!panel.shortFt || !panel.longFt) return null;
  return panel.shortFt * panel.longFt;
};

export const calculateSolarPanelEfficiency = (panel: SolarPanel): number | null => {
  if (!panel.nameplatePmax || !panel.shortFt || !panel.longFt) return null;
  const area = calculateSolarPanelArea(panel);
  if (!area) return null;

  // Efficiency = (Power Output / (Area * Solar Irradiance)) * 100
  // Assuming standard test conditions of 1000 W/m²
  const areaInM2 = area * 0.092903; // Convert ft² to m²
  const irradiance = 1000; // W/m²

  return (panel.nameplatePmax / (areaInM2 * irradiance)) * 100;
};

export const calculateInverterDCACRatio = (inverterPowerKw: number, panelWattage: number, panelQuantity: number): number | null => {
  if (!inverterPowerKw || !panelWattage || !panelQuantity) return null;

  const totalDCPower = (panelWattage * panelQuantity) / 1000; // Convert to kW
  return totalDCPower / inverterPowerKw;
};

export const getInverterTypeDescription = (inverter: Inverter): string => {
  const types = [];

  if (inverter.microinverter) types.push('Microinverter');
  if (inverter.powerOptimizer) types.push('Power Optimizer');
  if (inverter.builtInMeter) types.push('Built-in Meter');

  if (types.length === 0) {
    return 'String Inverter';
  }

  return types.join(', ');
};

export const formatWattage = (wattage?: number): string => {
  if (!wattage) return 'N/A';

  if (wattage >= 1000) {
    return `${(wattage / 1000).toFixed(1)}kW`;
  }

  return `${wattage}W`;
};

export const formatEfficiency = (efficiency?: number): string => {
  if (!efficiency) return 'N/A';
  return `${efficiency.toFixed(1)}%`;
};

export const formatVoltage = (voltage?: number): string => {
  if (!voltage) return 'N/A';
  return `${voltage}V`;
};

export const formatCurrent = (current?: number): string => {
  if (!current) return 'N/A';
  return `${current}A`;
};

export const formatDimensions = (shortFt?: number, longFt?: number): string => {
  if (!shortFt || !longFt) return 'N/A';
  return `${shortFt}" × ${longFt}"`;
};

export const formatWeight = (weightLbs?: number): string => {
  if (!weightLbs) return 'N/A';
  return `${weightLbs} lbs`;
};

// Search and filter utilities
export const searchSolarPanels = (panels: SolarPanel[], query: string): SolarPanel[] => {
  if (!query.trim()) return panels;

  const lowercaseQuery = query.toLowerCase();

  return panels.filter(panel =>
    panel.manufacturer?.toLowerCase().includes(lowercaseQuery) ||
    panel.modelNumber?.toLowerCase().includes(lowercaseQuery) ||
    panel.manufacturerModel?.toLowerCase().includes(lowercaseQuery) ||
    panel.description?.toLowerCase().includes(lowercaseQuery)
  );
};

export const searchInverters = (inverters: Inverter[], query: string): Inverter[] => {
  if (!query.trim()) return inverters;

  const lowercaseQuery = query.toLowerCase();

  return inverters.filter(inverter =>
    inverter.manufacturerName?.toLowerCase().includes(lowercaseQuery) ||
    inverter.modelNumber?.toLowerCase().includes(lowercaseQuery) ||
    inverter.makeModel?.toLowerCase().includes(lowercaseQuery) ||
    inverter.description?.toLowerCase().includes(lowercaseQuery) ||
    inverter.equipmentType?.toLowerCase().includes(lowercaseQuery)
  );
};

// Sort utilities
export const sortSolarPanels = (panels: SolarPanel[], sortBy: string, sortOrder: 'ASC' | 'DESC' = 'ASC'): SolarPanel[] => {
  const sorted = [...panels].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'manufacturer':
        aValue = a.manufacturer || '';
        bValue = b.manufacturer || '';
        break;
      case 'modelNumber':
        aValue = a.modelNumber || '';
        bValue = b.modelNumber || '';
        break;
      case 'nameplatePmax':
        aValue = a.nameplatePmax || 0;
        bValue = b.nameplatePmax || 0;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'string') {
      return sortOrder === 'ASC' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else {
      return sortOrder === 'ASC' ? aValue - bValue : bValue - aValue;
    }
  });

  return sorted;
};

export const sortInverters = (inverters: Inverter[], sortBy: string, sortOrder: 'ASC' | 'DESC' = 'ASC'): Inverter[] => {
  const sorted = [...inverters].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'manufacturerName':
        aValue = a.manufacturerName || '';
        bValue = b.manufacturerName || '';
        break;
      case 'modelNumber':
        aValue = a.modelNumber || '';
        bValue = b.modelNumber || '';
        break;
      case 'maxContinuousOutputPowerKw':
        aValue = a.maxContinuousOutputPowerKw || 0;
        bValue = b.maxContinuousOutputPowerKw || 0;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'string') {
      return sortOrder === 'ASC' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else {
      return sortOrder === 'ASC' ? aValue - bValue : bValue - aValue;
    }
  });

  return sorted;
};