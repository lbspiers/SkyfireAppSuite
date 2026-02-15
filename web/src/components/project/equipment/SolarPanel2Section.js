import React, { useState, useEffect, memo } from 'react';
import { EquipmentRow, FormFieldRow, TableDropdown, SectionClearModal, SectionRemoveModal, PreferredButton } from '../../ui';
import { PreferredEquipmentModal } from '../../equipment';
import styles from '../../../styles/ProjectAdd.module.css';
import logger from '../../../services/devLogger';
import {
  getSolarPanelManufacturers,
  getSolarPanelModels,
} from '../../../services/equipmentService';
import { useSectionDelete, DELETE_BEHAVIOR } from '../../../hooks/useSectionDelete';

/**
 * 2nd Solar Panel Section
 * Handles 2nd solar panel configuration with EquipmentRow display
 * Fields are always editable dropdowns (no edit mode)
 */
const SolarPanel2Section = ({ formData, onChange, systemNumber = 1 }) => {
  const [manufacturers, setManufacturers] = useState([]);
  const [models, setModels] = useState([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedModelData, setSelectedModelData] = useState(null);
  const [showPreferredModal, setShowPreferredModal] = useState(false);

  // Load manufacturers on mount
  // Load manufacturers on mount (once only)
  // CRITICAL: Guard prevents multiple API calls during re-renders
  useEffect(() => {
    if (manufacturers.length === 0 && !loadingMakes) {
      loadManufacturers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = run once on mount only

  // Load models when manufacturer changes
  useEffect(() => {
    if (formData.solar_panel_type2_manufacturer) {
      loadModels(formData.solar_panel_type2_manufacturer);
    } else {
      setModels([]);
      setSelectedModelData(null);
    }
  }, [formData.solar_panel_type2_manufacturer]);

  const loadManufacturers = async () => {
    setLoadingMakes(true);
    try {
      const response = await getSolarPanelManufacturers();
      setManufacturers(response.data || []);
    } catch (error) {
      logger.error('Equipment', 'Failed to load solar panel manufacturers:', error);
    } finally {
      setLoadingMakes(false);
    }
  };

  const loadModels = async (manufacturer) => {
    setLoadingModels(true);
    try {
      const response = await getSolarPanelModels(manufacturer);
      const modelsData = response.data || [];
      setModels(modelsData);

      // If current model is selected, find its data and auto-populate wattage
      if (formData.solar_panel_type2_model) {
        const modelData = modelsData.find(m => m.model_number === formData.solar_panel_type2_model);
        if (modelData) {
          setSelectedModelData(modelData);

          // Auto-populate wattage from nameplate_pmax if available
          if (modelData.nameplate_pmax) {
            onChange('solar_panel_type2_wattage', modelData.nameplate_pmax);
          }

          // Store model ID for future reference
          if (modelData.id) {
            onChange('solar_panel_type2_model_id', modelData.id);
          }
        }
      }
    } catch (error) {
      logger.error('Equipment', 'Failed to load solar panel models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  // Wrapper to save toggle defaults when any field changes
  const handleFieldChange = (fieldName, value) => {
    onChange(fieldName, value);
    // Also save New/Existing toggle default if not already set
    if (formData.solar_panel_type2_is_new === undefined) {
      onChange('solar_panel_type2_is_new', true);
    }
  };

  const handleManufacturerChange = (value) => {
    handleFieldChange('solar_panel_type2_manufacturer', value);
    onChange('solar_panel_type2_model', ''); // Clear model when manufacturer changes
    onChange('solar_panel_type2_wattage', ''); // Clear wattage
    setSelectedModelData(null);
  };

  const handleModelChange = (value) => {
    handleFieldChange('solar_panel_type2_model', value);

    // Find model data and auto-populate wattage and electrical specs
    const modelData = models.find(m => m.model_number === value);
    if (modelData) {
      setSelectedModelData(modelData);

      // Auto-populate wattage from nameplate_pmax
      if (modelData.nameplate_pmax) {
        onChange('solar_panel_type2_wattage', modelData.nameplate_pmax);
      }

      // Store model ID for future reference
      if (modelData.id) {
        onChange('solar_panel_type2_model_id', modelData.id);
      }

      // Store electrical specs for stringing calculations
      const voc = modelData.voc || modelData.open_circuit_voltage || '';
      const isc = modelData.isc || modelData.short_circuit_current || '';
      const vmp = modelData.vmp || modelData.voltage_max_power || '';
      const imp = modelData.imp || modelData.current_max_power || '';
      const tempCoeff = modelData.temp_coeff_voc || modelData.temperature_coefficient_voc || '';

      onChange('solar_panel_type2_voc', voc);
      onChange('solar_panel_type2_isc', isc);
      onChange('solar_panel_type2_vmp', vmp);
      onChange('solar_panel_type2_imp', imp);

      // Temperature coefficient (if available)
      if (tempCoeff) {
        onChange('solar_panel_type2_temp_coeff_voc', tempCoeff);
      }
    }
  };

  // Use the section delete hook with CLEAR_AND_REMOVE behavior
  const {
    showClearModal,
    showRemoveModal,
    handleTrashClick,
    handleClearConfirm,
    handleRemoveConfirm,
    closeClearModal,
    closeRemoveModal,
  } = useSectionDelete({
    sectionName: 'solarPanel2',
    formData,
    onChange,
    behavior: DELETE_BEHAVIOR.CLEAR_AND_REMOVE,
    visibilityFlag: 'show_solar_panel_2',
  });

  // Legacy handleDelete removed - now using useSectionDelete hook

  // Check if we have a 2nd solar panel configured
  const hasSolarPanel2 = formData.solar_panel_type2_manufacturer && formData.solar_panel_type2_model;

  // Build comprehensive subtitle with all selections (matching Type 1 format)
  const getSubtitle = () => {
    if (!hasSolarPanel2) return '';

    const parts = [];

    // Quantity with New/Existing indicator
    if (formData.solar_panel_type2_quantity) {
      const statusLetter = formData.solar_panel_type2_is_new !== false ? 'N' : 'E';
      parts.push(`${formData.solar_panel_type2_quantity} (${statusLetter})`);
    }

    // Make and Model
    if (formData.solar_panel_type2_manufacturer && formData.solar_panel_type2_model) {
      parts.push(`${formData.solar_panel_type2_manufacturer} ${formData.solar_panel_type2_model}`);
    }

    return parts.join(' ');
  };

  return (
    <div style={{ marginBottom: 'var(--spacing-xs)' }}>
      <EquipmentRow
        title="Solar Panel (Type 2)"
        subtitle={getSubtitle()}
        showNewExistingToggle={true}
        isNew={formData.solar_panel_type2_is_new !== false}
        onNewExistingChange={(isNew) => onChange('solar_panel_type2_is_new', isNew)}
        onEdit={() => {}}
        onCamera={() => {}}
        onDelete={handleTrashClick}
        headerRightContent={
          <PreferredButton onClick={() => setShowPreferredModal(true)} />
        }
        topRowContent={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-tight)'
          }}>
            <img
              src={require('../../../assets/images/Skyfire Flame Icon.png')}
              alt=""
              style={{ width: '20px', height: '20px', objectFit: 'contain', flexShrink: 0 }}
            />
            <div style={{ flex: '1', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Solar Panel (Type 1 & Type 2) must be connected to Sys {systemNumber} Inverter or String Combiner Panel.
            </div>
          </div>
        }
      >
        {/* Quantity field */}
        <FormFieldRow label="Quantity">
          <input
            type="text"
            value={formData.solar_panel_type2_quantity || ''}
            onChange={(e) => handleFieldChange('solar_panel_type2_quantity', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            placeholder="Enter quantity"
          />
        </FormFieldRow>

        {/* Make dropdown */}
        <TableDropdown
          label="Make"
          value={formData.solar_panel_type2_manufacturer || ''}
          onChange={handleManufacturerChange}
          options={manufacturers.map(m => ({ value: m, label: m }))}
          placeholder={loadingMakes ? 'Loading...' : 'Select make'}
          disabled={loadingMakes}
        />

        {/* Model dropdown */}
        <TableDropdown
          label="Model"
          value={formData.solar_panel_type2_model || ''}
          onChange={handleModelChange}
          options={models.map(m => ({ value: m.model_number, label: m.model_number }))}
          placeholder={
            loadingModels ? 'Loading...' :
            formData.solar_panel_type2_manufacturer ? 'Select model' :
            'Select make first'
          }
          disabled={!formData.solar_panel_type2_manufacturer || loadingModels}
        />

      </EquipmentRow>

      {/* Section Clear Modal */}
      <SectionClearModal
        isOpen={showClearModal}
        onClose={closeClearModal}
        onConfirm={handleClearConfirm}
        sectionName={`Solar Panel ${systemNumber} (Type 2)`}
      />

      {/* Section Remove Modal */}
      <SectionRemoveModal
        isOpen={showRemoveModal}
        onClose={closeRemoveModal}
        onConfirm={handleRemoveConfirm}
        sectionName={`Solar Panel ${systemNumber} (Type 2)`}
      />

      {/* Preferred Modal */}
      <PreferredEquipmentModal
        isOpen={showPreferredModal}
        onClose={() => setShowPreferredModal(false)}
        equipmentType="solar_panel"
      />
    </div>
  );
};

export default memo(SolarPanel2Section);
