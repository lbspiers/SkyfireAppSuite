import { Formik, FormikProps } from "formik";
import React, { useRef, useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient"; // Import LinearGradient
import * as Yup from "yup";
import TextInputField from "../../components/TextInput";
import { styles } from "../../styles/forgotStyle";
import {
  ForgotPasswordFormValues,
  RegistrationFormValues,
} from "../../utils/models";
import Button from "../../components/Button";
import COLORS from "../../utils/styleConstant/Color";
import Text from "../../components/Text";
import { resetPassword } from "../../api/auth.service";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import ActivityIndicator from "../../components/ActivityIndicator/ActivityIndicator";

const ForgotPassword = (props: any) => {
  const navigation: any = useNavigation();
  const [loading, setLoading] = useState(false);
  const formikRef = useRef<FormikProps<any>>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const { params } = props.route;

  const registrationSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Email is required"),
    // phone: Yup.string().required("Phone number is required"),
  });

  const initialValues: ForgotPasswordFormValues = {
    email: "",
    phone: "",
  };
  const forgetPasswordwithEmail = async (data: any) => {
    setErrorMessage("");
    setLoading(true);
    try {
      const response = await resetPassword(data);
      console.log("Response:", response);

      if (response?.status === "SUCCESS") {
        navigation.navigate("SuccessScreen", {
          heading: "EMAIL SENT",
          description: "Check your email to reset \n your password",
          buttonText: "Change Password",
          screenName: "OtpScreen",
          email: data.email,
        });
      } else {
        // Handle non-success response status
        console.log("Failed response:", response);
        setErrorMessage("Failed to send the email. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(
        "An error occurred while sending the email. Please try again."
      );
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
      <SafeAreaView>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps={"handled"}
          showsVerticalScrollIndicator={false}
          enableAutomaticScroll
          extraScrollHeight={20}
          enableOnAndroid
        >
          <View style={styles.logoView}>
            <View style={styles.logoContainer}>
              <Image
                style={{ height: 212, width: 255 }}
                source={require("./../../assets/Images/applogo.png")}
              />
            </View>
            {/* <View style={styles.forgotpassView}>
              <Text
                children={"Can’t sign in ?"}
                style={styles.forgotPassText}
              ></Text>
              <Text
                children={"Let’s see if your name is on the list"}
                style={styles.tagLine}
              ></Text>
            </View> */}
          </View>
          {params?.flag === "email" ? (
            <View style={{ flex: 1, marginTop: 45 }}>
              <Text children={"Forgot email ?"} style={styles.heading}></Text>

              <Formik
                initialValues={initialValues}
                validationSchema={registrationSchema}
                onSubmit={(values) => {
                  Alert.alert(
                    "Registration Successful",
                    JSON.stringify(values)
                  );
                }}
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
                    <View style={{ flex: 1 }}>
                      <TextInputField
                        label={"Check with phone number"}
                        keyboardType="number"
                        onChangeText={handleChange("phone")}
                        onBlur={handleBlur("phone")}
                        value={values.phone}
                        error={errors.phone}
                        placeholder={"(XXX) XXX-XXXX"}
                        placeHolderColor={COLORS.white}
                      />
                    </View>
                    <View style={styles.btnContainer}>
                      <Button
                        color1={"#FD7332"}
                        color2={"#EF3826"}
                        children={"Enter"}
                        style={styles.createAcc}
                        onPress={() =>
                          navigation.navigate("SuccessScreen", {
                            heading: "TEXT SENT",
                            description: "Check your DMs and holla back.",
                            buttonText: "Change Password",
                            screenName: "OtpScreen",
                          })
                        }
                        labelStyle={styles.buttonText}
                      />
                    </View>
                  </View>
                )}
              </Formik>
            </View>
          ) : (
            <View style={{ flex: 1, marginTop: 45 }}>
              <Text
                children={"Forgot Password ?"}
                style={styles.heading}
              ></Text>
              <Formik
                innerRef={formikRef}
                initialValues={initialValues}
                validationSchema={registrationSchema}
                onSubmit={(values) => {
                  forgetPasswordwithEmail({ email: values.email });
                }}
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
                    <View style={{ flex: 1 }}>
                      <TextInputField
                        label={"Reset Password"}
                        // keyboardType="number"
                        onChangeText={handleChange("email")}
                        onBlur={handleBlur("email")}
                        value={values.email}
                        error={errors.email}
                        placeholder={"Type email address"}
                        placeHolderColor={COLORS.white}
                      />
                      {Object.keys(errors).length === 0 &&
                        errorMessage.trim() !== "" && (
                          <Text
                            children={errorMessage}
                            style={styles.error}
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
                        style={styles.createAcc}
                        onPress={handleSubmit}
                        labelStyle={styles.buttonText}
                      />
                    </View>
                  </View>
                )}
              </Formik>
            </View>
          )}
          <View style={{ paddingTop: 35, alignItems: "center" }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backSignin}>Back to Sign in</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ForgotPassword;
