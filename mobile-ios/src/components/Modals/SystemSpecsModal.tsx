// src/components/Modals/SystemSpecsModal.tsx

import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { fetchSystemDetails } from "../../api/systemDetails.service";
import { getInverterByModelNumber } from "../../api/inverter.service";

interface SystemSpec {
  systemNumber: number;
  systemLabel: string;
  maxContinuousOutputAmps: number;
  make: string;
  model: string;
}

interface SystemSpecsModalProps {
  visible: boolean;
  onClose: () => void;
  projectId: string;
}

export default function SystemSpecsModal({
  visible,
  onClose,
  projectId,
}: SystemSpecsModalProps) {
  const [systemSpecs, setSystemSpecs] = useState<SystemSpec[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && projectId) {
      loadSystemSpecs();
    }
  }, [visible, projectId]);

  const loadSystemSpecs = async () => {
    setLoading(true);
    try {
      const systemData = await fetchSystemDetails(projectId);
      if (!systemData) {
        setSystemSpecs([]);
        return;
      }

      const specs: SystemSpec[] = [];

      // Check all 4 systems for inverter/microinverter
      // Both use the same fields: sys{N}_micro_inverter_*
      for (let i = 1; i <= 4; i++) {
        const prefix = `sys${i}`;

        const inverterMake = systemData[`${prefix}_micro_inverter_make`];
        const inverterModel = systemData[`${prefix}_micro_inverter_model`];

        // Only proceed if we have both make and model
        if (inverterMake && inverterMake.trim() && inverterModel && inverterModel.trim()) {
          try {
            console.log(`[SystemSpecs] Looking up inverter for ${prefix}: manufacturer="${inverterMake}" model="${inverterModel}"`);

            // Use the /api/inverters/models endpoint which filters by manufacturer
            const URL = `https://api.skyfireapp.io/api/inverters/models?manufacturer=${encodeURIComponent(inverterMake)}`;
            const response = await fetch(URL);
            const data = await response.json();

            if (data?.success && Array.isArray(data.data)) {
              console.log(`[SystemSpecs] API returned ${data.data.length} inverters for manufacturer ${inverterMake}`);

              // Find the exact match by model_number
              const matchedInverter = data.data.find((inv: any) =>
                inv.model_number === inverterModel ||
                inv.make_model === `${inverterMake} ${inverterModel}`
              );

              if (matchedInverter && matchedInverter.id) {
                console.log(`[SystemSpecs] Found matching inverter for ${prefix}, fetching full details with ID:`, matchedInverter.id);

                // Now fetch the full inverter details to get max_cont_output_amps
                try {
                  const detailURL = `https://api.skyfireapp.io/api/inverters/${matchedInverter.id}`;
                  const detailResponse = await fetch(detailURL);
                  const detailData = await detailResponse.json();

                  if (detailData?.success && detailData.data) {
                    const fullInverterData = detailData.data;
                    console.log(`[SystemSpecs] Full inverter data for ${prefix}:`, {
                      model_number: fullInverterData.model_number,
                      max_cont_output_amps: fullInverterData.max_cont_output_amps
                    });

                    // Get max continuous output amps directly from the field
                    const maxContOutputAmps = parseFloat(fullInverterData.max_cont_output_amps) || 0;

                    if (maxContOutputAmps > 0) {
                      specs.push({
                        systemNumber: i,
                        systemLabel: `Sys ${i}`,
                        maxContinuousOutputAmps: Math.round(maxContOutputAmps),
                        make: inverterMake,
                        model: inverterModel,
                      });
                    } else {
                      console.warn(`[SystemSpecs] No max_cont_output_amps found for ${prefix}:`, fullInverterData);
                    }
                  } else {
                    console.warn(`[SystemSpecs] Failed to fetch full details for inverter ID ${matchedInverter.id}`);
                  }
                } catch (detailError) {
                  console.error(`[SystemSpecs] Error fetching full inverter details for ${prefix}:`, detailError);
                }
              } else {
                console.warn(`[SystemSpecs] No exact match found for model "${inverterModel}" in manufacturer "${inverterMake}"`);
                // Log all models to help debug
                console.log(`[SystemSpecs] Available models:`, data.data.map((inv: any) => inv.model_number));
              }
            } else {
              console.warn(`[SystemSpecs] API returned no data for manufacturer: ${inverterMake}`);
            }
          } catch (error) {
            console.error(`[SystemSpecs] Error fetching inverter for System ${i}:`, error);
          }
        }
      }

      console.log(`[SystemSpecs] Final specs array:`, specs);
      setSystemSpecs(specs);
    } catch (error) {
      console.error("Error loading system specs:", error);
      setSystemSpecs([]);
    } finally {
      setLoading(false);
    }
  };

  // Debug log to see what's being rendered
  console.log(`[SystemSpecs] Render - loading: ${loading}, specs count: ${systemSpecs.length}`, systemSpecs);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={["#2E4A6F", "#0C1F3F"]}
          style={styles.modalContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>System Specs</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FD7332" />
                <Text style={styles.loadingText}>Loading system specs...</Text>
              </View>
            ) : systemSpecs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No inverters or microinverters found in any system.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Max Continuous Output</Text>
                {systemSpecs.map((spec) => (
                  <View key={spec.systemNumber} style={styles.specRow}>
                    <Text style={styles.systemLabel}>{spec.systemLabel}:</Text>
                    <Text style={styles.ampsValue}>{spec.maxContinuousOutputAmps} Amps</Text>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    minHeight: 200,
    maxHeight: "70%",
    borderRadius: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF",
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 28,
    color: "#FFF",
    fontWeight: "300",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    color: "#FFF",
    fontSize: 16,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#C6D0E2",
    fontSize: 16,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#C6D0E2",
    marginBottom: 16,
    textAlign: "center",
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  systemLabel: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
  },
  ampsValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FD7332",
  },
});
