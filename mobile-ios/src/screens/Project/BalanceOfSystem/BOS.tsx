// src/screens/Project/BalanceOfSystem.tsx

import React, { useState, useEffect, useMemo } from "react";
import { View, ScrollView, StyleSheet, Dimensions, ActivityIndicator, Text as RNText } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useProjectContext } from "../../../hooks/useProjectContext";
import { useBOSDetails } from "./hooks/useBOSDetails";
import { fetchSystemDetails } from "./services/bosPersistence";

import LargeHeader from "../../../components/Header/LargeHeader";
import System1BOSSection from "./sections/sys1_BOS"; // ← import your new section
import CollapsibleSectionSimple from "../../../components/UI/CollapsibleSectionSimple";

/**
 * Helper to detect which systems are active based on sys1_selectedsystem, sys2_selectedsystem, etc.
 */
function detectActiveSystems(rawSys: any): Array<{
  prefix: string;
  number: number;
  label: string;
  equipmentType: "microinverter" | "inverter";
}> {
  const systems: Array<{
    prefix: string;
    number: number;
    label: string;
    equipmentType: "microinverter" | "inverter";
  }> = [];

  for (let i = 1; i <= 4; i++) {
    const fieldName = `sys${i}_selectedsystem`;
    const value = rawSys?.[fieldName];

    // If the system has a selectedsystem value (microinverter or inverter), it's active
    if (value === "microinverter" || value === "inverter") {
      systems.push({
        prefix: `sys${i}_`,
        number: i,
        label: `System ${i}`,
        equipmentType: value as "microinverter" | "inverter"
      });
    }
  }

  return systems;
}

/**
 * Wrapper component for each BOS system section - manages its own hook instance
 */
interface BOSSystemSectionProps {
  systemPrefix: string;
  systemNumber: number;
  systemLabel: string;
  equipmentType: "microinverter" | "inverter";
  projectId?: string;
  companyId?: string;
  onOpenGallery?: (sectionLabel: string) => void;
  utilityAbbrev?: string;
}

const BOSSystemSection: React.FC<BOSSystemSectionProps> = ({
  systemPrefix,
  systemNumber,
  systemLabel,
  equipmentType,
  projectId,
  companyId,
  onOpenGallery,
  utilityAbbrev,
}) => {
  // Use BOS hook with systemPrefix
  const { loading, type1, type2, type3, visibility, update } = useBOSDetails(projectId, systemPrefix);

  // Get device label based on equipment type
  const deviceLabel = equipmentType === "microinverter"
    ? `Microinverter ${systemNumber}`
    : `Inverter ${systemNumber}`;

  if (loading) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#FD7332" />
        <RNText style={{ color: '#FFFFFF', marginTop: 10 }}>
          Loading {systemLabel} BOS...
        </RNText>
      </View>
    );
  }

  return (
    <System1BOSSection
      deviceLabel={deviceLabel}
      type1={type1}
      type2={type2}
      type3={type3}
      visibility={visibility}
      update={update}
      projectId={projectId}
      companyId={companyId}
      onOpenGallery={onOpenGallery}
      systemPrefix={systemPrefix}
      systemNumber={systemNumber}
      equipmentType={equipmentType}
      utilityAbbrev={utilityAbbrev}
    />
  );
};

/**
 * Combined System BOS Section - appears when there are multiple systems
 */
interface CombinedSystemBOSSectionProps {
  projectId?: string;
  companyId?: string;
  systemCount: number;
  onOpenGallery?: (sectionLabel: string) => void;
}

const CombinedSystemBOSSection: React.FC<CombinedSystemBOSSectionProps> = ({
  projectId,
  companyId,
  systemCount,
  onOpenGallery,
}) => {
  return (
    <CollapsibleSectionSimple
      title="Combined System BOS"
      initiallyExpanded={true}
      isDirty={false}
      isRequiredComplete={false}
    >
      <View style={{ padding: 20 }}>
        <RNText style={{ color: '#FFFFFF', fontSize: 16, textAlign: 'center' }}>
          Combined BOS for {systemCount} systems
        </RNText>
        <RNText style={{ color: '#A0A0A0', fontSize: 14, textAlign: 'center', marginTop: 10 }}>
          This section will be populated shortly
        </RNText>
      </View>
    </CollapsibleSectionSimple>
  );
};

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

const BalanceOfSystem: React.FC = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const navigation = useNavigation();
  const project = useSelector((s: any) => s.project.currentProject);
  const profile = useSelector((s: any) => s.profile.profile);
  const { projectId, companyId } = useProjectContext();
  const projectUuid = projectId; // projectId is the same as projectUuid in this context

  // State for system details
  const [rawSys, setRawSys] = useState<any>(null);
  const [loadingSystems, setLoadingSystems] = useState(true);

  // State for utility requirements
  const [utilityRequirements, setUtilityRequirements] = useState<any>(null);

  // Fetch system details to detect which systems exist
  useEffect(() => {
    if (!projectUuid) return;
    let cancelled = false;

    (async () => {
      try {
        setLoadingSystems(true);
        const data = await fetchSystemDetails(projectUuid);
        if (cancelled) return;
        setRawSys(data ?? null);
      } catch (error) {
        console.error('[BOS] Error fetching system details:', error);
      } finally {
        if (!cancelled) setLoadingSystems(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectUuid]);

  // Fetch utility requirements
  useEffect(() => {
    const loadUtilityRequirements = async () => {
      const utility = project?.site?.utility;
      const state = project?.site?.state;
      const token = profile?.token;

      if (!utility || !state || !token) {
        console.log('[BOS] Missing utility, state, or token - skipping utility requirements fetch');
        return;
      }

      try {
        const response = await fetch(
          `https://api.skyfireapp.io/api/utility-requirements/${utility}/${state}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (data.success) {
          setUtilityRequirements(data.data);
        }
      } catch (error) {
        console.error('[BOS] Error fetching utility requirements:', error);
      }
    };

    loadUtilityRequirements();
  }, [project?.site?.utility, project?.site?.state, profile?.token]);

  // Detect which systems are active
  const activeSystems = useMemo(() => {
    return rawSys ? detectActiveSystems(rawSys) : [];
  }, [rawSys]);

  const handleOpenGallery = (sectionLabel: string) => {
    console.log(`Opening gallery for section: ${sectionLabel}`);
    // TODO: Navigate to gallery screen with section filter
  };

  // gradient midpoint sits right under the header
  const stopAt = headerHeight / SCREEN_HEIGHT;

  // Show loading screen while fetching system data
  if (loadingSystems) {
    return (
      <LinearGradient
        colors={[LIGHT, MID, DARK]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FD7332" />
          <RNText style={styles.loadingText}>
            Loading BOS Details...
          </RNText>
          <RNText style={styles.loadingSubtext}>
            Detecting active systems...
          </RNText>
        </View>
      </LinearGradient>
    );
  }

  // If no active systems, show message
  if (activeSystems.length === 0) {
    return (
      <LinearGradient
        colors={[LIGHT, MID, DARK]}
        locations={[0, stopAt, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.loadingContainer}>
          <RNText style={styles.loadingText}>
            No Systems Configured
          </RNText>
          <RNText style={styles.loadingSubtext}>
            Please configure systems in Equipment Details first
          </RNText>
        </View>
        <View
          style={styles.headerWrap}
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        >
          <LargeHeader
            title="BOS"
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
  }

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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight, paddingBottom: 80 },
        ]}
      >
        {/* Render BOS section for each active system */}
        {activeSystems.map((system) => (
          <BOSSystemSection
            key={system.prefix}
            systemPrefix={system.prefix}
            systemNumber={system.number}
            systemLabel={system.label}
            equipmentType={system.equipmentType}
            projectId={projectId}
            companyId={companyId}
            onOpenGallery={handleOpenGallery}
            utilityAbbrev={utilityRequirements?.abbrev}
          />
        ))}

        {/* Render Combined System BOS when there are multiple systems */}
        {activeSystems.length > 1 && (
          <CombinedSystemBOSSection
            projectId={projectId}
            companyId={companyId}
            systemCount={activeSystems.length}
            onOpenGallery={handleOpenGallery}
          />
        )}
      </ScrollView>

      {/* Header overlay */}
      <View
        style={styles.headerWrap}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <LargeHeader
          title="BOS"
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

export default BalanceOfSystem;

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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 18,
    marginTop: 20,
    fontWeight: "600",
  },
  loadingSubtext: {
    color: "#A0A0A0",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});
