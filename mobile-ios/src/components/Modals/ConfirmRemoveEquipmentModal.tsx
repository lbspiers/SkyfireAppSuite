// src/components/Modals/ConfirmRemoveEquipmentModal.tsx

import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Button from "../Button";

interface ConfirmRemoveEquipmentModalProps {
  visible: boolean;
  equipmentType: string; // e.g., "Solar Panel"
  make: string;
  model: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmRemoveEquipmentModal: React.FC<ConfirmRemoveEquipmentModalProps> = ({
  visible,
  equipmentType,
  make,
  model,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={["#2E4161", "#0C1F3F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.modalContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>Remove Equipment</Text>
          </View>

          {/* Orange separator */}
          <LinearGradient
            colors={["#FD7332", "#B92011"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.separator}
          />

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.questionText}>
              Are you sure you want to remove
            </Text>
            <Text style={styles.equipmentText}>
              {make} {model}
            </Text>
            <Text style={styles.subText}>
              from your preferred {equipmentType.toLowerCase()} list?
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              onPress={onCancel}
              width="48%"
              height={45}
              rounded={40}
              deactivated={true}
            />
            <Button
              title="Remove"
              onPress={onConfirm}
              width="48%"
              height={45}
              rounded={40}
              selected={true}
            />
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: Dimensions.get("window").width * 0.85,
    maxWidth: 375,
    borderRadius: 45,
    padding: 20,
    paddingTop: 30,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 16,
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter",
    textAlign: "center",
  },
  separator: {
    height: 2,
    width: "100%",
    marginBottom: 24,
  },
  content: {
    marginBottom: 32,
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
    color: "#FFFFFF",
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
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
});

export default ConfirmRemoveEquipmentModal;
