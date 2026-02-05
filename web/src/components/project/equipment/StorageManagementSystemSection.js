import React, { useState, useEffect, memo } from 'react';
import { Alert, EquipmentRow, FormFieldRow, TableDropdown, TableRowButton, AddSectionButton, PreferredButton, Tooltip, Divider } from '../../ui';
import { PreferredEquipmentModal } from '../../equipment';
import BOSEquipmentSection from './BOSEquipmentSection';
import {
  getSMSManufacturers,
  getSMSModels,
} from '../../../services/equipmentService';
import { BREAKER_RATING_OPTIONS, SMS_MAIN_BREAKER_OPTIONS } from '../../../utils/constants';
import equipStyles from '../EquipmentForm.module.css';
import logger from '../../../services/devLogger';
import flameIcon from '../../../assets/images/Skyfire Flame Icon.png';

/**
 * Storage Management System (SMS) Section
 * Allows user to select SMS equipment or choose "No SMS"
 */
const StorageManagementSystemSection = ({
  formData,
  onChange,
  onBatchChange,
  backupOption,
  systemNumber = 1,
  maxContinuousOutputAmps = null,
  loadingMaxOutput = false,
}) => {
  const [manufacturers, setManufacturers] = useState([]);
  const [models, setModels] = useState([]);
  const [loadingManufacturers, setLoadingManufacturers] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [editPVBreaker, setEditPVBreaker] = useState(false);
  const [editESSBreaker, setEditESSBreaker] = useState(false);
  const [editTieInBreaker, setEditTieInBreaker] = useState(false);
  const [showPreferredModal, setShowPreferredModal] = useState(false);

  // Breaker size options (15-250 Amps)
  const breakerOptions = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250];

  // Load manufacturers on mount (once only)
  // CRITICAL: Guard prevents multiple API calls during re-renders
  useEffect(() => {
    if (manufacturers.length === 0 && !loadingManufacturers) {
      loadManufacturers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = run once on mount only

  // Load models when manufacturer changes
  useEffect(() => {
    if (formData.sms_make && formData.sms_make !== 'No SMS') {
      loadModels();
    } else {
      setModels([]);
    }
  }, [formData.sms_make]);

  // Set default New/Existing toggle to New on mount if SMS is configured but toggle not set
  useEffect(() => {
    const hasSMS = formData.sms_make && formData.sms_model && formData.sms_make !== 'No SMS';
    // Use == null to catch both undefined AND null
    if (hasSMS && formData.sms_isnew == null) {
      onChange('sms_isnew', true); // Default to New
    }
  }, [formData.sms_make, formData.sms_model, formData.sms_isnew, onChange]);

  const loadManufacturers = async () => {
    setLoadingManufacturers(true);
    try {
      const response = await getSMSManufacturers();
      const manufacturerList = response?.data || [];
      // Normalize data to { label, value } format
      const normalized = manufacturerList.map(item => {
        if (typeof item === 'string') {
          return { label: item, value: item };
        }
        const name = item.manufacturer || item.name || item.label || String(item);
        return { label: name, value: name };
      });
      setManufacturers(normalized);
    } catch (error) {
      logger.error('Equipment', 'Error loading SMS manufacturers:', error);
    } finally {
      setLoadingManufacturers(false);
    }
  };

  const loadModels = async () => {
    setLoadingModels(true);
    try {
      const response = await getSMSModels(formData.sms_make);
      const modelList = response?.data || [];
      // Normalize data to { label, value } format
      const normalized = modelList.map(item => {
        if (typeof item === 'string') {
          return { label: item, value: item };
        }
        const modelName = item.model || item.model_number || item.name || item.label || String(item);
        return { label: modelName, value: modelName };
      });
      setModels(normalized);
    } catch (error) {
      logger.error('Equipment', 'Error loading SMS models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleToggle = (isNew) => {
    onChange('sms_isnew', isNew);
    console.log('[SMS] New/Existing toggle changed to:', isNew ? 'New' : 'Existing');
  };

  const handleMakeChange = (e) => {
    const makeValue = e.target.value;
    console.log('[SMS] Make changed to:', makeValue);

    if (onBatchChange) {
      // BATCH: Update make, model, and related fields in single operation (up to 6 fields → 1 call)
      const updates = [
        ['sms_make', makeValue],
        ['sms_model', ''],
      ];

      // Set equipment type to "SMS" for sys1_sms_equipment_type
      if (makeValue && makeValue !== 'No SMS') {
        updates.push(['sys1_sms_equipment_type', 'SMS']);
        console.log('[SMS] Setting sys1_sms_equipment_type: SMS');
      } else {
        updates.push(['sys1_sms_equipment_type', '']);
        console.log('[SMS] Clearing sys1_sms_equipment_type');
      }

      // ALWAYS include toggle - use existing value or default to true (nullish coalescing)
      updates.push(['sms_isnew', formData.sms_isnew ?? true]);

      // If "No SMS" selected, clear all other fields
      if (makeValue === 'No SMS') {
        updates.push(['sms_main_breaker', 'MLO']);
        updates.push(['sms_has_rsd', false]);
        console.log('[SMS] No SMS selected - clearing fields');
      }

      onBatchChange(updates);
    } else {
      // Fallback: Sequential onChange (backwards compatibility)
      onChange('sms_make', makeValue);
      onChange('sms_model', '');

      if (makeValue && makeValue !== 'No SMS') {
        onChange('sys1_sms_equipment_type', 'SMS');
        console.log('[SMS] Setting sys1_sms_equipment_type: SMS');
      } else {
        onChange('sys1_sms_equipment_type', '');
        console.log('[SMS] Clearing sys1_sms_equipment_type');
      }

      // Save default if not already set - use == null to catch both undefined AND null
      if (formData.sms_isnew == null) {
        onChange('sms_isnew', true);
      }

      if (makeValue === 'No SMS') {
        onChange('sms_main_breaker', 'MLO');
        onChange('sms_has_rsd', false);
        console.log('[SMS] No SMS selected - clearing fields');
      }
    }
  };

  const handleClearPVBreaker = () => {
    onChange('sms_pv_breaker', '');
    setEditPVBreaker(false);
  };

  const handleClearESSBreaker = () => {
    onChange('sms_ess_breaker', '');
    setEditESSBreaker(false);
  };

  const handleClearTieInBreaker = () => {
    onChange('sms_tie_in_breaker', '');
    setEditTieInBreaker(false);
  };

  // Build dynamic Tie-in Breaker note based on backup option
  const getTieInBreakerNote = () => {
    let note = "A minimum SMS Tie-in Breaker will be added in the Main Panel (A). If you are landing in another location and/or using an alternate Tie-in method, you can edit it in the Electrical section.";

    if (backupOption === "Whole Home") {
      note += "\n\nThe Tie-in breaker will auto-size to the bus rating of the Panel it is landing in.";
    } else if (backupOption === "Partial Home") {
      note += "\n\nThe Tie-in breaker will auto-size to protect the total PV and battery max continuous output current landed in the SMS.";
    }

    note += "\n\nIf the total PV and Battery max continuous output of the current landed in the SMS is larger than the max allowable panel backfeed, the Power Control System (PCS) will activate and be sized to the max allowable panel backfeed.";

    return note;
  };

  const isNoSMS = formData.sms_make === 'No SMS';
  const hasSMS = formData.sms_make && formData.sms_model && !isNoSMS;

  const getSubtitle = () => {
    if (isNoSMS) return 'No SMS';
    if (formData.sms_make && formData.sms_model) {
      const statusLetter = formData.sms_isnew !== false ? 'N' : 'E';
      return `(${statusLetter}) ${formData.sms_make} ${formData.sms_model}`;
    }
    return '';
  };

  const handleDelete = () => {
    if (onBatchChange) {
      // BATCH: Clear all SMS fields in single operation (7 fields → 1 call)
      const updates = [
        ['sms_make', ''],
        ['sms_model', ''],
        ['sms_main_breaker', 'MLO'],
        ['sms_pv_breaker', ''],
        ['sms_ess_breaker', ''],
        ['sms_tie_in_breaker', ''],
        ['sms_has_rsd', false],
      ];
      onBatchChange(updates);
    } else {
      // Fallback: Sequential onChange (backwards compatibility)
      onChange('sms_make', '');
      onChange('sms_model', '');
      onChange('sms_main_breaker', 'MLO');
      onChange('sms_pv_breaker', '');
      onChange('sms_ess_breaker', '');
      onChange('sms_tie_in_breaker', '');
      onChange('sms_has_rsd', false);
    }

    // Reset local state
    setEditPVBreaker(false);
    setEditESSBreaker(false);
    setEditTieInBreaker(false);
  };

  // Preferred equipment handlers
  const handlePreferredSelect = (selected) => {
    onChange('sms_make', selected.make);
    onChange('sms_model', selected.model);
  };

  const handleSelectOther = () => {
    onChange('sms_make', '');
    onChange('sms_model', '');
  };

  return (
    <div style={{ marginBottom: 'var(--spacing-xs)' }}>
      <EquipmentRow
        title="Storage Management System"
        subtitle={getSubtitle()}
        onDelete={handleDelete}
        headerRightContent={
          <PreferredButton onClick={() => setShowPreferredModal(true)} />
        }
      >
        {/* Row 1: No SMS Button - Show when no make is selected */}
        {!formData.sms_make && (
          <div style={{
            borderBottom: 'var(--border-thin) solid var(--border-subtle)',
          }}>
            <TableRowButton
              label="No SMS"
              variant="outline"
              onClick={() => handleMakeChange({ target: { value: 'No SMS' } })}
              style={{ width: '100%' }}
            />
          </div>
        )}

        {/* Row 2: New/Existing Toggle - Always visible (except when "No SMS") */}
        {!isNoSMS && (
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-tight)',
            padding: 'var(--spacing-tight) var(--spacing)',
            borderBottom: 'var(--border-thin) solid var(--border-subtle)',
          }}>
            <TableRowButton
              label="New"
              variant="outline"
              active={formData.sms_isnew !== false}
              onClick={() => handleToggle(true)}
            />
            <TableRowButton
              label="Existing"
              variant="outline"
              active={formData.sms_isnew === false}
              onClick={() => handleToggle(false)}
            />
          </div>
        )}

        {/* Show "No SMS Selected" indicator when No SMS is chosen */}
        {isNoSMS && (
          <div style={{
            padding: 'var(--spacing-tight) var(--spacing)',
            borderBottom: 'var(--border-thin) solid var(--border-subtle)',
          }}>
            <Alert variant="info">
              This system does not require a Storage Management System. The inverter acts as the SMS.
            </Alert>
          </div>
        )}

        {/* Make & Model - Hide when "No SMS" is selected */}
        {!isNoSMS && (
          <>
            <TableDropdown
              label="Make"
              value={formData.sms_make || ''}
              onChange={(value) => handleMakeChange({ target: { value } })}
              options={manufacturers}
              placeholder={loadingManufacturers ? 'Loading...' : 'Select make...'}
              disabled={loadingManufacturers}
              showSearch={true}
            />

            <TableDropdown
              label="Model"
              value={formData.sms_model || ''}
              onChange={(value) => onChange('sms_model', value)}
              options={models}
              placeholder={!formData.sms_make ? 'Select make' : loadingModels ? 'Loading...' : 'Select model'}
              disabled={!formData.sms_make || loadingModels}
            />

            <TableDropdown
              label="Main Breaker"
              value={formData.sms_main_breaker || ''}
              onChange={(value) => onChange('sms_main_breaker', value)}
              options={SMS_MAIN_BREAKER_OPTIONS}
              placeholder="Select breaker..."
            />

            {/* PV Breaker */}
            <FormFieldRow label="PV Breaker">
              <TableRowButton
                label="Auto"
                variant="outline"
                active={!editPVBreaker}
                onClick={() => {
                  handleClearPVBreaker();
                }}
              />
              <TableRowButton
                label="Custom"
                variant="outline"
                active={editPVBreaker}
                onClick={() => setEditPVBreaker(true)}
              />
              {!editPVBreaker && (
                <div style={{ display: 'inline-flex', marginLeft: 'var(--spacing-tight)' }}>
                  <Tooltip
                    content={
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
                        A minimum PV Breaker will be added in the SMS PV input and will be rated to protect the total PV max continuous output current.
                      </div>
                    }
                    position="bottom"
                    className="alertTooltip"
                  >
                    <img src={flameIcon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain', cursor: 'help' }} />
                  </Tooltip>
                </div>
              )}
            </FormFieldRow>
            {editPVBreaker && (
              <TableDropdown
                label="Breaker Rating"
                value={formData.sms_pv_breaker || ''}
                onChange={(value) => onChange('sms_pv_breaker', value)}
                options={breakerOptions.map(rating => ({ label: `${rating}`, value: `${rating}` }))}
                placeholder="Select rating..."
              />
            )}

            {/* ESS Breaker */}
            <FormFieldRow label="ESS Breaker">
              <TableRowButton
                label="Auto"
                variant="outline"
                active={!editESSBreaker}
                onClick={() => {
                  handleClearESSBreaker();
                }}
              />
              <TableRowButton
                label="Custom"
                variant="outline"
                active={editESSBreaker}
                onClick={() => setEditESSBreaker(true)}
              />
              {!editESSBreaker && (
                <div style={{ display: 'inline-flex', marginLeft: 'var(--spacing-tight)' }}>
                  <Tooltip
                    content={
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
                        A minimum ESS Breaker will be added in the SMS ESS input and will be rated to protect the battery max continuous output current.
                      </div>
                    }
                    position="bottom"
                    className="alertTooltip"
                  >
                    <img src={flameIcon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain', cursor: 'help' }} />
                  </Tooltip>
                </div>
              )}
            </FormFieldRow>
            {editESSBreaker && (
              <TableDropdown
                label="Breaker Rating"
                value={formData.sms_ess_breaker || ''}
                onChange={(value) => onChange('sms_ess_breaker', value)}
                options={breakerOptions.map(rating => ({ label: `${rating}`, value: `${rating}` }))}
                placeholder="Select rating..."
              />
            )}

            {/* Tie-in Breaker */}
            <FormFieldRow label="Tie-in Breaker">
              <TableRowButton
                label="Auto"
                variant="outline"
                active={!editTieInBreaker}
                onClick={() => {
                  handleClearTieInBreaker();
                }}
              />
              <TableRowButton
                label="Custom"
                variant="outline"
                active={editTieInBreaker}
                onClick={() => setEditTieInBreaker(true)}
              />
              {!editTieInBreaker && (
                <div style={{ display: 'inline-flex', marginLeft: 'var(--spacing-tight)' }}>
                  <Tooltip
                    content={
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)', whiteSpace: 'pre-line' }}>
                        {getTieInBreakerNote()}
                      </div>
                    }
                    position="bottom"
                    className="alertTooltip"
                  >
                    <img src={flameIcon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain', cursor: 'help' }} />
                  </Tooltip>
                </div>
              )}
            </FormFieldRow>
            {editTieInBreaker && (
              <TableDropdown
                label="Breaker Rating"
                value={formData.sms_tie_in_breaker || ''}
                onChange={(value) => onChange('sms_tie_in_breaker', value)}
                options={breakerOptions.map(rating => ({ label: `${rating}`, value: `${rating}` }))}
                placeholder="Select rating..."
              />
            )}

            {/* RSD Toggle Button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: 'var(--spacing-tight) var(--spacing)',
            }}>
              <TableRowButton
                label={formData.sms_has_rsd ? 'Rapid Shutdown Switch' : '+ Rapid Shutdown Switch'}
                variant={formData.sms_has_rsd ? 'primary' : 'outline'}
                onClick={() => onChange('sms_has_rsd', !formData.sms_has_rsd)}
                style={{ width: '50%' }}
              />
            </div>
          </>
        )}
      </EquipmentRow>

      {/* BOS Equipment */}
      {hasSMS && (
        <BOSEquipmentSection
          formData={formData}
          onChange={onChange}
          section="postSMS"
          systemNumber={systemNumber}
          maxContinuousOutputAmps={maxContinuousOutputAmps}
          loadingMaxOutput={loadingMaxOutput}
        />
      )}

      {/* Preferred Equipment Modal */}
      <PreferredEquipmentModal
        isOpen={showPreferredModal}
        onClose={() => setShowPreferredModal(false)}
        onSelect={handlePreferredSelect}
        onSelectOther={handleSelectOther}
        equipmentType="storage-management"
        title="Select Storage Management System"
      />
    </div>
  );
};

export default memo(StorageManagementSystemSection);
