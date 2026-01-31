import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { spacing, radii, typography } from "../../theme/theme";

interface SortModalProps {
  visible: boolean;
  current: string;
  onApply: (option: string) => void;
  onClose: () => void;
}

const OPTIONS = [
  "Last Name (A → Z)", 
  "Last Name (Z → A)", 
  "Created Date (Newest → Oldest)", 
  "Created Date (Oldest → Newest)"
];

export default function SortModal({
  visible,
  current,
  onApply,
  onClose,
}: SortModalProps) {
  const [selected, setSelected] = useState(current);

  const applyAndClose = () => {
    onApply(selected);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={[typography.h2, { marginBottom: spacing.sm, color: "#FFF", textAlign: "center" }]}>
            Sort Projects
          </Text>

          {OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => setSelected(opt)}
              style={styles.option}
            >
              <View
                style={[
                  styles.radioOuter,
                  selected === opt && styles.radioOuterSelected,
                ]}
              >
                {selected === opt && <View style={styles.radioInner} />}
              </View>
              <Text style={[typography.body, { marginLeft: spacing.sm, color: "#FFF", fontWeight: "500" }]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.buttons}>
            <TouchableOpacity onPress={onClose} style={[styles.btn, styles.cancelBtn]}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={applyAndClose}
              style={[styles.btn, styles.applyBtn]}
            >
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 20,
  },
  sheet: {
    backgroundColor: "#1D2A4F",
    padding: spacing.md,
    borderRadius: 12,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(253, 115, 50, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(253, 115, 50, 0.2)",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#999",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    borderColor: "#FD7332",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FD7332",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.md,
    gap: 12,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  applyBtn: {
    backgroundColor: "#FD7332",
  },
  cancelText: {
    color: "#FFF",
    fontWeight: "500",
  },
  applyText: {
    color: "#FFF",
    fontWeight: "600",
  },
});
