import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { BLUE_TC_TB, BLUE_2C_BT } from "../../styles/gradient";

const redX = require("../../assets/Images/icons/X_Icon_Red_BB92011.png");
const greenCheck = require("../../assets/Images/icons/check_green.png");

const separatorGutter = 16;

type Props = {
  visible: boolean;
  currentSystem: "microinverter" | "inverter" | "";
  newSystem: "microinverter" | "inverter";
  onConfirm: () => void;
  onCancel: () => void;
};

const getSystemLabel = (system: "microinverter" | "inverter" | "") => {
  if (!system) return "None";
  return system === "microinverter" ? "Microinverter" : "Inverter";
};

export default function SystemSwitchConfirmModal({
  visible,
  currentSystem,
  newSystem,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <LinearGradient
          {...BLUE_TC_TB}
          style={styles.container}
        >
          {/* Header Row */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>Confirm System Change</Text>
            <TouchableOpacity
              onPress={onCancel}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Image source={redX} style={styles.xIcon} />
            </TouchableOpacity>
          </View>
          {/* Main Text */}
          <Text style={styles.warningText}>
            ARE YOU SURE{"\n"}YOU WANT TO SWITCH FROM{"\n"}
            <Text style={styles.systemHighlight}>
              {getSystemLabel(currentSystem).toUpperCase()}
            </Text>
            {" TO "}
            <Text style={styles.systemHighlight}>
              {getSystemLabel(newSystem).toUpperCase()}?
            </Text>
          </Text>
          <Text style={styles.subText}>
            This will clear all current system{"\n"}data and cannot be undone.
          </Text>

          {/* Yes/No BIG HIT AREA BUTTONS */}
          <View style={styles.buttonsRow}>
            {/* YES BUTTON, covers left half */}
            <TouchableOpacity
              style={styles.yesBtnArea}
              activeOpacity={0.75}
              onPress={onConfirm}
            >
              <View style={styles.btnContent}>
                <Image source={greenCheck} style={styles.btnIcon} />
                <Text style={styles.yesNoText}>YES</Text>
              </View>
            </TouchableOpacity>

            {/* Gutter/Separator */}
            <View
              style={{
                width: separatorGutter,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View style={styles.separator} />
            </View>

            {/* NO BUTTON, covers right half */}
            <TouchableOpacity
              style={styles.noBtnArea}
              activeOpacity={0.75}
              onPress={onCancel}
            >
              <View style={styles.btnContent}>
                <Image source={redX} style={[styles.btnIcon, styles.greyIcon]} />
                <Text style={[styles.yesNoText, styles.greyText]}>NO</Text>
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(12,31,63,0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: 320,
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20,
    letterSpacing: 0.3,
  },
  xIcon: {
    width: 24,
    height: 24,
    tintColor: undefined,
  },
  warningText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 10,
    textAlign: "center",
  },
  systemHighlight: {
    color: "#fff",
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  subText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 18,
    marginTop: 3,
    fontWeight: "400",
  },
  buttonsRow: {
    flexDirection: "row",
    width: "100%",
    alignItems: "stretch",
    justifyContent: "center",
    marginTop: 8,
    minHeight: 85,
  },
  yesBtnArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderTopLeftRadius: 20,
  },
  noBtnArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderBottomRightRadius: 20,
    borderTopRightRadius: 20,
  },
  noBtnGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderBottomRightRadius: 20,
    borderTopRightRadius: 20,
  },
  btnContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  btnIcon: {
    width: 38,
    height: 38,
    marginBottom: 3,
    resizeMode: "contain",
  },
  yesNoText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 24,
    letterSpacing: 1.2,
  },
  greyText: {
    color: "#999",
  },
  greyIcon: {
    tintColor: "#999",
  },
  separator: {
    width: 2,
    height: 54,
    backgroundColor: "#fff",
    opacity: 0.5,
    alignSelf: "center",
    borderRadius: 2,
  },
});