import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, View, ActivityIndicator, Image, TouchableOpacity } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient";
import { HeaderLogoComponent } from "../../components/Header";
import { Formik, FormikProps } from "formik";
import * as Yup from "yup"; // For validation schema
import Button from "../../components/Button"; // Assuming you have a Button component
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import Text from "../../components/Text";
import TextInputField from "../../components/TextInput";
import { styles } from "../../styles/terrritoryDetailsStyles";
import { Add_Service_Territory } from "../../api/introModule.service";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import { getUserOrCompanyDetails } from "../../api/auth.service";
import { setProfileOrCompanyData } from "../../store/slices/profileDataSlice";
import logger from "../../utils/logger";
import COLORS from "../../utils/styleConstant/Color";
import fontFamily from "../../utils/styleConstant/FontFamily";

type paramsProp = {
  title: string;
};
const TerritoryDetails = ({ navigation }: any) => {
  const formikRef = useRef<FormikProps<any>>(null);
  const companyId = useSelector((store: any) => store?.profile?.profile);
  const companyAddress = useSelector((store: any) => store?.profile?.companyAddress);

  logger.info("company address", JSON.stringify(companyAddress));
  logger.info("company id", JSON.stringify(companyId));
  const dispatch: any = useDispatch();
  const [useCompanyAddress, setUseCompanyAddress] = useState(false);
  const [useContractorLicense, setUseContractorLicense] = useState(false);
  const params = useRoute<RouteProp<string | any>>();
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  //const navigation = useNavigation<NavigationProp<string | any>>();
  const { title, setSelectedStates }: any = params?.params;
  const screenSchema = Yup.object().shape({
    address: Yup.string().required("Address is required"),
    // city: Yup.string().required("City is required"),
    // state: Yup.string().required("State is required"),
    // zip: Yup.string().required("Zip is required"),
    // license: Yup.string().required("Contractor's License # is required"),
  });

  const handleSubmit = async (data: any) => {
    const payload = {
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zip,
      stateCode: params?.params?.title,
      contractorLicense: data.license,
    };

    try {
      setLoading(true);
      setErrorMessage("");
      setUseCompanyAddress(false);
      setUseContractorLicense(false);

      const response = await Add_Service_Territory(companyId?.company?.uuid, payload);
      console.log("Response:", response?.data);

      if (response.status === 200) {
        Toast.show({
          text1: "Service Territory Added Successfully",
          type: "success",
          position: "top",
          visibilityTime: 1000,
        });
        await fetchCompanyOrProfileData();
        setSelectedStates((prevStates: any) => [...prevStates, title]);
        // navigation.navigate("serviceTerritory");
        navigation.goBack();
      } else {
        setErrorMessage("Failed to add service territory. Please try again.");
      }
    } catch (error: any) {
      console.error("Errorrrrrrrrr:", error?.message);
      Toast.show({
        text1: "An error occurred. Please try again.",
        type: "error",
        position: "top",
        visibilityTime: 1000,
      });
    } finally {
      setLoading(false); // Ensure this line runs in both success and error cases
    }
  };
  const fetchCompanyOrProfileData = async () => {
    try {
      const response = await getUserOrCompanyDetails();
      if (!response) {
        throw new Error("No data returned from the API");
      }
      dispatch(setProfileOrCompanyData(response));
    } catch (error: any) {
      console.error("Error fetching profile data:", error.message || error);
      // Optional: Handle specific types of errors if needed
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error("Server responded with:", error.response.status, error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received from server:", error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error setting up the request:", error.message);
      }
    }
  };
  // Initial values for the form
  const initialValues = {
    address: "",
    city: "",
    state: "",
    zip: "",
    license: "",
  };

  useFocusEffect(
    React.useCallback(() => {
      if (formikRef.current) {
        formikRef.current.resetForm();
      }
      setErrorMessage("");
    }, [])
  );
  // const handleCompanyAddressCheck = (isChecked: boolean) => {
  //   setUseCompanyAddress(isChecked);
  //   if (formikRef.current) {
  //     formikRef.current.setValues((prevValues: any) => ({
  //       ...prevValues,
  //       address: isChecked ? companyAddress?.address || "" : "",
  //       city: isChecked ? companyAddress?.city || "" : "",
  //       state: isChecked ? companyAddress?.state || "" : "",
  //       zip: isChecked ? companyAddress?.zipCode || "" : "",
  //     }));
  //   }
  // };
  const handleCompanyAddressCheck = (isChecked: boolean) => {
    setUseCompanyAddress(isChecked);

    const isAddressEmpty = !companyAddress || Object.keys(companyAddress).length === 0;

    if (formikRef.current) {
      formikRef.current.setValues((prevValues: any) => ({
        ...prevValues,
        address: isChecked
          ? (isAddressEmpty ? companyId?.company?.address : companyAddress?.address) || ""
          : "",
        city: isChecked
          ? (isAddressEmpty ? companyId?.company?.city : companyAddress?.city) || ""
          : "",
        state: isChecked
          ? (isAddressEmpty ? companyId?.company?.state : companyAddress?.state) || ""
          : "",
        zip: isChecked
          ? (isAddressEmpty ? companyId?.company?.zipCode : companyAddress?.zipCode) || ""
          : "",
      }));
    }
  };

  const handleContractLicenseCheck = (isChecked: boolean) => {
    setUseContractorLicense(isChecked);
    const isAddressEmpty = !companyAddress || Object.keys(companyAddress).length === 0;
    //contractorLicense companyAddress?.contractorLicense
    if (formikRef.current) {
      formikRef.current.setValues((prevValues: any) => ({
        ...prevValues,
        license: isChecked
          ? (isAddressEmpty
              ? companyId?.company?.contractorLicense
              : companyAddress?.contractorLicense) || ""
          : "",
      }));
    }
  };

  const CheckBox: React.FC<any> = ({ label, onCheckChange, isChecked }) => {
    const [checked, setChecked] = useState(isChecked);

    useEffect(() => {
      setChecked(isChecked);
    }, [isChecked]);

    const handlePress = () => {
      const newChecked = !checked;
      setChecked(newChecked);
      onCheckChange(newChecked);
    };

    return (
      <View style={styles.keepView}>
        <TouchableOpacity onPress={handlePress}>
          <Image
            style={{ height: 30, width: 30 }}
            source={
              checked
                ? require("../../assets/Images/icons/selected.png")
                : require("../../assets/Images/icons/unselected.png")
            }
          />
        </TouchableOpacity>
        <Text children={label} style={styles.keepMeLogText} />
      </View>
    );
  };
  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={[styles.gradientView]}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps={"handled"}
        showsVerticalScrollIndicator={false}
        enableAutomaticScroll={true}
        extraScrollHeight={0}
        enableOnAndroid
        contentContainerStyle={{}}
      >
        <HeaderLogoComponent
          isTitle={false}
          back={false}
          applogo={true}
          onBackButtonPress={() => navigation.goBack()}
          onIconPress={() => console.log("Icon Pressed")}
        />
        <View style={styles.fieldsView}>
          <Text children={"+" + " " + title || "Hello"} style={styles.heading} />
          <TouchableOpacity
            onPress={() => navigation.navigate("serviceTerritory")}
            style={styles.closeContainer}
          >
            <Image source={require("../../assets/Images/icons/x1.png")} style={styles.iconStyle} />
          </TouchableOpacity>
        </View>
        <Text children={"Add State"} style={[styles.label, { textAlign: "center" }]} />

        <View style={styles.checkBoxContainer}>
          <CheckBox
            label="Use Company Address"
            onCheckChange={handleCompanyAddressCheck}
            isChecked={useCompanyAddress}
          />
          <CheckBox
            label="Use Contractors License #"
            onCheckChange={handleContractLicenseCheck}
            isChecked={useContractorLicense}
          />
        </View>
        <View style={styles.textInputView}>
          <Formik
            innerRef={formikRef}
            initialValues={initialValues}
            validationSchema={screenSchema}
            validateOnChange={false}
            validateOnBlur={false}
            onSubmit={(values) => handleSubmit(values)}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <View style={{ justifyContent: "center", paddingTop: 20 }}>
                <View>
                  <TextInputField
                    label={"Address"}
                    style={styles.textInput}
                    labelStyle={styles.label}
                    placeholder={"Start typing…"}
                    placeHolderColor={styles.label.color}
                    onChangeText={handleChange("address")}
                    onBlur={handleBlur("address")}
                    value={values.address}
                    error={touched.address && errors.address}
                  />
                </View>
                <View>
                  <TextInputField
                    label={"City"}
                    placeHolderColor={styles.label.color}
                    style={styles.textInput}
                    labelStyle={styles.label}
                    placeholder={"Start typing…"}
                    onChangeText={handleChange("city")}
                    onBlur={handleBlur("city")}
                    value={values.city}
                    error={touched.city && errors.city}
                  />
                </View>
                <View>
                  <TextInputField
                    style={styles.textInput}
                    placeHolderColor={styles.label.color}
                    labelStyle={styles.label}
                    label={"State"}
                    placeholder={"Start typing…"}
                    onChangeText={handleChange("state")}
                    onBlur={handleBlur("state")}
                    value={values.state}
                    error={touched.state && errors.state}
                  />
                </View>
                <View>
                  <TextInputField
                    label={"Zip"}
                    placeholder={"Start typing…"}
                    placeHolderColor={styles.label.color}
                    style={styles.textInput}
                    labelStyle={styles.label}
                    onChangeText={handleChange("zip")}
                    onBlur={handleBlur("zip")}
                    value={values.zip}
                    error={touched.zip && errors.zip}
                  />
                </View>
                <View>
                  <TextInputField
                    label={"Contractor's License #"}
                    placeHolderColor={styles.label.color}
                    placeholder={"Start typing…"}
                    style={styles.textInput}
                    labelStyle={styles.label}
                    onChangeText={handleChange("license")}
                    onBlur={handleBlur("license")}
                    value={values.license}
                    error={touched.license && errors.license}
                  />
                </View>
                <View>
                  {Object.keys(errors).length === 0 && errorMessage.trim() !== "" && (
                    <Text children={errorMessage} style={styles.errorText} />
                  )}
                </View>
                <View style={styles.buttonView}>
                  <Button
                    color1={"#FD7332"}
                    color2={"#EF3826"}
                    children={
                      loading ? (
                        <ActivityIndicator color={"white"} />
                      ) : (
                        <Text style={{ fontSize: 16, fontWeight: 500 }} children={"Submit"} />
                      )
                    }
                    style={styles.join}
                    onPress={handleSubmit}
                    labelStyle={styles.buttonText}
                  />
                  <TouchableOpacity
                    style={{ paddingTop: 10 }}
                    onPress={() => navigation.goBack("")}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        color: COLORS.white,
                        fontFamily: fontFamily.lato,
                        fontSize: 14,
                        fontWeight: "700",
                      }}
                    >
                      {"< Back"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Formik>
        </View>
      </KeyboardAwareScrollView>
    </LinearGradient>
  );
};

export default TerritoryDetails;
