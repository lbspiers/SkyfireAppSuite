import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import AppHeader from "../../components/Header/AppHeader";
import TextInputField from "../../components/TextInput";
import DropdownComponent from "../../components/Dropdown";
import CollapsibleSection from "../../components/UI/CollapsibleSection";
import NewExistingToggle from "../../components/NewExistingToggle";


const sampleData = [
  { label: "Option 1", value: "1" },
  { label: "Option 2", value: "2" },
  { label: "Option 3", value: "3" },
];

// Only "make" is required in Section 1, only "dropdown1" is required in Section 2
const requiredSection1Fields = ["make"];
const requiredSection2Fields = ["dropdown1"];

const SandboxScreen: React.FC = () => {
  const [make, setMake] = useState("");
  const [description, setDescription] = useState("");
  const [dropdown1, setDropdown1] = useState<string | null>(null);

  const [section1IsNew, setSection1IsNew] = useState(true);
  const [section2IsNew, setSection2IsNew] = useState(true);

  // Section 1 clear logic
  const clearSection1 = () => {
    setMake("");
    setDescription("");
    setSection1IsNew(true);
  };

  // Section 2 clear logic
  const clearSection2 = () => {
    setDropdown1(null);
    setSection2IsNew(true);
  };

  // --- DIRTY LOGIC ---
  const isSection1Dirty = make.trim() !== "" || description.trim() !== "";
  const isSection2Dirty = dropdown1 !== null && dropdown1 !== "";

  // --- REQUIRED COMPLETE LOGIC ---
  const fieldValues = { make, description, dropdown1 };
  const areFieldsComplete = (fields: string[], values: Record<string, any>) =>
    fields.every((field) => {
      const val = values[field];
      return val !== null && val !== undefined && String(val).trim() !== "";
    });

  const isSection1RequiredComplete = areFieldsComplete(
    requiredSection1Fields,
    fieldValues
  );
  const isSection2RequiredComplete = areFieldsComplete(
    requiredSection2Fields,
    fieldValues
  );

  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Sandbox" />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Section One with 30 paddingTop */}
          <View style={{ paddingTop: 30 }}>
            <CollapsibleSection
              title="Section One"
              initiallyExpanded
              isDirty={isSection1Dirty}
              isRequiredComplete={isSection1RequiredComplete}
            >
              <View style={styles.sectionContent}>
                {/* Row: Toggle + Trashcan */}
                <View style={styles.toggleRow}>
                  <NewExistingToggle
                    isNew={section1IsNew}
                    onToggle={setSection1IsNew}
                    style={{ marginLeft: 0, marginTop: 0 }}
                  />
                  <TouchableOpacity
                    onPress={clearSection1}
                    style={styles.clearBtn}
                  >
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>

                <TextInputField
                  label="Make*"
                  placeholder="Select Manufacturer"
                  value={make}
                  onChangeText={setMake}
                  widthPercent={100}
                  errorText={make ? undefined : "Required"}
                />
                <TextInputField
                  label="Description"
                  placeholder="Enter description…"
                  value={description}
                  onChangeText={setDescription}
                  widthPercent={100}
                />
              </View>
            </CollapsibleSection>
          </View>

          {/* Section Two */}
          <CollapsibleSection
            title="Section Two"
            initiallyExpanded
            isDirty={isSection2Dirty}
            isRequiredComplete={isSection2RequiredComplete}
          >
            <View style={styles.sectionContent}>
              <View style={styles.toggleRow}>
                <NewExistingToggle
                  isNew={section2IsNew}
                  onToggle={setSection2IsNew}
                  style={{ marginLeft: 0, marginTop: 0 }}
                />
                <TouchableOpacity
                  onPress={clearSection2}
                  style={styles.clearBtn}
                >
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              </View>

              <DropdownComponent
                label="Sample Dropdown*"
                data={sampleData}
                value={dropdown1}
                onChange={setDropdown1}
                widthPercent={100}
                errorText={dropdown1 ? undefined : "Required"}
              />
            </View>
          </CollapsibleSection>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default SandboxScreen;

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  sectionContent: {
    paddingHorizontal: 0,
    width: "100%",
    alignItems: "stretch",
    gap: 8,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8, // adds spacing below the row
  },
  clearBtn: {
    marginLeft: 14,
  },
  clearText: {
    color: "#FD7332",
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "Lato-Bold",
  },
});
