// src/components/ProjectsHeader.tsx

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import SectionBreak from "./SectionBreak";
import FlameToggleButton from "./FlameToggleButton";

const ProjectsHeader = () => {
  return (
    <View>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Projects</Text>
        <View style={styles.flameContainer}>
          <FlameToggleButton top={0} right={0} />
        </View>
      </View>
      <SectionBreak />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    // Removed backgroundColor to eliminate black background
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  flameContainer: {
    width: 58,
    height: 58,
    position: "relative",
  },
});

export default ProjectsHeader;
