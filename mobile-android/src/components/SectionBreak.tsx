// src/components/SectionBreak.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import { divider } from "../theme/theme";

const SectionBreak: React.FC = () => {
  return <View style={styles.divider} />;
};

const styles = StyleSheet.create({
  divider: {
    height: divider.thickness,
    backgroundColor: divider.color,
    width: "100%",
    marginVertical: divider.marginVertical,
  },
});

export default SectionBreak;
