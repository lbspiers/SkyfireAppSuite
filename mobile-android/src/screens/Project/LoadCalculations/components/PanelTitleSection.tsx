// src/screens/Project/LoadCalculations/components/PanelTitleSection.tsx
import React from "react";
import { View, Text, StyleSheet, Platform, TouchableOpacity, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";

interface PanelTitleSectionProps {
  panelName: string;
  onBackPress?: () => void;
  showBackButton?: boolean;
}

export default function PanelTitleSection({
  panelName,
  onBackPress,
  showBackButton = false
}: PanelTitleSectionProps) {
  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        {/* Back Button */}
        {showBackButton && onBackPress && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
            activeOpacity={0.7}
          >
            <Image
              source={require("../../../../assets/Images/icons/chevron_down_orange.png")}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}

        <Text style={styles.title}>{panelName}</Text>

        {/* Spacer to keep title centered when back button is present */}
        {showBackButton && <View style={styles.spacer} />}
      </View>

      {/* Bottom Orange Separator */}
      <LinearGradient
        colors={["#FD7332", "#B92011"]}
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
    backgroundColor: "transparent",
    overflow: "hidden",
    marginBottom: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
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
    justifyContent: "center", // Center the text
    paddingVertical: 10,
    paddingHorizontal: 20,
    minHeight: 64,
    backgroundColor: "transparent",
    position: "relative",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 24,
    marginTop: 6,
    fontFamily: "Lato-Bold",
    textAlign: "center",
    flex: 1,
  },
  backButton: {
    position: "absolute",
    left: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  backIcon: {
    width: 24,
    height: 24,
    transform: [{ rotate: "90deg" }], // Rotate 90 degrees clockwise to face left
    tintColor: "#FD7332",
  },
  spacer: {
    width: 56, // Same width as back button + padding to balance the layout
  },
  accentBorder: {
    height: 3,
    width: "100%",
  },
});
