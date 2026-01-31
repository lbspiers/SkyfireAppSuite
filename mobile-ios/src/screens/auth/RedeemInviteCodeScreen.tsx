// src/screens/auth/RedeemInviteCodeScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import axiosInstance from '../../api/axiosInstance';
import { useDispatch } from 'react-redux';
import { setTokens } from '../../store/slices/authSlice';
import { moderateScale, verticalScale } from '../../utils/responsive';
import { ORANGE_TB } from '../../styles/gradient';

interface InviteData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  companyName: string;
  companyUuid: string;
  expiresAt: string;
}

const RedeemInviteCodeScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();

  // Step management
  const [step, setStep] = useState<'enter-code' | 'create-account'>('enter-code');

  // Code entry
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Validated invite data
  const [inviteData, setInviteData] = useState<InviteData | null>(null);

  // Account creation
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Format code as user types (auto-add dashes)
  const formatInviteCode = (text: string) => {
    // Remove all non-alphanumeric characters
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Add dashes: SKY-XXXX-XXXX (3 + 1 + 4 + 1 + 4 = 13 characters)
    let formatted = cleaned;
    if (cleaned.length > 3) {
      formatted = cleaned.slice(0, 3) + '-' + cleaned.slice(3);
    }
    if (cleaned.length > 7) {
      formatted = formatted.slice(0, 8) + '-' + cleaned.slice(7, 11);
    }

    return formatted.slice(0, 13); // Max length: SKY-XXXX-XXXX (13 chars)
  };

  const handleCodeChange = (text: string) => {
    const formatted = formatInviteCode(text);
    setCode(formatted);
  };

  const validateCode = async () => {
    if (code.replace(/-/g, '').length < 11) {
      Alert.alert('Invalid Code', 'Please enter a complete invite code.');
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/validate-invite-code', { code });

      if (response.data.status === 'SUCCESS') {
        const data = response.data.data;
        setInviteData(data);

        // Pre-fill form with invite data
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setEmail(data.email);
        setPhone(data.phone || '');

        // Move to account creation step
        setStep('create-account');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid invite code. Please check and try again.';
      Alert.alert('Invalid Code', message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!firstName.trim()) {
      Alert.alert('Validation Error', 'First name is required');
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert('Validation Error', 'Last name is required');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Validation Error', 'Valid email is required');
      return false;
    }
    if (password.length < 8) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const redeemCode = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/redeem-invite-code', {
        code,
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        password,
      });

      if (response.data.status === 'SUCCESS') {
        const { user, accessToken, refreshToken } = response.data.data;

        // Store tokens
        dispatch(setTokens({ accessToken, refreshToken, checkbox: true }));

        Alert.alert(
          'Welcome! 🎉',
          `Your account has been created successfully. Welcome to ${inviteData?.companyName}!`,
          [
            {
              text: 'Get Started',
              onPress: () => {
                // Navigation will happen automatically via auth state change
                navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
              },
            },
          ]
        );
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create account. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  // RENDER: Step 1 - Enter Code
  if (step === 'enter-code') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.headerSection}>
              <Image
                source={require('../../assets/Images/applogo2.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.title}>Redeem Invite Code</Text>
              <Text style={styles.subtitle}>
                Enter the invite code you received via email to join your team
              </Text>
            </View>

            {/* Code Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Invite Code</Text>
              <TextInput
                style={styles.codeInput}
                value={code}
                onChangeText={handleCodeChange}
                placeholder="SKY-XXXX-XXXX"
                placeholderTextColor="#999"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={13}
                keyboardType="default"
              />
              <Text style={styles.hint}>
                Format: SKY-XXXX-XXXX (letters and numbers only)
              </Text>
            </View>

            {/* Validate Button */}
            <TouchableOpacity
              onPress={validateCode}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                {...ORANGE_TB}
                style={[styles.button, loading && styles.buttonDisabled]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Continue</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Help Text */}
            <View style={styles.helpSection}>
              <Text style={styles.helpText}>
                Can't find your invite code? Check your email (including spam folder) or contact your company administrator to resend it.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // RENDER: Step 2 - Create Account
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('enter-code')}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.headerSection}>
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.subtitle}>
              Joining {inviteData?.companyName}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="John"
                placeholderTextColor="#999"
                autoCapitalize="words"
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Doe"
                placeholderTextColor="#999"
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="john@example.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Phone (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone (Optional)</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="555-1234"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min 8 characters"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Icon
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Create Account Button */}
          <TouchableOpacity
            onPress={redeemCode}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              {...ORANGE_TB}
              style={[styles.button, loading && styles.buttonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C1F3F',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: moderateScale(20),
  },
  backButton: {
    marginBottom: verticalScale(20),
  },
  backButtonText: {
    fontSize: moderateScale(16),
    color: '#FFF',
    fontWeight: '600',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: verticalScale(40),
  },
  logoImage: {
    width: moderateScale(200),
    height: verticalScale(70),
    marginBottom: verticalScale(10),
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: verticalScale(16),
  },
  subtitle: {
    fontSize: moderateScale(16),
    color: '#A0A8B8',
    textAlign: 'center',
    marginTop: verticalScale(8),
    paddingHorizontal: moderateScale(20),
  },
  inputContainer: {
    marginBottom: verticalScale(30),
  },
  label: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#FFF',
    marginBottom: verticalScale(8),
  },
  codeInput: {
    backgroundColor: '#1A2940',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
    borderWidth: 2,
    borderColor: '#FD7332',
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  hint: {
    fontSize: moderateScale(14),
    color: '#A0A8B8',
    marginTop: verticalScale(8),
    textAlign: 'center',
  },
  button: {
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: moderateScale(18),
    fontWeight: '600',
  },
  helpSection: {
    padding: moderateScale(20),
  },
  helpText: {
    fontSize: moderateScale(14),
    color: '#A0A8B8',
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  form: {
    marginBottom: verticalScale(30),
  },
  inputGroup: {
    marginBottom: verticalScale(20),
  },
  input: {
    backgroundColor: '#1A2940',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    fontSize: moderateScale(16),
    borderWidth: 1,
    borderColor: '#2E4161',
    color: '#FFF',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2940',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#2E4161',
  },
  passwordInput: {
    flex: 1,
    padding: moderateScale(16),
    fontSize: moderateScale(16),
    color: '#FFF',
  },
  eyeIcon: {
    padding: moderateScale(16),
  },
});

export default RedeemInviteCodeScreen;
