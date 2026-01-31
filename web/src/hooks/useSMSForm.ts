// src/hooks/useSMSForm.ts
// Specialized hook for Storage Management System with breaker overrides

import { useCallback, useMemo } from 'react';
import { useEquipmentForm, SystemNumber } from './useEquipmentForm';
import { useSystemDetails } from './useSystemDetails';

interface UseSMSFormOptions {
  projectUuid: string;
  systemNumber?: SystemNumber;
}

interface UseSMSFormReturn {
  // Equipment form return
  make: string;
  model: string;
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
  setIsExisting: (existing: boolean) => Promise<void>;
  clearEquipment: () => Promise<void>;
  refresh: () => Promise<void>;

  // SMS-specific fields
  mainBreakerRating: string;
  backupPanelBreakerRating: string;
  pvBreakerOverride: string;
  essBreakerOverride: string;
  tieInBreakerOverride: string;
  rsdEnabled: boolean;

  // SMS-specific setters
  setMainBreakerRating: (rating: string) => Promise<void>;
  setBackupPanelBreakerRating: (rating: string) => Promise<void>;
  setPvBreakerOverride: (rating: string) => Promise<void>;
  setEssBreakerOverride: (rating: string) => Promise<void>;
  setTieInBreakerOverride: (rating: string) => Promise<void>;
  setRsdEnabled: (enabled: boolean) => Promise<void>;
}

export function useSMSForm(options: UseSMSFormOptions): UseSMSFormReturn {
  const { projectUuid, systemNumber = 1 } = options;

  // Base equipment form
  const equipmentForm = useEquipmentForm({
    projectUuid,
    category: 'sms',
    systemNumber,
  });

  // System details for additional fields
  const { data: systemData, updateField } = useSystemDetails({ projectUuid });

  const prefix = `sys${systemNumber}_`;

  // SMS-specific field values
  const mainBreakerRating = useMemo(() =>
    systemData?.[`${prefix}sms_breaker_rating`] || '', [systemData, prefix]);
  const backupPanelBreakerRating = useMemo(() =>
    systemData?.[`${prefix}sms_backup_load_sub_panel_breaker_rating`] || '', [systemData, prefix]);
  const pvBreakerOverride = useMemo(() =>
    systemData?.[`${prefix}sms_pv_breaker_rating_override`] || '', [systemData, prefix]);
  const essBreakerOverride = useMemo(() =>
    systemData?.[`${prefix}sms_ess_breaker_rating_override`] || '', [systemData, prefix]);
  const tieInBreakerOverride = useMemo(() =>
    systemData?.[`${prefix}sms_tie_in_breaker_rating_override`] || '', [systemData, prefix]);
  const rsdEnabled = useMemo(() =>
    !!systemData?.[`${prefix}sms_rsd_enabled`], [systemData, prefix]);

  // SMS-specific setters
  const setMainBreakerRating = useCallback(async (rating: string) => {
    await updateField(`${prefix}sms_breaker_rating`, rating || null);
  }, [updateField, prefix]);

  const setBackupPanelBreakerRating = useCallback(async (rating: string) => {
    await updateField(`${prefix}sms_backup_load_sub_panel_breaker_rating`, rating || null);
  }, [updateField, prefix]);

  const setPvBreakerOverride = useCallback(async (rating: string) => {
    await updateField(`${prefix}sms_pv_breaker_rating_override`, rating || null);
  }, [updateField, prefix]);

  const setEssBreakerOverride = useCallback(async (rating: string) => {
    await updateField(`${prefix}sms_ess_breaker_rating_override`, rating || null);
  }, [updateField, prefix]);

  const setTieInBreakerOverride = useCallback(async (rating: string) => {
    await updateField(`${prefix}sms_tie_in_breaker_rating_override`, rating || null);
  }, [updateField, prefix]);

  const setRsdEnabled = useCallback(async (enabled: boolean) => {
    await updateField(`${prefix}sms_rsd_enabled`, enabled);
  }, [updateField, prefix]);

  return {
    // Base equipment form (without quantity which SMS doesn't use)
    make: equipmentForm.make,
    model: equipmentForm.model,
    isExisting: equipmentForm.isExisting,
    manufacturers: equipmentForm.manufacturers,
    models: equipmentForm.models,
    loading: equipmentForm.loading,
    loadingManufacturers: equipmentForm.loadingManufacturers,
    loadingModels: equipmentForm.loadingModels,
    saving: equipmentForm.saving,
    error: equipmentForm.error,
    setMake: equipmentForm.setMake,
    setModel: equipmentForm.setModel,
    setIsExisting: equipmentForm.setIsExisting,
    clearEquipment: equipmentForm.clearEquipment,
    refresh: equipmentForm.refresh,

    // SMS-specific
    mainBreakerRating,
    backupPanelBreakerRating,
    pvBreakerOverride,
    essBreakerOverride,
    tieInBreakerOverride,
    rsdEnabled,
    setMainBreakerRating,
    setBackupPanelBreakerRating,
    setPvBreakerOverride,
    setEssBreakerOverride,
    setTieInBreakerOverride,
    setRsdEnabled,
  };
}

export default useSMSForm;
