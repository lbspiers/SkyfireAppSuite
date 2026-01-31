import React, { useState, useRef, useCallback, useEffect } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useSelector } from "react-redux";
import CollapsibleSection from "../../../../components/UI/CollapsibleSection";
import Button from "../../../../components/Button";
import InlineCustomStringing from "../../../../components/sections/InlineCustomStringing";
import { StringingConfiguration } from "../hooks/useEquipmentDetails";
import axiosInstance from "../../../../api/axiosInstance";
import apiEndpoints from "../../../../config/apiEndPoint";
import {
  moderateScale,
  verticalScale,
  widthPercentageToDP as wp,
} from "../../../../utils/responsive";

interface StringingSelectionSectionProps {
  value: "auto" | "custom" | "";
  onChange: (value: "auto" | "custom" | "") => void;
  errors?: { [key: string]: string };
  // Inverter data for custom stringing
  inverterMake?: string;
  inverterModel?: string;
  solarPanelQuantity?: number;
  stringingConfiguration?: StringingConfiguration;
  onStringingConfigurationChange?: (config: StringingConfiguration) => void;
}

const stringingTypes = [
  { label: "Auto", value: "auto" as const },
  { label: "Custom", value: "custom" as const },
];

const StringingSelectionSection: React.FC<StringingSelectionSectionProps> = ({
  value,
  onChange,
  errors = {},
  inverterMake = "",
  inverterModel = "",
  solarPanelQuantity = 0,
  stringingConfiguration,
  onStringingConfigurationChange,
}) => {
  const [inverterSpecs, setInverterSpecs] = useState<any>(null);
  const [loadingSpecs, setLoadingSpecs] = useState(false);

  // Default to "auto" if no value provided
  const currentValue = value || "auto";
  const isDirty = !!currentValue;
  const isRequiredComplete = !!currentValue;

  const buttonWidth = wp("44%"); // 44% of screen width for each button (with gap)

  // Initialize with "auto" on first render if no value
  useEffect(() => {
    if (!value) {
      onChange("auto");
    }
  }, [value, onChange]);

  // Fetch inverter specifications for custom stringing
  const fetchInverterSpecifications = async (make: string, model: string) => {
    try {
      const URL = `${
        apiEndpoints.BASE_URL
      }/api/inverters/models?manufacturer=${encodeURIComponent(make)}`;
      const response = await axiosInstance.get(URL);

      if (response?.data?.success && Array.isArray(response.data.data)) {
        const modelData = response.data.data.find((item: any) => {
          return (
            item.model_number === model ||
            item.name === model ||
            item.model === model ||
            item.label === model ||
            item.value === model ||
            (item.make_model && item.make_model.includes(model))
          );
        });

        if (modelData?.max_strings_branches) {
          return {
            max_strings_branches: modelData.max_strings_branches,
            id: modelData.id,
            make_model: modelData.make_model || `${make} ${model}`,
          };
        }
      }

      return { max_strings_branches: 3 };
    } catch (error) {
      console.error(
        `🔧 [STRINGING] Error fetching inverter specs for ${make} ${model}:`,
        error
      );
      return { max_strings_branches: 3 };
    }
  };

  // Handle custom selection - fetch specs if needed
  const handleCustomSelection = async () => {
    onChange("custom");

    if (inverterMake && inverterModel) {
      setLoadingSpecs(true);
      try {
        const specs = await fetchInverterSpecifications(inverterMake, inverterModel);
        setInverterSpecs(specs);
      } catch (error) {
        setInverterSpecs({ max_strings_branches: 3 });
      } finally {
        setLoadingSpecs(false);
      }
    } else {
      setInverterSpecs({ max_strings_branches: 3 });
    }
  };

  // Clear custom stringing when switching to auto
  const handleAutoSelection = () => {
    onChange("auto");
    setInverterSpecs(null);
    if (onStringingConfigurationChange) {
      onStringingConfigurationChange(null as any);
    }
  };

  return (
    <CollapsibleSection
      title="Stringing"
      initiallyExpanded={false}
      isDirty={isDirty}
      isRequiredComplete={isRequiredComplete}
      renderCamera={false}
    >
      <View style={styles.sectionContent}>
        {/* Label */}
        <View style={styles.labelRow}>
          <Text style={styles.labelText}>Choose System Stringing</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <Button
            title="Auto"
            onPress={handleAutoSelection}
            selected={currentValue === "auto"}
            width={buttonWidth}
            style={{ marginRight: moderateScale(10) }}
          />
          <Button
            title="Custom"
            onPress={handleCustomSelection}
            selected={currentValue === "custom"}
            width={buttonWidth}
          />
        </View>

        {/* Conditional Content Based on Selection */}
        {currentValue === "auto" ? (
          /* Auto Stringing Note */
          <Text style={styles.noteText}>
            Note: Stringing will auto size to distribute total Quantity in
            Solar Panel 1 and to stay within Manufacturer stringing
            requirements and limits.{"\n\n"}
            Must choose Combiner Panel to custom string branches.
          </Text>
        ) : currentValue === "custom" ? (
          /* Custom Stringing Interface */
          <View style={styles.customSection}>
            {inverterMake && inverterModel ? (
              <InlineCustomStringing
                inverterData={{
                  makeModel: `${inverterMake} ${inverterModel}`,
                  max_strings_branches: inverterSpecs?.max_strings_branches || 3,
                }}
                solarPanelQuantity={solarPanelQuantity}
                initialConfiguration={stringingConfiguration}
                autoDistribute={false}
                onUpdate={(config) => {
                  if (onStringingConfigurationChange) {
                    onStringingConfigurationChange(config);
                  }
                }}
              />
            ) : (
              <Text style={styles.warningText}>
                Please select an inverter make and model first to configure custom stringing.
              </Text>
            )}
          </View>
        ) : null}

        {errors.value ? <Text style={styles.error}>{errors.value}</Text> : null}
      </View>
    </CollapsibleSection>
  );
};

const styles = StyleSheet.create({
  sectionContent: {
    paddingHorizontal: 0,
    width: "100%",
    alignItems: "stretch",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(4),
    marginBottom: verticalScale(10),
  },
  labelText: {
    color: "#FFFFFF",
    fontSize: moderateScale(20),
    fontWeight: "700",
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginTop: verticalScale(10),
    marginBottom: verticalScale(30),
  },
  error: {
    color: "#FF3B30",
    marginTop: verticalScale(8),
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
  noteText: {
    color: "#fff",
    fontSize: moderateScale(18),
    lineHeight: moderateScale(22),
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
    fontStyle: "normal",
  },
  customSection: {
    marginTop: verticalScale(10),
  },
  warningText: {
    color: "#FFA500",
    fontSize: moderateScale(16),
    marginTop: verticalScale(10),
    fontStyle: "italic",
  },
});

export default StringingSelectionSection;