// src/screens/Project/LoadCalculations/sections/AdditionalBreakersSection.tsx
import React from "react";
import {
  View,
  StyleSheet,
  Text,
  Image,
} from "react-native";
import CollapsibleSection from "../../../../components/UI/CollapsibleSection";
import TextInput from "../../../../components/TextInput";
import Dropdown from "../../../../components/Dropdown";
import Button from "../../../../components/Button";
import { moderateScale, verticalScale, widthPercentageToDP as wp } from "../../../../utils/responsive";
import { LOADCALCS_BREAKER_RATING_OPTIONS } from "../../../../utils/constants";

const flameIcon = require("../../../../assets/Images/appIcon.png");

export interface AdditionalLoad {
  id: string;
  name: string;
  amps: string;
}

interface AdditionalBreakersSectionProps {
  loads: AdditionalLoad[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: "name" | "amps", value: string) => void;
  errors: Record<string, string | undefined>;
}

export default function AdditionalBreakersSection({
  loads,
  onAdd,
  onRemove,
  onChange,
  errors,
}: AdditionalBreakersSectionProps) {
  const isDirty = loads.some((load) => load.name || load.amps);

  return (
    <>
      <CollapsibleSection
        title="2-Pole Breakers"
        initiallyExpanded={false}
        isDirty={!!isDirty}
        renderCamera={false}
      >
        <View style={styles.content}>
          {/* Note */}
          <View style={styles.noteContainer}>
            <View style={styles.noteHeader}>
              <Image source={flameIcon} style={styles.flameIcon} />
              <Text style={styles.noteLabel}>Note</Text>
            </View>
            <Text style={styles.noteText}>
              Enter all 2 pole breaker nameplate rating of the following:
              appliances that are fastened in place, permanently connected, or
              located to be on a specific circuit. Ranges, wall-mounted ovens,
              counter-mounted cooking units. Clothes dryers that are not
              connected to the laundry branch circuit specified and water
              heaters.
            </Text>
          </View>

          {/* Dynamic Load Table */}
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerText, styles.headerNameColumn]}>Load Type</Text>
              <Text style={[styles.headerText, styles.headerAmpsColumn]}>Breaker Rating</Text>
            </View>

            {/* Load Rows */}
            {loads.map((load, index) => (
              <View key={load.id} style={styles.loadRow}>
                {/* Name Input */}
                <View style={styles.nameInputWrapper}>
                  <TextInput
                    label=""
                    placeholder={`Load Type ${index + 1}`}
                    value={load.name}
                    onChangeText={(text) => onChange(load.id, "name", text)}
                    containerStyle={styles.nameInput}
                    errorText={errors[`load_${load.id}_name`]}
                    fieldId={`load_name_${load.id}`}
                  />
                </View>

                {/* Amps Column */}
                <View style={styles.ampsColumn}>
                  {/* Amps Dropdown */}
                  <View style={styles.ampsInputWrapper}>
                    <Dropdown
                      label=""
                      data={LOADCALCS_BREAKER_RATING_OPTIONS as any}
                      value={load.amps}
                      onChange={(val) => onChange(load.id, "amps", val)}
                      errorText={errors[`load_${load.id}_amps`]}
                    />
                  </View>
                </View>
              </View>
            ))}

            {/* Add Load Button */}
            <View style={styles.addButtonContainer}>
              <Button
                title="+ Add Load"
                onPress={onAdd}
                selected={false}
                width="100%"
                rounded={25}
                style={styles.addButton}
              />
            </View>
          </View>
        </View>
      </CollapsibleSection>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    width: "100%",
  },
  noteContainer: {
    marginBottom: verticalScale(20),
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(8),
  },
  flameIcon: {
    width: moderateScale(26),
    height: moderateScale(26),
    resizeMode: "contain",
    marginRight: moderateScale(8),
  },
  noteLabel: {
    fontSize: moderateScale(20),
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Lato-Bold",
  },
  noteText: {
    fontSize: moderateScale(18),
    lineHeight: moderateScale(22),
    color: "#FFFFFF",
    fontFamily: "Lato-Regular",
    marginBottom: verticalScale(10),
  },
  tableContainer: {
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(4),
  },
  headerText: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Lato-Bold",
  },
  headerNameColumn: {
    flex: 1.8,
    marginRight: moderateScale(8),
  },
  headerAmpsColumn: {
    flex: 1,
    marginRight: moderateScale(8),
  },
  headerSpacer: {
    width: moderateScale(32),
    flexShrink: 0,
  },
  loadRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginTop: -verticalScale(20),
  },
  nameInputWrapper: {
    flex: 1.8,
    marginRight: moderateScale(8),
    minWidth: moderateScale(120),
  },
  nameInput: {
    marginBottom: 0,
  },
  ampsColumn: {
    flex: 1,
    minWidth: moderateScale(80),
    position: "relative",
  },
  deleteButton: {
    position: "absolute",
    top: -moderateScale(2),
    right: 0,
    width: moderateScale(24),
    height: moderateScale(24),
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  ampsInputWrapper: {
    width: "100%",
  },
  ampsInput: {
    marginBottom: 0,
  },
  deleteIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
    resizeMode: "contain",
    tintColor: "#FD7332",
  },
  addButtonContainer: {
    marginTop: verticalScale(20),
    marginBottom: verticalScale(10),
    width: "100%",
  },
  addButton: {
    // Button component handles its own styling
  },
});
