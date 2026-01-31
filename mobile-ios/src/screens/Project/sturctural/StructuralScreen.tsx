// MIGRATED TO RESPONSIVE SYSTEM - 2025-10-15
import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView, StyleSheet, Dimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useProjectContext } from "../../../hooks/useProjectContext";
import { useResponsive } from "../../../utils/responsive-v2";

import LargeHeader from "../../../components/Header/LargeHeader";
import RoofingSection from "./sections/RoofingA";
import MountingHardwareA from "./sections/MountingHardwareA";
import RoofingSectionB from "./sections/RoofingB";
import MountingHardwareB from "./sections/MountingHardwareB";
import MountingPlaneSection from "./sections/MountingPlane1";
import { useStructuralDetails } from "./hooks/useStructuralDetails";

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

export default function Structural() {
  const r = useResponsive();
  const [headerHeight, setHeaderHeight] = useState(0);
  const navigation = useNavigation();
  const project = useSelector((s: any) => s.project.currentProject);
  const projectUuid: string | undefined =
    project?.uuid || project?.details?.project_uuid;
  const { projectId, companyId } = useProjectContext();

  const handleOpenGallery = (sectionLabel: string) => {
    console.log(`Opening gallery for section: ${sectionLabel}`);
    // TODO: Navigate to gallery screen with section filter
  };

  const { loading, mha, mhb, roofA, roofB, planes, update } =
    useStructuralDetails(projectUuid);

  const [showRoofB, setShowRoofB] = useState(false);
  const [roofBIsDirty, setRoofBIsDirty] = useState(false);

  // visible planes (UI only; data for all 10 lives in hook)
  const [visiblePlanes, setVisiblePlanes] = useState<number>(1);

  // Optional: hydrate visible plane count based on loaded data
  useEffect(() => {
    const hasAny = (p: any) =>
      !!(
        p?.mode ||
        p?.stories ||
        p?.pitch ||
        p?.azimuth ||
        p?.qty1 ||
        p?.qty2 ||
        p?.qty3 ||
        p?.qty4 ||
        p?.qty5 ||
        p?.qty6 ||
        p?.qty7 ||
        p?.qty8
      );
    let maxUsed = 1;
    for (let i = 0; i < 10; i++) {
      if (hasAny(planes[i])) maxUsed = i + 1;
    }
    setVisiblePlanes(maxUsed);
  }, [planes]);

  // Auto-show Roof Type B section if it has saved data
  useEffect(() => {
    const hasRoofBData = !!(
      roofB.material ||
      roofB.framingSize ||
      roofB.areaSqFt ||
      roofB.framingSpacing ||
      roofB.framingType ||
      mhb.railMake ||
      mhb.railModel ||
      mhb.attachMake ||
      mhb.attachModel
    );

    if (hasRoofBData) {
      setShowRoofB(true);
      setRoofBIsDirty(true);
    }
  }, [roofB, mhb]);

  const stopAt = headerHeight / SCREEN_HEIGHT;

  const addNextPlane = (n: number) => {
    if (n < 10) setVisiblePlanes((v) => Math.max(v, n + 1));
  };

  const handleClearPlane = async (n: number) => {
    await update.clearPlane(n as any); // clears DB + local
    if (n === 1) {
      // MP1 stays on screen
      return;
    }
    // Only allow removing the last visible plane (UI enforces it):
    setVisiblePlanes((v) => (n === v ? Math.max(1, v - 1) : v));
  };

  // simple error placeholders (wire your own rules if needed)
  const roofAErrors: any = {};
  const roofBErrors: any = {};

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
          { paddingTop: headerHeight, paddingBottom: r.verticalScale(80) },
        ]}
      >
        {/* Roofing (A) */}
        <RoofingSection
          values={{
            roofingMaterial: roofA.material,
            framingSize: roofA.framingSize,
            roofArea: roofA.areaSqFt,
            framingSpacing: roofA.framingSpacing,
            framingType: roofA.framingType,
          }}
          onChange={(field, value) => {
            if (field === "roofingMaterial") update.roofA.material(value);
            else if (field === "framingSize") update.roofA.framingSize(value);
            else if (field === "roofArea") update.roofA.areaSqFt(value);
            else if (field === "framingSpacing")
              update.roofA.framingSpacing(value);
            else if (field === "framingType") update.roofA.framingType(value);
          }}
          errors={roofAErrors}
          projectId={projectId}
          companyId={companyId}
          onOpenGallery={handleOpenGallery}
        />

        {/* Mounting Hardware (A) */}
        <MountingHardwareA
          values={{
            railMake: mha.railMake,
            railModel: mha.railModel,
            attachMake: mha.attachMake,
            attachModel: mha.attachModel,
          }}
          onChange={(field, value) => {
            if (field === "railMake") update.mha.railMake(value);
            else if (field === "railModel") update.mha.railModel(value);
            else if (field === "attachMake") update.mha.attachMake(value);
            else if (field === "attachModel") update.mha.attachModel(value);
          }}
          errors={{}}
          onNext={() => setShowRoofB(true)}
          hideNext={showRoofB}
          projectId={projectId}
          companyId={companyId}
          onOpenGallery={handleOpenGallery}
        />

        {/* Roofing (B) */}
        {showRoofB && (
          <>
            <RoofingSectionB
              values={{
                roofingMaterial: roofB.material,
                framingSize: roofB.framingSize,
                roofArea: roofB.areaSqFt,
                framingSpacing: roofB.framingSpacing,
                framingType: roofB.framingType,
              }}
              onChange={(field, value) => {
                if (field === "roofingMaterial") update.roofB.material(value);
                else if (field === "framingSize") update.roofB.framingSize(value);
                else if (field === "roofArea") update.roofB.areaSqFt(value);
                else if (field === "framingSpacing")
                  update.roofB.framingSpacing(value);
                else if (field === "framingType") update.roofB.framingType(value);
              }}
              errors={roofBErrors}
              onCancel={() => {
                setShowRoofB(false);
                setRoofBIsDirty(false); // Explicitly set to false to hide RadialButtons immediately
                // Reset all mounting plane roof_type values to "A" when RoofingB is cleared
                for (let i = 1; i <= 10; i++) {
                  update.plane(i as any, "roof_type", "A");
                }
                // Clear Mounting Hardware B data when Roofing B is cleared
                update.mhb.railMake("");
                update.mhb.railModel("");
                update.mhb.attachMake("");
                update.mhb.attachModel("");
              }}
              onDirtyChange={setRoofBIsDirty}
              projectId={projectId}
              companyId={companyId}
              onOpenGallery={handleOpenGallery}
            />

            {/* Mounting Hardware (B) */}
            <MountingHardwareB
              values={{
                railMake: mhb.railMake,
                railModel: mhb.railModel,
                attachMake: mhb.attachMake,
                attachModel: mhb.attachModel,
              }}
              onChange={(field, value) => {
                if (field === "railMake") update.mhb.railMake(value);
                else if (field === "railModel") update.mhb.railModel(value);
                else if (field === "attachMake") update.mhb.attachMake(value);
                else if (field === "attachModel") update.mhb.attachModel(value);
              }}
              errors={{}}
              projectId={projectId}
              companyId={companyId}
              onOpenGallery={handleOpenGallery}
            />
          </>
        )}

        {/* Mounting Planes 1..visiblePlanes */}
        {planes.slice(0, visiblePlanes).map((p, i) => {
          const idx = i + 1;
          const isLast = idx === visiblePlanes;
          const showNext = isLast && idx < 10;
          return (
            <MountingPlaneSection
              key={`plane-${idx}`}
              planeIndex={idx}
              isFirst={idx === 1}
              isLastVisible={isLast}
              showNext={showNext}
              onNext={() => addNextPlane(idx)}
              onClear={() => handleClearPlane(idx)}
              values={{
                mode: p.mode || "",
                stories: p.stories || "",
                pitch: p.pitch || "",
                azimuth: p.azimuth || "",
                qty1: p.qty1 || "",
                qty2: p.qty2 || "",
                qty3: p.qty3 || "",
                qty4: p.qty4 || "",
                qty5: p.qty5 || "",
                qty6: p.qty6 || "",
                qty7: p.qty7 || "",
                qty8: p.qty8 || "",
                roof_type: p.roof_type || "A",
              }}
              onChange={(field, value) =>
                update.plane(idx as any, field as any, value)
              }
              errors={{}}
              hasRoofTypeB={roofBIsDirty}
              projectId={projectId}
              companyId={companyId}
              onOpenGallery={handleOpenGallery}
            />
          );
        })}
      </ScrollView>

      {/* Header overlay */}
      <View
        style={styles.headerWrap}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <LargeHeader
          title="Structural"
          name={
            project?.details?.customer_last_name
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
