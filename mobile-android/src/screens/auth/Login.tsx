// src/screens/auth/Login.tsx

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Image,
  SafeAreaView,
  TouchableOpacity,
  View,
  Text as RNText,
  StyleSheet,
  StatusBar,
  Keyboard,
  TextInput,
} from "react-native";
import { CommonActions, useFocusEffect } from "@react-navigation/native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient";
import { Formik, FormikProps } from "formik";
import * as Yup from "yup";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";

import { login, getUserOrCompanyDetails } from "../../api/auth.service";
import { setTokens, setLoading } from "../../store/slices/authSlice";
import { setProfileOrCompanyData } from "../../store/slices/profileDataSlice";

import ActivityIndicator from "../../components/ActivityIndicator/ActivityIndicator";
import TextInputField from "../../components/TextInput";
// TODO: Custom keyboard disabled for login screen - will be re-enabled later
// import CustomTextInput from "../../components/CustomKeyboard/CustomTextInput";
// import { GlobalKeyboardProvider } from "../../components/CustomKeyboard/GlobalKeyboardProvider";

import { styles } from "../../styles/loginStyle";
import { useResponsive } from "../../utils/responsive";
import { LoginFormValues } from "../../utils/models";

const validationSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().min(6, "Min 6 chars").required("Password is required"),
});
const initialValues: LoginFormValues = { email: "", password: "" };

function makeLocalStyles({
  moderateScale,
  verticalScale,
}: {
  moderateScale: (n: number) => number;
  verticalScale: (n: number) => number;
}) {
  return StyleSheet.create({
    iconRow: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: moderateScale(20),
    },
    iconButton: {
      alignItems: "center",
      marginHorizontal: moderateScale(50),
    },
    signUpIcon: {
      width: moderateScale(50),
      height: moderateScale(50),
    },
    signInIcon: {
      width: moderateScale(53),
      height: moderateScale(53),
    },
    iconLabel: {
      marginTop: moderateScale(8),
      fontSize: moderateScale(20),
      fontWeight: "700" as any,
      color: "#ffffff",
    },
    signInLabel: {
      color: "#FD7332",
      fontWeight: "700" as any,
    },
    keepView: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(8),
    },
    keepMeText: {
      marginLeft: moderateScale(8),
      fontSize: moderateScale(14),
      color: "#fff",
    },
    // Hardware keyboard input styles
    inputContainer: {
      width: "100%",
    },
    inputLabel: {
      fontSize: moderateScale(20),
      lineHeight: moderateScale(20),
      fontWeight: "700",
      color: "#FFFFFF",
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      paddingHorizontal: moderateScale(12),
      paddingVertical: 0,
      borderRadius: moderateScale(4),
      minHeight: moderateScale(44),
    },
    textInput: {
      flex: 1,
      fontSize: moderateScale(20),
      color: "#FFFFFF",
      paddingVertical: 0,
      paddingHorizontal: 0,
    },
    errorText: {
      marginTop: verticalScale(5),
      fontSize: moderateScale(12),
      color: "#EF4444",
    },
    eyeIconContainer: {
      padding: moderateScale(4),
    },
    eyeIcon: {
      width: moderateScale(24),
      height: moderateScale(24),
      tintColor: "#888888",
    },
  });
}

export default function LoginScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const formikRef = useRef<FormikProps<LoginFormValues>>(null);

  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // Removed modalVisible state - no longer needed
  const [checkingToken, setCheckingToken] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loading = useSelector((s: any) => s.auth.loading);
  const theme = useSelector((s: any) => s.theme.theme);
  const company = useSelector((s: any) => s.profile.profile);
  const token = useSelector((s: any) => s.auth.accessToken);

  const { scale, verticalScale, moderateScale, font, widthPercentageToDP } =
    useResponsive();

  const localStyles = makeLocalStyles({ moderateScale, verticalScale });

  const fetchProfile = useCallback(async () => {
    try {
      console.log('🔐 [LOGIN] Fetching user profile...');
      const resp = await getUserOrCompanyDetails();
      console.log('🔐 [LOGIN] Profile fetch successful:', resp?.user?.email);
      if (__DEV__) {
        console.log('🔐 [LOGIN] Company name from response:', resp?.company?.name);
      }
      dispatch(setProfileOrCompanyData(resp));
    } catch (e: any) {
      console.error('🔐 [LOGIN] Profile fetch failed:', e?.response?.status, e?.message);
      // Don't prevent login if profile fetch fails - user might be new and lack some permissions
      // The user can still access the app and the profile will retry later
      if (e?.response?.status === 401) {
        console.warn('🔐 [LOGIN] Profile 401 - user might be newly approved, continuing with login');
      }
    }
  }, [dispatch]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("accessToken");
        if (stored) {
          dispatch(
            setTokens({
              accessToken: stored,
              refreshToken: "",
              checkbox: true,
            })
          );
          await fetchProfile();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setCheckingToken(false);
      }
    })();
  }, [dispatch, fetchProfile]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (checkingToken) return;
    // Allow navigation if user is authenticated (has token) and company data is loaded
    // Don't require company.address as new users may not have it set up yet
    if (company?.company && token) {
      console.log('🔐 [LOGIN] Navigating to protected area. Company:', company?.company?.name);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Protected", params: { screen: "Home" } }],
        })
      );
    }
  }, [company, token, checkingToken, navigation]);

  const handleLogin = async (vals: LoginFormValues) => {
    dispatch(setLoading(true));
    setErrorMessage("");
    
    // Clear any existing error timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    try {
      console.log('🔐 [LOGIN] Attempting login with:', { email: vals.email });
      const resp = await login(vals);
      console.log('🔐 [LOGIN] Received response:', resp);
      if (resp && resp.accessToken && resp.refreshToken) {
        dispatch(
          setTokens({
            accessToken: resp.accessToken,
            refreshToken: resp.refreshToken,
            checkbox: keepLoggedIn,
          })
        );
        if (keepLoggedIn) {
          try {
            await AsyncStorage.setItem("accessToken", resp.accessToken);
          } catch (storageError) {
            console.warn("Failed to persist token:", storageError);
            // Continue login even if storage fails
          }
        }
        await fetchProfile();
        // Ensure navigation is ready before dispatching
        if (navigation && navigation.dispatch) {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Protected", params: { screen: "Home" } }],
            })
          );
        }
      } else if (resp?.message && resp.message.includes("under review")) {
        // Handle pending approval case specifically
        throw new Error(resp.message);
      } else {
        throw new Error(resp?.message || "Login failed");
      }
    } catch (e: any) {
      const message = e?.message || "An error occurred during login";
      setErrorMessage(message);
      
      // Auto-hide error message after 10 seconds
      errorTimeoutRef.current = setTimeout(() => {
        setErrorMessage("");
        errorTimeoutRef.current = null;
      }, 10000);
    } finally {
      dispatch(setLoading(false));
    }
  };

  useFocusEffect(
    useCallback(() => {
      formikRef.current?.resetForm();
      setErrorMessage("");
      
      // Clear any existing error timeout when screen loses focus
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }
    }, [])
  );
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  if (checkingToken) {
    return (
      <>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />
        <LinearGradient
          colors={["#2E4161", "#0C1F3F"]}
          style={styles.gradientView}
        >
          <SafeAreaView style={styles.container}>
            <ActivityIndicator size="large" color="#fff" />
          </SafeAreaView>
        </LinearGradient>
      </>
    );
  }

  // Responsive logo sizing: base design width then clamp to 90% of viewport
  const BASE_LOGO_WIDTH = 500; // adjust as your “standard” design
  const logoWidth = Math.min(
    scale(BASE_LOGO_WIDTH),
    widthPercentageToDP("90%")
  );

  return (
    // TODO: GlobalKeyboardProvider removed for login screen - will be re-enabled later
    // <GlobalKeyboardProvider>
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <LinearGradient
        colors={[theme.Backgroundcolor1, theme.Backgroundcolor2]}
        style={styles.gradientView}
      >
        <SafeAreaView style={styles.container}>
          <KeyboardAwareScrollView
            keyboardShouldPersistTaps="always"
            enableOnAndroid={true}
            enableAutomaticScroll={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: verticalScale(110), // Push content down further
              paddingBottom: keyboardVisible ? 300 : 0, // Add scrollable space only when keyboard is open
            }}
          >
            {/* Logo */}
            <View
              style={[
                styles.logoView,
                {
                  marginBottom: verticalScale(24),
                  alignItems: "center",
                },
              ]}
            >
              <Image
                source={require("../../assets/Images/applogo.png")}
                style={{
                  width: logoWidth,
                  height: undefined,
                  aspectRatio: 1.8, // tweak if your logo has a different intrinsic ratio
                  resizeMode: "contain",
                }}
              />
            </View>

            {/* Form */}
            <Formik
              innerRef={formikRef}
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleLogin}
              validateOnChange={false}
              validateOnBlur={false}
            >
              {({ handleChange, values, errors, touched, handleSubmit }) => {
                // Create a wrapper function to clear error on input change
                const handleInputChange = (field: string) => (text: string) => {
                  handleChange(field)(text);
                  if (errorMessage) {
                    setErrorMessage("");
                    if (errorTimeoutRef.current) {
                      clearTimeout(errorTimeoutRef.current);
                      errorTimeoutRef.current = null;
                    }
                  }
                };
                
                return (
                <View style={styles.textInputView}>
                  {/* TODO: Using native TextInput for hardware keyboard - custom keyboard will be re-enabled later */}

                  {/* Email Input */}
                  <View style={localStyles.inputContainer}>
                    <RNText style={localStyles.inputLabel}>Email</RNText>
                    <View style={{ height: verticalScale(6) }} />
                    <LinearGradient
                      colors={["#2C4161", "#1D2E4A"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={[
                        localStyles.inputWrapper,
                        {
                          borderWidth: moderateScale(1),
                          borderColor: values.email ? "#FD7332" : "#888888",
                        },
                      ]}
                    >
                      <TextInput
                        style={localStyles.textInput}
                        placeholder="you@example.com"
                        placeholderTextColor="#bbb"
                        value={values.email}
                        onChangeText={handleInputChange("email")}
                        keyboardType="email-address"
                        returnKeyType="next"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </LinearGradient>
                    {touched.email && errors.email && (
                      <RNText style={localStyles.errorText}>{errors.email}</RNText>
                    )}
                    <View style={{ height: moderateScale(30) }} />
                  </View>

                  {/* Password Input */}
                  <View style={localStyles.inputContainer}>
                    <RNText style={localStyles.inputLabel}>Password</RNText>
                    <View style={{ height: verticalScale(6) }} />
                    <LinearGradient
                      colors={["#2C4161", "#1D2E4A"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={[
                        localStyles.inputWrapper,
                        {
                          borderWidth: moderateScale(1),
                          borderColor: values.password ? "#FD7332" : "#888888",
                        },
                      ]}
                    >
                      <TextInput
                        style={localStyles.textInput}
                        placeholder="••••••••"
                        placeholderTextColor="#bbb"
                        value={values.password}
                        onChangeText={handleInputChange("password")}
                        secureTextEntry={!showPassword}
                        returnKeyType="done"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onSubmitEditing={() => handleSubmit()}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={localStyles.eyeIconContainer}
                      >
                        <Image
                          source={require("../../assets/Images/icons/eye.png")}
                          style={localStyles.eyeIcon}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    </LinearGradient>
                    {touched.password && errors.password && (
                      <RNText style={localStyles.errorText}>{errors.password}</RNText>
                    )}
                    <View style={{ height: verticalScale(10) }} />
                  </View>

                  {errorMessage && (
                    <TouchableOpacity 
                      activeOpacity={1}
                      onPress={() => {
                        setErrorMessage("");
                        if (errorTimeoutRef.current) {
                          clearTimeout(errorTimeoutRef.current);
                          errorTimeoutRef.current = null;
                        }
                      }}
                    >
                      <RNText style={styles.errormessage}>{errorMessage}</RNText>
                    </TouchableOpacity>
                  )}

                  {/* Keep me logged in */}
                  <View
                    style={[
                      localStyles.keepView,
                      { marginBottom: moderateScale(10) },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => setKeepLoggedIn((p) => !p)}
                    >
                      <Image
                        source={
                          keepLoggedIn
                            ? require("../../assets/Images/icons/selected.png")
                            : require("../../assets/Images/icons/unselected.png")
                        }
                        style={{
                          width: moderateScale(24),
                          height: moderateScale(24),
                        }}
                      />
                    </TouchableOpacity>
                    <RNText style={styles.keepMeLogText}>
                      Keep Me Logged In
                    </RNText>
                  </View>

                  {/* Icon buttons */}
                  <View style={localStyles.iconRow}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("TellUsAboutYourselfScreen")}
                      style={localStyles.iconButton}
                    >
                      <Image
                        source={require("../../assets/Images/icons/plus_icon_orange_fd7332.png")}
                        style={localStyles.signUpIcon}
                        resizeMode="contain"
                      />
                      <RNText style={localStyles.iconLabel}>Sign Up</RNText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleSubmit()}
                      disabled={loading}
                      style={localStyles.iconButton}
                    >
                      <Image
                        source={require("../../assets/Images/appIcon.png")}
                        style={localStyles.signInIcon}
                        resizeMode="contain"
                      />
                      <RNText
                        style={[localStyles.iconLabel, localStyles.signInLabel]}
                      >
                        Sign In
                      </RNText>
                    </TouchableOpacity>
                  </View>

                  {/* Help link */}
                  <TouchableOpacity
                    onPress={() => navigation.navigate("PasswordResetEmailScreen")}
                    style={{ marginTop: moderateScale(20) }}
                  >
                    <RNText style={styles.needHelpText}>
                      Forgot Password?
                    </RNText>
                  </TouchableOpacity>
                </View>
                );
              }}
            </Formik>

            {/* Modal removed - direct navigation to forgot password */}
          </KeyboardAwareScrollView>
        </SafeAreaView>
      </LinearGradient>
    {/* </GlobalKeyboardProvider> */}
    </>
  );
}
