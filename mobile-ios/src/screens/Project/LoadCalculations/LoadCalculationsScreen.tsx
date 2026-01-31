// src/screens/Project/LoadCalculations/LoadCalculationsScreen.tsx
import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  BackHandler,
} from "react-native";
import { useNavigation, useRoute, RouteProp, DrawerActions } from "@react-navigation/native";
import { useSelector } from "react-redux";
import LinearGradient from "react-native-linear-gradient";
import LargeHeader from "../../../components/Header/LargeHeader";
import { useLoadCalculations } from "./hooks/useLoadCalculations";
import PanelTitleSection from "./components/PanelTitleSection";
import LoadCalculationResults from "./components/LoadCalculationResults";
import FloorAreaSection from "./sections/FloorAreaSection";
import BreakerQuantitiesSection from "./sections/BreakerQuantitiesSection";
import BreakerRatingsSection from "./sections/BreakerRatingsSection";
import AdditionalBreakersSection from "./sections/AdditionalBreakersSection";
import { useResponsive } from "../../../utils/responsive-v2";
import { SCROLL_PADDING, commonScrollViewProps } from "../../../styles/commonStyles";

function averageHexColor(a: string, b: string): string {
  const ha = a.replace("#", ""),
    hb = b.replace("#", "");
  const ra = parseInt(ha.slice(0, 2), 16),
    ga = parseInt(ha.slice(2, 4), 16),
    ba = parseInt(ha.slice(4, 6), 16);
  const rb = parseInt(hb.slice(0, 2), 16),
    gb = parseInt(hb.slice(2, 4), 16),
    bb = parseInt(hb.slice(4, 6), 16);
  const r = Math.round((ra + rb) / 2)
    .toString(16)
    .padStart(2, "0");
  const g = Math.round((ga + gb) / 2)
    .toString(16)
    .padStart(2, "0");
  const b2 = Math.round((ba + bb) / 2)
    .toString(16)
    .padStart(2, "0");
  return `#${r}${g}${b2}`;
}

const LIGHT = "#2E4161";
const DARK = "#0C1F3F";
const MID = averageHexColor(LIGHT, DARK);

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type LoadCalculationsRouteParams = {
  LoadCalculations: {
    panelType?: string;
    projectId?: string;
    companyId?: string;
    houseId?: number;
  };
};

interface LoadCalculationsScreenProps {
  /** Optional title override */
  screenTitle?: string;
  /** Optional project/house ID to load existing data */
  houseId?: number;
  /** Callback when data is saved */
  onSave?: (data: any) => void;
}

export default function LoadCalculationsScreen({
  screenTitle,
  houseId: houseIdProp,
  onSave,
}: LoadCalculationsScreenProps) {
  const [headerHeight, setHeaderHeight] = useState(0);
  const navigation = useNavigation();
  const route = useRoute<RouteProp<LoadCalculationsRouteParams, "LoadCalculations">>();
  const project = useSelector((s: any) => s.project.currentProject);
  const r = useResponsive();

  // Get params from navigation route
  const panelType = route.params?.panelType || screenTitle || "Load Calculations";
  const projectId = route.params?.projectId;
  const companyId = route.params?.companyId;
  const houseId = route.params?.houseId || houseIdProp;

  // Header title is always just "Load Calcs"
  const screenTitleFormatted = "Load Calcs";

  const {
    values,
    errors,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    saveError,
    handleFieldChange,
    handleDynamicLoadAdd,
    handleDynamicLoadRemove,
    handleDynamicLoadChange,
    validateForm,
    saveData,
    clearData,
  } = useLoadCalculations({
    projectId,
    companyId,
    panelType,
  });

  // Build customer name
  const fullName = useMemo(() => {
    return project?.details
      ? `${project.details.customer_last_name}, ${project.details.customer_first_name}`
      : undefined;
  }, [project?.details]);

  // Build address lines
  const addressLines = useMemo(() => {
    if (!project?.site) return undefined;
    return [
      project.site.address,
      [project.site.city, project.site.state, project.site.zip_code]
        .filter(Boolean)
        .join(", "),
    ];
  }, [project?.site]);

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return true; // Prevent default behavior
      }
      return false; // Allow default behavior
    });

    return () => backHandler.remove();
  }, [navigation]);

  // Handle back button press
  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const stopAt = headerHeight / SCREEN_HEIGHT;

  const styles = StyleSheet.create({
    gradient: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    headerWrap: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
    },
    bottomSpacer: {
      height: r.verticalScale(60),
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: r.verticalScale(60),
    },
    loadingText: {
      color: "#FFFFFF",
      fontSize: r.fontSize(18),
      marginTop: r.spacing.md,
      fontFamily: "Lato-Regular",
    },
    errorContainer: {
      backgroundColor: "rgba(185, 32, 17, 0.2)",
      padding: r.spacing.md,
      marginHorizontal: r.spacing.md,
      marginBottom: r.spacing.md,
      borderRadius: r.moderateScale(8),
      borderWidth: 1,
      borderColor: "#B92011",
    },
    errorText: {
      color: "#FD7332",
      fontSize: r.fontSize(16),
      fontFamily: "Lato-Regular",
      textAlign: "center",
    },
    savingIndicator: {
      position: "absolute",
      top: r.spacing.md,
      right: r.spacing.md,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      paddingHorizontal: r.spacing.sm,
      paddingVertical: r.spacing.sm,
      borderRadius: r.moderateScale(20),
      zIndex: 20,
    },
    savingText: {
      color: "#FFFFFF",
      fontSize: r.fontSize(14),
      marginLeft: r.spacing.sm,
      fontFamily: "Lato-Regular",
    },
  });

  return (
    <LinearGradient
      colors={[LIGHT, MID, DARK]}
      locations={[0, stopAt, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <ScrollView
        style={styles.scrollView}
        {...commonScrollViewProps}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight },
          SCROLL_PADDING.withTabBar,
        ]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FD7332" />
            <Text style={styles.loadingText}>Loading {panelType} data...</Text>
          </View>
        )}

        {/* Error Message */}
        {saveError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{saveError}</Text>
          </View>
        )}

        {!isLoading && (
          <>
        {/* Panel Name Title Section */}
        <PanelTitleSection
          panelName={panelType}
          showBackButton={true}
          onBackPress={handleBackPress}
        />

        {/* Floor Area Section */}
        <FloorAreaSection
          value={values.floorArea}
          onChange={(value) => handleFieldChange("floorArea", value)}
          error={errors.floorArea}
        />

        {/* Breaker Quantities Section */}
        <BreakerQuantitiesSection
          values={{
            smallApplianceCircuits: values.smallApplianceCircuits,
            bathroomCircuits: values.bathroomCircuits,
            laundryCircuits: values.laundryCircuits,
          }}
          onChange={handleFieldChange}
          errors={errors}
        />

        {/* Breaker Amp Ratings Section */}
        <BreakerRatingsSection
          values={{
            hvacAirHandler: values.hvacAirHandler,
            electricalFurnace: values.electricalFurnace,
            electricVehicle: values.electricVehicle,
          }}
          onChange={handleFieldChange}
          errors={errors}
        />

        {/* Additional 2-Pole Breakers Section */}
        <AdditionalBreakersSection
          loads={values.additionalLoads}
          onAdd={handleDynamicLoadAdd}
          onRemove={handleDynamicLoadRemove}
          onChange={handleDynamicLoadChange}
          errors={errors}
        />

        {/* Load Calculation Results */}
        <LoadCalculationResults values={values} />

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
          </>
        )}
      </ScrollView>

      {/* Header overlay */}
      <View
        style={styles.headerWrap}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <LargeHeader
          title={screenTitleFormatted}
          name={fullName}
          addressLines={addressLines}
          projectId={project?.details?.installer_project_id}
          onDrawerPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        />
        {/* Saving Indicator */}
        {isSaving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color="#FD7332" />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}
