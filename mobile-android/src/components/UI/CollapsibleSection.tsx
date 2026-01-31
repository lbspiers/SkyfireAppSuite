// src/components/UI/CollapsibleSection.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  LayoutAnimation,
  Platform,
  Text as RNText,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { spacing, typography } from "../../theme/theme";
import { colors } from "../../theme/tokens/tokens";
import {
  usePhotoCaptureOptional,
  type OpenCaptureConfig as CaptureConfig,
} from "../../context/PhotoCaptureContext";
import { moderateScale, verticalScale } from "../../utils/responsive";

interface Props {
  title: string;
  initiallyExpanded?: boolean;
  isComplete?: boolean; // (kept for back-compat; not used visually)
  children: React.ReactNode;
  photoCount?: number;
  onCameraPress?: () => void; // optional legacy handler
  isDirty?: boolean;
  isRequiredComplete?: boolean;
  renderCamera?: boolean;
  /** Show camera (and 0 count) even when collapsed */
  alwaysShowCamera?: boolean;

  /** If provided, clicking the camera opens the shared PhotoNotes modal */
  captureConfig?: CaptureConfig;

  /** If true, the section will stretch to full width without side margins */
  fullWidth?: boolean;

  /** New prop: called when clear text is tapped */
  onTrashPress?: () => void;

  /** New props to allow external control */
  expanded?: boolean;
  onToggle?: () => void;

  /** Show loading spinner when data is being fetched */
  isLoading?: boolean;

  /** Optional: Show system number in a circle at the beginning */
  systemNumber?: string | number;

  /** Optional: Enable title wrapping when expanded (default: false) */
  wrapTitleWhenExpanded?: boolean;
}

export default function CollapsibleSection({
  title,
  initiallyExpanded = false,
  isComplete = false, // eslint placeholder
  children,
  photoCount = 0,
  onCameraPress,
  isDirty = false,
  isRequiredComplete = false,
  renderCamera = true,
  alwaysShowCamera = false,
  captureConfig,
  fullWidth = false,
  onTrashPress,
  expanded: expandedProp,
  onToggle: onToggleProp,
  isLoading = false,
  systemNumber,
  wrapTitleWhenExpanded = false,
}: Props) {
  const [internalExpanded, setInternalExpanded] = useState(initiallyExpanded);
  const ctx = usePhotoCaptureOptional(); // <-- optional
  const openCapture = ctx?.openCapture;

  //use the controlled prop if provided, otherwise fallback to internal state
  const expanded =
    typeof expandedProp === "boolean" ? expandedProp : internalExpanded;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (onToggleProp) {
      onToggleProp();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  // Show camera if renderCamera and (expanded OR forced OR has photos while collapsed)
  const showCamera =
    renderCamera &&
    (alwaysShowCamera || expanded || (!expanded && photoCount > 0));

  // Enable only if we have a legacy handler OR a capture config AND the provider exists
  const cameraEnabled = Boolean(
    onCameraPress || (captureConfig && openCapture)
  );
  if (__DEV__ && captureConfig && !openCapture) {
    console.warn("[CollapsibleSection] captureConfig present but no provider.");
  }

  // Default section label to this component's title when not provided
  const normalizedConfig = useMemo((): CaptureConfig | undefined => {
    if (!captureConfig) return undefined;
    return { section: captureConfig.section ?? title, ...captureConfig };
  }, [captureConfig, title]);

  const handleCameraPress = useCallback(() => {
    if (onCameraPress) {
      onCameraPress();
      return;
    }
    if (normalizedConfig && openCapture) {
      openCapture(normalizedConfig);
    }
  }, [onCameraPress, normalizedConfig, openCapture]);

  const cameraTint = photoCount > 0 ? colors.primary : colors.white;

  return (
    <View style={[styles.container, fullWidth && styles.fullWidthContainer]}>
      {/* Header */}
      <View style={[styles.headerRow, fullWidth && styles.fullWidthHeader]}>
        <TouchableOpacity
          style={styles.headerTouchable}
          onPress={toggle}
          activeOpacity={0.7}
        >
          <View style={styles.titleRow}>
            {systemNumber !== undefined && (
              <View style={[
                styles.numberCircle,
                isRequiredComplete && styles.completeCircle
              ]}>
                <RNText style={[
                  styles.numberText,
                  isRequiredComplete && styles.completeNumberText
                ]}>{systemNumber}</RNText>
              </View>
            )}
            <RNText
              style={[
                typography.label,
                styles.title,
                isRequiredComplete && styles.completeTitle,
                systemNumber !== undefined && styles.titleWithNumber,
              ]}
              numberOfLines={wrapTitleWhenExpanded && expanded ? undefined : 1}
            >
              {title}
            </RNText>
          </View>
        </TouchableOpacity>

        {/* Clear button, only when expanded */}
        {expanded && onTrashPress && (
          <TouchableOpacity
            onPress={onTrashPress}
            style={styles.clearWrapper}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <RNText style={styles.clearText}>Clear</RNText>
          </TouchableOpacity>
        )}

        {/* Camera and counter */}
        {showCamera && (
          <TouchableOpacity
            onPress={cameraEnabled ? handleCameraPress : undefined}
            style={styles.cameraWrapper}
            activeOpacity={cameraEnabled ? 0.6 : 1}
            disabled={!cameraEnabled}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Image
              source={require("../../assets/Images/icons/camera.png")}
              style={[styles.cameraIcon, { tintColor: cameraTint }]}
            />
            <View style={styles.countBadge}>
              <RNText style={styles.badgeText}>
                {photoCount > 99 ? "99+" : photoCount}
              </RNText>
            </View>
          </TouchableOpacity>
        )}

        {/* Collapse/expand button */}
        <TouchableOpacity
          onPress={toggle}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Image
            source={
              expanded
                ? require("../../assets/Images/icons/minus_icon_orange_fd7332.png")
                : isDirty
                ? require("../../assets/Images/icons/pencil_icon_orange_fd7332.png")
                : require("../../assets/Images/icons/plus_icon_orange_fd7332.png")
            }
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>

      {/* Body */}
      {expanded && (
        <View style={[styles.body, fullWidth && styles.fullWidthBody]}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <RNText style={styles.loadingText}>Loading data...</RNText>
            </View>
          ) : (
            children
          )}
        </View>
      )}

      {/* Bottom separator */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentBorder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: colors.transparent,
    overflow: "hidden",
    marginBottom: 0,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(20),
    minHeight: verticalScale(64),
    backgroundColor: colors.transparent,
  },
  headerTouchable: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  numberCircle: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.transparent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(12),
    marginTop: -4,
  },
  completeCircle: {
    borderColor: colors.success,
  },
  numberText: {
    color: colors.white,
    fontSize: moderateScale(24),
    fontWeight: "700",
    fontFamily: "Lato-Bold",
    lineHeight: moderateScale(24),
    includeFontPadding: false,
    textAlignVertical: "center",
    marginTop: 4,
  },
  completeNumberText: {
    color: colors.success,
  },
  title: {
    color: colors.white,
    fontSize: moderateScale(24),
    lineHeight: verticalScale(24),
    marginTop: verticalScale(3),
    flexShrink: 1,
  },
  titleWithNumber: {
    marginTop: verticalScale(3),
  },
  completeTitle: { color: colors.success },
  icon: {
    width: moderateScale(30),
    height: moderateScale(30),
    resizeMode: "contain",
    marginLeft: moderateScale(12),
  },
  cameraWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: moderateScale(14),
  },
  cameraIcon: {
    width: moderateScale(34),
    height: moderateScale(34),
    resizeMode: "contain",
    marginRight: moderateScale(3),
    marginTop: verticalScale(-5),
  },
  countBadge: {
    backgroundColor: colors.transparent,
    borderRadius: moderateScale(5),
    minWidth: moderateScale(27),
    height: moderateScale(27),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(3),
    marginLeft: 0,
    marginTop: verticalScale(-6),
  },
  badgeText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: moderateScale(20),
    letterSpacing: 0.15,
  },
  clearWrapper: {
    marginLeft: moderateScale(8),
  },
  clearText: {
    color: colors.primary,
    fontSize: moderateScale(20),
    fontWeight: "600",
    fontFamily: "Lato-Bold",
    marginTop: verticalScale(-4),
    marginRight: moderateScale(45),
  },
  body: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: spacing.sm,
    backgroundColor: colors.transparent,
  },
  accentBorder: { height: 1, width: "100%" },
  fullWidthContainer: {
    marginHorizontal: moderateScale(-20),
    width: "auto",
  },
  fullWidthHeader: {
    paddingHorizontal: moderateScale(16),
  },
  fullWidthBody: {
    paddingHorizontal: moderateScale(16),
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(20),
  },
  loadingText: {
    color: colors.white,
    fontSize: moderateScale(16),
    marginLeft: moderateScale(10),
    fontFamily: "Lato-Regular",
  },
});
