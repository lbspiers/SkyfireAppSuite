// src/screens/app/inventory/InventoryScreen.tsx

import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Text, Alert } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import {
  useNavigation,
  DrawerActions,
  useFocusEffect,
} from "@react-navigation/native";
import { useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import SmallHeader from "../../../components/Header/SmallHeader";
import Button from "../../../components/Button";
import Dropdown from "../../../components/Dropdown";
import { SCROLL_PADDING } from "../../../styles/commonStyles";
import { getPreferredEquipment } from "../../../api/preferredEquipment.service";
import { adminAPI } from "../../../services/adminAPI";
import axiosInstance from "../../../api/axiosInstance";
import { moderateScale, verticalScale } from "../../../utils/responsive";

const LIGHT = "#2E4161";
const DARK = "#0C1F3F";

const EQUIPMENT_CATEGORIES = [
  { id: "solar-panels", label: "Solar Panels" },
  { id: "inverters", label: "Inverters" },
  { id: "micro-inverters", label: "Microinverters" },
  { id: "batteries", label: "Batteries" },
  { id: "storage-management", label: "Storage Management Systems" },
  { id: "ac-disconnects", label: "AC Disconnects" },
  { id: "pv-meters", label: "PV Meters" },
  { id: "load-centers", label: "Load Centers" },
  { id: "rails", label: "Rails" },
  { id: "attachments", label: "Attachments" },
  { id: "ev-chargers", label: "EV Chargers" },
];

export default function InventoryScreen() {
  const navigation = useNavigation<any>();
  const [categoriesWithEquipment, setCategoriesWithEquipment] = useState<
    Set<string>
  >(new Set());

  // Super user state
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [companiesList, setCompaniesList] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>("");

  // Get company ID and auth from Redux
  const profileData = useSelector(
    (state: any) => state?.Profile || state?.profile
  );
  const auth = useSelector((state: any) => state?.auth);
  const accessToken = auth?.accessToken;

  const profile = profileData?.profile;
  const company = profile?.company;
  const currentUserCompanyId = company?.uuid || company?.id;

  // Check if current user is a super user
  useEffect(() => {
    checkSuperUserStatus();
  }, []);

  const checkSuperUserStatus = async () => {
    try {
      const response = await adminAPI.verifyAdminAccess();
      if (response.status === "SUCCESS" && response.data?.isAdmin) {
        setIsSuperUser(true);
      }
    } catch (error) {
      // User is not super admin, which is fine
      setIsSuperUser(false);
    }
  };

  // Fetch all companies for super users
  useEffect(() => {
    if (isSuperUser && accessToken) {
      fetchCompanies();
    }
  }, [isSuperUser, accessToken]);

  const fetchCompanies = async () => {
    try {
      const response = await axiosInstance.get("/org/companies");

      if (response.data?.data && Array.isArray(response.data.data)) {
        // Log sample data to understand structure
        if (response.data.data.length > 0) {
          console.log(`[Inventory] Sample company data:`, JSON.stringify(response.data.data[0], null, 2));
        }

        // Transform data for dropdown and filter for approved companies only
        const companies = response.data.data
          .filter((item: any) => {
            // ✅ Only include approved companies
            // Check multiple possible field locations and formats
            const approvedValue = item.user?.approved ?? item.approved ?? item.company?.approved;
            const isApproved = approvedValue === true ||
                              approvedValue === 1 ||
                              approvedValue === "true" ||
                              approvedValue === "1";

            if (!isApproved) {
              console.log(`[Inventory] Filtering out unapproved company: ${item.company?.name} (approved field: ${approvedValue})`);
            }
            return isApproved;
          })
          .map((item: any) => ({
            uuid: item.company.uuid,
            name: item.company.name,
            email: item.user.email,
          }));

        console.log(`[Inventory] Loaded ${companies.length} approved companies (filtered from ${response.data.data.length} total)`);

        // If no companies after filtering, show warning and use all companies
        if (companies.length === 0 && response.data.data.length > 0) {
          console.warn(`[Inventory] ⚠️ All companies filtered out! Using unfiltered list. Check approved field structure.`);
          const allCompanies = response.data.data.map((item: any) => ({
            uuid: item.company.uuid,
            name: item.company.name,
            email: item.user.email,
          }));
          setCompaniesList(allCompanies);
          return;
        }

        setCompaniesList(companies);

        // Default to current user's company
        const currentCompany = companies.find(
          (c: any) => c.uuid === currentUserCompanyId
        );
        if (currentCompany) {
          setSelectedCompanyId(currentCompany.uuid);
          setSelectedCompanyName(currentCompany.name);
        } else if (companies.length > 0) {
          // Fallback to first company if current not found
          setSelectedCompanyId(companies[0].uuid);
          setSelectedCompanyName(companies[0].name);
        }
      }
    } catch (error) {
      console.error("[Inventory] Error fetching companies:", error);
      Toast.show({
        type: "error",
        text1: "Failed to load companies",
      });
    }
  };

  // Helper to get the active company ID (super user selected or current user's)
  const getActiveCompanyId = () => {
    if (isSuperUser && selectedCompanyId) {
      return selectedCompanyId;
    }
    return currentUserCompanyId;
  };

  // Handle company selection change
  const handleCompanyChange = async (companyUuid: string) => {
    console.log(`[Inventory] handleCompanyChange called with:`, companyUuid);
    console.log(`[Inventory] companiesList:`, companiesList);

    const company = companiesList.find((c) => c.uuid === companyUuid);
    if (!company) {
      console.error(`[Inventory] Company not found with uuid: ${companyUuid}`);
      return;
    }

    console.log(`[Inventory] Switching to company: ${company.name} (${companyUuid})`);

    // Clear current equipment state first
    setCategoriesWithEquipment(new Set());

    // Update selected company
    setSelectedCompanyId(companyUuid);
    setSelectedCompanyName(company.name);

    // Reload equipment counts for new company
    await loadEquipmentCounts(companyUuid);

    Toast.show({
      type: "info",
      text1: `Now managing: ${company.name}`,
      visibilityTime: 2000,
    });
  };

  // Load equipment counts for all categories
  const loadEquipmentCounts = async (companyIdOverride?: string) => {
    const activeCompanyId = companyIdOverride || getActiveCompanyId();
    if (!activeCompanyId) {
      console.warn("[Inventory] No company ID available for loading equipment");
      return;
    }

    console.log(`[Inventory] Loading equipment counts for company: ${activeCompanyId}`);
    const categoriesWithData = new Set<string>();

    // Check each category for preferred equipment
    for (const category of EQUIPMENT_CATEGORIES) {
      try {
        const response = await getPreferredEquipment(activeCompanyId, category.id);
        if (response?.status === 200) {
          const equipment = Array.isArray(response.data) ? response.data : [];
          if (equipment.length > 0) {
            console.log(`[Inventory] Category ${category.id} has ${equipment.length} items`);
            categoriesWithData.add(category.id);
          }
        }
      } catch (error) {
        console.error(
          `[Inventory] Error loading equipment for ${category.id}:`,
          error
        );
      }
    }

    console.log(`[Inventory] Loaded equipment for ${categoriesWithData.size} categories`);
    setCategoriesWithEquipment(categoriesWithData);
  };

  // Load on mount and when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadEquipmentCounts();
    }, [selectedCompanyId, currentUserCompanyId])
  );

  const handleCategoryPress = (categoryId: string, categoryLabel: string) => {
    const activeCompanyId = getActiveCompanyId();
    console.log(`📦 [INVENTORY] Category selected: ${categoryId}`);
    console.log(`📦 [INVENTORY] isSuperUser: ${isSuperUser}`);
    console.log(`📦 [INVENTORY] selectedCompanyId: ${selectedCompanyId}`);
    console.log(`📦 [INVENTORY] selectedCompanyName: ${selectedCompanyName}`);
    console.log(`📦 [INVENTORY] currentUserCompanyId: ${currentUserCompanyId}`);
    console.log(`📦 [INVENTORY] activeCompanyId (passed): ${activeCompanyId}`);

    navigation.navigate("EquipmentCategory", {
      categoryId,
      categoryLabel,
      companyId: activeCompanyId,
      companyName: isSuperUser ? selectedCompanyName : null,
    });
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
        onDrawerPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.instructionText}>
          Please go through equipment types and select your preferred makes and
          models to be used throughout the app.
        </Text>

        {/* Super User Company Selector */}
        {isSuperUser && companiesList.length > 0 && (
          <View style={styles.companySelectorContainer}>
            <Text style={styles.companySelectorLabel}>
              Managing Equipment For:
            </Text>
            <Dropdown
              data={companiesList}
              labelField="name"
              valueField="uuid"
              value={selectedCompanyId}
              onChange={(companyUuid: string) => handleCompanyChange(companyUuid)}
              placeholder="Select Company"
              widthPercent={100}
            />
          </View>
        )}

        <View style={styles.buttonGrid}>
          {EQUIPMENT_CATEGORIES.map((category) => (
            <Button
              key={category.id}
              title={category.label}
              onPress={() => handleCategoryPress(category.id, category.label)}
              width="100%"
              height={44}
              rounded={24}
              selected={categoriesWithEquipment.has(category.id)}
              disabled={category.id === "ev-chargers"}
              deactivated={category.id === "ev-chargers"}
              style={styles.categoryButton}
              textStyle={styles.categoryButtonText}
            />
          ))}
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: (SCROLL_PADDING.contentContainer.paddingBottom || 0) + 500,
  },
  instructionText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: moderateScale(10),
    fontFamily: "Lato-Regular",
    opacity: 0.9,
  },
  companySelectorContainer: {
    marginBottom: 0,
    paddingHorizontal: moderateScale(4),
    paddingBottom: moderateScale(10),
  },
  companySelectorLabel: {
    color: "#FFFFFF",
    fontSize: moderateScale(20),
    fontWeight: "700",
    fontFamily: "Lato-Bold",
    marginBottom: 0,
  },
  buttonGrid: {
    gap: 16,
  },
  categoryButton: {
    marginBottom: 0,
  },
  categoryButtonText: {
    fontSize: moderateScale(20),
    fontWeight: "700",
    fontFamily: "Lato-Bold",
  },
});
