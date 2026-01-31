// Password Reset Code Input Screen
// Smart code input with auto-detection, paste support, and countdown timer

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
  Clipboard,
  Alert,
  Vibration,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';

import {
  verifyResetCode,
  resendResetCode,
  setCode,
  clearError,
} from '../../store/slices/passwordResetSlice';
import { trackCodeEntered, trackResendRequested } from '../../utils/analytics';
import { useResponsive } from '../../utils/responsive';
import { BLUE_TC_TB, ORANGE_TB } from '../../styles/gradient';

import ActivityIndicator from '../../components/ActivityIndicator/ActivityIndicator';
import Button from '../../components/Button';
import { HeaderLogoComponent } from '../../components/Header';

// Custom code input component
import CodeInput from '../../components/CodeInput';

const PasswordResetCodeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  // Redux state with safe fallbacks
  const {
    email,
    code,
    isLoading,
    error,
    codeExpiresAt,
    canResendAt,
    attemptsRemaining,
  } = useSelector((state: any) => ({
    email: state.passwordReset?.email || '',
    code: state.passwordReset?.code || '',
    isLoading: state.passwordReset?.isLoading || false,
    error: state.passwordReset?.error || null,
    codeExpiresAt: state.passwordReset?.codeExpiresAt || 0,
    canResendAt: state.passwordReset?.canResendAt || 0,
    attemptsRemaining: state.passwordReset?.attemptsRemaining || 5,
  }));

  // Local state
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeInputFocused, setCodeInputFocused] = useState(true);
  const [autoFillAttempted, setAutoFillAttempted] = useState(false);

  // Refs
  const codeInputRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Responsive utilities
  const { moderateScale, verticalScale } = useResponsive();

  // Initialize animations and timers
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

    // Start timers
    startTimers();

    // Auto-focus code input
    setTimeout(() => {
      codeInputRef.current?.focus();
    }, 500);

    // Try to auto-fill from clipboard
    tryAutoFillFromClipboard();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Update timers
  useEffect(() => {
    startTimers();
  }, [codeExpiresAt, canResendAt]);

  // Start countdown timers
  const startTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      const now = Date.now();

      // Code expiry countdown
      if (codeExpiresAt) {
        const remaining = Math.max(0, codeExpiresAt - now);
        setTimeRemaining(remaining);

        if (remaining <= 0) {
          // Code expired
          dispatch(clearError());
          Alert.alert(
            'Code Expired',
            'Your reset code has expired. Please request a new one.',
            [{ text: 'OK', onPress: handleResendCode }]
          );
        }
      }

      // Resend cooldown
      if (canResendAt) {
        const cooldown = Math.max(0, canResendAt - now);
        setResendCooldown(cooldown);
        setCanResend(cooldown === 0);
      } else {
        setCanResend(true);
      }
    }, 1000);
  };

  // Try to auto-fill code from clipboard
  const tryAutoFillFromClipboard = async () => {
    if (autoFillAttempted) return;

    try {
      const clipboardContent = await Clipboard.getString();
      const codeMatch = clipboardContent.match(/\b\d{6}\b/);

      if (codeMatch) {
        const potentialCode = codeMatch[0];
        Alert.alert(
          'Code Detected',
          `We found a 6-digit code in your clipboard: ${potentialCode}. Would you like to use it?`,
          [
            { text: 'No', style: 'cancel' },
            {
              text: 'Yes',
              onPress: () => {
                handleCodeChange(potentialCode);
                setAutoFillAttempted(true);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.warn('Failed to read clipboard:', error);
    }
  };

  // Handle code input change
  const handleCodeChange = (newCode: string) => {
    dispatch(setCode(newCode));

    // Auto-submit when 6 digits are entered
    if (newCode.length === 6 && /^\d{6}$/.test(newCode)) {
      handleVerifyCode(newCode);
    }
  };

  // Handle code verification
  const handleVerifyCode = async (codeToVerify?: string) => {
    const finalCode = codeToVerify || code;

    if (!finalCode || finalCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit code.');
      return;
    }

    try {
      // Track analytics
      trackCodeEntered(email, false, 0); // Will be updated on success

      // Verify code
      const result = await dispatch(verifyResetCode({
        email,
        code: finalCode,
      }));

      if (result.type === 'passwordReset/verifyCode/fulfilled') {
        // Success - navigate to password input
        Vibration.vibrate(100); // Success haptic
        navigation.navigate('PasswordResetNewPasswordScreen');
      } else {
        // Failed - shake animation
        shakeAnimation();
        Vibration.vibrate([100, 100, 100]); // Error haptic

        // Clear code input for retry
        dispatch(setCode(''));
        codeInputRef.current?.clear();
      }
    } catch (error) {
      console.error('Failed to verify code:', error);
      shakeAnimation();
    }
  };

  // Handle resend code
  const handleResendCode = async () => {
    if (!canResend || resendCooldown > 0) {
      return;
    }

    try {
      // Track analytics
      trackResendRequested(email, 1);

      // Pulse animation for resend button
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Resend code
      const result = await dispatch(resendResetCode({
        email,
        method: 'email',
      }));

      if (result.type === 'passwordReset/resendCode/fulfilled') {
        Alert.alert(
          'Code Sent',
          'A new reset code has been sent to your email.',
          [{ text: 'OK' }]
        );

        // Clear current code
        dispatch(setCode(''));
        codeInputRef.current?.clear();
      }
    } catch (error) {
      console.error('Failed to resend code:', error);
    }
  };

  // Shake animation for errors
  const shakeAnimation = () => {
    const shakeAnim = new Animated.Value(0);

    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();

    return shakeAnim;
  };

  // Navigate back to email screen
  const handleBackToEmail = () => {
    navigation.goBack();
  };

  // Format time remaining
  const formatTimeRemaining = (ms: number): string => {
    if (ms <= 0) return '0:00';

    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format resend cooldown
  const formatResendCooldown = (ms: number): string => {
    if (ms <= 0) return '';

    const seconds = Math.ceil(ms / 1000);
    return `(${seconds}s)`;
  };

  // Mask email for display
  const maskEmail = (email: string): string => {
    const [username, domain] = email.split('@');
    if (username.length <= 2) return email;

    const maskedUsername = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1];
    return `${maskedUsername}@${domain}`;
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
            onPress={handleBackToEmail}
            accessibilityRole="button"
            accessibilityLabel="Go back to email input"
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
                  <View style={styles.emailIcon}>
                    <RNText style={styles.emailIconText}>📧</RNText>
                  </View>
                </View>

                <RNText style={styles.title}>Check Your Email</RNText>
                <RNText style={styles.subtitle}>
                  We've sent a 6-digit reset code to{'\n'}
                  <RNText style={styles.emailText}>{maskEmail(email)}</RNText>
                </RNText>
              </View>

              {/* Timer Display */}
              {timeRemaining > 0 && (
                <View style={styles.timerContainer}>
                  <RNText style={styles.timerLabel}>Code expires in</RNText>
                  <RNText style={styles.timerText}>
                    {formatTimeRemaining(timeRemaining)}
                  </RNText>
                </View>
              )}

              {/* Code Input */}
              <View style={styles.codeContainer}>
                <CodeInput
                  ref={codeInputRef}
                  length={6}
                  value={code}
                  onChangeText={handleCodeChange}
                  onFocus={() => setCodeInputFocused(true)}
                  onBlur={() => setCodeInputFocused(false)}
                  editable={!isLoading}
                  autoFocus={true}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  style={styles.codeInput}
                  cellStyle={[
                    styles.codeCell,
                    codeInputFocused && styles.codeCellFocused,
                    error && styles.codeCellError,
                  ]}
                  textStyle={styles.codeCellText}
                />
              </View>

              {/* Error Message */}
              {error && (
                <Animated.View style={styles.errorContainer}>
                  <RNText style={styles.errorText}>{error}</RNText>
                  {attemptsRemaining > 0 && (
                    <RNText style={styles.attemptsText}>
                      {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
                    </RNText>
                  )}
                </Animated.View>
              )}

              {/* Submit Button */}
              <View style={styles.buttonContainer}>
                <Button
                  title={isLoading ? '' : 'Verify Code'}
                  onPress={() => handleVerifyCode()}
                  selected={true}
                  disabled={code.length !== 6 || isLoading}
                  style={[
                    styles.submitButton,
                    (code.length !== 6 || isLoading) && styles.submitButtonDisabled,
                  ]}
                >
                  {isLoading && (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#FFF" />
                      <RNText style={styles.loadingText}>Verifying...</RNText>
                    </View>
                  )}
                </Button>
              </View>

              {/* Resend Section */}
              <View style={styles.resendContainer}>
                <RNText style={styles.resendLabel}>Didn't receive the code?</RNText>

                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <TouchableOpacity
                    onPress={handleResendCode}
                    disabled={!canResend || resendCooldown > 0}
                    style={[
                      styles.resendButton,
                      (!canResend || resendCooldown > 0) && styles.resendButtonDisabled,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Resend reset code"
                  >
                    <LinearGradient
                      colors={canResend && resendCooldown === 0 ? ORANGE_TB.colors : ['#666', '#666']}
                      start={ORANGE_TB.start}
                      end={ORANGE_TB.end}
                      style={styles.resendButtonGradient}
                    >
                      <RNText style={styles.resendButtonText}>
                        Resend Code {formatResendCooldown(resendCooldown)}
                      </RNText>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </View>

              {/* Help Section */}
              <View style={styles.helpContainer}>
                <RNText style={styles.helpTitle}>💡 Tips</RNText>
                <RNText style={styles.helpText}>
                  • Check your spam/junk folder{'\n'}
                  • The code is valid for 10 minutes{'\n'}
                  • Make sure you have a stable internet connection
                </RNText>
              </View>

              {/* Support Link */}
              <TouchableOpacity
                style={styles.supportButton}
                onPress={() => {
                  Alert.alert(
                    'Need Help?',
                    'Contact our support team if you continue having issues.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Contact Support', onPress: () => {
                        // Handle support contact
                      }},
                    ]
                  );
                }}
                accessibilityRole="button"
                accessibilityLabel="Contact support"
              >
                <RNText style={styles.supportText}>Need help? Contact support</RNText>
              </TouchableOpacity>
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
    marginBottom: verticalScale(32),
  },
  header: {
    alignItems: 'center',
    marginBottom: verticalScale(32),
  },
  iconContainer: {
    marginBottom: verticalScale(16),
  },
  emailIcon: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  emailIconText: {
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
  emailText: {
    color: '#FD7332',
    fontWeight: '600',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(24),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(20),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    alignSelf: 'center',
  },
  timerLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  timerText: {
    color: '#FD7332',
    fontSize: moderateScale(18),
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  codeContainer: {
    marginBottom: verticalScale(24),
    alignItems: 'center',
  },
  codeInput: {
    // Styles handled by CodeInput component
  },
  codeCell: {
    width: moderateScale(45),
    height: moderateScale(55),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: moderateScale(4),
  },
  codeCellFocused: {
    borderColor: '#FD7332',
    backgroundColor: 'rgba(253, 115, 50, 0.1)',
  },
  codeCellError: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  codeCellText: {
    color: '#FFF',
    fontSize: moderateScale(24),
    fontWeight: '600',
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
    marginBottom: verticalScale(4),
  },
  attemptsText: {
    color: 'rgba(255, 107, 107, 0.8)',
    fontSize: moderateScale(12),
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: verticalScale(32),
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
  resendContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(32),
  },
  resendLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: moderateScale(14),
    marginBottom: verticalScale(12),
  },
  resendButton: {
    borderRadius: moderateScale(8),
    overflow: 'hidden',
  },
  resendButtonDisabled: {
    opacity: 0.6,
  },
  resendButtonGradient: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(24),
  },
  resendButtonText: {
    color: '#FFF',
    fontSize: moderateScale(14),
    fontWeight: '600',
    textAlign: 'center',
  },
  helpContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: verticalScale(24),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  helpTitle: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: verticalScale(8),
  },
  helpText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
  supportButton: {
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    marginBottom: verticalScale(24),
  },
  supportText: {
    color: '#FD7332',
    fontSize: moderateScale(14),
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default PasswordResetCodeScreen;