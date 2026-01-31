// src/screens/Project/electrical/sections/System1BOSSection.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import CollapsibleSectionSimple from "../../../../components/UI/CollapsibleSectionSimple";
import SystemButton from "../../../../components/Button/SystemButton";
import BOSType1Section from "../../SystemDetails/sections/BOSType1Section";
import BOSType2Section from "../../SystemDetails/sections/BOSType2Section";
import BOSType3Section from "../../SystemDetails/sections/BOSType3Section";
import { fetchSystemDetails } from "../../../../api/systemDetails.service";

const flameIcon = require("../../../../assets/Images/appIcon.png");

export interface System1BOSSectionProps {
  deviceLabel: string;
  type1: any;
  type2: any;
  type3: any;
  visibility: any;
  update: any;
  /** Called when Type-1 first gets activated (equipmentType chosen) */
  onType1Activate?: () => void;
  projectId?: string;
  companyId?: string;
  onOpenGallery?: (sectionLabel: string) => void;
  systemPrefix?: string;
  systemNumber?: number;
  equipmentType?: "microinverter" | "inverter";
  utilityAbbrev?: string;
}

export default function System1BOSSection({
  deviceLabel,
  type1,
  type2,
  type3,
  visibility,
  update,
  onType1Activate,
  projectId,
  companyId,
  onOpenGallery,
  systemPrefix = "sys1_",
  systemNumber = 1,
  equipmentType = "microinverter",
  utilityAbbrev,
}: System1BOSSectionProps) {
  // Use persisted visibility state, with local fallback
  const showType1 = visibility.showType1;
  const showType2 = visibility.showType2;
  const showType3 = visibility.showType3;
  const [showNote, setShowNote] = useState(true);

  // Max Continuous Output for this system
  const [maxContinuousOutputAmps, setMaxContinuousOutputAmps] = useState<number | null>(null);
  const [loadingMaxOutput, setLoadingMaxOutput] = useState(false);

  // Dynamic title based on system number
  const sectionTitle = `System ${systemNumber} BOS`;

  // Debug logging for utility abbreviation
  console.log(`[Combined BOS sys${systemNumber}] utilityAbbrev:`, utilityAbbrev);

  // Dynamic note text based on equipment type
  const isMicroinverter = equipmentType === "microinverter";
  const equipmentName = isMicroinverter ? "Microinverter" : "Inverter";

  const noteText1 = isMicroinverter
    ? "Utility required BOS, if any, will auto‐populate in the Combined System BOS section below."
    : "Utility required BOS, if any will auto-populate.";

  const noteText2 = `Any BOS entered in this section will be sized to System ${systemNumber} max continuous output current and will be located between the ${equipmentName}${isMicroinverter ? ' Combiner Panel' : ''} and any SMS or System Combiner Panel.`;

  // Fetch Max Continuous Output for this system
  useEffect(() => {
    const loadMaxOutput = async () => {
      if (!projectId || !systemNumber) return;

      setLoadingMaxOutput(true);
      try {
        const systemData = await fetchSystemDetails(projectId);
        if (!systemData) return;

        const prefix = `sys${systemNumber}`;
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

                setMaxContinuousOutputAmps(finalAmps ? Math.round(finalAmps) : null);
              }
            }
          }
        }
      } catch (error) {
        console.error(`[BOS] Error loading max output for System ${systemNumber}:`, error);
      } finally {
        setLoadingMaxOutput(false);
      }
    };

    loadMaxOutput();
  }, [projectId, systemNumber]);

  return (
    <CollapsibleSectionSimple
      title={sectionTitle}
      initiallyExpanded
      isDirty={false}
      isRequiredComplete={false}
    >
      <ScrollView contentContainerStyle={styles.container} nestedScrollEnabled>
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
              {noteText1}
            </Text>
            <Text style={styles.noteText}>
              {noteText2}
            </Text>
          </>
        )}

        {/* Max Continuous Output Display */}
        <View style={styles.maxOutputContainer}>
          <Text style={styles.maxOutputLabel}>Max Continuous Output:</Text>
          {loadingMaxOutput ? (
            <ActivityIndicator size="small" color="#FD7332" style={styles.maxOutputLoader} />
          ) : maxContinuousOutputAmps !== null ? (
            <Text style={styles.maxOutputValue}>{maxContinuousOutputAmps} Amps</Text>
          ) : (
            <Text style={styles.maxOutputValue}>N/A</Text>
          )}
        </View>

        {/* 2) Equipment labels */}
        <Text style={styles.sectionLabel}>
          Equipment will flow in order from Top to Bottom:
        </Text>
        <Text style={styles.sectionLabel}>Solar Panel {systemNumber}</Text>
        <Text style={styles.sectionLabel}>{deviceLabel}</Text>
        {isMicroinverter && (
          <Text style={styles.sectionLabel}>String Combiner Panel {systemNumber}</Text>
        )}

        {/* 3) Type-1 button or full Type-1 form */}
        {!showType1 ? (
          <View style={styles.buttonsRow}>
            <SystemButton
              label="BOS Type 1"
              active={false}
              onPress={() => {
                update.visibility.showType1(true);
                update.visibility.showType2(false);
                update.visibility.showType3(false);
              }}
              style={styles.button}
            />
          </View>
        ) : type1.equipmentType === 'SMS' ? null : (
          <BOSType1Section
            values={{
              isNew: type1.isNew,
              equipmentType: type1.equipmentType,
              ampRating: type1.ampRating,
              make: type1.make,
              model: type1.model,
            }}
            onChange={(field, val) => {
              if (field === 'isNew') update.type1.isNew(val);
              else if (field === 'equipmentType') update.type1.equipmentType(val);
              else if (field === 'ampRating') update.type1.ampRating(val);
              else if (field === 'make') update.type1.make(val);
              else if (field === 'model') update.type1.model(val);
            }}
            label={`Post-Combine BOS Type 1 ${systemNumber}`}
            maxContinuousOutputAmps={maxContinuousOutputAmps}
            loadingMaxOutput={false}
            onRemove={() => {
              update.visibility.showType1(false);
              update.visibility.showType2(false);
              update.visibility.showType3(false);
            }}
            showAddBOSType2Button={!showType2}
            onAddBOSType2={() => {
              update.visibility.showType2(true);
              update.visibility.showType3(false);
            }}
            errors={{}}
            utilityAbbrev={utilityAbbrev}
          />
        )}

        {/* 4) Type-2 section (skip if SMS) */}
        {showType2 && type2.equipmentType !== 'SMS' && (
          <BOSType2Section
            values={{
              isNew: type2.isNew,
              equipmentType: type2.equipmentType,
              ampRating: type2.ampRating,
              make: type2.make,
              model: type2.model,
            }}
            onChange={(field, val) => {
              if (field === 'isNew') update.type2.isNew(val);
              else if (field === 'equipmentType') update.type2.equipmentType(val);
              else if (field === 'ampRating') update.type2.ampRating(val);
              else if (field === 'make') update.type2.make(val);
              else if (field === 'model') update.type2.model(val);
            }}
            label={`Post-Combine BOS Type 2 ${systemNumber}`}
            maxContinuousOutputAmps={maxContinuousOutputAmps}
            loadingMaxOutput={false}
            onRemove={() => {
              update.visibility.showType2(false);
              update.visibility.showType3(false);
            }}
            showAddBOSType3Button={!showType3}
            onAddBOSType3={() => update.visibility.showType3(true)}
            errors={{}}
            utilityAbbrev={utilityAbbrev}
          />
        )}

        {/* 5) Type-3 section (skip if SMS) */}
        {showType3 && type3.equipmentType !== 'SMS' && (
          <BOSType3Section
            values={{
              isNew: type3.isNew,
              equipmentType: type3.equipmentType,
              ampRating: type3.ampRating,
              make: type3.make,
              model: type3.model,
            }}
            onChange={(field, val) => {
              if (field === 'isNew') update.type3.isNew(val);
              else if (field === 'equipmentType') update.type3.equipmentType(val);
              else if (field === 'ampRating') update.type3.ampRating(val);
              else if (field === 'make') update.type3.make(val);
              else if (field === 'model') update.type3.model(val);
            }}
            label={`Post-Combine BOS Type 3 ${systemNumber}`}
            maxContinuousOutputAmps={maxContinuousOutputAmps}
            loadingMaxOutput={false}
            onRemove={() => update.visibility.showType3(false)}
            errors={{}}
            utilityAbbrev={utilityAbbrev}
          />
        )}

        {/* 6) Footer label */}
        <Text style={styles.sectionLabel}>
          System Combiner Panel or Point of Interconnection
        </Text>
      </ScrollView>
    </CollapsibleSectionSimple>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 0,
    gap: 12,
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    marginVertical: 0,
  },
  maxOutputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
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
  maxOutputLoader: {
    marginLeft: 8,
  },
  buttonsRow: {
    marginVertical: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  type2Container: {
    // no extra styles; Sys1BOSType2 overrides internally
  },
  type3Container: {
    // no extra styles; Sys1BOSType3 overrides internally
  },
});
