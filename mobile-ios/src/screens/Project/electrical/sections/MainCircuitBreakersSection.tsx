// src/screens/Project/electrical/sections/MainCircuitBreakersSection.tsx

import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Animated } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import CollapsibleSection from "../../../../components/UI/CollapsibleSection";
import Dropdown from "../../../../components/Dropdown";
import Button from "../../../../components/Button";
import { usePhotoCapture } from "../../../../context/PhotoCaptureContext";
import { SERVICE_TYPE_OPTIONS, DEFAULT_ELECTRICAL_PHOTO_TAGS, UTILITY_SERVICE_AMPS_OPTIONS } from "../../../../utils/constants";
import { ORANGE_TB, BLUE_2C_BT } from "../../../../styles/gradient";
import { moderateScale, widthPercentageToDP as wp } from "../../../../utils/responsive";

const CHOICES = [0, 1, 2, 3] as const;

// Utility service amperage options
const UTILITY_AMPS_OPTIONS = [
  { label: "100-200", value: "200" },
  { label: "300-325", value: "300" },
  { label: "400", value: "400" },
  { label: "600", value: "600" },
] as const;

export interface MainCircuitBreakersSectionProps {
  count: number | null;
  onCountChange: (n: number) => void;

  serviceType: string;
  onServiceTypeChange: (s: string) => void;

  utilityServiceAmps: string;
  onUtilityServiceAmpsChange: (s: string) => void;

  errors?: {
    count?: string;
    serviceType?: string;
    utilityServiceAmps?: string;
  };
  projectId?: string;
  companyId?: string;
  onOpenGallery?: (sectionLabel: string) => void;
}

export default function MainCircuitBreakersSection({
  count,
  onCountChange,
  serviceType,
  onServiceTypeChange,
  utilityServiceAmps,
  onUtilityServiceAmpsChange,
  errors = {},
  projectId = "",
  companyId = "",
  onOpenGallery,
}: MainCircuitBreakersSectionProps) {
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [panelNote, setPanelNote] = useState<string>("");
  const [exampleExpanded, setExampleExpanded] = useState<boolean>(false);

  const sectionLabel = "Electrical Service";
  const isDirty = count !== null || serviceType !== "" || utilityServiceAmps !== "";
  const isComplete = count !== null && serviceType !== "" && utilityServiceAmps !== "";

  // DATABASE FIELD: utility_service_amps
  // User selects from 4 button options: 100-200 (saves as 200), 300-325 (saves as 300), 400, 600

  return (
    <CollapsibleSection
      title="Electrical Service"
      initiallyExpanded={false}
      isDirty={isDirty}
      isRequiredComplete={isComplete}
      photoCount={photoCount}
      alwaysShowCamera
      captureConfig={{
        projectId,
        companyId,
        section: sectionLabel,
        tagOptions: DEFAULT_ELECTRICAL_PHOTO_TAGS,
        tagValue: null,
        initialNote: panelNote,
        onOpenGallery: () => onOpenGallery?.(sectionLabel),
        onSaveNote: (n) => setPanelNote(n),
        onMediaAdded: (type) => {
          if (type === "photo") setPhotoCount((c) => c + 1);
        },
      }}
    >
      <View style={styles.container}>
        {/* Utility Service Amperage - COMMENTED OUT FOR NOW */}
        {/* <Text style={styles.question}>
          Choose Your Utility Service Amperage
        </Text>
        <Text style={styles.helperNote}>
          Select the amperage rating your home receives from the utility company
        </Text> */}

        {/* Utility Amps Pill Buttons */}
        {/* <View style={styles.choicesRow}>
          {UTILITY_AMPS_OPTIONS.map((option) => (
            <Button
              key={option.value}
              title={option.label}
              selected={option.value === utilityServiceAmps}
              onPress={() => onUtilityServiceAmpsChange(option.value)}
              width={wp("21%")}
              rounded={24}
              textStyle={{ fontSize: moderateScale(16), fontWeight: "700" }}
            />
          ))}
        </View>
        {errors.utilityServiceAmps && (
          <Text style={styles.errorText}>{errors.utilityServiceAmps}</Text>
        )} */}

        {/* Service Type */}
        <Dropdown
          label="Service Type"
          data={SERVICE_TYPE_OPTIONS}
          value={serviceType}
          onChange={onServiceTypeChange}
          widthPercent={100}
          errorText={errors.serviceType}
        />

        {/* Question */}
        <Text style={styles.question}>
          How Many Main Circuit Breakers are in the Utility Meter Enclosure?
        </Text>

        {/* Collapsible Example */}
        <TouchableOpacity
          style={styles.exampleRow}
          onPress={() => setExampleExpanded(!exampleExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.flameContainer}>
            <Image
              source={require("../../../../assets/Images/appIcon.png")}
              style={styles.flame}
            />
          </View>
          <Text style={styles.exampleText}>Example</Text>
        </TouchableOpacity>

        {/* Helper text - Collapsible */}
        {exampleExpanded && (
          <View style={styles.helperTextContainer}>
            <Text style={styles.helperText}>
              If there is 1 MCB in an All-in-One Panel then select "1".
            </Text>
            <Text style={[styles.helperText, styles.paragraphSpacing]}>
              If the Utility Meter and Main Panel are Detached and there are no MCBs
              in the Utility Meter enclosure then select "0".
            </Text>
          </View>
        )}

        {/* Pill Buttons */}
        <View style={styles.choicesRow}>
          {CHOICES.map((n) => (
            <Button
              key={n}
              title={n.toString()}
              selected={n === count}
              onPress={() => onCountChange(n)}
              width={wp("21%")}
              rounded={24}
              textStyle={{ fontSize: moderateScale(20), fontWeight: "700" }}
            />
          ))}
        </View>
        {errors.count && <Text style={styles.errorText}>{errors.count}</Text>}
      </View>
    </CollapsibleSection>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 0,
    gap: 8, // adds spacing between direct children
  },
  question: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
    marginTop: -10,
  },
  helperNote: {
    color: "#FFF",
    fontSize: 16,
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 8,
    opacity: 0.9,
  },
  exampleRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
    marginVertical: 8,
  },
  flameContainer: {
    overflow: "visible", // Allow flame icon to overflow the container
    marginRight: 8,
  },
  flame: {
    width: 24,
    height: 24,
  },
  exampleText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "600",
  },
  helperTextContainer: {
    marginBottom: 12,
  },
  helperText: {
    color: "#FFF",
    fontSize: 20,
    lineHeight: 24,
  },
  paragraphSpacing: {
    marginTop: 12,
  },
  choicesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
  },
});
