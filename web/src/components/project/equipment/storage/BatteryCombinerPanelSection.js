import React, { useState, useEffect, memo } from 'react';
import { EquipmentRow, TableDropdown } from '../../../ui';
import {
  getCombinerPanelManufacturers,
  getCombinerPanelModels,
} from '../../../../services/equipmentService';

const BatteryCombinerPanelSection = ({ formData, onChange }) => {
  const [manufacturers, setManufacturers] = useState([]);
  const [models, setModels] = useState([]);
  const [loadingManufacturers, setLoadingManufacturers] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);

  // Debug logging for formData
  console.log('🔍 BatteryCombinerPanelSection - formData:', {
    make: formData.battery_combiner_panel_make,
    model: formData.battery_combiner_panel_model,
    busAmps: formData.battery_combiner_panel_bus_amps,
    mainBreaker: formData.battery_combiner_panel_main_breaker,
    tieInBreaker: formData.battery_combiner_panel_tie_in_breaker,
  });

  // Bus Amps options matching mobile app spec
  const busAmpsOptions = [
    { label: '60 Amps', value: '60' },
    { label: '100 Amps', value: '100' },
    { label: '125 Amps', value: '125' },
    { label: '150 Amps', value: '150' },
    { label: '175 Amps', value: '175' },
    { label: '200 Amps', value: '200' },
    { label: '225 Amps', value: '225' },
    { label: '400 Amps', value: '400' },
  ];

  // Main Breaker options (MLO + standard ratings)
  const mainBreakerOptions = [
    { label: 'MLO', value: 'MLO' },
    { label: '100 Amps', value: '100' },
    { label: '125 Amps', value: '125' },
    { label: '150 Amps', value: '150' },
    { label: '175 Amps', value: '175' },
    { label: '200 Amps', value: '200' },
    { label: '225 Amps', value: '225' },
    { label: '250 Amps', value: '250' },
    { label: '300 Amps', value: '300' },
    { label: '350 Amps', value: '350' },
    { label: '400 Amps', value: '400' },
    { label: '450 Amps', value: '450' },
    { label: '500 Amps', value: '500' },
    { label: '600 Amps', value: '600' },
  ];

  // Tie-in Breaker options (standard ratings)
  const tieInBreakerOptions = [
    { label: '15 Amps', value: '15' },
    { label: '20 Amps', value: '20' },
    { label: '25 Amps', value: '25' },
    { label: '30 Amps', value: '30' },
    { label: '35 Amps', value: '35' },
    { label: '40 Amps', value: '40' },
    { label: '45 Amps', value: '45' },
    { label: '50 Amps', value: '50' },
    { label: '60 Amps', value: '60' },
    { label: '70 Amps', value: '70' },
    { label: '80 Amps', value: '80' },
    { label: '90 Amps', value: '90' },
    { label: '100 Amps', value: '100' },
    { label: '110 Amps', value: '110' },
    { label: '125 Amps', value: '125' },
    { label: '150 Amps', value: '150' },
    { label: '175 Amps', value: '175' },
    { label: '200 Amps', value: '200' },
    { label: '225 Amps', value: '225' },
    { label: '250 Amps', value: '250' },
    { label: '300 Amps', value: '300' },
    { label: '350 Amps', value: '350' },
    { label: '400 Amps', value: '400' },
  ];

  // Load manufacturers on component mount
  useEffect(() => {
    const loadManufacturers = async () => {
      try {
        setLoadingManufacturers(true);
        const response = await getCombinerPanelManufacturers();
        const manufacturerData = response.data || [];

        // Normalize data - handle both string arrays and object arrays
        const normalizedManufacturers = manufacturerData.map(item => {
          if (typeof item === 'string') return item;
          return item.manufacturer || item.make || item;
        });

        setManufacturers(normalizedManufacturers);
      } catch (error) {
        console.error('Error loading battery combiner panel manufacturers:', error);
        setManufacturers([]);
      } finally {
        setLoadingManufacturers(false);
      }
    };

    loadManufacturers();
  }, []);

  // Load models when manufacturer changes
  useEffect(() => {
    const loadModels = async () => {
      if (!formData.battery_combiner_panel_make) {
        setModels([]);
        return;
      }

      try {
        setLoadingModels(true);
        const response = await getCombinerPanelModels(formData.battery_combiner_panel_make);
        const modelData = response.data || [];

        // Normalize data - handle both string arrays and object arrays
        const normalizedModels = modelData.map(item => {
          if (typeof item === 'string') return item;
          return item.model || item.model_number || item;
        });

        setModels(normalizedModels);
      } catch (error) {
        console.error('Error loading battery combiner panel models:', error);
        setModels([]);
      } finally {
        setLoadingModels(false);
      }
    };

    loadModels();
  }, [formData.battery_combiner_panel_make]);

  // Handle manufacturer change
  const handleMakeChange = (value) => {
    console.log('🔧 BCP Make changed:', value);

    // ALWAYS save the current toggle state when make is changed
    // This ensures the default "New" state gets persisted to the database
    const currentIsNew = formData.battery_combiner_panel_existing !== true; // Default to true if undefined
    onChange('battery_combiner_panel_existing', !currentIsNew);

    onChange('battery_combiner_panel_make', value);
    // Clear model when manufacturer changes
    onChange('battery_combiner_panel_model', '');
  };

  // Handle New/Existing toggle
  const handleToggleChange = (value) => {
    console.log('🔧 BCP isNew changed:', value);
    onChange('battery_combiner_panel_existing', !value);
  };

  // Build subtitle for collapsed state
  const getSubtitle = () => {
    const parts = [];
    if (formData.battery_combiner_panel_make) {
      parts.push(formData.battery_combiner_panel_make);
    }
    if (formData.battery_combiner_panel_model) {
      parts.push(formData.battery_combiner_panel_model);
    }
    if (formData.battery_combiner_panel_bus_amps) {
      parts.push(`${formData.battery_combiner_panel_bus_amps}A Bus`);
    }
    if (formData.battery_combiner_panel_main_breaker) {
      parts.push(`${formData.battery_combiner_panel_main_breaker} Main`);
    }
    if (formData.battery_combiner_panel_tie_in_breaker) {
      parts.push(`${formData.battery_combiner_panel_tie_in_breaker}A Tie-in`);
    }
    return parts.length > 0 ? parts.join(' | ') : null;
  };

  return (
    <EquipmentRow
      title="Battery Combiner Panel"
      subtitle={getSubtitle()}
      isNew={!formData.battery_combiner_panel_existing}
      onToggleChange={handleToggleChange}
      showToggle={true}
    >
      {/* Make Dropdown */}
      <TableDropdown
        label="Make"
        value={formData.battery_combiner_panel_make}
        onChange={handleMakeChange}
        options={manufacturers.map(m => ({ label: m, value: m }))}
        placeholder={loadingManufacturers ? "Loading..." : "Select Make"}
        disabled={loadingManufacturers}
        required={true}
      />

      {/* Model Dropdown */}
      <TableDropdown
        label="Model"
        value={formData.battery_combiner_panel_model}
        onChange={(value) => {
          console.log('🔧 BCP Model changed:', value);
          onChange('battery_combiner_panel_model', value);
        }}
        options={models.map(m => ({ label: m, value: m }))}
        placeholder={loadingModels ? "Loading..." : formData.battery_combiner_panel_make ? "Select Model" : "Select Make First"}
        disabled={!formData.battery_combiner_panel_make || loadingModels}
        required={true}
      />

      {/* Bus Amps Dropdown */}
      <TableDropdown
        label="Bus Amps"
        value={formData.battery_combiner_panel_bus_amps}
        onChange={(value) => {
          console.log('🔧 BCP Bus Amps changed:', value);
          onChange('battery_combiner_panel_bus_amps', value);
        }}
        options={busAmpsOptions}
        placeholder="Select Bus Amps"
        required={false}
      />

      {/* Main Breaker Dropdown */}
      <TableDropdown
        label="Main Breaker"
        value={formData.battery_combiner_panel_main_breaker}
        onChange={(value) => {
          console.log('🔧 BCP Main Breaker changed:', value);
          onChange('battery_combiner_panel_main_breaker', value);
        }}
        options={mainBreakerOptions}
        placeholder="Select Main Breaker"
        required={false}
      />

      {/* Tie-in Breaker Dropdown */}
      <TableDropdown
        label="Tie-in Breaker"
        value={formData.battery_combiner_panel_tie_in_breaker}
        onChange={(value) => {
          console.log('🔧 BCP Tie-in Breaker changed:', value);
          onChange('battery_combiner_panel_tie_in_breaker', value);
        }}
        options={tieInBreakerOptions}
        placeholder="Select Tie-in Breaker"
        required={false}
      />
    </EquipmentRow>
  );
};

export default memo(BatteryCombinerPanelSection);
