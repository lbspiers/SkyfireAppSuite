import React, { useState, useEffect } from 'react';
import { ROOFING_MATERIAL_TYPES, FRAMING_MEMBER_SIZES, FRAMING_MEMBER_SPACINGS } from '../../../utils/constants';
import { EquipmentRow, FormFieldRow, TableDropdown, TableRowButton, Modal, Button } from '../../ui';
import styles from '../../../styles/ProjectAdd.module.css';
import equipStyles from '../EquipmentForm.module.css';
import formStyles from '../../../styles/FormSections.module.css';

/**
 * Roofing Section
 * Handles both Roofing Type A and Roofing Type B
 */
const RoofingSection = ({ formData, onChange, onBatchChange, roofType = 'A', onCancel, onClear }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingRoofArea, setPendingRoofArea] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);
  const prefix = roofType === 'A' ? 'rta' : 'rtb';

  const roofingMaterial = formData[`${prefix}_roofing_material`] || '';
  const framingSize = formData[`${prefix}_framing_size`] || '';
  const roofArea = formData[`st_roof_${roofType.toLowerCase()}_area_sqft`] || '';
  const framingSpacing = formData[`${prefix}_framing_spacing`] || '';
  const framingType = formData[`st_roof_${roofType.toLowerCase()}_framing_type`] || '';
  const isGroundMount = formData[`${prefix}_ground_mount`] === true;
  const isManufacturedHome = formData.st_manufactured_home === true;

  const isComplete = isGroundMount || !!(roofingMaterial && framingSize && framingSpacing && framingType);

  // Handler for Ground Mount toggle
  const handleGroundMountToggle = () => {
    onChange(`${prefix}_ground_mount`, !isGroundMount);
  };

  // Handler for Manufactured Home toggle (global field, not prefix-specific)
  const handleManufacturedHomeToggle = () => {
    const newValue = !isManufacturedHome;

    // When Manufactured Home is activated, batch update both fields in one API call
    if (newValue) {
      const updates = [
        ['st_manufactured_home', newValue],
        [`${prefix}_framing_size`, '2x2']
      ];

      if (onBatchChange) {
        onBatchChange(updates);
      } else {
        // Fallback to individual updates
        onChange('st_manufactured_home', newValue);
        handleFieldChange(`${prefix}_framing_size`, '2x2');
      }
    } else {
      // When deactivating, only update the toggle
      onChange('st_manufactured_home', newValue);
    }
  };

  // Auto-set defaults when component renders (only once per roofType)
  useEffect(() => {
    // Only run for Roofing Type A and only if not already initialized
    if (roofType !== 'A' || hasInitialized) return;

    // Check if this is a new/empty roofing section
    const isEmpty = !framingSize && !framingSpacing && !framingType;

    if (isEmpty) {
      // Batch all default updates together in a single API call
      const updates = [];

      // Set defaults: 2x4, 24", Truss
      // Only set framing size if manufactured home is NOT active (which would use 2x2)
      if (!isManufacturedHome) {
        updates.push([`${prefix}_framing_size`, '2x4']);
      }
      updates.push([`${prefix}_framing_spacing`, '24"']);
      updates.push([`st_roof_${roofType.toLowerCase()}_framing_type`, 'Truss']);

      // Use batch update if available, otherwise fall back to individual updates
      if (onBatchChange) {
        onBatchChange(updates);
      } else {
        // Fallback for backward compatibility
        updates.forEach(([field, value]) => handleFieldChange(field, value));
      }
    }

    setHasInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roofType, hasInitialized, framingSize, framingSpacing, framingType, isManufacturedHome]);

  // Helper to check if Roofing B exists
  const hasRoofingB = () => {
    return !!(formData.rtb_roofing_material);
  };

  // Handle roof area changes with validation
  const handleRoofAreaChange = (e) => {
    let value = e.target.value;

    // Only allow numbers
    value = value.replace(/[^0-9]/g, '');

    // Limit to 6 digits
    if (value.length > 6) {
      value = value.slice(0, 6);
    }

    // If value is over 5 digits (> 9,999), show confirmation modal
    if (value.length > 4 && parseInt(value) > 9999) {
      setPendingRoofArea(value);
      setShowConfirmModal(true);
    } else {
      // Apply immediately for smaller values
      handleFieldChange(`st_roof_${roofType.toLowerCase()}_area_sqft`, value);
    }
  };

  // Confirm large roof area
  const handleConfirmRoofArea = () => {
    handleFieldChange(`st_roof_${roofType.toLowerCase()}_area_sqft`, pendingRoofArea);
    setShowConfirmModal(false);
    setPendingRoofArea('');
  };

  // Cancel roof area change
  const handleCancelRoofArea = () => {
    setShowConfirmModal(false);
    setPendingRoofArea('');
  };

  // Format number with thousand separator for display
  const formatWithCommas = (num) => {
    if (!num) return '';
    return parseInt(num).toLocaleString('en-US');
  };

  // Wrapper to save roofing fields and auto-set mounting plane roof types
  const handleFieldChange = (fieldName, value) => {
    onChange(fieldName, value);

    // Only auto-set mounting planes when changing Roofing A material
    // AND there is no Roofing B configured
    if (fieldName === 'rta_roofing_material' && !hasRoofingB()) {
      // Auto-set all mounting planes to roof_type "A" in a single batch update
      const mountingPlaneUpdates = [];
      for (let i = 1; i <= 10; i++) {
        mountingPlaneUpdates.push([`mp${i}_roof_type`, 'A']);
      }

      if (onBatchChange) {
        onBatchChange(mountingPlaneUpdates);
      } else {
        // Fallback to individual updates (for backward compatibility)
        mountingPlaneUpdates.forEach(([field, val]) => onChange(field, val));
      }
    }
  };

  // Build subtitle with key details
  const subtitleParts = [];
  if (!isGroundMount) {
    // Roof Area (only for Roofing A)
    if (roofType === 'A' && roofArea) {
      subtitleParts.push(`${roofArea} sq ft`);
    }

    // Roofing Material
    if (roofingMaterial) subtitleParts.push(roofingMaterial);

    // Framing Size
    if (framingSize) subtitleParts.push(framingSize);

    // Framing Spacing
    if (framingSpacing) subtitleParts.push(framingSpacing);

    // Framing Type
    if (framingType) subtitleParts.push(framingType);
  } else {
    // Ground Mount subtitle
    subtitleParts.push('Ground Mount');
  }
  const subtitle = subtitleParts.join(' | ') || undefined;

  // Title changes to "Ground Mount" when active
  const title = isGroundMount ? `Ground Mount` : `Roofing (${roofType})`;

  return (
    <div style={{
      marginBottom: 'var(--spacing-xs)'
    }}>
      <EquipmentRow
        title={title}
        subtitle={subtitle}
        isComplete={isComplete}
        expanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
        onDelete={onClear}
      >
      {/* Ground Mount and Manufactured Home Buttons - Left aligned */}
      <div style={{
        display: 'flex',
        gap: 'var(--spacing-sm)',
        justifyContent: 'flex-start',
        padding: 'var(--spacing-tight) var(--spacing)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <TableRowButton
          label="Ground Mount"
          variant="outline"
          active={isGroundMount}
          onClick={handleGroundMountToggle}
        />
        <TableRowButton
          label="Manufactured Home"
          variant="outline"
          active={isManufacturedHome}
          onClick={handleManufacturedHomeToggle}
        />
      </div>

      {/* Roof/Framing Fields - Only show when NOT Ground Mount */}
      {!isGroundMount && (
        <>
          {/* Roof Area - Only show for Roofing (A) */}
          {roofType === 'A' && (
            <FormFieldRow label="Roof Area (Sq Ft)">
              <input
                type="text"
                value={roofArea}
                onChange={handleRoofAreaChange}
                placeholder="Enter area..."
                maxLength={6}
              />
            </FormFieldRow>
          )}

          {/* Roofing Material */}
          <TableDropdown
            label="Roofing Material"
            value={roofingMaterial}
            onChange={(value) => handleFieldChange(`${prefix}_roofing_material`, value)}
            options={ROOFING_MATERIAL_TYPES}
            placeholder="Select material..."
          />

          {/* Framing Size */}
          <TableDropdown
            label="Framing Size"
            value={framingSize}
            onChange={(value) => handleFieldChange(`${prefix}_framing_size`, value)}
            options={FRAMING_MEMBER_SIZES}
            placeholder="Select size..."
          />

          {/* Framing Spacing */}
          <TableDropdown
            label="Framing Spacing"
            value={framingSpacing}
            onChange={(value) => handleFieldChange(`${prefix}_framing_spacing`, value)}
            options={FRAMING_MEMBER_SPACINGS}
            placeholder="Select spacing..."
          />

          {/* Framing Type */}
          <FormFieldRow label="Framing Type" noBorder>
            <TableRowButton
              label="Truss"
              variant="outline"
              active={framingType === 'Truss'}
              onClick={() => handleFieldChange(`st_roof_${roofType.toLowerCase()}_framing_type`, 'Truss')}
            />
            <TableRowButton
              label="Rafter"
              variant="outline"
              active={framingType === 'Rafter'}
              onClick={() => handleFieldChange(`st_roof_${roofType.toLowerCase()}_framing_type`, 'Rafter')}
            />
          </FormFieldRow>
        </>
      )}
      </EquipmentRow>

      {/* Confirmation Modal for Large Roof Area */}
      <Modal
        isOpen={showConfirmModal}
        onClose={handleCancelRoofArea}
        title="Confirm Roof Area"
      >
        <div style={{ marginBottom: 'var(--spacing)' }}>
          <p>You entered a roof area of <strong>{formatWithCommas(pendingRoofArea)} sq ft</strong>.</p>
          <p>This is a large area. Please confirm this is correct.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={handleCancelRoofArea}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirmRoofArea}>
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default RoofingSection;
