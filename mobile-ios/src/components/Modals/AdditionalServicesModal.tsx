import React from "react";
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Text from "../Text";
import Checkbox from "../Checkbox";
import Button from "../Button";
import { useResponsive } from "../../utils/responsive";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface AdditionalServices {
  structuralPEStamps: boolean;
  electricalPEStamps: boolean;
  buildPermitSubmission: boolean;
  interconnectionPermitSubmission: boolean;
}

interface AdditionalServicesModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (services: AdditionalServices) => void;
  initialServices: AdditionalServices;
  loading?: boolean;
  disabled?: boolean;
}

const AdditionalServicesModal: React.FC<AdditionalServicesModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  initialServices,
  loading = false,
  disabled = false,
}) => {
  const { moderateScale, verticalScale, font } = useResponsive();
  const [services, setServices] = React.useState<AdditionalServices>(initialServices);

  // Update local state when initial services change
  React.useEffect(() => {
    setServices(initialServices);
  }, [initialServices]);

  const handleToggle = (key: keyof AdditionalServices) => {
    setServices((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleConfirm = () => {
    onConfirm(services);
  };

  const styles = getStyles({ moderateScale, verticalScale, font });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={["#2E4161", "#1a2d47", "#0C1F3F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradient}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Additional Services</Text>
                <Text style={styles.subtitle}>
                  Select any additional services you'd like to include with your
                  project:
                </Text>
              </View>

              {/* Checkboxes */}
              <View style={styles.checkboxContainer}>
                <Checkbox
                  checked={services.structuralPEStamps}
                  onToggle={() => handleToggle("structuralPEStamps")}
                  label="Structural PE Stamps"
                  disabled={disabled || loading}
                />
                <Checkbox
                  checked={services.electricalPEStamps}
                  onToggle={() => handleToggle("electricalPEStamps")}
                  label="Electrical PE Stamps"
                  disabled={disabled || loading}
                />
                <Checkbox
                  checked={services.buildPermitSubmission}
                  onToggle={() => handleToggle("buildPermitSubmission")}
                  label="Build Permit Submission"
                  disabled={disabled || loading}
                />
                <Checkbox
                  checked={services.interconnectionPermitSubmission}
                  onToggle={() => handleToggle("interconnectionPermitSubmission")}
                  label="Interconnection Permit Submission"
                  disabled={disabled || loading}
                />
              </View>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <Button
                  title="Cancel"
                  onPress={onCancel}
                  width="48%"
                  height={48}
                  selected={false}
                  disabled={loading}
                />
                <Button
                  title={loading ? "Processing..." : "Continue"}
                  onPress={handleConfirm}
                  width="48%"
                  height={48}
                  selected={true}
                  disabled={loading}
                />
              </View>
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

export default AdditionalServicesModal;

const getStyles = ({
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
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      width: Math.min(SCREEN_WIDTH * 0.9, moderateScale(500)),
      maxHeight: SCREEN_HEIGHT * 0.8,
      borderRadius: moderateScale(12),
      overflow: "hidden",
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    gradient: {
      width: "100%",
      height: "100%",
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: moderateScale(24),
    },
    header: {
      marginBottom: verticalScale(20),
    },
    title: {
      color: "#FFFFFF",
      fontSize: font(24),
      fontWeight: "700",
      marginBottom: verticalScale(8),
      textAlign: "center",
    },
    subtitle: {
      color: "rgba(255, 255, 255, 0.7)",
      fontSize: font(14),
      lineHeight: font(20),
      textAlign: "center",
    },
    checkboxContainer: {
      paddingLeft: moderateScale(4),
      marginBottom: verticalScale(24),
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: verticalScale(8),
    },
  });
