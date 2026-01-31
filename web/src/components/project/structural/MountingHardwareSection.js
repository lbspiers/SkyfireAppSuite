import React, { useMemo, useState, useEffect } from 'react';
import { EquipmentRow, FormFieldRow, TableDropdown, TableRowButton } from '../../ui';
import { getMountingHardwareManufacturers, getMountingHardwareModels } from '../../../services/equipmentService';
import logger from '../../../services/devLogger';

/**
 * Mounting Hardware Section
 * Handles attachment hardware (make and model)
 */
const MountingHardwareSection = ({ formData, onChange, hardwareType = 'A', onClear }) => {
  const prefix = hardwareType === 'A' ? 'rta' : 'rtb';

  const attachMake = formData[`${prefix}_attachment_make`] || '';
  const attachModel = formData[`${prefix}_attachment_model`] || '';

  // Local state
  const [isNew, setIsNew] = useState(true); // Default to "New"
  const [isExpanded, setIsExpanded] = useState(false);

  // Database state
  const [manufacturers, setManufacturers] = useState([]);
  const [models, setModels] = useState([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  // Load manufacturers on mount
  useEffect(() => {
    loadManufacturers();
  }, []);

  // Load models when manufacturer changes
  useEffect(() => {
    if (attachMake) {
      loadModels(attachMake);
    } else {
      setModels([]);
    }
  }, [attachMake]);

  const loadManufacturers = async () => {
    setLoadingMakes(true);
    try {
      const response = await getMountingHardwareManufacturers();
      const manufacturersList = response?.data || [];
      setManufacturers(manufacturersList.map(m => ({ label: m, value: m })));
      logger.debug('MountingHardware', `Loaded ${manufacturersList.length} mounting hardware manufacturers`);
    } catch (error) {
      logger.error('MountingHardware', 'Failed to load mounting hardware manufacturers:', error);
      setManufacturers([]);
    } finally {
      setLoadingMakes(false);
    }
  };

  const loadModels = async (manufacturer) => {
    setLoadingModels(true);
    try {
      const response = await getMountingHardwareModels(manufacturer);
      const modelsList = response?.data || [];
      setModels(modelsList.map(m => {
        // Handle both object format {model: "..."} and string format
        const modelValue = typeof m === 'string' ? m : (m.model || m.model_number || '');
        return {
          label: modelValue,
          value: modelValue
        };
      }));
      logger.debug('MountingHardware', `Loaded ${modelsList.length} models for ${manufacturer}`);
    } catch (error) {
      logger.error('MountingHardware', `Failed to load models for ${manufacturer}:`, error);
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  // Get attachment makes from database
  const attachMakes = useMemo(() => manufacturers, [manufacturers]);

  // Get attachment models from database
  const attachModels = useMemo(() => models, [models]);

  const handleAttachMakeChange = (value) => {
    onChange(`${prefix}_attachment_make`, value);
    // Clear model when make changes
    onChange(`${prefix}_attachment_model`, '');
  };

  const isComplete = !!(attachMake && attachModel);
  const subtitle = attachMake && attachModel ? `${attachMake} ${attachModel}` : undefined;

  return (
    <div style={{ marginBottom: 'var(--spacing)' }}>
      <EquipmentRow
        title={`Attachment (${hardwareType})`}
        subtitle={subtitle}
        isComplete={isComplete}
        expanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
        onDelete={onClear}
      >
        {/* New/Existing Toggle - No label, left-justified */}
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-xs)',
          padding: 'var(--spacing-tight) var(--spacing)',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <TableRowButton
            label="New"
            variant="outline"
            active={isNew}
            onClick={() => setIsNew(true)}
          />
          <TableRowButton
            label="Existing"
            variant="outline"
            active={!isNew}
            onClick={() => setIsNew(false)}
          />
        </div>

        {/* Attachment Make and Model */}
        <TableDropdown
          label="Attachment Make"
          value={attachMake}
          onChange={handleAttachMakeChange}
          options={attachMakes}
          placeholder="Select make..."
        />

        <TableDropdown
          label="Attachment Model"
          value={attachModel}
          onChange={(value) => onChange(`${prefix}_attachment_model`, value)}
          options={attachModels}
          placeholder={attachMake ? "Select model..." : "Select make first"}
          disabled={!attachMake}
        />
      </EquipmentRow>
    </div>
  );
};

export default MountingHardwareSection;
