import React, { useEffect, useState } from "react";
import { Image, SafeAreaView, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient";
import { HeaderLogoComponent } from "../../components/Header";
import { styles } from "../../styles/stringingStyle";
import Text from "../../components/Text/index";
import Button from "../../components/Button";
import TextInputField from "../../components/TextInput";
import fontFamily from "../../utils/styleConstant/FontFamily";
import { TextInput } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { setCircuit1, setCircuit2, setCircuit3, setCircuit4, setCircuit5, setCircuit6, setCircuit7, setCircuit8, setCircuit9 } from "../../store/slices/stringingSlice";
import { RouteProp, useRoute } from "@react-navigation/native";
import { EquipmentLists } from "../../api/project.service";
import { setUpdateProjectDetails } from "../../store/slices/projectSlice";

const Stringing = ({ navigation }: any) => {
  const { params } :any= useRoute<RouteProp<string | any>>();
  const{debounceSave,details}=params
  const dispatch=useDispatch()
  const StringingData=useSelector((store:any)=>store?.stringing)
  const updateProjectDetails=useSelector((store:any)=>store?.project?.updateProjectDetails?.equipment_sets[0])
  const project = useSelector((store: any) => store?.project?.currentProject);
  const companyID = useSelector((store: any) => store?.profile?.profile);
  const projectID=useSelector((store: any) => store?.project?.currentProject)
  const fetchEquipmentLists=async()=>{
    try {
      const response= await EquipmentLists(projectID?.uuid,companyID?.company?.uuid);
      if(response?.status == 200){
        dispatch(setUpdateProjectDetails(response?.data?.data))
      }   
      else{
        console.log("Failed to fetch Equipment Lists",response?.data)
      }
    } catch (error:any) {
      console.log(error?.message)   
    }
  }
  // useEffect(()=>{
  //   if(updateProjectDetails?.stringing_data != undefined && updateProjectDetails?.stringing_data != null){
  //     dispatch(setCircuit1(updateProjectDetails?.stringing_data?.circuit1))
  //     dispatch(setCircuit2(updateProjectDetails?.stringing_data?.circuit2))
  //     dispatch(setCircuit3(updateProjectDetails?.stringing_data?.circuit3))
  //     dispatch(setCircuit4(updateProjectDetails?.stringing_data?.circuit4))
  //     dispatch(setCircuit5(updateProjectDetails?.stringing_data?.circuit5))
  //     dispatch(setCircuit6(updateProjectDetails?.stringing_data?.circuit6))
  //     dispatch(setCircuit7(updateProjectDetails?.stringing_data?.circuit7))
  //     dispatch(setCircuit8(updateProjectDetails?.stringing_data?.circuit8))
  //     dispatch(setCircuit9(updateProjectDetails?.stringing_data?.circuit9))
  //   }
  // },[])



  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradientView}>
      <SafeAreaView style={{ flex: 1, margin: 25 }}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps={"handled"}
          showsVerticalScrollIndicator={false}
          enableAutomaticScroll={true}
          extraScrollHeight={20}
          enableOnAndroid
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* <HeaderLogoComponent
            isTitle={true}
            title="MicroInverter 1 Stringing"
            back={false}
            applogo={true}
            onIconPress={() => console.log("Icon Pressed")}
            
          /> */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              children={"Microinverter 1 Stringing "}
              style={styles.headerTitle}
            />
            <TouchableOpacity onPress={() => console.log("")}>
              <Image
                source={require("../../assets/Images/fire-inactive.png")}
                style={styles.logoStyle}
              />
            </TouchableOpacity>
          </View>
          <View>
            <Text children={details?.name} style={styles.username}></Text>
            <View>
              <Text
                style={styles.Address}
                children={details?.address}
              ></Text>
              {/* <Text
                style={styles.Address}
                children={"Western City, ST 12345"}
              ></Text> */}
            </View>
            <View style={styles.btn_Installer}>
              <Text
                style={styles.installer}
                children={project?.details?.installer_project_id}
              ></Text>
              <Button
                color1={"#0C1F3F"}
                color2={"#213454"}
                color3={"#2E4161"}
                children={"< Back"}
                style={styles.btnStyle}
                labelStyle={styles.buttonText}
                onPress={() => {
                  fetchEquipmentLists()
                  navigation.goBack()
                 
                 // debounceSave()
                }}
              />
            </View>
          </View>
          <View style={{ marginTop: 20 }}>
            <View style={styles.headingContainer}>
              <Text style={styles.count} children={"Solar Panel Count :"} />
              <Text style={styles.value} children={"###"} />
            </View>
            <View style={{ marginTop: 20 }}>
              <Text style={styles.panels} children={"# of panels"} />
            </View>
            <View style={styles.circuitContainer}>
              <Text style={styles.circuit} children={"Branch circuit 1"} />
              <TextInputField
                placeholder={"###"}
                   onChangeText={(value:any)=>{
                    dispatch(setCircuit1(value))
                   }}
                //   onBlur={handleBlur("Manufacturer")}
                  value={ StringingData?.circuit1}
                labelStyle={{
                  fontFamily: fontFamily.lato,
                  fontSize: 14,
                  color: "rgba(134, 137, 144, 1)",
                  fontWeight: "400",
                  opacity: 0.5,
                }}
                placeHolderColor={"#868990"}
                activeUnderlineColor={"#ECECF24D"}
                isModal={true}
              />
            </View>
            <View style={styles.circuitContainer}>
              <Text style={styles.circuit} children={"Branch Circuit 2"} />
              <TextInputField
                placeholder={"###"}
                //   onChangeText={handleChange("Manufacturer")}
                //   onBlur={handleBlur("Manufacturer")}
                //   value={values.Manufacturer}
                value={StringingData?.circuit2}
                onChangeText={(value:any)=>{
                  dispatch(setCircuit2(value))
                 }}
                labelStyle={{
                  fontFamily: fontFamily.lato,
                  fontSize: 14,
                  color: "rgba(134, 137, 144, 1)",
                  fontWeight: "400",
                  opacity: 0.5,
                }}
                placeHolderColor={"#868990"}
                activeUnderlineColor={"#ECECF24D"}
                er
              />
            </View>
            <View style={styles.circuitContainer}>
              <Text style={styles.circuit} children={"Branch Circuit 3"} />
              <TextInputField
                placeholder={"###"}
                //   onChangeText={handleChange("Manufacturer")}
                //   onBlur={handleBlur("Manufacturer")}
                //   value={values.Manufacturer}
                value={ StringingData?.circuit3}
                onChangeText={(value:any)=>{
                  dispatch(setCircuit3(value))
                 }}
                labelStyle={{
                  fontFamily: fontFamily.lato,
                  fontSize: 14,
                  color: "rgba(134, 137, 144, 1)",
                  fontWeight: "400",
                  opacity: 0.5,
                }}
                placeHolderColor={"#868990"}
                activeUnderlineColor={"#ECECF24D"}
                er
              />
            </View>
            <View style={styles.circuitContainer}>
              <Text style={styles.circuit} children={"Branch Circuit 4"} />
              <TextInputField
                placeholder={"###"}
                //   onChangeText={handleChange("Manufacturer")}
                //   onBlur={handleBlur("Manufacturer")}
                //   value={values.Manufacturer}
                onChangeText={(value:any)=>{
                  dispatch(setCircuit4(value))
                 }}
                labelStyle={{
                  fontFamily: fontFamily.lato,
                  fontSize: 14,
                  color: "rgba(134, 137, 144, 1)",
                  fontWeight: "400",
                  opacity: 0.5,
                }}
                placeHolderColor={"#868990"}
                activeUnderlineColor={"#ECECF24D"}
                er
                value={ StringingData?.circuit4}
              />
            </View>
            <View style={styles.circuitContainer}>
              <Text style={styles.circuit} children={"Branch Circuit 5"} />
              <TextInputField
                placeholder={"###"}
                //   onChangeText={handleChange("Manufacturer")}
                //   onBlur={handleBlur("Manufacturer")}
                //   value={values.Manufacturer}
                onChangeText={(value:any)=>{
                  dispatch(setCircuit5(value))        
                 }}
                labelStyle={{
                  fontFamily: fontFamily.lato,
                  fontSize: 14,
                  color: "rgba(134, 137, 144, 1)",
                  fontWeight: "400",
                  opacity: 0.5,
                }}
                placeHolderColor={"#868990"}
                activeUnderlineColor={"#ECECF24D"}
                er
                value={ StringingData?.circuit5}
              />
            </View>
            <View style={styles.circuitContainer}>
              <Text style={styles.circuit} children={"Branch Circuit 6"} />
              <TextInputField
                placeholder={"###"}
                //   onChangeText={handleChange("Manufacturer")}
                //   onBlur={handleBlur("Manufacturer")}
                //   value={values.Manufacturer}
                onChangeText={(value:any)=>{
                  dispatch(setCircuit6(value))
                 }}
                labelStyle={{
                  fontFamily: fontFamily.lato,
                  fontSize: 14,
                  color: "rgba(134, 137, 144, 1)",
                  fontWeight: "400",
                  opacity: 0.5,
                }}
                placeHolderColor={"#868990"}
                activeUnderlineColor={"#ECECF24D"}
                er
                value={ StringingData?.circuit6}
              />
            </View>
            <View style={styles.circuitContainer}>
              <Text style={styles.circuit} children={"Branch Circuit 7"} />
              <TextInputField
                placeholder={"###"}
                //   onChangeText={handleChange("Manufacturer")}
                //   onBlur={handleBlur("Manufacturer")}
                //   value={values.Manufacturer}
                onChangeText={(value:any)=>{
                  dispatch(setCircuit7(value))

                 }}
                labelStyle={{
                  fontFamily: fontFamily.lato,
                  fontSize: 14,
                  color: "rgba(134, 137, 144, 1)",
                  fontWeight: "400",
                  opacity: 0.5,
                }}
                placeHolderColor={"#868990"}
                activeUnderlineColor={"#ECECF24D"}
                er
                value={ StringingData?.circuit7}
              />
            </View>
            <View style={styles.circuitContainer}>
              <Text style={styles.circuit} children={"Branch Circuit 8"} />
              <TextInputField
                placeholder={"###"}
                //   onChangeText={handleChange("Manufacturer")}
                //   onBlur={handleBlur("Manufacturer")}
                //   value={values.Manufacturer}
                onChangeText={(value:any)=>{
                  dispatch(setCircuit8(value))             
                 }}
                labelStyle={{
                  fontFamily: fontFamily.lato,
                  fontSize: 14,
                  color: "rgba(134, 137, 144, 1)",
                  fontWeight: "400",
                  opacity: 0.5,
                }}
                placeHolderColor={"#868990"}
                activeUnderlineColor={"#ECECF24D"}
                er
                value={ StringingData?.circuit8}
              />
            </View>
            <View style={styles.circuitContainer}>
              <Text style={styles.circuit} children={"Branch Circuit 9"} />
              <TextInputField
                placeholder={"###"}
                //   onChangeText={handleChange("Manufacturer")}
                //   onBlur={handleBlur("Manufacturer")}
                //   value={values.Manufacturer}
                onChangeText={(value:any)=>{
                  dispatch(setCircuit9(value))

                 }}
                labelStyle={{
                  fontFamily: fontFamily.lato,
                  fontSize: 14,
                  color: "rgba(134, 137, 144, 1)",
                  fontWeight: "400",
                  opacity: 0.5,
                }}
                placeHolderColor={"#868990"}
                activeUnderlineColor={"#ECECF24D"}
                er
                value={ StringingData?.circuit9}
              />
            </View>
            <View style={styles.circuitContainer}>
              <Text style={styles.circuit} children={"Branch Circuit 10"} />
              <TextInputField
                placeholder={"###"}
                //   onChangeText={handleChange("Manufacturer")}
                //   onBlur={handleBlur("Manufacturer")}
                //   value={values.Manufacturer}
                labelStyle={{
                  fontFamily: fontFamily.lato,
                  fontSize: 14,
                  color: "rgba(134, 137, 144, 1)",
                  fontWeight: "400",
                  opacity: 0.5,
                }}
                placeHolderColor={"#868990"}
                activeUnderlineColor={"#ECECF24D"}
                er
              />
            </View>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Stringing;
