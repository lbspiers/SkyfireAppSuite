import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { moderateScale } from "../../utils/responsive";
import { BLUE_MD_TB } from "../../styles/gradient";
import SubPanelBSection from "../../screens/Project/electrical/sections/SubPanelBSection";
import { saveSubPanelB } from "../../screens/Project/electrical/services/electricalPersistence";
import { logger } from "../../utils/logger";
import Button from "../Button";
import Toast from "react-native-toast-message";

const { height: screenHeight } = Dimensions.get("window");

interface SubPanelBModalProps {
  visible: boolean;
  onClose: () => void;
  projectId: string;
  companyId: string;
  initialData?: {
    type: "new" | "existing" | null;
    busAmps: string;
    mainBreakerAmps: string;
    feederLocation: string;
    derated?: boolean | null;
    upstreamBreakerAmps?: string;
    tieInLocation?: string;
  };
  onSave?: () => void; // Called after successful save
}

const SubPanelBModal: React.FC<SubPanelBModalProps> = ({
  visible,
  onClose,
  projectId,
  companyId,
  initialData,
  onSave,
}) => {
  // Local state for Sub Panel B fields
  const [type, setType] = useState<"new" | "existing" | null>(initialData?.type || null);
  const [busAmps, setBusAmps] = useState<string>(initialData?.busAmps || "");
  const [mainBreakerAmps, setMainBreakerAmps] = useState<string>(initialData?.mainBreakerAmps || "");
  const [feederLocation, setFeederLocation] = useState<string>(initialData?.feederLocation || "");
  const [derated, setDerated] = useState<boolean | null>(initialData?.derated || null);
  const [upstreamBreakerAmps, setUpstreamBreakerAmps] = useState<string>(initialData?.upstreamBreakerAmps || "");
  const [tieInLocation, setTieInLocation] = useState<string>(initialData?.tieInLocation || "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{
    busAmps?: string;
    mainBreaker?: string;
    feederLocation?: string;
  }>({});

  // Update local state when initialData changes
  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setBusAmps(initialData.busAmps);
      setMainBreakerAmps(initialData.mainBreakerAmps);
      setFeederLocation(initialData.feederLocation);
      setDerated(initialData.derated || null);
      setUpstreamBreakerAmps(initialData.upstreamBreakerAmps || "");
    }
  }, [initialData]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setErrors({});
    }
  }, [visible]);

  const validateFields = (): boolean => {
    const newErrors: typeof errors = {};

    if (!busAmps) {
      newErrors.busAmps = "Bus amps is required";
    }

    if (!mainBreakerAmps) {
      newErrors.mainBreaker = "Main breaker rating is required";
    }

    if (!feederLocation) {
      newErrors.feederLocation = "Feeder location is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateFields()) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please fill in all required fields",
        position: "bottom",
        visibilityTime: 3000,
      });
      return;
    }

    setSaving(true);
    try {
      await saveSubPanelB(projectId, {
        type,
        busAmps,
        mainBreakerAmps,
        feederLocation,
        derated,
        upstreamBreakerAmps,
      });

      logger.info("[SubPanelBModal] Sub Panel B data saved successfully");

      Toast.show({
        type: "success",
        text1: "Sub Panel B Added",
        text2: "Sub Panel B information has been saved",
        position: "bottom",
        visibilityTime: 2000,
      });

      onSave?.();
      onClose();
    } catch (error) {
      logger.error("[SubPanelBModal] Error saving Sub Panel B data:", error);
      Toast.show({
        type: "error",
        text1: "Save Failed",
        text2: "Could not save Sub Panel B information",
        position: "bottom",
        visibilityTime: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setType(null);
    setBusAmps("");
    setMainBreakerAmps("");
    setFeederLocation("");
    setDerated(null);
    setUpstreamBreakerAmps("");
    setErrors({});
  };

  const handleCancel = () => {
    // Don't clear fields on cancel - user might want to come back
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleCancel}
        />
        <View style={styles.modalContainer}>
          <LinearGradient {...BLUE_MD_TB} style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>Sub Panel B Required</Text>
                <Text style={styles.subtitle}>
                  Please provide Sub Panel B information to continue
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCancel}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Sub Panel B Section - Scrollable */}
            <ScrollView
              style={styles.contentScroll}
              showsVerticalScrollIndicator={false}
            >
              <SubPanelBSection
                type={type}
                onTypeChange={setType}
                busAmps={busAmps}
                onBusAmpsChange={setBusAmps}
                mainBreakerAmps={mainBreakerAmps}
                onMainBreakerChange={setMainBreakerAmps}
                feederLocation={feederLocation}
                onFeederLocationChange={setFeederLocation}
                derated={derated}
                onDerateChange={setDerated}
                errors={errors}
                onClose={handleClear}
                projectId={projectId}
                companyId={companyId}
                hideCollapsible={true}
              />
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                selected={false}
                onPress={handleCancel}
                width="48%"
                height={moderateScale(48)}
                rounded={moderateScale(8)}
                textStyle={styles.buttonText}
                disabled={saving}
              />
              <Button
                title={saving ? "Saving..." : "Save & Continue"}
                selected={true}
                onPress={handleSave}
                width="48%"
                height={moderateScale(48)}
                rounded={moderateScale(8)}
                textStyle={styles.buttonText}
                disabled={saving}
              />
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContainer: {
    width: "95%",
    maxWidth: moderateScale(600),
    maxHeight: screenHeight * 0.9,
    borderRadius: moderateScale(12),
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalContent: {
    height: "100%",
    padding: moderateScale(20),
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: moderateScale(16),
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: moderateScale(12),
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: "700",
    color: "#FD7332",
    marginBottom: moderateScale(4),
  },
  subtitle: {
    fontSize: moderateScale(14),
    fontWeight: "400",
    color: "#E5E7EB",
    lineHeight: moderateScale(18),
  },
  closeButton: {
    fontSize: moderateScale(32),
    color: "#FFFFFF",
    fontWeight: "300",
    lineHeight: moderateScale(32),
  },
  contentScroll: {
    flex: 1,
    marginBottom: moderateScale(16),
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: moderateScale(12),
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  buttonText: {
    fontSize: moderateScale(16),
    fontWeight: "700",
  },
});

export default SubPanelBModal;
