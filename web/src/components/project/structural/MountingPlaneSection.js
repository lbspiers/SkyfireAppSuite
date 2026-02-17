import { useState, useEffect } from 'react';
import { PITCH_OPTIONS, STORIES_OPTIONS } from '../../../utils/constants';
import { AddSectionButton, EquipmentRow, FormFieldRow, TableDropdown, TableRowButton } from '../../ui';
import styles from './MountingPlaneSection.module.css';

/**
 * Mounting Plane Section
 * Handles mounting plane configuration with mode, metadata, and array quantities
 */
const MountingPlaneSection = ({
  formData,
  onChange,
  planeNumber = 1,
  hasRoofTypeB = false,
  onShowNextPlane,
  showNextPlane = true,
  onClear,
  keepSameActive = false,
  onKeepSameToggle
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleArrays, setVisibleArrays] = useState(1); // Start with only Array 1 visible
  const [hasInitialized, setHasInitialized] = useState(false);

  const prefix = `mp${planeNumber}`;

  const mode = formData[`st_${prefix}_mode`] || '';
  const stories = formData[`${prefix}_stories`] || '';
  const pitch = formData[`${prefix}_pitch`] || '';
  const azimuth = formData[`${prefix}_azimuth`] ?? '';
  const roofType = formData[`${prefix}_roof_type`] || 'A';

  // Array quantities
  const qty1 = formData[`st_${prefix}_arrayqty_1`] || '';
  const qty2 = formData[`st_${prefix}_arrayqty_2`] || '';
  const qty3 = formData[`st_${prefix}_arrayqty_3`] || '';
  const qty4 = formData[`st_${prefix}_arrayqty_4`] || '';
  const qty5 = formData[`st_${prefix}_arrayqty_5`] || '';
  const qty6 = formData[`st_${prefix}_arrayqty_6`] || '';
  const qty7 = formData[`st_${prefix}_arrayqty_7`] || '';
  const qty8 = formData[`st_${prefix}_arrayqty_8`] || '';

  // Array orientations
  const orientation1 = formData[`st_${prefix}_array1_orientation`] || '';
  const orientation2 = formData[`st_${prefix}_array2_orientation`] || '';
  const orientation3 = formData[`st_${prefix}_array3_orientation`] || '';
  const orientation4 = formData[`st_${prefix}_array4_orientation`] || '';
  const orientation5 = formData[`st_${prefix}_array5_orientation`] || '';
  const orientation6 = formData[`st_${prefix}_array6_orientation`] || '';
  const orientation7 = formData[`st_${prefix}_array7_orientation`] || '';
  const orientation8 = formData[`st_${prefix}_array8_orientation`] || '';

  // Auto-set defaults when component renders (only once)
  useEffect(() => {
    if (hasInitialized) return;

    // Check if this is a new/empty mounting plane
    const isEmpty = !mode && !orientation1;

    if (isEmpty) {
      // Set defaults: Flush mode and Portrait for Array 1
      if (!mode) {
        onChange(`st_${prefix}_mode`, 'Flush');
      }
      if (!orientation1) {
        onChange(`st_${prefix}_array1_orientation`, 'portrait');
      }
    }

    setHasInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInitialized, mode, orientation1]);

  const handleRoofTypeToggle = (value) => {
    onChange(`${prefix}_roof_type`, value);
  };

  // Wrapper to save toggle defaults when any field changes
  const handleFieldChange = (fieldName, value) => {
    onChange(fieldName, value);
    // Also save roof type default - always save 'A' if not explicitly set to 'B'
    // When there's no Roofing B, always default to 'A'
    // When there is Roofing B, default to 'A' (user can toggle to 'B')
    const currentRoofType = formData[`${prefix}_roof_type`];

    // Always save roof_type to ensure it's in the database
    // If it's already 'A' or 'B', this will just update the same value (idempotent)
    const roofTypeToSave = currentRoofType || 'A';
    onChange(`${prefix}_roof_type`, roofTypeToSave);
  };

  const isComplete = !!(mode && stories && pitch && azimuth);

  // Build subtitle with ALL entered data
  const subtitleParts = [];
  if (stories) subtitleParts.push(`${stories} Story`);
  if (mode) subtitleParts.push(mode);
  if (pitch) subtitleParts.push(`${pitch}° Pitch`);
  if (azimuth) subtitleParts.push(`${azimuth}° Az`);

  // Count arrays with data
  const arrayQties = [qty1, qty2, qty3, qty4, qty5, qty6, qty7, qty8];
  const arrayOrientations = [orientation1, orientation2, orientation3, orientation4, orientation5, orientation6, orientation7, orientation8];
  const filledArrays = arrayQties.filter(q => q && q !== '').length;

  if (filledArrays > 0) {
    // Check if all orientations are the same
    const validOrientations = arrayOrientations.slice(0, filledArrays).filter(o => o);
    if (validOrientations.length > 0) {
      const allLandscape = validOrientations.every(o => o === 'landscape');
      const allPortrait = validOrientations.every(o => o === 'portrait');

      if (allLandscape) {
        subtitleParts.push(`${filledArrays} Array${filledArrays > 1 ? 's' : ''} (L)`);
      } else if (allPortrait) {
        subtitleParts.push(`${filledArrays} Array${filledArrays > 1 ? 's' : ''} (P)`);
      } else {
        subtitleParts.push(`${filledArrays} Array${filledArrays > 1 ? 's' : ''} (Mixed)`);
      }
    } else {
      subtitleParts.push(`${filledArrays} Array${filledArrays > 1 ? 's' : ''}`);
    }
  }

  const subtitle = subtitleParts.join(' | ') || undefined;

  return (
    <div className={styles.sectionWrapper}>
      <EquipmentRow
        title={`Mounting Plane ${planeNumber}`}
        subtitle={subtitle}
        isComplete={isComplete}
        expanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
        onDelete={onClear}
      >
      {/* Mode Selection + Keep Same (Plane 1 only) */}
      <div className={styles.modeSelectionRow}>
        {['Flush', 'Tilt'].map((modeOption) => (
          <TableRowButton
            key={modeOption}
            label={modeOption}
            variant="outline"
            active={mode === modeOption}
            onClick={() => handleFieldChange(`st_${prefix}_mode`, modeOption)}
          />
        ))}
        {planeNumber === 1 && (
          <div style={{ marginLeft: 'auto' }}>
            <TableRowButton
              label="Keep Same"
              variant="outline"
              active={keepSameActive}
              onClick={onKeepSameToggle}
            />
          </div>
        )}
      </div>

      {/* Roof Type (if B exists) */}
      {hasRoofTypeB && (
        <FormFieldRow label="Roof">
          <TableRowButton
            label="A"
            variant="outline"
            active={roofType === 'A'}
            onClick={() => handleRoofTypeToggle('A')}
          />
          <TableRowButton
            label="B"
            variant="outline"
            active={roofType === 'B'}
            onClick={() => handleRoofTypeToggle('B')}
          />
        </FormFieldRow>
      )}

      {/* Stories */}
      <TableDropdown
        label="Stories"
        value={stories}
        onChange={(value) => handleFieldChange(`${prefix}_stories`, value)}
        options={STORIES_OPTIONS}
        placeholder="Select..."
        showSearch={false}
      />

      {/* Pitch */}
      <TableDropdown
        label="Pitch"
        value={pitch}
        onChange={(value) => handleFieldChange(`${prefix}_pitch`, value)}
        options={PITCH_OPTIONS}
        placeholder="Select..."
        showSearch={false}
      />

      {/* Azimuth */}
      <FormFieldRow label="Azimuth">
        <input
          type="text"
          inputMode="numeric"
          value={azimuth}
          onChange={(e) => {
            const val = e.target.value;
            // Allow empty string for clearing
            if (val === '') {
              handleFieldChange(`${prefix}_azimuth`, '');
              return;
            }
            // Only allow digits
            if (/^\d+$/.test(val)) {
              handleFieldChange(`${prefix}_azimuth`, val);
            }
          }}
          onBlur={(e) => {
            const val = e.target.value;
            // Allow blank
            if (val === '') {
              handleFieldChange(`${prefix}_azimuth`, '');
              return;
            }
            // Validate and clean up on blur
            const numVal = parseInt(val, 10);
            if (!isNaN(numVal)) {
              // Clamp to 0-359 range
              const clampedVal = Math.max(0, Math.min(359, numVal));
              handleFieldChange(`${prefix}_azimuth`, clampedVal.toString());
            } else {
              // Invalid number, clear it
              handleFieldChange(`${prefix}_azimuth`, '');
            }
          }}
          placeholder="0-359"
        />
      </FormFieldRow>

      {/* Array Rows - Only show visible arrays */}
      {Array.from({ length: visibleArrays }, (_, index) => {
        const arrayNum = index + 1;
        const qtyValue = formData[`st_${prefix}_arrayqty_${arrayNum}`] || '';
        const orientationValue = formData[`st_${prefix}_array${arrayNum}_orientation`] || '';

        return (
          <FormFieldRow key={arrayNum} label={`Array ${arrayNum}`}>
            <input
              type="number"
              min="0"
              value={qtyValue}
              onChange={(e) => handleFieldChange(`st_${prefix}_arrayqty_${arrayNum}`, e.target.value)}
              placeholder="0"
              style={{ width: '3rem', flex: 'none' }}
            />
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--spacing-xs)' }}>
              <TableRowButton
                label="Landscape"
                variant="outline"
                active={orientationValue === 'landscape'}
                onClick={() => handleFieldChange(`st_${prefix}_array${arrayNum}_orientation`, 'landscape')}
              />
              <TableRowButton
                label="Portrait"
                variant="outline"
                active={orientationValue === 'portrait'}
                onClick={() => handleFieldChange(`st_${prefix}_array${arrayNum}_orientation`, 'portrait')}
              />
            </div>
          </FormFieldRow>
        );
      })}

      {/* + Array Button - Only show if less than 8 arrays visible */}
      {visibleArrays < 8 && (
        <div className={styles.addArrayButtonWrapper}>
          <TableRowButton
            label="+ Array"
            variant="outline"
            onClick={() => setVisibleArrays(prev => Math.min(prev + 1, 8))}
          />
        </div>
      )}

      </EquipmentRow>

      {/* Next Plane Button - Only show if not already visible */}
      {onShowNextPlane && showNextPlane && (
        <AddSectionButton
          label={`Mounting Plane ${planeNumber + 1}`}
          onClick={onShowNextPlane}
        />
      )}
    </div>
  );
};

export default MountingPlaneSection;
