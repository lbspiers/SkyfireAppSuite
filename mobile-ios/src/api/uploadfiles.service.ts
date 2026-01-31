import apiEndpoints from "../config/apiEndPoint";
import axiosInstance from "./axiosInstance";
import axios from "axios";
import RNFetchBlob from "rn-fetch-blob";
import { Platform } from "react-native";

interface FileUploadParams {
  companyId: string;
  fileName?: string;
  fileUri: string;
  fileType: string;
  directory: string;
}

export const fileUploadGeneric = async (data: FileUploadParams) => {
  const { companyId, fileName, fileUri, fileType, directory = "generic" } = data;
  console.log("[FileUpload] Starting upload with params:", {
    companyId,
    fileName,
    fileUri,
    fileType,
    directory
  });
  
  try {
    // Get presigned URL from backend
    const urlEndpoint = `${apiEndpoints.BASE_URL}${apiEndpoints.UPLOAD_FILES.UPLOAD_FILES}${companyId}/file-upload-url?fileName=${fileName}&directory=${directory}`;
    console.log("[FileUpload] Requesting upload URL from:", urlEndpoint);
    
    const response = await axiosInstance.get(urlEndpoint);

    const uploadUrl = response?.data?.upload_url;
    console.log("[FileUpload] Received upload URL:", uploadUrl);
    
    if (!uploadUrl) {
      throw new Error("Received an empty upload URL from the API");
    }

    // Upload file to S3
    // Use RNFetchBlob.wrap() as primary method (more reliable on mobile & emulator)
    // Fallback to fetch() with blob conversion only if needed
    console.log("[FileUpload] Uploading file to S3...");

    try {
      // PRIMARY METHOD: Use RNFetchBlob.wrap() - works reliably on emulators and real devices
      console.log("[FileUpload] Using RNFetchBlob.wrap() method (reliable for emulators)");

      const uploadResponse = await RNFetchBlob.fetch(
        "PUT",
        uploadUrl,
        { "Content-Type": fileType },
        RNFetchBlob.wrap(fileUri.replace('file://', ''))
      );

      const responseStatus = uploadResponse.info().status;
      console.log("[FileUpload] RNFetchBlob upload response status:", responseStatus);

      if (responseStatus !== 200 && responseStatus !== 204) {
        const responseText = uploadResponse.text();
        throw new Error(`S3 upload failed with status: ${responseStatus}, details: ${responseText}`);
      }

      console.log("[FileUpload] Upload successful via RNFetchBlob");

    } catch (rnFetchBlobError: any) {
      console.warn("[FileUpload] RNFetchBlob upload failed, attempting fetch() fallback:", rnFetchBlobError.message);

      // FALLBACK METHOD: Use fetch with blob conversion (may fail on emulators)
      try {
        const base64Data = await RNFetchBlob.fs.readFile(fileUri.replace('file://', ''), 'base64');
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: fileType });

        console.log("[FileUpload] File blob created, size:", blob.size, "bytes");

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': fileType,
          },
          body: blob,
          redirect: 'follow',
        });

        console.log("[FileUpload] Fetch upload response status:", uploadResponse.status);

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text().catch(() => 'No error details');
          throw new Error(`S3 upload failed with status: ${uploadResponse.status}, details: ${errorText}`);
        }

        console.log("[FileUpload] Upload successful via fetch() fallback");
      } catch (fetchError: any) {
        console.error("[FileUpload] Both upload methods failed!");
        throw new Error(`Upload failed - Primary: ${rnFetchBlobError.message}, Fallback: ${fetchError.message}`);
      }
    }

    // Extract the URL without query params for storage
    const cleanUrl = uploadUrl.split('?')[0];
    console.log("[FileUpload] File uploaded successfully, URL:", cleanUrl);
    return cleanUrl;
  } catch (error: any) {
    console.error("[FileUpload] File upload failed - Full error:", {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      stack: error?.stack,
    });
    throw error;
  }
};

export const fileUploadLogo = async (data: any) => {
  const { companyId, fileName, fileUri, fileType } = data;
  console.log(data, "data");
  try {
    // Step 1: Get the upload URL from your API
    const response = await axiosInstance.get(
      `${apiEndpoints.BASE_URL}${apiEndpoints.UPLOAD_FILES.UPLOAD_FILES}${companyId}/logo-upload-url?fileName=${fileName}`
    );
    const uploadUrl = response?.data?.upload_url;
    // Check if uploadUrl is valid
    if (!uploadUrl) {
      throw new Error("Received an empty upload URL from the API");
    }

    console.log("Received upload URL:", uploadUrl);

    // Step 2: Upload the file directly using RNFetchBlob
    const uploadResponse = await RNFetchBlob.fetch(
      "PUT",
      uploadUrl,
      {
        "Content-Type": fileType,
      },
      RNFetchBlob.wrap(fileUri)
    );

    console.log("File uploaded successfully", uploadResponse);
    return uploadResponse;
  } catch (error) {
    console.error("File upload failed", error);
    throw error;
  }
};
