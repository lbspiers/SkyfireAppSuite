import React, { useState, useEffect } from 'react';
import CombinerPanelForm from './CombinerPanelForm';
import PostCombineBOSSection from './PostCombineBOSSection';
import WarningModal from '../../ui/WarningModal';
import {
  getLandingOptions,
  generateConfigurationData,
  isConfigurationComplete,
  getCollapsedDisplayText,
} from '../../../utils/combineSystemsHelpers';
import styles from './CombineSystemsForm.module.css';

/**
 * CombineSystemsForm - Refactored with expandable row pattern
 * All systems visible at once, inline summary, tight spacing
 */
const CombineSystemsForm = ({
  projectUuid,
  activeSystems = [],
  systemData = {},
  existingConfiguration = null,
  onSave,
  hasSubPanelB = false,
  subPanelBData = null,
}) => {
  const [combineSystems, setCombineSystems] = useState(null);
  const [systemLandings, setSystemLandings] = useState({});
  const [expandedSystem, setExpandedSystem] = useState(null);
  const [combinerPanelData, setCombinerPanelData] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingChoice, setPendingChoice] = useState(null);

  // Load existing configuration if available
  useEffect(() => {
    if (existingConfiguration) {
      setCombineSystems(existingConfiguration.combine_systems);
      setSystemLandings(existingConfiguration.system_landings || {});

      if (existingConfiguration.combiner_panel_data) {
        setCombinerPanelData(existingConfiguration.combiner_panel_data);
      }
    }
  }, [existingConfiguration]);

  // Auto-expand first unconfigured system when "Combine" is selected
  useEffect(() => {
    if (combineSystems === true && expandedSystem === null) {
      const firstUnconfigured = activeSystems.find(
        sys => !systemLandings[`system${sys}`]
      );
      if (firstUnconfigured) {
        setExpandedSystem(firstUnconfigured);
      }
    }
  }, [combineSystems, activeSystems, systemLandings, expandedSystem]);

  const handleModeToggle = (choice) => {
    // If switching from Combine to Do Not Combine and there's config, show warning
    if (combineSystems === true && choice === false && Object.keys(systemLandings).length > 0) {
      setPendingChoice(choice);
      setShowWarningModal(true);
      return;
    }

    setCombineSystems(choice);
    if (choice === false) {
      // Clear configuration when switching to "Do Not Combine"
      setSystemLandings({});
      setExpandedSystem(null);
      setCombinerPanelData(null);
    }
  };

  const handleConfirmSwitch = () => {
    setSystemLandings({});
    setExpandedSystem(null);
    setCombinerPanelData(null);
    setCombineSystems(pendingChoice);
    setShowWarningModal(false);
    setPendingChoice(null);
  };

  const handleCancelSwitch = () => {
    setShowWarningModal(false);
    setPendingChoice(null);
  };

  const handleToggleRow = (systemNum) => {
    setExpandedSystem(expandedSystem === systemNum ? null : systemNum);
  };

  const handleLandingSelect = (systemNum, landing) => {
    const newLandings = {
      ...systemLandings,
      [`system${systemNum}`]: landing,
    };
    setSystemLandings(newLandings);

    // Collapse current row
    setExpandedSystem(null);

    // Find next unconfigured system and expand it
    const nextSystem = activeSystems.find(
      s => s > systemNum && !newLandings[`system${s}`]
    );
    if (nextSystem) {
      setExpandedSystem(nextSystem);
    }

    // Auto-save configuration
    if (onSave) {
      const configData = generateConfigurationData(
        true,
        newLandings,
        activeSystems,
        systemData,
        hasSubPanelB,
        subPanelBData,
        combinerPanelData
      );
      onSave(configData);
    }
  };

  const handleCombinerPanelDataSave = (data) => {
    setCombinerPanelData(data);

    // Auto-save configuration
    if (onSave) {
      const configData = generateConfigurationData(
        combineSystems,
        systemLandings,
        activeSystems,
        systemData,
        hasSubPanelB,
        subPanelBData,
        data
      );
      onSave(configData);
    }
  };

  // Check if we need at least 2 systems
  if (activeSystems.length < 2) {
    return (
      <div className={styles.container}>
        <div className={styles.messageBox}>
          <span className={`${styles.messageIcon} ${styles.info}`}>ℹ️</span>
          <p className={styles.messageText}>
            The Combine feature requires at least 2 systems with equipment data.
            Please add equipment for System 2 or higher to use this feature.
          </p>
        </div>
      </div>
    );
  }

  // Get landing options for a specific system
  const getLandingOptionsForSystem = (systemNum) => {
    return getLandingOptions(
      systemNum,
      activeSystems,
      systemData,
      systemLandings,
      hasSubPanelB
    );
  };

  // Check if a landing is taken by another system
  // Combiner Panel can be SHARED - it's not exclusive
  const isLandingTaken = (systemNum, landing) => {
    // Combiner Panel can be shared by multiple systems - that's what combiners do!
    if (landing.includes('Combiner Panel')) return false;

    // All other landings are EXCLUSIVE (one system only)
    return Object.entries(systemLandings).some(
      ([key, value]) => key !== `system${systemNum}` && value === landing
    );
  };

  // Check if Combiner Panel is being shared with other systems
  const isCombinerShared = (currentSystemNum, landingValue) => {
    if (!landingValue?.includes('Combiner Panel')) return false;

    return Object.entries(systemLandings).some(
      ([key, value]) => key !== `system${currentSystemNum}` && value?.includes('Combiner Panel')
    );
  };

  // Check if configuration is complete
  const configComplete = isConfigurationComplete(activeSystems, systemLandings);

  // Check if any system has selected Combiner Panel
  const hasCombinerPanelSelection = Object.values(systemLandings).some(
    landing => landing === 'Combiner Panel'
  );

  return (
    <div className={styles.container}>
      {/* Mode Toggle - Not rendered, controlled by parent */}
      {/* Parent EquipmentForm handles Do Not Combine / Combine buttons */}

      {/* Do Not Combine State */}
      {combineSystems === false && (
        <div className={styles.messageBox}>
          <span className={`${styles.messageIcon} ${styles.success}`}>✓</span>
          <p className={styles.messageText}>
            Each system will connect independently to the electrical panel.
          </p>
        </div>
      )}

      {/* Combine State - System Landing Rows */}
      {combineSystems === true && (
        <>
          {activeSystems.map((systemNum) => {
            const landingKey = `system${systemNum}`;
            const selectedLanding = systemLandings[landingKey];
            const isExpanded = expandedSystem === systemNum;
            const landingOptions = getLandingOptionsForSystem(systemNum);

            return (
              <div key={systemNum} className={styles.landingRow}>
                {/* Row Header */}
                <button
                  type="button"
                  className={styles.landingRowHeader}
                  onClick={() => handleToggleRow(systemNum)}
                >
                  <div className={styles.landingRowLeft}>
                    <span className={styles.systemName}>System {systemNum}</span>
                    <span className={styles.landingArrow}>→</span>
                    {selectedLanding ? (
                      <span className={styles.landingValue}>
                        {getCollapsedDisplayText(selectedLanding, systemData)}
                      </span>
                    ) : (
                      <span className={styles.landingEmpty}>Select landing</span>
                    )}
                  </div>
                  <div className={`${styles.chevron} ${isExpanded ? styles.open : ''}`}>
                    <ChevronDownIcon />
                  </div>
                </button>

                {/* Expanded Options Panel */}
                {isExpanded && (
                  <div className={styles.optionsPanel}>
                    <div className={styles.optionsGrid}>
                      {landingOptions.map((option) => {
                        const isTaken = isLandingTaken(systemNum, option.value);
                        const isSelected = selectedLanding === option.value;
                        const isDisabled = option.disabled || isTaken;
                        const isShared = !isSelected && isCombinerShared(systemNum, option.value);

                        return (
                          <div
                            key={option.value}
                            className={`
                              ${styles.optionCard}
                              ${isSelected ? styles.selected : ''}
                              ${isDisabled ? styles.disabled : ''}
                              ${isShared ? styles.shared : ''}
                            `.trim()}
                            onClick={() => !isDisabled && handleLandingSelect(systemNum, option.value)}
                          >
                            <div className={styles.optionTitle}>
                              {option.label}
                              {isShared && (
                                <span className={styles.sharedBadge}>Shared</span>
                              )}
                            </div>
                            <div className={styles.optionSubtitle}>{option.description}</div>
                            {isTaken && (
                              <div className={styles.optionDisabledReason}>
                                (Already selected by another system)
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Combiner Panel Form (if selected) */}
          {hasCombinerPanelSelection && (
            <div className={styles.combinerPanelSection}>
              <div className={styles.sectionTitle}>Combiner Panel Details</div>
              <CombinerPanelForm
                onSave={handleCombinerPanelDataSave}
                initialData={combinerPanelData}
              />
            </div>
          )}

        </>
      )}

      {/* Initial State (no choice made) */}
      {combineSystems === null && (
        <div className={styles.messageBox}>
          <span className={`${styles.messageIcon} ${styles.info}`}>ℹ️</span>
          <p className={styles.messageText}>
            Select whether to combine systems or connect them independently.
          </p>
        </div>
      )}

      {/* Warning Modal */}
      <WarningModal
        isOpen={showWarningModal}
        onClose={handleCancelSwitch}
        onConfirm={handleConfirmSwitch}
        title="Clear Configuration?"
        message="The Combine System configuration will be cleared."
        scopedToPanel={true}
      />
    </div>
  );
};

// Chevron Down Icon
const ChevronDownIcon = () => (
  <svg
    className={styles.chevronSvg}
    viewBox="0 0 16 16"
    fill="currentColor"
  >
    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
  </svg>
);

export default CombineSystemsForm;
