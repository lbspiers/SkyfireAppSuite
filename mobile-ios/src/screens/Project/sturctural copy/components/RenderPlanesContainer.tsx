import React from "react";
import { Image, View, StyleSheet, TouchableOpacity } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Text from "../../../../components/Text";
import Button from "../../../../components/Button";
import { CameraOption } from "../../CameraOption";
import { DeleteIcon } from "./DeleteIcon";
import DropDownField from "./DropDownField";
import { RenderQuantityArray } from "./RenderQuantityArray";
import COLORS from "../../../../utils/styleConstant/Color";
import fontFamily from "../../../../utils/styleConstant/FontFamily";
import InfoIcon from "../../../../components/InfoIcon/InfoIcon";

const RenderPlanes = ({
  item,
  handleDeletePlane,
  handleOptionChange,
  selectedType,
  setType,
  images,
  handleSetImages,
}) => (
  <View key={item.id} style={styles.planeContainer}>
    <View style={styles.planesContainer}>
      <View style={styles.camContainer}>
        <CameraOption
          type={`Plane${item.id}`}
          images={images}
          setImages={handleSetImages}
          camStyle={styles.cameraStyle}
        />
      </View>
      <View style={styles.deleteContainer}>
        {item.id > 1 && (
          <DeleteIcon
            onIconPress={() => handleDeletePlane(item.id)}
            containerStyle={styles.deleteIcon}
          />
        )}
      </View>
    </View>
    <Text
      style={[styles.backupTitle, { textAlign: "center" }]}
      children={
        (item.selectedOption !== "Ground"
          ? "Mounting Plane "
          : "Ground Mount ") + item.id
      }
    />

    <View style={{ paddingHorizontal: 20 }}>
      <View style={styles.subContainer}>
        {["Flush", "Tilt", "Ground"].map((value, index) => (
          <Button
            children={value}
            key={index}
            color1={item.selectedOption === value ? "#FD7332" : "#0C1F3F"}
            color2={item.selectedOption === value ? "#EF3826" : "#2E4161"}
            onPress={() => handleOptionChange(item.id, value)}
            style={styles.optionsBtn}
            labelStyle={[
              styles.buttonText,
              {
                fontWeight: item.selectedOption === value ? "700" : "400",
                fontSize: 12,
              },
            ]}
          />
        ))}
      </View>

      {item.selectedOption !== "Ground" ? (
        <>
          <View style={styles.secondSub}>
            {[
              "Check if 2nd\nRoof Type",
              "Check if 2nd\nPanel Type",
              "Check if 3rd\nPanel Type",
            ].map((value, index) => (
              <View style={{ alignItems: "center" }} key={index}>
                <View style={styles.rowContainer}>
                  <Text
                    style={[styles.fieldName, { textAlign: "center" }]}
                    children={value}
                  />
                  <InfoIcon
                    isgradientInfo={true}
                    containerStyle={{ marginTop: -10 }}
                  />
                </View>
                <Button
                  children={
                    selectedType === value ? (
                      <Image
                        source={require("../../../../assets/Images/icons/checkMark.png")}
                        style={styles.circleCheckMark}
                      />
                    ) : (
                      ""
                    )
                  }
                  color1={selectedType === value ? "#FD7332" : "#0C1F3F"}
                  color2={selectedType === value ? "#EF3826" : "#2E4161"}
                  onPress={() => setType(value)}
                  style={styles.extraCircle}
                  labelStyle={styles.circleCheck}
                />
              </View>
            ))}
          </View>
          <View style={styles.fieldsContainer}>
            {["Stories*", "Pitch*", "Azimuth*"].map((value, index) => (
              <View style={styles.fields} key={index}>
                <DropDownField
                  label={value}
                  labelInfo={false}
                  dropDownLabel="XX"
                />
              </View>
            ))}
          </View>
          {item.selectedOption === "Tilt" && (
            <View style={[styles.fieldsContainer, { paddingTop: 0 }]}>
              {["", "Array\nTilt*", "Array\nAzimuth*"].map((value, index) => (
                <View style={styles.fields} key={index}>
                  {index !== 0 && (
                    <DropDownField
                      label={value}
                      labelInfo={false}
                      dropDownLabel="XX"
                    />
                  )}
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={styles.fieldsContainer}>
          {["Trench\nLength", "Array\nTilt", "Array\nAzimuth"].map(
            (value, index) => (
              <View style={styles.fields} key={index}>
                <DropDownField
                  label={value}
                  labelInfo={false}
                  dropDownLabel="XX"
                />
              </View>
            )
          )}
        </View>
      )}
    </View>
    <RenderQuantityArray />

    <LinearGradient
      colors={["#FD7332", "#EF3826"]}
      style={[styles.gradientBorder, { marginTop: item.addQuantity ? 10 : 15 }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    />
  </View>
);

const styles = StyleSheet.create({
  planeContainer: {
    marginBottom: 10, // Space between planes
  },
  planesContainer: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "center",
    paddingTop: 10,
  },
  camContainer: {
    flexGrow: 1,
  },
  deleteContainer: {
    flex: 1,
  },
  cameraStyle: {
    flex: 1,
    alignSelf: "flex-end",
  },
  optionsBtn: {
    borderRadius: 5,
    padding: 4,
    height: 27,
    width: "25%",
  },
  deleteIcon: {
    justifyContent: "center",
    height: "100%",
    alignSelf: "flex-end",
    marginRight: 10,
  },
  backupTitle: {
    position: "relative",
    fontFamily: fontFamily.lato,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
  },
  subContainer: {
    flexDirection: "row",
    paddingVertical: 10,
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  secondSub: {
    flexDirection: "row",
    paddingVertical: 10,
    columnGap: 10,
  },
  buttonText: {
    fontFamily: fontFamily.lato,
    fontWeight: "400",
    fontSize: 14,
    lineHeight: 14,
    textAlign: "center",
    color: "#fff",
  },
  info: {
    marginTop: -50,
  },
  circleCheckMark: {
    height: 20,
    width: 20,
    tintColor: COLORS.white,
    resizeMode: "contain",
  },
  circleCheck: {
    height: 30,
  },
  extraCircle: {
    width: 30,
    height: 30,
    borderRadius: 50,
    marginLeft: -20,
  },
  fieldsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  fields: {
    width: "30%",
    paddingHorizontal: 10,
  },
  toggleButton: {
    marginVertical: 5,
    paddingLeft: "27%",
  },
  closeIcon: {
    width: 25,
    height: 25,
    transform: [{ rotate: "45deg" }],
  },
  gradientBorder: {
    paddingVertical: 1,
  },
  fieldName: {
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    fontSize: 14,
    color: COLORS.grey,
    lineHeight: 17,
  },
  rowContainer: {
    flexDirection: "row",
  },
});

export default RenderPlanes;
