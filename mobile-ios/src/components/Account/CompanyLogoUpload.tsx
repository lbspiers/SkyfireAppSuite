// src/components/Account/CompanyLogoUpload.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { uploadCompanyLogo, removeCompanyLogo } from "../../services/accountAPI";
import { useResponsive } from "../../utils/responsive";

interface CompanyLogoUploadProps {
  currentLogoUrl?: string | null;
  onLogoUpdated: (logoUrl?: string) => void;
  disabled?: boolean;
}

export default function CompanyLogoUpload({
  currentLogoUrl,
  onLogoUpdated,
  disabled = false,
}: CompanyLogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const { moderateScale, verticalScale, font } = useResponsive();
  const styles = makeStyles({ moderateScale, verticalScale, font });

  const handleImagePicker = () => {
    if (disabled || uploading) return;

    Alert.alert(
      "Company Logo",
      "Choose how you'd like to add your company logo for plan sets and permits:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Choose from Library",
          onPress: () => {
            launchImageLibrary(
              {
                mediaType: 'photo',
                quality: 0.8,
                maxWidth: 1000,
                maxHeight: 1000,
              },
              handleImageResponse
            );
          },
        },
      ]
    );
  };

  const handleImageResponse = async (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage) {
      return;
    }

    const asset = response.assets?.[0];
    if (!asset) {
      Alert.alert("Error", "No image selected");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', {
        uri: asset.uri,
        type: asset.type,
        name: asset.fileName || 'company-logo.jpg',
      } as any);

      const result = await uploadCompanyLogo(formData);
      
      if (result.status === "SUCCESS" && result.data?.photoUrl) {
        onLogoUpdated(result.data.photoUrl);
        Alert.alert("Success", "Company logo updated successfully");
      } else {
        Alert.alert("Error", result.message || "Failed to upload logo");
      }
    } catch (error: any) {
      console.error("Logo upload error:", error);
      Alert.alert("Error", error?.message || "Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    if (disabled || removing || !currentLogoUrl) return;

    Alert.alert(
      "Remove Logo",
      "Are you sure you want to remove your company logo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setRemoving(true);
            try {
              const result = await removeCompanyLogo();
              
              if (result.status === "SUCCESS") {
                onLogoUpdated(undefined);
                Alert.alert("Success", "Company logo removed successfully");
              } else {
                Alert.alert("Error", result.message || "Failed to remove logo");
              }
            } catch (error: any) {
              console.error("Logo removal error:", error);
              Alert.alert("Error", error?.message || "Failed to remove logo");
            } finally {
              setRemoving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FD7332", "#B92011"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradientBorder}
      >
        <View style={styles.innerContainer}>
          <Text style={styles.title}>Company Logo</Text>
          <Text style={styles.subtitle}>
            Upload your company logo for use on plan sets and permits
          </Text>

          <View style={styles.logoSection}>
            <View style={styles.logoPreview}>
              {currentLogoUrl ? (
                <Image source={{ uri: currentLogoUrl }} style={styles.logoImage} />
              ) : (
                <View style={styles.placeholderLogo}>
                  <Text style={styles.placeholderText}>No Logo</Text>
                </View>
              )}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.uploadButton, (disabled || uploading) && styles.disabledButton]}
                onPress={handleImagePicker}
                disabled={disabled || uploading}
              >
                <LinearGradient
                  colors={["#FD7332", "#EF3826"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.uploadButtonGradient}
                >
                  {uploading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.uploadButtonText}>
                      {currentLogoUrl ? "Change Logo" : "Upload Logo"}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {currentLogoUrl && (
                <TouchableOpacity
                  style={[styles.removeButton, (disabled || removing) && styles.disabledButton]}
                  onPress={handleRemoveLogo}
                  disabled={disabled || removing}
                >
                  {removing ? (
                    <ActivityIndicator color="#FF6B6B" size="small" />
                  ) : (
                    <Text style={styles.removeButtonText}>Remove</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
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
      marginHorizontal: moderateScale(20),
      marginBottom: verticalScale(20),
    },
    gradientBorder: {
      borderRadius: moderateScale(8),
      padding: moderateScale(1.5),
    },
    innerContainer: {
      backgroundColor: "#1D2A4F",
      borderRadius: moderateScale(6.5),
      padding: moderateScale(20),
    },
    title: {
      fontSize: font(20),
      fontWeight: "600",
      color: "#FFF",
      textAlign: "center",
      marginBottom: verticalScale(8),
    },
    subtitle: {
      fontSize: font(14),
      color: "#FFF",
      opacity: 0.7,
      textAlign: "center",
      marginBottom: verticalScale(20),
      lineHeight: font(18),
    },
    logoSection: {
      alignItems: "center",
    },
    logoPreview: {
      width: moderateScale(120),
      height: moderateScale(120),
      borderRadius: moderateScale(8),
      backgroundColor: "#2A3B5C",
      marginBottom: verticalScale(16),
      overflow: "hidden",
      borderWidth: 2,
      borderColor: "rgba(253, 115, 50, 0.3)",
    },
    logoImage: {
      width: "100%",
      height: "100%",
      resizeMode: "contain",
    },
    placeholderLogo: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    placeholderText: {
      fontSize: font(14),
      color: "#FFF",
      opacity: 0.5,
    },
    buttonContainer: {
      flexDirection: "row",
      gap: moderateScale(12),
    },
    uploadButton: {
      flex: 1,
    },
    uploadButtonGradient: {
      paddingVertical: verticalScale(12),
      paddingHorizontal: moderateScale(20),
      borderRadius: moderateScale(8),
      alignItems: "center",
    },
    uploadButtonText: {
      fontSize: font(16),
      fontWeight: "600",
      color: "#FFF",
    },
    removeButton: {
      paddingVertical: verticalScale(12),
      paddingHorizontal: moderateScale(20),
      borderRadius: moderateScale(8),
      borderWidth: 1,
      borderColor: "#FF6B6B",
      backgroundColor: "rgba(255, 107, 107, 0.1)",
      alignItems: "center",
      justifyContent: "center",
    },
    removeButtonText: {
      fontSize: font(16),
      fontWeight: "600",
      color: "#FF6B6B",
    },
    disabledButton: {
      opacity: 0.5,
    },
  });