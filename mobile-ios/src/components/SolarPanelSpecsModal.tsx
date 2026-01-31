// src/components/SolarPanelSpecsModal.tsx
import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { BLUE_TC_TB, ORANGE_TB } from "../styles/gradient";
import { getSolarPanelById, getSolarPanelByMakeModel } from "../api/solarPanel.service";
import { SolarPanel } from "../types/solarEquipment";
import { moderateScale, verticalScale } from "../utils/responsive";

const redX = require("../assets/Images/icons/X_Icon_Red_BB92011.png");

interface SolarPanelSpecsModalProps {
  visible: boolean;
  panelId?: number | null;
  manufacturer?: string;
  modelNumber?: string;
  onClose: () => void;
}

const SolarPanelSpecsModal: React.FC<SolarPanelSpecsModalProps> = ({
  visible,
  panelId,
  manufacturer,
  modelNumber,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panelData, setPanelData] = useState<SolarPanel | null>(null);

  useEffect(() => {
    if (visible && (panelId || (manufacturer && modelNumber))) {
      // console.log('[SolarPanelSpecsModal] Modal opened with:', { panelId, manufacturer, modelNumber });
      loadPanelSpecs();
    } else if (visible) {
      // console.log('[SolarPanelSpecsModal] Modal opened but no identifier:', { panelId, manufacturer, modelNumber });
    }
  }, [visible, panelId, manufacturer, modelNumber]);

  const loadPanelSpecs = async () => {
    // console.log('[SolarPanelSpecsModal] Fetching specs...');
    setLoading(true);
    setError(null);

    try {
      let response;

      // Try to fetch by ID first if available
      if (panelId) {
        // console.log('[SolarPanelSpecsModal] Fetching by panel ID:', panelId);
        response = await getSolarPanelById(panelId);
      }
      // Otherwise fetch by make/model
      else if (manufacturer && modelNumber) {
        // console.log('[SolarPanelSpecsModal] Fetching by make/model:', { manufacturer, modelNumber });
        response = await getSolarPanelByMakeModel(manufacturer, modelNumber);
      } else {
        console.error('[SolarPanelSpecsModal] No panel identifier provided');
        throw new Error('No panel identifier provided');
      }

      // console.log('[SolarPanelSpecsModal] API Response:', response);
      // console.log('[SolarPanelSpecsModal] Response status:', response?.status);
      // console.log('[SolarPanelSpecsModal] Response data:', response?.data);
      // console.log('[SolarPanelSpecsModal] Response data.success:', response?.data?.success);
      // console.log('[SolarPanelSpecsModal] Response data.data:', response?.data?.data);

      if (response?.status === 200 && response?.data?.success) {
        const panelData = response.data.data;
        // console.log('[SolarPanelSpecsModal] ✅ Panel data to display:', panelData);
        // console.log('[SolarPanelSpecsModal] Panel manufacturer:', panelData?.manufacturer);
        // console.log('[SolarPanelSpecsModal] Panel model_number:', panelData?.model_number);
        // console.log('[SolarPanelSpecsModal] Panel integrated_ac:', panelData?.integrated_ac);
        // console.log('[SolarPanelSpecsModal] Panel nameplate_pmax:', panelData?.nameplate_pmax);
        // console.log('[SolarPanelSpecsModal] Setting panelData state...');
        setPanelData(panelData);
        // console.log('[SolarPanelSpecsModal] ✅ panelData state has been set');
      } else {
        console.error('[SolarPanelSpecsModal] API response not successful:', response);
        setError("Failed to load panel specifications");
      }
    } catch (err) {
      console.error('[SolarPanelSpecsModal] Error loading panel specs:', err);
      setError("An error occurred while loading specifications");
    } finally {
      setLoading(false);
    }
  };

  const feetToMeters = (feet?: string): string => {
    if (!feet) return "N/A";
    const feetNum = parseFloat(feet);
    if (isNaN(feetNum)) return "N/A";
    return (feetNum * 0.3048).toFixed(2);
  };

  const lbsToKg = (lbs?: string): string => {
    if (!lbs) return "N/A";
    const lbsNum = parseFloat(lbs);
    if (isNaN(lbsNum)) return "N/A";
    return (lbsNum * 0.453592).toFixed(1);
  };

  const formatValue = (value?: number | string | boolean | null, suffix = ""): string => {
    if (value === undefined || value === null) return "N/A";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return `${value}${suffix}`;
  };

  const formatPower = (watts?: string): string => {
    if (!watts) return "N/A";
    const wattsNum = parseFloat(watts);
    if (isNaN(wattsNum)) return "N/A";
    const kw = (wattsNum / 1000).toFixed(2);
    return `${watts} W (${kw} kW)`;
  };

  const renderSpecRow = (label: string, value: string, highlight = false) => {
    // console.log('[SolarPanelSpecsModal] 📝 renderSpecRow:', label, value);
    return (
      <View style={styles.specRow} key={label}>
        <Text style={styles.specLabel}>{label}:</Text>
        <Text style={[styles.specValue, highlight && styles.highlightValue]}>
          {value}
        </Text>
      </View>
    );
  };

  const renderSection = (title: string, children: React.ReactNode) => {
    // console.log('[SolarPanelSpecsModal] 📦 renderSection:', title);
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
      </View>
    );
  };

  // console.log('[SolarPanelSpecsModal] 🔄 RENDER - State:', { loading, error: !!error, hasPanelData: !!panelData, visible });

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <LinearGradient {...BLUE_TC_TB} style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Panel Specifications</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Image source={redX} style={styles.closeIcon} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFB02E" />
              <Text style={styles.loadingText}>Loading specifications...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : panelData ? (
            <View style={styles.contentContainer}>
              {/* console.log('[SolarPanelSpecsModal] 🎨 Rendering panel data:', panelData) */}
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
              >
              {/* Panel Info */}
              <View style={styles.panelInfo}>
                <Text style={styles.manufacturer}>{panelData.manufacturer}</Text>
                <Text style={styles.modelNumber}>{panelData.model_number}</Text>
                {(panelData.integrated_ac === true || panelData.model_number?.includes('/AC')) && (
                  <View style={styles.acBadge}>
                    <Text style={styles.acBadgeText}>AC INTEGRATED</Text>
                  </View>
                )}
              </View>

              {/* Power Specifications */}
              {renderSection(
                "Power Specifications",
                <>
                  {renderSpecRow("Nameplate Power (Pmax)", formatPower(panelData.nameplate_pmax), true)}
                  {renderSpecRow("PTC Rating", formatValue(panelData.ptc, " W"))}
                </>
              )}

              {/* Electrical Characteristics */}
              {renderSection(
                "Electrical Characteristics",
                <>
                  {renderSpecRow("Open Circuit Voltage (Voc)", formatValue(panelData.nameplate_voc, " V"))}
                  {renderSpecRow("Short Circuit Current (Isc)", formatValue(panelData.nameplate_isc, " A"))}
                  {renderSpecRow("Max Power Voltage (Vmp)", formatValue(panelData.nameplate_vpmax, " V"))}
                  {renderSpecRow("Max Power Current (Imp)", formatValue(panelData.nameplate_ipmax, " A"))}
                  {renderSpecRow("Cells in Series", formatValue(panelData.n_s))}
                </>
              )}

              {/* Physical Dimensions */}
              {renderSection(
                "Physical Dimensions",
                <>
                  {renderSpecRow("Length", `${formatValue(panelData.long_ft, " ft")} (${feetToMeters(panelData.long_ft)} m)`)}
                  {renderSpecRow("Width", `${formatValue(panelData.short_ft, " ft")} (${feetToMeters(panelData.short_ft)} m)`)}
                  {renderSpecRow("Weight", `${formatValue(panelData.weight_lbs, " lbs")} (${lbsToKg(panelData.weight_lbs)} kg)`)}
                </>
              )}

              {/* Temperature Characteristics */}
              {renderSection(
                "Temperature Characteristics",
                <>
                  {renderSpecRow("NOCT", formatValue(panelData.average_noct, " °C"))}
                </>
              )}

              {panelData.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.description}>{panelData.description}</Text>
                </View>
              )}
              </ScrollView>
            </View>
          ) : null}

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <LinearGradient {...ORANGE_TB} style={styles.closeButtonGradient}>
              <Text style={styles.closeButtonText}>Close</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  container: {
    width: "90%",
    maxWidth: 500,
    maxHeight: "85%",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  closeIcon: {
    width: 20,
    height: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    textAlign: "center",
  },
  contentContainer: {
    flex: 1,
    minHeight: 200,
  },
  scrollView: {
    flex: 1,
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  panelInfo: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  manufacturer: {
    color: "#FD7332",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  modelNumber: {
    color: "#FFFFFF",
    fontSize: 18,
  },
  acBadge: {
    backgroundColor: "#FD7332",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  acBadgeText: {
    color: "#0C1F3F",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#FD7332",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  specLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    flex: 1,
  },
  specValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
  highlightValue: {
    color: "#FD7332",
    fontWeight: "bold",
    fontSize: 16,
  },
  description: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    width: "100%",
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    marginTop: 8,
  },
  closeButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default SolarPanelSpecsModal;
