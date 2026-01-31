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
import { BLUE_TC_TB } from "../../styles/gradient";

const greenCheck = require("../../assets/Images/icons/check_green.png");
const redX = require("../../assets/Images/icons/X_Icon_Red_BB92011.png");

interface AutoSizeBackupPanelModalProps {
  visible: boolean;
  backupSystemSize: string; // The size they selected (e.g., "100", "200", "30", "60")
  onConfirm: () => void;
  onCancel: () => void;
}

const separatorGutter = 16; // px width gutter between buttons

const AutoSizeBackupPanelModal: React.FC<AutoSizeBackupPanelModalProps> = ({
  visible,
  backupSystemSize,
  onConfirm,
  onCancel,
}) => {
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
            <Text style={styles.title}>Auto-Size Backup Panel</Text>
            <TouchableOpacity
              onPress={onCancel}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Image source={redX} style={styles.xIcon} />
            </TouchableOpacity>
          </View>

          {/* Main Text */}
          <Text style={styles.questionText}>
            Do you want to size the{"\n"}
            Backup Load Sub Panel to{"\n"}
            <Text style={styles.sizeHighlight}>
              {backupSystemSize}A?
            </Text>
          </Text>

          <Text style={styles.subText}>
            This will auto-populate the bus amps,{"\n"}
            main circuit breaker, and select{"\n"}
            equipment from your preferred inventory.
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
};

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
    fontSize: 18,
    letterSpacing: 0.3,
  },
  xIcon: {
    width: 24,
    height: 24,
    tintColor: "#999",
  },
  questionText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    marginVertical: 10,
    textAlign: "center",
    lineHeight: 28,
  },
  sizeHighlight: {
    color: "#FD7332", // Orange highlight for the size
    fontWeight: "bold",
    fontSize: 26,
    letterSpacing: 0.5,
  },
  subText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 18,
    marginTop: 3,
    fontWeight: "400",
    lineHeight: 22,
    opacity: 0.9,
  },
  buttonsRow: {
    flexDirection: "row",
    width: "100%",
    alignItems: "stretch",
    justifyContent: "center",
    marginTop: 8,
    minHeight: 85, // makes the buttons tall for easy tapping
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
    tintColor: "#BB2901",
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

export default AutoSizeBackupPanelModal;
