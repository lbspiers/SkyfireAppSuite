import React, { useMemo, useState, useEffect } from 'react';
import { EquipmentRow, FormFieldRow, TableDropdown, TableRowButton } from '../../ui';
import { getRailManufacturers, getRailModels } from '../../../services/equipmentService';
import logger from '../../../services/devLogger';

/**
 * Rails Section
 * Handles rail configuration (make and model)
 */
const RailsSection = ({ formData, onChange, railType = 'A', onClear }) => {
  const prefix = railType === 'A' ? 'rta' : 'rtb';

  const railMake = formData[`${prefix}_rail_make`] || '';
  const railModel = formData[`${prefix}_rail_model`] || '';

  // Local state for New/Existing and Rail-less toggles
  const [isNewRail, setIsNewRail] = useState(true); // Default to "New"
  const [isRailless, setIsRailless] = useState(false);
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
    if (railMake) {
      loadModels(railMake);
    } else {
      setModels([]);
    }
  }, [railMake]);

  const loadManufacturers = async () => {
    setLoadingMakes(true);
    try {
      const response = await getRailManufacturers();
      const manufacturersList = response?.data || [];
      setManufacturers(manufacturersList.map(m => ({ label: m, value: m })));
      logger.debug('Rails', `Loaded ${manufacturersList.length} rail manufacturers`);
    } catch (error) {
      logger.error('Rails', 'Failed to load rail manufacturers:', error);
      setManufacturers([]);
    } finally {
      setLoadingMakes(false);
    }
  };

  const loadModels = async (manufacturer) => {
    setLoadingModels(true);
    try {
      const response = await getRailModels(manufacturer);
      const modelsList = response?.data || [];
      setModels(modelsList.map(m => {
        // Handle both object format {model: "..."} and string format
        const modelValue = typeof m === 'string' ? m : (m.model || m.model_number || '');
        return {
          label: modelValue,
          value: modelValue
        };
      }));
      logger.debug('Rails', `Loaded ${modelsList.length} models for ${manufacturer}`);
    } catch (error) {
      logger.error('Rails', `Failed to load models for ${manufacturer}:`, error);
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  // Get rail makes from database
  const railMakes = useMemo(() => manufacturers, [manufacturers]);

  // Get rail models from database
  const railModels = useMemo(() => models, [models]);

  const handleRailMakeChange = (value) => {
    onChange(`${prefix}_rail_make`, value);
    // Clear model when make changes
    onChange(`${prefix}_rail_model`, '');
  };

  const isComplete = !!(railMake && railModel) || isRailless;
  const subtitle = railMake && railModel ? `${railMake} ${railModel}` : isRailless ? 'Rail-less' : undefined;

  return (
    <div style={{ marginBottom: 'var(--spacing-xs)' }}>
      <EquipmentRow
        title={`Rail (${railType})`}
        subtitle={subtitle}
        isComplete={isComplete}
        expanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
        onDelete={onClear}
      >
        {/* New/Existing Toggle and Rail-less - No label, left-justified */}
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-xs)',
          padding: 'var(--spacing-tight) var(--spacing)',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <TableRowButton
            label="New"
            variant="outline"
            active={isNewRail && !isRailless}
            onClick={() => {
              setIsNewRail(true);
              setIsRailless(false);
            }}
          />
          <TableRowButton
            label="Existing"
            variant="outline"
            active={!isNewRail && !isRailless}
            onClick={() => {
              setIsNewRail(false);
              setIsRailless(false);
            }}
          />
          <div style={{ marginLeft: 'auto' }}>
            <TableRowButton
              label="Rail-less"
              variant="outline"
              active={isRailless}
              onClick={() => setIsRailless(!isRailless)}
            />
          </div>
        </div>

        {/* Rail Make and Model - Hidden when Rail-less is active */}
        {!isRailless && (
          <>
            <TableDropdown
              label="Rail Make"
              value={railMake}
              onChange={handleRailMakeChange}
              options={railMakes}
              placeholder="Select make..."
            />

            <TableDropdown
              label="Rail Model"
              value={railModel}
              onChange={(value) => onChange(`${prefix}_rail_model`, value)}
              options={railModels}
              placeholder={railMake ? "Select model..." : "Select make first"}
              disabled={!railMake}
            />
          </>
        )}
      </EquipmentRow>
    </div>
  );
};

export default RailsSection;
