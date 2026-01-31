import { Platform, StyleSheet } from "react-native";
import COLORS from "../utils/styleConstant/Color";
import fontFamily from "../utils/styleConstant/FontFamily";

export const styles = StyleSheet.create({

    mainContainer:{
        flex:1,
        justifyContent:'center',
    },  
    subContainer:{
      rowGap:35,flex:.7
    }, 
    gradientView: {
      flex: 1, paddingHorizontal: 30
    },
    uploadContainer:{
      padding:20,
       borderWidth:1.5,
       borderColor:COLORS.white,
       borderStyle:'dotted',
       borderRadius:15,
       rowGap:5, 
       paddingVertical:30
    },

    // Logo Style 
    logoContainer:{
      width:"100%",
      flexDirection:'row',
      alignItems:'center'
    },
    logoStyle :{
     width:30,
     height:44,
     overflow:'hidden'
    },
    headerTitle:{
      fontFamily: fontFamily.lato,
      fontSize: 27,
      color: COLORS.white,
      fontWeight: "400",
      textAlign:'center',
      height:32,
      width:'90%',paddingLeft:30
    },

    // Text Styles
 
    mainHeader:{
      fontFamily: fontFamily.lato,
      fontSize: 25,
      color: COLORS.white,
      fontWeight: "700",
      textAlign:'center',
      height:32
    },
    subText:{
      fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '400',
     opacity: 0.5,
    textAlign:'center',
    height:17
    },
    title:{
        fontFamily: fontFamily.lato,
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '400',
        textAlign:'left',
        
    },
    midText:{
      fontFamily: fontFamily.lato,
      fontSize: 18,
      color: COLORS.white,
      fontWeight: '400',
      opacity: 0.5,
      textAlign:'center',
      height:23
    },
     dragIcon:{
      fontFamily: fontFamily.lato,
      fontSize: 18,
      color: COLORS.white,
      opacity: 0.5,
      textAlign:'center'
     },
     browseBtn:{
      alignSelf:'center',
      paddingHorizontal:20,
      height:35,
      borderRadius: 90,margin:10,paddingVertical:Platform.OS==='ios'?7: 5  
     },
     uploadBtn:{
      alignSelf:'center',
      paddingHorizontal:20,
      height:35,
      width: '48%',
      borderRadius: 90,margin:10,paddingVertical:Platform.OS==='ios'?7: 5  
     },
     buttonText: {
      fontFamily: fontFamily.lato,
      fontSize: 14,
      color: COLORS.white,
      fontWeight: '700',
    },
    navBtnContainer:{
      alignItems:'center',
    },
    navBtn:{
      height:45,
      width:45 },
      fileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    fileName: {
        flex: 1,
        fontSize: 16,
    },
    fileList: {
        marginTop: 20,
    },
  });