// src/screens/Project/SystemDetails/SystemDetails.tsx

import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Dimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { useSelector } from "react-redux";

import LargeHeader from "../../../components/Header/LargeHeader";
import SolarPanelsSection from "./sections/SolarPanelSection";
import SystemSelectionSection from "./sections/SystemSelectionSection";
import MicroinverterSection from "./sections/MicroinverterSection";
import InverterSection from "./sections/InverterSection";
import StringCombinerPanelSection from "./sections/StringCombinerPanelSection";
import EnergyStorageSection from "./sections/EnergyStorageSection";

// battery subsections
import Sys1BatteryType1Section from "./sections/ESS_Subsections/sys1_BatteryType1Section";
import Sys1BatteryType2Section from "./sections/ESS_Subsections/sys1_BatteryType2Section";
import Sys1BatteryCombinerPanel1Section from "./sections/ESS_Subsections/sys1_BatteryCombinerPanel1Section";
// ← NEW: SMS subsection
import Sys1SMSSection from "./sections/ESS_Subsections/sys1_SMS";

function averageHexColor(a: string, bc: string): string {
  const ha = a.replace("#", ""),
    hb = bc.replace("#", "");
  const ra = parseInt(ha.slice(0, 2), 16),
    ga = parseInt(ha.slice(2, 4), 16),
    ba = parseInt(ha.slice(4, 6), 16);
  const rb = parseInt(hb.slice(0, 2), 16),
    gb = parseInt(hb.slice(2, 4), 16),
    bb = parseInt(hb.slice(4, 6), 16);
  const r = Math.round((ra + rb) / 2)
      .toString(16)
      .padStart(2, "0"),
    g = Math.round((ga + gb) / 2)
      .toString(16)
      .padStart(2, "0"),
    b = Math.round((ba + bb) / 2)
      .toString(16)
      .padStart(2, "0");
  return `#${r}${g}${b}`;
}

const LIGHT = "#2E4161";
const DARK = "#0C1F3F";
const MID = averageHexColor(LIGHT, DARK);
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const SystemDetails: React.FC = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const navigation = useNavigation();
  const companyID = useSelector((s: any) => s.profile.profile);
  const project = useSelector((s: any) => s.project.currentProject);
  const user = companyID?.user || {};
  const company = companyID?.company || {};

  // — Solar Panels —
  const [solarSection, setSolarSection] = useState({
    quantity: "",
    selectedSolarPanel: "",
    selectedSolarPanelModal: "",
    isNewSolarPanel: true,
  });
  const [solarErrors, setSolarErrors] = useState({
    quantity: "",
    selectedSolarPanel: "",
    selectedSolarPanelModal: "",
  });

  // — System Selection —
  const [systemType, setSystemType] = useState<
    "microinverter" | "inverter" | ""
  >("");
  const [systemTypeErrors, setSystemTypeErrors] = useState<{ value?: string }>(
    {}
  );

  // — Microinverter —
  const [microSection, setMicroSection] = useState({
    quantity: "",
    selectedMicroinverterMake: "",
    selectedMicroinverterModel: "",
    isNewMicroinverter: true,
  });
  const [microErrors, setMicroErrors] = useState({
    quantity: "",
    selectedMicroinverterMake: "",
    selectedMicroinverterModel: "",
  });

  // — Inverter —
  const [inverterSection, setInverterSection] = useState({
    selectedInverterMake: "",
    selectedInverterModel: "",
    isNewInverter: true,
  });
  const [inverterErrors, setInverterErrors] = useState({
    selectedInverterMake: "",
    selectedInverterModel: "",
  });

  // — String Combiner Panel (micro branch) —
  const [combinerSection, setCombinerSection] = useState({
    isNewCombiner: true,
    selectedCombinerMake: "",
    selectedCombinerModel: "",
    selectedBusAmps: "",
    selectedMainBreaker: "",
  });
  const [combinerErrors, setCombinerErrors] = useState({
    selectedCombinerMake: "",
    selectedCombinerModel: "",
    selectedBusAmps: "",
    selectedMainBreaker: "",
  });

  // — Energy Storage —
  const [storageValue, setStorageValue] = useState<
    "whole" | "partial" | "none" | ""
  >("");
  const [storageErrors, setStorageErrors] = useState<{ value?: string }>({});

  // — Batteries —
  const [battery1, setBattery1] = useState({
    quantity: "",
    selectedBatteryMake: "",
    selectedBatteryModel: "",
    isNewBattery: true,
    configuration: "Single Battery",
  });
  const [battery1Errors, setBattery1Errors] = useState({
    quantity: "",
    selectedBatteryMake: "",
    selectedBatteryModel: "",
    configuration: "",
  });

  const [battery2, setBattery2] = useState({
    quantity: "",
    selectedBatteryMake: "",
    selectedBatteryModel: "",
    isNewBattery: true,
    isCombining: "",
    configuration: "",
  });
  const [battery2Errors, setBattery2Errors] = useState({
    quantity: "",
    selectedBatteryMake: "",
    selectedBatteryModel: "",
    isCombining: "",
    configuration: "",
  });

  // ← NEW: show/hide Battery Type 2
  const [showType2, setShowType2] = useState(false);

  // ← NEW: Battery Combiner Panel 1 subsection
  const [batteryCombiner, setBatteryCombiner] = useState({
    isNewCombiner: true,
    selectedCombinerMake: "",
    selectedCombinerModel: "",
    selectedBusAmps: "",
    selectedMainBreaker: "",
  });
  const [batteryCombinerErrors, setBatteryCombinerErrors] = useState({
    selectedCombinerMake: "",
    selectedCombinerModel: "",
    selectedBusAmps: "",
    selectedMainBreaker: "",
  });

  // ← NEW: SMS subsection
  const [smsSection, setSmsSection] = useState({
    isNewSMS: true,
    selectedSMSMake: "",
    selectedSMSModel: "",
    hasRSD: false,
    selectedMainBreaker: "",
    selectedBackupPanel: "",
  });
  const [smsErrors, setSmsErrors] = useState({
    selectedSMSMake: "",
    selectedSMSModel: "",
    selectedMainBreaker: "",
    selectedBackupPanel: "",
  });

  // handlers
  const handleSolarChange = (f: string, v: any) =>
    setSolarSection((s) => ({ ...s, [f]: v }));
  const handleSystemTypeChange = setSystemType;
  const handleMicroChange = (f: string, v: any) =>
    setMicroSection((m) => ({ ...m, [f]: v }));
  const handleInverterChange = (f: string, v: any) =>
    setInverterSection((i) => ({ ...i, [f]: v }));
  const handleCombinerChange = (f: string, v: any) =>
    setCombinerSection((c) => ({ ...c, [f]: v }));
  const handleBattery1Change = (f: string, v: any) =>
    setBattery1((b) => ({ ...b, [f]: v }));
  const handleBattery2Change = (f: string, v: any) =>
    setBattery2((b) => ({ ...b, [f]: v }));
  const handleBatteryCombinerChange = (f: string, v: any) =>
    setBatteryCombiner((b) => ({ ...b, [f]: v }));
  const handleSmsChange = (f: string, v: any) =>
    setSmsSection((s) => ({ ...s, [f]: v }));

  // add/remove Type 2
  const handleAddType2 = () => setShowType2(true);
  const handleRemoveType2 = () => {
    setShowType2(false);
    setBattery2({
      quantity: "",
      selectedBatteryMake: "",
      selectedBatteryModel: "",
      isNewBattery: true,
      isCombining: "",
      configuration: "",
    });
    setBattery2Errors({
      quantity: "",
      selectedBatteryMake: "",
      selectedBatteryModel: "",
      isCombining: "",
      configuration: "",
    });
  };

  // Decide if we show the Battery Combiner Panel 1
  const type1IsCombiner = battery1.configuration === "combiner_panel";
  const type2IsCombiner =
    showType2 && battery2.configuration === "combiner_panel";
  const showBatteryCombinerPanel =
    type2IsCombiner || (!showType2 && type1IsCombiner);

  // ← NEW: decide if show SMS at ALL
  const showSmsSection = storageValue === "whole" || storageValue === "partial";

  const stop = headerHeight / SCREEN_HEIGHT;

  return (
    <LinearGradient
      colors={[LIGHT, MID, DARK]}
      locations={[0, stop, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight, paddingBottom: 80 },
        ]}
        showsVerticalScrollIndicator
      >
        {/* Solar Panels */}
        <SolarPanelsSection
          values={solarSection}
          onChange={handleSolarChange}
          solarPanelList={[
            { label: "Q-Cells", value: "qcells" },
            { label: "REC", value: "rec" },
            { label: "JA Solar", value: "ja" },
          ]}
          solarModalList={[
            { label: "Q.PEAK DUO", value: "qpeak" },
            { label: "Alpha Pure", value: "alpha" },
            { label: "JAM72S30", value: "jam" },
          ]}
          errors={solarErrors}
        />

        {/* System Selection */}
        <SystemSelectionSection
          value={systemType}
          onChange={handleSystemTypeChange}
          errors={systemTypeErrors}
        />

        {/* Microinverter Branch */}
        {systemType === "microinverter" && (
          <>
            <MicroinverterSection
              values={microSection}
              onChange={handleMicroChange}
              microinverterMakeList={[
                { label: "Enphase", value: "enphase" },
                { label: "APSystems", value: "apsystems" },
                { label: "Hoymiles", value: "hoymiles" },
              ]}
              microinverterModelList={[
                { label: "IQ8", value: "iq8" },
                { label: "IQ8PLUS", value: "iq8plus" },
              ]}
              errors={microErrors}
            />

            <StringCombinerPanelSection
              values={combinerSection}
              onChange={handleCombinerChange}
              makeList={[
                { label: "Enphase", value: "enphase" },
                { label: "APSystems", value: "apsystems" },
                { label: "Hoymiles", value: "hoymiles" },
              ]}
              modelList={[
                { label: "IQ8", value: "iq8" },
                { label: "IQ8PLUS", value: "iq8plus" },
              ]}
              errors={combinerErrors}
            />

            {/* Energy Storage */}
            <EnergyStorageSection
              value={storageValue}
              onChange={setStorageValue}
              errors={storageErrors}
            />

            {/* Batteries */}
            {storageValue !== "" && (
              <>
                <Sys1BatteryType1Section
                  values={battery1}
                  onChange={handleBattery1Change}
                  errors={battery1Errors}
                  batteryMakeList={[
                    { label: "Tesla", value: "tesla" },
                    { label: "LG Chem", value: "lgchem" },
                    { label: "Panasonic", value: "panasonic" },
                  ]}
                  batteryModelList={[
                    { label: "X1", value: "x1" },
                    { label: "Y2", value: "y2" },
                  ]}
                  showAddType2={!showType2}
                  onAddType2={handleAddType2}
                />

                {showType2 && (
                  <Sys1BatteryType2Section
                    battery1Quantity={battery1.quantity}
                    values={battery2}
                    onChange={handleBattery2Change}
                    errors={battery2Errors}
                    batteryMakeList={[
                      { label: "Tesla", value: "tesla" },
                      { label: "LG Chem", value: "lgchem" },
                      { label: "Panasonic", value: "panasonic" },
                    ]}
                    batteryModelList={[
                      { label: "A1", value: "a1" },
                      { label: "B2", value: "b2" },
                    ]}
                    onClearType2={handleRemoveType2}
                  />
                )}

                {/* Battery Combiner Panel 1 */}
                {showBatteryCombinerPanel && (
                  <Sys1BatteryCombinerPanel1Section
                    values={batteryCombiner}
                    onChange={handleBatteryCombinerChange}
                    makeList={[
                      { label: "Tesla", value: "tesla" },
                      { label: "LG Chem", value: "lgchem" },
                      { label: "Panasonic", value: "panasonic" },
                    ]}
                    modelList={[]}
                    errors={batteryCombinerErrors}
                  />
                )}

                {/* SMS Section */}
                {showSmsSection && (
                  <Sys1SMSSection
                    values={smsSection}
                    onChange={handleSmsChange}
                    smsMakeList={[
                      { label: "Tesla", value: "tesla" },
                      { label: "LG Chem", value: "lgchem" },
                      { label: "Panasonic", value: "panasonic" },
                    ]}
                    smsModelList={[
                      { label: "X1", value: "x1" },
                      { label: "Y2", value: "y2" },
                    ]}
                    ampList={[
                      { label: "###", value: "" },
                      ...Array.from({ length: 22 }, (_, i) => {
                        const val = 40 + i * 10;
                        return { label: String(val), value: String(val) };
                      }),
                    ]}
                    errors={smsErrors}
                  />
                )}
              </>
            )}
          </>
        )}

        {/* Inverter Branch */}
        {systemType === "inverter" && (
          <>
            <InverterSection
              values={inverterSection}
              onChange={handleInverterChange}
              inverterMakeList={[
                { label: "SMA", value: "sma" },
                { label: "SolarEdge", value: "solaredge" },
                { label: "Fronius", value: "fronius" },
              ]}
              inverterModelList={[
                { label: "STP 5.0", value: "stp5" },
                { label: "SE6000H", value: "se6000h" },
              ]}
              errors={inverterErrors}
            />

            <EnergyStorageSection
              value={storageValue}
              onChange={setStorageValue}
              errors={storageErrors}
            />

            {storageValue !== "" && (
              <>
                <Sys1BatteryType1Section
                  values={battery1}
                  onChange={handleBattery1Change}
                  errors={battery1Errors}
                  batteryMakeList={[
                    { label: "Tesla", value: "tesla" },
                    { label: "LG Chem", value: "lgchem" },
                    { label: "Panasonic", value: "panasonic" },
                  ]}
                  batteryModelList={[
                    { label: "X1", value: "x1" },
                    { label: "Y2", value: "y2" },
                  ]}
                  showAddType2={!showType2}
                  onAddType2={handleAddType2}
                />

                {showType2 && (
                  <Sys1BatteryType2Section
                    battery1Quantity={battery1.quantity}
                    values={battery2}
                    onChange={handleBattery2Change}
                    errors={battery2Errors}
                    batteryMakeList={[
                      { label: "Tesla", value: "tesla" },
                      { label: "LG Chem", value: "lgchem" },
                      { label: "Panasonic", value: "panasonic" },
                    ]}
                    batteryModelList={[
                      { label: "A1", value: "a1" },
                      { label: "B2", value: "b2" },
                    ]}
                    onClearType2={handleRemoveType2}
                  />
                )}

                {showBatteryCombinerPanel && (
                  <Sys1BatteryCombinerPanel1Section
                    values={batteryCombiner}
                    onChange={handleBatteryCombinerChange}
                    makeList={[
                      { label: "Tesla", value: "tesla" },
                      { label: "LG Chem", value: "lgchem" },
                      { label: "Panasonic", value: "panasonic" },
                    ]}
                    modelList={[]}
                    errors={batteryCombinerErrors}
                  />
                )}

                {showSmsSection && (
                  <Sys1SMSSection
                    values={smsSection}
                    onChange={handleSmsChange}
                    smsMakeList={[
                      { label: "Tesla", value: "tesla" },
                      { label: "LG Chem", value: "lgchem" },
                      { label: "Panasonic", value: "panasonic" },
                    ]}
                    smsModelList={[
                      { label: "X1", value: "x1" },
                      { label: "Y2", value: "y2" },
                    ]}
                    ampList={[
                      { label: "###", value: "" },
                      ...Array.from({ length: 22 }, (_, i) => {
                        const val = 40 + i * 10;
                        return { label: String(val), value: String(val) };
                      }),
                    ]}
                    errors={smsErrors}
                  />
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Header overlay */}
      <View
        style={styles.headerWrap}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <LargeHeader
          title="System 1"
          name={
            user.lastName && user.firstName
              ? `${user.lastName}, ${user.firstName}`
              : undefined
          }
          addressLines={
            company
              ? [
                  company.address || "",
                  [company.city, company.state, company.zipCode]
                    .filter(Boolean)
                    .join(", "),
                ]
              : undefined
          }
          projectId={project?.details?.installer_project_id}
          onDrawerPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 0 },
  headerWrap: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
});

export default SystemDetails;
