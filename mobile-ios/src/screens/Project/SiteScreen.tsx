// src/screens/app/site/SiteScreen.tsx
import React, { useEffect } from "react";
import { SafeAreaView, StyleSheet, Platform, UIManager } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import AppHeader from "../../components/Header/AppHeader";
import SiteForm from "../../components/Forms/siteform/SiteForm";
import { useTheme } from "../../theme/ThemeContext";
import { spacing } from "../../theme/theme";

// Enable LayoutAnimation on Android once
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SiteScreen = () => {
  const { theme } = useTheme();

  useEffect(() => {
    console.log("📍 SiteScreen mounted");
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surface }]}>
      <AppHeader title="Site" />

      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableAutomaticScroll
        extraScrollHeight={20}
        enableOnAndroid
        contentContainerStyle={styles.scrollContainer}
      >
        <SiteForm />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
});

export default SiteScreen;
