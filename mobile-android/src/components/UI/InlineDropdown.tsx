// src/components/UI/InlineDropdown.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import { colors } from "../../theme/tokens/tokens";
import { moderateScale, verticalScale } from "../../utils/responsive";

interface DropdownOption {
  label: string;
  value: string;
  id?: number;
}

interface InlineDropdownProps {
  value: string;
  displayValue?: string; // What to show (label), defaults to value
  options: DropdownOption[];
  onChange: (value: string) => void;
  onOpen?: () => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  searchable?: boolean;
}

export default function InlineDropdown({
  value,
  displayValue,
  options,
  onChange,
  onOpen,
  placeholder = "Select...",
  disabled = false,
  loading = false,
  searchable = true,
}: InlineDropdownProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  const handleOpen = useCallback(() => {
    if (disabled || loading) return;
    onOpen?.();
    setModalVisible(true);
    setSearchText("");
  }, [disabled, loading, onOpen]);

  const handleSelect = useCallback((option: DropdownOption) => {
    onChange(option.value);
    setModalVisible(false);
  }, [onChange]);

  const filteredOptions = searchable && searchText
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchText.toLowerCase())
      )
    : options;

  const displayText = displayValue || value || placeholder;
  const isPlaceholder = !value;

  return (
    <>
      <TouchableOpacity
        style={[styles.container, disabled && styles.containerDisabled]}
        onPress={handleOpen}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Text
          style={[
            styles.valueText,
            isPlaceholder && styles.placeholderText,
          ]}
          numberOfLines={1}
        >
          {loading ? "Loading..." : displayText}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Image
            source={require("../../assets/Images/icons/chevron_down_orange.png")}
            style={styles.chevron}
          />
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {searchable && (
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  placeholderTextColor={colors.textMuted}
                  value={searchText}
                  onChangeText={setSearchText}
                  autoFocus
                />
              </View>
            )}
            <FlatList
              data={filteredOptions}
              keyExtractor={(item, index) => `${item.value}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item.value === value && styles.optionSelected,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && styles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.optionsList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: verticalScale(4),
  },
  containerDisabled: {
    opacity: 0.5,
  },
  valueText: {
    flex: 1,
    fontSize: moderateScale(16),
    color: colors.textPrimary,
  },
  placeholderText: {
    color: colors.textMuted,
  },
  chevron: {
    width: moderateScale(20),
    height: moderateScale(20),
    tintColor: colors.primary,
    marginLeft: moderateScale(8),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    paddingHorizontal: moderateScale(20),
  },
  modalContent: {
    backgroundColor: colors.bgSurface,
    borderRadius: moderateScale(12),
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  searchContainer: {
    padding: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  searchInput: {
    backgroundColor: colors.bgInput,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(10),
    fontSize: moderateScale(16),
    color: colors.textPrimary,
  },
  optionsList: {
    maxHeight: verticalScale(300),
  },
  option: {
    paddingVertical: verticalScale(14),
    paddingHorizontal: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  optionSelected: {
    backgroundColor: colors.primaryLighter,
  },
  optionText: {
    fontSize: moderateScale(16),
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
});
