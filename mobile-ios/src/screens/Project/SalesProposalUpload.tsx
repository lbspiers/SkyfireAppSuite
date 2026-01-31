import React, { useState } from "react";
import { View, Image, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import Text from "../../components/Text";
import Button from "../../components/Button";
import DocumentPicker, { DocumentPickerResponse } from "react-native-document-picker";
import { fileUploadGeneric } from "../../api/uploadfiles.service";
import Toast from "react-native-toast-message";
import { StyleSheet } from "react-native";

interface SalesProposalUploadProps {
  projectId?: string;
  companyId?: string;
  onUploadSuccess?: (fileUrl: string, fileName: string) => void;
  onUploadError?: (error: string) => void;
}

const SalesProposalUpload: React.FC<SalesProposalUploadProps> = ({
  projectId,
  companyId,
  onUploadSuccess,
  onUploadError,
}) => {
  const [selectedFile, setSelectedFile] = useState<DocumentPickerResponse | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  const handleBrowse = async () => {
    setErrorMessage(null);
    setUploadStatus("idle");

    try {
      // Open document picker for PDF files only
      const res: DocumentPickerResponse[] = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
        allowMultiSelection: false,
      });

      const file = res[0];
      console.log("[SalesProposalUpload] File selected:", file);

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size && file.size > maxSize) {
        const errorMsg = "File size exceeds 50MB. Please select a smaller file.";
        setErrorMessage(errorMsg);
        setUploadStatus("error");
        if (onUploadError) onUploadError(errorMsg);
        return;
      }

      setSelectedFile(file);
      setUploadStatus("uploading");

      // Upload to S3 using the existing upload service
      if (!companyId) {
        throw new Error("Company ID is required for upload");
      }

      const fileUrl = await fileUploadGeneric({
        companyId: companyId,
        fileName: file.name || "sales-proposal.pdf",
        fileUri: file.uri,
        fileType: file.type || "application/pdf",
        directory: "sales-proposals", // Store in dedicated directory
      });

      console.log("[SalesProposalUpload] Upload successful:", fileUrl);

      setUploadedFileUrl(fileUrl);
      setUploadStatus("success");

      Toast.show({
        type: "success",
        position: "top",
        text1: "Upload Successful",
        text2: `${file.name} uploaded successfully`,
        visibilityTime: 3000,
      });

      if (onUploadSuccess) {
        onUploadSuccess(fileUrl, file.name || "sales-proposal.pdf");
      }
    } catch (error: any) {
      setUploadStatus("error");

      if (DocumentPicker.isCancel(error)) {
        console.log("[SalesProposalUpload] User canceled file selection");
        setErrorMessage(null);
        setUploadStatus("idle");
      } else {
        const errorMsg = error?.message || "Failed to upload file. Please try again.";
        console.error("[SalesProposalUpload] Upload error:", error);
        setErrorMessage(errorMsg);

        Toast.show({
          type: "error",
          position: "top",
          text1: "Upload Failed",
          text2: errorMsg,
          visibilityTime: 5000,
        });

        if (onUploadError) {
          onUploadError(errorMsg);
        }
      }
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setUploadStatus("idle");
    setErrorMessage(null);
    setUploadedFileUrl(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Sales Proposal</Text>
      <Text style={styles.subtitle}>
        Upload a PDF sales proposal to automatically populate project details
      </Text>

      <View style={styles.uploadContainer}>
        <Image
          source={require("../../assets/Images/icons/uploadIcon.png")}
          style={styles.uploadIcon}
        />
        <Text style={styles.instructionText}>
          {Platform.OS === "ios" ? "Tap to select PDF file" : "Tap to select PDF file"}
        </Text>

        <Button
          color1={"#FD7332"}
          color2={"#EF3826"}
          children={uploadStatus === "uploading" ? "Uploading..." : "Browse PDF"}
          style={styles.browseBtn}
          onPress={handleBrowse}
          labelStyle={styles.buttonText}
          disabled={uploadStatus === "uploading"}
        />

        {uploadStatus === "uploading" && (
          <ActivityIndicator size="small" color="#FD7332" style={styles.loader} />
        )}
      </View>

      {/* Display selected file */}
      {selectedFile && (
        <View style={styles.fileInfoContainer}>
          <View style={styles.fileInfo}>
            <Image
              source={require("../../assets/Images/icons/uploadIcon.png")}
              style={styles.fileIcon}
            />
            <View style={styles.fileDetails}>
              <Text style={styles.fileName} numberOfLines={1}>
                {selectedFile.name}
              </Text>
              <Text style={styles.fileSize}>
                {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(2)} KB` : "Unknown size"}
              </Text>
            </View>

            {/* Status indicator */}
            {uploadStatus === "uploading" && (
              <ActivityIndicator size="small" color="#FD7332" />
            )}
            {uploadStatus === "success" && (
              <Text style={styles.successText}>✓</Text>
            )}
            {uploadStatus === "error" && (
              <Text style={styles.errorText}>✗</Text>
            )}

            {/* Remove button */}
            {uploadStatus !== "uploading" && (
              <TouchableOpacity onPress={handleRemove} style={styles.removeButton}>
                <Image
                  source={require("../../assets/Images/icons/close.png")}
                  style={styles.closeIcon}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Error message */}
      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessageText}>{errorMessage}</Text>
        </View>
      )}

      {/* Success message */}
      {uploadStatus === "success" && (
        <View style={styles.successContainer}>
          <Text style={styles.successMessageText}>
            ✓ PDF uploaded successfully! Processing will begin automatically.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: "#FFFFFF80",
    marginBottom: 16,
    lineHeight: 18,
  },
  uploadContainer: {
    backgroundColor: "rgba(12, 31, 63, 0.3)",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(253, 115, 50, 0.3)",
    borderStyle: "dashed",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
  },
  uploadIcon: {
    height: 40,
    width: 40,
    tintColor: "#FD7332",
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: "#FFFFFF80",
    marginBottom: 16,
    textAlign: "center",
  },
  browseBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 160,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  loader: {
    marginTop: 12,
  },
  fileInfoContainer: {
    marginTop: 16,
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  fileIcon: {
    width: 24,
    height: 24,
    tintColor: "#FD7332",
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: "#FFFFFF60",
  },
  successText: {
    fontSize: 20,
    color: "#4CAF50",
    marginRight: 8,
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 20,
    color: "#F44336",
    marginRight: 8,
    fontWeight: "bold",
  },
  removeButton: {
    padding: 4,
  },
  closeIcon: {
    width: 16,
    height: 16,
    tintColor: "#FFFFFF80",
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.3)",
  },
  errorMessageText: {
    fontSize: 13,
    color: "#F44336",
    textAlign: "center",
  },
  successContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.3)",
  },
  successMessageText: {
    fontSize: 13,
    color: "#4CAF50",
    textAlign: "center",
    fontWeight: "600",
  },
});

export default SalesProposalUpload;
