// src/components/Account/AccountInfoForm.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import {
  UserProfile,
  updateUserProfile,
  validateEmail,
  validatePhone,
  changePassword,
} from "../../services/accountAPI";
import { useResponsive } from "../../utils/responsive";
import { LTORANGE } from "../../styles/gradient";

interface AccountInfoFormProps {
  userProfile: UserProfile;
  onProfileUpdated: (profile: UserProfile) => void;
  disabled?: boolean;
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

export default function AccountInfoForm({
  userProfile,
  onProfileUpdated,
  disabled = false,
}: AccountInfoFormProps) {
  const [formData, setFormData] = useState<FormData>({
    firstName: userProfile.first_name || "",
    lastName: userProfile.last_name || "",
    email: userProfile.email,
    phone: userProfile.phone,
  });

  const [originalData, setOriginalData] = useState<FormData>({
    firstName: userProfile.first_name || "",
    lastName: userProfile.last_name || "",
    email: userProfile.email,
    phone: userProfile.phone,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<{
    [key: string]: string | undefined;
  }>({});
  const [changingPassword, setChangingPassword] = useState(false);

  const { moderateScale, verticalScale, font } = useResponsive();
  const styles = makeStyles({ moderateScale, verticalScale, font });

  // Update form data when userProfile changes
  useEffect(() => {
    const newData = {
      firstName: userProfile.first_name || "",
      lastName: userProfile.last_name || "",
      email: userProfile.email,
      phone: userProfile.phone,
    };
    setFormData(newData);
    setOriginalData(newData);
    setHasChanges(false);
    setIsEditing(false);
  }, [userProfile]);

  // Check for changes
  useEffect(() => {
    const changed = Object.keys(formData).some(
      (key) =>
        formData[key as keyof FormData] !== originalData[key as keyof FormData]
    );
    setHasChanges(changed);
  }, [formData, originalData]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.length < 1) {
      newErrors.firstName = "First name must be at least 1 character";
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.length < 1) {
      newErrors.lastName = "Last name must be at least 1 character";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleChangePassword = async () => {
    // Validate passwords
    const newPasswordErrors: { [key: string]: string } = {};

    if (!passwordData.oldPassword.trim()) {
      newPasswordErrors.oldPassword = "Current password is required";
    }

    if (!passwordData.newPassword.trim()) {
      newPasswordErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 8) {
      newPasswordErrors.newPassword =
        "New password must be at least 8 characters";
    }

    if (!passwordData.confirmPassword.trim()) {
      newPasswordErrors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newPasswordErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newPasswordErrors).length > 0) {
      setPasswordErrors(newPasswordErrors);
      return;
    }

    setChangingPassword(true);
    try {
      const result = await changePassword(
        passwordData.oldPassword,
        passwordData.newPassword
      );

      if (result.status === "SUCCESS") {
        Alert.alert("Success", "Password changed successfully", [
          {
            text: "OK",
            onPress: () => {
              setPasswordData({
                oldPassword: "",
                newPassword: "",
                confirmPassword: "",
              });
              setShowChangePassword(false);
            },
          },
        ]);
      } else {
        Alert.alert("Error", result.message || "Failed to change password");
      }
    } catch (error: any) {
      console.error("Password change error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to change password. Please try again."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordErrors({});
    setShowChangePassword(false);
  };

  const handleSave = async () => {
    if (!validateForm() || loading || disabled) return;

    setLoading(true);
    try {
      const result = await updateUserProfile(formData);

      if (result.status === "SUCCESS" && result.data) {
        setOriginalData(formData);
        setHasChanges(false);
        setIsEditing(false);
        onProfileUpdated(result.data);
        Alert.alert("Success", "Profile updated successfully");
      } else {
        Alert.alert("Error", "Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!hasChanges) return;

    Alert.alert(
      "Discard Changes",
      "Are you sure you want to discard your changes?",
      [
        { text: "Keep Editing", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            setFormData(originalData);
            setErrors({});
            setHasChanges(false);
            setIsEditing(false);
          },
        },
      ]
    );
  };

  const renderField = (
    label: string,
    field: keyof FormData,
    placeholder: string,
    keyboardType: "default" | "email-address" | "phone-pad" = "default",
    autoCapitalize: "none" | "sentences" | "words" | "characters" = "none"
  ) => {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <LinearGradient
          colors={LTORANGE.colors}
          start={LTORANGE.start}
          end={LTORANGE.end}
          style={[
            styles.gradientBorder,
            !!errors[field] && styles.gradientBorderError,
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              !isEditing && styles.textInputReadOnly,
              !!errors[field] && styles.textInputError,
            ]}
            value={formData[field]}
            onChangeText={(value) => handleInputChange(field, value)}
            placeholder={placeholder}
            placeholderTextColor="#888"
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            editable={isEditing && !disabled && !loading}
            selectTextOnFocus={isEditing}
          />
        </LinearGradient>
        {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.titleContainer}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        {!isEditing ? (
          <TouchableOpacity
            onPress={() => setIsEditing(true)}
            disabled={disabled || loading}
            style={styles.editIconButton}
          >
            <Image
              source={require("../../assets/Images/icons/pencil_icon_orange_fd7332.png")}
              style={styles.titleEditIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.editActionsRow}>
            <TouchableOpacity
              onPress={() => {
                setFormData(originalData);
                setErrors({});
                setHasChanges(false);
                setIsEditing(false);
              }}
              disabled={disabled || loading}
              style={styles.editAction}
            >
              <Text style={styles.cancelEditLabel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={disabled || loading || !hasChanges}
              style={styles.editAction}
            >
              <Text style={styles.saveEditLabel}>Save</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {renderField(
        "First Name",
        "firstName",
        "Enter your first name",
        "default",
        "words"
      )}
      {renderField(
        "Last Name",
        "lastName",
        "Enter your last name",
        "default",
        "words"
      )}
      {renderField(
        "Email",
        "email",
        "Enter your email address",
        "email-address"
      )}
      {renderField(
        "Phone Number",
        "phone",
        "Enter your phone number",
        "phone-pad"
      )}

      {/* Change Password Section */}
      <View style={styles.passwordSection}>
        <View style={styles.passwordHeader}>
          <Text style={styles.passwordTitle}>Password</Text>
          {!showChangePassword ? (
            <TouchableOpacity
              onPress={() => setShowChangePassword(true)}
              disabled={disabled || loading}
            >
              <Text style={styles.changePasswordLabel}>Change Password</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleCancelPasswordChange}
              disabled={changingPassword}
            >
              <Text style={styles.cancelEditLabel}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        {showChangePassword && (
          <View style={styles.passwordFields}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Current Password</Text>
              <LinearGradient
                colors={LTORANGE.colors}
                start={LTORANGE.start}
                end={LTORANGE.end}
                style={[
                  styles.gradientBorder,
                  !!passwordErrors.oldPassword && styles.gradientBorderError,
                ]}
              >
                <TextInput
                  style={[
                    styles.textInput,
                    !!passwordErrors.oldPassword && styles.textInputError,
                  ]}
                  value={passwordData.oldPassword}
                  onChangeText={(value) => {
                    setPasswordData((prev) => ({
                      ...prev,
                      oldPassword: value,
                    }));
                    if (passwordErrors.oldPassword) {
                      setPasswordErrors((prev) => ({
                        ...prev,
                        oldPassword: undefined,
                      }));
                    }
                  }}
                  placeholder="Enter your current password"
                  placeholderTextColor="#888"
                  secureTextEntry
                  editable={!changingPassword}
                />
              </LinearGradient>
              {passwordErrors.oldPassword && (
                <Text style={styles.errorText}>
                  {passwordErrors.oldPassword}
                </Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>New Password</Text>
              <LinearGradient
                colors={LTORANGE.colors}
                start={LTORANGE.start}
                end={LTORANGE.end}
                style={[
                  styles.gradientBorder,
                  !!passwordErrors.newPassword && styles.gradientBorderError,
                ]}
              >
                <TextInput
                  style={[
                    styles.textInput,
                    !!passwordErrors.newPassword && styles.textInputError,
                  ]}
                  value={passwordData.newPassword}
                  onChangeText={(value) => {
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: value,
                    }));
                    if (passwordErrors.newPassword) {
                      setPasswordErrors((prev) => ({
                        ...prev,
                        newPassword: undefined,
                      }));
                    }
                  }}
                  placeholder="Enter your new password"
                  placeholderTextColor="#888"
                  secureTextEntry
                  editable={!changingPassword}
                />
              </LinearGradient>
              {passwordErrors.newPassword && (
                <Text style={styles.errorText}>
                  {passwordErrors.newPassword}
                </Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Confirm New Password</Text>
              <LinearGradient
                colors={LTORANGE.colors}
                start={LTORANGE.start}
                end={LTORANGE.end}
                style={[
                  styles.gradientBorder,
                  !!passwordErrors.confirmPassword && styles.gradientBorderError,
                ]}
              >
                <TextInput
                  style={[
                    styles.textInput,
                    !!passwordErrors.confirmPassword && styles.textInputError,
                  ]}
                  value={passwordData.confirmPassword}
                  onChangeText={(value) => {
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmPassword: value,
                    }));
                    if (passwordErrors.confirmPassword) {
                      setPasswordErrors((prev) => ({
                        ...prev,
                        confirmPassword: undefined,
                      }));
                    }
                  }}
                  placeholder="Confirm your new password"
                  placeholderTextColor="#888"
                  secureTextEntry
                  editable={!changingPassword}
                />
              </LinearGradient>
              {passwordErrors.confirmPassword && (
                <Text style={styles.errorText}>
                  {passwordErrors.confirmPassword}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.changePasswordButton}
              onPress={handleChangePassword}
              disabled={changingPassword}
            >
              <LinearGradient
                colors={["#FD7332", "#EF3826"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.changePasswordGradient}
              >
                {changingPassword ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.changePasswordButtonText}>
                    Change Password
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
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
    container: {
      flex: 1,
      paddingHorizontal: moderateScale(20),
      paddingVertical: verticalScale(20),
    },
    titleContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: verticalScale(20),
    },
    sectionTitle: {
      fontSize: font(22),
      fontWeight: "600",
      color: "#FFF",
      textAlign: "left",
    },
    fieldContainer: {
      marginBottom: verticalScale(16),
    },
    fieldLabel: {
      fontSize: font(18),
      fontWeight: "500",
      color: "#FFF",
      marginBottom: verticalScale(8),
    },
    editIconButton: {
      padding: moderateScale(4),
      borderRadius: moderateScale(4),
    },
    titleEditIcon: {
      width: moderateScale(20),
      height: moderateScale(20),
      tintColor: "#FD7332",
    },
    editActionsRow: {
      flexDirection: "row",
      gap: moderateScale(12),
    },
    editAction: {
      paddingHorizontal: moderateScale(8),
      paddingVertical: verticalScale(2),
    },
    cancelEditLabel: {
      fontSize: font(14),
      fontWeight: "400",
      color: "#888",
      textTransform: "uppercase",
    },
    saveEditLabel: {
      fontSize: font(14),
      fontWeight: "500",
      color: "#FD7332",
      textTransform: "uppercase",
    },
    gradientBorder: {
      borderRadius: moderateScale(8),
      padding: moderateScale(1.5), // This creates the border width
    },
    gradientBorderError: {
      padding: moderateScale(2), // Slightly thicker border for errors
    },
    textInput: {
      backgroundColor: "#1D2A4F",
      borderRadius: moderateScale(6.5), // Slightly smaller to account for gradient border
      paddingHorizontal: moderateScale(16),
      paddingVertical: verticalScale(12),
      fontSize: font(18),
      color: "#FFF",
      borderWidth: 0, // Remove the old border
    },
    textInputReadOnly: {
      backgroundColor: "#2A3B5C",
      color: "#BBB",
    },
    textInputError: {
      // Error styling now handled by gradientBorderError
    },
    errorText: {
      fontSize: font(16),
      color: "#FF6B6B",
      marginTop: verticalScale(4),
      marginLeft: moderateScale(4),
    },
    passwordSection: {
      marginTop: verticalScale(24),
      paddingTop: verticalScale(16),
      borderTopWidth: 1,
      borderTopColor: "rgba(255, 255, 255, 0.1)",
    },
    passwordHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: verticalScale(16),
    },
    passwordTitle: {
      fontSize: font(20),
      fontWeight: "600",
      color: "#FFF",
    },
    changePasswordLabel: {
      fontSize: font(14),
      fontWeight: "400",
      color: "#FD7332",
      textTransform: "uppercase",
    },
    passwordFields: {
      gap: verticalScale(16),
    },
    changePasswordButton: {
      marginTop: verticalScale(8),
      alignSelf: "center",
    },
    changePasswordGradient: {
      paddingVertical: verticalScale(12),
      paddingHorizontal: moderateScale(32),
      borderRadius: moderateScale(8),
      alignItems: "center",
      minWidth: moderateScale(150),
    },
    changePasswordButtonText: {
      fontSize: font(18),
      fontWeight: "600",
      color: "#FFF",
    },
  });
