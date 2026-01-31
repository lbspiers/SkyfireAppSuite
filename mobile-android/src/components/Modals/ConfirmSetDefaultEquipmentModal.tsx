// src/components/Modals/ConfirmSetDefaultEquipmentModal.tsx

import React from "react";
import { Modal, View, Text, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Button from "../Button";

interface ConfirmSetDefaultEquipmentModalProps {
  visible: boolean;
  equipmentType: string; // e.g., "Solar Panel"
  make: string;
  model: string;
  hasExistingDefault: boolean; // If true, shows "Change" message instead of "Set"
  existingDefaultMake?: string;
  existingDefaultModel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmSetDefaultEquipmentModal: React.FC<ConfirmSetDefaultEquipmentModalProps> = ({
  visible,
  equipmentType,
  make,
  model,
  hasExistingDefault,
  existingDefaultMake,
  existingDefaultModel,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Set Default Equipment</Text>
          </View>

          <LinearGradient
            colors={["#FD7332", "#B92011"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.separator}
          />

          <View style={styles.content}>
            {hasExistingDefault && existingDefaultMake && existingDefaultModel ? (
              <>
                <Text style={styles.questionText}>Change default equipment to</Text>
                <Text style={styles.equipmentText}>{make} {model}</Text>
                <Text style={styles.subText}>
                  This will replace the current default ({existingDefaultMake} {existingDefaultModel})
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.questionText}>Set this equipment as default?</Text>
                <Text style={styles.equipmentText}>{make} {model}</Text>
              </>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <Button title="No" onPress={onCancel} deactivated={true} />
            <Button title="Yes" onPress={onConfirm} selected={true} />
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    borderRadius: 12,
    overflow: "hidden",
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter",
  },
  separator: {
    height: 2,
    width: "100%",
  },
  content: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  questionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "400",
    fontFamily: "Inter",
    textAlign: "center",
    marginBottom: 12,
  },
  equipmentText: {
    color: "#FD7332",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter",
    textAlign: "center",
    marginBottom: 8,
  },
  subText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "400",
    fontFamily: "Inter",
    textAlign: "center",
    opacity: 0.8,
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
});

export default ConfirmSetDefaultEquipmentModal;
