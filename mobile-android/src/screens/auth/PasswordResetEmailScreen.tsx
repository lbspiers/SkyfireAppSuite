// Password Reset Email Input Screen
// Beautiful, accessible email input with real-time validation

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  SafeAreaView,
  TouchableOpacity,
  Text as RNText,
  StyleSheet,
  StatusBar,
  Keyboard,
  Platform,
  Animated,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, FormikProps } from 'formik';
import * as Yup from 'yup';

import {
  requestResetCode,
  setEmail,
  resetState,
  setStep,
} from '../../store/slices/passwordResetSlice';
import { trackEmailSubmitted, startPasswordResetSession } from '../../utils/analytics';
import { useResponsive } from '../../utils/responsive';
import { BLUE_TC_TB } from '../../styles/gradient';

import TextInputField from '../../components/TextInput';

import Button from '../../components/Button';
import { HeaderLogoComponent } from '../../components/Header';

// Validation schema
const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required')
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please enter a valid email format'
    ),
});

interface FormValues {
  email: string;
}

const PasswordResetEmailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const dispatch = useDispatch();
  const formikRef = useRef<FormikProps<FormValues>>(null);

  // Get prefilled email from navigation params
  const params = route.params as { prefilledEmail?: string } | undefined;
  const prefilledEmail = params?.prefilledEmail;

  // Redux state with safe fallbacks - using individual selectors to avoid rerenders
  const isLoading = useSelector((state: any) => state.passwordReset?.isLoading || false);
  const error = useSelector((state: any) => state.passwordReset?.error || null);
  const email = useSelector((state: any) => state.passwordReset?.email || '');

  // Local state
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Responsive utilities
  const { moderateScale, verticalScale, scale } = useResponsive();

  // Initialize session and animations
  useEffect(() => {
    dispatch(resetState());
    startPasswordResetSession();

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Keyboard listeners
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
  }, [dispatch, fadeAnim, slideAnim]);

  // Focus effect to reset form
  useFocusEffect(
    React.useCallback(() => {
      formikRef.current?.resetForm();
      setSubmitAttempted(false);
    }, [])
  );

  // Handle form submission
  const handleSubmit = async (values: FormValues) => {
    setSubmitAttempted(true);

    try {
      // Update Redux state
      dispatch(setEmail(values.email));

      // Track analytics
      trackEmailSubmitted(values.email, false); // Will be updated on success

      // Request reset code
      const result = await dispatch(requestResetCode({
        email: values.email,
        method: 'email',
      }));

      if (result.type === 'passwordReset/requestCode/fulfilled') {
        // Navigate to code sent screen
        navigation.navigate('PasswordResetCodeScreen');
      }
    } catch (error) {
      console.error('Failed to request reset code:', error);
    }
  };

  // Navigate back to login
  const handleBackToLogin = () => {
    dispatch(resetState());
    navigation.navigate('Login');
  };

  const styles = createStyles({ moderateScale, verticalScale, scale });

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={BLUE_TC_TB.colors}
        start={BLUE_TC_TB.start}
        end={BLUE_TC_TB.end}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToLogin}
            accessibilityRole="button"
            accessibilityLabel="Go back to login"
          >
            <RNText style={styles.backButtonText}>← Back</RNText>
          </TouchableOpacity>

          <KeyboardAwareScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            enableAutomaticScroll
            extraScrollHeight={Platform.OS === 'ios' ? 20 : 40}
            enableOnAndroid
            contentContainerStyle={styles.scrollContent}
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Logo Section */}
              {!keyboardVisible && (
                <View style={styles.logoContainer}>
                  <HeaderLogoComponent />
                </View>
              )}

              {/* Header */}
              <View style={styles.header}>
                <RNText style={styles.title}>Reset Password</RNText>
                <RNText style={styles.subtitle}>
                  Enter your email address and we'll send you a secure code to reset your password.
                </RNText>
              </View>

              {/* Form */}
              <Formik
                innerRef={formikRef}
                initialValues={{ email: prefilledEmail || email || '' }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                validateOnChange={submitAttempted}
                validateOnBlur={submitAttempted}
              >
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit: formikSubmit,
                  values,
                  errors,
                  touched,
                  isValid,
                  dirty,
                }) => (
                  <View style={styles.formContainer}>
                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                      <TextInputField
                        label="Email Address"
                        placeholder="you@company.com"
                        value={values.email}
                        onChangeText={(text) => {
                          handleChange('email')(text);
                          dispatch(setEmail(text));
                        }}
                        onBlur={handleBlur('email')}
                        errorText={touched.email && errors.email ? errors.email : undefined}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        textContentType="emailAddress"
                        editable={!isLoading}
                        widthPercent={100}
                        style={styles.emailInput}
                        textStyle={styles.emailText}
                      />
                    </View>

                    {/* Error Message */}
                    {error && (
                      <Animated.View style={styles.errorContainer}>
                        <RNText style={styles.errorText}>{error}</RNText>
                      </Animated.View>
                    )}

                    {/* Submit Button */}
                    <View style={styles.buttonContainer}>
                      <Button
                        title={isLoading ? 'Sending...' : 'Send Reset Code'}
                        onPress={() => formikSubmit()}
                        selected={true}
                        disabled={isLoading}
                        style={styles.submitButton}
                      />
                    </View>

                    {/* Help Text */}
                    <View style={styles.helpContainer}>
                      <RNText style={styles.helpText}>
                        Don't worry, this happens to everyone. We'll help you get back into your account safely.
                      </RNText>
                    </View>

                    {/* Security Note */}
                    <View style={styles.securityContainer}>
                      <View style={styles.securityIconContainer}>
                        <RNText style={styles.securityIcon}>🔒</RNText>
                      </View>
                      <View style={styles.securityTextContainer}>
                        <RNText style={styles.securityTitle}>Secure Reset Process</RNText>
                        <RNText style={styles.securityDescription}>
                          Your security is our priority. We'll send a time-limited code that expires in 10 minutes.
                        </RNText>
                      </View>
                    </View>
                  </View>
                )}
              </Formik>

              {/* Footer */}
              <View style={styles.footer}>
                <TouchableOpacity
                  onPress={handleBackToLogin}
                  style={styles.loginLink}
                  accessibilityRole="button"
                  accessibilityLabel="Return to login screen"
                >
                  <RNText style={styles.footerText}>
                    Remember your password?{' '}
                    <RNText style={styles.linkText}>Sign In</RNText>
                  </RNText>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </KeyboardAwareScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

// Styles
const createStyles = ({
  moderateScale,
  verticalScale,
  scale,
}: {
  moderateScale: (n: number) => number;
  verticalScale: (n: number) => number;
  scale: (n: number) => number;
}) => StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? verticalScale(60) : verticalScale(40),
    left: moderateScale(20),
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? verticalScale(100) : verticalScale(80),
  },
  content: {
    flex: 1,
    paddingHorizontal: moderateScale(24),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  header: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  title: {
    fontSize: moderateScale(32),
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: verticalScale(12),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  subtitle: {
    fontSize: moderateScale(16),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: moderateScale(24),
    paddingHorizontal: moderateScale(20),
  },
  formContainer: {
    marginBottom: verticalScale(32),
  },
  inputContainer: {
    marginBottom: verticalScale(24),
  },
  emailInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  emailText: {
    color: '#FFF',
    fontSize: moderateScale(20),
    fontWeight: '700',
  },
  errorContainer: {
    marginBottom: verticalScale(16),
    paddingHorizontal: moderateScale(4),
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: moderateScale(14),
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    marginBottom: verticalScale(24),
  },
  submitButton: {
    marginTop: verticalScale(8),
    minHeight: verticalScale(50),
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginLeft: moderateScale(8),
  },
  helpContainer: {
    marginBottom: verticalScale(32),
    paddingHorizontal: moderateScale(8),
  },
  helpText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: moderateScale(14),
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  securityContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: verticalScale(24),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  securityIconContainer: {
    marginRight: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityIcon: {
    fontSize: moderateScale(24),
  },
  securityTextContainer: {
    flex: 1,
  },
  securityTitle: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: verticalScale(4),
  },
  securityDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: moderateScale(14),
    lineHeight: moderateScale(18),
  },
  footer: {
    alignItems: 'center',
    paddingBottom: verticalScale(40),
  },
  loginLink: {
    paddingVertical: moderateScale(8),
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: moderateScale(16),
    textAlign: 'center',
  },
  linkText: {
    color: '#FD7332',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default PasswordResetEmailScreen;
