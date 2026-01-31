import { StyleSheet } from "react-native";
import fontFamily from "../utils/styleConstant/FontFamily";
import FONTSIZE from "../utils/styleConstant/Font";
import COLORS from "../utils/styleConstant/Color";

export const styles = StyleSheet.create({
  gradientView: {
    flex: 1,
  },
  headerTitle:{
    fontFamily: fontFamily.lato,
    fontSize:20,
    color: COLORS.white,
    lineHeight:42,
    fontWeight: "400",
  },
  username: {
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    fontSize: 20,
    color: COLORS.white,
    marginTop: 20,
    marginBottom: 10,
  },
  mainTitle: {
    color: "#fff",
    // fontWeight:'400',
    textAlign: "left",
  },
  Address: {
    fontFamily: fontFamily.lato,
    fontWeight: "400",
    fontSize: 14,
    color: "rgba(255, 255, 255, 1)",
    lineHeight: 21,
  },
  subAddress: {},
  btnStyle: {
    width: 75,
    height: 30,
    borderRadius: 5,
  },
  installer: {
    color: "rgba(134, 137, 144, 1)",
  },
  btn_Installer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  buttonText: {
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 14,
    textAlign: "center",
    color: "#fff",
  },
  headingContainer: {
    flexDirection: "row",
    flex: 1,
    borderBottomColor: "#ECECF24D",
    borderBottomWidth: 1,
    paddingBottom: 18,
  },
  circuitContainer:{
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    justifyContent:'space-evenly'
  },
  inverterbtnContainer:{
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    justifyContent:'space-evenly',
    paddingTop:10,
    paddingBottom:10,
  
  },
  inputType:{
    flex:0.35,
    fontFamily: fontFamily.lato,
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.5)",
    lineHeight:21,
    fontWeight: "700",
    fontSize: 14,
  },
  count: {
    fontFamily: fontFamily.lato,
    flex: 0.6,
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  circuit:{
    fontFamily: fontFamily.lato,
    flex: 0.6,
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.5)",
    lineHeight:21,
    fontWeight: "700",
    fontSize: 14,
  },
  value:{
    fontFamily: fontFamily.lato,
    flex: 0.3,
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
  },
  panels:{
    textAlign:"right",
    paddingRight:50,
    fontFamily:fontFamily.lato,
    color: COLORS.white,
    fontSize:14,
    marginBottom:10},

    labels:{
      fontFamily:fontFamily.lato,
    color: COLORS.white,
    fontSize:14,
    marginBottom:10,
    fontWeight:"700"

    },

    logoStyle: {
        width: 48.13,
        height: 48,
        overflow: "hidden",
      },
      btnStyleInverter:{
        width:32,
        height:32,
        borderRadius:100,
      },
      btnContainerInverter:{
        flexDirection:'row',
        flex:0.3,
        justifyContent:'space-around',
        alignItems:'center',
      

      }
});
