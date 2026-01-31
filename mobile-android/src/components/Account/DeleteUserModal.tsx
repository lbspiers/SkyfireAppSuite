// src/components/Account/DeleteUserModal.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useResponsive } from "../../utils/responsive";

interface DeleteUserModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  userName: string;
  userEmail: string;
}

export default function DeleteUserModal({
  visible,
  onClose,
  onConfirm,
  userName,
  userEmail,
}: DeleteUserModalProps) {
  const [deleting, setDeleting] = useState(false);

  const { moderateScale, verticalScale, font } = useResponsive();
  const styles = makeStyles({ moderateScale, verticalScale, font });

  const handleClose = () => {
    if (deleting) return;
    onClose();
  };

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      handleClose();
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.warningTitle}>⚠️ Remove Team Member</Text>

            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                You are about to remove{" "}
                <Text style={styles.boldText}>{userName}</Text> from your
                company.
              </Text>

              <Text style={styles.emailText}>{userEmail}</Text>

              <Text style={styles.infoText}>
                User will be set to inactive status and unlinked from your company. They will no longer be able to log in.
              </Text>

              <Text style={styles.warningSubtext}>
                This action is permanent and cannot be undone.
              </Text>
              <Text style={styles.warningSubtext}>
                Are you absolutely sure?
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={deleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dangerButton}
                onPress={handleConfirm}
                disabled={deleting}
              >
                <LinearGradient
                  colors={["#FF6B6B", "#E53E3E"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.dangerButtonGradient}
                >
                  {deleting ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.dangerButtonText}>Remove User</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = ({
  moderateScale,
  verticalScale,
  font,
}: {
  moderateScale: (n: number) => number;
  verticalScale: (n: number) => number;
  font: (n: number) => number;
}) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      width: "90%",
      maxWidth: moderateScale(400),
    },
    modalContent: {
      backgroundColor: "#1D2A4F",
      borderRadius: moderateScale(12),
      padding: moderateScale(20),
      borderWidth: 1,
      borderColor: "#FF6B6B",
    },
    warningTitle: {
      fontSize: font(22),
      fontWeight: "700",
      color: "#FF6B6B",
      marginBottom: verticalScale(20),
      textAlign: "center",
    },
    warningBox: {
      backgroundColor: "rgba(255, 107, 107, 0.1)",
      borderRadius: moderateScale(8),
      padding: moderateScale(16),
      marginBottom: verticalScale(24),
      borderWidth: 1,
      borderColor: "rgba(255, 107, 107, 0.3)",
    },
    warningText: {
      fontSize: font(16),
      color: "#FFF",
      marginBottom: verticalScale(12),
      lineHeight: font(22),
      textAlign: "center",
    },
    boldText: {
      fontWeight: "700",
      color: "#FD7332",
    },
    emailText: {
      fontSize: font(14),
      color: "#FFF",
      opacity: 0.8,
      textAlign: "center",
      marginBottom: verticalScale(16),
    },
    infoText: {
      fontSize: font(14),
      color: "#FFF",
      lineHeight: font(20),
      textAlign: "center",
      marginBottom: verticalScale(16),
    },
    warningSubtext: {
      fontSize: font(14),
      color: "#FF6B6B",
      fontWeight: "600",
      textAlign: "center",
      marginTop: verticalScale(4),
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      gap: moderateScale(12),
    },
    cancelButton: {
      flex: 1,
      paddingVertical: verticalScale(12),
      paddingHorizontal: moderateScale(20),
      borderRadius: moderateScale(8),
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.3)",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      alignItems: "center",
    },
    cancelButtonText: {
      fontSize: font(16),
      fontWeight: "500",
      color: "#FFF",
    },
    dangerButton: {
      flex: 1,
    },
    dangerButtonGradient: {
      paddingVertical: verticalScale(12),
      paddingHorizontal: moderateScale(20),
      borderRadius: moderateScale(8),
      alignItems: "center",
    },
    dangerButtonText: {
      fontSize: font(16),
      fontWeight: "600",
      color: "#FFF",
    },
  });
