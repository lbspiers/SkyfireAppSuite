// src/components/Account/DeleteAccountModal.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { deleteUserAccount } from "../../services/accountAPI";
import { useResponsive } from "../../utils/responsive";

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onAccountDeleted: () => void;
  userEmail: string;
}

export default function DeleteAccountModal({
  visible,
  onClose,
  onAccountDeleted,
  userEmail,
}: DeleteAccountModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const { moderateScale, verticalScale, font } = useResponsive();
  const styles = makeStyles({ moderateScale, verticalScale, font });

  const handleClose = () => {
    if (deleting) return;
    setStep(1);
    setConfirmText("");
    onClose();
  };

  const handleFirstConfirm = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and remove all your personal information.\n\nThis action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => setStep(2),
        },
      ]
    );
  };

  const handleFinalDelete = async () => {
    if (confirmText.trim().toUpperCase() !== "DELETE") {
      Alert.alert("Error", "Please type 'DELETE' exactly as shown");
      return;
    }

    setDeleting(true);
    try {
      const result = await deleteUserAccount();

      if (result.status === "SUCCESS") {
        Alert.alert(
          "Account Deleted",
          "Your account has been successfully deleted.",
          [
            {
              text: "OK",
              onPress: () => {
                handleClose();
                onAccountDeleted();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          result.message || "Failed to delete account. Please try again."
        );
      }
    } catch (error: any) {
      console.error("Account deletion error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete account. Please check your connection.";
      Alert.alert("Error", errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const renderStepOne = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.warningTitle}>⚠️ Delete Account</Text>

      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          This will permanently delete your account and remove all your personal
          information:
        </Text>

        <View style={styles.warningList}>
          <Text style={styles.warningItem}>• Your profile information</Text>
          <Text style={styles.warningItem}>• Personal account data</Text>
          <Text style={styles.warningItem}>• Login credentials</Text>
          <Text style={styles.warningItem}>• Account settings</Text>
        </View>

        <Text style={styles.warningSubtext}>This action cannot be undone.</Text>
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
          onPress={handleFirstConfirm}
          disabled={deleting}
        >
          <LinearGradient
            colors={["#FF6B6B", "#E53E3E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.dangerButtonGradient}
          >
            <Text style={styles.dangerButtonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStepTwo = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.confirmTitle}>Final Confirmation</Text>

      <Text style={styles.confirmText}>
        To confirm deletion of your account ({userEmail}), please type:
      </Text>

      <Text style={styles.confirmPhrase}>DELETE</Text>

      <TextInput
        style={styles.confirmInput}
        value={confirmText}
        onChangeText={setConfirmText}
        placeholder="Type here to confirm..."
        placeholderTextColor="#888"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!deleting}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setStep(1)}
          disabled={deleting}
        >
          <Text style={styles.cancelButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.dangerButton,
            confirmText.trim().toUpperCase() !== "DELETE" &&
              styles.buttonDisabled,
          ]}
          onPress={handleFinalDelete}
          disabled={deleting || confirmText.trim().toUpperCase() !== "DELETE"}
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
              <Text style={styles.dangerButtonText}>Delete Account</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

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
            {step === 1 ? renderStepOne() : renderStepTwo()}
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
    stepContainer: {
      alignItems: "center",
    },
    warningTitle: {
      fontSize: font(22),
      fontWeight: "700",
      color: "#FF6B6B",
      marginBottom: verticalScale(20),
      textAlign: "center",
    },
    confirmTitle: {
      fontSize: font(20),
      fontWeight: "600",
      color: "#FF6B6B",
      marginBottom: verticalScale(16),
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
    },
    warningList: {
      marginBottom: verticalScale(12),
    },
    warningItem: {
      fontSize: font(15),
      color: "#FFF",
      marginBottom: verticalScale(4),
      lineHeight: font(20),
    },
    warningSubtext: {
      fontSize: font(14),
      color: "#FF6B6B",
      fontWeight: "600",
      textAlign: "center",
    },
    confirmText: {
      fontSize: font(16),
      color: "#FFF",
      textAlign: "center",
      marginBottom: verticalScale(12),
      lineHeight: font(22),
    },
    confirmPhrase: {
      fontSize: font(18),
      color: "#FF6B6B",
      fontWeight: "600",
      textAlign: "center",
      marginBottom: verticalScale(16),
      backgroundColor: "rgba(255, 107, 107, 0.1)",
      paddingVertical: verticalScale(8),
      paddingHorizontal: moderateScale(12),
      borderRadius: moderateScale(6),
    },
    confirmInput: {
      backgroundColor: "#2A3B5C",
      borderRadius: moderateScale(8),
      paddingHorizontal: moderateScale(16),
      paddingVertical: verticalScale(12),
      fontSize: font(16),
      color: "#FFF",
      borderWidth: 1,
      borderColor: "rgba(255, 107, 107, 0.3)",
      marginBottom: verticalScale(24),
      width: "100%",
      textAlign: "center",
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
    buttonDisabled: {
      opacity: 0.5,
    },
  });
