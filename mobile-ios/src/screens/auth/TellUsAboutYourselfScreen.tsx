import React, { useRef, useState } from "react";
import {
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient";
import { Formik, FormikProps } from "formik";
import * as Yup from "yup";
import { useNavigation } from "@react-navigation/native";

import TextInputField from "../../components/TextInput";
import Button from "../../components/Button";
import Text from "../../components/Text";
import ActivityIndicator from "../../components/ActivityIndicator/ActivityIndicator";
import { styles } from "../../styles/registrationStyle";
import { BLUE_TC_TB } from "../../styles/gradient";
import axiosInstance from "../../api/axiosInstance";
import apiEndpoints from "../../config/apiEndPoint";
import { moderateScale, verticalScale } from "../../utils/responsive";

interface FormValues {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const aboutYourselfSchema = Yup.object().shape({
  companyName: Yup.string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must be less than 100 characters")
    .required("Company name is required"),
  firstName: Yup.string()
    .min(2, "First name must be at least 2 characters")
    .required("First name is required"),
  lastName: Yup.string()
    .min(2, "Last name must be at least 2 characters")
    .required("Last name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  phone: Yup.string()
    .matches(
      /^[\+]?[(]?[\d\s\-\(\)]{10,}$/,
      "Please enter a valid phone number"
    )
    .required("Phone number is required"),
});

const TellUsAboutYourselfScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const formikRef = useRef<FormikProps<FormValues>>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const initialValues: FormValues = {
    companyName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, "");

    // Format as (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
        6,
        10
      )}`;
    }
  };

  const validateEmail = async (email: string): Promise<boolean> => {
    try {
      const response = await axiosInstance.post(
        `${apiEndpoints.BASE_URL}${apiEndpoints.AUTH.VALIDATE_EMAIL}`,
        { email }
      );
      return response.data.available;
    } catch (error) {
      console.error("Email validation error:", error);
      return false;
    }
  };

  const handleSubmit = async (values: FormValues) => {
    setLoading(true);
    setErrorMessage("");

    try {
      // Check if email is available
      const emailAvailable = await validateEmail(values.email);

      if (!emailAvailable) {
        setErrorMessage(
          "This email is already registered. Please use a different email."
        );
        setLoading(false);
        return;
      }

      // Navigate to next screen with user data
      navigation.navigate("CreatePasswordScreen", {
        userInfo: {
          companyName: values.companyName,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email.toLowerCase(),
          phone: values.phone.replace(/\D/g, ""), // Store only digits
        },
      });
    } catch (error: any) {
      setErrorMessage(error.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient {...BLUE_TC_TB} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <KeyboardAwareScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with back button */}
          <View style={styles.headerContainer}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>←</Text>
              <Text style={styles.backButtonLabel}>Back</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <Image
              source={require("../../assets/Images/appIcon.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: "33%" }]} />
            </View>
            <Text style={styles.progressText}>Step 1 of 3</Text>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Tell Us About Yourself</Text>
            <Text style={styles.subtitle}>
              Let's start with some basic information
            </Text>
          </View>

          {/* Form */}
          <Formik
            innerRef={formikRef}
            initialValues={initialValues}
            validationSchema={aboutYourselfSchema}
            onSubmit={handleSubmit}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
              setFieldValue,
              isValid,
              dirty,
            }) => (
              <View style={styles.formContainer}>
                {/* Company Information */}
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Company Information</Text>

                  <TextInputField
                    label="Company Name"
                    placeholder="Enter your company name"
                    value={values.companyName}
                    onChangeText={handleChange("companyName")}
                    onBlur={handleBlur("companyName")}
                    errorText={
                      touched.companyName && errors.companyName
                        ? errors.companyName
                        : undefined
                    }
                    autoCapitalize="words"
                  />
                </View>

                {/* Personal Information */}
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Personal Information</Text>

                  <View style={styles.nameRow}>
                    <View style={styles.halfWidth}>
                      <TextInputField
                        label="First Name"
                        placeholder="First name"
                        value={values.firstName}
                        onChangeText={handleChange("firstName")}
                        onBlur={handleBlur("firstName")}
                        errorText={
                          touched.firstName && errors.firstName
                            ? errors.firstName
                            : undefined
                        }
                        autoCapitalize="words"
                      />
                    </View>

                    <View style={styles.halfWidth}>
                      <TextInputField
                        label="Last Name"
                        placeholder="Last name"
                        value={values.lastName}
                        onChangeText={handleChange("lastName")}
                        onBlur={handleBlur("lastName")}
                        errorText={
                          touched.lastName && errors.lastName
                            ? errors.lastName
                            : undefined
                        }
                        autoCapitalize="words"
                      />
                    </View>
                  </View>

                  <TextInputField
                    label="Email Address"
                    placeholder="Enter your email"
                    value={values.email}
                    onChangeText={handleChange("email")}
                    onBlur={handleBlur("email")}
                    errorText={
                      touched.email && errors.email ? errors.email : undefined
                    }
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <TextInputField
                    label="Phone Number"
                    placeholder="(000) 000-0000"
                    value={values.phone}
                    onChangeText={(text) => {
                      const formatted = formatPhoneNumber(text);
                      setFieldValue("phone", formatted);
                    }}
                    onBlur={handleBlur("phone")}
                    errorText={
                      touched.phone && errors.phone ? errors.phone : undefined
                    }
                    keyboardType="phone-pad"
                    maxLength={14}
                  />
                </View>

                {/* Continue Button */}
                <View style={styles.buttonContainer}>
                  <Button
                    title={loading ? "Loading..." : "Continue"}
                    onPress={() => handleSubmit()}
                    selected={isValid && dirty}
                    disabled={!isValid || !dirty || loading}
                    width="100%"
                    height={50}
                    rounded={25}
                  />
                </View>

                {/* Invite Code Button */}
                <TouchableOpacity
                  style={{
                    backgroundColor: '#1A2940',
                    borderRadius: moderateScale(12),
                    padding: moderateScale(16),
                    marginHorizontal: moderateScale(20),
                    marginTop: verticalScale(20),
                    marginBottom: verticalScale(10),
                    borderWidth: 1,
                    borderColor: '#FD7332',
                    alignItems: 'center',
                  }}
                  onPress={() => navigation.navigate('RedeemInviteCode')}
                >
                  <Text style={{ fontSize: moderateScale(16), fontWeight: '600', color: '#FFF' }}>
                    Have an invite code?
                  </Text>
                  <Text style={{ fontSize: moderateScale(14), color: '#A0A8B8', marginTop: verticalScale(4) }}>
                    Join your company's team
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Formik>
        </KeyboardAwareScrollView>
      </SafeAreaView>

      {loading && <ActivityIndicator />}

      {/* Error Message for email validation */}
      {errorMessage && (
        <View style={styles.floatingErrorContainer}>
          <Text style={styles.floatingErrorText}>{errorMessage}</Text>
        </View>
      )}
    </LinearGradient>
  );
};

export default TellUsAboutYourselfScreen;
