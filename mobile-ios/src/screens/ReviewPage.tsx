import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setProject } from "../store/slices/projectSlice";
import LinearGradient from "react-native-linear-gradient";
import Text from "../components/Text";
import { Project } from "../types/project";
import AttestationModal from "../components/AttestationModal";
import GenerateStatusModal from "../components/Modals/GenerateStatusModal";
import LargeHeader from "../components/Header/LargeHeader";
import Button from "../components/Button";
import ReviewRadialButton from "./ReviewPage/ReviewRadialButton";
import { useResponsive } from "../utils/responsive";

import { triggerPlanAutomation } from "../api/apiModules/triggerPlanAutomation";
import { GetProjectAdditionalServices, SaveProjectAdditionalServices } from "../api/project.service";
import { fetchSystemDetails, saveSystemDetails } from "../api/systemDetails.service";
import { APP_LOCAL_TRIGGER_SECRET, APP_TRIGGER_COMPUTER_NAME } from "@env";
import Toast from "react-native-toast-message";
import { logger } from "../utils/logger";
import { detectSpecialScenario } from "../utils/systemReordering";

type ActionKind = "site" | "plan" | "both";

// Gradient colors
function averageHexColor(a: string, b: string): string {
  const ha = a.replace("#", ""),
    hb = b.replace("#", "");
  const ra = parseInt(ha.slice(0, 2), 16),
    ga = parseInt(ha.slice(2, 4), 16),
    ba = parseInt(ha.slice(4, 6), 16);
  const rb = parseInt(hb.slice(0, 2), 16),
    gb = parseInt(hb.slice(2, 4), 16),
    bb = parseInt(hb.slice(4, 6), 16);
  const r = Math.round((ra + rb) / 2)
    .toString(16)
    .padStart(2, "0");
  const g = Math.round((ga + gb) / 2)
    .toString(16)
    .padStart(2, "0");
  const b2 = Math.round((ba + bb) / 2)
    .toString(16)
    .padStart(2, "0");
  return `#${r}${g}${b2}`;
}

const LIGHT = "#2E4161";
const DARK = "#0C1F3F";
const MID = averageHexColor(LIGHT, DARK);
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const ReviewPage: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { verticalScale, font } = useResponsive();
  const [headerHeight, setHeaderHeight] = useState(0);
  const autoNavigateTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Document selection state (radio button)
  const [selectedDocument, setSelectedDocument] = useState<"plan" | "site" | "all" | null>("plan");

  // Redux selectors
  const project = useAppSelector(
    (state) => state.project.currentProject
  ) as Project | null;

  const userEmail = useAppSelector((s) => (s as any).auth?.user?.email ?? "");

  // Check if user is super user (logan@skyfiresd.com or eli@skyfiresd.com)
  const isSuperUser = userEmail === 'logan@skyfiresd.com' || userEmail === 'eli@skyfiresd.com';

  // Context for server
  const authState = useAppSelector((s) => (s as any).auth);
  const profileState = useAppSelector((s) => (s as any).profile);
  logger.debug('[ReviewPage] Full auth state:', JSON.stringify(authState, null, 2));
  logger.debug('[ReviewPage] Full profile state:', JSON.stringify(profileState, null, 2));
  
  const companyUuid = useAppSelector(
    (s) =>
      (s as any).profile?.profile?.company?.uuid ?? 
      (s as any).auth?.company?.uuid ?? 
      (s as any).auth?.company?.id ?? 
      null
  );
  const userUuid = useAppSelector(
    (s) => (s as any).auth?.user?.uuid ?? (s as any).auth?.user?.id ?? null
  );
  
  logger.debug('[ReviewPage] Extracted companyUuid:', companyUuid);
  logger.debug('[ReviewPage] Extracted userUuid:', userUuid);

  // Add-ons state
  const [addOns, setAddOns] = useState({
    structuralPEStamps: false,
    electricalPEStamps: false,
    buildPermitSubmission: false,
    interconnectionPermitSubmission: false,
  });
  const [loadingAddOns, setLoadingAddOns] = useState(true);
  const [savingAddOns, setSavingAddOns] = useState(false);

  useEffect(() => {
    if (project) dispatch(setProject(project));
  }, [project, dispatch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoNavigateTimeoutRef.current) {
        clearTimeout(autoNavigateTimeoutRef.current);
      }
    };
  }, []);

  // Load initial add-ons state from API
  useEffect(() => {
    const loadAddOnsState = async () => {
      if (!project?.uuid || !companyUuid) {
        logger.debug('[ReviewPage] Missing project UUID or companyUuid, setting loadingAddOns to false');
        setLoadingAddOns(false);
        return;
      }

      setLoadingAddOns(true);
      try {
        logger.debug('[ReviewPage] Loading additional services for project:', project.uuid);
        const response = await GetProjectAdditionalServices(project.uuid, companyUuid);
        logger.debug('[ReviewPage] GetProjectAdditionalServices response:', response?.status);
        if (response?.status === 200 && response.data?.data) {
          const data = response.data.data;
          logger.debug('[ReviewPage] Setting addOns from API data:', data);
          setAddOns({
            structuralPEStamps: data.structuralStamps || false,
            electricalPEStamps: data.electricalStamps || false,
            buildPermitSubmission: data.buildingPermit || false,
            interconnectionPermitSubmission: data.interconnectionPermit || false,
          });
        }
      } catch (error) {
        logger.warn('[ReviewPage] Failed to load additional services:', error);
      } finally {
        logger.debug('[ReviewPage] Setting loadingAddOns to false');
        setLoadingAddOns(false);
      }
    };

    loadAddOnsState();
  }, [project?.uuid, companyUuid]);

  // Attestation + Trigger state
  const [modalVisible, setModalVisible] = useState(false);
  const [pending, setPending] = useState<ActionKind | null>(null);
  const [sending, setSending] = useState(false);

  // Status modal state
  const [statusVisible, setStatusVisible] = useState(false);
  const [statusKind, setStatusKind] = useState<"success" | "error" | "sending">(
    "sending"
  );
  const [statusDetails, setStatusDetails] = useState<string>("");

  const canSeeDetails = userEmail?.toLowerCase() === "logan@skyfiresd.com";
  const stopAt = headerHeight / SCREEN_HEIGHT;

  logger.debug('[ReviewPage] Debug info:', {
    'project.uuid': project?.uuid,
    companyUuid,
    loadingAddOns,
    savingAddOns,
    addOns
  });

  // Add-on handlers with auto-save
  const handleAddOnToggle = async (key: keyof typeof addOns) => {
    logger.debug('[ReviewPage] handleAddOnToggle', { key, projectUuid: project?.uuid, companyUuid, savingAddOns });

    if (!project?.uuid || !companyUuid || savingAddOns) {
      logger.debug('[ReviewPage] Early return - missing requirements');
      return;
    }

    const newValue = !addOns[key];
    logger.debug('[ReviewPage] Toggling', key, 'from', addOns[key], 'to', newValue);
    
    // Optimistically update UI
    setAddOns(prev => ({
      ...prev,
      [key]: newValue
    }));

    // Save to API
    setSavingAddOns(true);
    try {
      // Build the updated state object with the new value
      const updatedAddOns = { ...addOns, [key]: newValue };
      logger.debug('[ReviewPage] Sending to API - updatedAddOns:', updatedAddOns);

      // Build list of selected services
      const selectedServices: string[] = [];
      if (updatedAddOns.structuralPEStamps) selectedServices.push('Structural PE Stamps');
      if (updatedAddOns.electricalPEStamps) selectedServices.push('Electrical PE Stamps');
      if (updatedAddOns.buildPermitSubmission) selectedServices.push('Build Permit Submission');
      if (updatedAddOns.interconnectionPermitSubmission) selectedServices.push('Interconnection Permit Submission');

      // Map frontend keys to backend keys (legacy boolean fields + new consolidated field)
      const apiData = {
        structuralStamps: updatedAddOns.structuralPEStamps,
        electricalStamps: updatedAddOns.electricalPEStamps,
        buildingPermit: updatedAddOns.buildPermitSubmission,
        interconnectionPermit: updatedAddOns.interconnectionPermitSubmission,
        selectedAdditionalServices: selectedServices.join(', '), // New consolidated field
      };
      logger.debug('[ReviewPage] Sending to API - apiData:', apiData);

      const response = await SaveProjectAdditionalServices(project.uuid, companyUuid, apiData);
      logger.debug('[ReviewPage] API response:', { status: response?.status, data: response?.data });

      if (response?.status !== 200) {
        logger.warn('[ReviewPage] Failed to save additional services - reverting optimistic update', response);
        // Revert optimistic update on failure
        setAddOns(prev => ({
          ...prev,
          [key]: !newValue
        }));
      } else {
        logger.debug('[ReviewPage] Successfully saved additional services');
        // Show success toast
        Toast.show({
          text1: "Data Saved",
          type: "success",
          position: "top",
          visibilityTime: 1500,
        });
      }
    } catch (error) {
      logger.warn('[ReviewPage] Error saving additional services:', error);
      // Revert optimistic update on error
      setAddOns(prev => ({
        ...prev,
        [key]: !newValue
      }));
    } finally {
      setSavingAddOns(false);
    }
  };

  const handleGenerateClick = () => {
    if (!selectedDocument) {
      logger.warn("[ReviewPage] No document type selected");
      return;
    }

    // Map selectedDocument to ActionKind
    const actionKind: ActionKind = selectedDocument === "all" ? "both" : selectedDocument === "plan" ? "plan" : "site";

    // Show attestation modal
    setPending(actionKind);
    setModalVisible(true);
  };

  const handleSuperUserAction = () => {
    logger.info("[ReviewPage] Super user action triggered");
    Toast.show({
      type: "info",
      text1: "Super User Action",
      text2: "This feature will be connected to an automation",
      position: "bottom",
      visibilityTime: 3000,
    });
    // TODO: Connect to automation
  };

  const handleCancel = () => {
    if (sending) return;
    setModalVisible(false);
    setPending(null);
  };

  const getProcessNames = (kind: ActionKind): string[] => {
    switch (kind) {
      case "plan":
        return ["GenerateProjects_Mobile"];
      case "site":
        return ["generate_survey_report"];
      case "both":
        return ["generate_survey_report", "GenerateProjects_Mobile"];
      default:
        return [];
    }
  };

  const goToDashboard = () => {
    // Clear auto-navigate timeout if user clicks "Done" manually
    if (autoNavigateTimeoutRef.current) {
      clearTimeout(autoNavigateTimeoutRef.current);
      autoNavigateTimeoutRef.current = null;
    }
    setStatusVisible(false);
    navigation.navigate("Home" as never);
  };

  // Function to increment version number and update generation tracking in project_system_details
  const incrementVersionNumber = async (projectUuid: string): Promise<void> => {
    try {
      logger.debug('[ReviewPage] Incrementing version number and updating generation tracking for project:', projectUuid);

      // Fetch current system details
      const currentSystemDetails = await fetchSystemDetails(projectUuid);

      // Determine current version (default to 0 if null, undefined, or 0)
      const currentVersion = currentSystemDetails?.version_number || 0;
      const newVersion = currentVersion + 1;

      // Get current timestamp
      const now = new Date().toISOString();

      // Determine user identifier for last_generated_by (prefer email, fallback to userUuid)
      const generatedBy = userEmail || userUuid || 'unknown';

      logger.debug('[ReviewPage] Update details:', {
        currentVersion,
        newVersion,
        timestamp: now,
        generatedBy
      });

      // Save the incremented version, timestamp, and user info
      await saveSystemDetails(projectUuid, {
        version_number: newVersion,
        last_generated_at: now,
        last_generated_by: generatedBy
      });

      logger.info('[ReviewPage] Successfully updated generation tracking:', {
        version: newVersion,
        generatedAt: now,
        generatedBy
      });
    } catch (error) {
      logger.error('[ReviewPage] Failed to update generation tracking:', error);
      // Don't throw the error - we don't want to block the automation if version increment fails
    }
  };

  // Function to detect special scenario and save to database
  const detectAndUpdateSpecialScenario = async (projectUuid: string): Promise<void> => {
    try {
      logger.debug('[ReviewPage] Detecting special scenario for project:', projectUuid);

      // Fetch current system details to get sys1-4_selectedsystem
      const systemDetails = await fetchSystemDetails(projectUuid);

      if (!systemDetails) {
        logger.warn('[ReviewPage] No system details found for special scenario detection');
        return;
      }

      // Detect special scenario
      const scenarioResult = detectSpecialScenario({
        sys1_selectedsystem: systemDetails.sys1_selectedsystem,
        sys2_selectedsystem: systemDetails.sys2_selectedsystem,
        sys3_selectedsystem: systemDetails.sys3_selectedsystem,
        sys4_selectedsystem: systemDetails.sys4_selectedsystem,
        sys2_micro_inverter_model: systemDetails.sys2_micro_inverter_model,
        sys3_micro_inverter_model: systemDetails.sys3_micro_inverter_model,
        sys2_micro_inverter_make: systemDetails.sys2_micro_inverter_make,
        sys3_micro_inverter_make: systemDetails.sys3_micro_inverter_make,
        sys2_batteryonly: systemDetails.sys2_batteryonly,
        sys3_batteryonly: systemDetails.sys3_batteryonly,
      });

      logger.info('[ReviewPage] Special scenario detected:', scenarioResult);

      // Update database with special scenario flags
      await saveSystemDetails(projectUuid, {
        special_scenario: scenarioResult.scenario,
        special_scenario_reason: scenarioResult.reason,
        affected_systems: scenarioResult.affectedSystems.join(','),
      });

      logger.info('[ReviewPage] Successfully saved special scenario to database:', {
        scenario: scenarioResult.scenario,
        affected: scenarioResult.affectedSystems,
      });

    } catch (error) {
      logger.error('[ReviewPage] Failed to detect/update special scenario:', error);
      // Don't throw - we don't want to block automation if this fails
    }
  };

  const handleConfirm = useCallback(async () => {
    if (!project?.uuid || !pending) {
      setStatusKind("error");
      setStatusDetails("Missing project UUID or action kind.");
      setStatusVisible(true);
      return;
    }
    if (sending) return;

    setSending(true);
    const steps: string[] = [];

    // Show immediate "Submitting…"
    setStatusKind("sending");
    setStatusDetails("");
    setStatusVisible(true);

    try {
      // STEP 1: Detect and update special scenario FIRST
      steps.push("🔍 Detecting special scenario...");
      await detectAndUpdateSpecialScenario(project.uuid);
      steps.push("✅ Special scenario detection complete");

      // STEP 2: Increment version number
      steps.push("🔢 Updating version tracking...");
      await incrementVersionNumber(project.uuid);
      steps.push("✅ Version tracking updated");

      dispatch(setProject(project));

      const processNames = getProcessNames(pending);

      // STEP 3: Trigger automation(s)
      for (const processName of processNames) {
        steps.push(`▶️ Starting: ${processName}`);
        const resp = await triggerPlanAutomation(
          project.uuid,
          APP_LOCAL_TRIGGER_SECRET,
          processName,
          steps,
          {
            computerName: APP_TRIGGER_COMPUTER_NAME,
            companyUuid: companyUuid ?? undefined,
            userUuid: userUuid ?? undefined,
            clientVersion: "1.0.7",
          }
        );
        steps.push(
          `✅ ${processName} response: ${JSON.stringify(resp).slice(0, 500)}`
        );
      }

      setModalVisible(false);
      setPending(null);

      setStatusKind("success");
      setStatusDetails(steps.join("\n"));

      // Auto-navigate to dashboard after 2 seconds on success
      autoNavigateTimeoutRef.current = setTimeout(() => {
        logger.debug("[ReviewPage] Auto-navigating to dashboard after successful generation");
        setStatusVisible(false);
        navigation.navigate("Home" as never);
      }, 2000);
    } catch (e: any) {
      setStatusKind("error");
      const errMsg = e?.response?.data
        ? JSON.stringify(e.response.data)
        : e?.message || String(e);
      steps.push(`💥 Error: ${errMsg}`);
      setStatusDetails(steps.join("\n"));
      logger.warn("[Generate] error:", e);
    } finally {
      setSending(false);
    }
  }, [dispatch, pending, project, sending, companyUuid, userUuid, navigation]);

  return (
    <LinearGradient
      colors={[LIGHT, MID, DARK]}
      locations={[0, stopAt, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientView}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollViewContent,
          { paddingTop: headerHeight + verticalScale(60), paddingBottom: verticalScale(30) }
        ]}
      >
        {/* Documents Section */}
        <View style={styles.documentsSection}>
          <Text style={styles.sectionLabel}>Documents</Text>

          <View style={styles.verticalRadialButtons}>
            <ReviewRadialButton
              label="Plan Set"
              selected={selectedDocument === "plan"}
              onToggle={(isOn) => {
                if (isOn) setSelectedDocument("plan");
              }}
            />

            <ReviewRadialButton
              label="Site Survey Report"
              selected={false}
              onToggle={() => {
                // Disabled - do nothing
              }}
              disabled={true}
            />
          </View>
        </View>

        {/* PE Stamps Section */}
        <View style={styles.peStampsSection}>
          <Text style={styles.sectionLabel}>PE Stamps</Text>

          <View style={styles.verticalRadialButtons}>
            <ReviewRadialButton
              label="Structural"
              selected={addOns.structuralPEStamps}
              onToggle={() => handleAddOnToggle("structuralPEStamps")}
            />

            <ReviewRadialButton
              label="Electrical"
              selected={addOns.electricalPEStamps}
              onToggle={() => handleAddOnToggle("electricalPEStamps")}
            />
          </View>
        </View>

        {/* Permits Section */}
        <View style={styles.permitsSection}>
          <Text style={styles.sectionLabel}>Permits</Text>

          <View style={styles.verticalRadialButtons}>
            <ReviewRadialButton
              label="Submit Building Permit"
              selected={addOns.buildPermitSubmission}
              onToggle={() => handleAddOnToggle("buildPermitSubmission")}
            />

            <ReviewRadialButton
              label="Submit Interconnection Application"
              selected={addOns.interconnectionPermitSubmission}
              onToggle={() => handleAddOnToggle("interconnectionPermitSubmission")}
            />
          </View>
        </View>

        {/* Generate Button */}
        <View style={styles.generateButtonContainer}>
          <Button
            onPress={handleGenerateClick}
            width="100%"
            height={56}
            selected={true}
            rounded={28}
            style={styles.generateButton}
            textStyle={styles.generateButtonText}
            title="Generate"
            disabled={!selectedDocument}
          />
        </View>

        {/* Super User Button - Only visible to super users */}
        {isSuperUser && (
          <View style={styles.generateButtonContainer}>
            <Button
              onPress={handleSuperUserAction}
              width="100%"
              height={56}
              selected={true}
              rounded={28}
              style={styles.superUserButton}
              textStyle={styles.superUserButtonText}
              title="Super User Action"
            />
          </View>
        )}
      </ScrollView>

      {/* Header overlay */}
      <View
        style={styles.headerWrap}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <LargeHeader
          title="Generate"
          name={
            project?.details?.customer_last_name
              ? `${project.details.customer_last_name}, ${project.details.customer_first_name}`
              : undefined
          }
          addressLines={
            project?.site
              ? [
                  project.site.address || "",
                  [project.site.city, project.site.state, project.site.zip_code]
                    .filter(Boolean)
                    .join(", "),
                ]
              : undefined
          }
          projectId={project?.details?.installer_project_id}
          onDrawerPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        />
      </View>

      {/* Attestation modal */}
      <AttestationModal
        visible={modalVisible}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        loading={sending}
      />

      {/* Branded status modal */}
      <GenerateStatusModal
        visible={statusVisible}
        kind={statusKind}
        onPrimary={goToDashboard}
        details={canSeeDetails ? statusDetails : undefined}
        canSeeDetails={canSeeDetails}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  headerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },

  // Common Section Styles
  sectionLabel: {
    color: "#FFFFFF",
    fontSize: 24, // Match name size from LargeHeader (font(24))
    fontWeight: "700", // Bold to match Lato-Bold
    marginBottom: 12,
  },
  verticalRadialButtons: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    width: "100%",
  },

  // Documents Section
  documentsSection: {
    marginBottom: 20,
    width: "100%",
  },

  // PE Stamps Section
  peStampsSection: {
    marginBottom: 20,
    width: "100%",
  },

  // Permits Section
  permitsSection: {
    marginBottom: 24,
    width: "100%",
  },

  // Generate Button
  generateButtonContainer: {
    width: "100%",
    marginBottom: 20,
  },
  generateButton: {
    marginVertical: 0,
  },
  generateButtonText: {
    fontSize: 24, // Match section labels (Documents, PE Stamps, Permits)
    fontWeight: "700", // Bold to match section labels
  },
  // Super User Button (same style as Generate button)
  superUserButton: {
    marginVertical: 0,
  },
  superUserButtonText: {
    fontSize: 24,
    fontWeight: "700",
  },
});

export default ReviewPage;