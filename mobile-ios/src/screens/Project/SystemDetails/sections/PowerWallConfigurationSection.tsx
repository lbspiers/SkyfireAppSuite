// src/screens/Project/SystemDetails/sections/PowerWallConfigurationSection.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { moderateScale, verticalScale } from "../../../../utils/responsive";
import { ORANGE_TB, BLUE_2C_BT } from "../../../../styles/gradient";
import { TESLA_POWERWALL_GATEWAYS } from "../../../../utils/constants";
import Button from "../../../../components/Button";
import CollapsibleSection from "../../../../components/UI/CollapsibleSection";
import { useProjectContext } from "../../../../hooks/useProjectContext";
import { usePhotoCapture } from "../../../../hooks/usePhotoCapture";
import { DEFAULT_INVERTER_PHOTO_TAGS } from "../../../../utils/constants";

interface PowerWallConfigurationSectionProps {
  make: string;
  model: string;
  values: {
    expansionPacks: number;
    gateway: string;
    backupSwitchLocation?: string;
    backupOption?: "" | "Whole Home" | "Partial Home" | "No Backup";
    batteryExisting?: boolean;
  };
  onChange: (field: string, value: any) => void;
  /** Whether to show this section (only for Tesla PowerWall models) */
  visible: boolean;
  /** System label for the title (e.g., "System 1", "System 2") */
  systemLabel?: string;
}

export default function PowerWallConfigurationSection({
  make,
  model,
  values,
  onChange,
  visible,
  systemLabel = "",
}: PowerWallConfigurationSectionProps) {
  // Photo capture integration
  const { projectId } = useProjectContext();
  const photoCapture = usePhotoCapture();

  const [sectionNote, setSectionNote] = useState<string>("");
  const [photoCount, setPhotoCount] = useState<number>(0);

  // Backup Switch Location options
  const backupSwitchLocationOptions = [
    { label: "Behind Utility Meter", value: "behind_utility_meter" },
    { label: "Stand Alone Meter Panel", value: "stand_alone_meter_panel" },
  ];

  // Backup Options (same as Energy Storage Section)
  const backupOptions = [
    { label: "Whole Home", value: "Whole Home" as const },
    { label: "Partial Home", value: "Partial Home" as const },
    { label: "No Backup", value: "No Backup" as const },
  ];

  const handleBackupSwitchLocationSelect = (location: string) => {
    // Allow toggling: if already selected, deselect (set to empty string)
    if (values.backupSwitchLocation === location) {
      onChange("backupSwitchLocation", "");
    } else {
      onChange("backupSwitchLocation", location);
    }
  };

  const handleBackupOptionSelect = (option: "Whole Home" | "Partial Home" | "No Backup") => {
    // Allow toggling: if already selected, deselect (set to empty string)
    if (values.backupOption === option) {
      onChange("backupOption", "");
    } else {
      onChange("backupOption", option);
    }
  };

  const expansionPackOptions = [0, 1, 2, 3];


  // Section name for photos - extract just the number
  const photoSystemNum = systemLabel ? systemLabel.replace(/[^\d]/g, '') : '';
  const photoSectionName = photoSystemNum ? `PowerWall Configuration ${photoSystemNum}` : "PowerWall Configuration";

  // Load photo count for this section
  useEffect(() => {
    if (projectId && visible) {
      photoCapture.getPhotoCount(photoSectionName).then(setPhotoCount);
    }
  }, [projectId, visible, photoCapture.refreshTrigger, photoSectionName]);

  const handleExpansionPackSelect = (option: number) => {
    // Allow toggling: if already selected, deselect (set to 0)
    if (values.expansionPacks === option) {
      onChange("expansionPacks", 0);
    } else {
      onChange("expansionPacks", option);
    }
  };

  const handleGatewaySelect = (gateway: string) => {
    // Allow toggling: if already selected, deselect (set to empty string)
    if (values.gateway === gateway) {
      onChange("gateway", "");
    } else {
      onChange("gateway", gateway);
    }
  };

  const renderExpansionPackButton = (option: number) => {
    const isSelected = values.expansionPacks === option;
    const gradient = isSelected ? ORANGE_TB : BLUE_2C_BT;

    // Match NewExistingToggle text colors
    const textColor = isSelected ? "#FFFFFF" : "#bbbbbb";

    // Create circular border container for unselected state
    const borderContainerStyle = [
      styles.borderContainer,
      !isSelected && {
        borderWidth: moderateScale(2),
        borderColor: "#888888",
      },
    ];

    return (
      <TouchableOpacity
        key={option}
        activeOpacity={0.8}
        onPress={() => handleExpansionPackSelect(option)}
        style={styles.buttonContainer}
      >
        <View style={borderContainerStyle}>
          <LinearGradient
            colors={gradient.colors}
            start={gradient.start}
            end={gradient.end}
            style={styles.buttonCircle}
          >
            <Text style={[styles.buttonLabel, { color: textColor }]}>
              {option}
            </Text>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    );
  };

  // Handle camera button press
  const handleCameraPress = () => {
    if (!photoCapture.hasProjectContext) {
      return;
    }

    photoCapture.openForSection({
      section: photoSectionName,
      tagOptions: DEFAULT_INVERTER_PHOTO_TAGS,
      initialNote: sectionNote,
      onNotesSaved: (note) => {
        setSectionNote(note);
      },
      onPhotoAdded: () => {},
    });
  };

  // Validation for completion status
  const hasText = (v: any) => String(v || "").trim().length > 0;
  const isDirty = values.expansionPacks !== 0 || hasText(values.gateway) || hasText(values.backupSwitchLocation) || hasText(values.backupOption);
  const isRequiredComplete = true; // PowerWall section is always considered complete if visible

  // Check if Backup Switch is selected
  const isBackupSwitchSelected = values.gateway === "backup_switch";

  // Don't render if not visible
  if (!visible) {
    return null;
  }

  // Extract just the number from systemLabel (e.g., "System 1" -> "1")
  const systemNum = systemLabel ? systemLabel.replace(/[^\d]/g, '') : '';
  const sectionTitle = "PowerWall Configuration";

  return (
    <CollapsibleSection
      title={sectionTitle}
      systemNumber={systemNum || undefined}
      initiallyExpanded={false}
      isDirty={isDirty}
      isRequiredComplete={isRequiredComplete}
      photoCount={photoCount}
      onCameraPress={handleCameraPress}
    >
      <View style={styles.container}>
        {/* Backup Option Section - First */}
        <View style={styles.backupOptionContainer}>
          <Text style={styles.backupOptionLabel}>Choose Backup Option</Text>
          <View style={styles.backupOptionButtonContainer}>
            {backupOptions.map((option, idx) => {
              const buttonStyle = [
                styles.backupOptionButton,
                idx > 0 && { marginLeft: moderateScale(14) }, // Gap between buttons
              ];
              return (
                <Button
                  key={option.value}
                  title={option.label}
                  selected={values.backupOption === option.value}
                  onPress={() => handleBackupOptionSelect(option.value)}
                  style={buttonStyle}
                  textStyle={{ fontSize: moderateScale(16) }}
                  height={verticalScale(45)}
                />
              );
            })}
          </View>

          {/* Conditional text when "No Backup" is selected */}
          {values.backupOption === "No Backup" && (
            <View style={styles.noBackupTextContainer}>
              <Text style={styles.noBackupText}>Note: Adding Tesla Remote Energy Meter</Text>
            </View>
          )}
        </View>

        {/* Expansion Packs Section - Second */}
        <Text style={styles.label}>Add Battery Expansion Packs?</Text>
        <View style={styles.expansionPacksContainer}>
          {/* Custom Compact New/Existing Toggle - Takes 2 columns (18% each) */}
          <View style={styles.compactToggleContainer}>
            <TouchableOpacity
              onPress={() => onChange("batteryExisting", false)}
              style={[
                styles.compactToggleButton,
                !(values.batteryExisting || false) && styles.compactToggleButtonActive
              ]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={!(values.batteryExisting || false) ? ORANGE_TB.colors : BLUE_2C_BT.colors}
                start={!(values.batteryExisting || false) ? ORANGE_TB.start : BLUE_2C_BT.start}
                end={!(values.batteryExisting || false) ? ORANGE_TB.end : BLUE_2C_BT.end}
                style={styles.compactToggleGradient}
              >
                <Text style={[
                  styles.compactToggleText,
                  { color: !(values.batteryExisting || false) ? "#FFFFFF" : "#bbbbbb" }
                ]}>
                  New
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onChange("batteryExisting", true)}
              style={[
                styles.compactToggleButton,
                (values.batteryExisting || false) && styles.compactToggleButtonActive
              ]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={(values.batteryExisting || false) ? ORANGE_TB.colors : BLUE_2C_BT.colors}
                start={(values.batteryExisting || false) ? ORANGE_TB.start : BLUE_2C_BT.start}
                end={(values.batteryExisting || false) ? ORANGE_TB.end : BLUE_2C_BT.end}
                style={styles.compactToggleGradient}
              >
                <Text style={[
                  styles.compactToggleText,
                  { color: (values.batteryExisting || false) ? "#FFFFFF" : "#bbbbbb" }
                ]}>
                  Existing
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Expansion Pack Buttons - 4 columns with tight spacing */}
          <View style={styles.compactRadioButtonContainer}>
            {expansionPackOptions.map(renderExpansionPackButton)}
          </View>
        </View>

        {/* Gateway buttons - show when Whole Home or Partial Home is selected */}
        {(values.backupOption === "Whole Home" || values.backupOption === "Partial Home") && (
          <View style={styles.gatewayContainer}>
            <Text style={styles.gatewayLabel}>Select*</Text>
            <View style={styles.gatewayButtonContainer}>
              {TESLA_POWERWALL_GATEWAYS.map((gateway) => (
                <Button
                  key={gateway.value}
                  title={gateway.label}
                  selected={values.gateway === gateway.value}
                  onPress={() => handleGatewaySelect(gateway.value)}
                  width="100%"
                  height={verticalScale(40)}
                  style={styles.gatewayButton}
                />
              ))}
            </View>

            {/* Backup Switch Location Buttons - only show when Backup Switch is selected */}
            {isBackupSwitchSelected && (
              <View style={styles.backupSwitchContainer}>
                <Text style={styles.backupSwitchLabel}>Backup Switch Location</Text>
                <View style={styles.backupSwitchButtonContainer}>
                  {backupSwitchLocationOptions.map((location) => (
                    <Button
                      key={location.value}
                      title={location.label}
                      selected={values.backupSwitchLocation === location.value}
                      onPress={() => handleBackupSwitchLocationSelect(location.value)}
                      width="100%"
                      height={verticalScale(40)}
                      style={styles.backupSwitchButton}
                    />
                  ))}
                </View>

                {/* Tesla Installation Manual Note */}
                <View style={styles.teslaNote}>
                  <Text style={styles.teslaNoteText}>
                    Please consult Tesla Installation Manual for guidance!
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </CollapsibleSection>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    width: "100%",
    alignItems: "stretch",
    marginBottom: verticalScale(10), // Match spacing from InverterSection noteText
  },
  label: {
    color: "#FFFFFF",
    fontSize: moderateScale(20),
    fontWeight: "700",
    marginBottom: verticalScale(10),
  },
  // Container for 6-column responsive layout
  expansionPacksContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: moderateScale(6), // Responsive gap that scales down on smaller screens
    paddingHorizontal: moderateScale(2), // Small padding to prevent edge cutoff
  },
  // Custom compact toggle container - responsive width
  compactToggleContainer: {
    flexDirection: "row",
    minWidth: moderateScale(120), // Minimum width to prevent text wrap
    maxWidth: "40%", // Max width to leave space for expansion buttons
    flex: 0.4, // Takes ~40% but can shrink if needed
    gap: moderateScale(3), // Tighter gap on smaller screens
  },
  compactToggleButton: {
    flex: 1,
    height: moderateScale(40), // Match expansion pack button height exactly
    minWidth: moderateScale(55), // Minimum width to prevent "Existing" text wrap
    borderRadius: moderateScale(4),
    overflow: "hidden",
    borderWidth: moderateScale(2), // Match expansion pack button border width
    borderColor: "#888888",
  },
  compactToggleButtonActive: {
    borderColor: "#FD7332",
  },
  compactToggleGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: moderateScale(2),
    paddingHorizontal: moderateScale(2), // Padding to prevent text cutoff
  },
  compactToggleText: {
    fontSize: moderateScale(14), // Increased from 12 to 14 for better readability
    fontWeight: "700",
    textAlign: "center",
  },
  // Expansion pack buttons container - responsive spacing
  compactRadioButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly", // Even distribution instead of space-between
    alignItems: "center",
    flex: 1, // Take remaining space
    minWidth: moderateScale(160), // Minimum width for 4 buttons (40px each)
    gap: moderateScale(8), // Responsive gap that scales with screen size
  },
  buttonContainer: {
    alignItems: "center",
  },
  borderContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonLabel: {
    fontSize: moderateScale(22),
    fontWeight: "700",
    textAlign: "center",
    // Color is now controlled dynamically in renderExpansionPackButton
  },
  buttonCircle: {
    width: "100%",
    height: "100%",
    borderRadius: moderateScale(20),
    justifyContent: "center",
    alignItems: "center",
  },
  gatewayContainer: {
    marginTop: verticalScale(20),
  },
  gatewayLabel: {
    color: "#FFFFFF",
    fontSize: moderateScale(20),
    fontWeight: "700",
    marginBottom: verticalScale(10),
  },
  gatewayButtonContainer: {
    flexDirection: "column",
    alignItems: "center",
    gap: moderateScale(8),
  },
  gatewayButton: {
    // Button component will handle width/height
  },
  backupSwitchContainer: {
    marginTop: verticalScale(15),
  },
  backupSwitchLabel: {
    color: "#FFFFFF",
    fontSize: moderateScale(20),
    fontWeight: "700",
    marginBottom: verticalScale(10),
  },
  backupSwitchButtonContainer: {
    flexDirection: "column",
    alignItems: "center",
    gap: moderateScale(8),
    marginBottom: verticalScale(10),
  },
  backupSwitchButton: {
    // Button component will handle width/height
  },
  teslaNote: {
    backgroundColor: "#FFF3CD", // Light yellow background
    borderColor: "#FFC107", // Yellow border
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(4),
    padding: moderateScale(10),
    marginTop: verticalScale(10),
  },
  teslaNoteText: {
    color: "#856404", // Dark yellow/brown text for good contrast
    fontSize: moderateScale(16),
    fontWeight: "600",
    textAlign: "center",
  },
  // Backup Option Section Styles
  backupOptionContainer: {
    marginTop: 0, // No top margin since it's first
  },
  backupOptionLabel: {
    color: "#FFFFFF",
    fontSize: moderateScale(20),
    fontWeight: "700",
    marginBottom: verticalScale(10),
  },
  backupOptionButtonContainer: {
    flexDirection: "row",
    marginTop: verticalScale(10),
    marginBottom: verticalScale(20),
  },
  backupOptionButton: {
    flex: 1, // Share width equally for responsive design
  },
  // Conditional text styles
  noBackupTextContainer: {
    marginBottom: verticalScale(10),
  },
  noBackupText: {
    color: "#FD7332", // Orange text to match theme
    fontSize: moderateScale(16),
    fontWeight: "600",
    textAlign: "center",
  },
});
