import React, { useState, useEffect } from 'react';
import RoofingSection from './structural/RoofingSection';
import RailsSection from './structural/RailsSection';
import MountingHardwareSection from './structural/MountingHardwareSection';
import MountingPlaneSection from './structural/MountingPlaneSection';
import RoofContainer from './structural/RoofContainer';
import MountingPlanesContainer from './structural/MountingPlanesContainer';
import FormNavigationFooter from './FormNavigationFooter';
import { AddSectionButton, SectionClearModal, ConfirmActionModal } from '../ui';
import equipStyles from './EquipmentForm.module.css';
import { useSystemDetails } from '../../hooks/useSystemDetails';

/**
 * StructuralForm - Structural configuration component
 * Handles roofing types, mounting hardware, and mounting planes
 * Now connected to backend via useSystemDetails hook
 */
const StructuralForm = ({ projectUuid, projectData, onNavigateToTab }) => {
  // Backend integration
  const { data: systemDetails, updateField, updateFields, clearFields, loading, saving } = useSystemDetails({
    projectUuid,
    autoFetch: true
  });
  // Navigation handlers
  const handlePrev = () => {
    if (onNavigateToTab) {
      onNavigateToTab('electrical');
    }
  };

  const handleNext = () => {
    if (onNavigateToTab) {
      onNavigateToTab('submit');
    }
  };
  const maxPlanes = 15;

  // Track last clear click for double-click detection
  const lastClearRef = React.useRef({ planeNumber: null, timestamp: 0 });

  // Track "Keep Same" state for Mounting Plane 1
  const [keepSameActive, setKeepSameActive] = useState(false);

  // Track which mounting plane's clear modal is open (null = none)
  const [clearModalPlaneNumber, setClearModalPlaneNumber] = useState(null);

  // Track clear modals for other sections
  const [showClearRoofingA, setShowClearRoofingA] = useState(false);
  const [showClearHardwareA, setShowClearHardwareA] = useState(false);
  const [showClearRoofingB, setShowClearRoofingB] = useState(false);
  const [showClearHardwareB, setShowClearHardwareB] = useState(false);

  // Track Keep Same confirmation modal
  const [showKeepSameConfirm, setShowKeepSameConfirm] = useState(false);

  // Form state - matches API field names
  const [formData, setFormData] = useState({
    // Global Structural Fields
    st_manufactured_home: false,

    // Roofing Type A
    rta_roofing_material: '',
    rta_framing_size: '',
    st_roof_a_area_sqft: '',
    rta_framing_spacing: '',
    st_roof_a_framing_type: '',
    rta_ground_mount: false,

    // Mounting Hardware A
    rta_rail_make: '',
    rta_rail_model: '',
    rta_attachment_make: '',
    rta_attachment_model: '',

    // Roofing Type B
    show_roof_b: false,
    rtb_roofing_material: '',
    rtb_framing_size: '',
    st_roof_b_area_sqft: '',
    rtb_framing_spacing: '',
    st_roof_b_framing_type: '',
    rtb_ground_mount: false,

    // Mounting Hardware B
    rtb_rail_make: '',
    rtb_rail_model: '',
    rtb_attachment_make: '',
    rtb_attachment_model: '',

    // Mounting Planes (1-10)
    visible_planes: 1, // Number of visible mounting planes
    ...generatePlaneFields(1) // Start with plane 1
  });

  // Hydrate form from backend data
  useEffect(() => {
    if (systemDetails) {
      // Count visible planes (check which planes have data)
      let maxVisiblePlane = 1;
      for (let i = 1; i <= maxPlanes; i++) {
        const hasData = !!(
          systemDetails[`st_mp${i}_mode`] ||
          (systemDetails[`mp${i}_stories`] !== null && systemDetails[`mp${i}_stories`] !== undefined && systemDetails[`mp${i}_stories`] !== '') ||
          (systemDetails[`mp${i}_pitch`] !== null && systemDetails[`mp${i}_pitch`] !== undefined && systemDetails[`mp${i}_pitch`] !== '') ||
          (systemDetails[`mp${i}_azimuth`] !== null && systemDetails[`mp${i}_azimuth`] !== undefined && systemDetails[`mp${i}_azimuth`] !== '')
        );
        if (hasData) {
          maxVisiblePlane = i;
        }
      }

      const hydratedData = {
        // Global Structural Fields
        st_manufactured_home: systemDetails.st_manufactured_home === true,

        // Roofing Type A
        rta_roofing_material: systemDetails.rta_roofing_material || '',
        rta_framing_size: systemDetails.rta_framing_size || '',
        st_roof_a_area_sqft: systemDetails.st_roof_a_area_sqft || '',
        rta_framing_spacing: systemDetails.rta_framing_spacing || '',
        st_roof_a_framing_type: systemDetails.st_roof_a_framing_type || '',
        rta_ground_mount: systemDetails.rta_ground_mount === true,

        // Mounting Hardware A
        rta_rail_make: systemDetails.rta_rail_make || '',
        rta_rail_model: systemDetails.rta_rail_model || '',
        rta_attachment_make: systemDetails.rta_attachment_make || '',
        rta_attachment_model: systemDetails.rta_attachment_model || '',

        // Roofing Type B
        show_roof_b: !!(systemDetails.rtb_roofing_material || systemDetails.rtb_framing_size),
        rtb_roofing_material: systemDetails.rtb_roofing_material || '',
        rtb_framing_size: systemDetails.rtb_framing_size || '',
        st_roof_b_area_sqft: systemDetails.st_roof_b_area_sqft || '',
        rtb_framing_spacing: systemDetails.rtb_framing_spacing || '',
        st_roof_b_framing_type: systemDetails.st_roof_b_framing_type || '',
        rtb_ground_mount: systemDetails.rtb_ground_mount === true,

        // Mounting Hardware B
        rtb_rail_make: systemDetails.rtb_rail_make || '',
        rtb_rail_model: systemDetails.rtb_rail_model || '',
        rtb_attachment_make: systemDetails.rtb_attachment_make || '',
        rtb_attachment_model: systemDetails.rtb_attachment_model || '',

        // Mounting Planes
        visible_planes: maxVisiblePlane,
      };

      // Hydrate all visible planes
      for (let i = 1; i <= maxVisiblePlane; i++) {
        const prefix = `mp${i}`;
        hydratedData[`st_${prefix}_mode`] = systemDetails[`st_${prefix}_mode`] || '';
        // Convert numbers to strings for dropdown compatibility
        hydratedData[`${prefix}_stories`] = systemDetails[`${prefix}_stories`] != null ? String(systemDetails[`${prefix}_stories`]) : '';
        hydratedData[`${prefix}_pitch`] = systemDetails[`${prefix}_pitch`] != null ? String(systemDetails[`${prefix}_pitch`]) : '';
        hydratedData[`${prefix}_azimuth`] = systemDetails[`${prefix}_azimuth`] ?? '';
        hydratedData[`${prefix}_roof_type`] = systemDetails[`${prefix}_roof_type`] || 'A';

        for (let j = 1; j <= 8; j++) {
          hydratedData[`st_${prefix}_arrayqty_${j}`] = systemDetails[`st_${prefix}_arrayqty_${j}`] || '';
          hydratedData[`st_${prefix}_array${j}_orientation`] = systemDetails[`st_${prefix}_array${j}_orientation`] || '';
        }
      }

      setFormData(hydratedData);
    }
  }, [systemDetails]);

  const handleFieldChange = async (field, value) => {
    // Optimistic UI update
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // If Keep Same is active and this is Stories/Pitch on Plane 1, sync to all other planes
    if (keepSameActive && (field === 'mp1_stories' || field === 'mp1_pitch')) {
      const fieldType = field === 'mp1_stories' ? 'stories' : 'pitch';
      const updates = {};

      for (let i = 2; i <= formData.visible_planes; i++) {
        const targetField = `mp${i}_${fieldType}`;
        updates[targetField] = value;
      }

      setFormData(prev => ({
        ...prev,
        ...updates
      }));

      // Save all updates to backend
      try {
        await updateFields(updates);
      } catch (error) {
        console.error('Failed to save synced fields:', error);
      }
    }

    // Save to backend
    try {
      await updateField(field, value);
    } catch (error) {
      console.error('Failed to save field:', field, error);
      // Error is already logged by useSystemDetails, UI will revert on next fetch
    }
  };

  // Batch update handler - updates multiple fields in a single API call
  const handleBatchChange = async (updates) => {
    // updates is an array of [field, value] pairs
    const fieldsObject = {};
    updates.forEach(([field, value]) => {
      fieldsObject[field] = value;
    });

    // Optimistic UI update
    setFormData(prev => ({
      ...prev,
      ...fieldsObject
    }));

    // Save all updates to backend in one request
    try {
      await updateFields(fieldsObject);
    } catch (error) {
      console.error('Failed to batch save fields:', error);
    }
  };

  // Handler for Keep Same toggle
  const handleKeepSameToggle = () => {
    const newKeepSameState = !keepSameActive;

    // If turning ON Keep Same and there are multiple planes, show confirmation
    if (newKeepSameState && formData.visible_planes > 1) {
      setShowKeepSameConfirm(true);
    } else {
      // If turning OFF or only 1 plane exists, no confirmation needed
      setKeepSameActive(newKeepSameState);
    }
  };

  // Confirm and execute Keep Same activation
  const handleConfirmKeepSame = () => {
    setShowKeepSameConfirm(false);
    setKeepSameActive(true);

    // Sync current Plane 1 values to all other planes
    const plane1Stories = formData.mp1_stories;
    const plane1Pitch = formData.mp1_pitch;
    const updates = {};

    for (let i = 2; i <= formData.visible_planes; i++) {
      updates[`mp${i}_stories`] = plane1Stories;
      updates[`mp${i}_pitch`] = plane1Pitch;
    }

    setFormData(prev => ({
      ...prev,
      ...updates
    }));

    // Save all updates to backend
    if (Object.keys(updates).length > 0) {
      updateFields(updates).catch(error => {
        console.error('Failed to sync Keep Same values:', error);
      });
    }
  };

  // Clear handlers that reset UI and save null values to database
  const handleClearRoofingA = async () => {
    setShowClearRoofingA(false);

    const fieldsToClear = [
      'rta_roofing_material',
      'rta_framing_size',
      'st_roof_a_area_sqft',
      'rta_framing_spacing',
      'st_roof_a_framing_type',
    ];

    // Optimistic UI update
    setFormData(prev => ({
      ...prev,
      rta_roofing_material: '',
      rta_framing_size: '',
      st_roof_a_area_sqft: '',
      rta_framing_spacing: '',
      st_roof_a_framing_type: '',
    }));

    // Save null values to database
    try {
      await clearFields(fieldsToClear);
    } catch (error) {
      console.error('Failed to clear Roofing A fields:', error);
    }
  };

  const handleClearMountingHardwareA = async () => {
    setShowClearHardwareA(false);

    const fieldsToClear = [
      'rta_rail_make',
      'rta_rail_model',
      'rta_attachment_make',
      'rta_attachment_model',
    ];

    // Optimistic UI update
    setFormData(prev => ({
      ...prev,
      rta_rail_make: '',
      rta_rail_model: '',
      rta_attachment_make: '',
      rta_attachment_model: '',
    }));

    // Save null values to database
    try {
      await clearFields(fieldsToClear);
    } catch (error) {
      console.error('Failed to clear Mounting Hardware A fields:', error);
    }
  };

  const handleClearRoofingB = async () => {
    setShowClearRoofingB(false);

    const fieldsToClear = [
      'rtb_roofing_material',
      'rtb_framing_size',
      'st_roof_b_area_sqft',
      'rtb_framing_spacing',
      'st_roof_b_framing_type',
    ];

    // Optimistic UI update
    setFormData(prev => ({
      ...prev,
      rtb_roofing_material: '',
      rtb_framing_size: '',
      st_roof_b_area_sqft: '',
      rtb_framing_spacing: '',
      st_roof_b_framing_type: '',
    }));

    // Save null values to database
    try {
      await clearFields(fieldsToClear);
    } catch (error) {
      console.error('Failed to clear Roofing B fields:', error);
    }
  };

  const handleClearMountingHardwareB = async () => {
    setShowClearHardwareB(false);

    const fieldsToClear = [
      'rtb_rail_make',
      'rtb_rail_model',
      'rtb_attachment_make',
      'rtb_attachment_model',
    ];

    // Optimistic UI update
    setFormData(prev => ({
      ...prev,
      rtb_rail_make: '',
      rtb_rail_model: '',
      rtb_attachment_make: '',
      rtb_attachment_model: '',
    }));

    // Save null values to database
    try {
      await clearFields(fieldsToClear);
    } catch (error) {
      console.error('Failed to clear Mounting Hardware B fields:', error);
    }
  };

  const handleOpenClearModal = (planeNumber) => {
    setClearModalPlaneNumber(planeNumber);
  };

  const handleClearMountingPlane = async (planeNumber) => {
    // Close the modal
    setClearModalPlaneNumber(null);

    // Turn off Keep Same when any plane is cleared
    setKeepSameActive(false);

    const now = Date.now();
    const lastClear = lastClearRef.current;

    // Check if this is a double-click (within 500ms) on the same plane
    const isDoubleClick =
      lastClear.planeNumber === planeNumber &&
      (now - lastClear.timestamp) < 500;

    // Update last clear tracking
    lastClearRef.current = { planeNumber, timestamp: now };

    // If double-click and not plane 1, remove the plane
    if (isDoubleClick && planeNumber > 1) {
      // Collect fields to clear from this plane onwards
      const fieldsToClear = [];

      // Get current visible planes count before updating
      const currentVisiblePlanes = formData.visible_planes;

      for (let i = planeNumber; i <= currentVisiblePlanes; i++) {
        const prefix = `mp${i}`;
        fieldsToClear.push(
          `st_${prefix}_mode`,
          `${prefix}_stories`,
          `${prefix}_pitch`,
          `${prefix}_azimuth`,
          `${prefix}_roof_type`,
          `st_${prefix}_arrayqty_1`,
          `st_${prefix}_arrayqty_2`,
          `st_${prefix}_arrayqty_3`,
          `st_${prefix}_arrayqty_4`,
          `st_${prefix}_arrayqty_5`,
          `st_${prefix}_arrayqty_6`,
          `st_${prefix}_arrayqty_7`,
          `st_${prefix}_arrayqty_8`,
          `st_${prefix}_array1_orientation`,
          `st_${prefix}_array2_orientation`,
          `st_${prefix}_array3_orientation`,
          `st_${prefix}_array4_orientation`,
          `st_${prefix}_array5_orientation`,
          `st_${prefix}_array6_orientation`,
          `st_${prefix}_array7_orientation`,
          `st_${prefix}_array8_orientation`
        );
      }

      // Optimistic UI update - remove this plane and all after it
      setFormData(prev => {
        const newVisiblePlanes = planeNumber - 1;
        const updates = { visible_planes: newVisiblePlanes };

        for (let i = planeNumber; i <= prev.visible_planes; i++) {
          const prefix = `mp${i}`;
          updates[`st_${prefix}_mode`] = '';
          updates[`${prefix}_stories`] = '';
          updates[`${prefix}_pitch`] = '';
          updates[`${prefix}_azimuth`] = '';
          updates[`${prefix}_roof_type`] = 'A';
          updates[`st_${prefix}_arrayqty_1`] = '';
          updates[`st_${prefix}_arrayqty_2`] = '';
          updates[`st_${prefix}_arrayqty_3`] = '';
          updates[`st_${prefix}_arrayqty_4`] = '';
          updates[`st_${prefix}_arrayqty_5`] = '';
          updates[`st_${prefix}_arrayqty_6`] = '';
          updates[`st_${prefix}_arrayqty_7`] = '';
          updates[`st_${prefix}_arrayqty_8`] = '';
          updates[`st_${prefix}_array1_orientation`] = '';
          updates[`st_${prefix}_array2_orientation`] = '';
          updates[`st_${prefix}_array3_orientation`] = '';
          updates[`st_${prefix}_array4_orientation`] = '';
          updates[`st_${prefix}_array5_orientation`] = '';
          updates[`st_${prefix}_array6_orientation`] = '';
          updates[`st_${prefix}_array7_orientation`] = '';
          updates[`st_${prefix}_array8_orientation`] = '';
        }

        return { ...prev, ...updates };
      });

      // Save null values to database
      try {
        await clearFields(fieldsToClear);
      } catch (error) {
        console.error(`Failed to clear mounting plane ${planeNumber} and onwards:`, error);
      }

      return;
    }

    // Single click - just clear the data
    const prefix = `mp${planeNumber}`;
    const fieldsToClear = [
      `st_${prefix}_mode`,
      `${prefix}_stories`,
      `${prefix}_pitch`,
      `${prefix}_azimuth`,
      `${prefix}_roof_type`,
      `st_${prefix}_arrayqty_1`,
      `st_${prefix}_arrayqty_2`,
      `st_${prefix}_arrayqty_3`,
      `st_${prefix}_arrayqty_4`,
      `st_${prefix}_arrayqty_5`,
      `st_${prefix}_arrayqty_6`,
      `st_${prefix}_arrayqty_7`,
      `st_${prefix}_arrayqty_8`,
      `st_${prefix}_array1_orientation`,
      `st_${prefix}_array2_orientation`,
      `st_${prefix}_array3_orientation`,
      `st_${prefix}_array4_orientation`,
      `st_${prefix}_array5_orientation`,
      `st_${prefix}_array6_orientation`,
      `st_${prefix}_array7_orientation`,
      `st_${prefix}_array8_orientation`,
    ];

    // Optimistic UI update
    setFormData(prev => ({
      ...prev,
      [`st_${prefix}_mode`]: '',
      [`${prefix}_stories`]: '',
      [`${prefix}_pitch`]: '',
      [`${prefix}_azimuth`]: '',
      [`${prefix}_roof_type`]: 'A',
      [`st_${prefix}_arrayqty_1`]: '',
      [`st_${prefix}_arrayqty_2`]: '',
      [`st_${prefix}_arrayqty_3`]: '',
      [`st_${prefix}_arrayqty_4`]: '',
      [`st_${prefix}_arrayqty_5`]: '',
      [`st_${prefix}_arrayqty_6`]: '',
      [`st_${prefix}_arrayqty_7`]: '',
      [`st_${prefix}_arrayqty_8`]: '',
      [`st_${prefix}_array1_orientation`]: '',
      [`st_${prefix}_array2_orientation`]: '',
      [`st_${prefix}_array3_orientation`]: '',
      [`st_${prefix}_array4_orientation`]: '',
      [`st_${prefix}_array5_orientation`]: '',
      [`st_${prefix}_array6_orientation`]: '',
      [`st_${prefix}_array7_orientation`]: '',
      [`st_${prefix}_array8_orientation`]: '',
    }));

    // Save null values to database
    try {
      await clearFields(fieldsToClear);
    } catch (error) {
      console.error(`Failed to clear mounting plane ${planeNumber}:`, error);
    }
  };

  const handleShowRoofB = () => {
    setFormData(prev => ({
      ...prev,
      show_roof_b: true
    }));
  };

  const handleCancelRoofB = () => {
    const clearFields = {
      show_roof_b: null,
      rtb_roofing_material: null,
      rtb_framing_size: null,
      st_roof_b_area_sqft: null,
      rtb_framing_spacing: null,
      st_roof_b_framing_type: null,
      rtb_rail_make: null,
      rtb_rail_model: null,
      rtb_attachment_make: null,
      rtb_attachment_model: null,
    };

    // Update UI state
    setFormData(prev => ({
      ...prev,
      show_roof_b: false,
      // Clear Roof B data
      rtb_roofing_material: '',
      rtb_framing_size: '',
      st_roof_b_area_sqft: '',
      rtb_framing_spacing: '',
      st_roof_b_framing_type: '',
      // Clear Mounting Hardware B data
      rtb_rail_make: '',
      rtb_rail_model: '',
      rtb_attachment_make: '',
      rtb_attachment_model: '',
      // Reset all planes to roof type A
      ...resetPlanesRoofType(prev.visible_planes)
    }));

    // TODO: When database is connected, send null values to clear these fields
    // await updateProjectFields(projectUuid, clearFields);
  };

  const handleShowNextPlane = async () => {
    if (formData.visible_planes < maxPlanes) {
      const nextPlane = formData.visible_planes + 1;
      const newPlaneFields = generatePlaneFields(nextPlane);

      // Prepare fields to save to backend
      const fieldsToSave = {
        [`st_mp${nextPlane}_mode`]: 'Flush', // Save default Flush mode
      };

      // If Keep Same is active, inherit Stories and Pitch from Plane 1
      if (keepSameActive) {
        const plane1Stories = formData.mp1_stories;
        const plane1Pitch = formData.mp1_pitch;

        newPlaneFields[`mp${nextPlane}_stories`] = plane1Stories;
        newPlaneFields[`mp${nextPlane}_pitch`] = plane1Pitch;

        fieldsToSave[`mp${nextPlane}_stories`] = plane1Stories;
        fieldsToSave[`mp${nextPlane}_pitch`] = plane1Pitch;
      }

      // Save default values and any Keep Same values to backend
      try {
        await updateFields(fieldsToSave);
      } catch (error) {
        console.error('Failed to save new plane defaults:', error);
      }

      setFormData(prev => ({
        ...prev,
        visible_planes: nextPlane,
        ...newPlaneFields
      }));
    }
  };

  // Check if Mounting Hardware A has data (required for showing Roof B button)
  const hasHardwareAData = formData.rta_rail_make && formData.rta_rail_model;

  return (
    <form onSubmit={(e) => e.preventDefault()} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Scrollable Content */}
      <div className={equipStyles.scrollableContent}>
        {/* Roof (A) Container */}
        <RoofContainer roofType="A">
          {/* Roofing (A) */}
          <RoofingSection
            formData={formData}
            onChange={handleFieldChange}
            onBatchChange={handleBatchChange}
            roofType="A"
            onClear={() => setShowClearRoofingA(true)}
          />

          {/* Rails (A) - Hidden when Ground Mount is active */}
          {!formData.rta_ground_mount && (
            <RailsSection
              formData={formData}
              onChange={handleFieldChange}
              railType="A"
              onClear={() => setShowClearHardwareA(true)}
            />
          )}

          {/* Attachment (A) - Hidden when Ground Mount is active */}
          {!formData.rta_ground_mount && (
            <MountingHardwareSection
              formData={formData}
              onChange={handleFieldChange}
              hardwareType="A"
              onClear={() => setShowClearHardwareA(true)}
            />
          )}
        </RoofContainer>

        {/* + Roof (B) Button - Only show when Roof B is not visible */}
        {!formData.show_roof_b && (
          <AddSectionButton
            label="Roof (B)"
            onClick={handleShowRoofB}
          />
        )}

        {/* Roof (B) Container - Conditionally visible */}
        {formData.show_roof_b && (
          <RoofContainer roofType="B" onDelete={handleCancelRoofB}>
            {/* Roofing (B) */}
            <RoofingSection
              formData={formData}
              onChange={handleFieldChange}
              onBatchChange={handleBatchChange}
              roofType="B"
              onClear={() => setShowClearRoofingB(true)}
              onCancel={handleCancelRoofB}
            />

            {/* Rails (B) - Hidden when Ground Mount is active */}
            {!formData.rtb_ground_mount && (
              <RailsSection
                formData={formData}
                onChange={handleFieldChange}
                railType="B"
                onClear={() => setShowClearHardwareB(true)}
              />
            )}

            {/* Attachment (B) - Hidden when Ground Mount is active */}
            {!formData.rtb_ground_mount && (
              <MountingHardwareSection
                formData={formData}
                onChange={handleFieldChange}
                hardwareType="B"
                onClear={() => setShowClearHardwareB(true)}
              />
            )}
          </RoofContainer>
        )}

        {/* Mounting Planes Container */}
        <MountingPlanesContainer>
          {Array.from({ length: formData.visible_planes }, (_, index) => {
            const planeNumber = index + 1;
            const isLastPlane = planeNumber === formData.visible_planes;

            // Check if Roofing B exists based on rtb_roofing_material value
            const hasRoofTypeB = !!(formData.rtb_roofing_material);

            return (
              <MountingPlaneSection
                key={planeNumber}
                formData={formData}
                onChange={handleFieldChange}
                planeNumber={planeNumber}
                hasRoofTypeB={hasRoofTypeB}
                onClear={() => handleOpenClearModal(planeNumber)}
                onShowNextPlane={isLastPlane && planeNumber < maxPlanes ? handleShowNextPlane : null}
                showNextPlane={isLastPlane && planeNumber < maxPlanes}
                keepSameActive={planeNumber === 1 ? keepSameActive : undefined}
                onKeepSameToggle={planeNumber === 1 ? handleKeepSameToggle : undefined}
              />
            );
          })}
        </MountingPlanesContainer>
      </div>

      {/* Clear Modals for all sections */}
      <SectionClearModal
        isOpen={showClearRoofingA}
        onClose={() => setShowClearRoofingA(false)}
        onConfirm={handleClearRoofingA}
        sectionName="Roofing (A)"
      />

      <SectionClearModal
        isOpen={showClearHardwareA}
        onClose={() => setShowClearHardwareA(false)}
        onConfirm={handleClearMountingHardwareA}
        sectionName="Mounting Hardware (A)"
      />

      <SectionClearModal
        isOpen={showClearRoofingB}
        onClose={() => setShowClearRoofingB(false)}
        onConfirm={handleClearRoofingB}
        sectionName="Roofing (B)"
      />

      <SectionClearModal
        isOpen={showClearHardwareB}
        onClose={() => setShowClearHardwareB(false)}
        onConfirm={handleClearMountingHardwareB}
        sectionName="Mounting Hardware (B)"
      />

      <SectionClearModal
        isOpen={clearModalPlaneNumber !== null}
        onClose={() => setClearModalPlaneNumber(null)}
        onConfirm={() => handleClearMountingPlane(clearModalPlaneNumber)}
        sectionName={`Mounting Plane ${clearModalPlaneNumber}`}
      />

      {/* Keep Same Confirmation Modal */}
      <ConfirmActionModal
        isOpen={showKeepSameConfirm}
        onClose={() => setShowKeepSameConfirm(false)}
        onConfirm={handleConfirmKeepSame}
        title="Overwrite Stories & Pitch?"
        message={
          <>
            This will overwrite <strong>Stories</strong> and <strong>Pitch</strong> values for all mounting planes (2-{formData.visible_planes}) with the values from Mounting Plane 1.
          </>
        }
        confirmText="Overwrite All"
        cancelText="Cancel"
        scopedToPanel={true}
      />

      {/* Footer Navigation */}
      <FormNavigationFooter
        onPrev={handlePrev}
        onNext={handleNext}
        prevLabel="Prev"
        nextLabel="Next"
      />
    </form>
  );
};

// Helper function to generate empty plane fields
function generatePlaneFields(planeNumber) {
  const prefix = `mp${planeNumber}`;
  return {
    [`st_${prefix}_mode`]: 'Flush', // Default to Flush mode
    [`${prefix}_stories`]: '',
    [`${prefix}_pitch`]: '',
    [`${prefix}_azimuth`]: '',
    [`${prefix}_roof_type`]: 'A',
    [`st_${prefix}_arrayqty_1`]: '',
    [`st_${prefix}_arrayqty_2`]: '',
    [`st_${prefix}_arrayqty_3`]: '',
    [`st_${prefix}_arrayqty_4`]: '',
    [`st_${prefix}_arrayqty_5`]: '',
    [`st_${prefix}_arrayqty_6`]: '',
    [`st_${prefix}_arrayqty_7`]: '',
    [`st_${prefix}_arrayqty_8`]: '',
    [`st_${prefix}_array1_orientation`]: '',
    [`st_${prefix}_array2_orientation`]: '',
    [`st_${prefix}_array3_orientation`]: '',
    [`st_${prefix}_array4_orientation`]: '',
    [`st_${prefix}_array5_orientation`]: '',
    [`st_${prefix}_array6_orientation`]: '',
    [`st_${prefix}_array7_orientation`]: '',
    [`st_${prefix}_array8_orientation`]: '',
  };
}

// Helper function to reset all plane roof types to A
function resetPlanesRoofType(visiblePlanes) {
  const updates = {};
  for (let i = 1; i <= visiblePlanes; i++) {
    updates[`mp${i}_roof_type`] = 'A';
  }
  return updates;
}

export default StructuralForm;
