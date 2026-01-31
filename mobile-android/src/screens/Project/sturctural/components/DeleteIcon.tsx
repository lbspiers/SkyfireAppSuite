import { Image, StyleSheet, TouchableOpacity } from "react-native"
import COLORS from "../../../../utils/styleConstant/Color";

export const DeleteIcon =({containerStyle={},onIconPress=()=>{},iconStyle={}})=>{
    return (
       <TouchableOpacity style={[styles.iconContainer,containerStyle]} onPress={()=>onIconPress()} activeOpacity={0.5}>
                     <Image
                       style={[styles.icon,iconStyle]}
                       source={require("../../../../assets/Images/icons/delete.png")}
                       resizeMode="center"
                       tintColor={COLORS.grey}
                     />
       </TouchableOpacity>
    )
 }

const styles= StyleSheet.create({
    icon:{
        width: 20, height: 20
    },
    iconContainer:{
        width: 20, height: 20}
}); 