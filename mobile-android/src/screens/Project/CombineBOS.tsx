// src/screens/Project/CombineBOS.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import LargeHeader from "../../components/Header/LargeHeader";
import SystemButton from "../../components/Button/SystemButton";
import Sys1BOSType1 from "./BalanceOfSystem/sections/sys1_BOS_Type1";
import Sys1BOSType2 from "./BalanceOfSystem/sections/sys1_BOS_Type2";
import Sys1BOSType3 from "./BalanceOfSystem/sections/sys1_BOS_Type3";
import StringCombinerPanelSection from "./SystemDetails/sections/StringCombinerPanelSection";
import SystemCombinerPanelSection from "./SystemDetails/sections/SystemCombinerPanelSection";
import { fetchSystemDetails } from "../../api/systemDetails.service";
import { saveSystemDetailsPartialExact } from "./SystemDetails/services/equipmentService";
import { useFocusEffect } from "@react-navigation/native";
import { BLUE_MD_TB } from "../../styles/gradient";
import { moderateScale, verticalScale } from "../../utils/responsive";
import { getMakes, getModels } from "../../utils/equipmentCache";
import { EQUIPMENT_TYPES } from "../../constants/equipmentTypes";

const flameIcon = require("../../assets/Images/appIcon.png");

export default function CombineBOS() {
  const navigation = useNavigation<any>();
  const project = useSelector((state: any) => state.project.currentProject);
  const projectId = project?.uuid;
  const companyId = project?.company_id;

  // Local state management for visibility and data
  const [showNote, setShowNote] = useState(true);
  const [showSystemCombinerPanel, setShowSystemCombinerPanel] = useState(false);
  const [showType1, setShowType1] = useState(false);
  const [showType2, setShowType2] = useState(false);
  const [showType3, setShowType3] = useState(false);
  const [type1Data, setType1Data] = useState<any>({});
  const [type2Data, setType2Data] = useState<any>({});
  const [type3Data, setType3Data] = useState<any>({});

  // System Combiner Panel 1 state
  const [systemCombinerPanel1, setSystemCombinerPanel1] = useState({
    isNew: true,
    selectedMake: "",
    selectedModel: "",
    selectedBusAmps: "",
    selectedMainBreaker: "mlo",
    selectedBreakerRating: "",
  });

  // System Combiner Panel data
  const [combinerMakes, setCombinerMakes] = useState<Array<{ label: string; value: string }>>([]);
  const [combinerModels, setCombinerModels] = useState<Array<{ label: string; value: string }>>([]);
  const [combinerLoadingMakes, setCombinerLoadingMakes] = useState(false);
  const [combinerLoadingModels, setCombinerLoadingModels] = useState(false);

  const combinerLoadMakes = async () => {
    if (!companyId || combinerLoadingMakes || combinerMakes.length > 0) return;

    setCombinerLoadingMakes(true);
    try {
      const makes = await getMakes(EQUIPMENT_TYPES.STRING_COMBINER_PANEL);

      const formatted = makes.map((item: any) => {
        if (typeof item === "string") {
          return { label: item, value: item };
        }
        return {
          label: item.label || item.make || item.value,
          value: item.value || item.make || item.label,
        };
      });

      setCombinerMakes(formatted);
      console.log('[CombineBOS] Loaded System Combiner Panel makes:', formatted.length);
    } catch (error) {
      console.error("[CombineBOS] Error loading System Combiner Panel makes:", error);
    } finally {
      setCombinerLoadingMakes(false);
    }
  };

  const combinerLoadModels = async () => {
    const selectedMake = systemCombinerPanel1.selectedMake;
    if (!companyId || !selectedMake || combinerLoadingModels) return;

    setCombinerLoadingModels(true);
    try {
      const models = await getModels(EQUIPMENT_TYPES.STRING_COMBINER_PANEL, selectedMake);

      const formatted = models.map((item: any) => {
        if (typeof item === "string") {
          return { label: item, value: item };
        }
        return {
          label: item.label || item.model || item.value,
          value: item.value || item.model || item.label,
        };
      });

      setCombinerModels(formatted);
      console.log('[CombineBOS] Loaded System Combiner Panel models:', formatted.length);
    } catch (error) {
      console.error("[CombineBOS] Error loading System Combiner Panel models:", error);
    } finally {
      setCombinerLoadingModels(false);
    }
  };

  // Max Continuous Output for the combined system
  const [maxContinuousOutputAmps1, setMaxContinuousOutputAmps1] = useState<number | null>(null);
  const [maxContinuousOutputAmps2, setMaxContinuousOutputAmps2] = useState<number | null>(null);
  const [loadingMaxOutput, setLoadingMaxOutput] = useState(false);
  // System 1 BOS equipment types from database
  const [sys1BosType1, setSys1BosType1] = useState("");
  const [sys1BosType2, setSys1BosType2] = useState("");
  const [sys1BosType3, setSys1BosType3] = useState("");

  // Calculate total max continuous output
  const totalMaxContinuousOutput = (maxContinuousOutputAmps1 || 0) + (maxContinuousOutputAmps2 || 0);

  // Load all data from database on focus
  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        if (!projectId) return;

        try {
          const systemData = await fetchSystemDetails(projectId);
          if (!systemData) return;

          // Load System Combiner Panel 1 data
          setSystemCombinerPanel1({
            isNew: !systemData.system_combiner_panel_1_make && !systemData.system_combiner_panel_1_model,
            selectedMake: systemData.system_combiner_panel_1_make || "",
            selectedModel: systemData.system_combiner_panel_1_model || "",
            selectedBusAmps: systemData.system_combiner_panel_1_amp_rating || "",
            selectedMainBreaker: systemData.system_combiner_panel_1_main_breaker || "mlo",
            selectedBreakerRating: systemData.system_combiner_panel_1_breakerrating || "",
          });

          // Load Post Combine BOS Type 1 data
          const type1LoadedData = {
            equipmentType: systemData.postcombine_1_1_equipment_type || "",
            make: systemData.postcombine_1_1_make || "",
            model: systemData.postcombine_1_1_model || "",
            ampRating: systemData.postcombine_1_1_amp_rating || "",
            isNew: systemData.postcombine_1_1_existing !== true,
          };
          console.log('[CombineBOS] Loaded Type 1 data:', type1LoadedData);
          setType1Data(type1LoadedData);

          // Load Post Combine BOS Type 2 data
          const type2LoadedData = {
            equipmentType: systemData.postcombine_2_1_equipment_type || "",
            make: systemData.postcombine_2_1_make || "",
            model: systemData.postcombine_2_1_model || "",
            ampRating: systemData.postcombine_2_1_amp_rating || "",
            isNew: systemData.postcombine_2_1_existing !== true,
          };
          console.log('[CombineBOS] Loaded Type 2 data:', type2LoadedData);
          setType2Data(type2LoadedData);

          // Load Post Combine BOS Type 3 data
          const type3LoadedData = {
            equipmentType: systemData.postcombine_3_1_equipment_type || "",
            make: systemData.postcombine_3_1_make || "",
            model: systemData.postcombine_3_1_model || "",
            ampRating: systemData.postcombine_3_1_amp_rating || "",
            isNew: systemData.postcombine_3_1_existing !== true,
          };
          console.log('[CombineBOS] Loaded Type 3 data:', type3LoadedData);
          setType3Data(type3LoadedData);

          // Set visibility based on loaded data
          if (systemData.system_combiner_panel_1_make || systemData.system_combiner_panel_1_model) {
            console.log('[CombineBOS] Showing System Combiner Panel');
            setShowSystemCombinerPanel(true);
          }
          if (systemData.postcombine_1_1_equipment_type) {
            console.log('[CombineBOS] Showing Type 1 section');
            setShowType1(true);
          }
          if (systemData.postcombine_2_1_equipment_type) {
            console.log('[CombineBOS] Showing Type 2 section');
            setShowType2(true);
          }
          if (systemData.postcombine_3_1_equipment_type) {
            console.log('[CombineBOS] Showing Type 3 section');
            setShowType3(true);
          }
        } catch (error) {
          console.error("[CombineBOS] Error loading data:", error);
        }
      };

      loadData();
    }, [projectId])
  );

  // Fetch Max Continuous Output for both systems
  useEffect(() => {
    const loadMaxOutput = async () => {
      if (!projectId) return;

      setLoadingMaxOutput(true);
      try {
        const systemData = await fetchSystemDetails(projectId);
        if (!systemData) return;

        // Function to get max output for a system
        const getSystemMaxOutput = async (sysNum: number) => {
          const prefix = `sys${sysNum}`;
          const inverterMake = systemData[`${prefix}_micro_inverter_make`];
          const inverterModel = systemData[`${prefix}_micro_inverter_model`];
          const microInverterQty = systemData[`${prefix}_micro_inverter_qty`] || 0;
          const systemSelection = systemData[`${prefix}_selectedsystem`];

          if (inverterMake && inverterModel) {
            // Fetch inverter list by manufacturer
            const URL = `https://api.skyfireapp.io/api/inverters/models?manufacturer=${encodeURIComponent(inverterMake)}`;
            const response = await fetch(URL);
            const data = await response.json();

            if (data?.success && Array.isArray(data.data)) {
              const matchedInverter = data.data.find(
                (inv: any) =>
                  inv.model_number === inverterModel ||
                  inv.make_model === `${inverterMake} ${inverterModel}`
              );

              if (matchedInverter?.id) {
                // Fetch full details
                const detailURL = `https://api.skyfireapp.io/api/inverters/${matchedInverter.id}`;
                const detailResponse = await fetch(detailURL);
                const detailData = await detailResponse.json();

                if (detailData?.success && detailData.data) {
                  const amps = parseFloat(detailData.data.max_cont_output_amps) || 0;

                  // If microinverter, multiply by quantity. If inverter, use as-is
                  let finalAmps = amps;
                  if (systemSelection === "microinverter" && microInverterQty > 0) {
                    finalAmps = amps * microInverterQty;
                  }

                  return finalAmps ? Math.round(finalAmps) : null;
                }
              }
            }
          }
          return null;
        };

        // Load System 1 and System 2 max outputs
        const sys1Max = await getSystemMaxOutput(1);
        const sys2Max = await getSystemMaxOutput(2);

        setMaxContinuousOutputAmps1(sys1Max);
        setMaxContinuousOutputAmps2(sys2Max);

        // Load System 1 BOS equipment types
        setSys1BosType1(systemData.bos_sys1_type1_equipment_type || "");
        setSys1BosType2(systemData.bos_sys1_type2_equipment_type || "");
        setSys1BosType3(systemData.bos_sys1_type3_equipment_type || "");
      } catch (error) {
        console.error(`[BOS] Error loading max output:`, error);
      } finally {
        setLoadingMaxOutput(false);
      }
    };

    loadMaxOutput();
  }, [projectId]);

  // Save System Combiner Panel to database
  const saveCombinerPanel = async (data: typeof systemCombinerPanel1) => {
    if (!projectId) return;

    try {
      await saveSystemDetailsPartialExact(projectId, {
        system_combiner_panel_1_make: data.selectedMake || null,
        system_combiner_panel_1_model: data.selectedModel || null,
        system_combiner_panel_1_amp_rating: data.selectedBusAmps || null,
        system_combiner_panel_1_main_breaker: data.selectedMainBreaker || null,
        system_combiner_panel_1_breakerrating: data.selectedBreakerRating || null,
      });
    } catch (error) {
      console.error("[CombineBOS] Error saving combiner panel:", error);
    }
  };

  // Load models when make is selected
  useEffect(() => {
    if (systemCombinerPanel1.selectedMake) {
      setCombinerModels([]);
      combinerLoadModels();
    } else {
      setCombinerModels([]);
    }
  }, [systemCombinerPanel1.selectedMake]);

  // Auto-save System Combiner Panel when data changes
  useEffect(() => {
    if (showSystemCombinerPanel) {
      saveCombinerPanel(systemCombinerPanel1);
    }
  }, [systemCombinerPanel1, showSystemCombinerPanel]);

  // Save BOS Type data to database
  const saveType1Data = async (data: any) => {
    if (!projectId) return;

    console.log('[CombineBOS] saveType1Data called with:', data);

    try {
      const payload = {
        postcombine_1_1_equipment_type: data.equipmentType || null,
        postcombine_1_1_make: data.make || null,
        postcombine_1_1_model: data.model || null,
        postcombine_1_1_amp_rating: data.ampRating || null,
        postcombine_1_1_existing: !data.isNew,
        postcombine_1_1_position: 'POST COMBINE',
      };
      console.log('[CombineBOS] Saving Type 1 payload:', payload);
      await saveSystemDetailsPartialExact(projectId, payload);
      console.log('[CombineBOS] Type 1 saved successfully');
    } catch (error) {
      console.error("[CombineBOS] Error saving type 1:", error);
    }
  };

  const saveType2Data = async (data: any) => {
    if (!projectId) return;

    console.log('[CombineBOS] saveType2Data called with:', data);

    try {
      const payload = {
        postcombine_2_1_equipment_type: data.equipmentType || null,
        postcombine_2_1_make: data.make || null,
        postcombine_2_1_model: data.model || null,
        postcombine_2_1_amp_rating: data.ampRating || null,
        postcombine_2_1_existing: !data.isNew,
        postcombine_2_1_position: 'POST COMBINE',
      };
      console.log('[CombineBOS] Saving Type 2 payload:', payload);
      await saveSystemDetailsPartialExact(projectId, payload);
      console.log('[CombineBOS] Type 2 saved successfully');
    } catch (error) {
      console.error("[CombineBOS] Error saving type 2:", error);
    }
  };

  const saveType3Data = async (data: any) => {
    if (!projectId) return;

    console.log('[CombineBOS] saveType3Data called with:', data);

    try {
      const payload = {
        postcombine_3_1_equipment_type: data.equipmentType || null,
        postcombine_3_1_make: data.make || null,
        postcombine_3_1_model: data.model || null,
        postcombine_3_1_amp_rating: data.ampRating || null,
        postcombine_3_1_existing: !data.isNew,
        postcombine_3_1_position: 'POST COMBINE',
      };
      console.log('[CombineBOS] Saving Type 3 payload:', payload);
      await saveSystemDetailsPartialExact(projectId, payload);
      console.log('[CombineBOS] Type 3 saved successfully');
    } catch (error) {
      console.error("[CombineBOS] Error saving type 3:", error);
    }
  };

  // Update handlers for BOS types with database persistence
  const updateType1 = {
    visibility: {
      showType1: (val: boolean) => setShowType1(val),
      showType2: (val: boolean) => setShowType2(val),
      showType3: (val: boolean) => setShowType3(val),
    },
    type1: {
      equipmentType: (val: string) => {
        const newData = { ...type1Data, equipmentType: val };
        setType1Data(newData);
        saveType1Data(newData);
      },
      make: (val: string) => {
        const newData = { ...type1Data, make: val };
        setType1Data(newData);
        saveType1Data(newData);
      },
      model: (val: string) => {
        const newData = { ...type1Data, model: val };
        setType1Data(newData);
        saveType1Data(newData);
      },
      ampRating: (val: string) => {
        const newData = { ...type1Data, ampRating: val };
        setType1Data(newData);
        saveType1Data(newData);
      },
      isNew: (val: boolean) => {
        const newData = { ...type1Data, isNew: val };
        setType1Data(newData);
        saveType1Data(newData);
      },
    },
  };

  const updateType2 = {
    visibility: {
      showType1: (val: boolean) => setShowType1(val),
      showType2: (val: boolean) => setShowType2(val),
      showType3: (val: boolean) => setShowType3(val),
    },
    type2: {
      equipmentType: (val: string) => {
        const newData = { ...type2Data, equipmentType: val };
        setType2Data(newData);
        saveType2Data(newData);
      },
      make: (val: string) => {
        const newData = { ...type2Data, make: val };
        setType2Data(newData);
        saveType2Data(newData);
      },
      model: (val: string) => {
        const newData = { ...type2Data, model: val };
        setType2Data(newData);
        saveType2Data(newData);
      },
      ampRating: (val: string) => {
        const newData = { ...type2Data, ampRating: val };
        setType2Data(newData);
        saveType2Data(newData);
      },
      isNew: (val: boolean) => {
        const newData = { ...type2Data, isNew: val };
        setType2Data(newData);
        saveType2Data(newData);
      },
    },
  };

  const updateType3 = {
    visibility: {
      showType1: (val: boolean) => setShowType1(val),
      showType2: (val: boolean) => setShowType2(val),
      showType3: (val: boolean) => setShowType3(val),
    },
    type3: {
      equipmentType: (val: string) => {
        const newData = { ...type3Data, equipmentType: val };
        setType3Data(newData);
        saveType3Data(newData);
      },
      make: (val: string) => {
        const newData = { ...type3Data, make: val };
        setType3Data(newData);
        saveType3Data(newData);
      },
      model: (val: string) => {
        const newData = { ...type3Data, model: val };
        setType3Data(newData);
        saveType3Data(newData);
      },
      ampRating: (val: string) => {
        const newData = { ...type3Data, ampRating: val };
        setType3Data(newData);
        saveType3Data(newData);
      },
      isNew: (val: boolean) => {
        const newData = { ...type3Data, isNew: val };
        setType3Data(newData);
        saveType3Data(newData);
      },
    },
  };

  return (
    <LinearGradient {...BLUE_MD_TB} style={styles.container}>
      <LargeHeader
        title="Combine BOS"
        name={
          project?.details?.customer_last_name &&
          project?.details?.customer_first_name
            ? `${project.details.customer_last_name}, ${project.details.customer_first_name}`
            : undefined
        }
        addressLines={
          project?.site
            ? [
                project.site.address || "",
                [project.site.city, project.site.state, project.site.zip_code]
                  .filter(Boolean)
                  .join(", "),
              ]
            : undefined
        }
        projectId={project?.details?.installer_project_id}
        onDrawerPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* 1) Note header */}
          <TouchableOpacity
            style={styles.noteHeader}
            activeOpacity={0.7}
            onPress={() => setShowNote((v) => !v)}
          >
            <Image source={flameIcon} style={styles.flameIcon} />
            <Text style={styles.noteLabel}>Note</Text>
          </TouchableOpacity>

          {showNote && (
            <>
              <Text style={styles.noteText}>
                Utility required BOS, if any, will auto populate here.
              </Text>
              <Text style={styles.noteText}>
                If you are NOT combining System 1 and System 2:{"\n"}
                BOS Equipment entered here will be sized to protect System 1 max continuous output current.
              </Text>
              <Text style={styles.noteText}>
                If you ARE combining System 1 and System 2:{"\n"}
                BOS Equipment entered here will be sized to protect System 1 and System 2 max continuous output current.
              </Text>
            </>
          )}

          {/* Max Continuous Output Display */}
          <View style={styles.maxOutputContainer}>
            {loadingMaxOutput ? (
              <ActivityIndicator size="small" color="#FD7332" />
            ) : (
              <>
                <View style={styles.maxOutputRow}>
                  <Text style={styles.maxOutputLabel}>Sys 1 Max Cont. Isc (125%):</Text>
                  <Text style={styles.maxOutputValue}>
                    {maxContinuousOutputAmps1 !== null ? `${(maxContinuousOutputAmps1 * 1.25).toFixed(1)} Amps` : 'N/A'}
                  </Text>
                </View>
                <View style={styles.maxOutputRow}>
                  <Text style={styles.maxOutputLabel}>Sys 2 Max Cont. Isc (125%):</Text>
                  <Text style={styles.maxOutputValue}>
                    {maxContinuousOutputAmps2 !== null ? `${(maxContinuousOutputAmps2 * 1.25).toFixed(1)} Amps` : 'N/A'}
                  </Text>
                </View>
                <View style={styles.maxOutputRow}>
                  <Text style={styles.maxOutputLabel}>Combined Max Cont. Isc (125%):</Text>
                  <Text style={styles.maxOutputValue}>
                    {totalMaxContinuousOutput > 0 ? `${(totalMaxContinuousOutput * 1.25).toFixed(1)} Amps` : 'N/A'}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* 3) System Combiner Panel button or section */}
          {!showSystemCombinerPanel ? (
            <View style={styles.buttonsRow}>
              <SystemButton
                label="System Combiner Panel"
                active={false}
                onPress={() => {
                  setShowSystemCombinerPanel(true);
                }}
                style={styles.button}
              />
            </View>
          ) : (
            <SystemCombinerPanelSection
              values={systemCombinerPanel1}
              onChange={(field, value) => {
                setSystemCombinerPanel1((prev) => ({ ...prev, [field]: value }));
              }}
              errors={{}}
              label="System Combiner Panel 1"
              makes={combinerMakes}
              models={combinerModels}
              loadMakes={combinerLoadMakes}
              loadModels={combinerLoadModels}
              loadingMakes={combinerLoadingMakes}
              loadingModels={combinerLoadingModels}
            />
          )}

          {/* 4) Combine BOS Type-1 button or full Type-1 form */}
          {!showType1 ? (
            <View style={styles.buttonsRow}>
              <SystemButton
                label="Combine BOS Type 1"
                active={false}
                onPress={() => {
                  setShowType1(true);
                  setShowType2(false);
                  setShowType3(false);
                }}
                style={styles.button}
              />
            </View>
          ) : (
            <Sys1BOSType1
              type1={type1Data}
              update={updateType1}
              onCancel={() => {
                setShowType1(false);
                setShowType2(false);
                setShowType3(false);
              }}
              onNext={() => {
                setShowType2(true);
                setShowType3(false);
              }}
              hideNext={showType2}
              projectId={projectId}
              companyId={companyId}
              maxContinuousOutputAmps={totalMaxContinuousOutput > 0 ? totalMaxContinuousOutput : null}
              customTitle="Combine BOS Type 1"
            />
          )}

          {/* 4) Type-2 section */}
          {showType2 && (
            <View style={styles.type2Container}>
              <Sys1BOSType2
                type2={type2Data}
                update={updateType2}
                onCancel={() => {
                  setShowType2(false);
                  setShowType3(false);
                }}
                onNext={() => setShowType3(true)}
                hideNext={showType3}
                projectId={projectId}
                companyId={companyId}
                maxContinuousOutputAmps={totalMaxContinuousOutput > 0 ? totalMaxContinuousOutput : null}
                customTitle="Combine BOS Type 2"
              />
            </View>
          )}

          {/* 5) Type-3 section */}
          {showType3 && (
            <View style={styles.type3Container}>
              <Sys1BOSType3
                type3={type3Data}
                update={updateType3}
                onCancel={() => setShowType3(false)}
                projectId={projectId}
                companyId={companyId}
                maxContinuousOutputAmps={totalMaxContinuousOutput > 0 ? totalMaxContinuousOutput : null}
                customTitle="Combine BOS Type 3"
              />
            </View>
          )}

        </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  flameIcon: {
    width: 24,
    height: 24,
  },
  noteLabel: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
  },
  noteText: {
    color: "#FFF",
    fontSize: 20,
    lineHeight: 22,
    marginBottom: 12,
  },
  sectionLabel: {
    color: "#FFF",
    fontSize: 20,
    marginVertical: 8,
  },
  maxOutputContainer: {
    alignItems: "center",
    marginVertical: 16,
    gap: 8,
  },
  maxOutputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  maxOutputLabel: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
  maxOutputValue: {
    color: "#FD7332",
    fontSize: 18,
    fontWeight: "700",
  },
  buttonsRow: {
    marginVertical: 6,
    width: "100%",
  },
  button: {
    width: "100%",
    height: verticalScale(40),
  },
  type2Container: {
    marginTop: 6,
  },
  type3Container: {
    marginTop: 6,
  },
  combinerPanelContainer: {
    width: "100%",
    marginVertical: 4,
    backgroundColor: "transparent",
  },
  combinerPanelCollapsed: {
    borderWidth: 2,
    borderColor: "#6B7280",
    borderRadius: 8,
    marginBottom: 6,
    marginTop: 14,
    paddingVertical: 3,
  },
  combinerPanelCollapsedDirty: {
    borderColor: "#FD7332",
  },
  combinerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 7,
    paddingHorizontal: 20,
    minHeight: 45,
    backgroundColor: "transparent",
    marginTop: -14,
  },
  combinerHeaderTouchable: {
    flex: 1,
  },
  combinerHeaderText: {
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "600",
    marginTop: 4,
    marginLeft: -20,
  },
  combinerIcon: {
    width: moderateScale(30),
    height: moderateScale(30),
    resizeMode: "contain",
    tintColor: "#FD7332",
    marginLeft: 12,
  },
  combinerFieldContainer: {
    width: moderateScale(160),
  },
  combinerBody: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: "transparent",
  },
});
