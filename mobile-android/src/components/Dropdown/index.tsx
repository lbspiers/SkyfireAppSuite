// src/components/Dropdown/index.tsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Keyboard,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import LinearGradient from "react-native-linear-gradient";
import COLORS from "../../utils/styleConstant/Color";
import { BLUE_2C_BT } from "../../styles/gradient";
import { moderateScale, verticalScale } from "../../utils/responsive";
// TODO: Custom keyboard disabled - using hardware keyboard
// import { useGlobalKeyboard } from "../CustomKeyboard/GlobalKeyboardProvider";

export type DropdownComponentProps<T> = {
  label: string;
  /** May be undefined during load; safely coerced to [] */
  data?: T[];
  value: any;
  onChange: (value: any) => void;
  onOpen?: () => void;
  labelField?: string;
  valueField?: string;
  errorText?: string;
  widthPercent?: number;
  loading?: boolean;
  disabled?: boolean;
  placeholderColor?: string;
  topSpacing?: number;
  bottomSpacing?: number;
  enableSearch?: boolean; // New prop to enable custom search
  style?: View["props"]["style"]; // Custom style for container
};

const ICON_WHITE =
  require("../../assets/Images/icons/chevron_down_white_thin.png") as ImageSourcePropType;
const ORANGE_GRADIENT = ["#FD7332", "#B92011"];
const DARK_BLUE = "#0C1F3F";

// Small helper to guarantee arrays
function toArray<U>(x?: U[]): U[] {
  return Array.isArray(x) ? x : [];
}

export default function DropdownComponent<T extends Record<string, any>>({
  label,
  data,
  value,
  onOpen,
  onChange,
  labelField = "label",
  valueField = "value",
  errorText,
  widthPercent = 100,
  loading = false,
  disabled = false,
  enableSearch = false,
  topSpacing,
  bottomSpacing,
  style,
}: DropdownComponentProps<T>) {
  const [selected, setSelected] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [keyboardActive, setKeyboardActive] = useState(false);
  // TODO: Custom keyboard disabled - using hardware keyboard
  // const globalKeyboard = useGlobalKeyboard();
  const searchInputRef = useRef<TextInput>(null);
  const lastFocusTimeRef = useRef<number>(0);
  const isOpeningRef = useRef<boolean>(false);

  useEffect(() => {
    setSelected(value);
  }, [value]);

  // Log when loading or data changes during open state
  useEffect(() => {
    if (isOpen) {
      console.log(`[Dropdown - ${label}] 🔄 Render during open state - loading: ${loading}, data length: ${data?.length ?? 0}`);
    }
  }, [loading, data, isOpen, label]);

  // Always an array; no more noisy warnings - memoized to prevent dependency changes
  const dataset: T[] = useMemo(() => toArray(data), [data]);

  // Log data prop to track oscillation (only when length changes to reduce noise)
  const prevDataLengthRef = React.useRef<number>(-1);
  useEffect(() => {
    const newLength = Array.isArray(data) ? data.length : 0;
    if (prevDataLengthRef.current !== newLength) {
      console.log(`[Dropdown - ${label}] 📦 data prop changed: array[${prevDataLengthRef.current === -1 ? '?' : prevDataLengthRef.current}] → array[${newLength}], dataset: array[${dataset.length}]`);
      prevDataLengthRef.current = newLength;
    }
  }, [data, dataset, label]);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!enableSearch || !searchQuery.trim()) {
      return dataset;
    }
    const query = searchQuery.toLowerCase();
    return dataset.filter((item) =>
      String(item[labelField]).toLowerCase().includes(query)
    );
  }, [dataset, searchQuery, labelField, enableSearch]);

  // Custom keyboard handlers for search
  const handleSearchKeyPress = (key: string) => {
    setSearchQuery((prev) => prev + key);
  };

  const handleSearchBackspace = () => {
    setSearchQuery((prev) => prev.slice(0, -1));
  };

  const handleSearchFocus = () => {
    // Dismiss native keyboard
    Keyboard.dismiss();

    // Mark keyboard as active to prevent dropdown from closing
    setKeyboardActive(true);

    // TODO: Custom keyboard disabled - using hardware keyboard
    // Show custom keyboard
    // if (globalKeyboard && enableSearch) {
    //   globalKeyboard.showKeyboard({
    //     fieldId: `dropdown-search-${label}`,
    //     onKeyPress: handleSearchKeyPress,
    //     onBackspace: handleSearchBackspace,
    //     onEnter: () => {
    //       globalKeyboard.hideKeyboard();
    //       setKeyboardActive(false);
    //     },
    //     onTextChange: setSearchQuery,
    //     returnKeyType: 'done',
    //     autoCapitalize: 'none',
    //     enableHapticFeedback: true,
    //     showSuggestions: false,
    //     theme: 'dark',
    //   });
    // }
  };

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

  // Filter out the currently selected item from the dropdown list to prevent duplication
  const dropdownData = useMemo(() => {
    if (!hasValue) {
      return filteredData;
    }
    const filtered = filteredData.filter(item => item?.[valueField] !== selected);
    return filtered;
  }, [filteredData, hasValue, selected, valueField]);

  return (
    <View style={[{ width: `${widthPercent}%` }, styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={{ height: verticalScale(6) }} />

      {/* Custom Search Input - Separate from Dropdown */}
      {/* COMMENTED OUT - Search behavior needs better solution
      {enableSearch && isOpen && (
        <View style={styles.externalSearchContainer}>
          <TextInput
            ref={searchInputRef}
            style={styles.externalSearchInput}
            placeholder="Search..."
            placeholderTextColor="#bbb"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={handleSearchFocus}
            showSoftInputOnFocus={false}
          />
        </View>
      )}
      */}

      {/* Blue gradient background with conditional border */}
      <LinearGradient
        colors={BLUE_2C_BT.colors}
        start={BLUE_2C_BT.start}
        end={BLUE_2C_BT.end}
        style={[
          styles.dropdownWrapper,
          {
            borderWidth: moderateScale(1),
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
                source={ICON_WHITE}
                style={[
                  styles.icon,
                  hasValue && { tintColor: COLORS.orange }
                ]}
              />
            )
          }
          dropdownPosition="auto"
          autoScroll={false}
          containerStyle={[
            styles.dropdownContainer,
            {
              zIndex: 10000, // Lower than keyboard but high enough
              maxHeight: enableSearch ? 250 : 400, // Smaller when search enabled to leave room for keyboard
            }
          ]}
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
            console.log(`[Dropdown - ${label}] 🔵 onFocus - opening dropdown, isOpen: ${isOpen}, data length: ${dataset.length}`);
            lastFocusTimeRef.current = Date.now();
            isOpeningRef.current = true;
            setIsOpen(true);

            // Delay the onOpen callback slightly to let the dropdown render first
            setTimeout(() => {
              isOpeningRef.current = false;
              if (onOpen) {
                console.log(`[Dropdown - ${label}] 📞 Calling onOpen callback`);
                onOpen();
              }
            }, 50);
          }}
          onBlur={() => {
            const timeSinceFocus = Date.now() - lastFocusTimeRef.current;
            console.log(`[Dropdown - ${label}] 🔴 onBlur - keyboardActive: ${keyboardActive}, timeSinceFocus: ${timeSinceFocus}ms, isOpening: ${isOpeningRef.current}`);

            // Prevent immediate close after focus (likely a spurious blur event)
            if (timeSinceFocus < 100 || isOpeningRef.current) {
              console.log(`[Dropdown - ${label}] ⚠️ Ignoring blur - too soon after focus`);
              return;
            }

            // Don't close dropdown if keyboard is active
            if (!keyboardActive) {
              setIsOpen(false);
            }
          }}
          value={hasValue ? selected : undefined}
          onChange={(item: any) => {
            const val = item?.[valueField];
            setSelected(val);
            onChange(val);
            // TODO: Custom keyboard disabled - using hardware keyboard
            // Close keyboard when item is selected
            // if (keyboardActive && globalKeyboard) {
            //   globalKeyboard.hideKeyboard();
            //   setKeyboardActive(false);
            // }
            // Dropdown will close automatically in modal mode
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

      {errorText ? (
        <Text style={styles.errorText}>{errorText}</Text>
      ) : (
        <View style={{ height: verticalScale(10) }} />
      )}
      <View style={{ height: verticalScale(10) }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 0 },
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
    minHeight: moderateScale(44),
    justifyContent: "center",
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
    borderWidth: moderateScale(1),
    borderColor: "#FD7332",
    borderRadius: moderateScale(4),
    marginTop: moderateScale(4), // Increased from 2 to 4 for small gap
    maxHeight: 400, // Increased height for better scrolling
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
    paddingHorizontal: moderateScale(8), // Match dropdown padding
    alignItems: "flex-start", // Left align
    borderWidth: 0,
    borderColor: "transparent",
  },
  menuItemGradient: {
    paddingVertical: 8,
    paddingHorizontal: moderateScale(8), // Match dropdown padding
    alignItems: "flex-start", // Left align
  },
  menuItemText: {
    color: COLORS.white,
    fontSize: moderateScale(20),
    fontWeight: "400",
  },
  menuItemTextSelected: {},
  error: {
    fontSize: 12,
    color: COLORS.red,
  },
  errorText: {
    marginTop: verticalScale(5),
    fontSize: moderateScale(12),
    color: "#EF4444",
    marginBottom: verticalScale(-5),
  },
  externalSearchContainer: {
    marginBottom: verticalScale(8),
  },
  externalSearchInput: {
    backgroundColor: DARK_BLUE,
    color: COLORS.white,
    borderWidth: moderateScale(1),
    borderColor: "#FD7332",
    borderRadius: moderateScale(4),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(10),
    fontSize: moderateScale(18),
    height: verticalScale(44),
  },
});
