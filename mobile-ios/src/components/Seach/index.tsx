import * as React from "react";
import { View, StyleSheet, Image, TouchableOpacity, Platform } from "react-native";
import Modal from "react-native-modal";
import LinearGradient from "react-native-linear-gradient";
import COLORS from "../../utils/styleConstant/Color";
import Text from "../../components/Text";
import Button from "../Button";
import fontFamily from "../../utils/styleConstant/FontFamily";
import TextInputField from "../TextInput";
import { Formik, FormikProps } from "formik";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Colors } from "react-native/Libraries/NewAppScreen";
import logger from "../../utils/logger";

const SearchModal = ({ closeModal = () => {},projectLists,setProjectList,fetchProjects,id }: any) => {
  const formikRef = React.useRef<FormikProps<any>>(null);
  const [installerId, setInstallerId] = React.useState("");
  const[name,setName]=React.useState("");
  const[address,setAddress]=React.useState('');
  const[ahj,setAhj]=React.useState('');
  const[utility,setUtility]=React.useState('');

  const initialValues: any = {
    Manufacturer: "",
    modelNumber: "",
  };
  const handleSearch=()=>{
   
    if(installerId.trim() != "" || name.trim() != "" || address.trim() != ""){
      const tempProject=[...projectLists]
    const filterItem=tempProject.filter((item:any)=>{
      return item?.details?.installer_name===installerId ||
       item?.details?.installer_project_id === installerId || 
       item?.details?.customer_first_name?.toLowerCase() ===name?.toLowerCase() ||
        item?.details?.customer_last_name?.toLowerCase() === name?.toLowerCase() || 
        item?.company?.address=== address || item?.company?.city?.toLowerCase() == address?.toLowerCase()|| item?.company?.state?.toLowerCase()	 == address.toLowerCase() || 
        item?.company?.zip_code ==address
    })

    setProjectList(filterItem)
    closeModal()
  }
  }

  return (
    <Modal isVisible={true}>
      <LinearGradient colors={["#2F2F37", "#3C3F46"]} style={styles.container}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps={"handled"}
          showsVerticalScrollIndicator={false}
          enableAutomaticScroll={true}
          //   extraScrollHeight={20}
          enableOnAndroid
          style={{
            flex: 1,
          }}
        >
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 20,
              flex: 0.8,
            }}
          >
            <TextInputField
              label={"Installer ID / Skyfire ID"}
              keyboardType="default"
              onChangeText={(val: any) => setInstallerId(val)}
              value={installerId}
              labelStyle={styles.label}
              activeUnderlineColor={"#ECECF233"}
              isModal
              // error={touched.email && errors.email}
            />

            <TextInputField
              label={"First Name / Last Name"}
              keyboardType="default"
              onChangeText={(val: any) => setName(val)}
              value={name}
              labelStyle={styles.label}
              activeUnderlineColor={"#ECECF233"}
              isModal
              // error={touched.email && errors.email}
            />

            <TextInputField
              label={"Address"}
              keyboardType="default"
              onChangeText={(val: any) => setAddress(val)}
              value={address}
              labelStyle={styles.label}
              activeUnderlineColor={"#ECECF233"}
              isModal
              // error={touched.email && errors.email}
            />
            <TextInputField
              label={"AHJ"}
              keyboardType="default"
              onChangeText={(val: any) => setAhj(val)}
              value={ahj}
              labelStyle={styles.label}
              activeUnderlineColor={"#ECECF233"}
              isModal
              // error={touched.email && errors.email}
            />
            <TextInputField
              label={"Utility"}
              keyboardType="default"
              onChangeText={(val: any) => setUtility(val)}
              value={utility}
              labelStyle={styles.label}
              activeUnderlineColor={"#ECECF233"}
              isModal
              // error={touched.email && errors.email}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              flex: 0.2,
              paddingVertical: Platform.OS === "android" ? 25 : 10,
            }}
          >
            <Button
              color1={"#FD7332"}
              color2={"#EF3826"}
              children={"Search"}
              style={styles.createAcc}
              onPress={handleSearch}
              labelStyle={styles.buttonText}
            />
            <Button
              color1={"#8FC3E0"}
              color2={"#5CADDB"}
              // children={"Sign in"}
              children={"Clear Search X"}
              style={styles.createAcc}
              onPress={() =>{ 
                fetchProjects(id)
                closeModal()}}
              labelStyle={styles.buttonText}
            />
          </View>
        </KeyboardAwareScrollView>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    height: "75%",
    width: "100%",
    alignSelf: "center",
    borderRadius: 25,
    justifyContent: "center",
    // flex: 1,
  },
  createAcc: {
    height: Platform.OS === "ios" ? "100%" : "110%",
    width: "45%",
    borderRadius: 90,
    margin: 10,
    paddingVertical: Platform.OS === "ios" ? 7 : 5,
  },
  buttonText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
  },
  label: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "400",
    paddingTop: 10,
    opacity: 0.5,
  },
});
export default SearchModal;
