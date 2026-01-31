// Password Reset New Password Screen
// Advanced password input with strength indicator and validation

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  SafeAreaView,
  TouchableOpacity,
  Text as RNText,
  StyleSheet,
  StatusBar,
  Platform,
  Animated,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, FormikProps } from 'formik';
import * as Yup from 'yup';

import {
  resetPassword,
  setNewPassword,
  setConfirmPassword,
  toggleShowPassword,
  toggleShowConfirmPassword,
} from '../../store/slices/passwordResetSlice';
import {
  validatePassword,
  doPasswordsMatch,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  generatePasswordSuggestions,
} from '../../utils/passwordValidation';
import { trackPasswordSet } from '../../utils/analytics';
import { useResponsive } from '../../utils/responsive';
import { BLUE_TC_TB, ORANGE_TB } from '../../styles/gradient';

import TextInputField from '../../components/TextInput';
import Button from '../../components/Button';
import { HeaderLogoComponent } from '../../components/Header';
import PasswordStrengthIndicator from '../../components/PasswordStrengthIndicator';

// Validation schema
const validationSchema = Yup.object().shape({
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/\d/, 'Password must contain at least one number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your password'),
});

interface FormValues {
  newPassword: string;
  confirmPassword: string;
}

const PasswordResetNewPasswordScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const formikRef = useRef<FormikProps<FormValues>>(null);

  // Redux state with safe fallbacks
  const {
    email,
    resetToken,
    isLoading,
    error,
    showPassword,
    showConfirmPassword,
  } = useSelector((state: any) => ({
    email: state.passwordReset?.email || '',
    resetToken: state.passwordReset?.resetToken || '',
    isLoading: state.passwordReset?.isLoading || false,
    error: state.passwordReset?.error || null,
    showPassword: state.passwordReset?.showPassword || false,
    showConfirmPassword: state.passwordReset?.showConfirmPassword || false,
  }));

  // Local state
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
    requirements: [],
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions] = useState(generatePasswordSuggestions());

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const strengthAnim = useRef(new Animated.Value(0)).current;

  // Responsive utilities
  const { moderateScale, verticalScale } = useResponsive();

  // Initialize animations
  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handle password change
  const handlePasswordChange = (password: string) => {
    dispatch(setNewPassword(password));

    // Validate password strength
    const strength = validatePassword(password);
    setPasswordStrength(strength);

    // Animate strength indicator
    Animated.timing(strengthAnim, {
      toValue: strength.score / 4,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Handle confirm password change
  const handleConfirmPasswordChange = (password: string) => {
    dispatch(setConfirmPassword(password));
  };

  // Handle form submission
  const handleSubmit = async (values: FormValues) => {
    if (!resetToken) {
      Alert.alert(
        'Session Expired',
        'Your reset session has expired. Please start over.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('PasswordResetEmailScreen'),
          },
        ]
      );
      return;
    }

    if (!doPasswordsMatch(values.newPassword, values.confirmPassword)) {
      Alert.alert('Error', 'Passwords do not match. Please try again.');
      return;
    }

    try {
      // Track analytics
      trackPasswordSet(email, false, passwordStrength.score);

      // Reset password
      const result = await dispatch(resetPassword({
        resetToken,
        newPassword: values.newPassword,
      }));

      if (result.type === 'passwordReset/resetPassword/fulfilled') {
        // Success - navigate to success screen
        navigation.navigate('PasswordResetSuccessScreen');
      }
    } catch (error) {
      console.error('Failed to reset password:', error);
    }
  };

  // Navigate back to code screen
  const handleBackToCode = () => {
    navigation.goBack();
  };

  // Toggle password suggestions
  const toggleSuggestions = () => {
    setShowSuggestions(!showSuggestions);
  };

  // Use password suggestion
  const useSuggestion = (suggestion: string) => {
    const password = suggestion.split(': ')[1];
    if (password) {
      formikRef.current?.setFieldValue('newPassword', password);
      handlePasswordChange(password);
      setShowSuggestions(false);
    }
  };

  const styles = createStyles({ moderateScale, verticalScale });

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
            onPress={handleBackToCode}
            accessibilityRole="button"
            accessibilityLabel="Go back to code input"
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
              {/* Logo */}
              <View style={styles.logoContainer}>
                <HeaderLogoComponent />
              </View>

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <View style={styles.lockIcon}>
                    <RNText style={styles.lockIconText}>🔒</RNText>
                  </View>
                </View>

                <RNText style={styles.title}>Create New Password</RNText>
                <RNText style={styles.subtitle}>
                  Choose a strong password that you'll remember.{'\n'}
                  Your password will be encrypted and secured.
                </RNText>
              </View>

              {/* Form */}
              <Formik
                innerRef={formikRef}
                initialValues={{
                  newPassword: '',
                  confirmPassword: '',
                }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                validateOnChange={true}
                validateOnBlur={true}
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
                    {/* New Password Input */}
                    <View style={styles.inputContainer}>
                      <TextInputField
                        label="New Password"
                        placeholder="Create a strong password"
                        value={values.newPassword}
                        onChangeText={(text) => {
                          handleChange('newPassword')(text);
                          handlePasswordChange(text);
                        }}
                        onBlur={handleBlur('newPassword')}
                        errorText={touched.newPassword && errors.newPassword ? errors.newPassword : undefined}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="new-password"
                        textContentType="newPassword"
                        editable={!isLoading}
                        widthPercent={100}
                        style={styles.passwordInput}
                        showPasswordToggle={true}
                        onTogglePassword={() => dispatch(toggleShowPassword())}
                        showPassword={showPassword}
                      />

                      {/* Password Strength Indicator */}
                      {values.newPassword.length > 0 && (
                        <Animated.View style={styles.strengthContainer}>
                          <PasswordStrengthIndicator
                            password={values.newPassword}
                            strength={passwordStrength}
                            animated={true}
                          />
                        </Animated.View>
                      )}
                    </View>

                    {/* Confirm Password Input */}
                    <View style={styles.inputContainer}>
                      <TextInputField
                        label="Confirm Password"
                        placeholder="Confirm your new password"
                        value={values.confirmPassword}
                        onChangeText={(text) => {
                          handleChange('confirmPassword')(text);
                          handleConfirmPasswordChange(text);
                        }}
                        onBlur={handleBlur('confirmPassword')}
                        errorText={touched.confirmPassword && errors.confirmPassword ? errors.confirmPassword : undefined}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="new-password"
                        textContentType="newPassword"
                        editable={!isLoading}
                        widthPercent={100}
                        style={styles.passwordInput}
                        showPasswordToggle={true}
                        onTogglePassword={() => dispatch(toggleShowConfirmPassword())}
                        showPassword={showConfirmPassword}
                      />

                      {/* Password Match Indicator */}
                      {values.confirmPassword.length > 0 && (
                        <View style={styles.matchContainer}>
                          {doPasswordsMatch(values.newPassword, values.confirmPassword) ? (
                            <View style={styles.matchSuccess}>
                              <RNText style={styles.matchIcon}>✓</RNText>
                              <RNText style={styles.matchText}>Passwords match</RNText>
                            </View>
                          ) : (
                            <View style={styles.matchError}>
                              <RNText style={styles.matchIcon}>✗</RNText>
                              <RNText style={styles.matchText}>Passwords don't match</RNText>
                            </View>
                          )}
                        </View>
                      )}
                    </View>

                    {/* Error Message */}
                    {error && (
                      <Animated.View style={styles.errorContainer}>
                        <RNText style={styles.errorText}>{error}</RNText>
                      </Animated.View>
                    )}

                    {/* Password Suggestions */}
                    <View style={styles.suggestionsContainer}>
                      <TouchableOpacity
                        onPress={toggleSuggestions}
                        style={styles.suggestionsToggle}
                        accessibilityRole="button"
                        accessibilityLabel="Toggle password suggestions"
                      >
                        <RNText style={styles.suggestionsToggleText}>
                          💡 Need password ideas? {showSuggestions ? 'Hide' : 'Show'} suggestions
                        </RNText>
                      </TouchableOpacity>

                      {showSuggestions && (
                        <Animated.View style={styles.suggestionsContent}>
                          <RNText style={styles.suggestionsTitle}>Password Ideas:</RNText>
                          {suggestions.map((suggestion, index) => (
                            <TouchableOpacity
                              key={index}
                              onPress={() => useSuggestion(suggestion)}
                              style={styles.suggestionItem}
                              accessibilityRole="button"
                              accessibilityLabel={`Use password suggestion ${index + 1}`}
                            >
                              <RNText style={styles.suggestionText}>{suggestion}</RNText>
                            </TouchableOpacity>
                          ))}
                        </Animated.View>
                      )}
                    </View>

                    {/* Submit Button */}
                    <View style={styles.buttonContainer}>
                      <Button
                        title={isLoading ? 'Resetting Password...' : 'Reset Password'}
                        onPress={() => formikSubmit()}
                        selected={true}
                        disabled={!isValid || !dirty || isLoading || passwordStrength.score < 2}
                        style={[
                          styles.submitButton,
                          (!isValid || !dirty || isLoading || passwordStrength.score < 2) && styles.submitButtonDisabled,
                        ]}
                      />
                    </View>

                    {/* Security Tips */}
                    <View style={styles.tipsContainer}>
                      <RNText style={styles.tipsTitle}>🛡️ Password Security Tips</RNText>
                      <RNText style={styles.tipsText}>
                        • Use a mix of letters, numbers, and symbols{'\n'}
                        • Avoid personal information (names, dates){'\n'}
                        • Make it at least 8 characters long{'\n'}
                        • Consider using a passphrase{'\n'}
                        • Don't reuse passwords from other accounts
                      </RNText>
                    </View>
                  </View>
                )}
              </Formik>
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
}: {
  moderateScale: (n: number) => number;
  verticalScale: (n: number) => number;
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
    marginBottom: verticalScale(16),
  },
  header: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  iconContainer: {
    marginBottom: verticalScale(16),
  },
  lockIcon: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  lockIconText: {
    fontSize: moderateScale(28),
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: verticalScale(12),
  },
  subtitle: {
    fontSize: moderateScale(16),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: moderateScale(22),
  },
  formContainer: {
    marginBottom: verticalScale(16),
  },
  inputContainer: {
    marginBottom: verticalScale(16),
  },
  passwordInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  strengthContainer: {
    marginTop: verticalScale(12),
  },
  matchContainer: {
    marginTop: verticalScale(8),
    alignItems: 'flex-start',
  },
  matchSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchError: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchIcon: {
    fontSize: moderateScale(16),
    marginRight: moderateScale(6),
    color: '#4CAF50', // Green for success, will be overridden for error
  },
  matchText: {
    fontSize: moderateScale(14),
    color: '#4CAF50', // Green for success, will be overridden for error
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: moderateScale(14),
    textAlign: 'center',
    fontWeight: '500',
  },
  suggestionsContainer: {
    marginBottom: verticalScale(16),
  },
  suggestionsToggle: {
    alignItems: 'center',
    paddingVertical: moderateScale(8),
  },
  suggestionsToggleText: {
    color: '#FD7332',
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  suggestionsContent: {
    marginTop: verticalScale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  suggestionsTitle: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: verticalScale(12),
  },
  suggestionItem: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(8),
  },
  suggestionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
  },
  buttonContainer: {
    marginBottom: verticalScale(16),
    marginTop: verticalScale(8),
  },
  submitButton: {
    minHeight: verticalScale(50),
  },
  submitButtonDisabled: {
    opacity: 0.6,
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
  tipsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: verticalScale(24),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tipsTitle: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: verticalScale(12),
  },
  tipsText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
});

export default PasswordResetNewPasswordScreen;