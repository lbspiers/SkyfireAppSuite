// import React, { useState } from "react";
// import { SafeAreaView, View, Image } from "react-native";
// import Text from "../../components/Text";
// import Button from "../../components/Button";
// import DocumentPicker, { DocumentPickerResponse } from "react-native-document-picker";
// import { styles } from "../../styles/uploadFiles";
// import { fileUploadGeneric } from "../../api/uploadfiles.service";
// import { useSelector } from "react-redux";

// const UploadFile = ({ imageUri, setImageUri }: any) => {
//     const { accessToken } = useSelector((store: any) => store?.auth);
//     const { company_id } = useSelector((store: any) => store?.profile?.profile);
//     const [errorMessage, setErrorMessage] = useState<string | null>(null);
//     const[status,setStatus]=useState(false)

//     const handleBrowse = async () => {
//         setErrorMessage(null);  // Reset error message before starting the upload process

//         try {
//             const res: DocumentPickerResponse[] = await DocumentPicker.pick({
//                 type: [DocumentPicker.types.allFiles],
//                 allowMultiSelection: false,
//             });

//             const uri = res[0].uri;
//             const type = res[0].type;
//             const fileName = res[0].name;

//             setImageUri(uri);

//             // Trigger the file upload
//             const response = await fileUploadGeneric({
//                 companyId: company_id,
//                 token: accessToken,
//                 fileName: fileName,
//                 fileUri: uri,
//                 fileType: type,
//             });
//             setStatus(true)
//             setErrorMessage("File uploaded successfully");
//         } catch (error) {
//             if (DocumentPicker.isCancel(error)) {
//                 setStatus(false)
//                 console.log("User canceled the picker");
//                 setErrorMessage("File selection was canceled.");
//             } else {
//                 setStatus(false)
//                 console.error("Error selecting or uploading file", error);
//                 setErrorMessage("Failed to upload the file. Please try again.");
//             }
//         }
//     };

//     return (
//         <View style={styles.mainContainer}>
//             <View style={styles.subContainer}>
//                 <Text children="Document Upload" style={styles.title} />
//                 <View style={styles.uploadContainer}>
//                     <Image
//                         source={require('../../assets/Images/icons/uploadIcon.png')}
//                         style={{ height: 30, width: 30, alignSelf: 'center' }}
//                     />
//                     <Text children="Drag & drop to Upload File" style={styles.midText} />
//                     <Text children="or" style={styles.subText} />
//                     <Button
//                         color1={"#0C1F3F"}
//                         color2={"#0C1F3F00"}
//                         children={'Browse File'}
//                         style={styles.browseBtn}
//                         onPress={handleBrowse}
//                         labelStyle={styles.buttonText}
//                     />
//                 </View>

//                 {/* Display error message if there's an error */}
//                 {errorMessage && (
//                     <Text style={
//                       {color:status ? 'green' : 'red'}
//                     }>
//                         {errorMessage}
//                     </Text>
//                 )}
//             </View>
//         </View>
//     );
// }

// export default UploadFile;

import React, { useState, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Text from "../../components/Text";
import Button from "../../components/Button";
import DocumentPicker, {
  DocumentPickerResponse,
} from "react-native-document-picker";
import { styles } from "../../styles/uploadFiles";
import { fileUploadGeneric } from "../../api/uploadfiles.service";
import { useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/FontAwesome"; // Ensure you import your icon library

const UploadFile = ({ imageUri, setImageUri }: any) => {
  const { accessToken } = useSelector((store: any) => store?.auth);
  const { company_id } = useSelector((store: any) => store?.profile?.profile);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<DocumentPickerResponse[]>(
    []
  );
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelTokens, setCancelTokens] = useState<Map<number, () => void>>(
    new Map()
  );

  const handleBrowse = async () => {
    setErrorMessage(null); // Reset error message before starting the upload process

    try {
      const res: DocumentPickerResponse[] = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: false,
      });

      const uri = res[0].uri;
      const type = res[0].type;
      const fileName = res[0].name;

      setImageUri(uri);

      // Add file to the list of selected files
      setSelectedFiles((prev) => [...prev, res[0]]);
      setStatusMessages((prev) => [...prev, "Waiting"]);

      // Prepare for upload
      setLoading(true);

      // Mock cancel token
      const cancelToken = () => {
        // Cancel logic if implemented on the backend
        console.log("Upload cancelled");
        setStatusMessages((prev) => [...prev.slice(0, -1), "Cancelled"]);
        setLoading(false);
      };

      setCancelTokens((prev) =>
        new Map(prev).set(selectedFiles.length, cancelToken)
      );

      // Trigger the file upload
      const response = await fileUploadGeneric({
        companyId: company_id,
        token: accessToken,
        fileName: fileName,
        fileUri: uri,
        fileType: type,
      });

      setStatusMessages((prev) => [...prev.slice(0, -1), "Uploaded"]);
      setLoading(false);

      // After all files are processed, show toast
      Toast.show({
        type: "success",
        position: "top",
        text1: "Upload Successful",
        text2: `All files uploaded successfully.`,
        visibilityTime: 5000,
      });
    } catch (error) {
      setLoading(false);
      if (DocumentPicker.isCancel(error)) {
        console.log("User canceled the picker");
        setErrorMessage("File selection was canceled.");
      } else {
        console.error("Error selecting or uploading file", error);
        setErrorMessage("Failed to upload the file. Please try again.");
      }
    }
  };

  const handleCancel = (index: number) => {
    if (cancelTokens.has(index)) {
      cancelTokens.get(index)?.(); // Call the cancel function
    }
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setStatusMessages((prevStatus) => prevStatus.filter((_, i) => i !== index));
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.subContainer}>
        <Text children="Document Upload" style={styles.title} />
        <View style={styles.uploadContainer}>
          <Image
            source={require("../../assets/Images/icons/uploadIcon.png")}
            style={{ height: 30, width: 30, alignSelf: "center" }}
          />
          <Text children="Drag & drop to Upload File" style={styles.midText} />
          <Text children="or" style={styles.subText} />
          <Button
            color1={"#0C1F3F"}
            color2={"#0C1F3F00"}
            children={"Browse File"}
            style={styles.browseBtn}
            onPress={handleBrowse}
            labelStyle={styles.buttonText}
            disabled={loading} // Disable button when loading
          />
        </View>

        {/* Display error message if there's an error */}
        {errorMessage && <Text style={{ color: "red" }}>{errorMessage}</Text>}

        {/* Display selected files */}
        <View
          style={{
            marginVertical: 20,
            flexWrap: "wrap",
            flexDirection: "row",
          }}
        >
          {selectedFiles.map((file, index) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#f0f0f0",
                borderRadius: 15,
                padding: 10,
                margin: 5,
              }}
            >
              <Text>{file.name}</Text>
              {statusMessages[index] === "Uploading" ? (
                <ActivityIndicator
                  size="small"
                  color="#0000ff"
                  style={{ marginLeft: 10 }}
                />
              ) : statusMessages[index] === "Waiting" ? (
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 5,
                    backgroundColor: "orange",
                    marginLeft: 10,
                  }}
                />
              ) : (
                <Text style={{ marginLeft: 10 }}>{statusMessages[index]}</Text>
              )}
              <TouchableOpacity
                onPress={() => handleCancel(index)}
                style={{
                  marginLeft: 10,
                  width: 24,
                  height: 24,
                  justifyContent: "center",
                  alignItems: "center",
                }} // Adjust width and height here
              >
                <Image
                  source={require("../../assets/Images/icons/close.png")}
                  style={{ width: 16, height: 16 }} // Set dimensions for the image
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default UploadFile;
