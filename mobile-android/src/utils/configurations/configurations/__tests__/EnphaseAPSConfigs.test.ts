// EnphaseAPSConfigs.test.ts
// Test suite for Enphase APS BOS configuration detection

import {
  enphaseAPSWholeHomeDetector,
  enphaseAPSPartialHomeDetector,
  enphaseAPSNoBackupDetector,
} from '../EnphaseAPSConfigs';
import { EquipmentState } from '../../types/ConfigurationTypes';

// Mock equipment state for Enphase Whole Home Backup
const mockEnphaseWholeHome: EquipmentState = {
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
  systemType: 'microinverter',
  microInverterMake: 'Enphase',
  microInverterModel: 'IQ8PLUS-72-2-US',
  inverterQuantity: 20,
  batteryQuantity: 2,
  batteryMake: 'Enphase',
  batteryModel: 'IQ Battery 10T',
  batteryChargingSource: 'grid-or-renewable',
  batteryMaxContinuousOutput: 80,
  hasSMS: true,
  smsMake: 'Enphase',
  smsModel: 'IQ Gateway',
  hasGateway: true,
  gatewayMake: 'Enphase',
  gatewayModel: 'IQ Gateway',
  hasBackupPanel: true,
  backupOption: 'Whole Home',
  backupPanelBusRating: 200,
  utilityServiceAmps: 200,
  couplingType: 'AC',
  hasMultipleBatteries: true,
  hasDifferentBatteryTypes: false,
  isStandbyOnly: false,
  requiresBackupPower: true,
  supportsPeakShaving: false,
};

// Mock equipment state for Enphase Partial Home Backup
const mockEnphasePartialHome: EquipmentState = {
  ...mockEnphaseWholeHome,
  backupOption: 'Partial Home',
};

// Mock equipment state for Enphase No Backup
const mockEnphaseNoBackup: EquipmentState = {
  ...mockEnphaseWholeHome,
  backupOption: 'None',
  hasBackupPanel: false,
  hasGateway: false,
  requiresBackupPower: false,
};

// Mock equipment state that should NOT match (Franklin battery instead of Enphase)
const mockFranklinBattery: EquipmentState = {
  ...mockEnphaseWholeHome,
  batteryMake: 'Franklin',
  batteryModel: 'aPower X',
};

describe('Enphase APS Configuration Detectors', () => {
  describe('enphaseAPSWholeHomeDetector', () => {
    test('should match Enphase system with Whole Home backup', () => {
      const result = enphaseAPSWholeHomeDetector.detect(mockEnphaseWholeHome);

      expect(result).not.toBeNull();
      expect(result?.configId).toBe('enphase_aps_wholeHome');
      expect(result?.configName).toContain('Whole Home Backup');
      expect(result?.priority).toBe(1);
      expect(result?.confidence).toBe('exact');
      expect(result?.bosEquipment).toHaveLength(3); // 2 pre-combine + 1 post-SMS
    });

    test('should have correct BOS equipment structure', () => {
      const result = enphaseAPSWholeHomeDetector.detect(mockEnphaseWholeHome);

      expect(result).not.toBeNull();

      const utilityBOS = result?.bosEquipment.filter(item => item.section === 'utility');
      const postSMSBOS = result?.bosEquipment.filter(item => item.section === 'post-sms');

      expect(utilityBOS).toHaveLength(2);
      expect(postSMSBOS).toHaveLength(1);

      // Check first utility BOS is auto-selected Milbank meter
      expect(utilityBOS?.[0].equipmentType).toBe('Uni-Directional Meter');
      expect(utilityBOS?.[0].make).toBe('Milbank');
      expect(utilityBOS?.[0].model).toBe('U5929XL');
      expect(utilityBOS?.[0].autoSelected).toBe(true);
    });

    test('should NOT match Franklin battery system', () => {
      const result = enphaseAPSWholeHomeDetector.detect(mockFranklinBattery);
      expect(result).toBeNull();
    });

    test('should NOT match Partial Home backup', () => {
      const result = enphaseAPSWholeHomeDetector.detect(mockEnphasePartialHome);
      expect(result).toBeNull();
    });

    test('quickCheck should pass for valid equipment', () => {
      const quickCheckResult = enphaseAPSWholeHomeDetector.quickCheck!(mockEnphaseWholeHome);
      expect(quickCheckResult).toBe(true);
    });
  });

  describe('enphaseAPSPartialHomeDetector', () => {
    test('should match Enphase system with Partial Home backup', () => {
      const result = enphaseAPSPartialHomeDetector.detect(mockEnphasePartialHome);

      expect(result).not.toBeNull();
      expect(result?.configId).toBe('enphase_aps_partialHome');
      expect(result?.configName).toContain('Partial Home Backup');
      expect(result?.priority).toBe(2);
      expect(result?.confidence).toBe('exact');
      expect(result?.bosEquipment).toHaveLength(3); // Same as whole home
    });

    test('should NOT match Whole Home backup', () => {
      const result = enphaseAPSPartialHomeDetector.detect(mockEnphaseWholeHome);
      expect(result).toBeNull();
    });

    test('quickCheck should pass for valid equipment', () => {
      const quickCheckResult = enphaseAPSPartialHomeDetector.quickCheck!(mockEnphasePartialHome);
      expect(quickCheckResult).toBe(true);
    });
  });

  describe('enphaseAPSNoBackupDetector', () => {
    test('should match Enphase system with No Backup', () => {
      const result = enphaseAPSNoBackupDetector.detect(mockEnphaseNoBackup);

      expect(result).not.toBeNull();
      expect(result?.configId).toBe('enphase_aps_noBackup');
      expect(result?.configName).toContain('No Backup');
      expect(result?.priority).toBe(3);
      expect(result?.confidence).toBe('exact');
      expect(result?.bosEquipment).toHaveLength(3); // Same BOS structure
    });

    test('should have correct equipment sections (no backup panel or gateway)', () => {
      const result = enphaseAPSNoBackupDetector.detect(mockEnphaseNoBackup);

      expect(result).not.toBeNull();
      expect(result?.equipmentSections.backupLoadSubPanel).toBe(false);
      expect(result?.equipmentSections.gateway).toBe(false);
      expect(result?.equipmentSections.sms).toBe(true);
      expect(result?.equipmentSections.microInverter).toBe(true);
    });

    test('should have warning about no backup capability', () => {
      const result = enphaseAPSNoBackupDetector.detect(mockEnphaseNoBackup);

      expect(result).not.toBeNull();
      expect(result?.warnings).toBeDefined();
      expect(result?.warnings?.[0]).toContain('No backup power capability');
    });

    test('quickCheck should pass for valid equipment', () => {
      const quickCheckResult = enphaseAPSNoBackupDetector.quickCheck!(mockEnphaseNoBackup);
      expect(quickCheckResult).toBe(true);
    });
  });

  describe('Priority and Specificity', () => {
    test('all detectors should have correct priority order', () => {
      expect(enphaseAPSWholeHomeDetector.priority).toBe(1);
      expect(enphaseAPSPartialHomeDetector.priority).toBe(2);
      expect(enphaseAPSNoBackupDetector.priority).toBe(3);
    });

    test('all detectors should target APS utility only', () => {
      expect(enphaseAPSWholeHomeDetector.utilities).toContain('APS');
      expect(enphaseAPSPartialHomeDetector.utilities).toContain('APS');
      expect(enphaseAPSNoBackupDetector.utilities).toContain('APS');
    });
  });
});
