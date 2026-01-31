import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { adminAPI } from '../../services/adminAPI';
import { useResponsive } from '../../utils/responsive';

interface RegisterUserModalProps {
  visible: boolean;
  onClose: () => void;
  onUserRegistered: () => void;
}

interface RegisterUserForm {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const RegisterUserModal: React.FC<RegisterUserModalProps> = ({
  visible,
  onClose,
  onUserRegistered,
}) => {
  const { moderateScale, verticalScale, font } = useResponsive();
  const styles = makeStyles({ moderateScale, verticalScale, font });

  const [form, setForm] = useState<RegisterUserForm>({
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<RegisterUserForm>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterUserForm> = {};

    if (!form.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!form.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!form.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(form.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    if (submitting) return;
    
    // Reset form
    setForm({
      companyName: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    });
    setErrors({});
    onClose();
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    
    try {
      const result = await adminAPI.registerUser({
        company: form.companyName.trim(),
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
      });

      if (result.status === 'SUCCESS') {
        Alert.alert(
          'User Registered',
          `${form.firstName} ${form.lastName} has been successfully registered and approved. Welcome email sent with temporary password.`,
          [
            {
              text: 'OK',
              onPress: () => {
                handleClose();
                onUserRegistered();
              },
            },
          ]
        );
      } else {
        Alert.alert('Registration Failed', result.message || 'Failed to register user');
      }
    } catch (error: any) {
      console.error('Error registering user:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Failed to register user. Please check your connection.';
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const generatePassword = () => {
    Alert.alert(
      'Automatic Password',
      'A secure temporary password will be automatically generated and sent to the user via email.',
      [{ text: 'OK' }]
    );
  };

  const InputField = ({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    error, 
    keyboardType = 'default',
    autoCapitalize = 'words'
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    error?: string;
    keyboardType?: any;
    autoCapitalize?: any;
  }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={!submitting}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={["#1D2A4F", "#2E4161"]}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Register New User</Text>
              <TouchableOpacity
                onPress={handleClose}
                disabled={submitting}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Info Box */}
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  📝 Create a new user account with pre-approval status. The user will receive 
                  a welcome email with their temporary password and login instructions.
                </Text>
              </View>

              {/* Form Fields */}
              <InputField
                label="Company Name"
                value={form.companyName}
                onChangeText={(text) => setForm({...form, companyName: text})}
                placeholder="Enter company name"
                error={errors.companyName}
              />

              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <InputField
                    label="First Name"
                    value={form.firstName}
                    onChangeText={(text) => setForm({...form, firstName: text})}
                    placeholder="First name"
                    error={errors.firstName}
                  />
                </View>
                <View style={styles.nameField}>
                  <InputField
                    label="Last Name"
                    value={form.lastName}
                    onChangeText={(text) => setForm({...form, lastName: text})}
                    placeholder="Last name"
                    error={errors.lastName}
                  />
                </View>
              </View>

              <InputField
                label="Email Address"
                value={form.email}
                onChangeText={(text) => setForm({...form, email: text})}
                placeholder="user@company.com"
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <InputField
                label="Phone Number"
                value={form.phone}
                onChangeText={(text) => setForm({...form, phone: text})}
                placeholder="+1 (555) 123-4567"
                error={errors.phone}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />

              {/* Password Info */}
              <TouchableOpacity style={styles.passwordInfo} onPress={generatePassword}>
                <Text style={styles.passwordInfoText}>
                  🔐 Password will be auto-generated
                </Text>
                <Text style={styles.passwordInfoSubtext}>
                  Tap for details
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <LinearGradient
                  colors={["#FD7332", "#EF3826"]}
                  style={styles.submitButtonGradient}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Register User</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const makeStyles = ({
  moderateScale,
  verticalScale,
  font,
}: {
  moderateScale: (n: number) => number;
  verticalScale: (n: number) => number;
  font: (n: number) => number;
}) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
    },
    modalContainer: {
      marginHorizontal: moderateScale(20),
      maxHeight: '90%',
    },
    modalContent: {
      borderRadius: moderateScale(16),
      padding: moderateScale(20),
      borderWidth: 1,
      borderColor: 'rgba(253, 115, 50, 0.3)',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: verticalScale(20),
    },
    title: {
      fontSize: font(20),
      fontWeight: '600',
      color: '#FFF',
    },
    closeButton: {
      width: moderateScale(32),
      height: moderateScale(32),
      borderRadius: moderateScale(16),
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: font(16),
      color: '#FFF',
      fontWeight: '600',
    },
    scrollContent: {
      maxHeight: verticalScale(400),
    },
    infoBox: {
      backgroundColor: 'rgba(253, 115, 50, 0.1)',
      borderRadius: moderateScale(8),
      padding: moderateScale(12),
      marginBottom: verticalScale(20),
      borderWidth: 1,
      borderColor: 'rgba(253, 115, 50, 0.3)',
    },
    infoText: {
      fontSize: font(12),
      color: '#FFF',
      opacity: 0.9,
      lineHeight: font(16),
    },
    inputContainer: {
      marginBottom: verticalScale(16),
    },
    inputLabel: {
      fontSize: font(14),
      color: '#FFF',
      fontWeight: '500',
      marginBottom: verticalScale(6),
    },
    input: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: moderateScale(8),
      paddingHorizontal: moderateScale(12),
      paddingVertical: verticalScale(10),
      fontSize: font(14),
      color: '#FFF',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    inputError: {
      borderColor: '#FF6B6B',
    },
    errorText: {
      fontSize: font(12),
      color: '#FF6B6B',
      marginTop: verticalScale(4),
    },
    nameRow: {
      flexDirection: 'row',
      gap: moderateScale(12),
    },
    nameField: {
      flex: 1,
    },
    passwordInfo: {
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      borderRadius: moderateScale(8),
      padding: moderateScale(12),
      marginBottom: verticalScale(20),
      borderWidth: 1,
      borderColor: 'rgba(76, 175, 80, 0.3)',
    },
    passwordInfoText: {
      fontSize: font(14),
      color: '#4CAF50',
      fontWeight: '500',
    },
    passwordInfoSubtext: {
      fontSize: font(12),
      color: '#4CAF50',
      opacity: 0.8,
      marginTop: verticalScale(4),
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: moderateScale(12),
      marginTop: verticalScale(20),
    },
    cancelButton: {
      flex: 1,
      paddingVertical: verticalScale(12),
      borderRadius: moderateScale(8),
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: font(16),
      fontWeight: '500',
      color: '#FFF',
    },
    submitButton: {
      flex: 1,
    },
    submitButtonGradient: {
      paddingVertical: verticalScale(12),
      borderRadius: moderateScale(8),
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitButtonText: {
      fontSize: font(16),
      fontWeight: '600',
      color: '#FFF',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
  });

export default RegisterUserModal;