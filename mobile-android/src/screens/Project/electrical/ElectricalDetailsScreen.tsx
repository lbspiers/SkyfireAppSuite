// MIGRATED TO RESPONSIVE SYSTEM - 2025-10-15
import React, { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useResponsive } from "../../../utils/responsive-v2";

// hook (already created)
import { useElectricalDetails } from "./hooks/useElectricalDetails";

// existing UI components (unchanged)
import ServiceEntranceComponent from "./components/ServiceEntranceComponent";
import MainPanelA from "./sections/MainPanelA";
import SubPanelBSection from "./sections/SubPanelBSection";
import PointOfInterconnectionSection from "./sections/PointOfInterconnection";

// If you use these elsewhere, keep importing them normally:
// import InterconnectionComponent from "./components/InterconnectionComponent";
// import MainCircuitBreakersSection from "./sections/MainCircuitBreakersSection";

type Props = { projectUuid: string };

export default function ElectricalDetailsScreen({ projectUuid }: Props) {
  const r = useResponsive();

  const {
    // values
    serviceEntranceType,
    mcbCount,
    mpuSelection,
    mpaType,
    mpaBus,
    mpaMain,
    mpaFeeder,
    mpaDerated,
    spbType,
    spbBus,
    spbMain,
    spbFeeder,
    spbDerated,
    spbUpBreaker,
    spbTieInLocation,
    spbConductorSizing,
    poiType,
    poiBreaker,
    poiDisconnect,
    poiLocation,
    // setters that also persist
    update,
  } = useElectricalDetails(projectUuid);

  // Components expect some image plumbing — keep it local & noop.
  const [images, setImages] = useState<Record<string, any[]>>({});
  const handleSetImages = (type: string, selectedImages: any[]) => {
    setImages((prev) => ({ ...prev, [type]: selectedImages }));
  };

  // Show Sub Panel B only if user reveals it (or when they start filling it).
  const [showSubPanelB, setShowSubPanelB] = useState<boolean>(false);
  const subPanelBVisible = useMemo(
    () => showSubPanelB || !!spbType || !!spbBus || !!spbMain || !!spbFeeder,
    [showSubPanelB, spbType, spbBus, spbMain, spbFeeder]
  );

  return (
    <ScrollView contentContainerStyle={{ padding: r.spacing.md }}>
      {/* Service Entrance / MPU */}
      <ServiceEntranceComponent
        serviceSelection={mpuSelection || ""} // "Yes" | "No" | "Help Me Decide" | ""
        selectedServiceEntrance={serviceEntranceType || undefined} // string | undefined
        breakerQuantity={mcbCount ?? undefined} // number | undefined
        images={images}
        handleSetImages={handleSetImages}
        setQuantity={(val) => update.mcbCount(val)}
        handleServiceSelection={(val) => update.mpuSelection(val as any)}
        handleServiceEntranceChange={(val) => update.serviceEntranceType(val)}
      />

      {/* Main Panel A */}
      <MainPanelA
        type={mpaType}
        onTypeChange={(v) => update.mpaType(v)}
        busAmps={mpaBus}
        onBusAmpsChange={(v) => update.mpaBus(v)}
        mainBreakerAmps={mpaMain}
        onMainBreakerChange={(v) => update.mpaMain(v)}
        feederLocation={mpaFeeder}
        onFeederLocationChange={(v) => update.mpaFeeder(v)}
        subPanelBVisible={subPanelBVisible}
        onSubPanelBPress={() => setShowSubPanelB(true)}
        // If you later add the derate toggle to this component’s UI, wire it:
        // onDerateChange={(val) => update.mpaDerated(val)}
      />

      {/* Sub Panel B (optional) */}
      {subPanelBVisible && (
        <SubPanelBSection
          type={spbType}
          onTypeChange={(v) => update.spbType(v)}
          busAmps={spbBus}
          onBusAmpsChange={(v) => update.spbBus(v)}
          mainBreakerAmps={spbMain}
          onMainBreakerChange={(v) => update.spbMain(v)}
          feederLocation={spbFeeder}
          onFeederLocationChange={(v) => update.spbFeeder(v)}
          tieInBreakerRating={spbUpBreaker}
          onTieInBreakerRatingChange={(v) => update.spbUpBreaker(v)}
          tieInLocation={spbTieInLocation}
          onTieInLocationChange={(v) => update.spbTieInLocation(v)}
          conductorSizing={spbConductorSizing}
          onConductorSizingChange={(v) => update.spbConductorSizing(v)}
          // If/when you surface "Derate" here:
          // onDerateChange={(val) => update.spbDerated(val)}
          onClose={() => setShowSubPanelB(false)}
        />
      )}

      {/* Point of Interconnection */}
      <PointOfInterconnectionSection
        poiType={poiType}
        onPoiTypeChange={(v) => update.poiType(v)}
        breakerRating={poiBreaker}
        onBreakerRatingChange={(v) => update.poiBreaker(v)}
        disconnectRating={poiDisconnect}
        onDisconnectRatingChange={(v) => update.poiDisconnect(v)}
        poiLocation={poiLocation}
        onPoiLocationChange={(v) => update.poiLocation(v)}
      />
    </ScrollView>
  );
}
