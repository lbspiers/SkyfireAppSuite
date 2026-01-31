import { StyleSheet } from "react-native";
import fontFamily from "../utils/styleConstant/FontFamily";
import COLORS from "../utils/styleConstant/Color";

export const styles = StyleSheet.create({
  gradientView: {
    flex: 1,
  },
  headerText: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    textAlign: "left",
    lineHeight: 40,
  },
  subText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: fontFamily.lato,
    fontWeight: "600",
    textAlign: "left",
    lineHeight: 20,
  },

  textView: {
    flex: 1,
    paddingHorizontal: 30,
  },
  listContainer: {
    paddingBottom: 100,
    rowGap: 20,
    padding: 30,
  },
  listItem: {
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#FFFFFF80",
  },
  listItemEdit: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  subContainer: {},
  eachBlock: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  listText: {
    flex: 1,
    alignSelf: "flex-start",
    color: "#FFFFFF80",
    fontSize: 17,
    fontFamily: fontFamily.lato,
    fontWeight: "700",
  },
  listTextEdit: {
    // flex: 1,
    // alignSelf: "flex-start",
    color: "#FFF",
    fontSize: 17,
    fontFamily: fontFamily.lato,
    fontWeight: "700",
  },
  highlightItem: {},
  label: {
    color: "#FFFFFF80",
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
});
