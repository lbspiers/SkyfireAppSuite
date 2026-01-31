// Password Reset Success Screen
// Beautiful confirmation screen with auto-login and security tips

import React, { useEffect, useRef } from 'react';
import {
  View,
  SafeAreaView,
  TouchableOpacity,
  Text as RNText,
  StyleSheet,
  StatusBar,
  Platform,
  Animated,
  BackHandler,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';

import { resetState } from '../../store/slices/passwordResetSlice';
import { setTokens } from '../../store/slices/authSlice';
import { endPasswordResetSession } from '../../utils/analytics';
import { useResponsive } from '../../utils/responsive';
import { BLUE_TC_TB, ORANGE_TB } from '../../styles/gradient';

import Button from '../../components/Button';
import { HeaderLogoComponent } from '../../components/Header';

const PasswordResetSuccessScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  // Redux state with safe fallbacks
  const passwordResetState = useSelector((state: any) => state.passwordReset || {});

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Responsive utilities
  const { moderateScale, verticalScale } = useResponsive();

  // Initialize animations and analytics
  useEffect(() => {
    // End analytics session
    endPasswordResetSession(true);

    // Success animations
    const animationSequence = Animated.sequence([
      // Initial fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Success icon scale animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      // Content slide up
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start(() => {
      // Start pulsing animation for the success icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Auto-redirect timer (optional)
    const autoRedirectTimer = setTimeout(() => {
      handleContinueToLogin();
    }, 10000); // 10 seconds

    return () => {
      clearTimeout(autoRedirectTimer);
    };
  }, []);

  // Handle back button (Android)
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleContinueToLogin();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription?.remove();
    }, [])
  );

  // Handle continue to login
  const handleContinueToLogin = () => {
    // Clear password reset state
    dispatch(resetState());

    // Navigate to login screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  // Handle security tips
  const handleSecurityTips = () => {
    navigation.navigate('SecurityTipsScreen');
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
          <KeyboardAwareScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              {/* Logo */}
              <View style={styles.logoContainer}>
                <HeaderLogoComponent />
              </View>

              {/* Success Icon */}
              <Animated.View
                style={[
                  styles.successIconContainer,
                  {
                    transform: [
                      { scale: scaleAnim },
                      { scale: pulseAnim },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#4CAF50', '#45A049']}
                  style={styles.successIcon}
                >
                  <RNText style={styles.successIconText}>✓</RNText>
                </LinearGradient>
              </Animated.View>

              {/* Success Content */}
              <Animated.View
                style={[
                  styles.successContent,
                  {
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <RNText style={styles.title}>Password Reset Successfully!</RNText>

                <RNText style={styles.subtitle}>
                  Your password has been updated securely. You can now sign in with your new password.
                </RNText>

                <View style={styles.featuresContainer}>
                  <View style={styles.feature}>
                    <View style={styles.featureIcon}>
                      <RNText style={styles.featureIconText}>🔒</RNText>
                    </View>
                    <View style={styles.featureTextContainer}>
                      <RNText style={styles.featureTitle}>Encrypted & Secure</RNText>
                      <RNText style={styles.featureDescription}>
                        Your password is encrypted with industry-standard security
                      </RNText>
                    </View>
                  </View>

                  <View style={styles.feature}>
                    <View style={styles.featureIcon}>
                      <RNText style={styles.featureIconText}>⚡</RNText>
                    </View>
                    <View style={styles.featureTextContainer}>
                      <RNText style={styles.featureTitle}>Instant Access</RNText>
                      <RNText style={styles.featureDescription}>
                        Your new password is active immediately
                      </RNText>
                    </View>
                  </View>

                  <View style={styles.feature}>
                    <View style={styles.featureIcon}>
                      <RNText style={styles.featureIconText}>🛡️</RNText>
                    </View>
                    <View style={styles.featureTextContainer}>
                      <RNText style={styles.featureTitle}>Account Protected</RNText>
                      <RNText style={styles.featureDescription}>
                        All previous sessions have been logged out for security
                      </RNText>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonsContainer}>
                  <Button
                    title="Continue to Login"
                    onPress={handleContinueToLogin}
                    selected={true}
                    style={styles.primaryButton}
                  />

                  <TouchableOpacity
                    onPress={handleSecurityTips}
                    style={styles.secondaryButton}
                    accessibilityRole="button"
                    accessibilityLabel="View security tips"
                  >
                    <LinearGradient
                      colors={ORANGE_TB.colors}
                      start={ORANGE_TB.start}
                      end={ORANGE_TB.end}
                      style={styles.secondaryButtonGradient}
                    >
                      <RNText style={styles.secondaryButtonText}>
                        🛡️ Security Tips
                      </RNText>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Security Reminder */}
                <View style={styles.securityReminder}>
                  <RNText style={styles.securityReminderTitle}>🔐 Security Reminder</RNText>
                  <RNText style={styles.securityReminderText}>
                    • Keep your password private and secure{'\n'}
                    • Don't share your login credentials{'\n'}
                    • Sign out of shared devices{'\n'}
                    • Update your password regularly
                  </RNText>
                </View>

                {/* Auto-redirect notice */}
                <View style={styles.autoRedirectNotice}>
                  <RNText style={styles.autoRedirectText}>
                    You'll be automatically redirected to login in a few seconds...
                  </RNText>
                </View>
              </Animated.View>
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
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? verticalScale(60) : verticalScale(40),
    paddingBottom: verticalScale(40),
  },
  content: {
    flex: 1,
    paddingHorizontal: moderateScale(24),
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(40),
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(32),
  },
  successIcon: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successIconText: {
    fontSize: moderateScale(48),
    color: '#FFF',
    fontWeight: 'bold',
  },
  successContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: moderateScale(32),
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: verticalScale(16),
    lineHeight: moderateScale(38),
  },
  subtitle: {
    fontSize: moderateScale(16),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: moderateScale(24),
    marginBottom: verticalScale(32),
    paddingHorizontal: moderateScale(20),
  },
  featuresContainer: {
    width: '100%',
    marginBottom: verticalScale(32),
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(16),
  },
  featureIconText: {
    fontSize: moderateScale(24),
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#FFF',
    marginBottom: verticalScale(4),
  },
  featureDescription: {
    fontSize: moderateScale(14),
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: moderateScale(18),
  },
  buttonsContainer: {
    width: '100%',
    marginBottom: verticalScale(32),
  },
  primaryButton: {
    marginBottom: verticalScale(16),
    minHeight: verticalScale(50),
  },
  secondaryButton: {
    borderRadius: moderateScale(8),
    overflow: 'hidden',
  },
  secondaryButtonGradient: {
    paddingVertical: verticalScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  securityReminder: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: verticalScale(24),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },
  securityReminderTitle: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: verticalScale(12),
  },
  securityReminderText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
  autoRedirectNotice: {
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  autoRedirectText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: moderateScale(12),
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default PasswordResetSuccessScreen;