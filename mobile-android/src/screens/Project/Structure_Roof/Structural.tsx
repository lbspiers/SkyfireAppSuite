// src/screens/Project/Structure_Roof/Structural.tsx

import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Dimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { useSelector } from "react-redux";

import LargeHeader from "../../../components/Header/LargeHeader";
// import your sections here as you build them:
// import Sys1BOSType1 from "./sections/sys1_BOS_Type1";

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
      .padStart(2, "0"),
    g = Math.round((ga + gb) / 2)
      .toString(16)
      .padStart(2, "0"),
    b2 = Math.round((ba + bb) / 2)
      .toString(16)
      .padStart(2, "0");

  return `#${r}${g}${b2}`;
}

const LIGHT = "#2E4161";
const DARK = "#0C1F3F";
const MID = averageHexColor(LIGHT, DARK);
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const Structural: React.FC = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const navigation = useNavigation();
  const project = useSelector((s: any) => s.project.currentProject);

  // gradient stop at bottom of header
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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight, paddingBottom: 80 },
        ]}
      >
        {/* ───── Structure ─────────────────────────────────── */}
      </ScrollView>

      {/* Header overlay */}
      <View
        style={styles.headerWrap}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <LargeHeader
          title="Structural"
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

export default Structural;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    // add any global padding here
  },
  headerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
