import { Formik, FormikProps } from "formik";
import React, { useRef, useState } from "react";
import { Alert, Image, SafeAreaView, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient"; // Import LinearGradient
import * as Yup from "yup";
import TextInputField from "../../components/TextInput";
import { styles } from "../../styles/registrationStyle";
import {
  RegistrationFormValues,
  RegistrationPayload,
} from "../../utils/models";
import Button from "../../components/Button";
import Text from "../../components/Text";
import { register } from "../../api/auth.service";
import ActivityIndicator from "../../components/ActivityIndicator/ActivityIndicator";
import { useFocusEffect } from "@react-navigation/native";
import { HeaderLogoComponent } from "../../components/Header";
import { TouchableOpacity } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/Ionicons";
import { moderateScale, verticalScale } from "../../utils/responsive";

const RegistrationScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hidePassword, setHidePassword] = React.useState(false);
  const formikRef = useRef<FormikProps<any>>(null);
  const registrationSchema = Yup.object().shape({
    companyName: Yup.string().required("Company Name is required"),
    firstName: Yup.string().required("First Name is required"),
    lastName: Yup.string().required("Last Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    phone: Yup.string().required("Phone number is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), ""], "Passwords must match")
      .required("Confirm Password is required"),
  });
  const initialValues: RegistrationFormValues = {
    companyName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  };

  const handleRegister = async (data: any) => {
    setLoading(true);
    setErrorMessage("");
    const payloadData: RegistrationPayload = {
      companyName: data?.companyName?.trim(),
      firstName: data?.firstName?.trim(),
      lastName: data?.lastName?.trim(),
      email: data?.email?.trim().toLowerCase(),
      password: data?.password,
      phoneNo: data?.phone?.trim(),
    };
    try {
      console.log('🔐 [REGISTRATION] Sending registration data:', payloadData);
      const response = await register(payloadData);
      console.log('🔐 [REGISTRATION] Received response:', response);
      if (response?.status === "SUCCESS") {
        navigation.navigate("SuccessScreen", {
          heading: "Thank you \n for Registering!",
          description:
            "A Skyfire Onboarding Specialist \n will be in contact soon",
          buttonText: "Lets Go!",
          screenName: "Login",
        });
      } else {
        setErrorMessage(
          response?.message || "An error occurred during registration"
        );
      }
    } catch (error: any) {
      if (error.response) {
        // Extract the error message from the server response
        const errorMessage =
          error.response.data?.message || "An error occurred";
        // Show the error message to the user
        setErrorMessage(errorMessage);
      } else {
        // Handle unexpected errors
        setErrorMessage("Registration Failed, An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(
    React.useCallback(() => {
      if (formikRef.current) {
        formikRef.current.resetForm();
      }
      setErrorMessage("");
    }, [])
  );

  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradientView}>
      <SafeAreaView style={{ flex: 1 }}>
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
            applogo={false}
            onBackButtonPress={() => navigation.goBack()}
            onIconPress={() => {}} // onIconPress={() => openDrawer()}
            onBackButtonPress={() => navigation.goBack()}
          />
          <View style={styles.logoView}>
            <View style={styles.logoContainer}>
              <Image
                style={{ height: 89, width: 241 }}
                source={require("./../../assets/Images/applogo2.png")}
              />
            </View>
            <View style={styles.RegistrationView}>
              <Text
                children={"Create Account"}
                style={styles.RegistrationText}
              ></Text>
            </View>
          </View>
          <View style={styles.textInputView}>
            <Formik
              innerRef={formikRef}
              initialValues={initialValues}
              validationSchema={registrationSchema}
              onSubmit={(values) => {
                handleRegister(values);
              }}
              validateOnChange={false}
              validateOnBlur={false}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
              }) => (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    paddingTop: 20,
                  }}
                >
                  <View>
                    <TextInputField
                      label={"Company Name"}
                      onChangeText={handleChange("companyName")}
                      onBlur={handleBlur("companyName")}
                      value={values.companyName}
                      placeholder={"Type..."}
                      placeholderTextColor={"rgba(134, 137, 144, 1)"}
                      error={touched.companyName && errors.companyName}
                      infoIcon={require("./../../assets/Images/icons/asterisk.png")}
                    />
                  </View>
                  <View>
                    <TextInputField
                      label={"First Name"}
                      onChangeText={handleChange("firstName")}
                      onBlur={handleBlur("firstName")}
                      placeholder={"Type..."}
                      placeholderTextColor={"rgba(134, 137, 144, 1)"}
                      value={values.firstName}
                      error={touched.firstName && errors.firstName}
                      infoIcon={require("./../../assets/Images/icons/asterisk.png")}
                    />
                  </View>
                  <View>
                    <TextInputField
                      label={"Last Name"}
                      onChangeText={handleChange("lastName")}
                      onBlur={handleBlur("lastName")}
                      value={values.lastName}
                      placeholder={"Type..."}
                      placeholderTextColor={"rgba(134, 137, 144, 1)"}
                      error={touched.lastName && errors.lastName}
                      infoIcon={require("./../../assets/Images/icons/asterisk.png")}
                    />
                  </View>
                  <View>
                    <TextInputField
                      label={"Email"}
                      keyboardType="email-address"
                      onChangeText={handleChange("email")}
                      onBlur={handleBlur("email")}
                      placeholder={"Type..."}
                      placeholderTextColor={"rgba(134, 137, 144, 1)"}
                      value={values.email}
                      error={touched.email && errors.email}
                      infoIcon={require("./../../assets/Images/icons/asterisk.png")}
                    />
                  </View>
                  <View>
                    <TextInputField
                      label={"Phone"}
                      keyboardType="phone-pad"
                      onChangeText={handleChange("phone")}
                      onBlur={handleBlur("phone")}
                      placeholder={"Type..."}
                      placeholderTextColor={"rgba(134, 137, 144, 1)"}
                      value={values.phone}
                      error={touched.phone && errors.phone}
                      infoIcon={require("./../../assets/Images/icons/asterisk.png")}
                    />
                  </View>
                  <View>
                    <TextInputField
                      label={"Password"}
                      secureTextEntry={hidePassword ? false : true}
                      onChangeText={handleChange("password")}
                      onBlur={handleBlur("password")}
                      value={values.password}
                      placeholder={"Type..."}
                      placeholderTextColor={"rgba(134, 137, 144, 1)"}
                      error={touched.password && errors.password}
                      icon={require("../../assets/Images/icons/eye.png")}
                      passwordPress={() => setHidePassword(true)}
                      infoIcon={require("./../../assets/Images/icons/asterisk.png")}
                    />
                  </View>
                  <View>
                    <TextInputField
                      label={"Confirm Password"}
                      secureTextEntry
                      onChangeText={handleChange("confirmPassword")}
                      onBlur={handleBlur("confirmPassword")}
                      value={values.confirmPassword}
                      placeholder={"Type..."}
                      placeholderTextColor={"rgba(134, 137, 144, 1)"}
                      error={touched.confirmPassword && errors.confirmPassword}
                      icon={require("../../assets/Images/icons/eye.png")}
                      passwordPress={() => setHidePassword(true)}
                      infoIcon={require("./../../assets/Images/icons/asterisk.png")}
                    />
                  </View>
                  <View>
                    {Object.keys(errors).length === 0 &&
                      errorMessage.trim() !== "" && (
                        <Text
                          children={errorMessage}
                          style={styles.errorText}
                        ></Text>
                      )}
                  </View>
                  <View style={styles.btnContainer}>
                    <Button
                      color1={"#FD7332"}
                      color2={"#EF3826"}
                      children={
                        loading ? (
                          <ActivityIndicator color={"white"} />
                        ) : (
                          "Enter"
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

export default RegistrationScreen;
