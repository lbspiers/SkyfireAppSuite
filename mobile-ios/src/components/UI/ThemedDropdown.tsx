import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import LinearGradient from "react-native-linear-gradient";
import { moderateScale, verticalScale } from "../../utils/responsive";

interface DropdownItem {
  label: string;
  value: string;
  disabled?: boolean;
}

interface ThemedDropdownProps {
  label: string;
  data: (DropdownItem | string)[];
  value: string;
  onChangeValue: (value: string) => void;
  error?: string;
  placeholder?: string;
  placeholderColor?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  loading?: boolean;
  disabled?: boolean;
}

const BLUE_GRADIENT = ["#0C1F3F", "#2E4161"];
const ORANGE = "#FD7332";
const BORDER_GREY = "#445066";

const ThemedDropdown: React.FC<ThemedDropdownProps> = ({
  label,
  data,
  value,
  onChangeValue,
  error,
  placeholder,
  placeholderColor = "#AAAAAA",
  containerStyle,
  labelStyle,
  loading = false,
  disabled = false,
}) => {
  const [formattedData, setFormattedData] = useState<DropdownItem[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>(value);

  useEffect(() => {
    if (data && data.length > 0) {
      const clean = (data as any[]).map((item) =>
        typeof item === "string"
          ? { label: item.trim(), value: item.trim() }
          : { label: item.label.trim(), value: item.value.trim() }
      );
      // dedupe + sort
      const unique = clean.filter(
        (item, idx) =>
          idx ===
          clean.findIndex(
            (t) => t.label.toLowerCase() === item.label.toLowerCase()
          )
      );
      unique.sort((a, b) => a.label.localeCompare(b.label));
      setFormattedData(unique);
    } else {
      setFormattedData([
        { label: "None Found", value: "none", disabled: true },
      ]);
    }
  }, [data]);

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  return (
    <View style={[styles.container, containerStyle]}>
      {label.length > 0 && (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      )}

      {loading ? (
        <View style={[styles.loadingContainer]}>
          <ActivityIndicator size="small" color={ORANGE} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <LinearGradient
          colors={BLUE_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.inputGradient, disabled && styles.disabledInput]}
        >
          <Dropdown
            style={styles.dropdown}
            containerStyle={styles.dropdownList}
            placeholderStyle={[
              styles.placeholderStyle,
              { color: placeholderColor },
            ]}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={formattedData}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={placeholder || `Select ${label}`}
            value={selectedValue}
            disabled={disabled}
            onChange={(item: DropdownItem) => {
              if (!item.disabled && !disabled) {
                setSelectedValue(item.value);
                onChangeValue(item.value);
              }
            }}
            renderItem={(item, isSelected) => (
              <View
                style={[
                  styles.itemContainerStyle,
                  isSelected && !item.disabled && styles.selectedItemBackground,
                ]}
              >
                <Text
                  style={[
                    styles.itemTextStyle,
                    item.disabled && styles.disabledTextStyle,
                    isSelected && !item.disabled && styles.selectedItemText,
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            )}
          />
        </LinearGradient>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: verticalScale(8),
  },
  label: {
    fontSize: moderateScale(16),
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: verticalScale(4),
  },
  inputGradient: {
    borderRadius: moderateScale(8),
    borderBottomWidth: moderateScale(2),
    borderBottomColor: ORANGE,
    paddingHorizontal: moderateScale(8),
  },
  disabledInput: {
    opacity: 0.6,
  },
  dropdown: {
    backgroundColor: "transparent",
    height: verticalScale(32),
  },
  dropdownList: {
    backgroundColor: "#2E4161",
    borderWidth: moderateScale(1),
    borderColor: BORDER_GREY,
    borderRadius: moderateScale(8),
  },
  placeholderStyle: {
    fontSize: moderateScale(12),
  },
  selectedTextStyle: {
    fontSize: moderateScale(16),
    color: "#FFFFFF",
  },
  inputSearchStyle: {
    height: verticalScale(40),
    fontSize: moderateScale(16),
  },
  iconStyle: {
    width: moderateScale(18),
    height: moderateScale(18),
    tintColor: "#FFFFFF",
  },
  itemContainerStyle: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(12),
    borderBottomColor: BORDER_GREY,
    borderBottomWidth: moderateScale(0.5),
  },
  selectedItemBackground: {
    backgroundColor: "rgba(253, 115, 50, 0.25)",
  },
  selectedItemText: {
    color: "#000000",
  },
  itemTextStyle: {
    fontSize: moderateScale(15),
    color: "#FFFFFF",
  },
  disabledTextStyle: {
    fontSize: moderateScale(14),
    color: "#AAAAAA",
    fontStyle: "italic",
  },
  errorText: {
    color: "red",
    fontSize: moderateScale(12),
    marginTop: verticalScale(6),
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: verticalScale(32),
    borderBottomWidth: moderateScale(2),
    borderBottomColor: ORANGE,
    paddingHorizontal: moderateScale(8),
  },
  loadingText: {
    marginLeft: moderateScale(8),
    color: "#CCCCCC",
    fontSize: moderateScale(14),
  },
});

export default ThemedDropdown;
