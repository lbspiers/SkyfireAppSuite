import { Platform, StyleSheet } from "react-native";
import COLORS from "../utils/styleConstant/Color";
import fontFamily from "../utils/styleConstant/FontFamily";

export const styles = StyleSheet.create({

    mainContainer:{
        flex:1,
        paddingTop:20,
        rowGap:20,paddingHorizontal: 30
    },    
    gradientView: {
      flex: 1, 
    },
    mainHeader:{
      fontFamily: fontFamily.lato,
      fontSize: 27,
      color: COLORS.white,
      fontWeight: "400",
      textAlign:'center',
      height:32
    },
     inventoryContainer:{
        height:45,
        width:"100%",
        borderRadius: 90,paddingVertical:Platform.OS==='ios'?7: 5  
     },
     inventoryText: {
      fontFamily: fontFamily.Inter_14pt_Black,
      fontSize: 14,
      color: COLORS.white,
      fontWeight: '500',
    },
    listContainer:{
      rowGap:10
    },
  });