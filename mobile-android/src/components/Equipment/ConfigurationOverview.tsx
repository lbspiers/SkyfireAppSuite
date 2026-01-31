import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { moderateScale, verticalScale } from "../../utils/responsive";
import { ORANGE_TB } from "../../styles/gradient";
import Button from "../Button";

interface Connection {
  from: string;
  to: string;
  type: "ac_couple" | "sms_connection" | "combine" | "direct";
}

interface ConfigurationOverviewProps {
  systemLandings: Record<string, string>;
  activeSystems: number[];
  connections: Connection[];
  onSave: () => void;
  onEdit?: () => void; // Allow users to go back and edit configuration
  configData?: any;
}

const ConfigurationOverview: React.FC<ConfigurationOverviewProps> = ({
  systemLandings,
  activeSystems,
  connections,
  onSave,
  onEdit,
  configData,
}) => {
  const [showExportData, setShowExportData] = useState(false);
  const pencilIcon = require("../../assets/Images/icons/pencil_icon_white.png");

  const getConnectionEmoji = (type: string) => {
    switch (type) {
      case "ac_couple":
        return "⚡";
      case "sms_connection":
        return "🔋";
      case "combine":
        return "🔗";
      default:
        return "→";
    }
  };

  const getConnectionColor = (type: string) => {
    switch (type) {
      case "ac_couple":
      case "sms_connection":
        return "#10B981"; // Green for special connections
      default:
        return "#3B82F6"; // Blue for standard
    }
  };

  // Group connections by destination
  const groupedConnections: Record<string, Connection[]> = {};
  connections.forEach((conn) => {
    if (!groupedConnections[conn.to]) {
      groupedConnections[conn.to] = [];
    }
    groupedConnections[conn.to].push(conn);
  });

  // Extract special connections
  const acCouplingConnections = connections.filter(
    (c) => c.type === "ac_couple"
  );
  const smsConnections = connections.filter((c) => c.type === "sms_connection");

  return (
    <View style={styles.container}>
      {/* System Flow Diagram */}
      <View style={styles.flowSection}>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>Configuration Complete</Text>
          {onEdit && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={onEdit}
              activeOpacity={0.7}
            >
              <Image source={pencilIcon} style={styles.pencilIcon} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.flowScrollContent}
        >
          {activeSystems.map((systemNum, index) => {
            const landing = systemLandings[`system${systemNum}`];
            const connection = connections.find(
              (c) => c.from === `System ${systemNum}`
            );

            return (
              <View key={systemNum} style={styles.flowItem}>
                {/* System Badge */}
                <View style={styles.systemBadge}>
                  <Text style={styles.systemBadgeText}>System {systemNum}</Text>
                </View>

                {/* Arrow */}
                {landing && (
                  <View style={styles.arrowContainer}>
                    <Text
                      style={[
                        styles.arrowEmoji,
                        {
                          color: getConnectionColor(
                            connection?.type || "direct"
                          ),
                        },
                      ]}
                    >
                      {getConnectionEmoji(connection?.type || "direct")}
                    </Text>
                    <View
                      style={[
                        styles.arrowLine,
                        {
                          backgroundColor: getConnectionColor(
                            connection?.type || "direct"
                          ),
                        },
                      ]}
                    />
                  </View>
                )}

                {/* Destination Badge */}
                {landing && (
                  <View
                    style={[
                      styles.destinationBadge,
                      {
                        borderColor: getConnectionColor(
                          connection?.type || "direct"
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.destinationBadgeText}>{landing}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Special Connection Notes */}
      {(acCouplingConnections.length > 0 || smsConnections.length > 0) && (
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Special Connections</Text>

          {acCouplingConnections.map((conn, index) => (
            <View key={`ac-${index}`} style={styles.noteItem}>
              <Text style={styles.noteEmoji}>⚡</Text>
              <Text style={styles.noteText}>
                {conn.from} AC coupled to {conn.to}
              </Text>
            </View>
          ))}

          {smsConnections.map((conn, index) => (
            <View key={`sms-${index}`} style={styles.noteItem}>
              <Text style={styles.noteEmoji}>🔋</Text>
              <Text style={styles.noteText}>
                {conn.from} connected to {conn.to} SMS
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Save Button */}
      <Button
        title="Save Configuration"
        selected={true}
        onPress={onSave}
        width="100%"
        height={moderateScale(50)}
        rounded={moderateScale(8)}
        textStyle={styles.saveButtonText}
      />

      {/* Export Data Toggle */}
      <TouchableOpacity
        onPress={() => setShowExportData(!showExportData)}
        style={styles.exportToggle}
      >
        <Text style={styles.exportToggleText}>
          {showExportData ? "Hide" : "View"} Export Data
        </Text>
        <Text style={styles.chevron}>
          {showExportData ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>

      {/* Export Data JSON */}
      {showExportData && configData && (
        <View style={styles.exportDataContainer}>
          <ScrollView style={styles.exportDataScroll}>
            <Text style={styles.exportDataText}>
              {JSON.stringify(configData, null, 2)}
            </Text>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: moderateScale(16),
  },
  flowSection: {
    marginBottom: moderateScale(20),
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(12),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  editButton: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: "rgba(253, 115, 50, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FD7332",
    marginLeft: moderateScale(10),
  },
  pencilIcon: {
    width: moderateScale(12),
    height: moderateScale(12),
    tintColor: "#FD7332",
    resizeMode: "contain",
  },
  flowScrollContent: {
    paddingVertical: moderateScale(8),
  },
  flowItem: {
    alignItems: "center",
    marginRight: moderateScale(16),
  },
  systemBadge: {
    backgroundColor: "#FD7332",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(6),
  },
  systemBadgeText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  arrowContainer: {
    alignItems: "center",
    marginVertical: moderateScale(8),
  },
  arrowEmoji: {
    fontSize: moderateScale(20),
  },
  arrowLine: {
    width: moderateScale(2),
    height: moderateScale(20),
    marginTop: moderateScale(4),
  },
  destinationBadge: {
    backgroundColor: "rgba(12, 31, 63, 0.8)",
    borderWidth: moderateScale(2),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(6),
  },
  destinationBadgeText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  notesSection: {
    marginBottom: moderateScale(20),
  },
  noteItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: moderateScale(6),
    marginBottom: moderateScale(8),
  },
  noteEmoji: {
    fontSize: moderateScale(18),
    marginRight: moderateScale(10),
  },
  noteText: {
    flex: 1,
    fontSize: moderateScale(14),
    fontWeight: "500",
    color: "#10B981",
  },
  saveButtonText: {
    fontSize: moderateScale(18),
    fontWeight: "700",
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

export default ConfigurationOverview;
