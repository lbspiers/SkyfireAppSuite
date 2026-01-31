// src/components/Forms/SiteForm/UtilityProviderSection.tsx
import React, { useEffect, useRef } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import CollapsibleSection from "../../UI/CollapsibleSection";
import ThemedDropdown from "../../UI/ThemedDropdown";
import Text from "../../Text";
import { useTheme } from "../../../theme/ThemeContext";
import { spacing, typography } from "../../../theme/theme";

// ✅ Enable layout animations on Android (likely already done at app bootstrap)
import { Platform, UIManager, LayoutAnimation } from "react-native";
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface UtilityProviderSectionProps {
  values: any;
  errors: any;
  touched: any;
  setFieldValue: (field: string, value: any) => void;
  utilities: { label: string; value: string }[];
  utilityLoading: boolean;
  onAutoSave: () => void;
}

const UtilityProviderSection: React.FC<UtilityProviderSectionProps> = ({
  values,
  errors,
  touched,
  setFieldValue,
  utilities,
  utilityLoading,
  onAutoSave,
}) => {
  const { theme } = useTheme();
  const showDropdown = !utilityLoading && utilities.length > 0;
  const showEmpty = !utilityLoading && utilities.length === 0;
  const zip = values.zip;
  const shouldRender = zip?.length === 5;

  // track previous zip for animation
  const wasZipEmpty = useRef(zip?.length !== 5);
  useEffect(() => {
    if (wasZipEmpty.current && shouldRender) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    wasZipEmpty.current = !shouldRender;
  }, [shouldRender]);

  if (!shouldRender) return null;

  return (
    <CollapsibleSection title="Utility Provider" initiallyExpanded>
      {utilityLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text
            style={[
              typography.body,
              { marginTop: spacing.sm, color: theme.textSecondary },
            ]}
          >
            Loading Providers...
          </Text>
        </View>
      )}

      {showDropdown && (
        <ThemedDropdown
          label="Utility*"
          data={utilities}
          value={values.utility}
          onChangeValue={async (v) => {
            setFieldValue("utility", v);
            await onAutoSave();
          }}
          error={touched.utility && errors.utility ? errors.utility : undefined}
        />
      )}

      {showEmpty && (
        <View style={styles.emptyContainer}>
          <Text
            style={[
              typography.caption,
              { color: theme.textSecondary, fontStyle: "italic" },
            ]}
          >
            🚫 No providers found for this ZIP
          </Text>
        </View>
      )}
    </CollapsibleSection>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
});

export default UtilityProviderSection;
