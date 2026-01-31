// src/components/Account/AddUserModal.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useResponsive } from "../../utils/responsive";
import { ORANGE_TB, BLUE_2C_BT } from "../../styles/gradient";
import {
  addCompanyUser,
  validateEmail,
  AddUserRequest,
} from "../../services/teamAPI";
// TODO: Custom keyboard disabled for add user modal - will be re-enabled later
// import CustomTextInput from "../CustomKeyboard/CustomTextInput";
import NumericKeypad from "../NumericKeypad";
// import CustomKeyboard from "../CustomKeyboard";
// import { useGlobalKeyboard } from "../CustomKeyboard/GlobalKeyboardProvider";

interface AddUserModalProps {
  visible: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export default function AddUserModal({
  visible,
  onClose,
  onUserAdded,
}: AddUserModalProps) {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [phoneKeypadVisible, setPhoneKeypadVisible] = useState(false);
  const [tempPhone, setTempPhone] = useState("");

  const { moderateScale, verticalScale, font } = useResponsive();
  const styles = makeStyles({ moderateScale, verticalScale, font });

  // TODO: Custom keyboard disabled - will be re-enabled later
  // Access global keyboard state and config
  // const { isVisible: isKeyboardVisible, focusedFieldId, keyboardConfig, disableGlobalRender } = useGlobalKeyboard();

  // Disable global keyboard rendering when modal is open
  // useEffect(() => {
  //   disableGlobalRender(visible);
  //   return () => {
  //     disableGlobalRender(false); // Re-enable when modal closes
  //   };
  // }, [visible, disableGlobalRender]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate First Name
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    // Validate Last Name
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    // Validate Email
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone is optional, but validate if provided
    if (formData.phone.trim()) {
      const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, "");
      if (cleanPhone.length < 10) {
        newErrors.phone = "Please enter a valid phone number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const userData: AddUserRequest = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
      };

      const result = await addCompanyUser(userData);

      if (result.status === "SUCCESS") {
        Alert.alert(
          "Invite Sent! 📧",
          `${formData.firstName} ${formData.lastName} will receive an email with their invite code. The code expires in 24 hours.`,
          [
            {
              text: "Got it",
              onPress: () => {
                resetForm();
                onClose(); // Close the modal
                onUserAdded(); // Refresh team list
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", result.message || "Failed to add user");
      }
    } catch (error: any) {
      console.error("Add user error:", error);

      // Enhanced error handling
      let errorMessage = "Unable to add user. Please try again.";

      if (error?.message?.toLowerCase().includes('unauthorized')) {
        errorMessage = "You don't have permission to add team members. Please contact your company administrator.";
      } else if (error?.message?.toLowerCase().includes('duplicate') ||
                 error?.message?.toLowerCase().includes('already exists')) {
        errorMessage = "A user with this email address already exists in your company.";
      } else if (error?.message?.toLowerCase().includes('invalid email')) {
        errorMessage = "Please provide a valid email address.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  console.log('🔧 [AddUserModal] Rendering, visible:', visible);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
      presentationStyle="overFullScreen"
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={["#2E4161", "#1D2A4F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.modalContent}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <LinearGradient
                colors={ORANGE_TB.colors}
                start={ORANGE_TB.start}
                end={ORANGE_TB.end}
                style={styles.header}
              >
                <Text style={styles.headerTitle}>Add Team Member</Text>
                <Text style={styles.headerSubtitle}>
                  User will be automatically added to your company
                </Text>
              </LinearGradient>

              {/* Form */}
              <View style={styles.form}>
                {/* TODO: Using native TextInput for hardware keyboard - custom keyboard will be re-enabled later */}

                {/* First Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>First Name *</Text>
                  <LinearGradient
                    {...BLUE_2C_BT}
                    style={[
                      styles.inputGradientBorder,
                      {
                        borderWidth: moderateScale(2),
                        borderColor: formData.firstName ? "#FD7332" : "#888888",
                      },
                    ]}
                  >
                    <TextInput
                      placeholder="Enter first name"
                      placeholderTextColor="#888"
                      value={formData.firstName}
                      onChangeText={(text) => {
                        setFormData({ ...formData, firstName: text });
                        setErrors({ ...errors, firstName: undefined });
                      }}
                      autoCapitalize="words"
                      returnKeyType="next"
                      editable={!loading}
                      style={styles.textInput}
                    />
                  </LinearGradient>
                  {errors.firstName && (
                    <Text style={styles.errorText}>{errors.firstName}</Text>
                  )}
                </View>

                {/* Last Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Last Name *</Text>
                  <LinearGradient
                    {...BLUE_2C_BT}
                    style={[
                      styles.inputGradientBorder,
                      {
                        borderWidth: moderateScale(2),
                        borderColor: formData.lastName ? "#FD7332" : "#888888",
                      },
                    ]}
                  >
                    <TextInput
                      placeholder="Enter last name"
                      placeholderTextColor="#888"
                      value={formData.lastName}
                      onChangeText={(text) => {
                        setFormData({ ...formData, lastName: text });
                        setErrors({ ...errors, lastName: undefined });
                      }}
                      autoCapitalize="words"
                      returnKeyType="next"
                      editable={!loading}
                      style={styles.textInput}
                    />
                  </LinearGradient>
                  {errors.lastName && (
                    <Text style={styles.errorText}>{errors.lastName}</Text>
                  )}
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address *</Text>
                  <LinearGradient
                    {...BLUE_2C_BT}
                    style={[
                      styles.inputGradientBorder,
                      {
                        borderWidth: moderateScale(2),
                        borderColor: formData.email ? "#FD7332" : "#888888",
                      },
                    ]}
                  >
                    <TextInput
                      placeholder="user@company.com"
                      placeholderTextColor="#888"
                      value={formData.email}
                      onChangeText={(text) => {
                        setFormData({ ...formData, email: text });
                        setErrors({ ...errors, email: undefined });
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      returnKeyType="done"
                      editable={!loading}
                      style={styles.textInput}
                    />
                  </LinearGradient>
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </View>

                {/* Phone (Optional) */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number (Optional)</Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (!loading) {
                        setTempPhone(formData.phone);
                        setPhoneKeypadVisible(true);
                      }
                    }}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={
                        errors.phone ? ["#FF6B6B", "#FF6B6B"] : BLUE_2C_BT.colors
                      }
                      start={BLUE_2C_BT.start}
                      end={BLUE_2C_BT.end}
                      style={styles.inputGradientBorder}
                    >
                      <View style={styles.input}>
                        <Text
                          style={[
                            styles.phoneText,
                            {
                              color: formData.phone ? "#FFF" : "#888",
                            },
                          ]}
                        >
                          {formData.phone || "(555) 123-4567"}
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                  {errors.phone && (
                    <Text style={styles.errorText}>{errors.phone}</Text>
                  )}
                </View>

                {/* Info Notice */}
                <View style={styles.noticeContainer}>
                  <Text style={styles.noticeIcon}>ℹ️</Text>
                  <Text style={styles.noticeText}>
                    The new user will be able to access all company projects and
                    data. They will need to set their password on first login.
                  </Text>
                </View>
              </View>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading}
                  style={styles.submitButtonWrapper}
                >
                  <LinearGradient
                    colors={ORANGE_TB.colors}
                    start={ORANGE_TB.start}
                    end={ORANGE_TB.end}
                    style={styles.submitButton}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.submitButtonText}>Add User</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>

      {/* NumericKeypad for Phone Number */}
      <NumericKeypad
        isVisible={phoneKeypadVisible}
        currentValue={tempPhone}
        title="Phone Number"
        onNumberPress={(num) => {
          setTempPhone((prev) => prev + num);
        }}
        onBackspace={() => {
          setTempPhone((prev) => prev.slice(0, -1));
        }}
        onClose={() => {
          setFormData({ ...formData, phone: tempPhone });
          setErrors({ ...errors, phone: undefined });
          setPhoneKeypadVisible(false);
        }}
      />

      {/* TODO: Custom keyboard rendering disabled - will be re-enabled later */}
      {/* Render Custom Keyboard inside Modal */}
      {/* {isKeyboardVisible && focusedFieldId && (
        <View style={styles.keyboardWrapper}>
          <CustomKeyboard
            visible={isKeyboardVisible}
            fieldId={keyboardConfig.fieldId}
            onKeyPress={keyboardConfig.onKeyPress}
            onBackspace={keyboardConfig.onBackspace}
            onEnter={keyboardConfig.onEnter}
            onTextChange={keyboardConfig.onTextChange}
            returnKeyType={keyboardConfig.returnKeyType}
            autoCapitalize={keyboardConfig.autoCapitalize}
            enableHapticFeedback={keyboardConfig.enableHapticFeedback}
            showSuggestions={keyboardConfig.showSuggestions}
            theme={keyboardConfig.theme || "dark"}
          />
        </View>
      )} */}
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
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      width: "90%",
      maxWidth: moderateScale(500),
      maxHeight: "85%",
      height: "auto",
      borderRadius: moderateScale(16),
      overflow: "hidden",
      backgroundColor: "#2E4161",
    },
    modalContainerWithKeyboard: {
      maxHeight: "60%", // Reduce height when keyboard is visible
      marginBottom: verticalScale(280), // Push modal up to sit above keyboard
    },
    modalContent: {
      minHeight: verticalScale(400), // ADD THIS
    },
    scrollContent: {
      flexGrow: 1,
    },
    header: {
      paddingVertical: verticalScale(24),
      paddingHorizontal: moderateScale(20),
      alignItems: "center",
    },
    headerTitle: {
      fontSize: font(24),
      fontWeight: "700",
      color: "#FFF",
      marginBottom: verticalScale(6),
    },
    headerSubtitle: {
      fontSize: font(14),
      color: "#FFF",
      opacity: 0.9,
      textAlign: "center",
    },
    form: {
      paddingHorizontal: moderateScale(20),
      paddingVertical: verticalScale(24),
    },
    inputGroup: {
      marginBottom: verticalScale(20),
    },
    label: {
      fontSize: font(16),
      fontWeight: "600",
      color: "#FFF",
      marginBottom: verticalScale(8),
    },
    required: {
      color: "#FD7332",
    },
    inputGradientBorder: {
      borderRadius: moderateScale(8),
      padding: moderateScale(1.5),
    },
    input: {
      backgroundColor: "#1D2A4F",
      borderRadius: moderateScale(6.5),
      paddingVertical: verticalScale(12),
      paddingHorizontal: moderateScale(16),
      fontSize: font(16),
      color: "#FFF",
    },
    textInput: {
      backgroundColor: "#1D2A4F",
      borderRadius: moderateScale(6.5),
      paddingVertical: verticalScale(12),
      paddingHorizontal: moderateScale(16),
      fontSize: font(16),
      color: "#FFF",
    },
    phoneText: {
      fontSize: font(16),
      color: "#FFF",
    },
    errorText: {
      fontSize: font(13),
      color: "#FF6B6B",
      marginTop: verticalScale(4),
      marginLeft: moderateScale(4),
    },
    noticeContainer: {
      flexDirection: "row",
      backgroundColor: "rgba(253, 115, 50, 0.1)",
      borderRadius: moderateScale(8),
      padding: moderateScale(14),
      marginTop: verticalScale(8),
      borderWidth: 1,
      borderColor: "rgba(253, 115, 50, 0.3)",
    },
    noticeIcon: {
      fontSize: font(18),
      marginRight: moderateScale(10),
    },
    noticeText: {
      flex: 1,
      fontSize: font(13),
      color: "#FFF",
      opacity: 0.85,
      lineHeight: font(18),
    },
    buttonContainer: {
      flexDirection: "row",
      paddingHorizontal: moderateScale(20),
      paddingBottom: verticalScale(24),
      gap: moderateScale(12),
    },
    cancelButton: {
      flex: 1,
      paddingVertical: verticalScale(14),
      borderRadius: moderateScale(8),
      borderWidth: 1.5,
      borderColor: "rgba(255, 255, 255, 0.3)",
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      alignItems: "center",
    },
    cancelButtonText: {
      fontSize: font(16),
      fontWeight: "600",
      color: "#FFF",
      opacity: 0.8,
    },
    submitButtonWrapper: {
      flex: 1,
    },
    submitButton: {
      paddingVertical: verticalScale(14),
      borderRadius: moderateScale(8),
      alignItems: "center",
      justifyContent: "center",
    },
    submitButtonText: {
      fontSize: font(16),
      fontWeight: "600",
      color: "#FFF",
    },
    keyboardWrapper: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 10000,
      elevation: 10000,
    },
  });
