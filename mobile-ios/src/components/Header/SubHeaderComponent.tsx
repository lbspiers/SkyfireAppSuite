import { useEffect, useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "../../components/Text";
import Button from "../../components/Button";
import fontFamily from "../../utils/styleConstant/FontFamily";
import COLORS from "../../utils/styleConstant/Color";
import logger from "../../utils/logger";
import { moderateScale, verticalScale } from "../../utils/responsive";

export const SubHeaderComponent = ({
  name,
  isInfo,
  isOptions,
  infoStyle,
  headerStyle,
  handleNew = () => {},
  handleExisting = () => {},
  handleInfo = (name) => {},
  isNew,
  setIsNew,
}: {
  name: string;
  isInfo: boolean;
  infoStyle?: any;
  headerStyle?: any;
  isOptions: boolean;
  handleNew?: () => void;
  handleExisting?: () => void;
  handleInfo?: (name: string) => void;
  isNew?: boolean;
  setIsNew?: (newValue: boolean) => void;
}) => {
  return (
    <View style={styles.subContainer}>
      <View style={styles.secondsub}>
        <Text style={headerStyle || styles.headerText} children={name} />
        {isInfo && (
          <TouchableOpacity style={infoStyle} onPress={() => handleInfo(name)}>
            <Image source={require("../../assets/Images/icons/info.png")} style={styles.infoIcon} />
          </TouchableOpacity>
        )}
      </View>
      {isOptions && (
        <View style={styles.secondsub}>
          <Button
            color1={isNew ? "#FD7332" : "#0C1F3F"}
            color2={isNew ? "#EF3826" : "#2E4161"}
            style={styles.btnItem}
            onPress={() => {
              if (setIsNew) setIsNew(true);
              handleNew();
            }}
            labelStyle={[styles.buttonText, { fontWeight: isNew ? "700" : "400" }]}
          >
            New
          </Button>
          <Button
            color1={!isNew ? "#FD7332" : "#0C1F3F"}
            color2={!isNew ? "#EF3826" : "#2E4161"}
            style={styles.btnItem}
            onPress={() => {
              if (setIsNew) setIsNew(false);
              handleExisting();
            }}
            labelStyle={[styles.buttonText, { fontWeight: !isNew ? "700" : "400" }]}
          >
            Existing
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  btnItem: {
    borderRadius: moderateScale(5),
    flex: 1,
    height: verticalScale(28),
    alignSelf: "center",
  },
  buttonText: {
    fontFamily: fontFamily.lato,
    fontSize: moderateScale(14),
    color: COLORS.white,
    fontWeight: "400",
    textAlign: "center",
  },
  subContainer: {
    flex: 1,
    flexDirection: "row",
  },
  secondsub: {
    flexDirection: "row",
    flex: 1,
  },
  headerText: {
    color: COLORS.white,
    fontSize: moderateScale(20),
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    textAlign: "left",
    lineHeight: verticalScale(20),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(10),
  },
  infoIcon: {
    height: moderateScale(20),
    width: moderateScale(20),
    resizeMode: "contain",
    tintColor: COLORS.white,
  },
});
