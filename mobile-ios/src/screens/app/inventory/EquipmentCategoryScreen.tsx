// src/screens/app/inventory/EquipmentCategoryScreen.tsx

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import {
  useNavigation,
  useRoute,
  DrawerActions,
} from "@react-navigation/native";
import { useSelector } from "react-redux";
import SmallHeader from "../../../components/Header/SmallHeader";
import Dropdown from "../../../components/Dropdown";
import Button from "../../../components/Button";
import TextInput from "../../../components/TextInput";
import NumericKeypad from "../../../components/NumericKeypad";
import ConfirmRemoveEquipmentModal from "../../../components/Modals/ConfirmRemoveEquipmentModal";
import ConfirmSetDefaultEquipmentModal from "../../../components/Modals/ConfirmSetDefaultEquipmentModal";
import { SCROLL_PADDING } from "../../../styles/commonStyles";
import {
  getEquipmentManufacturers,
  getEquipmentModels,
  getEquipmentByMakeModel,
  getEquipmentTypeForCategory,
} from "../../../api/equipment.service";
import {
  getPreferredEquipment,
  createPreferredEquipment,
  deletePreferredEquipment,
  updatePreferredEquipment,
} from "../../../api/preferredEquipment.service";
import {
  getSolarPanelManufacturers,
  getSolarPanelModels,
} from "../../../api/solarPanel.service";
import { moderateScale, verticalScale } from "../../../utils/responsive";

const LIGHT = "#2E4161";
const DARK = "#0C1F3F";

interface SavedEquipment {
  id: number;
  uuid: string;
  make: string;
  makeLabel: string;
  model: string;
  modelLabel: string;
  is_default: boolean;
  expanded?: boolean;
  specs?: any;
  loadingSpecs?: boolean;
}

/**
 * Categories where model number is optional (make-only selection allowed)
 * These equipment types are sized based on system requirements
 */
const MODEL_OPTIONAL_CATEGORIES = ['ac-disconnects', 'pv-meters', 'load-centers'];

/**
 * Check if model is optional for the given category
 */
function isModelOptional(categoryId: string): boolean {
  return MODEL_OPTIONAL_CATEGORIES.includes(categoryId);
}

export default function EquipmentCategoryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const categoryId = route.params?.categoryId || "solar-panels";
  const categoryLabel = route.params?.categoryLabel || "Solar Panels";
  const passedCompanyId = route.params?.companyId; // Company ID from super user selection
  const passedCompanyName = route.params?.companyName; // Company name for super users

  // Check if model is optional for this category
  const modelOptional = isModelOptional(categoryId);

  // Get user and company info from Redux - try both Profile and profile keys
  const profileData = useSelector(
    (state: any) => state?.Profile || state?.profile
  );
  const profile = profileData?.profile;
  const companyData = profileData?.companyAddress;
  const auth = useSelector((state: any) => state?.auth);

  // Extract user data - profile.user object
  const user = profile?.user;
  const company = profile?.company;

  // Extract user ID - numeric ID first (for database), then UUID
  const userId =
    user?.id ||
    user?.userId ||
    user?.user_id ||
    user?.ID ||
    user?.uuid ||
    profile?.id ||
    profile?.userId ||
    profile?.user_id;

  // Use passed company ID (from super user selection) or extract from Redux
  let companyId = passedCompanyId;

  // If no company ID passed, extract from Redux
  if (!companyId) {
    companyId =
      company?.id ||
      company?.company_id ||
      company?.companyId ||
      companyData?.id ||
      companyData?.company_id ||
      profile?.company_id ||
      profile?.companyId ||
      company?.uuid;

    // If no company ID found in profile, try to decode it from JWT token
    if (!companyId && auth?.accessToken) {
      try {
        const token = auth.accessToken;
        const base64Payload = token.split(".")[1];
        const decodedPayload = JSON.parse(atob(base64Payload));
        companyId = decodedPayload.companyId || decodedPayload.company_id;
      } catch (jwtError) {
        console.error(
          "[EquipmentCategory] Failed to decode JWT token:",
          jwtError
        );
      }
    }
  }

  // Debug logging
  useEffect(() => {
    console.log("[EquipmentCategory] Profile data:", {
      hasProfile: !!profile,
      hasUser: !!user,
      hasCompany: !!company,
      hasCompanyData: !!companyData,
      hasAuth: !!auth,
      companyId,
      userId,
      companyIdType: typeof companyId,
      userIdType: typeof userId,
      profileKeys: profile ? Object.keys(profile) : [],
      userKeys: user ? Object.keys(user) : [],
      companyKeys: company ? Object.keys(company) : [],
      companyDataKeys: companyData ? Object.keys(companyData) : [],
      companyObject: company, // Show full company object
      userObject: user, // Show full user object
    });
  }, [profile, user, company, companyData, auth, companyId, userId]);

  const [makes, setMakes] = useState<Array<{ label: string; value: string }>>(
    []
  );
  const [models, setModels] = useState<
    Array<{ label: string; value: string; id?: number }>
  >([]);
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedMakeLabel, setSelectedMakeLabel] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedModelLabel, setSelectedModelLabel] = useState("");
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [savedEquipment, setSavedEquipment] = useState<SavedEquipment[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [savingEquipment, setSavingEquipment] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [equipmentToRemove, setEquipmentToRemove] =
    useState<SavedEquipment | null>(null);
  const [showDefaultModal, setShowDefaultModal] = useState(false);
  const [equipmentToSetDefault, setEquipmentToSetDefault] =
    useState<SavedEquipment | null>(null);

  // Watts filter state (only for solar panels)
  const [watts, setWatts] = useState("");
  const [tempWatts, setTempWatts] = useState("");
  const [wattsKeypadVisible, setWattsKeypadVisible] = useState(false);

  // Track if this is the initial mount to skip watts filter logic
  const isInitialMount = useRef(true);

  // Check if this is a solar panel category
  const isSolarPanel = categoryId === "solar-panels";

  // Sync tempWatts with watts when watts changes externally
  useEffect(() => setTempWatts(watts), [watts]);

  // Clear model selection when watts filter changes (skip on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (isSolarPanel) {
      console.log("[EquipmentCategory] Watts changed:", watts);
      // Clear model selection when watts changes (so user re-selects with new filter)
      setModels([]);
      setSelectedModel("");
      setSelectedModelLabel("");

      // If a manufacturer is already selected, reload models with new filter
      if (selectedMake) {
        loadModels();
      }
    }
  }, [watts]);

  // Load manufacturers
  const loadMakes = async () => {
    setLoadingMakes(true);
    try {
      let response;

      // Use solar panel API for solar panels (no pmax filter on manufacturers)
      if (isSolarPanel) {
        response = await getSolarPanelManufacturers();
      } else {
        const equipmentType = getEquipmentTypeForCategory(categoryId);
        response = await getEquipmentManufacturers(equipmentType);
      }

      if (response?.status === 200) {
        // Handle different response formats
        const manufacturers = response.data.data || response.data || [];
        console.log("[EquipmentCategory] Raw manufacturers data:", manufacturers.slice(0, 2)); // Log first 2 items
        const formatted = manufacturers.map((m: any) => {
          // Handle both string and object formats
          if (typeof m === "string") {
            return { label: m, value: m };
          }
          const label = m.manufacturer || m.manufacturerName || m.name || m.label || JSON.stringify(m);
          const value = m.manufacturer || m.manufacturerName || m.name || m.value || label;
          return { label, value };
        });
        setMakes(formatted);
        console.log(`[EquipmentCategory] Loaded ${formatted.length} manufacturers, first:`, formatted[0]);
      }
    } catch (error) {
      console.error("[EquipmentCategory] Error loading makes:", error);
      setMakes([]);
    } finally {
      setLoadingMakes(false);
    }
  };

  // Load models based on selected manufacturer
  const loadModels = async (manufacturer?: string) => {
    const make = manufacturer || selectedMake;
    if (!make) return;

    setLoadingModels(true);
    try {
      let response;

      // Use solar panel API for solar panels with optional pmax filter
      if (isSolarPanel) {
        const pmax = watts && watts.trim() !== "" ? parseInt(watts) : undefined;
        response = await getSolarPanelModels(make, pmax);

        const filterMsg = pmax ? ` at ${pmax}W` : '';
        console.log(`[EquipmentCategory] Loading solar panel models for ${make}${filterMsg}`);
      } else {
        const equipmentType = getEquipmentTypeForCategory(categoryId);
        response = await getEquipmentModels(equipmentType, make);
      }

      if (response?.status === 200) {
        // Handle different response formats
        const modelsList = response.data.data || response.data || [];
        console.log("[EquipmentCategory] Raw models data:", modelsList.slice(0, 2)); // Log first 2 items to see structure
        const formatted = modelsList.map((m: any) => {
          // Handle both string and object formats
          if (typeof m === "string") {
            return { label: m, value: m };
          }
          const label = m.model_number || m.modelNumber || m.model || m.label || m.name || JSON.stringify(m);
          const value = m.model_number || m.modelNumber || m.model || m.value || m.name || label;
          return {
            label,
            value,
            id: m.id,
          };
        });
        setModels(formatted);
        console.log(`[EquipmentCategory] Loaded ${formatted.length} models, first model:`, formatted[0]);
      }
    } catch (error) {
      console.error("[EquipmentCategory] Error loading models:", error);
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleMakeChange = (value: string) => {
    const label = makes.find((m) => m.value === value)?.label || value;
    setSelectedMake(value);
    setSelectedMakeLabel(label);
    setSelectedModel("");
    setSelectedModelLabel("");
    setModels([]);
    if (value) {
      loadModels(value);
    }
  };

  const handleModelChange = (value: string) => {
    const label = models.find((m) => m.value === value)?.label || value;
    setSelectedModel(value);
    setSelectedModelLabel(label);
  };

  // Load saved equipment on mount (backend will handle UUID-to-ID conversion)
  useEffect(() => {
    if (companyId && categoryId) {
      loadSavedEquipment();
    }
  }, [companyId, categoryId]);

  const loadSavedEquipment = async () => {
    if (!companyId) {
      console.error("[EquipmentCategory] No company ID available");
      return;
    }

    setLoadingEquipment(true);
    try {
      const response = await getPreferredEquipment(companyId, categoryId);
      if (response?.status === 200) {
        // Backend returns array directly, not wrapped in { success, data }
        const equipment = Array.isArray(response.data) ? response.data : [];
        const formatted = equipment.map((item: any) => ({
          id: item.id,
          uuid: item.uuid,
          make: item.make,
          makeLabel: item.make, // API stores display value
          model: item.model,
          modelLabel: item.model, // API stores display value
          is_default: item.is_default || false,
        }));
        setSavedEquipment(formatted);
        console.log(
          `[EquipmentCategory] Loaded ${formatted.length} equipment items`
        );
      }
    } catch (error) {
      console.error(
        "[EquipmentCategory] Error loading saved equipment:",
        error
      );
    } finally {
      setLoadingEquipment(false);
    }
  };

  const handleAdd = async () => {
    // For model-optional categories, only make is required
    // For other categories, both make and model are required
    if (!selectedMake || (!modelOptional && !selectedModel)) return;
    if (!companyId || !userId) {
      console.error("[EquipmentCategory] Missing company ID or user ID");
      return;
    }

    // Use "N/A" or empty string for model if not provided (model-optional categories)
    const modelValue = selectedModelLabel || "N/A";

    // Check for duplicates - prevent adding same make/model combination
    const isDuplicate = savedEquipment.some(
      (item) =>
        item.make === selectedMakeLabel &&
        (modelOptional ? item.make === selectedMakeLabel : item.model === modelValue)
    );

    if (isDuplicate) {
      console.warn("[EquipmentCategory] Duplicate equipment:", {
        make: selectedMakeLabel,
        model: modelValue,
      });

      const displayText = modelOptional
        ? `This equipment (${selectedMakeLabel}) has already been added to your preferred list.`
        : `This equipment (${selectedMakeLabel} - ${modelValue}) has already been added to your preferred list.`;

      Alert.alert(
        "Already Added",
        displayText,
        [{ text: "OK" }]
      );
      return;
    }

    setSavingEquipment(true);
    try {
      const response = await createPreferredEquipment({
        equipment_type: categoryId,
        make: selectedMakeLabel,
        model: modelValue,
        company_id: companyId,
        created_by: userId,
        is_default: false,
      });

      if (response?.status === 201) {
        // Backend returns the item directly, not wrapped in { success, data }
        const newItem = response.data;
        const formatted: SavedEquipment = {
          id: newItem.id,
          uuid: newItem.uuid,
          make: newItem.make,
          makeLabel: newItem.make,
          model: newItem.model,
          modelLabel: newItem.model,
          is_default: newItem.is_default || false,
        };
        setSavedEquipment([...savedEquipment, formatted]);
        console.log("[EquipmentCategory] Equipment added successfully");

        // Reset selections
        setSelectedMake("");
        setSelectedMakeLabel("");
        setSelectedModel("");
        setSelectedModelLabel("");
        setModels([]);
      } else {
        console.error(
          "[EquipmentCategory] Failed to add equipment:",
          response?.data
        );
      }
    } catch (error) {
      console.error("[EquipmentCategory] Error adding equipment:", error);
    } finally {
      setSavingEquipment(false);
    }
  };

  const handleDeleteClick = (equipment: SavedEquipment) => {
    setEquipmentToRemove(equipment);
    setShowRemoveModal(true);
  };

  const confirmDelete = async () => {
    if (!equipmentToRemove) return;

    try {
      const response = await deletePreferredEquipment(equipmentToRemove.uuid);
      if (response?.status === 200) {
        setSavedEquipment(
          savedEquipment.filter((item) => item.uuid !== equipmentToRemove.uuid)
        );
        console.log("[EquipmentCategory] Equipment deleted successfully");
        setShowRemoveModal(false);
        setEquipmentToRemove(null);
      } else {
        console.error(
          "[EquipmentCategory] Failed to delete equipment:",
          response?.data
        );
      }
    } catch (error) {
      console.error("[EquipmentCategory] Error deleting equipment:", error);
    }
  };

  const cancelDelete = () => {
    setShowRemoveModal(false);
    setEquipmentToRemove(null);
  };

  const handleClearSelections = () => {
    setSelectedMake("");
    setSelectedMakeLabel("");
    setSelectedModel("");
    setSelectedModelLabel("");
    setModels([]);
  };

  const handleDefaultCheckboxChange = (equipment: SavedEquipment) => {
    // If unchecking (currently default), just unset it
    if (equipment.is_default) {
      updateDefaultStatus(equipment.uuid, false);
      return;
    }

    // If checking (not currently default), check if another item is default
    const currentDefault = savedEquipment.find((item) => item.is_default && item.uuid !== equipment.uuid);

    if (currentDefault) {
      // Show modal to confirm changing default
      setEquipmentToSetDefault(equipment);
      setShowDefaultModal(true);
    } else {
      // No existing default, just set this one
      updateDefaultStatus(equipment.uuid, true);
    }
  };

  const confirmSetDefault = async () => {
    if (!equipmentToSetDefault) return;

    try {
      // First, unset the current default
      const currentDefault = savedEquipment.find((item) => item.is_default);
      if (currentDefault) {
        await updatePreferredEquipment(currentDefault.uuid, { is_default: false });
      }

      // Then set the new default
      const response = await updatePreferredEquipment(equipmentToSetDefault.uuid, { is_default: true });

      if (response?.status === 200) {
        // Update local state
        setSavedEquipment(
          savedEquipment.map((item) => ({
            ...item,
            is_default: item.uuid === equipmentToSetDefault.uuid,
          }))
        );
        console.log("[EquipmentCategory] Default equipment updated successfully");
      }

      setShowDefaultModal(false);
      setEquipmentToSetDefault(null);
    } catch (error) {
      console.error("[EquipmentCategory] Error updating default equipment:", error);
      Alert.alert("Error", "Failed to update default equipment", [{ text: "OK" }]);
    }
  };

  const cancelSetDefault = () => {
    setShowDefaultModal(false);
    setEquipmentToSetDefault(null);
  };

  const updateDefaultStatus = async (uuid: string, isDefault: boolean) => {
    try {
      const response = await updatePreferredEquipment(uuid, { is_default: isDefault });

      if (response?.status === 200) {
        // Update local state
        setSavedEquipment(
          savedEquipment.map((item) => ({
            ...item,
            is_default: item.uuid === uuid ? isDefault : (isDefault ? false : item.is_default),
          }))
        );
        console.log(`[EquipmentCategory] Default status updated: ${isDefault}`);
      }
    } catch (error) {
      console.error("[EquipmentCategory] Error updating default status:", error);
      Alert.alert("Error", "Failed to update default status", [{ text: "OK" }]);
    }
  };

  const toggleExpand = async (equipment: SavedEquipment) => {
    // If already expanded, just collapse
    if (equipment.expanded) {
      setSavedEquipment(
        savedEquipment.map((item) =>
          item.uuid === equipment.uuid ? { ...item, expanded: false } : item
        )
      );
      return;
    }

    // If not expanded and specs not loaded, fetch specs
    if (!equipment.specs) {
      // Set loading state
      setSavedEquipment(
        savedEquipment.map((item) =>
          item.uuid === equipment.uuid
            ? { ...item, loadingSpecs: true, expanded: true }
            : item
        )
      );

      try {
        const equipmentType = getEquipmentTypeForCategory(categoryId);
        console.log("[EquipmentCategory] Fetching specs for:", {
          equipmentType,
          make: equipment.makeLabel,
          model: equipment.modelLabel,
        });

        const response = await getEquipmentByMakeModel(
          equipmentType,
          equipment.makeLabel,
          equipment.modelLabel
        );

        console.log("[EquipmentCategory] Specs response:", {
          status: response?.status,
          hasSuccess: !!response?.data?.success,
          hasData: !!response?.data?.data,
          dataKeys: response?.data?.data ? Object.keys(response.data.data) : [],
        });

        if (response?.status === 200 && response?.data?.success) {
          const panelData = response.data.data;
          console.log("[EquipmentCategory] Loaded specs:", panelData);
          setSavedEquipment(
            savedEquipment.map((item) =>
              item.uuid === equipment.uuid
                ? {
                    ...item,
                    specs: panelData,
                    loadingSpecs: false,
                    expanded: true,
                  }
                : item
            )
          );
        } else {
          // Failed to load specs
          console.error("[EquipmentCategory] Specs load failed:", {
            status: response?.status,
            success: response?.data?.success,
            data: response?.data,
          });
          setSavedEquipment(
            savedEquipment.map((item) =>
              item.uuid === equipment.uuid
                ? { ...item, loadingSpecs: false, expanded: false }
                : item
            )
          );
          Alert.alert(
            "Error",
            "Failed to load equipment specifications",
            [{ text: "OK" }]
          );
        }
      } catch (error) {
        console.error("[EquipmentCategory] Error loading specs:", error);
        setSavedEquipment(
          savedEquipment.map((item) =>
            item.uuid === equipment.uuid
              ? { ...item, loadingSpecs: false, expanded: false }
              : item
          )
        );
        Alert.alert(
          "Error",
          "Failed to load equipment specifications",
          [{ text: "OK" }]
        );
      }
    } else {
      // Specs already loaded, just expand
      setSavedEquipment(
        savedEquipment.map((item) =>
          item.uuid === equipment.uuid ? { ...item, expanded: true } : item
        )
      );
    }
  };

  return (
    <LinearGradient
      colors={[LIGHT, DARK]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <SmallHeader
        title="Inventory"
        subtitle={passedCompanyName || undefined}
        onDrawerPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        {/* Equipment Type Label */}
        <Text style={styles.categoryTitle}>{categoryLabel}</Text>

        {/* Instruction Text */}
        <Text style={styles.instructionText}>
          Choose your preferred {categoryLabel.toLowerCase()} makes and models.
        </Text>

        {/* Clear Selections Button */}
        {(selectedMake || selectedModel) && (
          <View style={styles.clearButtonContainer}>
            <TouchableOpacity
              onPress={handleClearSelections}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Watts Filter - Only for Solar Panels */}
        {isSolarPanel && (
          <TouchableOpacity
            style={styles.wattsWrap}
            onPress={() => setWattsKeypadVisible(true)}
            activeOpacity={0.8}
          >
            <TextInput
              label="Watts"
              value={watts}
              editable
              showNumericKeypad={true}
              onNumericKeypadOpen={() => setWattsKeypadVisible(true)}
              showSoftInputOnFocus={false}
              onFocus={() => setWattsKeypadVisible(true)}
              onTouchEnd={() => setWattsKeypadVisible(true)}
              onChangeText={() => {}} // no-op (we edit via keypad)
            />
          </TouchableOpacity>
        )}

        {/* Manufacturer Dropdown */}
        <Dropdown
          label="Make"
          data={makes}
          value={selectedMake}
          onOpen={loadMakes}
          loading={loadingMakes}
          onChange={handleMakeChange}
        />

        {/* Model Dropdown */}
        <Dropdown
          label={modelOptional ? "Model (Optional)" : "Model"}
          data={models}
          value={selectedModel}
          onOpen={() => loadModels()}
          loading={loadingModels}
          disabled={!selectedMake || loadingModels}
          onChange={handleModelChange}
        />

        {/* Add Button */}
        <Button
          title="+ Add"
          onPress={handleAdd}
          width="100%"
          height={45}
          rounded={40}
          selected={modelOptional ? !!selectedMake : (selectedMake && selectedModel ? true : false)}
          deactivated={modelOptional ? !selectedMake : (!selectedMake || !selectedModel)}
          disabled={modelOptional ? !selectedMake : (!selectedMake || !selectedModel)}
          style={styles.addButton}
        />

        {/* Preferred Equipment Section - Always Visible */}
        <View style={styles.savedSection}>
          {/* Label above separator */}
          <Text style={styles.sectionLabel}>Preferred Equipment</Text>

          {/* Orange separator */}
          <LinearGradient
            colors={["#FD7332", "#B92011"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.separator}
          />

          {/* Empty State or Equipment List */}
          {loadingEquipment ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#FD7332" />
              <Text style={styles.loadingText}>Loading equipment...</Text>
            </View>
          ) : savedEquipment.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No preferred equipment chosen yet.
              </Text>
            </View>
          ) : (
            savedEquipment.map((item, index) => (
              <View key={item.uuid}>
                <View style={styles.savedItem}>
                  <View style={styles.savedItemContent}>
                    <View style={styles.savedItemHeader}>
                      <Text style={styles.savedItemTitle}>
                        {categoryLabel} #{index + 1}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteClick(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.clearText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.savedItemSubtitle}>
                      {item.makeLabel}
                    </Text>
                    {item.modelLabel && item.modelLabel !== "N/A" && (
                      <Text style={styles.savedItemSubtitle}>
                        {item.modelLabel}
                      </Text>
                    )}
                    {modelOptional && (!item.modelLabel || item.modelLabel === "N/A") && (
                      <Text style={[styles.savedItemSubtitle, { fontStyle: 'italic', opacity: 0.7 }]}>
                        Model: Auto-sized
                      </Text>
                    )}
                    <TouchableOpacity
                      style={styles.defaultCheckboxContainer}
                      onPress={() => handleDefaultCheckboxChange(item)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, item.is_default && styles.checkboxChecked]}>
                        {item.is_default && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={styles.defaultLabel}>Default</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.chevronButton}
                    onPress={() => toggleExpand(item)}
                    activeOpacity={0.7}
                  >
                    {item.loadingSpecs ? (
                      <ActivityIndicator size="small" color="#FD7332" />
                    ) : (
                      <Image
                        source={
                          item.expanded
                            ? require("../../../assets/Images/icons/minus_icon_orange_fd7332.png")
                            : require("../../../assets/Images/icons/chevron_down_white.png")
                        }
                        style={[
                          styles.chevronIcon,
                          !item.expanded && styles.chevronIconTinted,
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Expanded Specs Section */}
                {item.expanded && item.specs && (
                  <View style={styles.specsContainer}>
                    <Text style={styles.specsTitle}>Specifications</Text>

                    {/* Solar Panel Specs */}
                    {categoryId === "solar-panels" && (
                      <>
                        {item.specs.nameplate_pmax && (
                          <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Max Power (Pmax):</Text>
                            <Text style={styles.specValue}>{item.specs.nameplate_pmax} W</Text>
                          </View>
                        )}
                        {item.specs.ptc && (
                          <View style={styles.specRow}>
                            <Text style={styles.specLabel}>PTC Rating:</Text>
                            <Text style={styles.specValue}>{item.specs.ptc} W</Text>
                          </View>
                        )}
                        {item.specs.nameplate_voc && (
                          <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Open Circuit Voltage (Voc):</Text>
                            <Text style={styles.specValue}>{item.specs.nameplate_voc} V</Text>
                          </View>
                        )}
                        {item.specs.nameplate_isc && (
                          <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Short Circuit Current (Isc):</Text>
                            <Text style={styles.specValue}>{item.specs.nameplate_isc} A</Text>
                          </View>
                        )}
                        {item.specs.nameplate_vpmax && (
                          <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Voltage at Pmax (Vmp):</Text>
                            <Text style={styles.specValue}>{item.specs.nameplate_vpmax} V</Text>
                          </View>
                        )}
                        {item.specs.nameplate_ipmax && (
                          <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Current at Pmax (Imp):</Text>
                            <Text style={styles.specValue}>{item.specs.nameplate_ipmax} A</Text>
                          </View>
                        )}
                      </>
                    )}

                    {/* Inverter Specs */}
                    {(categoryId === "inverters" || categoryId === "micro-inverters") && (
                      <>
                        {item.specs.max_continuous_output_power_kw && (
                          <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Max Output Power:</Text>
                            <Text style={styles.specValue}>{item.specs.max_continuous_output_power_kw} kW</Text>
                          </View>
                        )}
                        {item.specs.max_cont_output_amps && (
                          <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Max Continuous Output:</Text>
                            <Text style={styles.specValue}>{item.specs.max_cont_output_amps} A</Text>
                          </View>
                        )}
                        {item.specs.nominal_voltage_vac && (
                          <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Nominal Voltage:</Text>
                            <Text style={styles.specValue}>{item.specs.nominal_voltage_vac} VAC</Text>
                          </View>
                        )}
                        {item.specs.voltage_minimum && (
                          <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Min Voltage:</Text>
                            <Text style={styles.specValue}>{item.specs.voltage_minimum} V</Text>
                          </View>
                        )}
                        {item.specs.voltage_maximum && (
                          <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Max Voltage:</Text>
                            <Text style={styles.specValue}>{item.specs.voltage_maximum} V</Text>
                          </View>
                        )}
                        {item.specs.max_strings_branches && (
                          <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Max Strings:</Text>
                            <Text style={styles.specValue}>{item.specs.max_strings_branches}</Text>
                          </View>
                        )}
                      </>
                    )}

                    {/* Generic fallback for other equipment types */}
                    {categoryId !== "solar-panels" && categoryId !== "inverters" && categoryId !== "micro-inverters" && (
                      <>
                        <View style={styles.specRow}>
                          <Text style={styles.specLabel}>Manufacturer:</Text>
                          <Text style={styles.specValue}>{item.specs.manufacturer || 'N/A'}</Text>
                        </View>
                        <View style={styles.specRow}>
                          <Text style={styles.specLabel}>Model:</Text>
                          <Text style={styles.specValue}>{item.specs.model || 'N/A'}</Text>
                        </View>
                        <Text style={[styles.specsTitle, {marginTop: 16, fontSize: 14, color: '#FFFFFF', opacity: 0.7}]}>
                          Detailed specifications coming soon
                        </Text>
                      </>
                    )}
                  </View>
                )}

                <LinearGradient
                  colors={["#FD7332", "#B92011"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.separator}
                />
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Confirm Remove Modal */}
      <ConfirmRemoveEquipmentModal
        visible={showRemoveModal}
        equipmentType={categoryLabel}
        make={equipmentToRemove?.makeLabel || ""}
        model={equipmentToRemove?.modelLabel || ""}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Confirm Set Default Modal */}
      <ConfirmSetDefaultEquipmentModal
        visible={showDefaultModal}
        equipmentType={categoryLabel}
        make={equipmentToSetDefault?.makeLabel || ""}
        model={equipmentToSetDefault?.modelLabel || ""}
        hasExistingDefault={!!savedEquipment.find((item) => item.is_default && item.uuid !== equipmentToSetDefault?.uuid)}
        existingDefaultMake={savedEquipment.find((item) => item.is_default && item.uuid !== equipmentToSetDefault?.uuid)?.makeLabel}
        existingDefaultModel={savedEquipment.find((item) => item.is_default && item.uuid !== equipmentToSetDefault?.uuid)?.modelLabel}
        onConfirm={confirmSetDefault}
        onCancel={cancelSetDefault}
      />

      {/* Watts Keypad - Only for Solar Panels */}
      {isSolarPanel && (
        <NumericKeypad
          isVisible={wattsKeypadVisible}
          currentValue={tempWatts}
          title="Wattage Filter"
          onNumberPress={(n) => {
            if (tempWatts.length < 3) {
              setTempWatts((prev) => (prev === "" || prev === "0" ? n : prev + n));
            }
          }}
          onBackspace={() => setTempWatts((prev) => prev.slice(0, -1))}
          onClose={() => {
            setWatts(tempWatts);
            setWattsKeypadVisible(false);
          }}
        />
      )}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: SCROLL_PADDING.contentContainer.paddingBottom,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: moderateScale(16),
  },
  backButtonText: {
    color: "#FD7332",
    fontSize: moderateScale(18),
    fontWeight: "600",
    fontFamily: "Lato-Bold",
  },
  categoryTitle: {
    color: "#FFFFFF",
    fontSize: moderateScale(24),
    fontWeight: "700",
    fontFamily: "Lato-Bold",
    marginBottom: moderateScale(12),
  },
  instructionText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
    fontFamily: "Inter",
    marginBottom: 24,
  },
  clearButtonContainer: {
    alignItems: "flex-end",
    marginBottom: -20,
  },
  clearButtonText: {
    color: "#FD7332",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter",
  },
  wattsWrap: {
    width: "100%",
    marginBottom: verticalScale(-10),
  },
  addButton: {
    marginTop: 16,
    marginBottom: 24,
  },
  savedSection: {
    marginTop: 8,
  },
  sectionLabel: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter",
    marginBottom: 8,
  },
  separator: {
    height: 2,
    width: "100%",
    marginBottom: 0,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyStateText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "400",
    fontFamily: "Inter",
    opacity: 0.6,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "400",
    fontFamily: "Inter",
    marginTop: 12,
    opacity: 0.8,
  },
  savedItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 12,
    overflow: "visible",
  },
  savedItemContent: {
    flex: 1,
  },
  savedItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 12,
  },
  savedItemTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter",
  },
  clearText: {
    color: "#FD7332",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter",
  },
  savedItemSubtitle: {
    color: "#FFFFFF",
    fontSize: 16,
    opacity: 1,
    fontFamily: "Inter",
  },
  chevronButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
  },
  chevronIcon: {
    width: 24,
    height: 24,
  },
  chevronIconTinted: {
    tintColor: "#FD7332",
  },
  specsContainer: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 0,
  },
  specsTitle: {
    color: "#FD7332",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter",
    marginBottom: 12,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  specLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "400",
    fontFamily: "Inter",
    opacity: 0.8,
    flex: 1,
    minWidth: 150,
  },
  specValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter",
    textAlign: "right",
  },
  defaultCheckboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FD7332",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  checkboxChecked: {
    backgroundColor: "#FD7332",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  defaultLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter",
  },
});
