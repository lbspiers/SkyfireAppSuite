import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

type Props = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

const RadioButtonGroup: React.FC<Props> = ({
  label,
  options,
  value,
  onChange,
}) => {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: "#fff", fontWeight: "600", marginBottom: 8 }}>
        {label}
      </Text>
      {options.map((option: string) => (
        <TouchableOpacity
          key={option}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 10,
          }}
          onPress={() => onChange(option)}
        >
          <View
            style={{
              height: 20,
              width: 20,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
            }}
          >
            {value === option && (
              <View
                style={{
                  height: 10,
                  width: 10,
                  borderRadius: 5,
                  backgroundColor: "#FD7332",
                }}
              />
            )}
          </View>
          <Text style={{ color: "#fff" }}>{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default RadioButtonGroup;
