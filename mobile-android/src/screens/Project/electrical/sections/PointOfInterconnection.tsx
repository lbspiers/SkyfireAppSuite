// src/screens/Project/electrical/sections/PointOfInterconnectionSection.tsx

import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import CollapsibleSectionNoToggle from "../../../../components/UI/CollapsibleSection_noToggle";
import Dropdown from "../../../../components/Dropdown";
import Button from "../../../../components/Button";
import ConfirmClearModal from "../../../../components/Modals/ConfirmClearModal";
import { usePhotoCapture } from "../../../../hooks/usePhotoCapture";
import { fetchSystemDetails } from "../../../../api/systemDetails.service";
import { getInverterByModelNumber } from "../../../../api/inverter.service";

import {
  POI_TYPE_OPTIONS,
  POI_LOCATION_MAP,
  BREAKER_RATING_OPTIONS,
  FUSE_OPTIONS,
  DEFAULT_ELECTRICAL_PHOTO_TAGS,
  PCS_AMPS_OPTIONS,
} from "../../../../utils/constants";

const pencilIcon = require("../../../../assets/Images/icons/pencil_icon_white.png");
const xIcon = require("../../../../assets/Images/icons/X_Icon_Red_BB92011.png");

export interface PointOfInterconnectionSectionProps {
  systemNumber?: number; // Optional system number (1-4) for multiple POI sections
  isCombinedSystem?: boolean; // Whether this is a combined system (System 1 & 2)
  combineMethod?: string; // Where systems are combined (e.g., "Tesla PowerWall 3 - Sys 1")
  poiType: string;
  onPoiTypeChange: (v: string) => void;

  breakerRating: string;
  onBreakerRatingChange: (v: string) => void;

  disconnectRating: string;
  onDisconnectRatingChange: (v: string) => void;

  poiLocation: string;
  onPoiLocationChange: (v: string) => void;

  mpaAllowableBackfeed?: number; // Main Panel A allowable backfeed
  spbAllowableBackfeed?: number; // Sub Panel B allowable backfeed

  pcsAmps?: string; // PCS Amps setting for this system
  onPcsAmpsChange?: (v: string) => void;

  hasBattery?: boolean; // Whether this system has a battery (for PCS control)

  // Equipment labels for System 2+ identification
  solarPanelMake?: string;
  solarPanelModel?: string;
  inverterMake?: string;
  inverterModel?: string;
  systemType?: string; // "microinverter" or "inverter"

  totalActiveSystems?: number; // Total number of active systems (to hide labels if only 1)

  errors?: {
    poiType?: string;
    breakerRating?: string;
    disconnectRating?: string;
    poiLocation?: string;
  };
  projectId?: string;
  companyId?: string;
  onOpenGallery?: (sectionLabel: string) => void;
}

export default function PointOfInterconnectionSection({
  systemNumber,
  isCombinedSystem = false,
  combineMethod = "",
  poiType,
  onPoiTypeChange,
  breakerRating,
  onBreakerRatingChange,
  disconnectRating,
  onDisconnectRatingChange,
  poiLocation,
  onPoiLocationChange,
  mpaAllowableBackfeed,
  spbAllowableBackfeed,
  pcsAmps = "",
  onPcsAmpsChange,
  hasBattery = false,
  solarPanelMake,
  solarPanelModel,
  inverterMake,
  inverterModel,
  systemType,
  totalActiveSystems = 1,
  errors = {},
  projectId = "",
  companyId = "",
  onOpenGallery,
}: PointOfInterconnectionSectionProps) {
  // track expanded/collapsed state
  const [expanded, setExpanded] = useState(true);
  // track edit modes
  const [editRating, setEditRating] = useState(false);
  const [editDisconnect, setEditDisconnect] = useState(false);
  // clear‐all confirmation modal
  const [showClearModal, setShowClearModal] = useState(false);
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [panelNote, setPanelNote] = useState<string>("");
  // Max Continuous Output for this system
  const [maxContinuousOutputAmps, setMaxContinuousOutputAmps] = useState<
    number | null
  >(null);
  const [loadingMaxOutput, setLoadingMaxOutput] = useState(false);
  const [allowableBackfeed, setAllowableBackfeed] = useState<number | null>(
    null
  );
  // Manual PCS activation state
  const [manualPcsActivated, setManualPcsActivated] = useState(false);

  // Dynamic section label based on system number and combined status
  const sectionLabel = isCombinedSystem
    ? "POI - Combined Systems 1 & 2"
    : systemNumber
    ? `POI - System ${systemNumber}`
    : "Point of Interconnection";

  // Filter breaker rating options to show only values >= max continuous output (125%)
  const filteredBreakerRatingOptions = useMemo(() => {
    if (maxContinuousOutputAmps === null) {
      // If no max output calculated, show all options
      return [...BREAKER_RATING_OPTIONS];
    }

    // Calculate the minimum breaker rating needed (max continuous output × 125%)
    const minBreakerRating = maxContinuousOutputAmps * 1.25;

    // Filter to show only breaker ratings >= minimum (excluding MLO)
    const filtered = BREAKER_RATING_OPTIONS.filter((option) => {
      if (option.value === "MLO") return false; // Exclude MLO from filtered list
      const ratingValue = parseFloat(option.value);
      return !isNaN(ratingValue) && ratingValue >= minBreakerRating;
    }).map(option => ({ label: option.label, value: option.value }));

    console.log(
      `[POI] Filtered breaker ratings: min=${minBreakerRating.toFixed(1)} Amps, showing ${filtered.length} options`
    );

    return filtered;
  }, [maxContinuousOutputAmps]);

  // DEBUG: Log what we're rendering
  console.log(
    "[POI] Rendering with systemNumber:",
    systemNumber,
    "sectionLabel:",
    sectionLabel
  );

  const photoCapture = usePhotoCapture();

  // Load photo count on mount
  useEffect(() => {
    if (projectId && sectionLabel) {
      photoCapture.getPhotoCount(sectionLabel).then(setPhotoCount);
    }
  }, [projectId, sectionLabel, photoCapture.refreshTrigger]);

  // Fetch Max Continuous Output for this system (or combined systems)
  useEffect(() => {
    const loadMaxOutputForSystem = async (sysNum: number, systemData: any): Promise<number> => {
      const prefix = `sys${sysNum}`;
      const inverterMake = systemData[`${prefix}_micro_inverter_make`];
      const inverterModel = systemData[`${prefix}_micro_inverter_model`];
      const microInverterQty = systemData[`${prefix}_micro_inverter_qty`] || 0;
      const systemSelection = systemData[`${prefix}_selectedsystem`];

      console.log(
        `[POI] loadMaxOutputForSystem called for System ${sysNum}:`,
        { inverterMake, inverterModel, microInverterQty, systemSelection }
      );

      if (!inverterMake || !inverterModel) {
        console.log(`[POI] System ${sysNum}: Missing inverter make or model - returning 0`);
        return 0;
      }

      console.log(
        `[POI] Fetching max output for System ${sysNum}: ${inverterMake} ${inverterModel}`
      );

      // Fetch inverter list by manufacturer
      const URL = `https://api.skyfireapp.io/api/inverters/models?manufacturer=${encodeURIComponent(
        inverterMake
      )}`;
      const response = await fetch(URL);
      const data = await response.json();

      console.log(`[POI] API returned ${data?.data?.length || 0} inverters for manufacturer: ${inverterMake}`);

      if (data?.success && Array.isArray(data.data)) {
        // Normalize strings for comparison (remove all spaces, normalize case for matching)
        const normalizeForMatching = (str: string) =>
          str.toLowerCase().replace(/\s+/g, '').trim();

        const normalizedSearchModel = normalizeForMatching(inverterModel);
        console.log(`[POI] Normalized search string: "${normalizedSearchModel}"`);

        // Try multiple matching strategies for flexible matching
        let matchedInverter = data.data.find(
          (inv: any) =>
            inv.model_number === inverterModel ||
            inv.make_model === `${inverterMake} ${inverterModel}`
        );

        // If no exact match, try normalized matching
        if (!matchedInverter) {
          // Log all available models for debugging
          console.log(`[POI] Available models:`, data.data.map((inv: any) => ({
            model_number: inv.model_number,
            normalized: normalizeForMatching(inv.model_number || '')
          })));

          matchedInverter = data.data.find((inv: any) => {
            const normalizedDbModel = normalizeForMatching(inv.model_number || '');
            const normalizedDbMakeModel = normalizeForMatching(inv.make_model || '');

            return normalizedDbModel === normalizedSearchModel ||
                   normalizedDbMakeModel === normalizedSearchModel;
          });

          if (matchedInverter) {
            console.log(`[POI] Found normalized match: ${matchedInverter.model_number || matchedInverter.make_model}`);
          }
        }

        // If still no match, try partial match (for cases like "PowerWall 3 (11.5 kW)" vs "PowerWall 3 (11.5kW)")
        if (!matchedInverter) {
          matchedInverter = data.data.find((inv: any) => {
            const normalizedDbModel = normalizeForMatching(inv.model_number || '');
            const normalizedDbMakeModel = normalizeForMatching(inv.make_model || '');

            return normalizedSearchModel.includes(normalizedDbModel) ||
                   normalizedDbModel.includes(normalizedSearchModel) ||
                   normalizedSearchModel.includes(normalizedDbMakeModel) ||
                   normalizedDbMakeModel.includes(normalizedSearchModel);
          });

          if (matchedInverter) {
            console.log(`[POI] Found partial match: ${matchedInverter.model_number || matchedInverter.make_model}`);
          }
        }

        if (matchedInverter && !matchedInverter.id) {
          // Found by exact match
          console.log(`[POI] Found exact match: ${matchedInverter.model_number || matchedInverter.make_model}`);
        }

        if (matchedInverter?.id) {
          // Fetch full details
          const detailURL = `https://api.skyfireapp.io/api/inverters/${matchedInverter.id}`;
          const detailResponse = await fetch(detailURL);
          const detailData = await detailResponse.json();

          if (detailData?.success && detailData.data) {
            const amps = parseFloat(detailData.data.max_cont_output_amps) || 0;
            console.log(`[POI] Inverter max_cont_output_amps from API: ${amps}`);

            // If microinverter, multiply by quantity. If inverter, use as-is
            let finalAmps = amps;
            if (systemSelection === "microinverter" && microInverterQty > 0) {
              finalAmps = amps * microInverterQty;
              console.log(
                `[POI] System ${sysNum} is microinverter: ${amps} Amps × ${microInverterQty} = ${finalAmps} Amps`
              );
            } else {
              console.log(
                `[POI] System ${sysNum} is inverter: ${amps} Amps (no multiplication)`
              );
            }

            return finalAmps;
          } else {
            console.log(`[POI] Failed to fetch inverter details or no max_cont_output_amps data`);
          }
        } else {
          console.log(`[POI] No matching inverter found in API for: ${inverterModel}`);
        }
      } else {
        console.log(`[POI] API response invalid or no data array`);
      }
      return 0;
    };

    const loadMaxOutput = async () => {
      console.log(`[POI] loadMaxOutput called: projectId=${projectId}, systemNumber=${systemNumber}`);

      if (!projectId || !systemNumber) {
        console.log(`[POI] Missing projectId or systemNumber - aborting`);
        return;
      }

      setLoadingMaxOutput(true);
      try {
        const systemData = await fetchSystemDetails(projectId);
        console.log(`[POI] fetchSystemDetails returned:`, systemData ? `${Object.keys(systemData).length} keys` : 'null');
        if (!systemData) return;

        if (isCombinedSystem) {
          // Check if combining with PowerWall 3
          const isPowerWall3Combine = combineMethod && (
            combineMethod.includes("PowerWall 3") ||
            combineMethod.includes("Powerwall 3") ||
            combineMethod.includes("PowerWall+") ||
            combineMethod.includes("Powerwall+")
          );

          if (isPowerWall3Combine) {
            // For PowerWall 3: Only use the PowerWall 3's max output (48 Amps typically)
            // Determine which system has the PowerWall 3
            const sys1InverterModel = systemData?.sys1_micro_inverter_model || "";
            const sys2InverterModel = systemData?.sys2_micro_inverter_model || "";

            const sys1HasPW3 = sys1InverterModel.includes("PowerWall 3") ||
                               sys1InverterModel.includes("Powerwall 3") ||
                               sys1InverterModel.includes("PowerWall+") ||
                               sys1InverterModel.includes("Powerwall+");
            const sys2HasPW3 = sys2InverterModel.includes("PowerWall 3") ||
                               sys2InverterModel.includes("Powerwall 3") ||
                               sys2InverterModel.includes("PowerWall+") ||
                               sys2InverterModel.includes("Powerwall+");

            let powerWall3Output = 0;
            if (sys1HasPW3) {
              powerWall3Output = await loadMaxOutputForSystem(1, systemData);
              console.log(
                `[POI] PowerWall 3 detected in System 1. Using only PW3 output: ${powerWall3Output} Amps (NOT adding System 2)`
              );
            } else if (sys2HasPW3) {
              powerWall3Output = await loadMaxOutputForSystem(2, systemData);
              console.log(
                `[POI] PowerWall 3 detected in System 2. Using only PW3 output: ${powerWall3Output} Amps (NOT adding System 1)`
              );
            }

            setMaxContinuousOutputAmps(
              powerWall3Output > 0 ? Math.round(powerWall3Output) : null
            );
          } else {
            // Regular combine: Add both systems together
            const [sys1Output, sys2Output] = await Promise.all([
              loadMaxOutputForSystem(1, systemData),
              loadMaxOutputForSystem(2, systemData),
            ]);

            const combinedOutput = sys1Output + sys2Output;
            console.log(
              `[POI] Combined output: System 1 (${sys1Output} Amps) + System 2 (${sys2Output} Amps) = ${combinedOutput} Amps`
            );

            setMaxContinuousOutputAmps(
              combinedOutput > 0 ? Math.round(combinedOutput) : null
            );
          }
        } else {
          // Single system
          const output = await loadMaxOutputForSystem(systemNumber, systemData);
          setMaxContinuousOutputAmps(output > 0 ? Math.round(output) : null);
        }
      } catch (error) {
        console.error(
          `[POI] Error loading max output for System ${systemNumber}:`,
          error
        );
      } finally {
        setLoadingMaxOutput(false);
      }
    };

    loadMaxOutput();
  }, [projectId, systemNumber, isCombinedSystem, combineMethod]);

  // Set allowable backfeed based on POI location (from props)
  useEffect(() => {
    console.log(
      `[POI] ${isCombinedSystem ? 'COMBINED' : `System ${systemNumber}`} - Setting Allowable Backfeed:`,
      {
        poiLocation,
        mpaAllowableBackfeed,
        spbAllowableBackfeed,
      }
    );

    if (!poiLocation) {
      setAllowableBackfeed(null);
      console.log(`[POI] No POI location selected - allowableBackfeed set to null`);
      return;
    }

    // Check which panel is selected and use the corresponding backfeed value
    if (poiLocation.includes("Main Panel (A)")) {
      setAllowableBackfeed(mpaAllowableBackfeed ?? null);
      console.log(
        `[POI] Main Panel A Allowable Backfeed: ${mpaAllowableBackfeed} Amps`
      );
    } else if (poiLocation.includes("Sub Panel (B)")) {
      setAllowableBackfeed(spbAllowableBackfeed ?? null);
      console.log(
        `[POI] Sub Panel B Allowable Backfeed: ${spbAllowableBackfeed} Amps`
      );
    } else {
      setAllowableBackfeed(null);
      console.log(`[POI] POI location "${poiLocation}" does not match Main Panel (A) or Sub Panel (B) - allowableBackfeed set to null`);
    }
  }, [poiLocation, mpaAllowableBackfeed, spbAllowableBackfeed, isCombinedSystem, systemNumber]);

  // Auto-select PCS amps when power control is activated
  // Show PCS controls when:
  // 1. System has a battery (hasBattery = true)
  // 2. Max continuous output exceeds allowable backfeed OR manually activated
  const autoTriggerPcs =
    systemNumber &&
    hasBattery &&
    maxContinuousOutputAmps !== null &&
    allowableBackfeed !== null &&
    maxContinuousOutputAmps > allowableBackfeed;

  // DEBUG: Log PCS auto-trigger decision
  console.log(
    `[POI] PCS Auto-Trigger Check - ${isCombinedSystem ? 'COMBINED' : `System ${systemNumber}`}:`,
    {
      systemNumber,
      isCombinedSystem,
      hasBattery,
      maxContinuousOutputAmps,
      allowableBackfeed,
      exceedsBackfeed: maxContinuousOutputAmps !== null && allowableBackfeed !== null ? maxContinuousOutputAmps > allowableBackfeed : 'N/A',
      autoTriggerPcs,
      manualPcsActivated,
    }
  );

  const showPowerControl = autoTriggerPcs || manualPcsActivated;

  // Show manual trigger button when system has battery but PCS not auto-triggered
  const showManualTrigger =
    systemNumber &&
    hasBattery &&
    !autoTriggerPcs &&
    !manualPcsActivated &&
    allowableBackfeed !== null;

  // Clear PCS data when power control is deactivated (conditions no longer met)
  useEffect(() => {
    if (!showPowerControl && pcsAmps && onPcsAmpsChange) {
      console.log(`[POI] Power Control no longer active - clearing PCS Amps (was: ${pcsAmps})`);
      onPcsAmpsChange("");
    }
  }, [showPowerControl, pcsAmps, onPcsAmpsChange]);

  useEffect(() => {
    if (showPowerControl && allowableBackfeed !== null && onPcsAmpsChange) {
      // Auto-select allowable backfeed if not already set or if current value exceeds allowable
      const currentPcsAmps = pcsAmps ? parseInt(pcsAmps) : 0;

      if (currentPcsAmps === 0 || currentPcsAmps > allowableBackfeed) {
        const newValue = String(allowableBackfeed);
        console.log(`[POI] Auto-selecting PCS Amps: ${newValue} (current: ${pcsAmps}, allowable: ${allowableBackfeed})`);
        onPcsAmpsChange(newValue);
      }
    }
  }, [showPowerControl, allowableBackfeed, pcsAmps, onPcsAmpsChange]);

  // reset edit modes whenever POI type changes
  useEffect(() => {
    setEditRating(false);
    setEditDisconnect(false);
  }, [poiType]);

  // Auto-clear PV Breaker selection when 120% rule is violated
  // This handles the chicken-and-egg scenario where user selects PV Breaker before selecting POI Location.
  // When they select Main Panel A and it violates 120% rule, we auto-clear the PV Breaker selection
  // and force them to choose a different POI Type. If they derate the main breaker and it becomes
  // compliant, PV Breaker will become available again in the dropdown.
  useEffect(() => {
    if (poiType === "PV Breaker (OCPD)") {
      const maxOutput = maxContinuousOutputAmps !== null ? maxContinuousOutputAmps * 1.25 : null;
      const violates120Rule =
        !hasBattery &&
        maxContinuousOutputAmps !== null &&
        allowableBackfeed !== null &&
        maxOutput !== null &&
        maxOutput > allowableBackfeed;

      if (violates120Rule) {
        console.log('[POI] 120% Rule Violation - Auto-clearing PV Breaker selection:', {
          systemNumber,
          maxOutput,
          allowableBackfeed,
          hasBattery,
        });
        onPoiTypeChange(""); // Clear PV Breaker selection
      }
    }
  }, [poiType, maxContinuousOutputAmps, allowableBackfeed, hasBattery, onPoiTypeChange, systemNumber]);

  // Handle camera button press
  const handleCameraPress = () => {
    if (!photoCapture.hasProjectContext) {
      console.warn("Missing project context for photo capture");
      return;
    }

    photoCapture.openForSection({
      section: sectionLabel,
      tagOptions: DEFAULT_ELECTRICAL_PHOTO_TAGS,
      initialNote: panelNote,
      onNotesSaved: (note) => {
        setPanelNote(note);
        console.log(`Notes saved for ${sectionLabel}:`, note);
      },
      onPhotoAdded: () => {
        console.log(`Photo added to ${sectionLabel}`);
      },
    });
  };

  // clear‐all handler
  function clearAll() {
    onPoiTypeChange("");
    onBreakerRatingChange("");
    onDisconnectRatingChange("");
    onPoiLocationChange("");
    setEditRating(false);
    setEditDisconnect(false);
  }

  // build mutable copy of location options
  const locationOptions = (POI_LOCATION_MAP[poiType] || []).slice();

  const isDirty =
    !!poiType || !!breakerRating || !!disconnectRating || !!poiLocation;
  const isComplete = !!poiType && !!poiLocation;

  // dynamic title: single-line when collapsed, two-line when expanded
  const titleText = expanded
    ? sectionLabel.replace(" - ", "\n") // Replace " - " with newline when expanded
    : sectionLabel;

  return (
    <>
      <CollapsibleSectionNoToggle
        title={titleText}
        initiallyExpanded={false}
        expanded={expanded}
        onToggle={() => setExpanded((e) => !e)}
        isDirty={isDirty}
        isRequiredComplete={isComplete}
        onTrashPress={() => setShowClearModal(true)}
        photoCount={photoCount}
        onCameraPress={handleCameraPress}
      >
        {/* clear‐all confirmation */}
        <ConfirmClearModal
          visible={showClearModal}
          sectionTitle="Point of Interconnection"
          onConfirm={() => {
            clearAll();
            setShowClearModal(false);
          }}
          onCancel={() => setShowClearModal(false)}
        />

        <View style={styles.container}>
          {/* Equipment Labels - only show when there are multiple systems (not for single system or combined) */}
          {systemNumber && !isCombinedSystem && totalActiveSystems > 1 && (solarPanelMake || inverterMake) && (
            <View style={styles.equipmentLabelsContainer}>
              {solarPanelMake && solarPanelModel && (
                <Text style={styles.equipmentLabel}>
                  Panel: {solarPanelMake} {solarPanelModel}
                </Text>
              )}
              {inverterMake && inverterModel && (
                <Text style={styles.equipmentLabel}>
                  {systemType === "microinverter" ? "Micro" : "Inverter"}: {inverterMake} {inverterModel}
                </Text>
              )}
            </View>
          )}

          {/* Max Continuous Output - only show for specific systems */}
          {systemNumber && maxContinuousOutputAmps !== null && (
            <View style={styles.maxOutputContainer}>
              <Text style={styles.maxOutputLabel}>Max Continuous Output (125%)</Text>
              <Text style={styles.maxOutputValue}>
                {(maxContinuousOutputAmps * 1.25).toFixed(1)} Amps
              </Text>
              {/* Show 120% rule violation warning when Max Output > Allowable Backfeed */}
              {allowableBackfeed !== null && (maxContinuousOutputAmps * 1.25) > allowableBackfeed && !hasBattery && (
                <Text style={styles.violationWarning}>
                  PV Breaker violates the 120% rule, derate the main breaker to activate PV Breaker as an option.
                </Text>
              )}
            </View>
          )}

          {/* 1) POI Type */}
          <Dropdown
            label="POI Type"
            data={(() => {
              // Filter out "PV Breaker (OCPD)" when 120% rule is violated on non-storage projects
              const maxOutput = maxContinuousOutputAmps !== null ? maxContinuousOutputAmps * 1.25 : null;
              const violates120Rule =
                !hasBattery &&
                maxContinuousOutputAmps !== null &&
                allowableBackfeed !== null &&
                maxOutput > allowableBackfeed;

              console.log('[POI] 120% Rule Check:', {
                systemNumber,
                hasBattery,
                maxContinuousOutputAmps,
                maxOutput,
                allowableBackfeed,
                violates120Rule,
                willFilter: violates120Rule ? 'YES - filtering out PV Breaker' : 'NO - keeping all options'
              });

              if (violates120Rule) {
                return POI_TYPE_OPTIONS.filter(opt => opt.value !== "PV Breaker (OCPD)");
              }

              return [...POI_TYPE_OPTIONS];
            })()}
            value={poiType}
            onChange={onPoiTypeChange}
            widthPercent={100}
            errorText={errors.poiType}
          />

          {/* 2a) PV Breaker note / edit */}
          {poiType === "PV Breaker (OCPD)" && !editRating && (
            <View style={styles.noteRow}>
              <View style={styles.noteTextWrap}>
                <Text style={styles.noteLabel}>Breaker Rating (Amps)</Text>
                <Text style={styles.noteText}>
                  Breaker will be sized to protect the max continuous output of
                  the system × 125% unless PCS settings are enacted.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditRating(true)}>
                <Image source={pencilIcon} style={styles.pencil} />
              </TouchableOpacity>
            </View>
          )}
          {poiType === "PV Breaker (OCPD)" && editRating && (
            <View style={styles.noteRow}>
              <View style={styles.noteTextWrap}>
                <Text style={styles.noteLabel}>Breaker Rating (Amps)</Text>
                <View style={styles.fieldRow}>
                  <Dropdown
                    label=""
                    data={filteredBreakerRatingOptions}
                    value={breakerRating}
                    onChange={onBreakerRatingChange}
                    widthPercent={40}
                    errorText={errors.breakerRating}
                  />
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  onBreakerRatingChange(""); // Clear the field in DB
                  setEditRating(false); // Hide dropdown and show note again
                }}
              >
                <Image source={xIcon} style={styles.xIcon} />
              </TouchableOpacity>
            </View>
          )}

          {/* 2b) Fused AC Disconnect note / edit */}
          {[
            "Line (Supply) Side Tap",
            "Load Side Tap",
            "Meter Collar Adapter",
          ].includes(poiType) &&
            !editDisconnect && (
              <View style={styles.noteRow}>
                <View style={styles.noteTextWrap}>
                  <Text style={styles.noteLabel}>Fused AC Disconnect</Text>
                  <Text style={styles.noteText}>
                    Fused AC disconnect and fuses will be sized to protect the
                    max continuous output of the system × 125% unless PCS
                    settings are enacted.
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setEditDisconnect(true)}>
                  <Image source={pencilIcon} style={styles.pencil} />
                </TouchableOpacity>
              </View>
            )}
          {[
            "Line (Supply) Side Tap",
            "Load Side Tap",
            "Meter Collar Adapter",
          ].includes(poiType) &&
            editDisconnect && (
              <View style={styles.noteRow}>
                <View style={styles.noteTextWrap}>
                  <Text style={styles.noteLabel}>Fused AC Disconnect</Text>
                  <View style={styles.fieldRow}>
                    <Dropdown
                      label=""
                      data={[{ label: "###", value: "" }, ...FUSE_OPTIONS]}
                      value={disconnectRating}
                      onChange={onDisconnectRatingChange}
                      widthPercent={160}
                      errorText={errors.disconnectRating}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    onDisconnectRatingChange(""); // Clear the field in DB
                    setEditDisconnect(false); // Hide dropdown and show note again
                  }}
                >
                  <Image source={xIcon} style={styles.xIcon} />
                </TouchableOpacity>
              </View>
            )}

          {/* 3) POI Location */}
          <View style={[styles.fieldRow, styles.poiLocationContainer]}>
            <Dropdown
              label="POI Location"
              data={locationOptions}
              value={poiLocation}
              onChange={onPoiLocationChange}
              widthPercent={100}
              errorText={errors.poiLocation}
            />
          </View>

          {/* Manual PCS Trigger Button - show when battery exists but not auto-triggered */}
          {showManualTrigger && (
            <Button
              title="Activate PCS"
              selected={false}
              onPress={() => setManualPcsActivated(true)}
              width="100%"
              height={45}
              style={{ marginTop: 12, marginBottom: 20 }}
            />
          )}

          {/* PCS Amps Dropdown - show when power control is activated */}
          {showPowerControl &&
            (() => {
              // Filter PCS options to only show values up to allowable backfeed
              const filteredPcsOptions = PCS_AMPS_OPTIONS.filter(
                (option) => parseInt(option.value) <= (allowableBackfeed ?? 0)
              );

              console.log(
                `[POI] Power Control Check - System ${systemNumber}: MaxOutput=${maxContinuousOutputAmps}, Backfeed=${allowableBackfeed}, Show=${showPowerControl}`
              );

              return (
                <View style={styles.pcsAmpsContainer}>
                  {/* Power Control System Warning */}
                  <Text style={styles.powerControlWarning}>
                    Power Control System Activated
                  </Text>

                  <Dropdown
                    label="PCS Setting (Amps)"
                    data={filteredPcsOptions}
                    value={pcsAmps}
                    onChange={(v) => onPcsAmpsChange?.(v)}
                    widthPercent={50}
                  />
                  <Text style={styles.pcsNote}>
                    PCS Settings only throttle the current (amps), if you want
                    to change the SMS breaker rating, see SMS Section.
                  </Text>

                  {/* Deactivate button when manually activated */}
                  {manualPcsActivated && (
                    <Button
                      title="Deactivate Power Control System"
                      selected={true}
                      onPress={() => {
                        console.log(`[POI] User deactivating PCS - clearing PCS Amps (was: ${pcsAmps})`);
                        setManualPcsActivated(false);
                        // Clear PCS amps from database when manually deactivated
                        if (onPcsAmpsChange) {
                          onPcsAmpsChange("");
                        }
                      }}
                      width="100%"
                      height={45}
                      style={{ marginTop: 12, marginBottom: 20 }}
                    />
                  )}
                </View>
              );
            })()}
        </View>
      </CollapsibleSectionNoToggle>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 0,
    gap: 0,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  poiLocationContainer: {
    marginTop: 16,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  noteTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  noteLabel: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  noteText: {
    color: "#FFF",
    fontSize: 18,
    opacity: 0.85,
  },
  pencil: {
    width: 24,
    height: 24,
    tintColor: "#FFF",
    marginTop: 4,
  },
  xIcon: {
    width: 22,
    height: 22,
    resizeMode: "contain",
    marginTop: 4,
  },
  equipmentLabelsContainer: {
    marginBottom: 16,
    marginTop: 0,
  },
  equipmentLabel: {
    color: "#FFB02E",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  maxOutputContainer: {
    marginVertical: 0,
    marginTop: 0,
    marginBottom: 12,
  },
  maxOutputLabel: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  maxOutputValue: {
    color: "#FD7332",
    fontSize: 20,
    fontWeight: "400",
    marginBottom: 8,
  },
  violationWarning: {
    color: "#FD7332",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    lineHeight: 22,
  },
  powerControlWarning: {
    color: "#FD7332",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "left",
    marginVertical: 0,
    marginBottom: 12,
    marginTop: 0,
  },
  pcsAmpsContainer: {
    marginTop: 0,
  },
  pcsNote: {
    color: "#FFF",
    fontSize: 14,
    opacity: 0.7,
    marginTop: 0,
    marginBottom: 10,
    lineHeight: 18,
  },
  powerControlWarningTop: {
    color: "#FD7332",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 0,
    marginBottom: 10,
    marginTop: 0,
  },
});
