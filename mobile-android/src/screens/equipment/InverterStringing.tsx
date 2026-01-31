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
import { EquipmentLists } from "../../api/project.service";
import { setUpdateProjectDetails } from "../../store/slices/projectSlice";
import { RouteProp, useRoute } from "@react-navigation/native";
import { setMttp1, setMttp2, setMttp3, setMttp4, setMttp5, setMttp6 } from "../../store/slices/inverterStringingSlice";

const InverterStringing = ({ navigation }: any) => {
  const { params } :any= useRoute<RouteProp<string | any>>();
  const{details,debounceSave}=params
  const dispatch=useDispatch()
  const project = useSelector((store: any) => store?.project?.currentProject);
  const StringingData=useSelector((store:any)=>store?.inverterStringing)
  const updateProjectDetails=useSelector((store:any)=>store?.project?.updateProjectDetails?.equipment_sets[0])
  const companyID = useSelector((store: any) => store?.profile?.profile);
  const projectID=useSelector((store: any) => store?.project?.currentProject)
  const inverterStringingValue = useSelector((store: any) => store?.inverterStringing);
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
  //     dispatch(setMttp1(updateProjectDetails?.stringing_data?.mttp1 || StringingData?.mttp1 ))
  //     dispatch(setMttp2(updateProjectDetails?.stringing_data?.mttp2  || StringingData?.mttp2))
  //     dispatch(setMttp3(updateProjectDetails?.stringing_data?.mttp3 || StringingData?.mttp3))
  //     dispatch(setMttp4(updateProjectDetails?.stringing_data?.mttp4 || StringingData?.mttp4))
  //     dispatch(setMttp5(updateProjectDetails?.stringing_data?.mttp5 ||  StringingData?.mttp5))
  //     dispatch(setMttp6(updateProjectDetails?.stringing_data?.mttp6 ||  StringingData?.mttp6))
  //   }
  //   fetchEquipmentLists()
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
              children={"Inverter 1 Stringing "}
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
                onPress={async() => 
                  {
                  await  fetchEquipmentLists()
                    navigation.goBack()
                }}
              />
            </View>
          </View>
          <View style={{ marginTop: 20 }}>
            <View style={styles.headingContainer}>
              <Text style={styles.count} children={"Solar Panel Count :"} />
              <Text style={styles.value} children={"###"} />
            </View>
            {/* <View style={{ marginTop: 20,flexDirection:'row',justifyContent:"flex-end" }}>
            <Text style={styles.panels} children={"# of Strings"} />
              <Text style={styles.panels} children={"# of panels"} />
            </View> */}
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                justifyContent: "space-evenly",
                marginTop: 20,
              }}
            >
              <View style={{ flex: 0.4 }}></View>
              <View>
                <Text style={styles.labels} children={"# of Strings"} />
              </View>
              <View>
                <Text style={styles.labels} children={"# of panels"} />
              </View>
            </View>
            <View style={styles.inverterbtnContainer}>
              <Text style={styles.inputType} children={"Input / MPPT 1"} />
              <View style={styles.btnContainerInverter}>
                <Button
                  color1={StringingData?.mttp1?.mttpvalue === 1 ? "#FD7332" : "#0C1F3F"}
                  color2={StringingData?.mttp1?.mttpvalue === 1 ? "#B92011" : "#2E4161"}
                  children={"1"}
                  style={styles.btnStyleInverter}
                  onPress={() =>{ 
                    const newMttp1State = { ...StringingData?.mttp1, mttpvalue: 1 };
                    console.log("on change value===>",newMttp1State);
                    dispatch(setMttp1(newMttp1State));
                   
                  }}
                  labelStyle={[
                    styles.buttonText,
                    { fontWeight: StringingData?.mttp1?.mttpvalue === 1 ? "700" : "400" },
                  ]}
                />
                <Button
                  color1={StringingData?.mttp1?.mttpvalue === 2 ? "#FD7332" : "#0C1F3F"}
                  color2={StringingData?.mttp1?.mttpvalue === 2? "#B92011" : "#2E4161"}
                  children={"2"}
                  style={styles.btnStyleInverter}
                  onPress={() =>{ 
                    const newMttp1State = { ...StringingData?.mttp1, mttpvalue: 2 };
                    dispatch(setMttp1(newMttp1State));
                   
                  }}
                  labelStyle={[
                    styles.buttonText,
                    { fontWeight: StringingData?.mttp1?.mttpvalue === 2 ? "700" : "400" },
                  ]}
                />
              </View>
              <TextInputField
                placeholder={"###"}
                onChangeText={(value:any)=>{
                  const newMttpState = { ...StringingData?.mttp1, panels: value };
                    dispatch(setMttp1(newMttpState));
                   
                 }}
                value={ StringingData?.mttp1?.panels}
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
            <View style={styles.inverterbtnContainer}>
              <Text style={styles.inputType} children={"Input / MPPT 2"} />
              <View style={styles.btnContainerInverter}>
                <Button
                  color1={StringingData?.mttp2?.mttpvalue === 1 ? "#FD7332" : "#0C1F3F"}
                  color2={StringingData?.mttp2?.mttpvalue === 1 ? "#B92011" : "#2E4161"}
                  children={"1"}
                  style={styles.btnStyleInverter}
                  onPress={() =>{ 
                    const newMttpState = { ...StringingData?.mttp2, mttpvalue: 1 };
                    dispatch(setMttp2(newMttpState));
                   
                  }}
                  labelStyle={[
                    styles.buttonText,
                    { fontWeight: StringingData?.mttp2?.mttpvalue === 1? "700" : "400" },
                  ]}
                />
                <Button
                  color1={StringingData?.mttp2?.mttpvalue === 2 ? "#FD7332" : "#0C1F3F"}
                  color2={StringingData?.mttp2?.mttpvalue === 2 ? "#B92011" : "#2E4161"}
                  children={"2"}
                  style={styles.btnStyleInverter}
                  onPress={() =>{ 
                    const newMttpState = { ...StringingData?.mttp2, mttpvalue: 2};
                    dispatch(setMttp2(newMttpState));
                    
                  }}
                  labelStyle={[
                    styles.buttonText,
                    { fontWeight: StringingData?.mttp2?.mttpvalue === 2 ? "700" : "400" },
                  ]}
                />
              </View>
              <TextInputField
                placeholder={"###"}
                onChangeText={(value:any)=>{
                  const newMttpState = { ...StringingData?.mttp2, panels: value };
                    dispatch(setMttp2(newMttpState));
                  
                 }}
                value={ StringingData?.mttp2?.panels}
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
            <View style={styles.inverterbtnContainer}>
              <Text style={styles.inputType} children={"Input / MPPT 3"} />
              <View style={styles.btnContainerInverter}>
                <Button
                  color1={StringingData?.mttp3?.mttpvalue === 1 ? "#FD7332" : "#0C1F3F"}
                  color2={StringingData?.mttp3?.mttpvalue === 1 ? "#B92011" : "#2E4161"}
                  children={"1"}
                  style={styles.btnStyleInverter}
                  onPress={() =>{ 
                    const newMttpState = { ...StringingData?.mttp3, mttpvalue: 1 };
                    dispatch(setMttp3(newMttpState));
                   
                  }}
                  labelStyle={[
                    styles.buttonText,
                    { fontWeight: StringingData?.mttp3?.mttpvalue === 1 ? "700" : "400" },
                  ]}
                />
                <Button
                  color1={StringingData?.mttp3?.mttpvalue === 2 ? "#FD7332" : "#0C1F3F"}
                  color2={StringingData?.mttp3?.mttpvalue === 2 ? "#B92011" : "#2E4161"}
                  children={"2"}
                  style={styles.btnStyleInverter}
                  onPress={() =>{ 
                    const newMttpState = { ...StringingData?.mttp3, mttpvalue: 2 };
                    dispatch(setMttp3(newMttpState));
                  
                  }}
                  labelStyle={[
                    styles.buttonText,
                    { fontWeight: StringingData?.mttp3?.mttpvalue === 2 ? "700" : "400" },
                  ]}
                />
              </View>
              <TextInputField
                placeholder={"###"}
                onChangeText={(value:any)=>{
                  const newMttpState = { ...StringingData?.mttp3, panels: value };
                    dispatch(setMttp3(newMttpState));
                    
                 }}
                value={ StringingData?.mttp3?.panels}
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
            <View style={styles.inverterbtnContainer}>
              <Text style={styles.inputType} children={"Input / MPPT 4"} />
              <View style={styles.btnContainerInverter}>
                <Button
                  color1={StringingData?.mttp4?.mttpvalue === 1 ? "#FD7332" : "#0C1F3F"}
                  color2={StringingData?.mttp4?.mttpvalue === 1 ? "#B92011" : "#2E4161"}
                  children={"1"}
                  style={styles.btnStyleInverter}
                  onPress={() =>{ 
                    const newMttpState = { ...StringingData?.mttp4, mttpvalue: 1 };
                    dispatch(setMttp4(newMttpState));
                    
                  }}
                  labelStyle={[
                    styles.buttonText,
                    { fontWeight: StringingData?.mttp4?.mttpvalue === 1 ? "700" : "400" },
                  ]}
                />
                <Button
                  color1={StringingData?.mttp4?.mttpvalue === 2 ? "#FD7332" : "#0C1F3F"}
                  color2={StringingData?.mttp4?.mttpvalue === 2 ? "#B92011" : "#2E4161"}
                  children={"2"}
                  style={styles.btnStyleInverter}
                  onPress={() =>{ 
                    const newMttpState = { ...StringingData?.mttp4, mttpvalue: 2 };
                    dispatch(setMttp4(newMttpState));
                  
                  }}
                  labelStyle={[
                    styles.buttonText,
                    { fontWeight: StringingData?.mttp4?.mttpvalue === 2 ? "700" : "400" },
                  ]}
                />
              </View>
              <TextInputField
                placeholder={"###"}
                onChangeText={(value:any)=>{
                  const newMttpState = { ...StringingData?.mttp4, panels: value };
                    dispatch(setMttp4(newMttpState));
                    
                 }}
                value={ StringingData?.mttp4?.panels}
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
            <View style={styles.inverterbtnContainer}>
              <Text style={styles.inputType} children={"Input / MPPT 5"} />
              <View style={styles.btnContainerInverter}>
                <Button
                  color1={StringingData?.mttp5?.mttpvalue === 1 ? "#FD7332" : "#0C1F3F"}
                  color2={StringingData?.mttp5?.mttpvalue === 1 ? "#B92011" : "#2E4161"}
                  children={"1"}
                  style={styles.btnStyleInverter}
                  onPress={() =>{ 
                    const newMttpState = { ...StringingData?.mttp5, mttpvalue: 1 };
                    dispatch(setMttp5(newMttpState));
                  
                  }}
                  labelStyle={[
                    styles.buttonText,
                    { fontWeight: StringingData?.mttp5?.mttpvalue === 1 ? "700" : "400" },
                  ]}
                />
                <Button
                  color1={StringingData?.mttp5?.mttpvalue === 2 ? "#FD7332" : "#0C1F3F"}
                  color2={StringingData?.mttp5?.mttpvalue === 2 ? "#B92011" : "#2E4161"}
                  children={"2"}
                  style={styles.btnStyleInverter}
                  onPress={() =>{ 
                    const newMttpState = { ...StringingData?.mttp5, mttpvalue: 2 };
                    dispatch(setMttp5(newMttpState));
                   
                  }}
                  labelStyle={[
                    styles.buttonText,
                    { fontWeight: StringingData?.mttp5?.mttpvalue === 2 ? "700" : "400" },
                  ]}
                />
              </View>
              <TextInputField
                placeholder={"###"}
                onChangeText={(value:any)=>{
                  const newMttpState = { ...StringingData?.mttp5, panels: value };
                    dispatch(setMttp5(newMttpState));
                    
                 }}
                value={ StringingData?.mttp5?.panels}
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
            <View style={styles.inverterbtnContainer}>
              <Text style={styles.inputType} children={"Input / MPPT 6"} />
              <View style={styles.btnContainerInverter}>
                <Button
                  color1={StringingData?.mttp6?.mttpvalue === 1 ? "#FD7332" : "#0C1F3F"}
                  color2={StringingData?.mttp6?.mttpvalue === 1 ? "#B92011" : "#2E4161"}
                  children={"1"}
                  style={styles.btnStyleInverter}
                  onPress={() =>{ 
                    const newMttpState = { ...StringingData?.mttp6, mttpvalue: 1 };
                    dispatch(setMttp6(newMttpState));
                   
                  }}
                  labelStyle={[
                    styles.buttonText,
                    { fontWeight: StringingData?.mttp6?.mttpvalue === 1 ? "700" : "400" },
                  ]}
                />
                <Button
                  color1={StringingData?.mttp6?.mttpvalue === 2 ? "#FD7332" : "#0C1F3F"}
                  color2={StringingData?.mttp6?.mttpvalue === 2 ? "#B92011" : "#2E4161"}
                  children={"2"}
                  style={styles.btnStyleInverter}
                  onPress={() =>{ 
                    const newMttpState = { ...StringingData?.mttp6, mttpvalue: 2 };
                    dispatch(setMttp6(newMttpState));
                   
                  }}
                  labelStyle={[
                    styles.buttonText,
                    { fontWeight: StringingData?.mttp6?.mttpvalue === 2 ? "700" : "400" },
                  ]}
                />
              </View>
              <TextInputField
                placeholder={"###"}
                onChangeText={(value:any)=>{
                  const newMttpState = { ...StringingData?.mttp6, panels: value };
                    dispatch(setMttp6(newMttpState));
                    
                 }}
                value={ StringingData?.mttp6?.panels}
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
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default InverterStringing;
