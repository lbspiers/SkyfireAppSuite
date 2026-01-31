// src/screens/app/ProjectInformation.tsx
import React, { useRef, useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  BackHandler,
  TouchableOpacity,
  Image,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient";
import { Formik, FormikProps } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import {
  DrawerActions,
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";

import { setProject } from "../../store/slices/projectSlice";
import {
  CreateNewProject,
  SaveProjectSiteInfo,
  GetProjectDetails,
} from "../../api/project.service";
import { triggerPlanAutomation } from "../../api/apiModules/triggerPlanAutomation";
import { APP_LOCAL_TRIGGER_SECRET, APP_TRIGGER_COMPUTER_NAME } from "@env";

import SmallHeader from "../../components/Header/SmallHeader";
import TextInput from "../../components/TextInput";
import Dropdown from "../../components/Dropdown";
import AddressAutocompleteInput from "../../components/AddressAutocompleteInput";
// TODO: Custom keyboard disabled - will be re-enabled later
// import { GlobalKeyboardProvider } from "../../components/CustomKeyboard/GlobalKeyboardProvider";

const PlusIcon = require("../../assets/Images/icons/plus_icon_orange_fd7332.png");
import { US_STATES } from "../../utils/constants";
import { moderateScale, verticalScale } from "../../utils/responsive";
import axiosInstance from "../../api/axiosInstance";

// Simple config (no extra deps)
import { GOOGLE_PLACES_API_KEY } from "../../config/appConfig";

const SMOOTH_GRADIENT = ["#2E4161", "#1D3050", "#0C1F3F"];
const GOOGLE_KEY = GOOGLE_PLACES_API_KEY || "";

interface CompanyOption {
  label: string;
  value: string;
  uuid: string;
}

export default function ProjectInformation() {
  const formikRef = useRef<FormikProps<any>>(null);
  const dispatch = useDispatch();
  const navigation: any = useNavigation();
  const companyProfile = useSelector((s: any) => s.profile.profile);

  const [loading, setLoading] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [addressSelected, setAddressSelected] = useState(false);
  const [installersList, setInstallersList] = useState<CompanyOption[]>([]);
  const [loadingInstallers, setLoadingInstallers] = useState(false);
  const [selectedCompanyUuid, setSelectedCompanyUuid] = useState<string>('');

  // Check if user is admin (logan@skyfiresd.com or eli@skyfiresd.com)
  const userEmail = companyProfile?.user?.email || '';
  const isAdminUser = userEmail === 'logan@skyfiresd.com' || userEmail === 'eli@skyfiresd.com';

  // Fetch companies for admin users
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!isAdminUser) {
        // For regular users, set their own company as the only option
        if (companyProfile?.company?.uuid && companyProfile?.company?.name) {
          setSelectedCompanyUuid(companyProfile.company.uuid);
          // Also set the Formik value for regular users
          formikRef.current?.setFieldValue("installer", companyProfile.company.name);
          console.log('🔄 [PROJECT] Regular user - setting installer to:', companyProfile.company.name);
        }
        return;
      }

      setLoadingInstallers(true);
      try {
        console.log('📋 [PROJECT] Fetching companies for installer dropdown...');
        const response = await axiosInstance.get('/companies/list-active');

        if (response.data.status === 'SUCCESS' && Array.isArray(response.data.data)) {
          const companies = response.data.data.map((company: any) => ({
            label: company.name,
            value: company.name,
            uuid: company.uuid,
          }));

          console.log('✅ [PROJECT] Loaded', companies.length, 'companies');
          setInstallersList(companies);

          // Auto-select the first company if admin user and no selection yet
          // This ensures the pre-populated value in the dropdown is actually "selected"
          if (companies.length > 0 && !selectedCompanyUuid) {
            const firstCompany = companies[0];
            console.log('🔄 [PROJECT] Auto-selecting first company:', firstCompany.label, 'UUID:', firstCompany.uuid);
            setSelectedCompanyUuid(firstCompany.uuid);
            // Update Formik value to match
            formikRef.current?.setFieldValue("installer", firstCompany.value);
          }
        } else {
          console.error('❌ [PROJECT] Failed to load companies:', response.data);
          Toast.show({
            text1: 'Error',
            text2: 'Failed to load installer list',
            type: 'error',
          });
        }
      } catch (error: any) {
        console.error('❌ [PROJECT] Error fetching companies:', error);
        Toast.show({
          text1: 'Error',
          text2: 'Could not load installer list',
          type: 'error',
        });
      } finally {
        setLoadingInstallers(false);
      }
    };

    fetchCompanies();
  }, [isAdminUser, companyProfile?.company?.uuid, companyProfile?.company?.name]);

  // Check if address exists on mount (for editing scenarios)
  useEffect(() => {
    if (initialValues.address) {
      setAddressSelected(true);
    }
  }, []);

  const initialValues = {
    installer: !isAdminUser ? (companyProfile?.company?.name || "") : "", // Default to user's company for regular users
    projectID: `SFSD${Math.floor(Date.now() / 1000)}`,
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  };

  useFocusEffect(
    React.useCallback(() => {
      // Reset form but preserve installer for non-admin users
      if (formikRef.current) {
        const installerValue = !isAdminUser ? (companyProfile?.company?.name || "") : "";
        formikRef.current.resetForm({
          values: {
            ...initialValues,
            installer: installerValue,
          }
        });
      }
      setMissingFields([]);
    }, [isAdminUser, companyProfile?.company?.name])
  );

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("Home");
        return true;
      };
      const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => backHandler.remove();
    }, [navigation])
  );

  const validationSchema = Yup.object().shape({
    installer: Yup.string().required(),
    projectID: Yup.string().required(),
    firstName: Yup.string().required(),
    lastName: Yup.string().required(),
    address: Yup.string().required(),
    city: Yup.string().required(),
    state: Yup.string().required(),
    zip: Yup.string().required(),
  });

  const handleAddressSelect = (details: {
    address: string;
    city: string;
    state: string;
    zip: string;
    lat?: number;
    lng?: number;
  }) => {
    formikRef.current?.setFieldValue("address", details.address || "");
    formikRef.current?.setFieldValue("city", details.city || "");
    formikRef.current?.setFieldValue("state", details.state || "");
    formikRef.current?.setFieldValue("zip", details.zip || "");
    
    // Show City/State/Zip fields when address is selected
    setAddressSelected(!!details.address);
  };

  const handleNext = async () => {
    if (!formikRef.current) return;

    const values = formikRef.current.values;
    const errors = await formikRef.current.validateForm();
    const missing = Object.keys(errors);
    setMissingFields(missing);
    if (missing.length) return;

    // Check if company profile is available
    if (!companyProfile?.company?.uuid) {
      Toast.show({
        text1: "Error",
        text2: "Company profile not loaded. Please try again.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      // Determine which company UUID to use:
      // - For admin users: use the selected company UUID from dropdown
      // - For regular users: use their own company UUID
      const targetCompanyUuid = isAdminUser ? selectedCompanyUuid : companyProfile?.company?.uuid;

      if (!targetCompanyUuid) {
        Toast.show({
          text1: "Error",
          text2: isAdminUser ? "Please select an installer" : "Company profile not loaded",
          type: "error",
        });
        setLoading(false);
        return;
      }

      console.log('🏗️ [PROJECT] Creating project for company:', targetCompanyUuid);

      const createPayload = {
        company_id: targetCompanyUuid,  // Use selected company UUID
        installer_name: values.installer,
        installer_project_id: values.projectID,
        customer_first_name: values.firstName,
        customer_last_name: values.lastName,
      };

      const createResp = await CreateNewProject(createPayload);
      if (createResp.status !== 200 || !createResp.data.project) {
        throw new Error("Failed to create project");
      }

      const proj = createResp.data.project;

      const sitePayload = {
        companyId: companyProfile?.company?.uuid,
        address: values.address,
        city: values.city,
        state: values.state,
        zipCode: values.zip,
        ahj: "",
        utility: "",
      };

      const siteResp = await SaveProjectSiteInfo(proj.uuid, sitePayload);
      if (siteResp.status !== 200) {
        throw new Error("Failed to save site info");
      }

      const detailResp = await GetProjectDetails(
        proj.uuid,
        companyProfile?.company?.uuid
      );
      if (detailResp.status !== 200 || !detailResp.data.data) {
        throw new Error("Failed to load project details");
      }

      // Validate required project data structure before navigation
      const projectData = detailResp.data.data;
      if (!projectData.site || !projectData.company?.uuid) {
        console.error("[ProjectInformation] Incomplete project data received:", {
          hasSite: !!projectData.site,
          hasCompanyUuid: !!projectData.company?.uuid,
          projectData,
        });
        throw new Error("Incomplete project data - missing required fields. Please try again.");
      }

      console.log("[ProjectInformation] Project data validated successfully:", {
        projectUuid: projectData.uuid,
        hasSite: !!projectData.site,
        hasCompany: !!projectData.company,
        hasDetails: !!projectData.details,
      });

      dispatch(setProject(projectData));
      Toast.show({ text1: "Project Created!", type: "success" });

      // Trigger both NewProject and AHJLookup automations when navigating away
      const triggerAutomations = async () => {
        const automationOptions = {
          computerName: APP_TRIGGER_COMPUTER_NAME, // Uses env var, or falls back to DB lookup
          companyUuid: companyProfile?.company?.uuid,
          userUuid: companyProfile?.user?.uuid,
          clientVersion: "1.0.7",
        };

        // Trigger NewProject automation
        try {
          console.log("Triggering NewProject automation for project:", proj.uuid);
          const newProjectSteps: string[] = [];
          await triggerPlanAutomation(
            proj.uuid,
            APP_LOCAL_TRIGGER_SECRET,
            "NewProject",
            newProjectSteps,
            automationOptions
          );
          console.log("NewProject automation triggered successfully");
        } catch (err) {
          console.warn("NewProject trigger failed (non-blocking):", err);
        }

        // Trigger AHJ Lookup automation
        try {
          console.log("Triggering AHJ Lookup for project:", proj.uuid);
          const ahjSteps: string[] = [];
          await triggerPlanAutomation(
            proj.uuid,
            APP_LOCAL_TRIGGER_SECRET,
            "AHJLookup",
            ahjSteps,
            automationOptions
          );
          console.log("AHJ Lookup triggered successfully");
        } catch (err) {
          console.warn("AHJ Lookup trigger failed (non-blocking):", err);
        }
      };

      // Fire both automations in parallel (non-blocking)
      triggerAutomations();
      
      navigation.navigate("Main");
    } catch (err: any) {
      Toast.show({
        text1: err.message || "Unexpected error",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={SMOOTH_GRADIENT} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <SmallHeader
          title="New Project"
          onDrawerPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        />

        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.container}
        >
        <Formik
            innerRef={formikRef}
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={() => {}}
            validateOnChange={false}
            validateOnBlur={false}
          >
            {({ handleChange, handleBlur, values }) => (
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  {isAdminUser ? (
                    <Dropdown
                      label="Installer*"
                      data={installersList}
                      value={values.installer}
                      onChange={(val: string) => {
                        // Find the selected company and store its UUID
                        const selectedCompany = installersList.find(company => company.value === val);
                        if (selectedCompany) {
                          console.log('🏢 [PROJECT] Selected company:', selectedCompany.label, 'UUID:', selectedCompany.uuid);
                          setSelectedCompanyUuid(selectedCompany.uuid);
                        }
                        formikRef.current?.setFieldValue("installer", val);
                      }}
                      errorText={missingFields.includes("installer") ? "Installer is required" : undefined}
                    />
                  ) : (
                    <TextInput
                      label="Installer*"
                      value={values.installer}
                      editable={false}
                      onChangeText={() => {}}
                      onBlur={() => {}}
                      inputStyle={{
                        backgroundColor: '#1A2940',
                        color: '#A0A8B8',
                      }}
                    />
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    label="Installer Project ID*"
                    value={values.projectID}
                    onChangeText={handleChange("projectID")}
                    onBlur={handleBlur("projectID")}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    label="Customer First Name*"
                    placeholder="First Name…"
                    value={values.firstName}
                    onChangeText={handleChange("firstName")}
                    onBlur={handleBlur("firstName")}
                    autoCapitalize="words"
                    fieldId="customer-first-name"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    label="Customer Last Name*"
                    placeholder="Last Name…"
                    value={values.lastName}
                    onChangeText={handleChange("lastName")}
                    onBlur={handleBlur("lastName")}
                    autoCapitalize="words"
                    fieldId="customer-last-name"
                  />
                </View>

                {/* Address with inline autocomplete */}
                <View style={styles.addressInputContainer}>
                  <AddressAutocompleteInput
                    apiKey="AIzaSyBTIEUeUnP1QWoLBzmdWE1x0R_N4UlN4dQ"
                    value={values.address}
                    onChangeText={handleChange("address")}
                    onAddressSelect={handleAddressSelect}
                    placeholder="123 Main St…"
                    errorText={missingFields.includes("address") ? "Address is required" : undefined}
                  />
                </View>

                {/* Only show City/State/Zip after address is selected */}
                {addressSelected && (
                  <>
                    <View style={styles.inputContainer}>
                      <TextInput
                        label="City*"
                        placeholder="City…"
                        value={values.city}
                        onChangeText={handleChange("city")}
                        onBlur={handleBlur("city")}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Dropdown
                        label="State*"
                        data={US_STATES}
                        value={values.state}
                        onChange={(val: string) => {
                          formikRef.current?.setFieldValue("state", val);
                          formikRef.current?.setFieldValue("zip", "");
                        }}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <TextInput
                        label="Zip Code*"
                        placeholder="ZIP…"
                        value={values.zip}
                        onChangeText={handleChange("zip")}
                        onBlur={handleBlur("zip")}
                      />
                    </View>
                  </>
                )}

                <View style={styles.iconButtonWrapper}>
                  {loading ? (
                    <ActivityIndicator color="#FFF" size="large" />
                  ) : (
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={handleNext}
                    >
                      <Image
                        source={PlusIcon}
                        style={styles.plusIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.plusLabel}>Create Project</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {missingFields.length > 0 && (
                  <View style={styles.errorList}>
                    <Text style={styles.errorTitle}>Please fill out:</Text>
                    {missingFields.map((f) => (
                      <Text key={f} style={styles.errorItem}>
                        – {f}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </Formik>
        </KeyboardAwareScrollView>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  container: {
    paddingLeft: moderateScale(12), // Reduced to align with flame icon
    paddingRight: moderateScale(12), // Reduced to extend width
    paddingTop: moderateScale(16),
    paddingBottom: verticalScale(1100), // Increased to allow scrolling past autocomplete menu
  },
  form: { flex: 1 },
  inputContainer: {
    marginBottom: verticalScale(2),
  },
  addressInputContainer: {
    marginBottom: verticalScale(2),
    zIndex: 1000, // Ensure autocomplete dropdown appears above other elements
    elevation: 1000, // For Android
  },
  iconButtonWrapper: {
    alignItems: "center",
    marginTop: verticalScale(24),
    zIndex: 1, // Lower z-index so autocomplete menu appears above
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  plusIcon: {
    width: moderateScale(64),
    height: moderateScale(64),
    marginBottom: verticalScale(6),
  },
  plusLabel: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    color: "#ffffff",
  },
  errorList: {
    marginTop: verticalScale(16),
    alignItems: "flex-start",
  },
  errorTitle: {
    color: "#FF6B6B",
    fontWeight: "700",
    marginBottom: verticalScale(4),
    fontSize: moderateScale(14),
  },
  errorItem: {
    color: "#FF6B6B",
    fontSize: moderateScale(13),
  },
});
