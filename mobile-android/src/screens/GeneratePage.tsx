import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useAppSelector } from "../store/hooks";
import AttestationModal from "../components/AttestationModal";
import Button from "../components/Button";
import { Project } from "../types/project";
import { triggerPlanAutomation } from "../api/apiModules/triggerPlanAutomation";
import { UpdateProjectStatus } from "../api/project.service";
import { getSecretToken } from "../utils/secure";
import {
  showDebugPopup,
  DEBUG_MODE,
  writeDebugLogToFile,
  emailDebugLog,
} from "../utils/debugTools";

const GeneratePage: React.FC = () => {
  const project = useAppSelector(
    (state) => state.project.currentProject
  ) as Project | null;
  const companyId = useAppSelector((state: any) => state.profile.profile.company.uuid);

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingProcess, setPendingProcess] = useState<string | null>(null);

  const handleConfirm = async (processName: string) => {
    const steps: string[] = [];

    if (!project?.uuid) {
      Alert.alert("Missing project ID");
      return;
    }

    setShowModal(false);
    setLoading(true);

    try {
      steps.push(`Project ID exists: ${project.uuid}`);

      const secretToken = getSecretToken();
      steps.push("Loaded secret token");

      // Start both operations concurrently
      const automationPromise = triggerPlanAutomation(
        project.uuid,
        secretToken,
        processName,
        steps
      );
      
      // Async update project status to Design phase (completed_step: 2)
      const statusUpdatePromise = UpdateProjectStatus(
        project.uuid,
        companyId,
        2 // Design phase
      ).catch((error) => {
        console.warn('[GeneratePage] Status update failed:', error);
        // Don't fail the main operation if status update fails
        return null;
      });

      // Wait for automation to complete
      const result = await automationPromise;
      steps.push("triggerPlanAutomation() call succeeded");
      
      // Status update runs async, but log if it completes
      statusUpdatePromise.then((statusResult) => {
        if (statusResult) {
          console.debug('[GeneratePage] Project status updated to Design phase:', statusResult.data);
        }
      });

      showDebugPopup("🎯 Debug Report", steps);
      Alert.alert("✅ Success", result.message || "Triggered successfully!");
    } catch (error: any) {
      showDebugPopup("💥 Debug Crash Report", steps, error);
      Alert.alert("❌ Error", error?.message || "Unknown error occurred");
    } finally {
      setLoading(false);
      setPendingProcess(null);
    }
  };

  const handleButtonPress = (
    processName: string,
    requiresAttestation: boolean
  ) => {
    if (requiresAttestation) {
      setPendingProcess(processName);
      setShowModal(true);
    } else {
      handleConfirm(processName);
    }
  };

  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.pageTitle}>Generate Project</Text>
          <Text style={styles.pageSubtitle}>
            This will generate deliverables for your solar project.
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color="#FD7332" />
          ) : (
            <>
              <Button
                children="Generate Plan Set"
                onPress={() => handleButtonPress("generate_plan_set", true)}
                color1="#FD7332"
                color2="#EF3826"
                style={styles.generateButton}
                labelStyle={styles.buttonLabel}
              />
              <Button
                children="Generate Survey Report"
                onPress={() =>
                  handleButtonPress("generate_survey_report", false)
                }
                color1="#FD7332"
                color2="#EF3826"
                style={styles.generateButton}
                labelStyle={styles.buttonLabel}
              />
              <Button
                children="Generate Both"
                onPress={() =>
                  handleButtonPress("generate_plan_and_report", true)
                }
                color1="#FD7332"
                color2="#EF3826"
                style={styles.generateButton}
                labelStyle={styles.buttonLabel}
              />
            </>
          )}

          <AttestationModal
            visible={showModal}
            onConfirm={() => {
              if (pendingProcess) {
                handleConfirm(pendingProcess);
              }
            }}
            onCancel={() => {
              setShowModal(false);
              setPendingProcess(null);
            }}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default GeneratePage;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 8,
    textAlign: "center",
  },
  pageSubtitle: {
    fontSize: 16,
    color: "#CCC",
    marginBottom: 24,
    textAlign: "center",
  },
  generateButton: {
    height: 48,
    borderRadius: 8,
    alignSelf: "center",
    width: "80%",
    marginTop: 10,
  },
  buttonLabel: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#FFF",
  },
});
