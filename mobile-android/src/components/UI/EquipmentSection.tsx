// src/components/UI/EquipmentSection.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  LayoutAnimation,
  Platform,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { colors } from "../../theme/tokens/tokens";
import { moderateScale, verticalScale } from "../../utils/responsive";

interface EquipmentSectionProps {
  title: string;
  children: React.ReactNode;

  // Toggle state
  isNew?: boolean;
  onNewExistingToggle?: (isNew: boolean) => void;
  showNewExistingToggle?: boolean;

  // Action buttons
  onPreferredPress?: () => void;
  isPreferred?: boolean;
  onEditPress?: () => void;
  onCameraPress?: () => void;
  photoCount?: number;
  onDeletePress?: () => void;

  // State
  initiallyExpanded?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  isLoading?: boolean;

  // Right side content (e.g., Battery Only button)
  headerRightContent?: React.ReactNode;
}

export default function EquipmentSection({
  title,
  children,
  isNew = true,
  onNewExistingToggle,
  showNewExistingToggle = true,
  onPreferredPress,
  isPreferred = false,
  onEditPress,
  onCameraPress,
  photoCount = 0,
  onDeletePress,
  initiallyExpanded = false,
  expanded: expandedProp,
  onToggle: onToggleProp,
  isLoading = false,
  headerRightContent,
}: EquipmentSectionProps) {
  const [internalExpanded, setInternalExpanded] = useState(initiallyExpanded);

  const expanded = typeof expandedProp === "boolean" ? expandedProp : internalExpanded;

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (onToggleProp) {
      onToggleProp();
    } else {
      setInternalExpanded(prev => !prev);
    }
  }, [onToggleProp]);

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <TouchableOpacity
        style={styles.header}
        onPress={toggle}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>

        <View style={styles.headerRight}>
          {/* Preferred Button */}
          {onPreferredPress && (
            <TouchableOpacity
              style={[styles.preferredButton, isPreferred && styles.preferredButtonActive]}
              onPress={(e) => {
                e.stopPropagation();
                onPreferredPress();
              }}
            >
              <Text style={[styles.preferredText, isPreferred && styles.preferredTextActive]}>
                Preferred
              </Text>
            </TouchableOpacity>
          )}

          {/* Action Icons */}
          {onEditPress && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={(e) => {
                e.stopPropagation();
                onEditPress();
              }}
            >
              <Image
                source={require("../../assets/Images/icons/pencil_icon_white.png")}
                style={styles.actionIcon}
              />
            </TouchableOpacity>
          )}

          {onCameraPress && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={(e) => {
                e.stopPropagation();
                onCameraPress();
              }}
            >
              <Image
                source={require("../../assets/Images/icons/camera.png")}
                style={[styles.actionIcon, photoCount > 0 && styles.activeIcon]}
              />
              {photoCount > 0 && (
                <View style={styles.photoBadge}>
                  <Text style={styles.photoBadgeText}>{photoCount > 99 ? '99+' : photoCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {onDeletePress && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={(e) => {
                e.stopPropagation();
                onDeletePress();
              }}
            >
              <Image
                source={require("../../assets/Images/icons/trash_icon_white.png")}
                style={styles.actionIcon}
              />
            </TouchableOpacity>
          )}

          {/* Header Right Content (e.g., Battery Only) */}
          {headerRightContent}

          {/* Collapse Icon */}
          <Image
            source={
              expanded
                ? require("../../assets/Images/icons/minus_icon_orange_fd7332.png")
                : require("../../assets/Images/icons/plus_icon_orange_fd7332.png")
            }
            style={styles.collapseIcon}
          />
        </View>
      </TouchableOpacity>

      {/* Body */}
      {expanded && (
        <View style={styles.body}>
          {/* New/Existing Toggle Row */}
          {showNewExistingToggle && onNewExistingToggle && (
            <View style={styles.toggleRow}>
              {/* New Button */}
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  !isNew && styles.toggleButtonInactive,
                ]}
                onPress={() => onNewExistingToggle(true)}
                activeOpacity={0.7}
              >
                {isNew ? (
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.toggleGradient}
                  >
                    <Text style={styles.toggleTextActive}>New</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.toggleGradient}>
                    <Text style={styles.toggleTextInactive}>New</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Existing Button */}
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  isNew && styles.toggleButtonInactive,
                ]}
                onPress={() => onNewExistingToggle(false)}
                activeOpacity={0.7}
              >
                {!isNew ? (
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.toggleGradient}
                  >
                    <Text style={styles.toggleTextActive}>Existing</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.toggleGradient}>
                    <Text style={styles.toggleTextInactive}>Existing</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <View style={styles.content}>
              {children}
            </View>
          )}
        </View>
      )}

      {/* Bottom Border */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bottomBorder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: colors.bgSurface,
    marginBottom: verticalScale(2),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(16),
    backgroundColor: colors.bgSurface,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    color: colors.textPrimary,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  preferredButton: {
    paddingVertical: verticalScale(6),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  preferredButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLighter,
  },
  preferredText: {
    fontSize: moderateScale(12),
    color: colors.textMuted,
  },
  preferredTextActive: {
    color: colors.primary,
  },
  iconButton: {
    padding: moderateScale(6),
    position: "relative",
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: moderateScale(6),
    marginHorizontal: moderateScale(2),
  },
  actionIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    tintColor: colors.textMuted,
  },
  activeIcon: {
    tintColor: colors.primary,
  },
  photoBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: moderateScale(8),
    minWidth: moderateScale(16),
    height: moderateScale(16),
    alignItems: "center",
    justifyContent: "center",
  },
  photoBadgeText: {
    fontSize: moderateScale(10),
    color: colors.white,
    fontWeight: "600",
  },
  collapseIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
    marginLeft: moderateScale(8),
  },
  body: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: verticalScale(16),
    backgroundColor: colors.bgSurface,
  },
  toggleRow: {
    flexDirection: "row",
    gap: moderateScale(8),
    marginBottom: verticalScale(16),
    alignSelf: "flex-start", // Keep buttons compact, don't stretch
  },
  toggleButton: {
    borderRadius: moderateScale(9999), // Fully rounded pill shape (matches web)
    overflow: "hidden",
  },
  toggleButtonInactive: {
    borderWidth: 1,
    borderColor: `${colors.primary}80`, // 50% opacity orange border (matches web rgba(253, 115, 50, 0.5))
    backgroundColor: "transparent",
  },
  toggleGradient: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(8), // 8px all around (matches web)
    alignItems: "center",
    justifyContent: "center",
  },
  toggleTextActive: {
    fontSize: moderateScale(12), // 12px (matches web)
    fontWeight: "600", // Semibold (matches web)
    color: colors.textPrimary, // White text for active state
  },
  toggleTextInactive: {
    fontSize: moderateScale(12), // 12px (matches web)
    fontWeight: "600", // Semibold (matches web)
    color: colors.primary, // Orange text for inactive state
  },
  content: {},
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(20),
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: moderateScale(14),
    marginLeft: moderateScale(8),
  },
  bottomBorder: {
    height: 2,
    width: "100%",
  },
});
