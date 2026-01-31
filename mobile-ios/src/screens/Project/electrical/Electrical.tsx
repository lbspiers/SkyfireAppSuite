// src/screens/Project/electrical/Electrical.tsx

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { View, ScrollView, StyleSheet, Dimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SCROLL_PADDING, commonScrollViewProps } from "../../../styles/commonStyles";
import { useNavigation, DrawerActions, useFocusEffect, useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useProjectContext } from "../../../hooks/useProjectContext";
import { useElectricalDetails } from "./hooks/useElectricalDetails";
import { getSystemDetails } from "../../../api/project.service";

import LargeHeader from "../../../components/Header/LargeHeader";
import MainCircuitBreakersSection from "./sections/MainCircuitBreakersSection";
import MainPanelA from "./sections/MainPanelA";
import SubPanelBSection from "./sections/SubPanelBSection";
import PointOfInterconnectionSection from "./sections/PointOfInterconnection";

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

const Electrical: React.FC = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const navigation = useNavigation();
  const route = useRoute();
  const project = useSelector((s: any) => s.project.currentProject);
  const { projectId, companyId } = useProjectContext();
  const projectUuid = projectId; // projectId and projectUuid are the same

  // Use persistence hook instead of local state
  const {
    // Service Entrance / Main Circuit Breakers
    serviceEntranceType,
    mcbCount,
    mpuSelection,
    utilityServiceAmps,
    // Main Panel A
    mpaType,
    mpaBus,
    mpaMain,
    mpaFeeder,
    mpaDerated,
    // Sub Panel B
    spbType,
    spbBus,
    spbMain,
    spbFeeder,
    spbDerated,
    spbUpBreaker,
    spbTieInLocation,
    spbConductorSizing,
    // Point of Interconnection
    poiType,
    poiBreaker,
    poiDisconnect,
    poiLocation,
    poiLocation2,
    poiLocation3,
    poiLocation4,
    // PCS (Power Control System)
    pcsActivated,
    pcsAmps,
    pcsAmps2,
    pcsAmps3,
    pcsAmps4,
    // Update functions
    update,
  } = useElectricalDetails(projectUuid);

  const handleOpenGallery = (sectionLabel: string) => {
    console.log(`Opening gallery for section: ${sectionLabel}`);
    // TODO: Navigate to gallery screen with section filter
  };

  // ── Fetch system details to determine active systems ──
  const [systemDetails, setSystemDetails] = useState<any>(null);

  // Reload system details when screen is focused (to pick up combine status changes from Equipment screen)
  useFocusEffect(
    useCallback(() => {
      const fetchSystemData = async () => {
        if (projectUuid) {
          try {
            const response = await getSystemDetails(projectUuid);
            const data = response?.data?.data || response?.data || {};
            setSystemDetails(data);
            console.log("[Electrical] System details loaded:", Object.keys(data).length, "fields", "isCombined:", data?.ele_combine_positions);
          } catch (error) {
            console.error("[Electrical] Error fetching system details:", error);
          }
        }
      };
      fetchSystemData();
    }, [projectUuid])
  );

  // ── Determine which systems are active (same logic as Equipment.tsx) ──
  const activeSystems = useMemo(() => {
    if (!systemDetails) return [];

    const active: number[] = [];

    for (let i = 1; i <= 4; i++) {
      const prefix = `sys${i}_`;

      // Check if system selection has been made
      const systemSelection = systemDetails[`${prefix}selectedsystem`];
      const hasSystemSelection = systemSelection === "microinverter" || systemSelection === "inverter";

      // Check if solar panel section has meaningful data
      const solarPanelMake = systemDetails[`${prefix}solar_panel_make`];
      const solarPanelModel = systemDetails[`${prefix}solar_panel_model`];
      const solarPanelQuantity = systemDetails[`${prefix}solar_panel_quantity`];

      const hasSolarPanelData = (
        (solarPanelMake && typeof solarPanelMake === "string" && solarPanelMake.trim() !== "" && solarPanelMake.trim() !== "00") ||
        (solarPanelModel && typeof solarPanelModel === "string" && solarPanelModel.trim() !== "" && solarPanelModel.trim() !== "00") ||
        (typeof solarPanelQuantity === "number" && solarPanelQuantity > 0)
      );

      // Check if battery-only mode has been selected
      const hasBatteryOnly = systemDetails[`${prefix}batteryonly`] === true;

      // System is active if ANY of these criteria are met
      if (hasSystemSelection || hasSolarPanelData || hasBatteryOnly) {
        active.push(i);
      }
    }

    console.log("[Electrical] Active systems:", active);
    console.log("[Electrical] Active systems count:", active.length);
    return active;
  }, [systemDetails]);

  // ── Check if systems are combined ──
  const isCombined = useMemo(() => {
    const combineStatus = systemDetails?.ele_combine_positions;
    // Systems are combined if ele_combine_positions has any value (not null/empty)
    return !!(combineStatus && combineStatus.trim().length > 0);
  }, [systemDetails]);

  // DEBUG: Log rendering decision
  console.log("[Electrical] Rendering POI sections - activeSystems.length:", activeSystems.length, "activeSystems:", activeSystems, "isCombined:", isCombined);

  // ── Sub Panel (B) visibility logic ──
  const [showSubPanelB, setShowSubPanelB] = useState(false);

  // Check if Sub Panel B has been activated from Equipment page
  useEffect(() => {
    if (systemDetails?.spb_activated) {
      console.log("[Electrical] Sub Panel B activation detected - showing section");
      setShowSubPanelB(true);
    }
  }, [systemDetails]);

  const subPanelBVisible = useMemo(
    () => showSubPanelB || !!spbType || !!spbBus || !!spbMain || !!spbFeeder,
    [showSubPanelB, spbType, spbBus, spbMain, spbFeeder]
  );

  // Calculate allowable backfeed for Main Panel A
  const mpaAllowableBackfeed = useMemo(() => {
    const busValue = parseFloat(mpaBus) || 0;
    let breakerValue = 0;
    if (mpaMain?.toLowerCase() === "mlo") {
      breakerValue = 0;
    } else {
      breakerValue = parseFloat(mpaMain) || 0;
    }
    const rawBackfeed = busValue * 1.2 - breakerValue;
    return rawBackfeed > 0 ? Math.round(rawBackfeed) : 0;
  }, [mpaBus, mpaMain]);

  // Calculate allowable backfeed for Sub Panel B
  const spbAllowableBackfeed = useMemo(() => {
    const busValue = parseFloat(spbBus) || 0;
    let breakerValue = 0;
    if (spbMain?.toLowerCase() === "mlo") {
      breakerValue = 0;
    } else {
      breakerValue = parseFloat(spbMain) || 0;
    }
    const rawBackfeed = busValue * 1.2 - breakerValue;
    return rawBackfeed > 0 ? Math.round(rawBackfeed) : 0;
  }, [spbBus, spbMain]);

  // Legacy variable for compatibility
  const allowableBackfeed = mpaAllowableBackfeed;

  const stopAt = headerHeight / SCREEN_HEIGHT;

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
      >
        {/* Main Circuit Breakers */}
        <MainCircuitBreakersSection
          count={mcbCount}
          onCountChange={(count) => update.mcbCount(count)}
          serviceType={serviceEntranceType}
          onServiceTypeChange={(type) => update.serviceEntranceType(type)}
          utilityServiceAmps={utilityServiceAmps}
          onUtilityServiceAmpsChange={(amps) => update.utilityServiceAmps(amps)}
          errors={{}}
          projectId={projectId}
          companyId={companyId}
          onOpenGallery={handleOpenGallery}
        />

        {/* Main Panel (A) */}
        <MainPanelA
          type={mpaType}
          onTypeChange={(type) => update.mpaType(type)}
          busAmps={mpaBus}
          onBusAmpsChange={(amps) => update.mpaBus(amps)}
          mainBreakerAmps={mpaMain}
          onMainBreakerChange={(amps) => update.mpaMain(amps)}
          feederLocation={mpaFeeder}
          onFeederLocationChange={(location) => update.mpaFeeder(location)}
          derated={mpaDerated}
          onDerateChange={(derated) => update.mpaDerated(derated)}
          allowableBackfeed={allowableBackfeed}
          onMpaBusBarExistingChange={(existing) => update.mpaBusBarExisting(existing)}
          onMpaMainCircuitBreakerExistingChange={(existing) => update.mpaMainCircuitBreakerExisting(existing)}
          errors={{}}
          subPanelBVisible={subPanelBVisible}
          onSubPanelBPress={() => setShowSubPanelB(true)}
          projectId={projectId}
          companyId={companyId}
          onOpenGallery={handleOpenGallery}
        />

        {/* Sub Panel (B) — only render when requested */}
        {subPanelBVisible && (
          <SubPanelBSection
            type={spbType}
            onTypeChange={(type) => update.spbType(type)}
            busAmps={spbBus}
            onBusAmpsChange={(amps) => update.spbBus(amps)}
            mainBreakerAmps={spbMain}
            onMainBreakerChange={(amps) => update.spbMain(amps)}
            feederLocation={spbFeeder}
            onFeederLocationChange={(location) => update.spbFeeder(location)}
            tieInBreakerRating={spbUpBreaker}
            onTieInBreakerRatingChange={(rating) => update.spbUpBreaker(rating)}
            tieInLocation={spbTieInLocation}
            onTieInLocationChange={(location) => update.spbTieInLocation(location)}
            conductorSizing={spbConductorSizing}
            onConductorSizingChange={(sizing) => update.spbConductorSizing(sizing)}
            derated={spbDerated}
            onDerateChange={(derated) => update.spbDerated(derated)}
            errors={{}}
            onClose={() => {
              update.clearSubPanelB();
              setShowSubPanelB(false);
            }}
            projectId={projectId}
            companyId={companyId}
            onOpenGallery={handleOpenGallery}
          />
        )}

        {/* Point of Interconnection — render based on active systems and combine status */}
        {activeSystems.length === 0 ? (
          // No active systems - show single POI without system number
          <PointOfInterconnectionSection
            poiType={poiType}
            onPoiTypeChange={(type) => update.poiType(type)}
            breakerRating={poiBreaker}
            onBreakerRatingChange={(rating) => update.poiBreaker(rating)}
            disconnectRating={poiDisconnect}
            onDisconnectRatingChange={(rating) => update.poiDisconnect(rating)}
            poiLocation={poiLocation}
            onPoiLocationChange={(location) => update.poiLocation(location)}
            mpaAllowableBackfeed={mpaAllowableBackfeed}
            spbAllowableBackfeed={spbAllowableBackfeed}
            errors={{}}
            projectId={projectId}
            companyId={companyId}
            onOpenGallery={handleOpenGallery}
          />
        ) : isCombined && activeSystems.includes(1) && activeSystems.includes(2) ? (
          // Systems 1 & 2 are combined - show single POI for combined system
          (() => {
            // Check if either system 1 or 2 has a battery
            const sys1InverterModel = systemDetails?.sys1_micro_inverter_model || "";
            const sys2InverterModel = systemDetails?.sys2_micro_inverter_model || "";
            const sys1IsPowerWall3 = sys1InverterModel.includes("PowerWall 3") || sys1InverterModel.includes("Powerwall 3");
            const sys2IsPowerWall3 = sys2InverterModel.includes("PowerWall 3") || sys2InverterModel.includes("Powerwall 3");

            // Detailed battery detection for System 1
            const sys1BatteryFields = {
              battery_1_make: systemDetails?.sys1_battery_1_make,
              battery_1_model: systemDetails?.sys1_battery_1_model,
              battery_1_qty: systemDetails?.sys1_battery_1_qty,
              battery_2_make: systemDetails?.sys1_battery_2_make,
              battery_2_model: systemDetails?.sys1_battery_2_model,
              battery_2_qty: systemDetails?.sys1_battery_2_qty,
              isPowerWall3: sys1IsPowerWall3
            };

            // Battery is present if it has BOTH quantity AND (make OR model)
            const sys1Battery1HasData = (systemDetails?.sys1_battery_1_make || systemDetails?.sys1_battery_1_model) &&
              systemDetails?.sys1_battery_1_qty && systemDetails.sys1_battery_1_qty > 0;
            const sys1Battery2HasData = (systemDetails?.sys1_battery_2_make || systemDetails?.sys1_battery_2_model) &&
              systemDetails?.sys1_battery_2_qty && systemDetails.sys1_battery_2_qty > 0;

            const hasBatterySys1 = !!(
              sys1Battery1HasData ||
              sys1Battery2HasData ||
              sys1IsPowerWall3 // PowerWall 3 is an all-in-one battery system
            );

            // Detailed battery detection for System 2
            const sys2BatteryFields = {
              battery_1_make: systemDetails?.sys2_battery_1_make,
              battery_1_model: systemDetails?.sys2_battery_1_model,
              battery_1_qty: systemDetails?.sys2_battery_1_qty,
              battery_2_make: systemDetails?.sys2_battery_2_make,
              battery_2_model: systemDetails?.sys2_battery_2_model,
              battery_2_qty: systemDetails?.sys2_battery_2_qty,
              isPowerWall3: sys2IsPowerWall3
            };

            // Battery is present if it has BOTH quantity AND (make OR model)
            const sys2Battery1HasData = (systemDetails?.sys2_battery_1_make || systemDetails?.sys2_battery_1_model) &&
              systemDetails?.sys2_battery_1_qty && systemDetails.sys2_battery_1_qty > 0;
            const sys2Battery2HasData = (systemDetails?.sys2_battery_2_make || systemDetails?.sys2_battery_2_model) &&
              systemDetails?.sys2_battery_2_qty && systemDetails.sys2_battery_2_qty > 0;

            const hasBatterySys2 = !!(
              sys2Battery1HasData ||
              sys2Battery2HasData ||
              sys2IsPowerWall3 // PowerWall 3 is an all-in-one battery system
            );

            const hasBattery = hasBatterySys1 || hasBatterySys2;

            console.log('[Electrical] Battery Detection for Combined Systems:', {
              hasBatterySys1,
              hasBatterySys2,
              hasBattery,
            });
            console.log('[Electrical] System 1 Battery Fields:', sys1BatteryFields);
            console.log('[Electrical] System 2 Battery Fields:', sys2BatteryFields);

            return (
              <PointOfInterconnectionSection
                key="poi-combined-1-2"
                systemNumber={1}
                isCombinedSystem={true}
                combineMethod={systemDetails?.ele_combine_positions || ""}
                poiType={poiType}
                onPoiTypeChange={(type) => update.poiType(type)}
                breakerRating={poiBreaker}
                onBreakerRatingChange={(rating) => update.poiBreaker(rating)}
                disconnectRating={poiDisconnect}
                onDisconnectRatingChange={(rating) => update.poiDisconnect(rating)}
                poiLocation={poiLocation}
                onPoiLocationChange={(location) => update.poiLocation(location)}
                mpaAllowableBackfeed={mpaAllowableBackfeed}
                spbAllowableBackfeed={spbAllowableBackfeed}
                pcsAmps={pcsAmps}
                onPcsAmpsChange={(amps) => update.pcsAmps(amps)}
                hasBattery={hasBattery}
                totalActiveSystems={activeSystems.length}
                errors={{}}
                projectId={projectId}
                companyId={companyId}
                onOpenGallery={handleOpenGallery}
              />
            );
          })()
        ) : (
          // Active systems found - render POI for each system (not combined)
          activeSystems.map((systemNumber) => {
            // Map system number to corresponding POI location
            const poiLocations = [poiLocation, poiLocation2, poiLocation3, poiLocation4];
            const currentPoiLocation = poiLocations[systemNumber - 1] || "";

            // Map system number to corresponding POI location update function
            const updatePoiLocationFunctions = [
              update.poiLocation,
              update.poiLocation2,
              update.poiLocation3,
              update.poiLocation4,
            ];
            const currentUpdatePoiLocationFunction = updatePoiLocationFunctions[systemNumber - 1];

            // Map system number to corresponding PCS amps
            const pcsAmpsValues = [pcsAmps, pcsAmps2, pcsAmps3, pcsAmps4];
            const currentPcsAmps = pcsAmpsValues[systemNumber - 1] || "";

            // Map system number to corresponding PCS amps update function
            const updatePcsAmpsFunctions = [
              update.pcsAmps,
              update.pcsAmps2,
              update.pcsAmps3,
              update.pcsAmps4,
            ];
            const currentUpdatePcsAmpsFunction = updatePcsAmpsFunctions[systemNumber - 1];

            // Check if this system has a battery for PCS control
            const prefix = `sys${systemNumber}_`;
            const inverterModelForBattery = systemDetails?.[`${prefix}micro_inverter_model`] || "";
            const isPowerWall3 = inverterModelForBattery.includes("PowerWall 3") || inverterModelForBattery.includes("Powerwall 3");

            // Battery is present if it has BOTH quantity AND (make OR model)
            const battery1HasData = (systemDetails?.[`${prefix}battery_1_make`] || systemDetails?.[`${prefix}battery_1_model`]) &&
              systemDetails?.[`${prefix}battery_1_qty`] && systemDetails?.[`${prefix}battery_1_qty`] > 0;
            const battery2HasData = (systemDetails?.[`${prefix}battery_2_make`] || systemDetails?.[`${prefix}battery_2_model`]) &&
              systemDetails?.[`${prefix}battery_2_qty`] && systemDetails?.[`${prefix}battery_2_qty`] > 0;

            const hasBattery = !!(
              battery1HasData ||
              battery2HasData ||
              isPowerWall3 // PowerWall 3 is an all-in-one battery system
            );

            // Extract equipment data for System 2+ labels
            const solarPanelMake = systemDetails?.[`${prefix}solar_panel_make`] || "";
            const solarPanelModel = systemDetails?.[`${prefix}solar_panel_model`] || "";
            const inverterMake = systemDetails?.[`${prefix}micro_inverter_make`] || "";
            const inverterModel = systemDetails?.[`${prefix}micro_inverter_model`] || "";
            const systemType = systemDetails?.[`${prefix}selectedsystem`] || "";

            return (
              <PointOfInterconnectionSection
                key={`poi-system-${systemNumber}`}
                systemNumber={systemNumber}
                poiType={poiType}
                onPoiTypeChange={(type) => update.poiType(type)}
                breakerRating={poiBreaker}
                onBreakerRatingChange={(rating) => update.poiBreaker(rating)}
                disconnectRating={poiDisconnect}
                onDisconnectRatingChange={(rating) => update.poiDisconnect(rating)}
                poiLocation={currentPoiLocation}
                onPoiLocationChange={(location) => currentUpdatePoiLocationFunction(location)}
                mpaAllowableBackfeed={mpaAllowableBackfeed}
                spbAllowableBackfeed={spbAllowableBackfeed}
                pcsAmps={currentPcsAmps}
                onPcsAmpsChange={(amps) => currentUpdatePcsAmpsFunction(amps)}
                hasBattery={hasBattery}
                solarPanelMake={solarPanelMake}
                solarPanelModel={solarPanelModel}
                inverterMake={inverterMake}
                inverterModel={inverterModel}
                systemType={systemType}
                totalActiveSystems={activeSystems.length}
                errors={{}}
                projectId={projectId}
                companyId={companyId}
                onOpenGallery={handleOpenGallery}
              />
            );
          })
        )}
      </ScrollView>

      {/* Header overlay */}
      <View
        style={styles.headerWrap}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <LargeHeader
          title="Electrical"
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
      </View>
    </LinearGradient>
  );
};

export default Electrical;

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
});
