// src/components/AttestationModal.tsx
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Button from "./Button";
import ReviewRadialButton from "../screens/ReviewPage/ReviewRadialButton";

interface AttestationModalProps {
  visible: boolean;
  onConfirm: () => Promise<void> | void; // allow async
  onCancel: () => void;
  loading?: boolean; // NEW
}

const AttestationModal: React.FC<AttestationModalProps> = ({
  visible,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const [checked, setChecked] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Confirm</Text>
          <Text style={styles.description}>
            I confirm that all project information has been reviewed and is
            accurate to the best of my knowledge.
          </Text>

          <View style={styles.radialButtonContainer}>
            <ReviewRadialButton
              label="I acknowledge and agree to the above"
              selected={checked}
              onToggle={() => !loading && setChecked((prev) => !prev)}
              disabled={loading}
              labelStyle={styles.radialLabel}
            />
          </View>

          <View style={styles.buttonRow}>
            <Button
              title="Cancel"
              onPress={onCancel}
              disabled={loading}
              selected={false}
              width="48%"
              height={44}
              style={styles.cancelButton}
            />

            {loading ? (
              <Button
                title=""
                onPress={() => {}}
                disabled={true}
                selected={true}
                width="48%"
                height={44}
                style={styles.confirmButton}
              >
                <ActivityIndicator color="#FFF" />
              </Button>
            ) : (
              <Button
                title="Confirm"
                onPress={onConfirm}
                disabled={!checked}
                selected={true}
                width="48%"
                height={44}
                style={styles.confirmButton}
              />
            )}
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
    padding: 24,
    backgroundColor: "#2E4161",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#888888",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: "#EEE",
    marginBottom: 20,
  },
  radialButtonContainer: {
    marginBottom: 24,
  },
  radialLabel: {
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 4,
  },
  cancelButton: {
    marginVertical: 0,
  },
  confirmButton: {
    marginVertical: 0,
  },
});

export default AttestationModal;
