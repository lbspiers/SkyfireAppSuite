import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  title?: string;
  children: React.ReactNode;
};

const FormSection: React.FC<Props> = ({ title, children }) => {
  return (
    <View style={styles.section}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
});

export default FormSection;
