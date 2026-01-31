import { useState } from "react"
import { StyleSheet, View } from "react-native"
import Text from "../../../../components/Text"
import COLORS from "../../../../utils/styleConstant/Color"
import Button from "../../../../components/Button"
import fontFamily from "../../../../utils/styleConstant/FontFamily"

const AvoidUpgradeComponent = ()=>{
    const [isMainPanel,setMainPanel] = useState([
        "Derate the Main Circuit Breaker",
        "Perform Load Side Tap",
        "Perform Line Side Tap",
        "Perform Sub Panel Tie-In",
        "Install a Meter Collar Adapter",
        "Proceed with Main Panel Upgrade"
      ])
    return(
    <View style={{rowGap:20}}>
     <View style={styles.textContainer}>
     <Text style={[styles.screwText,{color:COLORS.red}]} children={"Does not comply with the 120% Rule\nCannot land Current System Backend on\nMain Panel Bus Bar"}/>
     <Text  
     children={"To avoid a Main Panel  Upgrade\nCheck to see if you can..."} 
     style={styles.screwText}
     />
     </View>
   <View style={styles.listContainer}>
  {isMainPanel.map((value, index) => (
    <>
      {index === isMainPanel.length - 1 ? (
        <>
          <Text children="Or" style={styles.screwText} />
          <Button
            children={value}
            color1="#0C1F3F"
            color2="#2E4161"
            onPress={() => {
             
            }}
            style={styles.optionItem}
            labelStyle={[styles.optionText, { fontWeight: "700" }]}
          />
        </>
      ):
      <Button
        children={value}
        color1="#0C1F3F"
        color2="#2E4161"
        onPress={() => {
         
        }}
        style={styles.optionItem}
        labelStyle={styles.optionText}
      />}
    </>
  ))}
   </View>
   </View>
    )
} 

export default AvoidUpgradeComponent;

const styles = StyleSheet.create({
    screwText: {
        fontFamily: fontFamily.lato,
        fontWeight: "400",
        fontSize: 14,
        color: "rgba(255, 255, 255, 1)",
        lineHeight: 21,
        textAlign: "center",
        flexWrap: 'wrap',
      },
      textContainer: {
        alignSelf: "center",
        rowGap:20
      },
      listContainer:{
        rowGap: 20 ,paddingHorizontal:50,
        paddingVertical:10,
        paddingBottom:20
      },
      optionText: {
        fontFamily: fontFamily.lato,
        fontWeight: "400",
        fontSize: 14,
        textAlign: "center",
        color: "#fff",
      },
      optionItem: {
        borderRadius: 5,
        flex: 1,
        height:40,
      },
})