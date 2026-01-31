import { isEnphase6CCombiner, ENPHASE_6C_CONFIG } from '../constants';

describe('Enphase 6C Detection', () => {
  test('detects 6C combiner correctly', () => {
    expect(isEnphase6CCombiner('Enphase', 'IQ COMBINER 6C X-IQ-AM1-240-6C')).toBe(true);
    expect(isEnphase6CCombiner('enphase', 'IQ COMBINER 6C X-IQ-AM1-240-6C')).toBe(true);
    expect(isEnphase6CCombiner('ENPHASE', 'Something 6C Something')).toBe(true);
  });

  test('rejects non-6C combiners', () => {
    expect(isEnphase6CCombiner('Enphase', 'IQ COMBINER 4C-ES X-IQ-AM1-240-4C')).toBe(false);
    expect(isEnphase6CCombiner('Enphase', 'IQ COMBINER 3C X-IQ-AM1-240-3C')).toBe(false);
    expect(isEnphase6CCombiner('Cutler-Hammer', '200 Amps')).toBe(false);
  });

  test('handles null/undefined inputs', () => {
    expect(isEnphase6CCombiner(null, null)).toBe(false);
    expect(isEnphase6CCombiner(undefined, undefined)).toBe(false);
    expect(isEnphase6CCombiner('', '')).toBe(false);
  });

  test('case insensitive make matching', () => {
    expect(isEnphase6CCombiner('EnPhAsE', 'IQ COMBINER 6C')).toBe(true);
    expect(isEnphase6CCombiner('enPHASe', 'Something 6C')).toBe(true);
  });
});

describe('Enphase 6C Config', () => {
  test('has correct battery configuration', () => {
    expect(ENPHASE_6C_CONFIG.compatibleBattery.make).toBe('Enphase');
    expect(ENPHASE_6C_CONFIG.compatibleBattery.model).toBe('IQBATTERY-10C-1P-NA');
    expect(ENPHASE_6C_CONFIG.compatibleBattery.displayName).toBe('IQ Battery 10C');
  });

  test('has correct quantity limits', () => {
    expect(ENPHASE_6C_CONFIG.maxBatteriesPerInput).toBe(4);
    expect(ENPHASE_6C_CONFIG.maxTotalBatteries).toBe(8);
  });

  test('has correct combiner configuration', () => {
    expect(ENPHASE_6C_CONFIG.combinerMake).toBe('Enphase');
    expect(ENPHASE_6C_CONFIG.combinerModelPattern).toBe('6C');
  });

  test('has correct battery inputs', () => {
    expect(ENPHASE_6C_CONFIG.batteryInputs).toEqual(['battery1', 'battery2']);
    expect(ENPHASE_6C_CONFIG.batteryInputs.length).toBe(2);
  });
});
