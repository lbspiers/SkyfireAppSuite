import React, { useCallback, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  GestureResponderEvent,
  Image,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Button from "../Button"; // adjust if your alias/path differs
import { BLUE_2C_BT } from "../../styles/gradient";

const RocketIcon = require("../../assets/Images/icons/Rocket_Cloud_Orange_FD7332.png");

type Kind = "success" | "error" | "sending";

interface Props {
  visible: boolean;
  kind: Kind;
  title?: string;
  message?: string;
  onPrimary?: () => void; // parent handles navigation
  primaryLabel?: string; // default depends on kind
  details?: string; // raw logs (optional)
  canSeeDetails?: boolean; // only show when true (e.g., logan@skyfiresd.com)
}

const GenerateStatusModal: React.FC<Props> = ({
  visible,
  kind,
  title,
  message,
  onPrimary,
  primaryLabel,
  details,
  canSeeDetails = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const isSuccess = kind === "success";
  const isError = kind === "error";
  const isSending = kind === "sending";

  const resolvedTitle =
    title ??
    (isSending
      ? "Submitting…"
      : isSuccess
      ? "Request Sent"
      : "Something went wrong");

  const resolvedMessage =
    message ??
    (isSending
      ? "We’re submitting your request. This usually takes a moment."
      : isSuccess
      ? "We’re generating your documents for this project. You’ll get a notification when they’re ready."
      : "We couldn’t start the automation. Please try again.");

  const buttonLabel =
    primaryLabel ?? (isSending ? "Close" : isSuccess ? "Done" : "Close");

  // ✅ Match Button's onPress signature
  const handlePrimaryPress = useCallback(
    (_e?: GestureResponderEvent) => {
      if (onPrimary) onPrimary();
    },
    [onPrimary]
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <LinearGradient {...BLUE_2C_BT} style={styles.borderWrap}>
          <View style={styles.card}>
            {/* Icon / Loader */}
            <View style={styles.iconWrap}>
              {isSending ? (
                <ActivityIndicator size="large" color="#FD7332" />
              ) : isSuccess ? (
                <Image
                  source={RocketIcon}
                  style={styles.rocketIcon}
                  resizeMode="contain"
                />
              ) : (
                <Text style={[styles.icon, styles.err]}>!</Text>
              )}
            </View>

            {/* Content */}
            <Text style={styles.title}>{resolvedTitle}</Text>
            <Text style={styles.msg}>{resolvedMessage}</Text>

            {/* Optional technical details (only if canSeeDetails) */}
            {canSeeDetails && !!details && (
              <>
                <Text
                  onPress={() => setShowDetails((v) => !v)}
                  style={styles.detailsToggle}
                >
                  {showDetails
                    ? "Hide technical details"
                    : "Show technical details"}
                </Text>
                {showDetails && (
                  <View style={styles.detailsBox}>
                    <ScrollView>
                      <Text style={styles.detailsText}>{details}</Text>
                    </ScrollView>
                  </View>
                )}
              </>
            )}

            {/* Primary action */}
            <View style={styles.actions}>
              {/* If your Button expects `title` instead of `label`, switch it */}
              <Button onPress={handlePrimaryPress} label={buttonLabel} />
            </View>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.46)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  borderWrap: {
    padding: 3,
    borderRadius: 16,
    width: "92%",
    maxWidth: 560,
  },
  card: {
    backgroundColor: "#1B2533",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
  },
  iconWrap: { marginTop: 12, marginBottom: 16 },
  icon: { fontSize: 38, fontWeight: "900" },
  rocketIcon: {
    width: 90,
    height: 90,
    transform: [{ rotate: "-45deg" }],
  },
  ok: { color: "#20E39D" },
  err: { color: "#FF7D7D" },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    marginTop: 2,
    textAlign: "center",
  },
  msg: {
    marginTop: 6,
    fontSize: 15,
    color: "rgba(255,255,255,0.88)",
    textAlign: "center",
  },
  detailsToggle: {
    marginTop: 12,
    color: "#FD7332",
    fontWeight: "700",
    fontSize: 13,
  },
  detailsBox: {
    marginTop: 10,
    maxHeight: 180,
    width: "100%",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#0E1621",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  detailsText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
  },
  actions: { marginTop: 16, width: "100%", alignItems: "center" },
});

export default GenerateStatusModal;
