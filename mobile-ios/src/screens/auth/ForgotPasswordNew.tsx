// src/screens/auth/ForgotPasswordNew.tsx

import React, { useRef, useState, useCallback } from "react";
import {
  Image,
  SafeAreaView,
  TouchableOpacity,
  View,
  Text as RNText,
  StyleSheet,
  StatusBar,
  Alert,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient";
import { Formik, FormikProps } from "formik";
import * as Yup from "yup";

import { resetPassword } from "../../api/auth.service";
import ActivityIndicator from "../../components/ActivityIndicator/ActivityIndicator";
import TextInputField from "../../components/TextInput";
import { styles as loginStyles } from "../../styles/loginStyle";
import { useResponsive } from "../../utils/responsive";

const validationSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
});

interface ForgotPasswordFormValues {
  email: string;
}

const initialValues: ForgotPasswordFormValues = { email: "" };

function makeLocalStyles({
  moderateScale,
  verticalScale,
}: {
  moderateScale: (n: number) => number;
  verticalScale: (n: number) => number;
}) {
  return StyleSheet.create({
    title: {
      fontSize: moderateScale(28),
      color: "#FFF",
      fontWeight: "700",
      textAlign: "center",
      marginBottom: verticalScale(8),
      fontFamily: "Lato-Bold",
    },
    subtitle: {
      fontSize: moderateScale(16),
      color: "#FFF",
      opacity: 0.8,
      textAlign: "center",
      marginBottom: verticalScale(40),
      lineHeight: moderateScale(22),
      paddingHorizontal: moderateScale(20),
    },
    backButton: {
      position: "absolute",
      top: verticalScale(60),
      left: moderateScale(20),
      zIndex: 10,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: moderateScale(12),
      padding: moderateScale(12),
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.2)",
    },
    backButtonText: {
      color: "#FFF",
      fontSize: moderateScale(16),
      fontWeight: "600",
    },
    formContainer: {
      paddingHorizontal: moderateScale(20),
      flex: 1,
      justifyContent: "center",
      minHeight: verticalScale(300),
    },
    submitButton: {
      marginTop: verticalScale(24),
      borderRadius: moderateScale(8),
      overflow: "hidden",
    },
    submitButtonGradient: {
      paddingVertical: verticalScale(16),
      alignItems: "center",
      justifyContent: "center",
    },
    submitButtonText: {
      color: "#FFF",
      fontSize: moderateScale(18),
      fontWeight: "700",
      fontFamily: "Lato-Bold",
    },
    loginLinkContainer: {
      alignItems: "center",
      marginTop: verticalScale(32),
      paddingBottom: verticalScale(20),
    },
    loginLinkText: {
      color: "#FFF",
      fontSize: moderateScale(16),
      opacity: 0.8,
    },
    loginLink: {
      color: "#FD7332",
      fontWeight: "600",
      textDecorationLine: "underline",
    },
    errorText: {
      color: "#FF6B6B",
      fontSize: moderateScale(14),
      textAlign: "center",
      marginTop: verticalScale(12),
      paddingHorizontal: moderateScale(20),
    },
  });
}

export default function ForgotPasswordNew() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const formikRef = useRef<FormikProps<ForgotPasswordFormValues>>(null);

  const { moderateScale, verticalScale } = useResponsive();
  const localStyles = makeLocalStyles({ moderateScale, verticalScale });

  // Clear form and errors when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (formikRef.current) {
        formikRef.current.resetForm();
      }
      setErrorMessage("");
    }, [])
  );

  const handleForgotPassword = async (values: ForgotPasswordFormValues) => {
    setErrorMessage("");

    console.log('🔐 [FORGOT PASSWORD] Redirecting to new password reset flow for:', values.email);

    // Navigate to the new password reset flow with the email pre-filled
    navigation.navigate("PasswordResetEmailScreen", {
      prefilledEmail: values.email
    });
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={["#2E4161", "#1D2A4F", "#0C1F3F"]}
        locations={[0, 0.6, 1]}
        style={loginStyles.gradientView}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Back Button */}
          <TouchableOpacity
            style={localStyles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <RNText style={localStyles.backButtonText}>← Back</RNText>
          </TouchableOpacity>

          <KeyboardAwareScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            enableAutomaticScroll
            extraScrollHeight={20}
            enableOnAndroid
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {/* Logo Section */}
            <View style={loginStyles.logoView}>
              <View style={loginStyles.logoContainer}>
                <Image
                  style={loginStyles.logoImage}
                  source={require("../../assets/Images/applogo.png")}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Title and Form */}
            <View style={localStyles.formContainer}>
              <RNText style={localStyles.title}>Reset Password</RNText>
              <RNText style={localStyles.subtitle}>
                Enter your email address and we'll send you instructions to reset your password.
              </RNText>

              <Formik
                innerRef={formikRef}
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleForgotPassword}
              >
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  values,
                  errors,
                  touched,
                  isValid,
                }) => (
                  <View>
                    {/* Email Input */}
                    <TextInputField
                      label="Email Address"
                      onChangeText={handleChange("email")}
                      onBlur={handleBlur("email")}
                      value={values.email}
                      error={touched.email && errors.email ? errors.email : undefined}
                      placeholder="Enter your email address"
                      placeHolderColor="rgba(255, 255, 255, 0.5)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />

                    {/* Error Message */}
                    {errorMessage.trim() !== "" && (
                      <RNText style={localStyles.errorText}>
                        {errorMessage}
                      </RNText>
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity
                      style={[
                        localStyles.submitButton,
                        !isValid && { opacity: 0.6 }
                      ]}
                      onPress={() => handleSubmit()}
                      disabled={!isValid}
                      accessibilityRole="button"
                      accessibilityLabel="Continue to reset password"
                    >
                      <LinearGradient
                        colors={["#FD7332", "#EF3826"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={localStyles.submitButtonGradient}
                      >
                        <RNText style={localStyles.submitButtonText}>
                          Continue
                        </RNText>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </Formik>
            </View>

            {/* Back to Login Link */}
            <View style={localStyles.loginLinkContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
                accessibilityRole="button"
                accessibilityLabel="Back to login"
              >
                <RNText style={localStyles.loginLinkText}>
                  Remember your password?{" "}
                  <RNText style={localStyles.loginLink}>Sign In</RNText>
                </RNText>
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}