// src/components/Modals/BOSRequiredEquipmentModal.tsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { BLUE_TC_TB } from "../../styles/gradient";
import { moderateScale, verticalScale, fontSize } from "../../utils/responsive";
import Button from "../Button";

interface BOSRequiredEquipmentModalProps {
  visible: boolean;
  utilityName: string;
  requiredEquipment: string[]; // Array of utility-specific equipment names
  onYes: (selectedIndices: number[]) => void; // Pass selected indices
  onNo: () => void;
  onAskLater: () => void;
}

export default function BOSRequiredEquipmentModal({
  visible,
  utilityName,
  requiredEquipment,
  onYes,
  onNo,
  onAskLater,
}: BOSRequiredEquipmentModalProps) {
  // Track which equipment items are checked (default all checked)
  const [checkedItems, setCheckedItems] = useState<boolean[]>([]);

  // Initialize all items as checked when modal becomes visible or equipment changes
  useEffect(() => {
    if (visible && requiredEquipment.length > 0) {
      setCheckedItems(requiredEquipment.map(() => true));
    }
  }, [visible, requiredEquipment]);

  // Toggle checkbox for specific item
  const toggleCheckbox = (index: number) => {
    setCheckedItems(prev => {
      const newChecked = [...prev];
      newChecked[index] = !newChecked[index];
      return newChecked;
    });
  };

  // Count checked items
  const checkedCount = checkedItems.filter(checked => checked).length;

  // Handle Yes click - only pass selected equipment indices
  const handleYes = () => {
    const selectedIndices = checkedItems
      .map((checked, index) => checked ? index : -1)
      .filter(index => index !== -1);
    onYes(selectedIndices);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onAskLater}
    >
      <View style={styles.overlay}>
        <View style={styles.borderContainer}>
          <LinearGradient
            {...BLUE_TC_TB}
            style={styles.modalContainer}
          >
            {/* Title */}
            <Text style={styles.title}>{utilityName} Required Equipment</Text>

            {/* Instruction */}
            <Text style={styles.instructionText}>(Tap to uncheck if not needed)</Text>

            {/* Equipment List with Checkboxes */}
            <View style={styles.equipmentList}>
              {requiredEquipment.map((equipment, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.equipmentRow}
                  onPress={() => toggleCheckbox(index)}
                  activeOpacity={0.7}
                >
                  {/* Bullet */}
                  <Text style={styles.bullet}>•</Text>
                  {/* Equipment Text */}
                  <Text style={styles.equipmentText}>{equipment}</Text>
                  {/* Checkbox on Right */}
                  <View style={styles.checkbox}>
                    {checkedItems[index] && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Question with dynamic count */}
            <Text style={styles.questionText}>
              Add {checkedCount === requiredEquipment.length ? 'these' : 'the selected'} {checkedCount} {checkedCount === 1 ? 'piece' : 'pieces'} of BOS Equipment Pre-Combine?
            </Text>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              <Button
                title="Yes"
                onPress={handleYes}
                width="30%"
                height={44}
                rounded={24}
                style={styles.button}
                textStyle={styles.buttonText}
                disabled={checkedCount === 0}
              />
              <Button
                title="No"
                onPress={onNo}
                width="30%"
                height={44}
                rounded={24}
                style={styles.button}
                textStyle={styles.buttonText}
              />
              <Button
                title="Ask Me Later"
                onPress={onAskLater}
                width="30%"
                height={44}
                rounded={24}
                style={styles.button}
                textStyle={styles.buttonText}
              />
            </View>
          </LinearGradient>
        </View>
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
    paddingHorizontal: moderateScale(20),
  },
  borderContainer: {
    width: "100%",
    maxWidth: moderateScale(400),
    borderRadius: moderateScale(24),
    borderWidth: moderateScale(2),
    borderColor: "#888888",
    overflow: "hidden",
  },
  modalContainer: {
    width: "100%",
    borderRadius: moderateScale(22),
    padding: moderateScale(20),
  },
  title: {
    color: "#FD7332",
    fontSize: fontSize(24),
    fontWeight: "700",
    textAlign: "center",
    marginBottom: verticalScale(8),
    fontFamily: "Lato-Bold",
  },
  instructionText: {
    color: "#CCCCCC",
    fontSize: fontSize(13),
    textAlign: "center",
    marginBottom: verticalScale(16),
    fontFamily: "Lato-Regular",
    fontStyle: "italic",
  },
  equipmentList: {
    alignSelf: "stretch",
    paddingLeft: moderateScale(20),
    marginBottom: verticalScale(16),
  },
  equipmentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(10),
  },
  bullet: {
    color: "#FD7332",
    fontSize: fontSize(20),
    marginRight: moderateScale(12),
    lineHeight: fontSize(20),
  },
  equipmentText: {
    color: "#FFF",
    fontSize: fontSize(16),
    flex: 1,
    fontFamily: "Lato-Regular",
  },
  checkbox: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: moderateScale(2),
    borderColor: "#FD7332",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    marginLeft: moderateScale(8),
  },
  checkmark: {
    color: "#FD7332",
    fontSize: fontSize(20),
    fontWeight: "700",
    lineHeight: fontSize(20),
    marginTop: moderateScale(-2),
  },
  questionText: {
    color: "#FFF",
    fontSize: fontSize(18),
    textAlign: "center",
    marginBottom: verticalScale(20),
    fontFamily: "Lato-Regular",
    fontWeight: "700",
  },
  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(10),
    marginBottom: verticalScale(10),
  },
  button: {
    flex: 1,
  },
  buttonText: {
    fontSize: fontSize(14),
    fontWeight: "700",
    fontFamily: "Lato-Bold",
  },
});
