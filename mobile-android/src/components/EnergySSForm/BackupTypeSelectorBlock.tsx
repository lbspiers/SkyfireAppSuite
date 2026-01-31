import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";

export type BackupType = "Whole Home" | "Partial Home" | "No Backup";

interface Props {
  selected: BackupType | null;
  onChange: (type: BackupType | null) => void;
  checkbox: boolean;
  setCheckbox: (v: boolean) => void;
  debouncedSave: () => void;
}

const BackupTypeSelectorBlock: React.FC<Props> = ({
  selected,
  onChange,
  checkbox,
  setCheckbox,
  debouncedSave,
}) => {
  const options: BackupType[] = ["Whole Home", "Partial Home", "No Backup"];

  const handleSelect = (type: BackupType) => {
    onChange(type);
    setCheckbox(false);
    debouncedSave();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Select Backup Option</Text>
      <View style={styles.buttonGroup}>
        {options.map((type) => {
          const isSelected = selected === type;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.button, isSelected && styles.selectedButton]}
              onPress={() => handleSelect(type)}
            >
              <Text
                style={[
                  styles.buttonText,
                  isSelected && styles.selectedButtonText,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selected !== "No Backup" && (
        <View style={styles.checkboxRow}>
          <TouchableOpacity
            onPress={() => {
              setCheckbox(!checkbox);
              debouncedSave();
            }}
          >
            <Image
              style={styles.checkboxImage}
              source={
                checkbox
                  ? require("../../assets/Images/icons/checked.png")
                  : require("../../assets/Images/icons/checkbox.png")
              }
            />
          </TouchableOpacity>
          <Text style={styles.checkboxLabel}>
            Select if ESS Management System{"\n"}is inverter integrated
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  buttonGroup: {
    gap: 12,
  },
  button: {
    borderColor: "#FFFFFF",
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
  },
  selectedButton: {
    backgroundColor: "#FD7332",
    borderColor: "#FD7332",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "400",
  },
  selectedButtonText: {
    fontWeight: "700",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  checkboxImage: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  checkboxLabel: {
    color: "#FFFFFF",
    fontSize: 13,
  },
});

export default BackupTypeSelectorBlock;
