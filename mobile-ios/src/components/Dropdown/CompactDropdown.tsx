// src/components/Dropdown/CompactDropdown.tsx
// Compact version of dropdown with no built-in padding/spacing
// Use this when you need precise control over spacing (e.g., dashboard controls)

import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType,
  ActivityIndicator,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import LinearGradient from "react-native-linear-gradient";
import COLORS from "../../utils/styleConstant/Color";
import { BLUE_2C_BT } from "../../styles/gradient";
import { moderateScale, verticalScale } from "../../utils/responsive";

export type CompactDropdownProps<T> = {
  label?: string; // Optional label
  data?: T[];
  value: any;
  onChange: (value: any) => void;
  onOpen?: () => void;
  labelField?: string;
  valueField?: string;
  widthPercent?: number;
  loading?: boolean;
  disabled?: boolean;
};

const ICON_WHITE =
  require("../../assets/Images/icons/chevron_down_white.png") as ImageSourcePropType;
const ICON_ORANGE =
  require("../../assets/Images/icons/chevron_down_orange.png") as ImageSourcePropType;
const ORANGE_GRADIENT = ["#FD7332", "#B92011"];
const DARK_BLUE = "#0C1F3F";

// Small helper to guarantee arrays
function toArray<U>(x?: U[]): U[] {
  return Array.isArray(x) ? x : [];
}

export default function CompactDropdown<T extends Record<string, any>>({
  label,
  data,
  value,
  onOpen,
  onChange,
  labelField = "label",
  valueField = "value",
  widthPercent = 100,
  loading = false,
  disabled = false,
}: CompactDropdownProps<T>) {
  const [selected, setSelected] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setSelected(value);
  }, [value]);

  // Always an array; no more noisy warnings
  const dataset: T[] = toArray(data);

  // Filter out the currently selected item from the dropdown list to prevent duplication
  const dropdownData = useMemo(() => {
    const hasValue = selected !== undefined && selected !== "" && selected !== null;
    if (!hasValue) return dataset;
    return dataset.filter(item => item?.[valueField] !== selected);
  }, [dataset, selected, valueField]);

  const hasValue =
    selected !== undefined && selected !== "" && selected !== null;

  const rawItem = hasValue
    ? dataset.find((item) => item?.[valueField] === selected)
    : undefined;

  const displayText = loading
    ? "Loading..."
    : hasValue
    ? rawItem
      ? String(rawItem[labelField])
      : String(selected)
    : "";

  return (
    <View style={{ width: `${widthPercent}%` }}>
      {/* Optional Label - only show if provided */}
      {label && label.length > 0 && (
        <>
          <Text style={styles.label}>{label}</Text>
          <View style={{ height: verticalScale(6) }} />
        </>
      )}

      {/* Blue gradient background with conditional border */}
      <LinearGradient
        colors={BLUE_2C_BT.colors}
        start={BLUE_2C_BT.start}
        end={BLUE_2C_BT.end}
        style={[
          styles.dropdownWrapper,
          {
            borderWidth: moderateScale(2),
            borderColor: hasValue || isOpen ? "#FD7332" : "#888888",
          },
        ]}
      >
        <Dropdown
          style={styles.dropdown}
          data={dropdownData}
          search={false}
          excludeSearchBarFromList={true}
          labelField={labelField}
          valueField={valueField}
          placeholder={displayText}
          placeholderStyle={hasValue ? styles.selectedText : styles.placeholder}
          selectedTextStyle={styles.selectedText}
          renderRightIcon={() =>
            loading ? (
              <ActivityIndicator color={COLORS.orange} />
            ) : (
              <Image
                source={hasValue ? ICON_ORANGE : ICON_WHITE}
                style={styles.icon}
              />
            )
          }
          dropdownPosition="auto"
          autoScroll={false}
          containerStyle={styles.dropdownContainer}
          itemContainerStyle={styles.menuItem}
          itemTextStyle={styles.menuItemText}
          activeColor="transparent"
          disable={disabled || loading}
          flatListProps={{
            nestedScrollEnabled: true,
            initialNumToRender: 30,
            maxToRenderPerBatch: 30,
            windowSize: 15,
            keyboardShouldPersistTaps: 'always',
          }}
          onFocus={() => {
            setIsOpen(true);
            onOpen?.();
          }}
          onBlur={() => {
            setIsOpen(false);
          }}
          value={hasValue ? selected : undefined}
          onChange={(item: any) => {
            const val = item?.[valueField];
            setSelected(val);
            onChange(val);
            setIsOpen(false);
          }}
          renderItem={(item: T, isSelected?: boolean) =>
            isSelected ? (
              <LinearGradient
                colors={ORANGE_GRADIENT}
                style={styles.menuItemGradient}
              >
                <Text style={[styles.menuItemText, styles.menuItemTextSelected]}>
                  {String(item[labelField])}
                </Text>
              </LinearGradient>
            ) : (
              <View style={styles.menuItem}>
                <Text style={styles.menuItemText}>
                  {String(item[labelField])}
                </Text>
              </View>
            )
          }
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: moderateScale(20),
    lineHeight: moderateScale(20),
    fontWeight: "700",
    color: COLORS.white,
  },
  dropdownWrapper: {
    borderRadius: moderateScale(4),
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(6),
  },
  dropdown: {
    fontSize: moderateScale(20),
    color: COLORS.white,
    backgroundColor: "transparent",
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  dropdownContainer: {
    backgroundColor: DARK_BLUE,
    borderWidth: moderateScale(2),
    borderColor: "#FD7332",
    borderRadius: moderateScale(4),
    marginTop: moderateScale(4),
    maxHeight: 400,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    overflow: "hidden",
  },
  placeholder: {
    fontSize: moderateScale(20),
    fontWeight: "400",
    color: "#bbb",
    paddingBottom: 0,
  },
  selectedText: {
    fontSize: moderateScale(20),
    fontWeight: "400",
    color: COLORS.white,
    paddingBottom: 0,
  },
  icon: {
    width: moderateScale(24),
    height: moderateScale(24),
    resizeMode: "contain",
    marginRight: 0,
  },
  menuItem: {
    backgroundColor: "transparent",
    paddingVertical: 8,
    paddingHorizontal: moderateScale(8),
    alignItems: "flex-start",
    borderWidth: 0,
    borderColor: "transparent",
  },
  menuItemGradient: {
    paddingVertical: 8,
    paddingHorizontal: moderateScale(8),
    alignItems: "flex-start",
    borderWidth: 0,
  },
  menuItemText: {
    fontSize: moderateScale(20),
    color: COLORS.white,
    textAlign: "left",
  },
  menuItemTextSelected: {
    fontWeight: "700",
  },
});
