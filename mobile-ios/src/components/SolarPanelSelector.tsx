// src/components/SolarPanelSelector.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Dropdown from "./Dropdown";
import TextInput from "./TextInput";
import SolarPanelSpecsModal from "./SolarPanelSpecsModal";
import {
  getSolarPanelManufacturers,
  getSolarPanelModels,
} from "../api/solarPanel.service";
import { moderateScale, verticalScale } from "../utils/responsive";

interface ManufacturerOption {
  label: string;
  value: string;
}

interface ModelOption {
  label: string;
  value: string;
  id?: number;
  wattage?: number;
}

interface SolarPanelSelectorProps {
  value?: {
    manufacturer?: string;
    model?: string;
    modelId?: number;
    quantity?: string;
  };
  onChange: (value: {
    manufacturer?: string;
    model?: string;
    modelId?: number;
    quantity?: string;
  }) => void;
  disabled?: boolean;
}

const SolarPanelSelector: React.FC<SolarPanelSelectorProps> = ({
  value = {},
  onChange,
  disabled = false,
}) => {
  const [manufacturers, setManufacturers] = useState<ManufacturerOption[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loadingManufacturers, setLoadingManufacturers] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [specsModalVisible, setSpecsModalVisible] = useState(false);

  // Load manufacturers on mount
  useEffect(() => {
    loadManufacturers();
  }, []);

  // Load models when manufacturer changes
  useEffect(() => {
    if (value.manufacturer) {
      loadModels(value.manufacturer);
    } else {
      setModels([]);
    }
  }, [value.manufacturer]);

  const loadManufacturers = async () => {
    setLoadingManufacturers(true);
    try {
      const response = await getSolarPanelManufacturers();

      if (response?.status === 200 && response?.data?.success) {
        const manufacturerList = response.data.data || [];
        const formattedManufacturers = manufacturerList.map((item: any) => {
          if (typeof item === "string") {
            return { label: item, value: item };
          }
          return {
            label: item.manufacturer || item.name || item.label || "",
            value: item.manufacturer || item.name || item.value || "",
          };
        });
        setManufacturers(formattedManufacturers);
      } else {
        console.error("Failed to load manufacturers:", response?.data);
      }
    } catch (error) {
      console.error("Error loading manufacturers:", error);
    } finally {
      setLoadingManufacturers(false);
    }
  };

  const loadModels = async (manufacturer: string) => {
    setLoadingModels(true);
    try {
      const response = await getSolarPanelModels(manufacturer);

      if (response?.status === 200 && response?.data?.success) {
        const modelList = response.data.data || [];
        const formattedModels = modelList.map((item: any) => {
          const modelNumber = item.model_number || item.modelNumber || item.model || "";
          const wattage = item.nameplate_pmax || item.nameplatePmax || 0;
          const id = item.id;

          return {
            label: wattage ? `${modelNumber} (${wattage}W)` : modelNumber,
            value: modelNumber,
            id: id,
            wattage: wattage,
          };
        });
        setModels(formattedModels);
      } else {
        console.error("Failed to load models:", response?.data);
      }
    } catch (error) {
      console.error("Error loading models:", error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleManufacturerChange = (manufacturer: string) => {
    onChange({
      manufacturer,
      model: undefined,
      modelId: undefined,
      quantity: value.quantity,
    });
  };

  const handleModelChange = (model: string) => {
    const selectedModel = models.find((m) => m.value === model);
    onChange({
      manufacturer: value.manufacturer,
      model,
      modelId: selectedModel?.id,
      quantity: value.quantity,
    });
  };

  const handleQuantityChange = (quantity: string) => {
    onChange({
      manufacturer: value.manufacturer,
      model: value.model,
      modelId: value.modelId,
      quantity,
    });
  };

  const handleSpecsPress = () => {
    if (value.modelId) {
      setSpecsModalVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      {/* Manufacturer Dropdown */}
      <Dropdown
        label="Manufacturer*"
        data={manufacturers}
        value={value.manufacturer}
        onChange={handleManufacturerChange}
        loading={loadingManufacturers}
        disabled={disabled}
      />

      {/* Model Dropdown */}
      <Dropdown
        label="Model*"
        data={models}
        value={value.model}
        onChange={handleModelChange}
        loading={loadingModels}
        disabled={disabled || !value.manufacturer}
      />

      {/* Quantity and Specs Row */}
      <View style={styles.quantityRow}>
        <View style={styles.quantityInput}>
          <TextInput
            label="Quantity*"
            value={value.quantity || ""}
            onChangeText={handleQuantityChange}
            keyboardType="numeric"
            editable={!disabled}
          />
        </View>

        {value.model && value.modelId && (
          <TouchableOpacity
            style={styles.specsButton}
            onPress={handleSpecsPress}
            activeOpacity={0.7}
          >
            <Text style={styles.specsText}>Specs</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Specs Modal */}
      <SolarPanelSpecsModal
        visible={specsModalVisible}
        panelId={value.modelId || null}
        onClose={() => setSpecsModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    width: "100%",
    marginTop: verticalScale(8),
  },
  quantityInput: {
    width: moderateScale(180),
  },
  specsButton: {
    marginLeft: moderateScale(16),
    marginBottom: verticalScale(12),
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(12),
  },
  specsText: {
    color: "#FFB02E",
    fontSize: 16,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

export default SolarPanelSelector;
