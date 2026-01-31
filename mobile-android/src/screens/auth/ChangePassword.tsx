import React, { useState } from "react";
import { SafeAreaView, Image, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { styles } from "../../styles/changePasswordStyles";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Text from "../../components/Text";
import { Formik } from "formik";
import * as Yup from "yup";
import TextInputField from "../../components/TextInput";
import Button from "../../components/Button";
import { useDispatch, useSelector } from "react-redux";
import ActivityIndicator from "../../components/ActivityIndicator/ActivityIndicator";
import { confirFormValues } from "../../utils/models";
import { PasswordReset } from "../../api/auth.service";
import { setLoading } from "../../store/slices/authSlice";
import COLORS from "../../utils/styleConstant/Color";

const ChangePassword = ({ navigation }: any) => {
  const { loading, resetToken } = useSelector((store: any) => store?.auth);
  const [errorMessage, setErrorMessage] = useState("");
  console.log(resetToken, "changePassword");
  const dispatch: any = useDispatch();
  const confirmPasswordSchema = Yup.object().shape({
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), ""], "Passwords must match")
      .required("Confirm Password is required"),
  });

  const initialValues: confirFormValues = {
    password: "",
    confirmPassword: "",
  };
  const handleResetPassword = async (data: any) => {
    setErrorMessage("");
    dispatch(setLoading(true));
    try {
      const response = await PasswordReset(data);
      if (response.status === "SUCCESS") {
        navigation.navigate("SuccessScreen", {
          heading: "RESET SUCCESS",
          description:
            "Your password has been reset. \n You are all set to log in with your new password!",
          buttonText: "Back to Sign in",
          screenName: "Login",
        });
      } else {
        setErrorMessage(
          response.message || "An error occurred while resetting the password."
        );
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        "An unexpected error occurred. Please try again later.";
      setErrorMessage(errorMsg);
      console.error(error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradientView}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps={"handled"}
          showsVerticalScrollIndicator={false}
          enableAutomaticScroll
          extraScrollHeight={20}
          contentContainerStyle={{ flex: 1 }}
        >
          <View style={styles.logoView}>
            <View style={styles.logoContainer}>
              <Image
                style={{ height: 212, width: 255 }}
                source={require("./../../assets/Images/applogo.png")}
              />
            </View>
            <View style={styles.signInTextView}>
              <Text
                children={"Change Password"}
                style={styles.signinText}
              ></Text>
            </View>
          </View>
          <View style={{ flex: 0.6 }}>
            <Formik
              initialValues={initialValues}
              validationSchema={confirmPasswordSchema}
              onSubmit={(values: any) => {
                handleResetPassword({
                  newPassword: values.password,
                  token: resetToken,
                });
              }}
              validateOnChange={false}
              validateOnBlur={false}
            >
              {({
                handleChange,
                handleBlur,
                values,
                errors,
                touched,
                handleSubmit,
              }) => (
                <View style={{ flex: 1, justifyContent: "center" }}>
                  <View style={styles.textInputView}>
                    <TextInputField
                      label={"Password"}
                      secureTextEntry
                      onChangeText={handleChange("password")}
                      onBlur={handleBlur("password")}
                      value={values.password}
                      activeUnderlineColor={"#ECECF233"}
                      error={touched.password && errors.password}
                      icon={require("./../../assets/Images/icons/eye.png")}
                    />
                    <TextInputField
                      label={"Confirm Password"}
                      onChangeText={handleChange("confirmPassword")}
                      onBlur={handleBlur("confirmPassword")}
                      value={values.confirmPassword}
                      labelStyle={styles.label}
                      activeUnderlineColor={"#ECECF233"}
                      error={errors.confirmPassword}
                    />
                    {Object.keys(errors).length == 0 &&
                      errorMessage.trim() !== "" && (
                        <Text style={{ color: COLORS.red, marginBottom: 10 }}>
                          {errorMessage}
                        </Text>
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
                      style={styles.createAcc}
                      onPress={handleSubmit}
                      labelStyle={styles.buttonTextSignin}
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
export default ChangePassword;
