import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Image } from "react-native";
// import {Camera} from 'react-native-vision-camera';
import ImagePicker from "react-native-image-crop-picker";
import PhotoEditor from "react-native-photo-editor";
import { useNavigation } from "@react-navigation/native";

const CameraImage: React.FC = () => {
  const [image, setImage] = useState(null);
  const navigation = useNavigation();

  // useEffect(() => {
  //   const requestPermission = async () => {
  //     const status = await Camera.requestCameraPermission();
  //     setCameraPermissionStatus(status);
  //   };

  //   requestPermission();
  // }, []);

  const openCamera = () => {
    ImagePicker.openCamera({
      width: 300,
      height: 300,
      cropping: true,
    })
      .then((image) => {
        console.log("IMage", image);
        editImage(image.path?.split("://")[1]);
      })
      .catch((error) => {
        console.log("Error capturing image:", error);
      });
  };

  // const editImage = (imagePath: any) => {
  //   try{
  //     PhotoEditor.Edit({
  //       path: imagePath,
  //     })
  //       .then((editedImage: any) => {
  //         console.log('Edited image:', editedImage);
  //         setImage(editedImage.path);
  //         // Handle the edited image (e.g., save, display, upload)
  //       })
  //   }catch((error: any) => {
  //       console.error('Error editing photo:', error);
  //     });
  // };
  const editImage = async (imagePath: any) => {
    try {
      const editedImage = PhotoEditor.Edit({
        path: imagePath,
        onDone: (res) => {
          setImage(res);

          console.log("on done", res);
        },
        onCancel: () => {
          console.log("on cancel");
        },
      });

      console.log("Edited image:", editedImage);
      // Handle the edited image (e.g., save, display, upload)
    } catch (error) {
      console.error("Error editing photo:", error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 0.2, justifyContent: "center" }}>
        <TouchableOpacity
          style={{
            height: "15%",
            width: "20%",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: "black" }}> Back </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 0.8, alignItems: "center" }}>
        <TouchableOpacity
          style={{
            height: "10%",
            width: "50%",
            backgroundColor: "skyblue",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 10,
          }}
          onPress={openCamera}
        >
          <Text>openCamera </Text>
        </TouchableOpacity>
        {image && (
          <Image
            source={{ uri: "file://" + image }}
            style={{ width: 400, height: 400 }}
          />
        )}
      </View>
    </View>
  );
};

export default CameraImage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    position: "absolute",
    bottom: 20,
    backgroundColor: "white",
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
});
