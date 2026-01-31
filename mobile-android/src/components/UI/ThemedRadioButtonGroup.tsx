import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../../theme/tokens/tokens";

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
    borderRadius: radius.md,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.bgInputHover,
    marginRight: spacing.tight,
  },
  selectedOption: {
    backgroundColor: colors.primary,
  },
  text: { color: colors.textSecondary },
  selectedText: { color: colors.white, fontWeight: "700" },
});

export default ThemedRadioButtonGroup;
