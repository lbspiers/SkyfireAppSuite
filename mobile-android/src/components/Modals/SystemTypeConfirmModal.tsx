import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface SystemTypeConfirmModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  selectedType: "Microinverter" | "Inverter";
}

const SystemTypeConfirmModal: React.FC<SystemTypeConfirmModalProps> = ({
  visible,
  onConfirm,
  onCancel,
  selectedType,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Confirm System Type</Text>
          <Text style={styles.description}>
            Are you sure you want to configure this system as{" "}
            <Text style={styles.highlight}>{selectedType}</Text>?
          </Text>
          <Text style={styles.note}>
            Once confirmed, the system type will be locked. You can edit it
            later by tapping "Edit".
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    padding: 20,
    backgroundColor: "#2E4161",
    borderRadius: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#EEE",
    marginBottom: 10,
  },
  highlight: {
    fontWeight: "700",
    color: "#FD7332",
  },
  note: {
    fontSize: 14,
    color: "#BBB",
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#555",
  },
  confirmButton: {
    backgroundColor: "#FD7332",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "700",
  },
});

export default SystemTypeConfirmModal;
