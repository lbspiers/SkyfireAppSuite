import React, { useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Text,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient";
import { styles } from "../../styles/companyAddressStyles";
import { HeaderLogoComponent } from "../../components/Header";
import { Formik, FormikProps } from "formik";
import * as Yup from "yup"; // For validation schema
import Button from "../../components/Button"; // Assuming you have a Button component
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { TextInput } from "react-native-paper";
import { Update_Company_Address } from "../../api/introModule.service";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import { setCompanyAddress } from "../../store/slices/profileDataSlice";
import DropdownComponent from "../../components/Dropdown";
import USdata from "../../utils/json/states.json";
import stateCityZipData from "../../utils/json/city.json";
import axios from "axios";
import logger from "../../utils/logger";
const CompanyAddress = ({ navigation }: any) => {
  const formikRef = useRef<FormikProps<any>>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedState, setSelectedState] = useState<any>("");
  const [selectedCity, setSelectedCity] = useState("");
  const [zipCode, setZipCode] = useState<any>("");

  const dispatch: any = useDispatch();
  type StateCityZip = {
    [state: string]: string[] | undefined;
  };
  const stateCityZip: { stateCityZip: StateCityZip[] } = stateCityZipData;
  const companyId = useSelector((store: any) => store?.profile?.profile);
  //const navigation = useNavigation();
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

  const TextInputField = ({
    label,
    style,
    labelStyle,
    placeholder,
    error,
    placeHolderColor,
    ...rest
  }: any) => {
    return (
      <View style={{ marginVertical: 10 }}>
        <Text style={[styles.label, labelStyle]}>{label}</Text>

        <TextInput
          activeUnderlineColor={styles.label.color}
          contentStyle={styles.contentStyle}
          error={error}
          style={styles.textInput}
          {...rest}
          placeholder={placeholder}
          placeholderTextColor={styles.label.color}
        />
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  };

  // Validation schema using Yup
  const screenSchema = Yup.object().shape({
    address: Yup.string().required("Address is required"),
    city: Yup.string().required("City is required"),
    state: Yup.string().required("State is required"),
    zip: Yup.string()
      .required("Zip is required")
      .matches(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format"),
    license: Yup.string().required("Contractor's License # is required"),
  });

  const handleSubmit = async (data: any) => {
    const payload = {
      address: data?.address,
      city: selectedCity,
      state: selectedState, // Ensure `state` is correctly assigned
      zipCode: data?.zip, // Ensure `zipCode` is correctly assigned
      contractorLicense: data?.license,
    };
    logger.info("payloadddd",payload)
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await Update_Company_Address(
        companyId?.company?.uuid,
        payload
      );
      console.log(payload);
      if (response.status === 200) {
        console.log(response?.data, "<=================>");
        dispatch(setCompanyAddress(payload));
        // Reset form
        formikRef.current?.resetForm();
        // Clear error message
        setErrorMessage("");
        // Display success message
        await Toast.show({
          type: "success",
          position: "top",
          text1: "Company Address Updated Successfully",
          visibilityTime: 2000,
        });
        setLoading(true);
        setTimeout(() => {
          navigation.navigate("UploadLogo");
        }, 2000);
      } else {
        // Handle server error with a more detailed message
        setErrorMessage("Failed to update company address. Please try again.");
      }
    } catch (error: any) {
      // Error handling
      console.error("Error updating company address:", error);
      if (error.response) {
        // Server responded with a status outside the 200 range
        setErrorMessage(
          `Error: ${error.response?.data?.message || error.message}`
        );
      } else if (error.request) {
        // Request was made but no response received
        setErrorMessage("Error: No response received from the server");
      } else {
        // Something else happened
        setErrorMessage(`Error: ${error.message}`);
      }
    } finally {
      // Ensure loading state is reset
      setLoading(false);
    }
  };

  const states = stateCityZip.stateCityZip.map((item) => Object.keys(item)[0]);

  const cities = selectedState
    ? stateCityZip?.stateCityZip?.find((item: any) => item[selectedState])[
        selectedState
      ]
    : [];

  const fetchZipCode = async (state: string, city: string) => {
    const stateAbrivation = USdata.states.find(
      (item: any) => item?.full_name == state
    );

    // console.log("PAULOAD", stateAbrivation);
    try {
      const response = await axios.get(
        `https://api.zippopotam.us/us/${stateAbrivation?.short_name}/${city}`
      );

      const zipData = response.data?.places?.map(
        (
          item: {
            latitude: string;
            longitude: string;
            "place name": string;
            "post code": string;
          },
          index: number
        ) => ({ label: item["post code"], value: item["post code"] })
      );

      setZipCode(zipData);
    } catch (error) {
      console.error("Error fetching ZIP code:", error);
    }
  };

  console.log("CITIEs", selectedState);

  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradientView}>
      <SafeAreaView>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps={"handled"}
          showsVerticalScrollIndicator={false}
          enableAutomaticScroll={true}
          extraScrollHeight={20}
          enableOnAndroid
        >
          <HeaderLogoComponent
            isTitle={false}
            back={false}
            onBackButtonPress={() => navigation.goBack()}
            applogo={true}
            onIconPress={() => console.log("Icon Pressed")}
          />
          <View style={styles.fieldsView}>
            <View style={styles.logoContainer}>
              <Image
                style={{ height: 89, width: 241 }}
                source={require("./../../assets/Images/applogo2.png")}
              />
            </View>
            <View style={{ flex: 0.3, paddingLeft: 30, paddingVertical: 20 }}>
              <Text children={"Company Address"} style={styles.heading} />
            </View>
          </View>
          <View style={styles.textInputView}>
            <Formik
              innerRef={formikRef}
              initialValues={initialValues}
              //validationSchema={screenSchema}
              onSubmit={(values) => {
                handleSubmit(values);
              }}
              validateOnChange={false}
              validateOnBlur={false}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                setFieldValue,
                values,
                errors,
                touched,
              }) => (
                <View style={{ flex: 1, justifyContent: "center" }}>
                  <View>
                    <TextInputField
                      label={"Address"}
                      placeholder={"Type Address"}
                      onChangeText={handleChange("address")}
                      onBlur={handleBlur("address")}
                      value={values.address}
                      error={touched.address && errors.address}
                    />
                  </View>

                  <View>
                    <DropdownComponent
                      label={"Select State"}
                      data={states?.map((item: any) => ({
                        label: item,
                        value: item,
                      }))}
                      value={values.state}
                      labelField={"label"}
                      valueField={"value"}
                      onChangeValue={(selectedValue: any) => {
                        setSelectedState(selectedValue);
                        
                      }}
                    />
                    {/* <TextInputField
                      label={"State"}
                      placeholder={"Type..."}
                      onChangeText={handleChange("state")}
                      onBlur={handleBlur("state")}
                      value={values.state}
                      error={touched.state && errors.state}
                    /> */}
                  </View>
                  <View>
                    <DropdownComponent
                      label={"Select City"}
                      data={cities?.map((item: any) => ({
                        label: item,
                        value: item,
                      }))}
                      value={values.city}
                      labelField={"label"}
                      valueField={"value"}
                      onChangeValue={(selectedValue: any) => {
                        setSelectedCity(selectedValue);
                        fetchZipCode(selectedState, selectedValue);
                       
                      }}
                    />
                  </View>
                  <View>
                    <DropdownComponent
                      label={"Select Zipcode "}
                      data={zipCode || []}
                      value={values.zip}
                      labelField={"label"}
                      valueField={"value"}
                      onChangeValue={(selectedValue: any) => {
                        // setSelectedCity(selectedValue);
                        setFieldValue("zip",selectedValue);
                      }}
                    />
                    {/* <TextInputField
                      label={"Zip"}
                      placeholder={"Type Zip code"}
                      onChangeText={handleChange("zip")}
                      onBlur={handleBlur("zip")}
                      value={zipCode}
                      error={touched.zip && errors.zip}
                    /> */}
                  </View>
                  <View>
                    <TextInputField
                      label={"Contractor's License #"}
                      placeholder={"Type..."}
                      onChangeText={handleChange("license")}
                      onBlur={handleBlur("license")}
                      value={values.license}
                      error={touched.license && errors.license}
                    />
                  </View>
                  <View>
                    {Object.keys(errors).length === 0 &&
                      errorMessage.trim() !== "" && (
                        <Text
                          children={errorMessage}
                          style={styles.errorText}
                        />
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
                          "Submit"
                        )
                      }
                      style={styles.join}
                      onPress={handleSubmit}
                      labelStyle={styles.buttonText}
                    />
                  </View>
                </View>
              )}
            </Formik>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default CompanyAddress;