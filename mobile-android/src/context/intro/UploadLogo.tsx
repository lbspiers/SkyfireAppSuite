import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Image,
  ActivityIndicator,
  Text as RNText,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import Text from "../../components/Text";
import LinearGradient from "react-native-linear-gradient";
import { launchImageLibrary } from "react-native-image-picker";
import Button from "../../components/Button";
import { useSelector } from "react-redux";
import { styles } from "../../styles/uploadLogoStyles";
import { fileUploadLogo } from "../../api/uploadfiles.service";
import { HeaderLogoComponent } from "../../components/Header";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import COLORS from "../../utils/styleConstant/Color";
import fontFamily from "../../utils/styleConstant/FontFamily";

const UploadLogo = ({ navigation }: any) => {
  //const navigation: any = useNavigation();
  const [selectedFiles, setSelectedFiles] = useState<any>([]);
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  const [validationMessages, setValidationMessages] = useState<string[]>([]); // New state for validation messages
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(false);

  const { accessToken } = useSelector((store: any) => store?.auth);
  const companyId = useSelector((store: any) => store?.profile?.profile);
  console.log("companyId", companyId);
  const handleValidation = () => {
    let isValid = false;
    if (selectedFiles.length > 0) {
      isValid = true;
      setValidationMessages([]);
    } else {
      setValidationMessages(["Please select a logo file to upload."]);
    }
    return isValid;
  };

  const handleBrowse = async () => {
    try {
      // Launch image picker
      setValidationMessages([]);
      const result: any = await new Promise((resolve, reject) => {
        launchImageLibrary(
          {
            mediaType: "photo", // Restrict to image types
            selectionLimit: 1, // Allow single image selection
          },
          (response) => {
            if (response.didCancel) {
              reject("User canceled the picker");
            } else if (response.errorCode) {
              reject(`ImagePicker Error: ${response.errorCode}`);
            } else {
              // setImageUrl()
              resolve(response.assets);
            }
          }
        );
      });

      const validFiles = result.filter(
        (file: any) => file.type?.startsWith("image/") // Ensure that only image files are selected
      );

      const invalidFiles = result.length - validFiles.length;

      if (invalidFiles > 0) {
        setValidationMessages((prev) => [
          ...prev,
          "Only image files (jpeg, png) are allowed.",
        ]);
      }

      setSelectedFiles((prev: any) => [...prev, ...validFiles]);
      setStatusMessages((prev) => [
        ...prev,
        ...new Array(validFiles.length).fill("Waiting"),
      ]);
    } catch (error) {
      console.error("Error selecting files", error);
    }
  };

  const handleUpload = async () => {
    setUploading(true);

    const uploadFiles = async () => {
      // Iterate over the selected files
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        try {
          // Update status message to "Uploading" for the current file
          setStatusMessages((prev) =>
            prev.map((msg, index) => (index === i ? "Uploading" : msg))
          );

          console.log(file, "file ");
          console.log("payload", {
            companyId: companyId?.company?.uuid,
            token: accessToken,
            fileName: file.fileName,
            fileUri: file.uri,
            fileType: file.type,
          });
          // Call the file upload function
          const response = await fileUploadLogo({
            companyId: companyId?.company?.uuid,
            token: accessToken,
            fileName: file.fileName,
            fileUri: file.uri,
            fileType: file.type,
          });

          // Check if the response status is 200
          if (response?.respInfo?.status === 200) {
            setStatusMessages((prev) =>
              prev.map((msg, index) => (index === i ? "Uploaded" : msg))
            );

            // Show a success toast message
            await Toast.show({
              type: "success",
              position: "top",
              text1: "Upload Successful",
              text2: `All files uploaded successfully.`,
              visibilityTime: 1500,
            });

            // Navigate after a delay
            setTimeout(() => {
              navigation.navigate("serviceTerritory");
            }, 1500);
          } else {
            // Handle non-200 status
            console.error(
              "Upload failed with status:",
              response?.respInfo?.status
            );
            setStatusMessages((prev) =>
              prev.map((msg, index) => (index === i ? "Failed" : msg))
            );
          }
        } catch (error) {
          console.error("Failed to upload file", error);
          setStatusMessages((prev) =>
            prev.map((msg, index) => (index === i ? "Failed" : msg))
          );
        }
      }

      // Reset states after upload
      setSelectedFiles([]);
      setStatusMessages([]);
      setUploading(false);
    };

    uploadFiles();
  };

  const handleCancel = (index: number) => {
    setSelectedFiles((prev: any) => prev.filter((_, i) => i !== index));
    setStatusMessages((prev) => prev.filter((_, i) => i !== index));
  };

  console.log("selected files", selectedFiles[0]?.uri);
  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradientView}>
      <SafeAreaView
        style={{ flex: 1, paddingTop: Platform.OS === "ios" ? 0 : 20 }}
      >
        <HeaderLogoComponent
          isTitle={false}
          back={false}
          applogo={true}
          onBackButtonPress={() => navigation.goBack()}
        />

        <View style={styles.mainContainer}>
          <View
            style={{
              flex: 0.1,
              justifyContent: "flex-end",
              paddingBottom: 5,
            }}
          >
            <Text children="Company Logo" style={styles.mainHeader} />
          </View>

          <View style={styles.subContainer}>
            <View style={styles.uploadContainer}>
              {selectedFiles[0]?.uri ? (
                <Image
                  source={{ uri: selectedFiles[0]?.uri }}
                  style={{
                    height: Platform.OS === "android" ? 299 : 295,
                    width: Platform.OS === "android" ? 360 : 325,
                    alignSelf: "center",
                    borderRadius: 10,
                  }}
                />
              ) : (
                <Text children="Company Logo" style={styles.midText} />
              )}
            </View>
            <Text
              children="Upload a Logo to use on your plan sets. (jpeg, png)"
              style={styles.subText}
            />
          </View>

          <View
            style={{
              flex: 0.3,
              justifyContent: "space-between",
              alignItems: "center",
              // marginTop: 0,
              // justifyContent: "space-around",
            }}
          >
            {/* Display validation messages */}
            {validationMessages.length > 0 && (
              <View
                style={{
                  marginTop: 10,
                  alignItems: "center",
                }}
              >
                {validationMessages.map((msg, index) => (
                  <RNText key={index} style={{ color: "red" }}>
                    {msg}
                  </RNText>
                ))}
              </View>
            )}
            <>
              <Button
                color1={"#D9E6ED"}
                color2={"#018AD7"}
                children={"Browse File"}
                style={styles.browseBtn}
                labelStyle={styles.buttonText}
                onPress={handleBrowse}
              />
            </>
            <>
              <Button
                color1={"#FD7332"}
                color2={"#B92011"}
                children={uploading ? "Uploading..." : "Next"}
                style={styles.uploadBtn}
                labelStyle={styles.buttonText}
                onPress={() => {
                  if (handleValidation()) {
                    handleUpload();
                  }
                }}
                disabled={uploading || selectedFiles.length === 0}
              />
            </>
          </View>
          <View
            style={{
              flex: 0.1,
              justifyContent: "center",
            }}
          >
            <TouchableOpacity onPress={() => navigation.goBack("")}>
              <Text
                style={{
                  textAlign: "center",
                  color: COLORS.white,
                  fontFamily: fontFamily.lato,
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                {"< Back"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default UploadLogo;
