import * as React from "react";
import {
  View,
  StyleSheet,
  Platform,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Modal from "react-native-modal";
import LinearGradient from "react-native-linear-gradient";
import COLORS from "../../utils/styleConstant/Color";
import Button from "../Button";
import fontFamily from "../../utils/styleConstant/FontFamily";
import Text from "../Text";
import { useDispatch, useSelector } from "react-redux";
import { EquipmentLists } from "../../api/project.service";
import { setUpdateProjectDetails } from "../../store/slices/projectSlice";

const ImageCapturedModal = ({
  isVisible,
  ImageArray,
  returnImages,
  openModal = () => {},
  deleteImage,
  loader,
  closeModal = () => {},
}: any) => {
  const updateProjectDetails = useSelector(
    (store: any) => store?.project?.updateProjectDetails?.equipment_sets[0]
  );
  // const [loader, setLoader] = React.useState(false);
  const handleSubmit = () => {
    returnImages();
  };

  const openModalFun = () => {
    openModal(true);
  };
  return (
    <Modal
      isVisible={isVisible}
      style={{ flex: 1, alignItems: "center", paddingVertical: 10 }}
    >
      <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.container}>
        <TouchableOpacity
          onPress={() => closeModal()}
          style={{ position: "absolute", right: 10, top: 10 }}
        >
          <Image
            source={require("../../assets/Images/icons/close.png")}
            style={{ height: 30, width: 30, tintColor: "white" }}
          />
        </TouchableOpacity>
        <View style={{ marginTop: 20 }}>
          {ImageArray.length > 0 ? (
            <FlatList
              data={ImageArray}
              contentContainerStyle={styles.flatListContainer}
              numColumns={3}
              renderItem={({ item, index }) => (
                <View style={styles.itemContainer}>
                  <Image
                    source={{ uri: item?.url }}
                    style={{ width: 86, height: 70 }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.closeContainer}
                    onPress={() => deleteImage(index)}
                  >
                    <Image
                      source={require("../../assets/Images/icons/close.png")}
                      style={styles.closeBtn}
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
          ) : (
            <View style={{}}>
              <Text
                style={{
                  color: COLORS.white,
                  textAlign: "center",
                  // fontFamily: fontFamily.lato,
                  // fontsize: 20,
                  fontWeight: "800",
                }}
              >
                No image selected please add more
              </Text>
            </View>
          )}
        </View>

        <View style={styles.buttonView}>
          <Button
            color1={"#8FC3E0"}
            color2={"#5CADDB"}
            children={"Add +"}
            style={styles.createAcc}
            onPress={openModalFun}
            labelStyle={styles.buttonText}
          />
          <Button
            color1={"#FD7332"}
            color2={"#EF3826"}
            // children={"Sign in"}
            children={
              loader ? <ActivityIndicator size="small" color="#fff" /> : "Save"
            }
            style={styles.createAcc}
            onPress={handleSubmit}
            labelStyle={styles.buttonTextSignin}
          />
        </View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 20,
    paddingVertical: 30,
  },
  createAcc: {
    height: "110%",
    width: "42%",
    borderRadius: 90,
    margin: 10,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
  },
  closeContainer: {
    position: "absolute",
    right: -18,
    zIndex: 1,
    top: -10,
  },
  closeBtn: {
    height: 25,
    width: 25,
    tintColor: "white",
  },
  buttonText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
  },
  buttonTextSignin: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
  },
  buttonView: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: Platform.OS === "ios" ? 30 : 30,
    paddingBottom: 30,
  },
  flatListContainer: {
    paddingHorizontal: 15,
    padding: 10,
    flexDirection: "row",
    columnGap: 20,
    rowGap: 20,
    alignItems: "center",
    // paddingHorizontal: 25,
    // paddingTop: 20,
    // flexDirection: "row",
    // columnGap: 20,
    flexWrap: "wrap",
    // rowGap: 20,
  },
  itemContainer: {
    margin: 10,
  },
});
export default ImageCapturedModal;
