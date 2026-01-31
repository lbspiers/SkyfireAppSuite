// src/screens/ProjectRecord.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import dayjs from "dayjs";
import { useResponsive } from "../../../../utils/responsive";
import { STATUS_COLORS } from "../../../../utils/constants";
import {
  GetProcessSteps,
  ToggleProcessStep,
  ProcessStep,
} from "../../../../api/processSteps.service";

// icons
const pencilIcon = require("../../../../assets/Images/icons/pencil_icon_white.png");
const chevronIcon = require("../../../../assets/Images/icons/chevron_down_white_thin.png");
const flameIcon = require("../../../../assets/Images/appIcon.png");

export interface ProjectRecordProps {
  name: string;
  streetAddress: string;
  cityStateZip: string;
  projectId: string; // Display ID (e.g., "SFSD1762884317")
  projectNumericId: number; // Numeric ID for API calls (e.g., 393)
  status: string;
  createdAt?: string | Date;
  companyName?: string;
  onEdit: () => void;
  onToggleDetails: () => void;
  onStatusPress?: () => void;
}

const ORANGE_BORDER_GRADIENT = {
  colors: ["#FD7332", "#B92011"],
  start: { x: 0, y: 0.5 },
  end: { x: 1, y: 0.5 },
};

const PROCESS_STEP_NAMES = [
  "Site Survey",
  "Site Survey QC",
  "Site Plan Drafted",
  "Site Plan QC",
  "Plan Set Generated",
  "Plan Set QC",
];

export default function ProjectRecord({
  name,
  streetAddress,
  cityStateZip,
  projectId,
  projectNumericId,
  status,
  createdAt,
  companyName,
  onEdit,
  onToggleDetails,
  onStatusPress,
}: ProjectRecordProps) {
  const { moderateScale, verticalScale, font } = useResponsive();
  const [containerHeight, setContainerHeight] = useState(verticalScale(130));

  // Expansion state
  const [isExpanded, setIsExpanded] = useState(false);
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([]);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [togglingStep, setTogglingStep] = useState<number | null>(null);
  const [stepsLoaded, setStepsLoaded] = useState(false);

  // Animation values
  const chevronRotation = useRef(new Animated.Value(0)).current;
  const expandHeight = useRef(new Animated.Value(0)).current;

  const styles = getStyles({ moderateScale, verticalScale, font });

  const statusColor = STATUS_COLORS[status] ?? "#2E4161";
  const createdLabel = createdAt
    ? `Created: ${dayjs(createdAt).format("MMM D, YYYY")}`
    : "";

  // Fetch process steps when first expanded
  useEffect(() => {
    if (isExpanded && !stepsLoaded && !loadingSteps && projectNumericId) {
      fetchProcessSteps();
    }
  }, [isExpanded, stepsLoaded, loadingSteps, projectNumericId]);

  const fetchProcessSteps = async () => {
    if (!projectNumericId) return;

    setLoadingSteps(true);
    try {
      const steps = await GetProcessSteps(String(projectNumericId));
      setProcessSteps(steps);
      setStepsLoaded(true);
    } catch (error) {
      console.error("[ProjectRecord] Error fetching process steps:", error);
    } finally {
      setLoadingSteps(false);
    }
  };

  const handleToggleExpand = () => {
    const toValue = isExpanded ? 0 : 1;

    // Animate chevron rotation
    Animated.timing(chevronRotation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Animate height expansion
    Animated.timing(expandHeight, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();

    setIsExpanded(!isExpanded);
  };

  const handleToggleStep = async (stepNumber: number) => {
    if (togglingStep !== null || !projectNumericId) return; // Prevent multiple toggles

    // Optimistic update
    const stepIndex = processSteps.findIndex(
      (s) => s.step_number === stepNumber
    );
    if (stepIndex === -1) return;

    const previousSteps = [...processSteps];
    const updatedSteps = [...processSteps];
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      is_completed: !updatedSteps[stepIndex].is_completed,
    };
    setProcessSteps(updatedSteps);
    setTogglingStep(stepNumber);

    try {
      const updatedStep = await ToggleProcessStep(
        String(projectNumericId),
        stepNumber
      );
      // Update with server response - use updatedSteps, not stale processSteps
      const newSteps = [...updatedSteps];
      newSteps[stepIndex] = updatedStep;
      setProcessSteps(newSteps);
    } catch (error) {
      console.error("[ProjectRecord] Error toggling step:", error);
      // Revert on error
      setProcessSteps(previousSteps);
    } finally {
      setTogglingStep(null);
    }
  };

  const chevronRotate = chevronRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const expandedHeight = expandHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, verticalScale(340)], // Height for 6 steps
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.cardContainer}>
        {/* Main row content */}
        <View
          style={styles.row}
          onLayout={(e) => {
            const height = e.nativeEvent.layout.height;
            if (height !== containerHeight) {
              setContainerHeight(height);
            }
          }}
        >
          {/* Status bar */}
          <TouchableOpacity
            style={[styles.statusStrip, { backgroundColor: statusColor }]}
            onPress={onStatusPress}
            activeOpacity={0.7}
          >
            <View style={styles.statusTextWrap}>
              <Text
                style={[styles.statusText, { width: containerHeight }]}
                numberOfLines={1}
              >
                {status}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Info block */}
          <View style={styles.content}>
            {companyName && <Text style={styles.companyName}>{companyName}</Text>}
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
              {name}
            </Text>
            <Text style={styles.line} numberOfLines={1} ellipsizeMode="tail">
              {streetAddress}
            </Text>
            <Text style={styles.line} numberOfLines={1} ellipsizeMode="tail">
              {cityStateZip}
            </Text>
            <Text style={styles.projectId} numberOfLines={1} ellipsizeMode="tail">
              {projectId}
            </Text>
          </View>

          {/* Actions (Created + pencil + chevron) */}
          <View style={styles.actions}>
            <View style={styles.topRow}>
              {!!createdLabel && (
                <Text style={styles.createdText} numberOfLines={1}>
                  {createdLabel}
                </Text>
              )}
              <TouchableOpacity onPress={onEdit} style={styles.iconTopButton}>
                <Image source={pencilIcon} style={styles.pencilIcon} />
              </TouchableOpacity>
            </View>
            {/* Chevron icon - bottom right corner */}
            <TouchableOpacity
              onPress={handleToggleExpand}
              style={styles.chevronButton}
              activeOpacity={0.7}
            >
              <Animated.Image
                source={chevronIcon}
                style={[
                  styles.chevronIcon,
                  {
                    transform: [{ rotate: chevronRotate }],
                  },
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Expanded section - Process Steps */}
        <Animated.View
          style={[
            styles.expandedSection,
            {
              height: expandedHeight,
              opacity: expandHeight,
            },
          ]}
        >
          {isExpanded && (
            <View style={styles.processStepsContainer}>
              <Text style={styles.processStepsHeader}>Process Steps</Text>

              {loadingSteps ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FD7332" />
                </View>
              ) : (
                <View style={styles.stepsList}>
                  {processSteps.map((step) => (
                    <TouchableOpacity
                      key={step.step_number}
                      style={styles.stepRow}
                      onPress={() => handleToggleStep(step.step_number)}
                      activeOpacity={0.7}
                      disabled={togglingStep !== null}
                    >
                      {/* Step number */}
                      <Text style={styles.stepNumber}>{step.step_number}</Text>

                      {/* Checkbox (flame icon or empty circle) */}
                      <View style={styles.checkboxContainer}>
                        {togglingStep === step.step_number ? (
                          <ActivityIndicator size="small" color="#FD7332" />
                        ) : step.is_completed ? (
                          <Image
                            source={flameIcon}
                            style={styles.flameIcon}
                            resizeMode="contain"
                          />
                        ) : (
                          <View style={styles.emptyCircle} />
                        )}
                      </View>

                      {/* Step info */}
                      <View style={styles.stepInfo}>
                        <Text
                          style={[
                            styles.stepName,
                            step.is_completed && styles.stepNameCompleted,
                          ]}
                        >
                          {step.step_name}
                        </Text>
                        {step.is_completed && step.completed_by_user && (
                          <Text style={styles.completedInfo}>
                            {step.completed_by_user.first_name}{" "}
                            {step.completed_by_user.last_name} •{" "}
                            {dayjs(step.completed_at).format("MMM D, YYYY")}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const getStyles = ({
  moderateScale,
  verticalScale,
  font,
}: {
  moderateScale: (n: number) => number;
  verticalScale: (n: number) => number;
  font: (n: number) => number;
}) =>
  StyleSheet.create({
    wrapper: {
      width: "100%",
      marginBottom: verticalScale(8),
      paddingHorizontal: moderateScale(8),
    },
    cardContainer: {
      borderRadius: moderateScale(12),
      overflow: "hidden",
      backgroundColor: "#1D2A4F",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    separator: {
      height: verticalScale(2),
      width: "100%",
    },
    row: {
      flexDirection: "row",
      alignItems: "stretch",
      minHeight: verticalScale(130),
    },
    statusStrip: {
      width: moderateScale(30),
      justifyContent: "center",
      alignItems: "center",
      borderTopLeftRadius: moderateScale(12),
      borderBottomLeftRadius: moderateScale(12),
    },
    statusTextWrap: {
      width: "100%",
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    statusText: {
      color: "#FFF",
      fontSize: font(18),
      fontWeight: "700" as any,
      transform: [{ rotate: "-90deg" }],
      textAlign: "center" as const,
    },
    content: {
      flex: 1,
      paddingLeft: moderateScale(12),
      paddingTop: verticalScale(12),
      paddingBottom: verticalScale(10),
    },
    name: {
      color: "#FFF",
      fontSize: font(20),
      fontWeight: "700" as any,
    },
    companyName: {
      color: "#FD7332",
      fontSize: font(18),
      fontWeight: "700" as any,
      marginBottom: verticalScale(4),
    },
    line: {
      color: "#FFF",
      fontSize: font(16),
      marginTop: verticalScale(2),
    },
    projectId: {
      color: "#FFF",
      fontSize: font(14),
      marginTop: verticalScale(4),
      marginBottom: verticalScale(10),
      opacity: 0.7,
    },
    actions: {
      justifyContent: "space-between",
      paddingRight: moderateScale(12),
      paddingBottom: verticalScale(12),
      alignItems: "flex-end",
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: verticalScale(16),
      gap: moderateScale(8),
    },
    createdText: {
      color: "#FFF",
      opacity: 0.75,
      fontSize: font(12),
      maxWidth: moderateScale(160),
      textAlign: "right",
    },
    iconTopButton: {
      paddingLeft: moderateScale(2),
      paddingRight: moderateScale(8),
    },
    pencilIcon: {
      width: moderateScale(24),
      height: moderateScale(24),
      tintColor: "#FD7332",
    },
    chevronButton: {
      paddingLeft: moderateScale(2),
      paddingRight: moderateScale(8),
      alignSelf: "flex-end",
    },
    chevronIcon: {
      width: moderateScale(20),
      height: moderateScale(20),
      tintColor: "#FD7332",
    },
    // Expanded section styles
    expandedSection: {
      overflow: "hidden",
      backgroundColor: "#1D2A4F",
    },
    processStepsContainer: {
      paddingHorizontal: moderateScale(20),
      paddingVertical: verticalScale(10),
    },
    processStepsHeader: {
      color: "#FD7332",
      fontSize: font(18),
      fontWeight: "700" as any,
      marginBottom: verticalScale(8),
    },
    loadingContainer: {
      paddingVertical: verticalScale(12),
      alignItems: "center",
    },
    stepsList: {
      gap: verticalScale(4),
    },
    stepRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: verticalScale(4),
      gap: moderateScale(12),
    },
    stepNumber: {
      color: "#FD7332",
      fontSize: font(18),
      fontWeight: "700" as any,
      width: moderateScale(24),
      textAlign: "center",
    },
    checkboxContainer: {
      width: moderateScale(32),
      height: moderateScale(32),
      justifyContent: "center",
      alignItems: "center",
      overflow: "visible",
    },
    emptyCircle: {
      width: moderateScale(24),
      height: moderateScale(24),
      borderRadius: moderateScale(12),
      borderWidth: 2,
      borderColor: "#FFF",
      opacity: 0.5,
    },
    flameIcon: {
      width: moderateScale(28),
      height: moderateScale(28),
      // No tint - show natural flame colors
    },
    stepInfo: {
      flex: 1,
    },
    stepName: {
      color: "#FFF",
      fontSize: font(16),
      fontWeight: "600" as any,
    },
    stepNameCompleted: {
      color: "#4CAF50", // Green color for completed steps
    },
    completedInfo: {
      color: "#FFF",
      fontSize: font(12),
      opacity: 0.7,
      marginTop: verticalScale(2),
    },
  });
