import { StyleSheet } from "react-native";
import {
  scale,
  verticalScale,
  moderateScale,
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "../utils/responsive";

export const styles = StyleSheet.create({
  // full-screen gradient container
  gradientView: {
    flex: 1,
    paddingHorizontal: wp("4%"), // 4% of screen width
    paddingTop: hp("5%"), // 5% of screen height
  },
  container: {
    flex: 1,
  },
  // Logo wrapper
  logoView: {
    alignItems: "center",
    marginBottom: hp("5%"),
  },
  logoImage: {
    width: wp("120%"), // half of screen width
    height: wp("120%") * 0.4, // maintain 5:2 aspect ratio
    resizeMode: "contain",
  },
  textInputView: {
    marginTop: hp("2%"),
  },
  keepView: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: hp("1%"),
  },
  keepMeLogText: {
    color: "white",
    marginLeft: wp("2%"),
    fontSize: moderateScale(14),
  },
  errormessage: {
    color: "red",
    fontSize: moderateScale(12),
    marginTop: hp("1%"),
  },
  buttonView: {
    flexDirection: "row",
    justifyContent: "space-between",
    columnGap: wp("4%"),
    marginTop: hp("2%"),
  },
  needHelpText: {
    color: "white",
    fontSize: moderateScale(14),
    marginTop: hp("3%"),
    textAlign: "center",
  },
});
