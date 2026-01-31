import { View, ActivityIndicator, Alert, StyleSheet } from "react-native";
import Text from "../../components/Text";
import { styles } from "../../styles/projectInformationStyles";
import { Formik } from "formik";
import * as Yup from "yup"; // Import Yup for validation schema
import TextInputField from "../../components/TextInput";
import DateField from "../../components/DatePicker";
import { useState, useEffect, useRef, useCallback } from "react";
import { Divider, Menu, TextInput } from "react-native-paper";
import LinearGradient from "react-native-linear-gradient";
import Button from "../../components/Button";
import DropdownComponent from "../../components/Dropdown";
import UploadFile from "./Uploadfiles";
import SalesProposalUpload from "./SalesProposalUpload";
import { useNavigation } from "@react-navigation/native";
import { fileUploadGeneric } from "../../api/uploadfiles.service";
import { useSelector } from "react-redux";
import { useHandlePhotoSelection } from "./HandleTakePhoto"; // Import the hook
import TextComponent from "../../components/Text";
import logger from "../../utils/logger";
import Toast from "react-native-toast-message";
import * as projectService from "../../api/project.service";
import useProjectContext from "../../hooks/useProjectContext";
import { debounce } from "lodash";
// Define validation schema using Yup
const validationSchema = Yup.object().shape({
  companyName: Yup.string().required("Installer is required"),
  installerProjectId: Yup.string().required("Installer ProjectID is required"),
  customerFirstName: Yup.string().required("Customer First Name is required"),
  customerLastName: Yup.string().required("Customer Last Name is required"),
  projectNotes: Yup.string(),
  siteSurveyDate: Yup.string(),
  // Add additional validation as needed for other fields
});

const ProjectInfo = () => {
  const [imageUri, setImageUri] = useState<string>("");
  const [imageUrispecific, setImageUrispecific] = useState<string>("");
  const handlePhotoSelection = useHandlePhotoSelection(setImageUrispecific);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [salesProposalUrl, setSalesProposalUrl] = useState<string | null>(null);
  const [salesProposalFileName, setSalesProposalFileName] = useState<string | null>(null);

  // Get project and company context
  const { projectId, companyId, project } = useProjectContext();

  // Get user profile and check if super user
  const companyProfile = useSelector((s: any) => s.profile?.profile);
  const userEmail = companyProfile?.user?.email || '';
  const isSuperUser = userEmail === 'logan@skyfiresd.com' || userEmail === 'eli@skyfiresd.com';
  const userCompanyName = companyProfile?.company?.name || '';

  // Log company name loading for debugging
  if (__DEV__ && !userCompanyName && !isSuperUser) {
    console.log('📋 [ProjectInfo] Company name not loaded yet');
  }

  const initialValues = {
    companyName: project?.details?.company_name || userCompanyName,
    installerProjectId: project?.details?.installer_project_id || "",
    customerFirstName: project?.details?.customer_first_name || "",
    customerLastName: project?.details?.customer_last_name || "",
    projectNotes: project?.details?.project_notes || "",
    siteSurveyDate: project?.details?.site_survey_date || "",
    clientLogo: null,
    teamMembers: [],
  };
  const navigation: any = useNavigation();
  const isFirstRender = useRef(true);
  const lastSavedValues = useRef(initialValues);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  
  // Function to save project info
  const saveProjectInfo = async (values: any, isAutoSave = false) => {
    if (!projectId) {
      if (!isAutoSave) {
        Toast.show({
          text1: "Error",
          text2: "No project selected. Please select a project first.",
          type: "error",
          position: "top",
          visibilityTime: 4000,
        });
      }
      return false;
    }
    
    // Check if values have actually changed
    if (isAutoSave && JSON.stringify(values) === JSON.stringify(lastSavedValues.current)) {
      return true; // No changes to save
    }
    
    if (isAutoSave) {
      setIsAutoSaving(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);
    
    try {
      // Prepare the data for API
      const projectData = {
        company_name: values.companyName,
        installer_project_id: values.installerProjectId,
        customer_first_name: values.customerFirstName,
        customer_last_name: values.customerLastName,
        project_notes: values.projectNotes,
        site_survey_date: values.siteSurveyDate,
        // Add any additional fields that need to be saved
      };
      
      // Call the API to save project info
      const response = await projectService.SaveProjectInfo(
        projectId,
        companyId || "",
        projectData
      );
      
      // Update project status to indicate completion of this step
      if (response && response.status >= 200 && response.status < 300) {
        await projectService.UpdateProjectStatus(
          projectId,
          companyId || "",
          1 // Set completed_step to 1 for project info completion
        );
      }
      
      if (response && response.status >= 200 && response.status < 300) {
        lastSavedValues.current = values; // Update last saved values
        
        if (!isAutoSave) {
          Toast.show({
            text1: "Data Saved",
            type: "success",
            position: "top",
            visibilityTime: 1500, // Quick toast that disappears
          });
        } else {
          // Show a subtle indicator for auto-save
          Toast.show({
            text1: "Auto-saved",
            type: "success",
            position: "bottom",
            visibilityTime: 1000,
          });
        }
        
        // Log success for debugging
        logger.log(isAutoSave ? "Auto-save successful" : "Project info saved successfully", { projectId, data: projectData });
        
        return true;
      } else {
        throw new Error(response?.data?.message || "Failed to save project information");
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || 
                      error?.message || 
                      "Failed to save project information. Please try again.";
      
      setErrorMessage(errorMsg);
      
      if (!isAutoSave) {
        Toast.show({
          text1: "Error",
          text2: errorMsg,
          type: "error",
          position: "top",
          visibilityTime: 5000,
        });
      }
      
      // Log error for debugging
      logger.error("Failed to save project info", { error, projectId });
      
      return false;
    } finally {
      if (isAutoSave) {
        setIsAutoSaving(false);
      } else {
        setIsLoading(false);
      }
    }
  };
  
  // Create debounced auto-save function
  const debouncedAutoSave = useCallback(
    debounce((values: any) => {
      saveProjectInfo(values, true);
    }, 2000), // 2 seconds debounce delay
    [projectId, companyId]
  );

  // Handle sales proposal upload success
  const handleProposalUploadSuccess = (fileUrl: string, fileName: string) => {
    console.log("[ProjectInfo] Sales proposal uploaded:", { fileUrl, fileName });
    setSalesProposalUrl(fileUrl);
    setSalesProposalFileName(fileName);

    // TODO: In next phase, trigger PDF scraper API call here
    // This is where you'll integrate your PDF scraper
    // Example:
    // await triggerPdfScraper(projectId, fileUrl);

    Toast.show({
      text1: "Proposal Uploaded",
      text2: "Processing will begin shortly",
      type: "info",
      position: "top",
      visibilityTime: 3000,
    });
  };

  const handleProposalUploadError = (error: string) => {
    console.error("[ProjectInfo] Sales proposal upload error:", error);
    Toast.show({
      text1: "Upload Error",
      text2: error,
      type: "error",
      position: "top",
      visibilityTime: 5000,
    });
  };

  // For non-super users on new projects, ensure company name is loaded before rendering form
  // This prevents the form from initializing with empty company name
  if (!isSuperUser && !userCompanyName && !project?.details?.company_name) {
    console.log('📋 [ProjectInfo] Waiting for company profile to load...');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <ActivityIndicator size="large" color="#FD7332" />
        <Text style={{ color: '#FFF', marginTop: 16, fontSize: 16 }}>
          Loading company information...
        </Text>
      </View>
    );
  }

  return (
    <View>
      <View>
        <Text style={styles.titleText}>Project Information</Text>
      </View>

      {/* Sales Proposal Upload Section */}
      <SalesProposalUpload
        projectId={projectId}
        companyId={companyId}
        onUploadSuccess={handleProposalUploadSuccess}
        onUploadError={handleProposalUploadError}
      />

      {/* OR Divider */}
      <View style={localStyles.dividerContainer}>
        <View style={localStyles.dividerLine} />
        <Text style={localStyles.dividerText}>OR</Text>
        <View style={localStyles.dividerLine} />
      </View>

      {/* Manual Entry Section */}
      <View style={localStyles.manualEntrySection}>
        <Text style={localStyles.manualEntryTitle}>Enter Project Details Manually</Text>
      </View>

      <Formik
        enableReinitialize={true} // Critical: Update form when profile data loads
        initialValues={initialValues}
        validationSchema={validationSchema} // Attach the validation schema
        onSubmit={async (values: any) => {
          // Ensure installer name is populated (defense in depth - backend also handles this)
          const submitValues = {
            ...values,
            companyName: values.companyName || userCompanyName || companyProfile?.company?.name || '',
          };

          // Save the project info before navigation
          const saveSuccess = await saveProjectInfo(submitValues, false);

          // Only navigate if save was successful
          if (saveSuccess) {
            navigation.navigate("SiteScreens");
          }
        }}
        validateOnChange={false}
        validateOnBlur={false}
      >
        {({
          handleChange,
          handleBlur,
          values,
          errors,
          touched,
          handleSubmit,
          setFieldValue,
        }) => {
          // Auto-save when values change
          useEffect(() => {
            if (isFirstRender.current) {
              isFirstRender.current = false;
              return;
            }
            
            // Trigger auto-save on value changes
            debouncedAutoSave(values);
            
            // Cleanup function to cancel pending auto-save on unmount
            return () => {
              debouncedAutoSave.cancel();
            };
          }, [values]);
          
          return (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View>
              <TextInputField
                label={"Installer *"}
                onChangeText={handleChange("companyName")}
                onBlur={handleBlur("companyName")}
                value={values.companyName}
                errorText={touched.companyName && errors.companyName}
                editable={isSuperUser}
                style={!isSuperUser && { backgroundColor: '#2E4161', opacity: 0.7 }}
              />
            </View>
            <View>
              <TextInputField
                label={"Installer ProjectID *"}
                onChangeText={handleChange("installerProjectId")}
                onBlur={handleBlur("installerProjectId")}
                value={values.installerProjectId}
                errorText={touched.installerProjectId && errors.installerProjectId}
              />
            </View>
            <View>
              <TextInputField
                label={"Customer First Name "}
                onChangeText={handleChange("customerFirstName")}
                onBlur={handleBlur("customerFirstName")}
                value={values.customerFirstName}
                errorText={touched.customerFirstName && errors.customerFirstName}
              />
            </View>
            <View>
              <TextInputField
                label={"Customer Last Name "}
                onChangeText={handleChange("customerLastName")}
                onBlur={handleBlur("customerLastName")}
                value={values.customerLastName}
                errorText={touched.customerLastName && errors.customerLastName}
              />
            </View>
            <View>
              <TextInputField
                label={"Project Notes"}
                onChangeText={handleChange("projectNotes")}
                onBlur={handleBlur("projectNotes")}
                value={values.projectNotes}
                errorText={touched.projectNotes && errors.projectNotes}
              />
            </View>
            <View style={{ position: "relative" }}>
              <TextInputField
                label={"Site Survey Scheduled Date"}
                onChangeText={handleChange("siteSurveyDate")}
                onBlur={handleBlur("siteSurveyDate")}
                value={values.siteSurveyDate}
                errorText={touched.siteSurveyDate && errors.siteSurveyDate}
              />
              <View style={{ position: "absolute", top: 40, right: 0 }}>
                <DateField onChangeDate={handleChange("siteSurveyDate")} />
              </View>
            </View>
            <View>
              <UploadFile imageUri={imageUri} setImageUri={setImageUri} />
            </View>
            <View style={styles.marginBorder}></View>
            <View>
              <Text
                children={"Site Survey Photos"}
                style={styles.siteSurveyText}
              />
              <LinearGradient
                colors={["rgba(12, 31, 63, 1)", "rgba(12, 31, 63, 0)"]}
                style={styles.sitephotoContainer}
              >
                <View style={{ marginTop: 20 }}>
                  <Text style={styles.textUploadcount}>Photo Upload Count</Text>
                  <Text style={styles.photo_count}>0</Text>
                  <Text style={styles.smallText}>
                    Upload may take a moment to update
                  </Text>
                </View>
              </LinearGradient>
            </View>
            <View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flex: 1,
                  gap: 30,
                }}
              >
                <View style={{ flex: 0.7 }}>
                  <Text
                    children={"Site Photos"}
                    style={styles.siteUploadHeading}
                  />
                  <DropdownComponent label={"Choose from list"} />
                </View>
                <View style={{ flex: 0.2, marginTop: 40 }}>
                  <Button
                    color1={"rgba(12, 31, 63, 1)"}
                    labelStyle={styles.buttonLabel}
                    color2={"rgba(12, 31, 63, 0.2)"}
                    onPress={() => handlePhotoSelection("All")}
                    children={"Take Photo"}
                    style={styles.btn}
                  />
                </View>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flex: 1,
                  gap: 30,
                }}
              >
                <View style={{ flex: 0.7 }}>
                  <Text
                    children={"Site Photos"}
                    style={styles.siteUploadHeading}
                  />
                  <DropdownComponent label={"Electrical Photos"} />
                </View>
                <View style={{ flex: 0.2 }}>
                  <Button
                    color1={"rgba(12, 31, 63, 1)"}
                    labelStyle={styles.buttonLabel}
                    color2={"rgba(12, 31, 63, 0.2)"}
                    onPress={() => handlePhotoSelection("electrical")} // Use this to show the options}
                    children={"Take Photo"}
                    style={styles.btn}
                  />
                </View>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flex: 1,
                  gap: 30,
                }}
              >
                <View style={{ flex: 0.7 }}>
                  <Text
                    children={"Site Photos"}
                    style={styles.siteUploadHeading}
                  />
                  <DropdownComponent label={"Structural Photos"} />
                </View>
                <View style={{ flex: 0.2 }}>
                  <Button
                    color1={"rgba(12, 31, 63, 1)"}
                    labelStyle={styles.buttonLabel}
                    color2={"rgba(12, 31, 63, 0.2)"}
                    onPress={() => handlePhotoSelection("structural")}
                    children={"Take Photo"}
                    style={styles.btn}
                  />
                </View>
              </View>
              {errorMessage?.trim() !== "" && (
                <Text style={{ color: "red" }}>{errorMessage}</Text>
              )}
            </View>
            <View style={styles.btnContainer}>
              <Button
                color1={"#FD7332"}
                color2={"#EF3826"}
                children={isLoading ? "Saving..." : "Submit"}
                style={[styles.join, isLoading && { opacity: 0.7 }]}
                onPress={() => {
                  if (!isLoading) {
                    handleSubmit();
                  }
                }}
                labelStyle={styles.buttonText}
                disabled={isLoading}
              />
              {isLoading && (
                <ActivityIndicator 
                  size="small" 
                  color="#FD7332" 
                  style={{ position: 'absolute', right: 20, top: '50%', marginTop: -10 }}
                />
              )}
            </View>
            {isAutoSaving && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                <ActivityIndicator size="small" color="#FD7332" />
                <Text style={{ marginLeft: 8, color: '#666', fontSize: 12 }}>Auto-saving...</Text>
              </View>
            )}
          </View>
        );
        }}
      </Formik>
    </View>
  );
};

// Local styles specific to ProjectInfo layout
const localStyles = StyleSheet.create({
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    paddingHorizontal: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  dividerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF80",
    marginHorizontal: 16,
    letterSpacing: 1,
  },
  manualEntrySection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  manualEntryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
});

export default ProjectInfo;
