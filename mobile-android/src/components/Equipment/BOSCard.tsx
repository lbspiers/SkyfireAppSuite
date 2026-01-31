import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { moderateScale, verticalScale } from "../../utils/responsive";
import { ORANGE_TB, ORANGE_LR, BLUE_2C_BT } from "../../styles/gradient";

interface BOSCardProps {
  systemNumber?: number; // For "System 1 BOS", "System 2 BOS" (undefined for "Combine BOS")
  title: string; // "System 1 BOS" or "Combine BOS"
  isExpanded: boolean; // Track collapse/expand state
  onToggleExpand: () => void; // Toggle handler
  isDirty?: boolean; // Has any data been entered?
  isComplete?: boolean; // All required fields filled?
  children?: React.ReactNode; // The form content to display when expanded
}

const BOSCard: React.FC<BOSCardProps> = ({
  systemNumber,
  title,
  isExpanded,
  onToggleExpand,
  isDirty = false,
  isComplete = false,
  children,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const rotateAnim = React.useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, rotateAnim]);

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const chevronRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const BORDER_RADIUS = moderateScale(8);
  const BORDER_WIDTH = moderateScale(1);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* BOS Header Button */}
      <TouchableOpacity
        onPress={onToggleExpand}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.88}
        style={styles.touchable}
      >
        {isDirty || isExpanded ? (
          // Active state: Orange gradient (when has data or expanded)
          <LinearGradient
            {...ORANGE_TB}
            style={[
              styles.headerGradient,
              {
                borderRadius: isExpanded ? 0 : BORDER_RADIUS,
                borderTopLeftRadius: BORDER_RADIUS,
                borderTopRightRadius: BORDER_RADIUS,
              },
            ]}
          >
            <View style={styles.headerContent}>
              <Text style={styles.activeText}>{title}</Text>
            </View>
            <Animated.Image
              source={require("../../assets/Images/icons/chevron_down_white.png")}
              style={[
                styles.chevronIcon,
                { transform: [{ rotate: chevronRotation }] },
              ]}
              resizeMode="contain"
            />
          </LinearGradient>
        ) : (
          // Inactive state: Blue with orange border (when no data and collapsed)
          <View
            style={[
              styles.headerWrapper,
              { borderRadius: isExpanded ? 0 : BORDER_RADIUS },
            ]}
          >
            <LinearGradient
              {...ORANGE_LR}
              style={StyleSheet.absoluteFillObject}
            />
            <View
              style={[
                styles.inactiveHeaderInner,
                {
                  margin: BORDER_WIDTH,
                  borderRadius: BORDER_RADIUS - BORDER_WIDTH,
                },
              ]}
            >
              <LinearGradient
                {...BLUE_2C_BT}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.headerContent}>
                <Text style={styles.inactiveText}>{title}</Text>
              </View>
              <Animated.Image
                source={require("../../assets/Images/icons/chevron_down_white.png")}
                style={[
                  styles.chevronIcon,
                  { transform: [{ rotate: chevronRotation }] },
                ]}
                resizeMode="contain"
              />
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Expanded Content Section */}
      {isExpanded && children && (
        <View style={styles.contentContainer}>
          {children}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: moderateScale(4),
  },
  touchable: {
    width: "100%",
  },
  headerGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(20),
    height: moderateScale(40),
  },
  headerWrapper: {
    overflow: "hidden",
    height: moderateScale(40),
    borderTopLeftRadius: moderateScale(8),
    borderTopRightRadius: moderateScale(8),
  },
  inactiveHeaderInner: {
    overflow: "hidden",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(20),
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  activeText: {
    fontFamily: "Lato-Bold",
    fontWeight: "700",
    fontSize: moderateScale(24),
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  inactiveText: {
    fontFamily: "Lato-Regular",
    fontWeight: "400",
    fontSize: moderateScale(24),
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  chevronIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    tintColor: "#FFFFFF",
  },
  contentContainer: {
    backgroundColor: "rgba(12, 31, 63, 0.5)",
    borderBottomLeftRadius: moderateScale(8),
    borderBottomRightRadius: moderateScale(8),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    borderLeftWidth: moderateScale(2),
    borderRightWidth: moderateScale(2),
    borderBottomWidth: moderateScale(2),
    borderColor: "rgba(253, 115, 50, 0.3)",
  },
});

export default BOSCard;
