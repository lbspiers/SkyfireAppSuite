import React from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Image,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { spacing, radii } from "../theme/theme";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Search...",
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      <Image
        source={require("../assets/Images/icons/search.png")}
        style={[styles.icon, { tintColor: theme.textSecondary }]}
      />
      <TextInput
        style={[styles.input, { color: theme.textPrimary }]}
        placeholder={placeholder}
        placeholderTextColor={theme.placeholder}
        value={value}
        onChangeText={onChangeText}
        underlineColorAndroid="transparent"
      />
    </View>
  );
};

interface Styles {
  container: ViewStyle;
  icon: ImageStyle;
  input: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  icon: {
    width: spacing.md,
    height: spacing.md,
    marginRight: spacing.sm,
    resizeMode: "contain",
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    margin: 0,
  },
});

export default SearchBar;
