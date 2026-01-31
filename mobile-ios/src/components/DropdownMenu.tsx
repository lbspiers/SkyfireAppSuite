// src/components/DropdownMenu.tsx
import React, { useState } from "react";
import {
  Modal,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  FlatList,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";

const STATUS_OPTIONS = [
  "Survey",
  "Design",
  "Revision",
  "Permit",
  "Installed",
  "Canceled",
];

interface DropdownProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
}

const DropdownMenu: React.FC<DropdownProps> = ({
  selectedValue,
  onValueChange,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleDropdown = () => setIsVisible(!isVisible);

  const handleSelect = (value: string) => {
    onValueChange(value);
    setIsVisible(false);
  };

  return (
    <>
      <TouchableOpacity onPress={toggleDropdown}>
        <LinearGradient
          colors={["#FFD700", "#FF8C00"]}
          style={styles.dropdownHeader}
        >
          <Text style={styles.dropdownHeaderText}>{selectedValue}</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={isVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={toggleDropdown}
        >
          <View style={styles.modalContainer}>
            <FlatList
              data={STATUS_OPTIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  style={styles.option}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  dropdownHeader: {
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "center",
    marginBottom: 10,
  },
  dropdownHeaderText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "#00000066",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    maxHeight: 250,
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
});

export default DropdownMenu;
