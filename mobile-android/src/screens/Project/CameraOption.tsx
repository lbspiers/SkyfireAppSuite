import { TouchableOpacity, View, Text, Image, StyleSheet } from "react-native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import COLORS from "../../utils/styleConstant/Color";
import Modal from "react-native-modal";
import { useEffect, useState } from "react";
import fontFamily from "../../utils/styleConstant/FontFamily";
import ImageCapturedModal from "../../components/ImageCollection";
import { fileUploadGeneric } from "../../api/uploadfiles.service";
import { useSelector } from "react-redux";
import { PermissionsAndroid, Platform } from "react-native";
import { debugLogJson } from "../../utils/utlityFunc";

export const CameraOption = ({
  type,
  camStyle,
  setImages,
  images,
  onSave,
  loader = false,
}: {
  type: any;
  camStyle?: any;
  setImages?: any;
  images?: any;
  onSave?: any;
  loader?: boolean;
}) => {
  const companyID = useSelector((store: any) => store?.profile?.profile);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isImageModal, setImageModal] = useState(false);
  const [imagesCopy, setImagesCopy] = useState<any[]>(images[type] || []);

  const colorStyle: any = {
    color: images[type]?.length > 0 ? COLORS.white : styles.label.color,
  };

  useEffect(() => {
    setImagesCopy(images[type] || []);
  }, [images, type]);

  const handleCameraClick = () => {
    if ((images[type] || []).length > 0) {
      setImageModal(true);
    } else {
      setIsModalVisible(true);
    }
  };

  const handleOnCancel = () => {
    if ((images[type] || []).length > 0) {
      setImageModal(false);
      setIsModalVisible(false);
    } else {
      setIsModalVisible(false);
      setImagesCopy(images[type]);
    }
  };

  const handleDeleteImage = (index: number) => {
    const updatedImages = imagesCopy?.filter((_, i) => i !== index);

    setImagesCopy(updatedImages);
    setImages(type, updatedImages);
    // onSave()
  };

  const openModal = () => {
    // setImageModal(false);
    setIsModalVisible(true);
  };

  async function requestCameraPermission() {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
          title: "Camera Permission",
          message: "App needs camera permission to take pictures",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        });
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true; // On iOS, it will automatically work
    } catch (err) {
      console.warn(err);
      return false;
    }
  }

  // const openImagePicker = async (sourceType: string) => {
  //   const options: any = {
  //     selectionLimit: 0,
  //     mediaType: "photo",
  //     includeBase64: false,
  //   };

  //   if (sourceType === "gallery") {
  //     launchImageLibrary(options, handleImageResponse);
  //   } else {
  //     launchCamera(options, handleImageResponse);
  //   }
  // };
  const openImagePicker = async (sourceType: string) => {
    const hasCameraPermission = await requestCameraPermission();

    if (!hasCameraPermission) {
      console.log("Camera permission denied");
      return;
    }

    const options: any = {
      selectionLimit: 0,
      mediaType: "photo",
      includeBase64: false,
    };

    if (sourceType === "gallery") {
      launchImageLibrary(options, handleImageResponse);
    } else {
      launchCamera(options, handleImageResponse);
    }
  };

  async function uploadPhoto(asset: any) {
    const data = await fileUploadGeneric({
      companyId: companyID?.company?.uuid,
      fileName: asset.fileName,
      fileUri: asset.uri,
      fileType: "image/jpeg",
      directory: type,
    });
    console.log("data:=================>", data);

    const trimmedUrl = data.split("?")[0];
    return {
      url: trimmedUrl,
      id: Date.now(),
      fileName: asset.fileName,
    };
  }

  async function handleImageResponse(response: any) {
    console.log("response:", response);
    if (response.didCancel) {
      console.log("User canceled the picker");
    } else if (response?.errorCode) {
      console.log(`ImagePicker Error: ${response?.errorCode}`);
    } else {
      try {
        if (!response.assets) {
          throw new Error("No assets in response");
        }

        const { assets } = response;
        const uploadedFiles = await Promise.all(assets?.map(uploadPhoto));
        console.log("uploaded files", uploadedFiles);
        const updatedImages = [...imagesCopy, ...uploadedFiles];

        setImagesCopy(updatedImages);
        setImages(type, updatedImages);
        setIsModalVisible(false);
      } catch (error: any) {
        console.error("Error uploading file", error?.message);
      }
    }
  }

  return (
    <>
      <TouchableOpacity style={camStyle || styles.camContainer} onPress={() => handleCameraClick()}>
        <View style={styles.camSub}>
          <Text style={[styles?.camText, colorStyle]}>{images[type]?.length}</Text>
          <Image
            source={require("../../assets/Images/icons/camera.png")}
            style={styles.camIcon}
            tintColor={images[type]?.length > 0 ? "green" : undefined}
          />
        </View>
      </TouchableOpacity>
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setIsModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={() => openImagePicker("gallery")}>
            <Text style={styles.modalButton}>Open Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openImagePicker("camera")}>
            <Text style={styles.modalButton}>Open Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleOnCancel()}>
            <Text style={styles.modalButton}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      <ImageCapturedModal
        isVisible={isImageModal}
        ImageArray={imagesCopy}
        loader={loader}
        // returnImages={handleImagesCopy}
        returnImages={onSave}
        openModal={() => {
          setImageModal(false);
          setTimeout(() => {
            openModal();
          }, 600);
        }}
        deleteImage={handleDeleteImage}
        closeModal={() => setImageModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  camText: {
    color: "#FFFFFF80",
    fontSize: 14,
    fontFamily: fontFamily.lato,
    fontWeight: "600",
  },
  camContainer: {
    justifyContent: "flex-end",
    flex: 1,
    alignItems: "flex-end",
  },
  camSub: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 3,
    flex: 1,
  },
  camIcon: {
    height: 25,
    width: 25,
  },
  label: {
    color: "#FFFFFF80",
  },
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButton: {
    fontSize: 18,
    borderBottomWidth: 0.1,
    paddingVertical: 12,
    textAlign: "center",
    fontWeight: "600",
  },
});
