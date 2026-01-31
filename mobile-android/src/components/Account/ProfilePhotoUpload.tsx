// src/components/Account/ProfilePhotoUpload.tsx

import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { launchImageLibrary, ImagePickerResponse, MediaType } from "react-native-image-picker";
import { uploadCompanyLogo, removeCompanyLogo } from "../../services/accountAPI";
import { useResponsive } from "../../utils/responsive";
import { ORANGE_LR } from "../../styles/gradient";

interface CompanyLogoUploadProps {
  currentLogoUrl?: string;
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

    const options = {
      mediaType: "photo" as MediaType,
      includeBase64: false,
      maxHeight: 512,
      maxWidth: 512,
      quality: 0.8,
    };

    Alert.alert(
      "Update Company Logo",
      "Choose an option",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Choose from Library",
          onPress: () => {
            launchImageLibrary(options, handleImageResponse);
          },
        },
        currentLogoUrl && {
          text: "Remove Logo",
          style: "destructive",
          onPress: handleRemovePhoto,
        },
      ].filter(Boolean) as any[]
    );
  };

  const handleImageResponse = async (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage || !response.assets?.[0]) {
      return;
    }

    const asset = response.assets[0];
    
    // Validate file size (max 5MB)
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert("Error", "Image size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!asset.type?.startsWith("image/")) {
      Alert.alert("Error", "Please select a valid image file");
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("photo", {
        uri: asset.uri,
        type: asset.type,
        name: asset.fileName || "profile-photo.jpg",
      } as any);

      const result = await uploadCompanyLogo(formData);
      
      if (result.status === "SUCCESS") {
        onLogoUpdated(result.data.photoUrl);
        Alert.alert("Success", "Company logo updated successfully");
      } else {
        Alert.alert("Error", result.message || "Failed to upload logo. Please try again.");
      }
    } catch (error: any) {
      console.error("Logo upload error:", error);
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          "Failed to upload logo. Please check your connection.";
      Alert.alert("Error", errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (disabled || removing) return;

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
                Alert.alert("Error", result.message || "Failed to remove logo. Please try again.");
              }
            } catch (error: any) {
              console.error("Logo removal error:", error);
              const errorMessage = error?.response?.data?.message || 
                                  error?.message || 
                                  "Failed to remove logo. Please check your connection.";
              Alert.alert("Error", errorMessage);
            } finally {
              setRemoving(false);
            }
          },
        },
      ]
    );
  };

  const renderPhotoContent = () => {
    if (uploading || removing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FD7332" />
          <Text style={styles.loadingText}>
            {uploading ? "Uploading..." : "Removing..."}
          </Text>
        </View>
      );
    }

    if (currentLogoUrl) {
      return (
        <Image source={{ uri: currentLogoUrl }} style={styles.logoImage} />
      );
    }

    return (
      <View style={styles.placeholderContainer}>
        <Image
          source={require("../../assets/Images/icons/user-placeholder.png")}
          style={styles.placeholderIcon}
        />
        <Text style={styles.placeholderText}>Add Logo</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Company Logo</Text>
      
      <TouchableOpacity
        style={[
          styles.photoContainer,
          disabled && styles.photoContainerDisabled
        ]}
        onPress={handleImagePicker}
        disabled={disabled || uploading || removing}
        accessibilityRole="button"
        accessibilityLabel="Update company logo"
      >
        <LinearGradient
          {...ORANGE_LR}
          style={styles.photoBorder}
        >
          <View style={styles.photoInner}>
            {renderPhotoContent()}
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.uploadButton,
          disabled && styles.uploadButtonDisabled
        ]}
        onPress={handleImagePicker}
        disabled={disabled || uploading || removing}
      >
        <LinearGradient
          colors={["#FD7332", "#EF3826"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.uploadButtonGradient}
        >
          <Text style={styles.uploadButtonText}>
            {currentLogoUrl ? "Change Logo" : "Upload Logo"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {currentLogoUrl && (
        <TouchableOpacity
          style={[
            styles.removeButton,
            disabled && styles.removeButtonDisabled
          ]}
          onPress={handleRemovePhoto}
          disabled={disabled || uploading || removing}
        >
          <Text style={styles.removeButtonText}>Remove Logo</Text>
        </TouchableOpacity>
      )}
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
      alignItems: "center",
      paddingVertical: verticalScale(20),
      paddingHorizontal: moderateScale(20),
    },
    sectionTitle: {
      fontSize: font(20),
      fontWeight: "600",
      color: "#FFF",
      marginBottom: verticalScale(16),
      textAlign: "center",
    },
    photoContainer: {
      marginBottom: verticalScale(16),
    },
    photoContainerDisabled: {
      opacity: 0.6,
    },
    photoBorder: {
      padding: moderateScale(4),
      borderRadius: moderateScale(16),
    },
    photoInner: {
      width: moderateScale(120),
      height: moderateScale(120),
      borderRadius: moderateScale(12),
      backgroundColor: "#1D2A4F",
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    logoImage: {
      width: "100%",
      height: "100%",
      borderRadius: moderateScale(12),
    },
    placeholderContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    placeholderIcon: {
      width: moderateScale(40),
      height: moderateScale(40),
      tintColor: "#888",
      marginBottom: verticalScale(8),
    },
    placeholderText: {
      fontSize: font(14),
      color: "#888",
      fontWeight: "500",
    },
    loadingContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      fontSize: font(14),
      color: "#FD7332",
      marginTop: verticalScale(8),
      fontWeight: "500",
    },
    uploadButton: {
      marginBottom: verticalScale(12),
    },
    uploadButtonDisabled: {
      opacity: 0.6,
    },
    uploadButtonGradient: {
      paddingVertical: verticalScale(12),
      paddingHorizontal: moderateScale(24),
      borderRadius: moderateScale(8),
      minWidth: moderateScale(150),
      alignItems: "center",
    },
    uploadButtonText: {
      fontSize: font(16),
      fontWeight: "600",
      color: "#FFF",
    },
    removeButton: {
      paddingVertical: verticalScale(8),
      paddingHorizontal: moderateScale(16),
    },
    removeButtonDisabled: {
      opacity: 0.6,
    },
    removeButtonText: {
      fontSize: font(14),
      color: "#FF6B6B",
      textDecorationLine: "underline",
    },
  });