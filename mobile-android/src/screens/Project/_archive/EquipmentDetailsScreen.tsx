import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import AppHeader from "../../components/Header/AppHeader";
import EquipmentDetailsForm from "../../components/EquipmentDetails/EquipmentDetailsForm";

const EquipmentDetailsScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Equipment Details" />
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableAutomaticScroll
        extraScrollHeight={20}
        enableOnAndroid
        contentContainerStyle={styles.scrollContainer}
      >
        <EquipmentDetailsForm />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1E2128",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100,
  },
});

export default EquipmentDetailsScreen;
