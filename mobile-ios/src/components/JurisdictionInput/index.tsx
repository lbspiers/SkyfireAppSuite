// src/components/JurisdictionInput/index.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Text as RNText,
} from "react-native";
import Dropdown from "../Dropdown";
import Toast from "react-native-toast-message";
import { moderateScale, verticalScale } from "../../utils/responsive";
import {
  checkAHJLookupStatus,
  fetchJurisdictionsByZip,
  fetchJurisdictions,
} from "../../api/jurisdiction.service";
import { AHJDropdownOption } from "../../types/ahj";

interface JurisdictionInputProps {
  projectId: string;
  companyId: string;
  zipCode?: string;
  state?: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  onRetry?: () => void;
  errorText?: string;
  touched?: boolean;
}

// Loading stages with faster timing - moves quickly through steps
const LOADING_STAGES = [
  { text: "Initializing search", duration: 2000 },         // 2s
  { text: "Contacting AHJ database", duration: 2500 },    // 2.5s
  { text: "Analyzing location data", duration: 3000 },    // 3s
  { text: "Cross-referencing jurisdictions", duration: 3500 }, // 3.5s
  { text: "Validating results", duration: 3000 },         // 3s
  { text: "Finalizing search", duration: 0 },             // Last stage stays until result/timeout
];

const JurisdictionInput: React.FC<JurisdictionInputProps> = ({
  projectId,
  companyId,
  zipCode,
  state,
  value,
  onChangeText,
  onBlur,
  onRetry,
  errorText,
  touched,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [jurisdictions, setJurisdictions] = useState<AHJDropdownOption[]>([]);
  const [hasRunLookup, setHasRunLookup] = useState(false);

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stageTimeout = useRef<NodeJS.Timeout | null>(null);
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const animatedDots = useRef(new Animated.Value(0)).current;
  const startTime = useRef<number>(0);

  // Check if this is a new project that needs AHJ lookup
  useEffect(() => {
    if (value) {
      setHasRunLookup(true);
      setIsLoading(false);
      setShowDropdown(false);
      cleanupTimers();
    } else if (
      !value &&
      !hasRunLookup &&
      projectId &&
      zipCode &&
      zipCode.length === 5 &&
      !isLoading &&
      !showDropdown
    ) {
      startAHJLookup();
      setHasRunLookup(true);
    }

    // ✅ FIX: Only cleanup on unmount, NOT on every dependency change
    // Cleaning up on every render cancels the stage progression timeouts
    return () => {
      // Only cleanup when component unmounts or value actually changes to non-empty
      if (value) {
        console.log('[JurisdictionInput] Component cleanup - value is set, cleaning up timers');
        cleanupTimers();
      }
    };
  }, [projectId, zipCode, hasRunLookup, value]);

  const cleanupTimers = () => {
    console.log('[JurisdictionInput] cleanupTimers called - clearing all timers');
    if (pollingInterval.current) {
      console.log('[JurisdictionInput] Clearing polling interval');
      clearInterval(pollingInterval.current);
    }
    if (timeoutRef.current) {
      console.log('[JurisdictionInput] Clearing main timeout');
      clearTimeout(timeoutRef.current);
    }
    if (stageTimeout.current) {
      console.log('[JurisdictionInput] ⚠️ Clearing stage timeout - THIS CANCELS STAGE PROGRESSION!');
      clearTimeout(stageTimeout.current);
    }
    pollingInterval.current = null;
    timeoutRef.current = null;
    stageTimeout.current = null;
  };

  const startAHJLookup = () => {
    console.log("Starting AHJ Lookup polling for project:", projectId);
    setIsLoading(true);
    setShowDropdown(false);
    setCurrentStage(0);
    startTime.current = Date.now();

    // Start animations
    startLoadingAnimations();

    // Start polling for jurisdiction result
    pollingInterval.current = setInterval(() => {
      checkForJurisdiction();
    }, 3000);

    // Set timeout for 3 minutes
    timeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, 180000);
  };

  const triggerManualLookup = () => {
    console.log("Manual refresh triggered");

    onChangeText("");
    setShowDropdown(false);
    setIsLoading(true);
    setCurrentStage(0);
    startTime.current = Date.now();

    startLoadingAnimations();

    if (pollingInterval.current) clearInterval(pollingInterval.current);
    pollingInterval.current = setInterval(() => {
      checkForJurisdiction();
    }, 3000);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, 180000);

    setHasRunLookup(true);

    if (onRetry) {
      console.log("Calling onRetry callback");
      onRetry();
    } else {
      console.warn(
        "No onRetry callback provided - make sure to pass this prop from Site.tsx"
      );
    }
  };

  const startLoadingAnimations = () => {
    // Smooth dots animation (slower)
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedDots, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(animatedDots, {
          toValue: 2,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(animatedDots, {
          toValue: 3,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(animatedDots, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Progress through stages
    progressThroughStages(0);
  };

  const progressThroughStages = (stageIndex: number) => {
    if (stageIndex >= LOADING_STAGES.length) return;

    const stage = LOADING_STAGES[stageIndex];
    setCurrentStage(stageIndex);
    console.log(`[JurisdictionInput] Progressing to stage ${stageIndex + 1}/${LOADING_STAGES.length}: "${stage.text}"`);

    // Animate progress bar for this stage
    const progressStart = stageIndex / LOADING_STAGES.length;
    const progressEnd = (stageIndex + 1) / LOADING_STAGES.length;

    animatedProgress.setValue(progressStart);
    Animated.timing(animatedProgress, {
      toValue: progressEnd,
      duration: stage.duration || 5000,
      useNativeDriver: false,
    }).start();

    // Move to next stage if there's a duration set
    if (stage.duration > 0) {
      console.log(`[JurisdictionInput] Scheduling next stage in ${stage.duration}ms`);
      stageTimeout.current = setTimeout(() => {
        console.log(`[JurisdictionInput] Stage timeout fired, advancing to stage ${stageIndex + 2}`);
        progressThroughStages(stageIndex + 1);
      }, stage.duration);
    } else {
      console.log(`[JurisdictionInput] Final stage (no duration), waiting for result`);
    }
  };

  const checkForJurisdiction = async () => {
    try {
      const jurisdiction = await checkAHJLookupStatus(projectId, companyId);

      if (jurisdiction) {
        console.log("Jurisdiction found:", jurisdiction);

        // Complete remaining stages quickly before showing result
        const remainingStages = LOADING_STAGES.length - currentStage - 1;
        if (remainingStages > 0) {
          console.log(`Fast-forwarding through ${remainingStages} remaining stages`);
          completeRemainingStages(currentStage + 1, () => {
            // After stages complete, show the result
            finishWithResult(jurisdiction);
          });
        } else {
          // Already at last stage, show result immediately
          finishWithResult(jurisdiction);
        }
      }
    } catch (error) {
      console.error("Error checking for jurisdiction:", error);
    }
  };

  const completeRemainingStages = (startStage: number, onComplete: () => void) => {
    let stageIndex = startStage;
    const fastDuration = 300; // 300ms per stage for fast completion

    const advanceStage = () => {
      if (stageIndex >= LOADING_STAGES.length) {
        onComplete();
        return;
      }

      setCurrentStage(stageIndex);

      // Animate progress bar quickly
      const progressStart = stageIndex / LOADING_STAGES.length;
      const progressEnd = (stageIndex + 1) / LOADING_STAGES.length;

      animatedProgress.setValue(progressStart);
      Animated.timing(animatedProgress, {
        toValue: progressEnd,
        duration: fastDuration,
        useNativeDriver: false,
      }).start();

      stageIndex++;
      setTimeout(advanceStage, fastDuration);
    };

    advanceStage();
  };

  const finishWithResult = (jurisdiction: string) => {
    cleanupTimers();
    onChangeText(jurisdiction);
    setIsLoading(false);

    const timeTaken = Math.round((Date.now() - startTime.current) / 1000);

    Toast.show({
      type: "success",
      text1: "Jurisdiction Found",
      text2: `${jurisdiction} (${timeTaken}s)`,
      position: "top",
      visibilityTime: 4000,
      onPress: () => Toast.hide(),
    });
  };

  const handleTimeout = () => {
    console.log("AHJ Lookup timed out - switching to manual selection");

    cleanupTimers();
    setIsLoading(false);

    loadJurisdictionsFromDB().then(() => {
      setShowDropdown(true);

      Toast.show({
        type: "info",
        text1: "Manual Selection Mode",
        text2: "Please select jurisdiction from the list",
        position: "top",
        visibilityTime: 4000,
        onPress: () => Toast.hide(),
      });
    });
  };

  const loadJurisdictionsFromDB = async (): Promise<void> => {
    try {
      if (zipCode && zipCode.length === 5) {
        console.log(`Loading jurisdictions for zip: ${zipCode}`);
        const jurisdictionList = await fetchJurisdictionsByZip(zipCode);

        if (jurisdictionList.length > 0) {
          setJurisdictions(jurisdictionList);
          return;
        }

        console.log(
          `No jurisdictions for zip ${zipCode}, trying state: ${state}`
        );
      }

      if (state) {
        console.log(`Loading jurisdictions for state: ${state}`);
        const stateJurisdictions = await fetchJurisdictions(state);

        if (stateJurisdictions.length > 0) {
          setJurisdictions(stateJurisdictions);
          Toast.show({
            type: "info",
            text1: "No jurisdictions for ZIP",
            text2: `Showing ${state} jurisdictions`,
            position: "top",
            visibilityTime: 3000,
          });
          return;
        }
      }

      console.warn(
        "No jurisdictions found for zip or state, using generic fallback"
      );
      setJurisdictions([
        { label: "County Jurisdiction", value: "County Jurisdiction" },
        { label: "City Jurisdiction", value: "City Jurisdiction" },
        { label: "Municipal Jurisdiction", value: "Municipal Jurisdiction" },
      ]);

      Toast.show({
        type: "warning",
        text1: "Limited jurisdictions available",
        text2: "Please contact support if needed",
        position: "top",
        visibilityTime: 4000,
      });
    } catch (error) {
      console.error("Error loading jurisdictions:", error);
      setJurisdictions([
        { label: "County Jurisdiction", value: "County Jurisdiction" },
        { label: "City Jurisdiction", value: "City Jurisdiction" },
      ]);
    }
  };

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < 3; i++) {
      const opacity = animatedDots.interpolate({
        inputRange: [0, 1, 2, 3],
        outputRange:
          i === 0
            ? [1, 0.3, 0.3, 0.3]
            : i === 1
            ? [0.3, 1, 0.3, 0.3]
            : [0.3, 0.3, 1, 0.3],
      });

      dots.push(
        <Animated.Text key={i} style={[styles.loadingDot, { opacity }]}>
          •
        </Animated.Text>
      );
    }
    return dots;
  };

  // Loading state
  if (isLoading) {
    const currentStageText = LOADING_STAGES[currentStage]?.text || "Processing";
    const progressPercentage = animatedProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ["0%", "100%"],
    });

    return (
      <View style={styles.container}>
        <RNText style={styles.label}>Jurisdiction*</RNText>
        <View style={{ height: verticalScale(12) }} />

        <View style={styles.loadingInputContainer}>
          <View style={styles.loadingTextRow}>
            <RNText style={styles.loadingText}>{currentStageText}</RNText>
            <View style={styles.dotsContainer}>{renderDots()}</View>
          </View>

          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[styles.progressBarFill, { width: progressPercentage }]}
            />
          </View>

          <RNText style={styles.stageCounter}>
            Step {currentStage + 1} of {LOADING_STAGES.length}
          </RNText>
        </View>

        <View style={styles.skipSection}>
          <TouchableOpacity style={styles.skipButton} onPress={handleTimeout}>
            <RNText style={styles.skipText}>Skip and select manually</RNText>
          </TouchableOpacity>
          <RNText style={styles.helpText}>
            You can continue filling other fields while we search
          </RNText>
        </View>
      </View>
    );
  }

  // Dropdown state with refresh button
  if (showDropdown || value || hasRunLookup) {
    return (
      <View style={styles.container}>
        <View style={styles.labelRow}>
          <RNText style={styles.label}>Jurisdiction*</RNText>
          <TouchableOpacity
            onPress={triggerManualLookup}
            disabled={isLoading}
            style={styles.refreshButton}
            activeOpacity={0.7}
          >
            <RNText style={styles.refreshText}>Refresh</RNText>
          </TouchableOpacity>
        </View>
        <Dropdown
          label=""
          data={jurisdictions}
          value={value}
          onChange={onChangeText}
          errorText={touched ? errorText : undefined}
          disabled={jurisdictions.length === 0 && !value}
        />
      </View>
    );
  }

  // Default waiting state
  return (
    <View style={styles.container}>
      <Dropdown
        label="Jurisdiction*"
        data={[]}
        value=""
        onChange={() => {}}
        disabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(-25),
  },
  label: {
    fontSize: moderateScale(20),
    lineHeight: moderateScale(24),
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
  },
  refreshButton: {
    paddingVertical: verticalScale(4),
    paddingHorizontal: moderateScale(12),
    marginLeft: moderateScale(16),
  },
  refreshText: {
    color: "#FD7332",
    fontSize: moderateScale(16),
    fontWeight: "600",
  },

  // Loading styles
  loadingInputContainer: {
    borderWidth: moderateScale(1),
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(14),
    paddingHorizontal: moderateScale(16),
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    minHeight: verticalScale(100), // Prevent jumping
  },
  loadingTextRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(10),
    minHeight: verticalScale(24), // Consistent height
  },
  loadingText: {
    fontSize: moderateScale(16),
    color: "#FD7332",
    fontWeight: "600",
    lineHeight: moderateScale(24),
  },
  dotsContainer: {
    flexDirection: "row",
    marginLeft: moderateScale(4),
    minWidth: moderateScale(20), // Prevent shifting
  },
  loadingDot: {
    fontSize: moderateScale(20),
    color: "#FD7332",
    marginHorizontal: moderateScale(1),
    lineHeight: moderateScale(20),
  },
  progressBarContainer: {
    height: verticalScale(6),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: moderateScale(3),
    overflow: "hidden",
    marginBottom: verticalScale(8),
    marginTop: verticalScale(2),
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FD7332",
    borderRadius: moderateScale(3),
  },
  stageCounter: {
    fontSize: moderateScale(12),
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "right",
    lineHeight: moderateScale(16),
    marginTop: verticalScale(2),
  },

  // Skip section
  skipSection: {
    marginTop: verticalScale(12),
    paddingTop: verticalScale(4),
  },
  skipButton: {
    paddingVertical: verticalScale(4),
  },
  skipText: {
    fontSize: moderateScale(14),
    color: "#FD7332",
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  helpText: {
    fontSize: moderateScale(12),
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: verticalScale(6),
    fontStyle: "italic",
  },
});

export default JurisdictionInput;
