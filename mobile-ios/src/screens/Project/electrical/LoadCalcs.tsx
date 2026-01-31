import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Text,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { DrawerActions, useNavigation, useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
import LargeHeader from "../../../components/Header/LargeHeader";
import { SCROLL_PADDING, commonScrollViewProps } from "../../../styles/commonStyles";
import { verticalScale } from "../../../utils/responsive";

// Gradient colors
const LIGHT = "#2E4161";
const MID = "#1D2A4F";
const DARK = "#0C1F3F";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const LoadCalcs: React.FC = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const navigation = useNavigation();
  const route = useRoute();
  const project = useSelector((s: any) => s.project.currentProject);
  
  // Get panel type from route params (MainPanelA, SubPanelB, etc.)
  const panelType = (route.params as any)?.panelType || "Main Panel A";
  
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
        <View style={styles.container}>
          <Text style={styles.tempText}>
            Load Calculations for {panelType}
          </Text>
          <Text style={styles.subText}>
            Components will be added here
          </Text>
        </View>
      </ScrollView>

      {/* Header overlay */}
      <View
        style={styles.headerWrap}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <LargeHeader
          title="Load Calcs"
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

export default LoadCalcs;

const styles = StyleSheet.create({
  gradient: { 
    flex: 1 
  },
  scrollView: { 
    flex: 1 
  },
  scrollContent: { 
    flexGrow: 1 
  },
  headerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  container: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  tempText: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
  },
  subText: {
    color: "#FFF",
    fontSize: 16,
    opacity: 0.7,
  },
});