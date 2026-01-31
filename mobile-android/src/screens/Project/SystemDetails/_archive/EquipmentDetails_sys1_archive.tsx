// src/screens/Project/SystemDetails/SystemDetails.tsx
// Dynamic version - handles Systems 1-4 based on navigation params

import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Text as RNText } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation, DrawerActions, useRoute, RouteProp } from "@react-navigation/native";
import { useSelector } from "react-redux";

import AppHeader from "../../../components/Header/AppHeader";
import SolarPanelsSection from "./sections/SolarPanelSection";
import SystemSelectionSection from "./sections/SystemSelectionSection";
import MicroinverterSection from "./sections/MicroinverterSection";
import InverterSection from "./sections/InverterSection";
import StringCombinerPanelSection from "./sections/StringCombinerPanelSection";
import EnergyStorageSection from "./sections/EnergyStorageSection";

const solarPanelList = [
  { label: "Q-Cells", value: "qcells" },
  { label: "REC", value: "rec" },
  { label: "JA Solar", value: "ja" },
];
const solarModalList = [
  { label: "Q.PEAK DUO BLK ML-G10+", value: "qpeak" },
  { label: "Alpha Pure-R", value: "alpha" },
  { label: "JAM72S30", value: "jam" },
];

const microinverterMakeList = [
  { label: "Enphase", value: "enphase" },
  { label: "APSystems", value: "apsystems" },
  { label: "Hoymiles", value: "hoymiles" },
];
const microinverterModelList = [
  { label: "IQ8", value: "iq8" },
  { label: "IQ8PLUS", value: "iq8plus" },
];

const inverterMakeList = [
  { label: "SMA", value: "sma" },
  { label: "SolarEdge", value: "solaredge" },
  { label: "Fronius", value: "fronius" },
];
const inverterModelList = [
  { label: "STP 5.0", value: "stp5" },
  { label: "SE6000H", value: "se6000h" },
];

// Route params interface
interface RouteParams {
  EquipmentDetails: {
    systemLabel?: string;
    systemNumber?: number;
    systemPrefix?: string;
    details?: any;
    data?: any;
  };
}

const SystemDetails: React.FC = () => {
  const [headerHeight, setHeaderHeight] = useState(0);

  // Get route params for dynamic system handling
  const route = useRoute<RouteProp<RouteParams, 'EquipmentDetails'>>();
  const { 
    systemLabel = "System 1", 
    systemNumber = 1, 
    systemPrefix = "sys1_" 
  } = route.params || {};

  // Redux, navigation, user/company/project
  const navigation = useNavigation();
  const companyID = useSelector((s: any) => s.profile.profile);
  const project = useSelector((s: any) => s.project.currentProject);
  const systemDetails = useSelector((s: any) => s.project.systemDetails) || {};
  const user = companyID?.user || {};
  const company = companyID?.company || {};

  // Solar Panel state
  const [solarPanelSection, setSolarPanelSection] = useState({
    quantity: "",
    selectedSolarPanel: "",
    selectedSolarPanelModal: "",
    isNewSolarPanel: true,
  });
  const [solarPanelErrors, setSolarPanelErrors] = useState({
    quantity: "",
    selectedSolarPanel: "",
    selectedSolarPanelModal: "",
  });

  // System Selection
  const [systemType, setSystemType] = useState<
    "microinverter" | "inverter" | ""
  >("");
  const [systemTypeErrors, setSystemTypeErrors] = useState<{ value?: string }>(
    {}
  );

  // Microinverter Section
  const [microinverterSection, setMicroinverterSection] = useState({
    quantity: "",
    selectedMicroinverterMake: "",
    selectedMicroinverterModel: "",
    isNewMicroinverter: true,
  });
  const [microinverterErrors, setMicroinverterErrors] = useState({
    quantity: "",
    selectedMicroinverterMake: "",
    selectedMicroinverterModel: "",
  });

  // Inverter Section
  const [inverterSection, setInverterSection] = useState({
    selectedInverterMake: "",
    selectedInverterModel: "",
    isNewInverter: true,
  });
  const [inverterErrors, setInverterErrors] = useState({
    selectedInverterMake: "",
    selectedInverterModel: "",
  });

  // String Combiner Panel (for micro)
  const [stringCombinerPanelSection, setStringCombinerPanelSection] = useState({
    isNewCombiner: true,
    selectedCombinerMake: "",
    selectedCombinerModel: "",
    selectedBusAmps: "",
    selectedMainBreaker: "",
  });
  const [stringCombinerPanelErrors, setStringCombinerPanelErrors] = useState({
    selectedCombinerMake: "",
    selectedCombinerModel: "",
    selectedBusAmps: "",
    selectedMainBreaker: "",
  });

  // Energy Storage
  const [energyStorageValue, setEnergyStorageValue] = useState<
    "whole" | "partial" | "none" | ""
  >("");
  const [energyStorageErrors, setEnergyStorageErrors] = useState<{
    value?: string;
  }>({});

  // Handlers
  const handleSolarPanelChange = (f: string, v: any) =>
    setSolarPanelSection((prev) => ({ ...prev, [f]: v }));
  const handleMicroinverterChange = (f: string, v: any) =>
    setMicroinverterSection((prev) => ({ ...prev, [f]: v }));
  const handleInverterChange = (f: string, v: any) =>
    setInverterSection((prev) => ({ ...prev, [f]: v }));
  const handleStringCombinerPanelChange = (f: string, v: any) =>
    setStringCombinerPanelSection((prev) => ({ ...prev, [f]: v }));

  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradient}>
      {/* 1) Main scrollable body */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + 20, paddingBottom: 80 },
        ]}
        showsVerticalScrollIndicator={true}
      >
        <SolarPanelsSection
          values={solarPanelSection}
          onChange={handleSolarPanelChange}
          solarPanelList={solarPanelList}
          solarModalList={solarModalList}
          errors={solarPanelErrors}
        />

        <SystemSelectionSection
          value={systemType}
          onChange={setSystemType}
          errors={systemTypeErrors}
        />

        {systemType === "microinverter" && (
          <>
            <MicroinverterSection
              values={microinverterSection}
              onChange={handleMicroinverterChange}
              microinverterMakeList={microinverterMakeList}
              microinverterModelList={microinverterModelList}
              errors={microinverterErrors}
            />
            <StringCombinerPanelSection
              values={stringCombinerPanelSection}
              onChange={handleStringCombinerPanelChange}
              makeList={microinverterMakeList}
              modelList={microinverterModelList}
              errors={stringCombinerPanelErrors}
            />
            <EnergyStorageSection
              value={energyStorageValue}
              onChange={setEnergyStorageValue}
              errors={energyStorageErrors}
            />
          </>
        )}

        {systemType === "inverter" && (
          <>
            <InverterSection
              values={inverterSection}
              onChange={handleInverterChange}
              inverterMakeList={inverterMakeList}
              inverterModelList={inverterModelList}
              errors={inverterErrors}
            />
            <EnergyStorageSection
              value={energyStorageValue}
              onChange={setEnergyStorageValue}
              errors={energyStorageErrors}
            />
          </>
        )}
      </ScrollView>

      {/* 2) Fade‐mask to hide any scrolling content under the header */}
      {headerHeight > 0 && (
        <LinearGradient
          colors={["#2E4161", "transparent"]}
          style={[styles.topMask, { height: headerHeight + 10 }]}
        />
      )}

      {/* 3) Actual AppHeader on top */}
      <View
        style={styles.headerWrap}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <AppHeader
          title={`${systemLabel} Details`}
          lastName={user?.lastName}
          firstName={user?.firstName}
          address={
            company
              ? {
                  street: company.address || "",
                  city: company.city || "",
                  state: company.state || "",
                  zip: company.zipCode || "",
                }
              : undefined
          }
          projectId={project?.details?.installer_project_id}
          onFlamePress={() => navigation.dispatch(DrawerActions.openDrawer())}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 0 },

  /* the mask that blends from your deep-blue into transparent */
  topMask: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },

  /* your header wrapper, on top of both scroll and mask */
  headerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});

export default SystemDetails;
