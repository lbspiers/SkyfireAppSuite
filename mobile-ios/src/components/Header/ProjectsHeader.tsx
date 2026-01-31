// src/components/Header/ProjectsHeader.tsx
import React from "react";
import {
  View,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  TextInput,
  StatusBar,
  Platform,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useResponsive } from "../../utils/responsive";
import { BLUE_2C_BT, BLUE_LIGHT_MD_TB, ORANGE_LR, ORANGE_TB } from "../../styles/gradient";
import FlameToggleButton from "../FlameToggleButton";

type Props = {
  onDrawerPress: () => void;
  onSearchFocus?: () => void;
  onSortPress: () => void;
  onNewProject: () => void;
  searchQuery: string;
  onSearchChange: (text: string) => void;
};

const sortIcon = require("../../assets/Images/icons/Sort_Orange_FD7332.png");
const searchIcon = require("../../assets/Images/icons/Magnifying_Glass_Orange_FD7332.png");
const flameIcon = require("../../assets/Images/appIcon.png");
const plusIcon = require("../../assets/Images/icons/plus_icon_white.png");

export default function ProjectsHeader({
  onDrawerPress,
  onSearchFocus,
  onSortPress,
  onNewProject,
  searchQuery,
  onSearchChange,
}: Props) {
  const { moderateScale, verticalScale, font } = useResponsive();

  return (
    <>
      {/* Make the status bar translucent so our gradient shows behind it */}
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <LinearGradient {...BLUE_LIGHT_MD_TB} style={{ width: "100%" }}>
        {/* Title + Drawer Icon Row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: moderateScale(20),
            paddingTop: StatusBar.currentHeight || verticalScale(35),
            marginBottom: verticalScale(5),
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: font(28),
                color: "#FFF",
                fontWeight: "700",
                fontFamily: "Lato-Bold",
              }}
            >
              Projects
            </Text>
          </View>
          <View
            style={{
              width: moderateScale(58),
              height: moderateScale(58),
              position: "relative",
            }}
          >
            <FlameToggleButton top={0} right={0} />
          </View>
        </View>

        {/* Top separator after title */}
        <LinearGradient
          {...ORANGE_LR}
          start={ORANGE_LR.start}
          end={ORANGE_LR.end}
          locations={[0, 1]}
          style={{
            height: 1,
            width: "100%",
            borderRadius: moderateScale(2),
          }}
        />

      {/* Controls Section */}
      <View style={[styles.container, { backgroundColor: "transparent" }]}>
        {/* Search Bar + Sort Icon Row */}
        <View
          style={[
            styles.searchRow,
            {
              paddingHorizontal: moderateScale(20),
              gap: moderateScale(10),
              paddingTop: verticalScale(10),
              paddingBottom: verticalScale(10),
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.sortButton, { padding: moderateScale(8) }]}
            onPress={onSortPress}
            accessibilityRole="button"
            accessibilityLabel="Sort and Filter"
          >
            <Image
              source={sortIcon}
              style={{
                width: moderateScale(28),
                height: moderateScale(28),
                resizeMode: "contain",
              }}
            />
          </TouchableOpacity>

          <View style={{ flex: 1, position: "relative" }}>
            <LinearGradient
              {...BLUE_2C_BT}
              style={[
                styles.searchBox,
                {
                  height: moderateScale(44),
                  borderRadius: moderateScale(4),
                  borderWidth: 1,
                  borderColor: searchQuery ? "#FD7332" : "#888888",
                  paddingHorizontal: moderateScale(12),
                  paddingRight: moderateScale(40),
                },
              ]}
            >
              <TextInput
                placeholder="Search by name, ID, address, AHJ, utility…"
                placeholderTextColor="#bbb"
                value={searchQuery}
                onChangeText={onSearchChange}
                onFocus={onSearchFocus}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  flex: 1,
                  fontSize: moderateScale(14),
                  color: "#FFFFFF",
                  paddingVertical: 0,
                  paddingHorizontal: 0,
                  minHeight: moderateScale(20),
                }}
              />
            </LinearGradient>
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                right: moderateScale(8),
                top: "50%",
                transform: [{ translateY: -moderateScale(12) }],
                zIndex: 10,
              }}
            >
              <Image
                source={searchIcon}
                style={{
                  width: moderateScale(28),
                  height: moderateScale(28),
                  resizeMode: "contain",
                }}
              />
            </View>
          </View>
        </View>

        {/* New Project Button Row */}
        <View
          style={{
            paddingHorizontal: moderateScale(20),
            paddingBottom: verticalScale(10),
            flexDirection: "row",
            alignItems: "center",
            gap: moderateScale(10),
          }}
        >
          {/* New Project Pill Button */}
          <View
            style={[
              styles.newProjectPill,
              {
                borderRadius: moderateScale(25),
                paddingVertical: verticalScale(7),
                paddingHorizontal: moderateScale(20),
                borderWidth: 1,
                borderColor: "#FD7332",
                backgroundColor: "transparent",
              },
            ]}
          >
            <TouchableOpacity
              onPress={onNewProject}
              style={styles.newProjectButton}
              accessibilityRole="button"
              accessibilityLabel="Create new project"
            >
              <Image
                source={flameIcon}
                style={{
                  width: moderateScale(28),
                  height: moderateScale(28),
                  tintColor: "#FD7332",
                }}
                resizeMode="contain"
              />
              <Text style={[styles.newProjectText, { fontSize: font(20) }]}>
                New Project
              </Text>
              <View style={{ marginLeft: "auto" }}>
                <Image
                  source={plusIcon}
                  style={{
                    width: moderateScale(24),
                    height: moderateScale(24),
                    tintColor: "#FD7332",
                  }}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom separator */}
        <LinearGradient
          {...ORANGE_TB}
          style={{
            height: 1,
            width: "100%",
          }}
        />
      </View>
    </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  newProjectPill: {
    width: "100%",
  },
  newProjectButton: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  newProjectText: {
    color: "#FFF",
    fontWeight: "700",
    marginLeft: 12,
  },
});
