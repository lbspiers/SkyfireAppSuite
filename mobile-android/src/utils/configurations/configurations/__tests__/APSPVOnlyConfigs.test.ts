// APSPVOnlyConfigs.test.ts
// Test suite for APS PV-Only BOS configuration detection

import { apsPVOnlyDetector } from '../APSPVOnlyConfigs';
import { EquipmentState } from '../../types/ConfigurationTypes';

// Mock equipment state for Inverter PV-Only
const mockInverterPVOnly: EquipmentState = {
  projectId: 'test-project-123',
  systemPrefix: 'sys1_',
  systemNumber: 1,
  utilityName: 'APS',
  utilityState: 'AZ',
  utilityBOSCombination: '',
  hasSolarPanels: true,
  solarMake: 'REC',
  solarModel: 'REC400AA',
  solarQuantity: 20,
  solarWattage: 400,
  systemType: 'inverter',
  inverterMake: 'SolarEdge',
  inverterModel: 'SE7600H-US',
  inverterType: 'grid-following',
  inverterQuantity: 1,
  batteryQuantity: 0, // No batteries
  batteryChargingSource: 'grid-only',
  hasSMS: false, // No SMS
  hasGateway: false, // No gateway
  hasBackupPanel: false, // No backup panel
  backupOption: 'None',
  couplingType: 'AC',
  hasMultipleBatteries: false,
  hasDifferentBatteryTypes: false,
  isStandbyOnly: false,
  requiresBackupPower: false,
  supportsPeakShaving: false,
};

// Mock equipment state for Microinverter PV-Only
const mockMicroinverterPVOnly: EquipmentState = {
  ...mockInverterPVOnly,
  systemType: 'microinverter',
  microInverterMake: 'Enphase',
  microInverterModel: 'IQ8PLUS-72-2-US',
  inverterMake: undefined,
  inverterModel: undefined,
  inverterType: null,
};

// Mock equipment state that should NOT match (has batteries)
const mockWithBatteries: EquipmentState = {
  ...mockInverterPVOnly,
  batteryQuantity: 2,
  batteryMake: 'Franklin',
  batteryModel: 'aPower X',
};

// Mock equipment state that should NOT match (System 2)
const mockSystem2: EquipmentState = {
  ...mockInverterPVOnly,
  systemNumber: 2,
  systemPrefix: 'sys2_',
};

// Mock equipment state that should NOT match (has SMS)
const mockWithSMS: EquipmentState = {
  ...mockInverterPVOnly,
  hasSMS: true,
  smsMake: 'Franklin',
  smsModel: 'Agate',
};

describe('APS PV-Only Configuration Detector', () => {
  describe('apsPVOnlyDetector - Inverter System', () => {
    test('should match standard inverter PV-only system', () => {
      const result = apsPVOnlyDetector.detect(mockInverterPVOnly);

      expect(result).not.toBeNull();
      expect(result?.configId).toBe('aps_pv_only');
      expect(result?.configName).toContain('Inverter');
      expect(result?.configName).toContain('No Battery');
      expect(result?.priority).toBe(4);
      expect(result?.confidence).toBe('exact');
      expect(result?.bosEquipment).toHaveLength(2); // 2 pre-combine BOS
    });

    test('should have correct BOS equipment structure', () => {
      const result = apsPVOnlyDetector.detect(mockInverterPVOnly);

      expect(result).not.toBeNull();

      const utilityBOS = result?.bosEquipment.filter(item => item.section === 'utility');

      expect(utilityBOS).toHaveLength(2);

      // Check first BOS is auto-selected Milbank meter
      expect(utilityBOS?.[0].equipmentType).toBe('Uni-Directional Meter');
      expect(utilityBOS?.[0].make).toBe('Milbank');
      expect(utilityBOS?.[0].model).toBe('U5929XL');
      expect(utilityBOS?.[0].autoSelected).toBe(true);

      // Check second BOS is utility disconnect
      expect(utilityBOS?.[1].equipmentType).toBe('Utility Disconnect');
    });

    test('should have correct equipment sections for inverter', () => {
      const result = apsPVOnlyDetector.detect(mockInverterPVOnly);

      expect(result).not.toBeNull();
      expect(result?.equipmentSections.solar).toBe(true);
      expect(result?.equipmentSections.inverter).toBe(true);
      expect(result?.equipmentSections.microInverter).toBe(false);
      expect(result?.equipmentSections.battery1).toBe(false);
      expect(result?.equipmentSections.backupLoadSubPanel).toBe(false);
      expect(result?.equipmentSections.sms).toBe(false);
      expect(result?.equipmentSections.ess).toBe(false);
      expect(result?.equipmentSections.stringCombinerPanel).toBe(true); // Inverter has string combiner
    });

    test('quickCheck should pass for valid inverter equipment', () => {
      const quickCheckResult = apsPVOnlyDetector.quickCheck!(mockInverterPVOnly);
      expect(quickCheckResult).toBe(true);
    });
  });

  describe('apsPVOnlyDetector - Microinverter System', () => {
    test('should match standard microinverter PV-only system', () => {
      const result = apsPVOnlyDetector.detect(mockMicroinverterPVOnly);

      expect(result).not.toBeNull();
      expect(result?.configId).toBe('aps_pv_only');
      expect(result?.configName).toContain('Microinverter');
      expect(result?.configName).toContain('No Battery');
      expect(result?.priority).toBe(4);
      expect(result?.confidence).toBe('exact');
      expect(result?.bosEquipment).toHaveLength(2); // Same BOS structure
    });

    test('should have correct equipment sections for microinverter', () => {
      const result = apsPVOnlyDetector.detect(mockMicroinverterPVOnly);

      expect(result).not.toBeNull();
      expect(result?.equipmentSections.solar).toBe(true);
      expect(result?.equipmentSections.inverter).toBe(false);
      expect(result?.equipmentSections.microInverter).toBe(true);
      expect(result?.equipmentSections.battery1).toBe(false);
      expect(result?.equipmentSections.backupLoadSubPanel).toBe(false);
      expect(result?.equipmentSections.sms).toBe(false);
      expect(result?.equipmentSections.ess).toBe(false);
      expect(result?.equipmentSections.stringCombinerPanel).toBe(false); // Microinverter doesn't have string combiner
    });

    test('quickCheck should pass for valid microinverter equipment', () => {
      const quickCheckResult = apsPVOnlyDetector.quickCheck!(mockMicroinverterPVOnly);
      expect(quickCheckResult).toBe(true);
    });
  });

  describe('Negative Cases', () => {
    test('should NOT match system with batteries', () => {
      const result = apsPVOnlyDetector.detect(mockWithBatteries);
      expect(result).toBeNull();
    });

    test('should NOT match System 2 (multi-system)', () => {
      const result = apsPVOnlyDetector.detect(mockSystem2);
      expect(result).toBeNull();
    });

    test('should NOT match system with SMS', () => {
      const result = apsPVOnlyDetector.detect(mockWithSMS);
      expect(result).toBeNull();
    });

    test('quickCheck should fail for system with batteries', () => {
      const quickCheckResult = apsPVOnlyDetector.quickCheck!(mockWithBatteries);
      expect(quickCheckResult).toBe(false);
    });
  });

  describe('Configuration Properties', () => {
    test('should have correct priority', () => {
      expect(apsPVOnlyDetector.priority).toBe(4);
    });

    test('should target APS utility only', () => {
      expect(apsPVOnlyDetector.utilities).toContain('APS');
    });

    test('should have warning about no backup power', () => {
      const result = apsPVOnlyDetector.detect(mockInverterPVOnly);

      expect(result).not.toBeNull();
      expect(result?.warnings).toBeDefined();
      expect(result?.warnings?.some(w => w.includes('No backup power'))).toBe(true);
    });

    test('should indicate NEC 690.12 compliance', () => {
      const result = apsPVOnlyDetector.detect(mockInverterPVOnly);

      expect(result).not.toBeNull();
      expect(result?.warnings?.some(w => w.includes('NEC 690.12'))).toBe(true);
    });
  });
});
