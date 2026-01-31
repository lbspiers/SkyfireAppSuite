import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

interface Props {
  options: number[];
  selected: number;
  onSelect: (val: number) => void;
  containerStyle?: object;
}

const ThemedRadioButtonGroup: React.FC<Props> = ({
  options,
  selected,
  onSelect,
  containerStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.option, selected === opt && styles.selectedOption]}
          onPress={() => onSelect(opt)}
        >
          <Text style={[styles.text, selected === opt && styles.selectedText]}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: "row" },
  option: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#2E4161",
    marginRight: 8,
  },
  selectedOption: {
    backgroundColor: "#FD7332",
  },
  text: { color: "#ccc" },
  selectedText: { color: "#fff", fontWeight: "700" },
});

export default ThemedRadioButtonGroup;
