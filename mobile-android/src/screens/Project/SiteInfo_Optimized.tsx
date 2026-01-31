import React, { useState, useEffect } from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import Toast from "react-native-toast-message";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";

// Components
import Text from "../../components/Text";
import TextInputField from "../../components/TextInput";
import Button from "../../components/Button";
import ThemedTextInput from "../../components/UI/ThemedTextInput";

// API - Using optimized field-specific functions
import { getSiteInfoFields, SaveProjectSiteInfo } from "../../api/project.service";

// Hooks
import useProjectContext from "../../hooks/useProjectContext";

// Styles
import { styles } from "../../styles/siteInfoStyles";

// Validation schema
const validationSchema = Yup.object().shape({
  address: Yup.string().required("Address is required"),
  city: Yup.string().required("City is required"),
  state: Yup.string()
    .required("State is required")
    .length(2, "State must be 2 characters"),
  zip: Yup.string()
    .required("ZIP code is required")
    .matches(/^\d{5}$/, "ZIP must be 5 digits"),
  apn: Yup.string(),
  jurisdiction: Yup.string(),
  utility: Yup.string(),
});

/**
 * Optimized SiteInfo Component
 * Uses getSiteInfoFields() to fetch only the 7 fields needed
 * Instead of fetching all 804+ fields from system-details
 */
const SiteInfoOptimized = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { projectId, companyId } = useProjectContext();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [initialValues, setInitialValues] = useState({
    address: "",
    city: "",
    state: "",
    zip: "",
    apn: "",
    jurisdiction: "",
    utility: "",
  });

  // Load site info using optimized API function
  useEffect(() => {
    loadSiteInfo();
  }, [projectId]);

  const loadSiteInfo = async () => {
    if (!projectId) {
      setIsLoadingData(false);
      return;
    }

    try {
      setIsLoadingData(true);
      
      // OPTIMIZED: Fetch only 7 fields instead of 804+
      const response = await getSiteInfoFields(projectId);
      
      if (response?.status === 200 && response?.data?.data) {
        const data = response.data.data;
        
        // Data is already transformed to UI field names
        setInitialValues({
          address: data.address || route.params?.street || "",
          city: data.city || route.params?.city || "",
          state: data.state || route.params?.state || "",
          zip: data.zip || route.params?.zip || "",
          apn: data.apn || "",
          jurisdiction: data.jurisdiction || "",
          utility: data.utility || "",
        });
        
        console.log('[SiteInfo] Loaded optimized data - 7 fields fetched');
      } else if (response?.status === 404) {
        // No existing data, use route params if available
        setInitialValues({
          address: route.params?.street || "",
          city: route.params?.city || "",
          state: route.params?.state || "",
          zip: route.params?.zip || "",
          apn: "",
          jurisdiction: "",
          utility: "",
        });
      }
    } catch (error) {
      console.error('[SiteInfo] Error loading site info:', error);
      Toast.show({
        text1: "Error",
        text2: "Failed to load site information",
        type: "error",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!projectId) {
      Toast.show({
        text1: "Error",
        text2: "No project selected",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare data for API (transform back to API field names)
      const siteData = {
        companyId: companyId, // Use user's company for authorization
        address: values.address,
        city: values.city,
        state: values.state,
        zip_code: values.zip, // Note: API uses zip_code, not zip
        apn: values.apn || null,
        jurisdiction: values.jurisdiction || null,
        utility: values.utility || null,
      };

      const response = await SaveProjectSiteInfo(projectId, siteData);
      
      if (response?.status === 200) {
        Toast.show({
          text1: "Success",
          text2: "Site information saved successfully",
          type: "success",
        });
        
        // Navigate to next screen
        navigation.navigate("EquipmentScreens");
      } else {
        throw new Error(response?.data?.message || "Failed to save site info");
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          "Failed to save site information";
      
      Toast.show({
        text1: "Error",
        text2: errorMessage,
        type: "error",
      });
      
      console.error('[SiteInfo] Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FD7332" />
        <Text style={styles.loadingText}>Loading site information...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titleText}>Site Information</Text>
        <Text style={styles.subtitleText}>
          Enter the installation site details
        </Text>
      </View>

      <Formik
        initialValues={initialValues}
        enableReinitialize={true}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        validateOnChange={false}
        validateOnBlur={true}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
        }) => (
          <View style={styles.formContainer}>
            {/* Address Field */}
            <View style={styles.inputContainer}>
              <ThemedTextInput
                label="Street Address *"
                value={values.address}
                onChangeText={handleChange("address")}
                onBlur={handleBlur("address")}
                error={touched.address && errors.address}
                placeholder="123 Main Street"
                autoCapitalize="words"
              />
              {touched.address && errors.address && (
                <Text style={styles.errorText}>{errors.address}</Text>
              )}
            </View>

            {/* City Field */}
            <View style={styles.inputContainer}>
              <ThemedTextInput
                label="City *"
                value={values.city}
                onChangeText={handleChange("city")}
                onBlur={handleBlur("city")}
                error={touched.city && errors.city}
                placeholder="San Francisco"
                autoCapitalize="words"
              />
              {touched.city && errors.city && (
                <Text style={styles.errorText}>{errors.city}</Text>
              )}
            </View>

            {/* State and ZIP Row */}
            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <ThemedTextInput
                  label="State *"
                  value={values.state}
                  onChangeText={(text) => handleChange("state")(text.toUpperCase())}
                  onBlur={handleBlur("state")}
                  error={touched.state && errors.state}
                  placeholder="CA"
                  maxLength={2}
                  autoCapitalize="characters"
                />
                {touched.state && errors.state && (
                  <Text style={styles.errorText}>{errors.state}</Text>
                )}
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <ThemedTextInput
                  label="ZIP Code *"
                  value={values.zip}
                  onChangeText={handleChange("zip")}
                  onBlur={handleBlur("zip")}
                  error={touched.zip && errors.zip}
                  placeholder="94105"
                  keyboardType="numeric"
                  maxLength={5}
                />
                {touched.zip && errors.zip && (
                  <Text style={styles.errorText}>{errors.zip}</Text>
                )}
              </View>
            </View>

            {/* APN Field (Optional) */}
            <View style={styles.inputContainer}>
              <ThemedTextInput
                label="Assessor's Parcel Number (APN)"
                value={values.apn}
                onChangeText={handleChange("apn")}
                onBlur={handleBlur("apn")}
                placeholder="Optional"
                autoCapitalize="characters"
              />
            </View>

            {/* Jurisdiction Field (Optional) */}
            <View style={styles.inputContainer}>
              <ThemedTextInput
                label="Authority Having Jurisdiction (AHJ)"
                value={values.jurisdiction}
                onChangeText={handleChange("jurisdiction")}
                onBlur={handleBlur("jurisdiction")}
                placeholder="Optional"
                autoCapitalize="words"
              />
            </View>

            {/* Utility Field (Optional) */}
            <View style={styles.inputContainer}>
              <ThemedTextInput
                label="Utility Company"
                value={values.utility}
                onChangeText={handleChange("utility")}
                onBlur={handleBlur("utility")}
                placeholder="Optional"
                autoCapitalize="words"
              />
            </View>

            {/* Performance Note */}
            <View style={styles.performanceNote}>
              <Text style={styles.performanceText}>
                ⚡ This screen uses optimized API calls
              </Text>
              <Text style={styles.performanceSubtext}>
                Fetching only 7 fields instead of 804+ fields
              </Text>
            </View>

            {/* Submit Button */}
            <View style={styles.buttonContainer}>
              <Button
                color1="#FD7332"
                color2="#EF3826"
                onPress={handleSubmit}
                disabled={isLoading}
                style={[styles.submitButton, isLoading && styles.disabledButton]}
                labelStyle={styles.buttonText}
              >
                {isLoading ? "Saving..." : "Continue to Equipment"}
              </Button>
              
              {isLoading && (
                <ActivityIndicator 
                  size="small" 
                  color="#FD7332" 
                  style={styles.loadingIndicator}
                />
              )}
            </View>
          </View>
        )}
      </Formik>
    </ScrollView>
  );
};

export default SiteInfoOptimized;