import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import { Dropdown } from 'react-native-element-dropdown';
import DeviceInfo from 'react-native-device-info';
import { launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';

// Utils and Constants
import COLORS from '../../utils/styleConstant/Color';
import fontFamily from '../../utils/styleConstant/FontFamily';
import { supportTicketAPI } from '../../services/supportTicketAPI';
import { BLUE_TC_TB } from '../../styles/gradient';
import { getUserProfile } from '../../services/accountAPI';
import { useDispatch } from 'react-redux';
import { setProfileOrCompanyData } from '../../store/slices/profileDataSlice';

// Types
interface TicketOption {
  label: string;
  value: string;
}

interface DeviceInformation {
  brand: string;
  model: string;
  systemVersion: string;
  buildNumber: string;
  bundleId: string;
  deviceId: string;
  userAgent: string;
}

const SupportTicketScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const auth = useSelector((state: any) => state.auth);
  const profileData = useSelector((state: any) => state.Profile);

  // Form state
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [screenshots, setScreenshots] = useState<string[]>([]);

  // Options state
  const [categories, setCategories] = useState<TicketOption[]>([]);
  const [priorities, setPriorities] = useState<TicketOption[]>([]);

  // Loading and validation state
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInformation | null>(null);
  const [currentScreen] = useState('SupportTicketScreen');

  // Load options and device info on mount
  useEffect(() => {
    loadTicketOptions();
    captureDeviceInfo();
    ensureProfileDataLoaded();
  }, []);

  const ensureProfileDataLoaded = async () => {
    try {
      // Check if we already have profile data with valid IDs
      const profile = profileData?.profile || {};
      const hasValidUserId = profile?.id || profile?.userId || profile?.user_id || profile?.ID;

      if (hasValidUserId) {
        console.log('✅ [SUPPORT] Profile data already loaded');
        return;
      }

      console.log('🔄 [SUPPORT] Profile data empty, fetching from API...');

      // Fetch fresh profile data from API
      const response = await getUserProfile();

      if (response.status === "SUCCESS" && response.data) {
        console.log('✅ [SUPPORT] Profile data fetched successfully:', {
          id: response.data.id,
          uuid: response.data.uuid,
          email: response.data.email,
          firstName: response.data.first_name
        });

        // Store in Redux
        dispatch(setProfileOrCompanyData(response.data));

        Toast.show({
          type: 'success',
          text1: 'Profile loaded',
          text2: 'Your account information has been loaded successfully',
          visibilityTime: 2000,
        });
      } else {
        console.error('❌ [SUPPORT] Failed to fetch profile data:', response.message);

        Toast.show({
          type: 'error',
          text1: 'Profile Loading Error',
          text2: response.message || 'Unable to load your account information',
        });
      }
    } catch (error: any) {
      console.error('❌ [SUPPORT] Error loading profile data:', error.message);

      Toast.show({
        type: 'error',
        text1: 'Profile Loading Error',
        text2: 'Unable to load your account information. Please try again.',
      });
    }
  };

  const loadTicketOptions = async () => {
    try {
      setIsLoading(true);
      const response = await supportTicketAPI.getTicketOptions();

      if (response.success && response.data) {
        setCategories(response.data.categories);
        setPriorities(response.data.priorities);
        console.log('✅ [SUPPORT] Ticket options loaded successfully');
      }
    } catch (error) {
      console.error('Error loading ticket options:', error);
      // This shouldn't happen since we're using hardcoded options now
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load form options',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const captureDeviceInfo = async () => {
    try {
      const [
        brand,
        model,
        systemVersion,
        buildNumber,
        bundleId,
        deviceId,
        userAgent
      ] = await Promise.all([
        DeviceInfo.getBrand(),
        DeviceInfo.getModel(),
        DeviceInfo.getSystemVersion(),
        DeviceInfo.getBuildNumber(),
        DeviceInfo.getBundleId(),
        DeviceInfo.getUniqueId(),
        DeviceInfo.getUserAgent()
      ]);

      setDeviceInfo({
        brand,
        model,
        systemVersion,
        buildNumber,
        bundleId,
        deviceId,
        userAgent
      });
    } catch (error) {
      console.error('Error capturing device info:', error);
    }
  };

  const handleAddScreenshot = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.7,
        maxWidth: 1024,
        maxHeight: 1024,
      },
      (response) => {
        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          if (asset.uri) {
            setScreenshots(prev => [...prev, asset.uri]);
            Toast.show({
              type: 'success',
              text1: 'Screenshot Added',
              text2: 'Screenshot has been attached to your ticket',
            });
          }
        }
      }
    );
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (!subject.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a subject',
      });
      return false;
    }

    if (!description.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a description',
      });
      return false;
    }

    if (!category) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select a category',
      });
      return false;
    }

    if (subject.trim().length < 5) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Subject must be at least 5 characters long',
      });
      return false;
    }

    if (description.trim().length < 10) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Description must be at least 10 characters long',
      });
      return false;
    }

    return true;
  };

  const handleSubmitTicket = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Extract user information from profile data
      const profile = profileData?.profile || {};
      const companyData = profileData?.companyAddress || {};

      console.log('📋 [SUPPORT] Profile data structure:', {
        hasProfile: !!profile,
        hasCompanyData: !!companyData,
        profileKeys: Object.keys(profile),
        companyKeys: Object.keys(companyData),
        profileData: profile,
        companyDataContent: companyData,
        authData: auth
      });

      // Extract user ID - try multiple possible field names
      const userId = profile?.id || profile?.userId || profile?.user_id || profile?.ID;

      // Extract company ID - try multiple possible field names
      let companyId = profile?.company_id || profile?.companyId || companyData?.id || companyData?.company_id || profile?.Company_ID;

      // If no company ID found in profile, try to decode it from JWT token
      if (!companyId && auth?.accessToken) {
        try {
          const token = auth.accessToken;
          const base64Payload = token.split('.')[1];
          const decodedPayload = JSON.parse(atob(base64Payload));

          console.log('🔓 [SUPPORT] JWT Token payload:', {
            sub: decodedPayload.sub,
            userId: decodedPayload.userId,
            companyId: decodedPayload.companyId,
            company_id: decodedPayload.company_id,
            uuid: decodedPayload.uuid,
            email: decodedPayload.email
          });

          companyId = decodedPayload.companyId || decodedPayload.company_id;
        } catch (jwtError) {
          console.error('❌ [SUPPORT] Failed to decode JWT token:', jwtError);
        }
      }

      console.log('📋 [SUPPORT] Extracted IDs:', {
        userId,
        companyId,
        userIdSource: profile?.id ? 'profile.id' : profile?.userId ? 'profile.userId' : profile?.user_id ? 'profile.user_id' : profile?.ID ? 'profile.ID' : 'NONE',
        companyIdSource: profile?.company_id ? 'profile.company_id' : profile?.companyId ? 'profile.companyId' : companyData?.id ? 'companyData.id' : companyData?.company_id ? 'companyData.company_id' : profile?.Company_ID ? 'profile.Company_ID' : 'NONE'
      });

      // Validate that we have valid user authentication data
      if (!userId || !companyId) {
        const errorMsg = `Missing authentication data: user_id=${userId}, company_id=${companyId}`;
        console.error('❌ [SUPPORT] Authentication Error:', errorMsg);

        Toast.show({
          type: 'error',
          text1: 'Authentication Error',
          text2: 'Unable to verify user identity. Please log out and log back in.',
        });
        return;
      }

      const ticketData = {
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        current_screen: currentScreen,
        app_version: await DeviceInfo.getVersion(),
        user_id: userId,
        company_id: companyId,
        user_info: {
          firstName: profile?.first_name || profile?.firstName || profile?.First_Name || 'User',
          lastName: profile?.last_name || profile?.lastName || profile?.Last_Name || 'Name',
          email: profile?.email || profile?.Email || 'user@skyfireapp.io',
          companyName: companyData?.name || companyData?.Name || profile?.company_name || profile?.Company_Name || 'Skyfire Solar Design',
        },
        screenshots,
        deviceInfo,
        additionalData: {
          timestamp: new Date().toISOString(),
          platform: Platform.OS,
        },
      };

      const response = await supportTicketAPI.createTicket(ticketData);

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Ticket Created!',
          text2: `Your ticket ${response.data?.ticketNumber} has been submitted`,
          visibilityTime: 6000,
        });

        // Navigate to success screen or back to drawer
        Alert.alert(
          'Support Ticket Created',
          `Your support ticket ${response.data?.ticketNumber} has been submitted successfully. We'll get back to you soon!`,
          [
            {
              text: 'View My Tickets',
              onPress: () => navigation.navigate('MyTickets'),
            },
            {
              text: 'Go Back',
              onPress: () => navigation.goBack(),
              style: 'cancel',
            },
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to create ticket');
      }
    } catch (error: any) {
      console.error('Error submitting ticket:', error);
      console.log('📋 [SUPPORT] Full error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: error.message || 'Failed to submit support ticket. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priorityValue: string) => {
    switch (priorityValue) {
      case 'urgent': return '#DC3545';
      case 'high': return '#FD7332';
      case 'medium': return '#FFC107';
      case 'low': return '#28A745';
      default: return '#FFC107';
    }
  };

  return (
    <LinearGradient
      colors={BLUE_TC_TB.colors}
      start={BLUE_TC_TB.start}
      end={BLUE_TC_TB.end}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Support Ticket</Text>
            <View style={{ width: 30 }} />
          </View>
        </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <View style={styles.card}>
              {/* Subject Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Subject *</Text>
                <TextInput
                  style={styles.textInput}
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="Brief summary of your issue"
                  placeholderTextColor={COLORS.mediumGray}
                  maxLength={255}
                />
                <Text style={styles.charCount}>{subject.length}/255</Text>
              </View>

              {/* Category Dropdown */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Category *</Text>
                <Dropdown
                  style={styles.dropdown}
                  data={categories}
                  labelField="label"
                  valueField="value"
                  placeholder="Select issue category"
                  value={category}
                  onChange={(item) => setCategory(item.value)}
                  selectedTextStyle={styles.selectedText}
                  placeholderStyle={styles.placeholderStyle}
                  itemTextStyle={styles.itemTextStyle}
                />
              </View>

              {/* Priority Dropdown */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Priority</Text>
                <Dropdown
                  style={styles.dropdown}
                  data={priorities}
                  labelField="label"
                  valueField="value"
                  placeholder="Select priority"
                  value={priority}
                  onChange={(item) => setPriority(item.value)}
                  selectedTextStyle={[
                    styles.selectedText,
                    { color: getPriorityColor(priority) }
                  ]}
                  placeholderStyle={styles.placeholderStyle}
                  itemTextStyle={styles.itemTextStyle}
                  renderItem={(item) => (
                    <View style={styles.priorityItem}>
                      <Text style={[styles.itemTextStyle, { color: getPriorityColor(item.value) }]}>
                        {item.label}
                      </Text>
                    </View>
                  )}
                />
              </View>
            </View>

            <View style={styles.card}>
              {/* Description Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Please describe your issue in detail. Include steps to reproduce if it's a bug."
                  placeholderTextColor={COLORS.mediumGray}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  maxLength={2000}
                />
                <Text style={styles.charCount}>{description.length}/2000</Text>
              </View>
            </View>

            <View style={styles.card}>
              {/* Screenshots Section */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Screenshots (Optional)</Text>
                <TouchableOpacity
                  style={styles.addScreenshotButton}
                  onPress={handleAddScreenshot}
                >
                  <Text style={styles.addScreenshotText}>+ Add Screenshot</Text>
                </TouchableOpacity>

                {screenshots.length > 0 && (
                  <View style={styles.screenshotsContainer}>
                    {screenshots.map((uri, index) => (
                      <View key={index} style={styles.screenshotItem}>
                        <Text style={styles.screenshotText}>Screenshot {index + 1}</Text>
                        <TouchableOpacity onPress={() => removeScreenshot(index)}>
                          <Text style={styles.removeButton}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Device Info Display */}
            {deviceInfo && (
              <View style={styles.card}>
                <View style={styles.deviceInfoContainer}>
                  <Text style={styles.label}>Technical Information</Text>
                  <View style={styles.deviceInfoBox}>
                    <Text style={styles.deviceInfoText}>
                      Device: {deviceInfo.brand} {deviceInfo.model}
                    </Text>
                    <Text style={styles.deviceInfoText}>
                      OS: {Platform.OS} {deviceInfo.systemVersion}
                    </Text>
                    <Text style={styles.deviceInfoText}>
                      App Version: {deviceInfo.bundleId}
                    </Text>
                    <Text style={styles.deviceInfoNote}>
                      This information helps us troubleshoot your issue
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { opacity: isSubmitting || isLoading ? 0.6 : 1 }
              ]}
              onPress={handleSubmitTicket}
              disabled={isSubmitting || isLoading}
            >
              <LinearGradient
                colors={[COLORS.primaryOrange, COLORS.secondaryOrange]}
                style={styles.submitGradient}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Help Text */}
            <View style={styles.card}>
              <View style={styles.helpContainer}>
                <Text style={styles.helpText}>
                  💡 For urgent issues, please call us directly at (480) 759-3473
                </Text>
                <Text style={styles.helpText}>
                  📧 We'll send you an email confirmation once your ticket is received
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fontFamily.Inter_16pt_Black,
    color: COLORS.white,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  form: {
    paddingVertical: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: fontFamily.Inter_16pt_Black,
    color: COLORS.primaryBlue,
    marginBottom: 8,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.darkGray,
    backgroundColor: COLORS.white,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.white,
    minHeight: 50,
  },
  selectedText: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
  placeholderStyle: {
    fontSize: 16,
    color: COLORS.mediumGray,
  },
  itemTextStyle: {
    fontSize: 16,
    color: COLORS.darkGray,
    paddingVertical: 8,
  },
  priorityItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addScreenshotButton: {
    borderWidth: 2,
    borderColor: COLORS.primaryOrange,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
  },
  addScreenshotText: {
    fontSize: 16,
    color: COLORS.primaryOrange,
    fontWeight: '500',
  },
  screenshotsContainer: {
    marginTop: 12,
  },
  screenshotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  screenshotText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  removeButton: {
    fontSize: 20,
    color: '#DC3545',
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  deviceInfoContainer: {
    marginBottom: 0,
  },
  deviceInfoBox: {
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(233, 236, 239, 0.5)',
  },
  deviceInfoText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  deviceInfoNote: {
    fontSize: 12,
    color: COLORS.mediumGray,
    fontStyle: 'italic',
    marginTop: 8,
  },
  submitButton: {
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: fontFamily.Inter_16pt_Black,
    color: COLORS.white,
    fontWeight: '600',
  },
  helpContainer: {
    backgroundColor: 'rgba(227, 242, 253, 0.8)',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryBlue,
  },
  helpText: {
    fontSize: 14,
    color: COLORS.primaryBlue,
    marginBottom: 4,
  },
});

export default SupportTicketScreen;