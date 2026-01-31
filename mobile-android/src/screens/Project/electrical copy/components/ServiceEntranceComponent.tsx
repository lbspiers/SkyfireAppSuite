import React, { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import Text from "../../../../components/Text";
import Button from "../../../../components/Button";
import { CameraOption } from "../../CameraOption";
import DropdownComponent from "../../../../components/Dropdown";
import HelpMeDecide from "./HelpMeDecide";
import COLORS from "../../../../utils/styleConstant/Color";
import fontFamily from "../../../../utils/styleConstant/FontFamily";
import InfoIcon from "../../../../components/InfoIcon/InfoIcon";

interface ServiceEntranceProps {
  serviceSelection: string;
  selectedServiceEntrance?: string;
  images: any;
  breakerQuantity: number | undefined;
  handleSetImages: (type: string, selectedImages: any) => void;
  setQuantity: (value: number) => void;
  handleServiceSelection: (value: string) => void;
  handleServiceEntranceChange: (value: string) => void;
}

const ServiceEntranceComponent: React.FC<ServiceEntranceProps> = ({
  serviceSelection,
  images,
  breakerQuantity,
  selectedServiceEntrance,
  handleSetImages,
  setQuantity,
  handleServiceSelection,
  handleServiceEntranceChange,
}) => {
  const sesDropdownData = [
    "Hot Bus Panel",
    "Hot Bus Panel (Ranch Style)",
    "Meter & Main Panel All-in-one",
    "Meter & Main Panel Detached",
    "Pedestal",
    "Solar Ready",
  ].map((e) => Object.assign({ label: e, value: e }));

  return (
    <View>
      <View style={{ flexDirection: "row", paddingBottom: 5 }}>
        <Text children={"Service Entrance Section"} style={styles.backupTitle} />
        <InfoIcon containerStyle={styles.extraInfo} onIconPress={() => {}} />
      </View>

      <View>
        <View style={styles.secondsub}>
          <View style={styles.sub}>
            <Text children={"SES Type"} style={styles.fieldName} />
            <InfoIcon containerStyle={{ paddingBottom: 4 }} onIconPress={() => {}} />
          </View>
          <View>
            <CameraOption type={"SEType"} images={images} setImages={handleSetImages} />
          </View>
        </View>

        <DropdownComponent
          label={"Select SES Type"}
          placeholderColor={COLORS.grey}
          data={sesDropdownData}
          value={selectedServiceEntrance}
          onChangeValue={(value: string) => {
            handleServiceEntranceChange(value);
          }}
        />

        <View style={styles.secondsub}>
          <View style={styles.sub}>
            <Text children={"Main Circuit Breaker Quantity"} style={styles.fieldName} />
            <InfoIcon containerStyle={{ marginTop: -1 }} onIconPress={() => {}} />
          </View>
          <View>
            <CameraOption type={"SEMainCircuit"} images={images} setImages={handleSetImages} />
          </View>
        </View>

        <View style={styles.list}>
          {Array.from([0, 1, 2, 3]).map((value) => (
            <Button
              children={value}
              color1={breakerQuantity === value ? "#FD7332" : "#0C1F3F"}
              color2={breakerQuantity === value ? "#EF3826" : "#2E4161"}
              onPress={() => setQuantity(value)}
              style={styles.circleBtn}
              labelStyle={styles.circleBtnText}
              key={value}
            />
          ))}
        </View>
      </View>

      <View>
        <Text children={"Will you be performing a Main Panel Upgrade?"} style={styles.subTitle} />
        <View style={styles.serviceList}>
          {["Yes", "No", "Help Me Decide"].map((value) => (
            <View style={styles.serviceSection} key={value}>
              <Button
                children={
                  serviceSelection === value ? (
                    <Image
                      source={require("../../../../assets/Images/icons/checkMark.png")}
                      style={styles.circleCheckMark}
                    />
                  ) : (
                    ""
                  )
                }
                color1={serviceSelection === value ? "#FD7332" : "#0C1F3F"}
                color2={serviceSelection === value ? "#EF3826" : "#2E4161"}
                onPress={() => handleServiceSelection(value)}
                style={styles.circleSelection}
                labelStyle={styles.circleCheck}
              />
              <Text children={value} style={styles.buttonText} />
            </View>
          ))}
        </View>
      </View>

      {serviceSelection === "Help Me Decide" ? (
        <HelpMeDecide serviceSelection={handleServiceSelection} />
      ) : (
        <></>
      )}
    </View>
  );
};

export default ServiceEntranceComponent;

const styles = StyleSheet.create({
  backupTitle: {
    position: "relative",
    fontFamily: fontFamily.lato,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
  },
  secondsub: {
    flexDirection: "row",
    flex: 1,
  },
  sub: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexGrow: 1,
  },
  list: {
    flexDirection: "row",
    flex: 1,
    alignContent: "center",
    justifyContent: "space-evenly",
    paddingVertical: 20,
  },
  serviceList: {
    flexDirection: "row",
    flex: 1,
    alignContent: "center",
    paddingVertical: 20,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 50,
  },
  serviceSection: {
    rowGap: 15,
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  circleSelection: {
    width: 30,
    height: 30,
    borderRadius: 50,
  },
  subTitle: {
    position: "relative",
    fontFamily: fontFamily.lato,
    fontSize: 20,
    fontWeight: "400",
    color: COLORS.white,
  },
  extraInfo: {
    width: 25,
    height: 25,
    marginTop: -5,
  },
  fieldName: {
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    fontSize: 14,
    color: "rgba(134, 137, 144, 1)",
    lineHeight: 17,
  },
  buttonText: {
    fontFamily: fontFamily.lato,
    fontWeight: "400",
    fontSize: 14,
    lineHeight: 14,
    textAlign: "center",
    color: "#fff",
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
  circleBtnText: {
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
    verticalAlign: "middle",
    color: "#fff",
  },
});
