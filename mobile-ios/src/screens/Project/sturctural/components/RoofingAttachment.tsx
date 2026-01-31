import { StyleSheet, View } from "react-native";
import StructuralSubHeader from "./StructuralSubHeader";
import DropDownField from "./DropDownField";
import Button from "../../../../components/Button";
import fontFamily from "../../../../utils/styleConstant/FontFamily";
import { useState } from "react";
import EquipmentPicker from "../../../../components/Project/EquipmentPicker";
import {
  FRAMING_MEMBER_SIZE,
  FRAMING_MEMBER_SPACING,
  ROOFING_MATERIAL,
} from "../../../../utils/constants";

const RoofingAttachment = () => {
  const [isAddAttachment, setAddAttachment] = useState<boolean>(false);
  const [images, setImages] = useState({
    Roof: [],
    Rail: [],
    Attachment: [],
    "2nd Roof": [],
    "2nd Rail": [],
    "2nd Attachment": [],
  });

  const handleSetImages = (type: string, selectedImages: any) => {
    setImages((prevImages: any) => ({
      ...prevImages,
      [type]: selectedImages,
    }));
  };

  const RenderFields = (title: string) => (
    <>
      <View style={styles.secondContainer}>
        <StructuralSubHeader
          label={`${title}Roof`}
          isInfo={title === "2nd " ? true : false}
          isCam={true}
          imageType={`${title}Roof`}
          imagesObject={images}
          setImageFun={handleSetImages}
        />
        <View style={styles.halfContainer}>
          <DropDownField
            label="Roofing Material*"
            dropDownLabel="Comp shingle"
            labelInfo={title === "" ? true : false}
            data={ROOFING_MATERIAL}
            onChangeValue={() => {}}
          />
        </View>
        <View style={styles.subContainer}>
          <View style={styles.halfContainer}>
            <DropDownField
              label="Framing Size*"
              dropDownLabel="Select Size"
              labelInfo={title === "" ? true : false}
              data={FRAMING_MEMBER_SIZE}
              onChangeValue={() => {}}
            />
          </View>
          <View style={styles.halfContainer}>
            <DropDownField
              label="Framing Spacing*"
              dropDownLabel="Select Spacing"
              labelInfo={title === "" ? true : false}
              data={FRAMING_MEMBER_SPACING}
              onChangeValue={() => {}}
            />
          </View>
        </View>
      </View>
      <View style={styles.secondContainer}>
        {[
          { label: `${title}Rail`, type: "Rail" },
          { label: `${title}Attachment`, type: "Mounting Hardware" },
        ].map((value, index) => (
          <>
            <StructuralSubHeader
              label={value.label}
              isInfo={true}
              isCam={true}
              imageType={value}
              imagesObject={images}
              setImageFun={handleSetImages}
            />
            <EquipmentPicker type={value.type} handleChange={function (value: any): void {}} />
          </>
        ))}
      </View>
    </>
  );

  return (
    <View>
      {RenderFields("")}
      <View style={styles.optionsContainer}>
        <Button
          children={"Roofing &\nAttachment"}
          color1={isAddAttachment ? "#FD7332" : "#0C1F3F"}
          color2={isAddAttachment ? "#EF3826" : "#2E4161"}
          onPress={() => setAddAttachment(!isAddAttachment)}
          style={styles.optionItem}
          labelStyle={[styles.optionText, { fontWeight: isAddAttachment ? "700" : "400" }]}
        />
      </View>
      {isAddAttachment && RenderFields("2nd ")}
    </View>
  );
};

export default RoofingAttachment;

const styles = StyleSheet.create({
  halfContainer: {
    width: "46%",
  },
  optionsContainer: {
    paddingVertical: 15,
    paddingBottom: 30,
  },
  subContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  secondContainer: {
    rowGap: 10,
  },
  optionItem: {
    borderRadius: 5,
    height: 40,
    width: "48%",
  },
  optionText: {
    fontFamily: fontFamily.lato,
    fontWeight: "400",
    fontSize: 14,
    textAlign: "center",
    color: "#fff",
  },
});
