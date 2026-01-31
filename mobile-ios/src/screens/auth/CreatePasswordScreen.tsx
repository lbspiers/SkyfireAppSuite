import React, { useState } from "react";
import {
  View,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient";
import { Formik } from "formik";
import * as Yup from "yup";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

import TextInputField from "../../components/TextInput";
import Button from "../../components/Button";
import Text from "../../components/Text";
import ActivityIndicator from "../../components/ActivityIndicator/ActivityIndicator";
import { styles } from "../../styles/registrationStyle";
import { BLUE_TC_TB, ORANGE_TB } from "../../styles/gradient";

interface FormValues {
  password: string;
  confirmPassword: string;
}

type RouteParams = {
  CreatePasswordScreen: {
    userInfo: {
      companyName: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  };
};

const passwordSchema = Yup.object().shape({
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])/, "Must contain at least one lowercase letter")
    .matches(/^(?=.*[A-Z])/, "Must contain at least one uppercase letter")
    .matches(/^(?=.*\d)/, "Must contain at least one number")
    .matches(/^(?=.*[@$!%*?&#._])/, "Must contain at least one special character")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), ""], "Passwords must match")
    .required("Confirm password is required"),
});

const CreatePasswordScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, "CreatePasswordScreen">>();
  const { userInfo } = route.params;
  
  const [loading, setLoading] = useState(false);

  const initialValues: FormValues = {
    password: "",
    confirmPassword: "",
  };

  const getPasswordStrength = (password: string): { level: string; color: string; width: number } => {
    if (!password) return { level: "", color: "#666", width: 0 };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&#._]/.test(password)) strength++;

    if (strength <= 2) return { level: "Weak", color: "#FF4444", width: 33 };
    if (strength <= 4) return { level: "Medium", color: "#FFB02E", width: 66 };
    return { level: "Strong", color: "#36B509", width: 100 };
  };

  const handleSubmit = (values: FormValues) => {
    setLoading(true);

    // Navigate to demo booking screen with combined data
    navigation.navigate("BookDemoScreen", {
      userInfo,
      passwordInfo: {
        password: values.password,
      },
    });

    setLoading(false);
  };

  return (
    <LinearGradient
      {...BLUE_TC_TB}
      style={styles.container}
    >
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
              <View style={[styles.progressBarFill, { width: "66%" }]} />
            </View>
            <Text style={styles.progressText}>Step 2 of 3</Text>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Hi {userInfo.firstName}, let's secure your account</Text>
            <Text style={styles.subtitle}>
              Create a strong password to protect your account
            </Text>
          </View>

          {/* Form */}
          <Formik
            initialValues={initialValues}
            validationSchema={passwordSchema}
            onSubmit={handleSubmit}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
            }) => {
              const passwordStrength = getPasswordStrength(values.password);
              
              return (
                <View style={styles.formContainer}>
                  {/* Password Requirements */}
                  <View style={styles.requirementsContainer}>
                    <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                    <View style={styles.requirementsList}>
                      <Text style={[
                        styles.requirementItem,
                        values.password.length >= 8 && styles.requirementMet
                      ]}>
                        ✓ At least 8 characters
                      </Text>
                      <Text style={[
                        styles.requirementItem,
                        /[a-z]/.test(values.password) && styles.requirementMet
                      ]}>
                        ✓ One lowercase letter
                      </Text>
                      <Text style={[
                        styles.requirementItem,
                        /[A-Z]/.test(values.password) && styles.requirementMet
                      ]}>
                        ✓ One uppercase letter
                      </Text>
                      <Text style={[
                        styles.requirementItem,
                        /\d/.test(values.password) && styles.requirementMet
                      ]}>
                        ✓ One number
                      </Text>
                      <Text style={[
                        styles.requirementItem,
                        /[@$!%*?&#._]/.test(values.password) && styles.requirementMet
                      ]}>
                        ✓ One special character (@$!%*?&#._)
                      </Text>
                    </View>
                  </View>

                  {/* Password Field */}
                  <TextInputField
                    label="Password"
                    placeholder="Enter your password"
                    value={values.password}
                    onChangeText={handleChange("password")}
                    onBlur={handleBlur("password")}
                    errorText={touched.password && errors.password ? errors.password : undefined}
                    secureTextEntry={true}
                    autoCapitalize="none"
                  />

                  {/* Password Strength Indicator */}
                  {values.password && (
                    <View style={styles.strengthContainerClose}>
                      <Text style={styles.strengthLabel}>
                        Password Strength: {passwordStrength.level}
                      </Text>
                      <View style={styles.strengthBarBackground}>
                        <View
                          style={[
                            styles.strengthBarFill,
                            {
                              width: `${passwordStrength.width}%`,
                              backgroundColor: passwordStrength.color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  )}

                  {/* Confirm Password Field */}
                  <TextInputField
                    label="Confirm Password"
                    placeholder="Re-enter your password"
                    value={values.confirmPassword}
                    onChangeText={handleChange("confirmPassword")}
                    onBlur={handleBlur("confirmPassword")}
                    errorText={touched.confirmPassword && errors.confirmPassword ? errors.confirmPassword : undefined}
                    secureTextEntry={true}
                    autoCapitalize="none"
                  />

                  {/* Continue Button */}
                  <View style={styles.buttonContainer}>
                    <Button
                      title={loading ? "Loading..." : "Continue"}
                      onPress={() => handleSubmit()}
                      selected={!!values.password && !!values.confirmPassword && !errors.password && !errors.confirmPassword}
                      disabled={loading || !!errors.password || !!errors.confirmPassword || !values.password || !values.confirmPassword}
                      width="100%"
                      height={50}
                      rounded={25}
                    />
                  </View>
                </View>
              );
            }}
          </Formik>
        </KeyboardAwareScrollView>
      </SafeAreaView>

      {loading && <ActivityIndicator />}
    </LinearGradient>
  );
};

export default CreatePasswordScreen;