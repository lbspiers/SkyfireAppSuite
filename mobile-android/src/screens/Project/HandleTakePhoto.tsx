import { useActionSheet } from '@expo/react-native-action-sheet';
import { useState } from 'react';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
import { useSelector } from 'react-redux';
import { fileUploadGeneric } from '../../api/uploadfiles.service'; // Adjust the path as necessary

export const useHandlePhotoSelection = (setImageUrispecific: any) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const[errorMessage,setErrorMessage] = useState('')
  const { company_id } = useSelector((store: any) => store?.profile?.profile);
  const [status, setStatus] = useState(false);
  const handlePhotoSelection = async (generic: string) => {
    const options = ['Take Photo', 'Choose from Library', 'Browse Files', 'Cancel'];
    const cancelButtonIndex = 3;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      async (buttonIndex) => {
        if (buttonIndex === 0) {
          // Take Photo
          const cameraOptions = {
            mediaType: 'photo',
            includeBase64: false,
            maxWidth: 300,
            maxHeight: 300,
            quality: 1,
          };

          launchCamera(cameraOptions, (response) => {
            if (!response.didCancel && !response.error) {
              setImageUrispecific(response.assets[0].uri);
              // Trigger the file upload
              fileUploadGeneric({
                companyId: company_id,
                fileName: 'photo.jpg', // Replace with actual file name if available
                fileUri: response.assets[0].uri,
                fileType: 'image/jpeg',
                generic: generic,
              }).then((datas) => {
                setStatus(true);
                setErrorMessage("File uploaded successfully");
                console.log("File uploaded successfully",datas)
              }).catch((error) => {
                console.error("Error uploading file", error);
                setErrorMessage("Failed to upload the file. Please try again.");
              });
            }
          });
        } else if (buttonIndex === 1) {
          // Choose from Library
          const libraryOptions = {
            mediaType: 'photo',
            includeBase64: false,
            maxWidth: 300,
            maxHeight: 300,
            quality: 1,
          };

          launchImageLibrary(libraryOptions, (response) => {
            if (!response.didCancel && !response.error) {
              setImageUrispecific(response.assets[0].uri);
              // Trigger the file upload
              fileUploadGeneric({
                companyId: company_id,
                fileName: 'photo.jpg', // Replace with actual file name if available
                fileUri: response.assets[0].uri,
                fileType: 'image/jpeg',
                generic: generic,
              }).then(() => {
                setStatus(true);
                setErrorMessage("File uploaded successfully");
              }).catch((error) => {
                console.error("Error uploading file", error);
                setErrorMessage("Failed to upload the file. Please try again.");
              });
            }
          });
        } else if (buttonIndex === 2) {
          // Browse Files
          handleBrowse(generic);
        }
      }
    );
  };

  const handleBrowse = async (generic: string) => {
    setErrorMessage(null);  // Reset error message before starting the upload process

    try {
      const res: DocumentPickerResponse[] = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: false,
      });

      const uri = res[0].uri;
      const type = res[0].type;
      const fileName = res[0].name;

      setImageUrispecific(uri);

      // Trigger the file upload
      const response = await fileUploadGeneric({
        companyId: company_id,
        fileName: fileName,
        fileUri: uri,
        fileType: type,
        generic: generic,
      });

      setStatus(true);
      setErrorMessage("File uploaded successfully");
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        console.log("User canceled the picker");
        setErrorMessage("File selection was canceled.");
      } else {
        console.error("Error selecting or uploading file", error);
        setErrorMessage("Failed to upload the file. Please try again.");
      }
    }
  };

  return handlePhotoSelection;
};

