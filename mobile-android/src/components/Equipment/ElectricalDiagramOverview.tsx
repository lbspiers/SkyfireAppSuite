import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { moderateScale } from "../../utils/responsive";
import ElectricalDiagram from "./ElectricalDiagram";

interface Connection {
  from: string;
  to: string;
  type: "ac_couple" | "sms_connection" | "combine" | "direct";
}

interface ElectricalDiagramOverviewProps {
  systemLandings: Record<string, string>;
  activeSystems: number[];
  connections: Connection[];
  systemData: any;
  onSave: () => void;
  configData?: any;
}

const ElectricalDiagramOverview: React.FC<ElectricalDiagramOverviewProps> = ({
  systemLandings,
  activeSystems,
  connections,
  systemData,
  onSave,
  configData,
}) => {
  const [showExportData, setShowExportData] = useState(false);

  return (
    <View style={styles.container}>
      {/* Configuration Complete Text */}
      <Text style={styles.configCompleteText}>Configuration Complete</Text>

      {/* Electrical Diagram Section */}
      <View style={styles.diagramContainer}>
        <Text style={styles.sectionTitle}>Electrical Diagram</Text>

        {/* Use the extracted ElectricalDiagram component */}
        <ElectricalDiagram
          systemLandings={systemLandings}
          activeSystems={activeSystems}
          connections={connections}
          systemData={systemData}
        />
      </View>

      {/* Export Data Toggle - COMMENTED OUT (Internal use only) */}
      {/* <TouchableOpacity
        onPress={() => setShowExportData(!showExportData)}
        style={styles.exportToggle}
      >
        <Text style={styles.exportToggleText}>
          {showExportData ? "Hide" : "View"} Export Data
        </Text>
        <Text style={styles.chevron}>{showExportData ? "▲" : "▼"}</Text>
      </TouchableOpacity> */}

      {/* Export Data JSON - COMMENTED OUT (Internal use only) */}
      {/* {showExportData && configData && (
        <View style={styles.exportDataContainer}>
          <ScrollView style={styles.exportDataScroll}>
            <Text style={styles.exportDataText}>
              {JSON.stringify(configData, null, 2)}
            </Text>
          </ScrollView>
        </View>
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: moderateScale(8),
  },
  configCompleteText: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#FD7332", // Orange text
    marginBottom: moderateScale(8),
    textAlign: "center",
  },
  diagramContainer: {
    marginBottom: moderateScale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: moderateScale(6),
  },
  exportToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(12),
    marginTop: moderateScale(16),
  },
  exportToggleText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#FD7332",
    marginRight: moderateScale(8),
  },
  chevron: {
    fontSize: moderateScale(16),
    color: "#FD7332",
    fontWeight: "700",
  },
  exportDataContainer: {
    backgroundColor: "rgba(12, 31, 63, 0.8)",
    borderRadius: moderateScale(8),
    borderWidth: moderateScale(2),
    borderColor: "#888888",
    marginTop: moderateScale(12),
    maxHeight: moderateScale(300),
  },
  exportDataScroll: {
    padding: moderateScale(16),
  },
  exportDataText: {
    fontSize: moderateScale(12),
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#FFFFFF",
  },
});

export default ElectricalDiagramOverview;
