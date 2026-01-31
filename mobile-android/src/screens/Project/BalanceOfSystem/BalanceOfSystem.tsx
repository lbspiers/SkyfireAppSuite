import React, { useState, useCallback, useMemo } from "react";
import { View, ScrollView, StyleSheet, Text } from "react-native";
import { useNavigation, useRoute, RouteProp, ParamListBase, DrawerActions } from "@react-navigation/native";
import { useSelector } from "react-redux";
import LinearGradient from "react-native-linear-gradient";
import { BLUE_MD_TB } from "../../../styles/gradient";
import { verticalScale, moderateScale } from "../../../utils/responsive";
import LargeHeader from "../../../components/Header/LargeHeader";
import CollapsibleSection from "../../../components/UI/CollapsibleSection";

// Route params interface
interface RouteParams extends ParamListBase {
  BalanceOfSystem: {
    projectId?: string;
    systemDetails?: any;
    activeSystems?: number[];
  };
}

const BalanceOfSystem: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'BalanceOfSystem'>>();

  const { projectId, systemDetails, activeSystems = [] } = route.params || {};

  // Get project details for header
  const project = useSelector((s: any) => s.project.currentProject);

  const fullName = useMemo(() => {
    return project?.details
      ? `${project.details.customer_last_name}, ${project.details.customer_first_name}`
      : undefined;
  }, [project?.details]);

  const addressLines = useMemo(() => {
    if (!project?.site) return undefined;
    return [
      project.site.address,
      [project.site.city, project.site.state, project.site.zip_code]
        .filter(Boolean)
        .join(", "),
    ];
  }, [project?.site]);

  const [headerHeight, setHeaderHeight] = useState(0);

  const handleHeaderLayout = useCallback((event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height !== headerHeight) {
      setHeaderHeight(height);
    }
  }, [headerHeight]);

  // Determine which systems to show based on activeSystems
  // If activeSystems is empty or has only 1 system, show all configured systems
  const systemsToShow = activeSystems.length > 0 ? activeSystems : [1];
  const showCombineBOS = systemsToShow.length > 1;

  return (
    <LinearGradient
      {...BLUE_MD_TB}
      style={styles.gradient}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight, paddingBottom: verticalScale(100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* System Sections - Dynamic based on active systems */}
        {systemsToShow.map((systemNumber) => (
          <CollapsibleSection
            key={`system-${systemNumber}`}
            title={`System ${systemNumber}`}
            initiallyExpanded={false}
            isDirty={false}
            isRequiredComplete={false}
          >
            <View style={styles.sectionContent}>
              <Text style={styles.placeholderText}>
                System {systemNumber} BOS content will go here
              </Text>
            </View>
          </CollapsibleSection>
        ))}

        {/* Combine BOS Section - Only show if 2+ systems */}
        {showCombineBOS && (
          <CollapsibleSection
            title="Combine BOS"
            initiallyExpanded={false}
            isDirty={false}
            isRequiredComplete={false}
          >
            <View style={styles.sectionContent}>
              <Text style={styles.placeholderText}>
                Combine BOS content will go here
              </Text>
            </View>
          </CollapsibleSection>
        )}
      </ScrollView>

      {/* Large Header */}
      <View style={styles.headerWrap} onLayout={handleHeaderLayout}>
        <LargeHeader
          title="Balance of System"
          name={fullName}
          addressLines={addressLines}
          projectId={project?.details?.installer_project_id}
          onDrawerPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: moderateScale(20),
  },
  headerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  sectionContent: {
    paddingHorizontal: 0,
    width: "100%",
    paddingVertical: verticalScale(20),
  },
  placeholderText: {
    color: "#FFFFFF",
    fontSize: moderateScale(16),
    textAlign: "center",
    fontStyle: "italic",
    opacity: 0.7,
  },
});

export default BalanceOfSystem;
